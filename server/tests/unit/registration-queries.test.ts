import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { createRegistrationQueries } from '../../src/modules/registrations/queries.js';

const date = new Date('2026-11-07T03:00:00.000Z');
const event = { id: 'event', title: 'Workshop', location: 'Campus', startsAt: date, endsAt: date, registrationClosesAt: date, status: 'PUBLISHED' };
const registration = { id: 'reference', status: 'ACTIVE', registeredAt: date, event };
function fixture() {
  const tx = { registration: { findMany: vi.fn().mockResolvedValue([registration]), findFirst: vi.fn().mockResolvedValue(registration) },
    event: { findFirst: vi.fn().mockResolvedValue({ id: 'event', capacity: 3, registrations: [
      { id: 'a', status: 'ACTIVE', registeredAt: date, participant: { displayName: 'Alice' } },
      { id: 'b', status: 'CANCELLED', registeredAt: date, participant: { displayName: 'Bob' } },
    ] }) } };
  const db = { ...tx, $transaction: vi.fn(async (work: (connection: typeof tx) => unknown) => work(tx)) };
  return { tx, service: createRegistrationQueries(db as unknown as PrismaClient) };
}
describe('F-04/F-05 scoped reads', () => {
  it('scopes own list in the query and serializes only contract fields (TEST-22)', async () => {
    const { tx, service } = fixture();
    expect(await service.list('participant')).toEqual([{ id: 'reference', status: 'ACTIVE', registered_at: date.toISOString(), event: {
      id: 'event', title: 'Workshop', location: 'Campus', starts_at: date.toISOString(), ends_at: date.toISOString(), registration_closes_at: date.toISOString(), status: 'PUBLISHED',
    } }]);
    expect(tx.registration.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { participantId: 'participant' }, orderBy: [{ registeredAt: 'desc' }, { id: 'asc' }] }));
  });
  it('scopes detail before retrieval and masks missing/foreign references (TEST-23)', async () => {
    const { tx, service } = fixture(); tx.registration.findFirst.mockResolvedValue(null as never);
    await expect(service.detail('foreign', 'participant')).rejects.toMatchObject({ status: 404, code: 'REGISTRATION_NOT_FOUND' });
    expect(tx.registration.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'foreign', participantId: 'participant' } }));
  });
  it('scopes roster by event owner and returns minimal participants with ACTIVE count (TEST-26)', async () => {
    const { tx, service } = fixture();
    expect(await service.roster('event', 'owner')).toEqual({ event_id: 'event', capacity: 3, active_count: 1, registrations: [
      { id: 'a', participant: { display_name: 'Alice' }, status: 'ACTIVE', registered_at: date.toISOString() },
      { id: 'b', participant: { display_name: 'Bob' }, status: 'CANCELLED', registered_at: date.toISOString() },
    ] });
    expect(tx.event.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'event', organizerId: 'owner' } }));
  });
  it('masks another organizer event before reading its roster (TEST-27)', async () => {
    const { tx, service } = fixture(); tx.event.findFirst.mockResolvedValue(null as never);
    await expect(service.roster('foreign', 'owner')).rejects.toMatchObject({ status: 404, code: 'EVENT_NOT_FOUND' });
  });
  it('returns empty list/count without fabricating registrations (TEST-28)', async () => {
    const { tx, service } = fixture(); tx.registration.findMany.mockResolvedValue([]);
    tx.event.findFirst.mockResolvedValue({ id: 'event', capacity: 3, registrations: [] });
    expect(await service.list('participant')).toEqual([]);
    expect(await service.roster('event', 'owner')).toEqual({ event_id: 'event', capacity: 3, active_count: 0, registrations: [] });
  });
});
