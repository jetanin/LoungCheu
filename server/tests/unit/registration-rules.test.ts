import { describe, expect, it } from 'vitest';
import { assertRegistrationOpen, assertSeatAvailable } from '../../src/modules/registrations/rules.js';

const deadline = new Date('2026-11-06T04:00:00.000Z');
const event = { status: 'PUBLISHED' as const, registration_closes_at: deadline, capacity: 1 };

describe('F-03 registration rules (TEST-16–18)', () => {
  it('hides missing and DRAFT events', () => {
    expect(() => assertRegistrationOpen(null, deadline)).toThrow(expect.objectContaining({ code: 'EVENT_NOT_FOUND' }));
    expect(() => assertRegistrationOpen({ ...event, status: 'DRAFT' }, deadline)).toThrow(expect.objectContaining({ code: 'EVENT_NOT_FOUND' }));
  });
  it('rejects CLOSED before deadline', () => {
    expect(() => assertRegistrationOpen({ ...event, status: 'CLOSED' }, new Date(deadline.getTime() - 1))).toThrow(expect.objectContaining({ code: 'REGISTRATION_CLOSED' }));
  });
  it.each([0, 1])('rejects at deadline + %i ms', (offset) => {
    expect(() => assertRegistrationOpen(event, new Date(deadline.getTime() + offset))).toThrow(expect.objectContaining({ code: 'REGISTRATION_CLOSED' }));
  });
  it('accepts deadline - 1 ms', () => {
    expect(() => assertRegistrationOpen(event, new Date(deadline.getTime() - 1))).not.toThrow();
  });
  it('reports duplicate before capacity when both fail', () => {
    expect(() => assertSeatAvailable(true, 1, 1)).toThrow(expect.objectContaining({ code: 'ALREADY_REGISTERED' }));
  });
  it('rejects full events without a duplicate', () => {
    expect(() => assertSeatAvailable(false, 1, 1)).toThrow(expect.objectContaining({ code: 'EVENT_FULL' }));
  });
  it('accepts an available seat', () => {
    expect(() => assertSeatAvailable(false, 0, 1)).not.toThrow();
  });
});
