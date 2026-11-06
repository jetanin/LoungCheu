import { createRegistrationApp } from './app.js';
import { createDatabaseClient } from './db/client.js';
import { createRegistrationService } from './modules/registrations/service.js';
import { ApiError } from './shared/errors.js';

const port = Number(process.env.PORT ?? 3000);
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || !Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('Set DATABASE_URL and a valid PORT (1–65535) in server/.env.');
  process.exit(1);
}

const prisma = createDatabaseClient(databaseUrl);
const app = createRegistrationApp({
  // Fail closed until #1 supplies real session/CSRF middleware. Never accept test identities here.
  authenticate: (_req, _res, next) => next(new ApiError(401, 'AUTH_REQUIRED', 'กรุณาเข้าสู่ระบบ')),
  verifyCsrf: (_req, _res, next) => next(new ApiError(403, 'CSRF_FAILED', 'ไม่สามารถยืนยันคำขอได้')),
  register: createRegistrationService(prisma),
});

try {
  await prisma.$connect();
  const server = app.listen(port, '127.0.0.1');
  server.once('listening', () => {
    console.log(`Registration API: http://127.0.0.1:${port}`);
    console.log('Authentication/Event Management integration pending; protected requests return 401.');
  });
  server.on('error', async (error: NodeJS.ErrnoException) => {
    console.error(error.code === 'EADDRINUSE'
      ? `Port ${port} is already in use. Stop the existing backend or change PORT in server/.env.`
      : `Cannot start API listener (${error.code ?? 'UNKNOWN'}).`);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
  let closing = false;
  const shutdown = () => {
    if (closing) return;
    closing = true;
    server.close(() => { void prisma.$disconnect().then(() => { process.exitCode = 0; }); });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch {
  console.error('Cannot connect to PostgreSQL. Check Docker and DATABASE_URL.');
  await prisma.$disconnect();
  process.exitCode = 1;
}
