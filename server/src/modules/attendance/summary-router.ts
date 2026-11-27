import { Router, type RequestHandler } from 'express';
import { requireRole } from '../../middleware/auth.js';
import { eventId } from '../events/input.js';
import type { createAttendanceSummary } from './summary.js';

// F-09: auth → role → path input → owner scope (404) inside the service.
export function createAttendanceSummaryRouter(authenticate: RequestHandler, service: ReturnType<typeof createAttendanceSummary>) {
  const router = Router();
  router.get('/organizer/events/:id/summary', authenticate, requireRole('ORGANIZER'), async (req, res) => {
    res.json({ data: await service.summary(eventId(req.params.id), res.locals.identity.id) });
  });
  return router;
}
