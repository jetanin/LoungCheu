import express, { type RequestHandler } from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createAttendanceRouter } from '../../src/modules/attendance/router.js';
import { ApiError, errorHandler } from '../../src/shared/errors.js';

const eventId = '01234567-1234-1234-1234-012345678901', registrationId = '01234567-1234-1234-1234-012345678902';
const path = `/organizer/events/${eventId}/registrations/${registrationId}/check-in`;

describe('TEST-56/57: attendance router validation and middleware precedence', () => {
  it.each([
    ['anonymous', 401, 'AUTH_REQUIRED'], ['participant', 403, 'ROLE_FORBIDDEN'], ['bad-csrf', 403, 'CSRF_FAILED'],
  ] as const)('rejects %s before parsing malformed input or calling the service', async (mode, status, code) => {
    const service = vi.fn(), parse = vi.fn<RequestHandler>((_req, _res, next) => next());
    const auth: RequestHandler = (_req, res, next) => {
      if (mode === 'anonymous') throw new ApiError(401, 'AUTH_REQUIRED', 'กรุณาเข้าสู่ระบบ');
      res.locals.identity = { id: 'session-user', displayName: 'Synthetic', role: mode === 'participant' ? 'PARTICIPANT' : 'ORGANIZER' }; next();
    };
    const csrf = vi.fn<RequestHandler>(() => { throw new ApiError(403, 'CSRF_FAILED', 'กรุณาลองใหม่'); });
    const app = express(); app.use(createAttendanceRouter(auth, csrf, parse, service)); app.use(errorHandler);
    const response = await request(app).post(path).set('Content-Type', 'application/json').send('{');
    expect(response.status).toBe(status); expect(response.body.error.code).toBe(code);
    expect(parse).not.toHaveBeenCalled(); expect(service).not.toHaveBeenCalled();
    expect(csrf).toHaveBeenCalledTimes(mode === 'bad-csrf' ? 1 : 0);
  });

  it('TEST-56: rejects body attempts to provide an organizer before service execution', async () => {
    const service = vi.fn();
    const auth: RequestHandler = (_req, res, next) => { res.locals.identity = { id: 'session-owner', displayName: 'Synthetic', role: 'ORGANIZER' }; next(); };
    const pass: RequestHandler = (_req, _res, next) => next();
    const app = express(); app.use(createAttendanceRouter(auth, pass, express.json(), service)); app.use(errorHandler);
    const response = await request(app).post(path).send({ checked_in_by_id: 'forged-owner' });
    expect(response.status).toBe(400); expect(response.body.error.code).toBe('INVALID_INPUT');
    expect(service).not.toHaveBeenCalled();
  });

  it('TEST-56: forwards only validated path IDs and the session owner to the service', async () => {
    const service = vi.fn().mockResolvedValue({ id: registrationId });
    const auth: RequestHandler = (_req, res, next) => { res.locals.identity = { id: 'session-owner', displayName: 'Synthetic', role: 'ORGANIZER' }; next(); };
    const pass: RequestHandler = (_req, _res, next) => next();
    const app = express(); app.use(createAttendanceRouter(auth, pass, express.json(), service)); app.use(errorHandler);
    await request(app).post(path).send({}).expect(200);
    expect(service).toHaveBeenCalledExactlyOnceWith(eventId, registrationId, 'session-owner');
  });
});
