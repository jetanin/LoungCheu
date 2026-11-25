import { Prisma, type PrismaClient } from '@prisma/client';
import { ApiError } from '../../shared/errors.js';
import { assertRegistrationOpen, assertSeatAvailable, type RegistrationEvent } from './rules.js';

export interface RegistrationCreated {
  id: string;
  event_id: string;
  status: 'ACTIVE' | 'CANCELLED';
  registered_at: string;
}

export function createRegistrationService(prisma: PrismaClient, clock: () => Date = () => new Date()) {
  return async (eventId: string, participantId: string): Promise<RegistrationCreated> => {
    try {
      return await prisma.$transaction(async (tx) => {
        const events = await tx.$queryRaw<RegistrationEvent[]>`
          SELECT "status", "registration_closes_at", "capacity"
          FROM "events" WHERE "id" = ${eventId}::uuid FOR UPDATE
        `;
        // Read application time only AFTER acquiring the lock, including lock-wait time.
        const now = clock();
        assertRegistrationOpen(events[0] ?? null, now);
        // LAB6 CONTROLLED EXERCISE (#64, TA-assigned): duplicate check removed on purpose.
        // Branch/CI only — this defect must never be deployed.
        const count = await tx.registration.count({ where: { eventId, status: 'ACTIVE' } });
        assertSeatAvailable(false, count, events[0].capacity);
        const record = await tx.registration.create({
          data: { eventId, participantId, status: 'ACTIVE', registeredAt: now },
          select: { id: true, eventId: true, status: true, registeredAt: true },
        });
        return { id: record.id, event_id: record.eventId, status: record.status, registered_at: record.registeredAt.toISOString() };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, maxWait: 5_000, timeout: 15_000 });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = error.meta?.target;
        if (Array.isArray(target) && target.includes('event_id') && target.includes('participant_id')) {
          throw new ApiError(409, 'ALREADY_REGISTERED', 'คุณลงทะเบียนกิจกรรมนี้แล้ว');
        }
      }
      throw error;
    }
  };
}
