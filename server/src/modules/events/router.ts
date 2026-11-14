import { Router, type RequestHandler } from 'express';
import { requireRole } from '../../middleware/auth.js';
import { emptyInput, eventId, eventInput } from './input.js';
import type { createEventService } from './service.js';

export function createEventRouter({ authenticate, verifyCsrf, json, service }: {
  authenticate: RequestHandler; verifyCsrf: RequestHandler; json: RequestHandler; service: ReturnType<typeof createEventService>;
}) {
  const router = Router(), organizer = requireRole('ORGANIZER');
  router.post('/organizer/events', authenticate, organizer, verifyCsrf, json, async (req, res) => {
    const input = eventInput(req.body);
    res.status(201).json({ data: await service.create(res.locals.identity.id, input) });
  });
  router.get('/organizer/events', authenticate, organizer, async (_req, res) => res.json({ data: await service.list(res.locals.identity.id) }));
  router.get('/organizer/events/:id', authenticate, organizer, async (req, res) => res.json({ data: await service.detail(eventId(req.params.id), res.locals.identity.id) }));
  router.post('/organizer/events/:id/publish', authenticate, organizer, verifyCsrf, json, async (req, res) => {
    const id = eventId(req.params.id); emptyInput(req.body);
    res.json({ data: await service.publish(id, res.locals.identity.id) });
  });
  router.get('/events', authenticate, async (_req, res) => res.json({ data: await service.list() }));
  router.get('/events/:id', authenticate, async (req, res) => res.json({ data: await service.detail(eventId(req.params.id)) }));
  return router;
}
