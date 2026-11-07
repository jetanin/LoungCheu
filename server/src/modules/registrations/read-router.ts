import { Router, type RequestHandler } from 'express';
import { requireRole } from '../../middleware/auth.js';
import { eventId } from '../events/input.js';
import type { createRegistrationQueries } from './queries.js';

export function createRegistrationReadRouter(authenticate: RequestHandler, service: ReturnType<typeof createRegistrationQueries>) {
  const router = Router();
  router.get('/my/registrations', authenticate, requireRole('PARTICIPANT'), async (_req, res) => {
    res.json({ data: await service.list(res.locals.identity.id) });
  });
  router.get('/my/registrations/:id', authenticate, requireRole('PARTICIPANT'), async (req, res) => {
    res.json({ data: await service.detail(eventId(req.params.id), res.locals.identity.id) });
  });
  router.get('/organizer/events/:id/registrations', authenticate, requireRole('ORGANIZER'), async (req, res) => {
    res.json({ data: await service.roster(eventId(req.params.id), res.locals.identity.id) });
  });
  return router;
}
