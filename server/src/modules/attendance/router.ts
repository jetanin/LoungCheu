import { Router, type RequestHandler } from 'express';
import { requireRole } from '../../middleware/auth.js';
import { emptyInput } from '../events/input.js';
import { uuidId } from '../../shared/input.js';
import type { createAttendanceService } from './service.js';

export function createAttendanceRouter(authenticate: RequestHandler, verifyCsrf: RequestHandler,
  json: RequestHandler, checkIn: ReturnType<typeof createAttendanceService>) {
  const router = Router();
  router.post('/organizer/events/:eventId/registrations/:registrationId/check-in',
    authenticate, requireRole('ORGANIZER'), verifyCsrf, json, async (req, res) => {
      const eventId = uuidId(req.params.eventId), registrationId = uuidId(req.params.registrationId);
      emptyInput(req.body);
      res.json({ data: await checkIn(eventId, registrationId, res.locals.identity.id) });
    });
  return router;
}
