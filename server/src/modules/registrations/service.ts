import { Prisma, type PrismaClient } from '../../generated/prisma/client.js';
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
          FROM "Event" WHERE "id" = ${eventId}::uuid FOR UPDATE
        `;
        // Read application time only AFTER acquiring the lock, including lock-wait time.
        const now = clock();
        assertRegistrationOpen(events[0] ?? null, now);
        const existing = await tx.registration.findUnique({
          where: { event_id_participant_id: { event_id: eventId, participant_id: participantId } },
          select: { id: true },
        });
        const count = await tx.registration.count({ where: { event_id: eventId, status: 'ACTIVE' } });
        // Sprint 1 cannot reactivate CANCELLED; preserve the unique pair for Sprint 2.
        assertSeatAvailable(existing !== null, count, events[0].capacity);
        const record = await tx.registration.create({
          data: { event_id: eventId, participant_id: participantId, status: 'ACTIVE', registered_at: now },
          select: { id: true, event_id: true, status: true, registered_at: true },
        });
        return { ...record, registered_at: record.registered_at.toISOString() };
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
