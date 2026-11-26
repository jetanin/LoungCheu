import { Prisma, type PrismaClient } from '@prisma/client';
import { ApiError } from '../../shared/errors.js';

const summary = { id: true, title: true, location: true, startsAt: true, endsAt: true, registrationClosesAt: true, status: true } as const;
const ownSelect = { id: true, status: true, registeredAt: true, cancelledAt: true, checkedInAt: true, event: { select: summary } } as const;
type OwnRecord = Prisma.RegistrationGetPayload<{ select: typeof ownSelect }>;
export function serializeOwnRegistration(record: OwnRecord) {
  const event = record.event;
  return { id: record.id, status: record.status, registered_at: record.registeredAt.toISOString(),
    cancelled_at: record.cancelledAt?.toISOString() ?? null, checked_in_at: record.checkedInAt?.toISOString() ?? null, event: {
    id: event.id, title: event.title, location: event.location, starts_at: event.startsAt.toISOString(),
    ends_at: event.endsAt.toISOString(), registration_closes_at: event.registrationClosesAt.toISOString(), status: event.status,
  } };
}
export function createRegistrationQueries(db: PrismaClient) {
  return {
    list: async (participantId: string) => (await db.registration.findMany({ where: { participantId },
      orderBy: [{ registeredAt: 'desc' }, { id: 'asc' }], select: ownSelect })).map(serializeOwnRegistration),
    detail: async (id: string, participantId: string) => {
      const record = await db.registration.findFirst({ where: { id, participantId }, select: ownSelect });
      if (!record) throw new ApiError(404, 'REGISTRATION_NOT_FOUND', 'ไม่พบรายการลงทะเบียนนี้');
      return serializeOwnRegistration(record);
    },
    // All rows and the derived ACTIVE count belong to one committed snapshot.
    // Scope the Event before loading its participants, including DRAFT/empty events.
    roster: (id: string, organizerId: string) => db.$transaction(async tx => {
      const event = await tx.event.findFirst({ where: { id, organizerId }, select: {
        id: true, capacity: true, registrations: { orderBy: [{ registeredAt: 'asc' }, { id: 'asc' }], select: {
          id: true, status: true, registeredAt: true, checkedInAt: true, participant: { select: { displayName: true } },
        } },
      } });
      if (!event) throw new ApiError(404, 'EVENT_NOT_FOUND', 'ไม่พบกิจกรรมนี้');
      return { event_id: event.id, capacity: event.capacity,
        active_count: event.registrations.filter(record => record.status === 'ACTIVE').length,
        checked_in_count: event.registrations.filter(record => record.status === 'ACTIVE' && record.checkedInAt !== null).length,
        registrations: event.registrations.map(record => ({ id: record.id, participant: { display_name: record.participant.displayName },
          status: record.status, registered_at: record.registeredAt.toISOString(), checked_in_at: record.checkedInAt?.toISOString() ?? null })),
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }),
  };
}
