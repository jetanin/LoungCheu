import { Prisma, type PrismaClient } from '@prisma/client';
import { ApiError } from '../../shared/errors.js';
import { serializeOwnRegistration } from './queries.js';

const missing = () => new ApiError(404, 'REGISTRATION_NOT_FOUND', 'ไม่พบรายการลงทะเบียนนี้');

export function createCancellationService(db: PrismaClient, clock: () => Date) {
  return (id: string, participantId: string) => db.$transaction(async tx => {
    // This scoped lookup discovers only the Event ID. Do not lock a
    // Registration before its Event, or trust the state from an unlocked read.
    const reference = await tx.registration.findFirst({ where: { id, participantId }, select: { eventId: true } });
    if (!reference) throw missing();
    const events = await tx.$queryRaw<{ status: string; registration_closes_at: Date }[]>`
      SELECT status, registration_closes_at FROM events WHERE id = ${reference.eventId}::uuid FOR UPDATE
    `;
    if (!events.length) throw missing();
    const now = clock();
    await tx.$queryRaw`
      SELECT id FROM registrations WHERE id = ${id}::uuid AND participant_id = ${participantId}::uuid FOR UPDATE
    `;
    const record = await tx.registration.findFirst({ where: { id, participantId } });
    if (!record) throw missing();
    const event = events[0];
    if (event.status !== 'PUBLISHED' || now.getTime() >= event.registration_closes_at.getTime()) {
      throw new ApiError(409, 'REGISTRATION_CLOSED', 'กิจกรรมปิดรับแล้วหรือเลยกำหนด จึงยกเลิกไม่ได้');
    }
    if (record.status === 'CANCELLED') throw new ApiError(409, 'ALREADY_CANCELLED', 'รายการนี้ถูกยกเลิกแล้ว');
    await tx.registration.update({ where: { id }, data: { status: 'CANCELLED', cancelledAt: now } });
    await tx.registrationHistory.create({ data: { registrationId: id, actorId: participantId, action: 'CANCELLED', occurredAt: now } });
    // The same transaction still holds the Event lock while serializing.
    return serializeOwnRegistration(await tx.registration.findUniqueOrThrow({ where: { id }, include: { event: true } }));
  }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, maxWait: 5_000, timeout: 15_000 });
}
