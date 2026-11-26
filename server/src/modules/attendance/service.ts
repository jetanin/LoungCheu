import { Prisma, type PrismaClient } from '@prisma/client';
import { ApiError } from '../../shared/errors.js';

export function createAttendanceService(db: PrismaClient, clock: () => Date) {
  return (eventId: string, registrationId: string, organizerId: string) => db.$transaction(async tx => {
    // Match lifecycle/edit lock order: Event first, then its Registration.
    const events = await tx.$queryRaw<{ starts_at: Date; ends_at: Date }[]>`
      SELECT starts_at, ends_at FROM events
      WHERE id = ${eventId}::uuid AND organizer_id = ${organizerId}::uuid FOR UPDATE
    `;
    if (!events.length) throw new ApiError(404, 'EVENT_NOT_FOUND', 'ไม่พบกิจกรรมนี้');
    const records = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM registrations
      WHERE id = ${registrationId}::uuid AND event_id = ${eventId}::uuid FOR UPDATE
    `;
    if (!records.length) throw new ApiError(404, 'REGISTRATION_NOT_FOUND', 'ไม่พบรายการลงทะเบียนนี้');
    const record = await tx.registration.findUniqueOrThrow({ where: { id: registrationId } });
    // Read the clock only after both locks: waiting must not extend the window.
    const now = clock(), event = events[0];
    if (now < event.starts_at || now > event.ends_at) {
      throw new ApiError(409, 'CHECK_IN_NOT_OPEN', 'เช็กชื่อได้เฉพาะระหว่างเวลาเริ่มถึงเวลาสิ้นสุดกิจกรรม');
    }
    if (record.status !== 'ACTIVE') throw new ApiError(409, 'REGISTRATION_NOT_ACTIVE', 'รายการนี้ถูกยกเลิกแล้ว เช็กชื่อไม่ได้');
    if (record.checkedInAt !== null) throw new ApiError(409, 'ALREADY_CHECKED_IN', 'ผู้เข้าร่วมคนนี้เช็กชื่อแล้ว');
    const updated = await tx.registration.update({ where: { id: registrationId },
      data: { checkedInAt: now, checkedInById: organizerId }, include: { participant: { select: { displayName: true } } } });
    // Attendance does not change Event or lifecycle history; actor stays private.
    return { id: updated.id, participant: { display_name: updated.participant.displayName }, status: updated.status,
      registered_at: updated.registeredAt.toISOString(), checked_in_at: updated.checkedInAt!.toISOString() };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, maxWait: 5_000, timeout: 15_000 });
}
