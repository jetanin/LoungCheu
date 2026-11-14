import { readDatabaseUrl } from './database-url.js';

export interface AppConfig {
  databaseUrl: string; sessionSecret: string; appOrigin: string;
  port: number; production: boolean; cookieSecure: boolean; version: string;
}

export function readConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const databaseUrl = readDatabaseUrl(env.DATABASE_URL);
  const sessionSecret = env.SESSION_SECRET ?? '';
  const appOrigin = env.APP_ORIGIN ?? '';
  const production = env.NODE_ENV === 'production';
  const port = Number(env.PORT ?? '3000');
  if (!['development', 'test', 'production'].includes(env.NODE_ENV ?? 'development')) throw new Error('Invalid NODE_ENV');
  if (sessionSecret.length < 32 || sessionSecret.includes('REPLACE')) throw new Error('SESSION_SECRET must contain at least 32 private characters');
  let origin: URL;
  try { origin = new URL(appOrigin); } catch { throw new Error('APP_ORIGIN must be an HTTP(S) origin'); }
  if (!['http:', 'https:'].includes(origin.protocol) || origin.origin !== appOrigin) throw new Error('APP_ORIGIN must be an HTTP(S) origin without a path');
  if (!['true', 'false'].includes(env.SESSION_COOKIE_SECURE ?? 'false')) throw new Error('SESSION_COOKIE_SECURE must be true or false');
  const cookieSecure = env.SESSION_COOKIE_SECURE === 'true';
  if (production && (!cookieSecure || origin.protocol !== 'https:')) throw new Error('Production requires HTTPS and secure cookies');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  return { databaseUrl, sessionSecret, appOrigin, port, production, cookieSecure, version: env.APP_VERSION ?? 'local' };
}
