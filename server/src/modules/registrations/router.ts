import { Router, json, type RequestHandler } from 'express';
import { invalidInput } from '../../shared/errors.js';
import { requireRole } from '../../middleware/auth.js';
import type { RegistrationCreated } from './service.js';

export interface RegistrationDependencies {
  // Staging requireAuth verifies the server-side session and the current active user.
  authenticate: RequestHandler;
  // #1 must check the session-bound token AND APP_ORIGIN, after authentication/role.
  verifyCsrf: RequestHandler;
  register: (eventId: string, participantId: string) => Promise<RegistrationCreated>;
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createRegistrationRouter(deps: RegistrationDependencies) {
  const router = Router();
  router.post('/events/:id/registrations', deps.authenticate, requireRole('PARTICIPANT'), deps.verifyCsrf,
    json({ strict: false, limit: '1kb' }), async (req, res) => {
      const hasBody = req.headers['transfer-encoding'] !== undefined || Number(req.headers['content-length'] ?? 0) > 0;
      if (!uuid.test(String(req.params.id)) ||
        (hasBody && (!req.is('application/json') || req.body === undefined)) ||
        (req.body !== undefined && (req.body === null || typeof req.body !== 'object' ||
          Array.isArray(req.body) || Object.keys(req.body).length !== 0))) {
        throw invalidInput();
      }
      const identity = res.locals.identity;
      const record = await deps.register(String(req.params.id).toLowerCase(), identity.id);
      res.status(201).json({ data: record });
    });
  return router;
}
