import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

export function createDatabaseClient(connectionString: string, maxConnections = 10) {
  const adapter = new PrismaPg({ connectionString, max: maxConnections, connectionTimeoutMillis: 5_000 });
  return new PrismaClient({ adapter });
}
