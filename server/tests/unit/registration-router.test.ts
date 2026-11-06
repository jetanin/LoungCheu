import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { ApiError, errorHandler } from '../../src/shared/errors.js';
import { createRegistrationRouter } from '../../src/modules/registrations/router.js';

interface RegistrationIdentity { id: string; role: 'PARTICIPANT' | 'ORGANIZER'; is_active: boolean; }

const participant = { id: '11111111-1111-4111-8111-111111111111', role: 'PARTICIPANT' as const, is_active: true };
const eventId = '22222222-2222-4222-8222-222222222222';
const record = { id: '33333333-3333-4333-8333-333333333333', event_id: eventId, status: 'ACTIVE' as const, registered_at: '2026-11-06T03:00:00.000Z' };

// Only checks the registration router boundary; these injected guards are NOT #1 auth tests.
function setup(identity: RegistrationIdentity | null = participant, csrf = true) {
  const register = vi.fn().mockResolvedValue(record);
  const app = express();
  app.use('/api', createRegistrationRouter({
    authenticate: (_req, res, next) => {
      if (!identity?.is_active) return next(new ApiError(401, 'AUTH_REQUIRED', 'กรุณาเข้าสู่ระบบ'));
      res.locals.identity = { id: identity.id, displayName: 'PA', role: identity.role }; next();
    },
    verifyCsrf: (_req, _res, next) => next(csrf ? undefined : new ApiError(403, 'CSRF_FAILED', 'invalid csrf')),
    register,
  }));
  app.use((_req, _res, next) => next(new ApiError(404, 'ROUTE_NOT_FOUND', 'ไม่พบเส้นทาง')));
  app.use(errorHandler);
  return { app, register };
}

describe('F-03 HTTP boundary (TEST-19/32, injected auth guards)', () => {
  it('takes participant from trusted identity and returns the success envelope', async () => {
    const { app, register } = setup();
    const response = await request(app).post(`/api/events/${eventId}/registrations`).send({});
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ data: record });
    expect(register).toHaveBeenCalledWith(eventId, participant.id);
  });
  it('allows absent body', async () => {
    expect((await request(setup().app).post(`/api/events/${eventId}/registrations`)).status).toBe(201);
  });
  it.each([null, { ...participant, is_active: false }])('rejects missing/inactive identity before csrf/input', async (identity) => {
    const { app, register } = setup(identity, false);
    const response = await request(app).post('/api/events/bad/registrations').send('bad json');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTH_REQUIRED');
    expect(register).not.toHaveBeenCalled();
  });
  it('checks role before csrf and malformed JSON', async () => {
    const { app, register } = setup({ ...participant, role: 'ORGANIZER' }, false);
    const response = await request(app).post('/api/events/bad/registrations').set('Content-Type', 'application/json').send('{');
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ROLE_FORBIDDEN');
    expect(register).not.toHaveBeenCalled();
  });
  it('checks csrf before input', async () => {
    const { app, register } = setup(participant, false);
    const response = await request(app).post('/api/events/bad/registrations').send({ participant_id: 'spoofed' });
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('CSRF_FAILED');
    expect(register).not.toHaveBeenCalled();
  });
  it.each(['null', '[]', '1', 'true', '"text"', '{', '{"participant_id":"spoof"}', '{"status":"ACTIVE"}', '{"registered_at":"2026-01-01"}'])('rejects invalid/spoofed body %s', async (body) => {
    const { app, register } = setup();
    const response = await request(app).post(`/api/events/${eventId}/registrations`).set('Content-Type', 'application/json').send(body);
    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({ code: 'INVALID_INPUT', fields: {} });
    expect(register).not.toHaveBeenCalled();
  });
  it('rejects malformed UUID and non-JSON bodies', async () => {
    const { app, register } = setup();
    expect((await request(app).post('/api/events/nope/registrations').send({})).status).toBe(400);
    expect((await request(app).post(`/api/events/${eventId}/registrations`).set('Content-Type', 'text/plain').send('{}')).status).toBe(400);
    expect(register).not.toHaveBeenCalled();
  });
  it('hides internal failures and returns JSON for unknown API paths', async () => {
    const { app, register } = setup();
    register.mockRejectedValue(new Error('SELECT password_hash FROM secrets'));
    const response = await request(app).post(`/api/events/${eventId}/registrations`).send({});
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'ระบบขัดข้อง กรุณาลองใหม่', fields: {} } });
    expect((await request(app).get('/api/unknown')).body.error.code).toBe('ROUTE_NOT_FOUND');
  });
});
