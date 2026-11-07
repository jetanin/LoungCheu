import { Prisma, type PrismaClient, type Event } from '@prisma/client';
import { ApiError } from '../../shared/errors.js';
import type { eventInput } from './input.js';

const counts = { _count: { select: { registrations: { where: { status: 'ACTIVE' as const } } } } };
type CountedEvent = Event & { _count: { registrations: number } };
const missing = () => new ApiError(404, 'EVENT_NOT_FOUND', 'ไม่พบกิจกรรมนี้');
function serialize(event: CountedEvent, owner: boolean, now: number) {
  const active_count = event._count.registrations, available_seats = event.capacity - active_count;
  return { id: event.id, title: event.title, description: event.description, location: event.location, capacity: event.capacity,
    starts_at: event.startsAt.toISOString(), ends_at: event.endsAt.toISOString(), registration_closes_at: event.registrationClosesAt.toISOString(), status: event.status,
    active_count, available_seats, registration_open: event.status === 'PUBLISHED' && now < event.registrationClosesAt.getTime() && available_seats > 0,
    ...(owner ? { organizer_id: event.organizerId, created_at: event.createdAt.toISOString(), updated_at: event.updatedAt.toISOString() } : {}) };
}

export function createEventService(db: PrismaClient, now: () => number) {
  // Prisma may issue multiple SELECTs for relation counts. REPEATABLE READ gives
  // all fields/counts (and every list row) a single committed MVCC snapshot.
  const snapshot = <T>(work: (tx: Prisma.TransactionClient) => Promise<T>) => db.$transaction(work, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  return {
    create: (organizerId: string, data: ReturnType<typeof eventInput>) => snapshot(async tx => {
      const event = await tx.event.create({ data: { ...data, organizerId }, include: counts });
      return serialize(event, true, now());
    }),
    list: (organizerId?: string) => snapshot(async tx => {
      const events = await tx.event.findMany({ where: organizerId ? { organizerId } : { status: { in: ['PUBLISHED', 'CLOSED'] } },
        orderBy: organizerId ? [{ createdAt: 'desc' }, { id: 'asc' }] : [{ startsAt: 'asc' }, { id: 'asc' }], include: counts });
      const clock = now(); return events.map(e => serialize(e, !!organizerId, clock));
    }),
    detail: (id: string, organizerId?: string) => snapshot(async tx => {
      const event = await tx.event.findFirst({ where: { id, ...(organizerId ? { organizerId } : { status: { in: ['PUBLISHED', 'CLOSED'] } }) }, include: counts });
      if (!event) throw missing();
      return serialize(event, !!organizerId, now());
    }),
    publish: (id: string, organizerId: string) => db.$transaction(async tx => {
      // Same Event → Registration lock order as #3. READ COMMITTED lets a
      // waiting publisher see the preceding publisher's committed status.
      const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM events WHERE id=${id}::uuid AND organizer_id=${organizerId}::uuid FOR UPDATE`;
      if (!locked.length) throw missing();
      const clock = now();
      const event = await tx.event.findUniqueOrThrow({ where: { id }, include: counts });
      if (event.status !== 'DRAFT') throw new ApiError(409, 'INVALID_TRANSITION', 'เผยแพร่ได้เฉพาะกิจกรรม DRAFT');
      if (clock >= event.registrationClosesAt.getTime()) throw new ApiError(409, 'DEADLINE_PASSED', 'เลยกำหนดปิดรับลงทะเบียนแล้ว');
      const updated = await tx.event.update({ where: { id }, data: { status: 'PUBLISHED', updatedAt: new Date(clock) } });
      return serialize({ ...updated, _count: event._count }, true, clock);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }),
  };
}
