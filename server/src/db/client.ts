import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
export function createDatabaseClient(connectionString: string, maxConnections?: number) {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString, ...(maxConnections ? { max: maxConnections } : {}) }) });
}
