import { Prisma, type PrismaClient } from '@prisma/client';
import { ApiError } from '../../shared/errors.js';
import { attendanceRate } from './rate.js';

type Counts = { active: number; cancelled: number; checked_in: number };

// F-09 AttendanceSummary (Sprint 3 contract). Owner filter on Event first, then one aggregate,
// both inside one REPEATABLE READ snapshot so every count comes from the same committed state.
export function createAttendanceSummary(db: PrismaClient, now: () => number) {
  return {
    summary: (eventId: string, organizerId: string) => db.$transaction(async tx => {
      const event = await tx.event.findFirst({ where: { id: eventId, organizerId }, select: { id: true, status: true, capacity: true } });
      if (!event) throw new ApiError(404, 'EVENT_NOT_FOUND', 'ไม่พบกิจกรรมนี้');
      const [counts] = await tx.$queryRaw<Counts[]>`
        SELECT COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active,
               COUNT(*) FILTER (WHERE status = 'CANCELLED')::int AS cancelled,
               COUNT(*) FILTER (WHERE status = 'ACTIVE' AND checked_in_at IS NOT NULL)::int AS checked_in
        FROM registrations WHERE event_id = ${eventId}::uuid`;
      return { event_id: event.id, status: event.status, capacity: event.capacity,
        active_count: counts.active, cancelled_count: counts.cancelled, checked_in_count: counts.checked_in,
        attendance_rate: attendanceRate(counts.checked_in, counts.active), generated_at: new Date(now()).toISOString() };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }),
  };
}
