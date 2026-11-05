import { Router, json, type RequestHandler } from 'express';
import { ApiError, invalidInput } from '../../shared/errors.js';
import type { RegistrationCreated } from './service.js';

export interface RegistrationIdentity {
  id: string;
  role: 'PARTICIPANT' | 'ORGANIZER';
  is_active: boolean;
}

export interface RegistrationDependencies {
  // #1 must resolve the current active user from a verified server-side session.
  // Populate res.locals.identity with RegistrationIdentity; never from request body/headers.
  authenticate: RequestHandler;
  // #1 must check the session-bound token AND APP_ORIGIN, after authentication/role.
  verifyCsrf: RequestHandler;
  register: (eventId: string, participantId: string) => Promise<RegistrationCreated>;
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createRegistrationRouter(deps: RegistrationDependencies) {
  const router = Router();
  const participantOnly: RequestHandler = (_req, res, next) => {
    const identity: RegistrationIdentity | undefined = res.locals.identity;
    if (!identity?.is_active || !uuid.test(identity.id)) {
      return next(new ApiError(401, 'AUTH_REQUIRED', 'กรุณาเข้าสู่ระบบ'));
    }
    if (identity.role !== 'PARTICIPANT') return next(new ApiError(403, 'ROLE_FORBIDDEN', 'เฉพาะผู้เข้าร่วมเท่านั้น'));
    next();
  };
  router.post('/events/:id/registrations', deps.authenticate, participantOnly, deps.verifyCsrf,
    json({ strict: false, limit: '1kb' }), async (req, res) => {
      const hasBody = req.headers['transfer-encoding'] !== undefined || Number(req.headers['content-length'] ?? 0) > 0;
      if (!uuid.test(String(req.params.id)) ||
        (hasBody && (!req.is('application/json') || req.body === undefined)) ||
        (req.body !== undefined && (req.body === null || typeof req.body !== 'object' ||
          Array.isArray(req.body) || Object.keys(req.body).length !== 0))) {
        throw invalidInput();
      }
      const identity = res.locals.identity as RegistrationIdentity;
      const record = await deps.register(String(req.params.id).toLowerCase(), identity.id);
      res.status(201).json({ data: record });
    });
  return router;
}
