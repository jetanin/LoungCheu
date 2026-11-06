import express, { type RequestHandler } from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { PrismaClient } from '@prisma/client';
import type { AppConfig } from './config/env.js';
import { ApiError, errorHandler, invalidInput } from './shared/errors.js';
import { identity, requireAuth } from './middleware/auth.js';
import { hashPassword, verifyPassword } from './modules/accounts/password.js';
import { createEventRouter } from './modules/events/router.js';
import { createEventService } from './modules/events/service.js';
import { createRegistrationRouter } from './modules/registrations/router.js';
import { createRegistrationService } from './modules/registrations/service.js';

export const SESSION_MS = 2 * 60 * 60 * 1000;
export const COOKIE_NAME = 'loungcheu.sid';

function objectInput(body: unknown, keys: string[]): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !keys.includes(k))) throw invalidInput();
  return body as Record<string, unknown>;
}
function jsonBody(limit: string): RequestHandler {
  const parse = express.json({ limit, strict: false });
  return (req, res, next) => {
    const hasBody = Number(req.get('Content-Length') ?? '0') > 0 || !!req.get('Transfer-Encoding');
    if (hasBody && !req.is('application/json')) throw invalidInput();
    parse(req, res, next);
  };
}
export async function createApp(config: AppConfig, db: PrismaClient, now: () => number = Date.now) {
  const app = express();
  app.disable('x-powered-by');
  // One trusted reverse proxy (Cloud Run). Development does not trust forwarded headers.
  if (config.production) app.set('trust proxy', 1);
  const pool = new Pool({ connectionString: config.databaseUrl });
  pool.on('error', () => console.error('Session database connection error'));
  const Store = connectPgSimple(session);
  const store = new Store({ pool, tableName: 'sessions', createTableIfMissing: false, disableTouch: true,
    pruneSessionInterval: 15 * 60, errorLog: () => console.error('Session database operation failed') });
  const cookieOptions = { httpOnly: true, sameSite: 'lax' as const, secure: config.cookieSecure, path: '/' };
  app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.use(session({ name: COOKIE_NAME, secret: config.sessionSecret, store,
    resave: false, saveUninitialized: false, rolling: false,
    cookie: { ...cookieOptions, maxAge: SESSION_MS } }));

  const csrf: RequestHandler = (req, _res, next) => {
    const token = req.get('X-CSRF-Token') ?? '';
    const expected = req.session.csrfToken ?? '';
    const tokenBytes = Buffer.from(token), expectedBytes = Buffer.from(expected);
    if ((req.get('Origin') && req.get('Origin') !== config.appOrigin) || !expected || tokenBytes.length !== expectedBytes.length
      || !timingSafeEqual(tokenBytes, expectedBytes)) throw new ApiError(403, 'CSRF_FAILED', 'กรุณาลองใหม่');
    next();
  };
  const json = jsonBody('16kb');
  const auth = requireAuth(db, now);
  // A dummy hash keeps unknown-account verification on the same scrypt path.
  const dummyHash = await hashPassword(randomBytes(32).toString('hex'));

  app.get('/api/health', async (_req, res) => { await db.$queryRaw`SELECT 1`; res.json({ data: { status: 'ok', version: config.version } }); });
  app.get('/api/auth/csrf', (req, res) => {
    req.session.csrfToken ??= randomBytes(32).toString('hex');
    res.json({ data: { csrf_token: req.session.csrfToken } });
  });
  app.post('/api/auth/login', csrf, json, async (req, res) => {
    const body = objectInput(req.body, ['username', 'password']);
    const fields: Record<string, string[]> = {};
    if (typeof body.username !== 'string' || !body.username.trim()) fields.username = ['กรุณากรอกชื่อผู้ใช้'];
    if (typeof body.password !== 'string' || !body.password.length) fields.password = ['กรุณากรอกรหัสผ่าน'];
    if (Object.keys(fields).length) throw invalidInput(fields);
    const username = (body.username as string).trim();
    // PostgreSQL usernames cannot contain NUL. Treat it like every unknown
    // account while retaining the dummy password verification below.
    const user = username.includes('\u0000') ? null : await db.user.findUnique({ where: { username } });
    const valid = await verifyPassword(body.password as string, user?.passwordHash ?? dummyHash);
    if (!user || !user.isActive || !valid) throw new ApiError(401, 'INVALID_CREDENTIALS', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    await new Promise<void>((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
    req.session.userId = user.id;
    req.session.expiresAt = now() + SESSION_MS;
    req.session.csrfToken = randomBytes(32).toString('hex');
    await new Promise<void>((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()));
    res.json({ data: identity(user) });
  });
  app.get('/api/auth/me', auth, (_req, res) => res.json({ data: identity(res.locals.identity) }));
  app.post('/api/auth/logout', auth, csrf, json, async (req, res) => {
    if (req.body !== undefined) objectInput(req.body, []);
    await new Promise<void>((resolve, reject) => req.session.destroy(error => error ? reject(error) : resolve()));
    res.clearCookie(COOKIE_NAME, cookieOptions).status(204).end();
  });
  // Max-length BR-01 strings need up to ~28 KiB when JSON uses surrogate
  // escapes rather than literal UTF-8. Keep the Auth parser's existing limit.
  app.use('/api', createEventRouter({ authenticate: auth, verifyCsrf: csrf, json: jsonBody('32kb'), service: createEventService(db, now) }));
  app.use('/api', createRegistrationRouter({ authenticate: auth, verifyCsrf: csrf,
    register: createRegistrationService(db, () => new Date(now())) }));
  app.use('/api', (_req, _res) => { throw new ApiError(404, 'ROUTE_NOT_FOUND', 'ไม่พบเส้นทาง'); });
  if (config.production) {
    const clientBuild = fileURLToPath(new URL('../../client/dist/', import.meta.url));
    app.use(express.static(clientBuild));
    app.get('/{*path}', (_req, res) => res.sendFile('index.html', { root: clientBuild }));
  }
  app.use(errorHandler);
  return { app, store, close: async () => { await store.close(); await pool.end(); } };
}
