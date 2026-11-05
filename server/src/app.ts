import express from 'express';
import { ApiError, apiErrorHandler } from './shared/errors.js';
import { createRegistrationRouter, type RegistrationDependencies } from './modules/registrations/router.js';

// Composition harness for #3 and integration tests. Auth/session/event routes are supplied by #1/#2.
export function createRegistrationApp(deps: RegistrationDependencies) {
  const app = express();
  app.disable('x-powered-by');
  app.use('/api', createRegistrationRouter(deps));
  app.use((_req, _res, next) => next(new ApiError(404, 'ROUTE_NOT_FOUND', 'ไม่พบเส้นทางที่ร้องขอ')));
  app.use(apiErrorHandler);
  return app;
}
