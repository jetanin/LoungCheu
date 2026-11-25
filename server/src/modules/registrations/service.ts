import { Prisma, type PrismaClient } from '@prisma/client';
import { ApiError } from '../../shared/errors.js';
import { assertRegistrationOpen, assertSeatAvailable, type RegistrationEvent } from './rules.js';

export interface RegistrationCreated {
  id: string;
  event_id: string;
  status: 'ACTIVE' | 'CANCELLED';
  registered_at: string;
  cancelled_at: string | null;
}

// Transport metadata is removed by the router; it is never an API field.
export interface RegistrationResult extends RegistrationCreated { reactivated?: boolean; }

export function createRegistrationService(prisma: PrismaClient, clock: () => Date = () => new Date()) {
  return async (eventId: string, participantId: string): Promise<RegistrationResult> => {
    try {
      return await prisma.$transaction(async (tx) => {
        const events = await tx.$queryRaw<RegistrationEvent[]>`
          SELECT "status", "registration_closes_at", "capacity"
          FROM "events" WHERE "id" = ${eventId}::uuid FOR UPDATE
        `;
        // Read application time only AFTER acquiring the lock, including lock-wait time.
        const now = clock();
        assertRegistrationOpen(events[0] ?? null, now);
        const existing = await tx.registration.findUnique({
          where: { eventId_participantId: { eventId, participantId } },
          select: { id: true, status: true },
        });
        if (existing) await tx.$queryRaw`SELECT id FROM registrations WHERE id = ${existing.id}::uuid FOR UPDATE`;
        const count = await tx.registration.count({ where: { eventId, status: 'ACTIVE' } });
        assertSeatAvailable(existing?.status === 'ACTIVE', count, events[0].capacity);
        const record = existing
          ? await tx.registration.update({ where: { id: existing.id }, data: { status: 'ACTIVE', cancelledAt: null } })
          : await tx.registration.create({ data: { eventId, participantId, status: 'ACTIVE', registeredAt: now } });
        await tx.registrationHistory.create({ data: {
          registrationId: record.id, actorId: participantId,
          action: existing ? 'REACTIVATED' : 'REGISTERED', occurredAt: now,
        } });
        return { id: record.id, event_id: record.eventId, status: record.status,
          registered_at: record.registeredAt.toISOString(), cancelled_at: null, reactivated: !!existing };
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
