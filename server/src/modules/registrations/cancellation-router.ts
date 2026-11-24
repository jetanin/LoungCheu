import { Router, json, type RequestHandler } from 'express';
import { requireRole } from '../../middleware/auth.js';
import { invalidInput } from '../../shared/errors.js';
import { emptyInput, eventId } from '../events/input.js';
import type { createCancellationService } from './cancellation.js';

export function createCancellationRouter(authenticate: RequestHandler, verifyCsrf: RequestHandler,
  cancel: ReturnType<typeof createCancellationService>) {
  const router = Router();
  // Content type is checked after auth/role/CSRF, matching the existing router.
  const parse = json({ strict: false, limit: '1kb' });
  router.post('/my/registrations/:id/cancel', authenticate, requireRole('PARTICIPANT'), verifyCsrf,
    (req, res, next) => {
      const hasBody = !!req.get('Transfer-Encoding') || Number(req.get('Content-Length') ?? 0) > 0;
      if (hasBody && !req.is('application/json')) throw invalidInput();
      parse(req, res, next);
    }, async (req, res) => {
      const id = eventId(req.params.id);
      emptyInput(req.body);
      res.json({ data: await cancel(id, res.locals.identity.id) });
    });
  return router;
}
