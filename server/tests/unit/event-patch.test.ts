import { describe, expect, it } from 'vitest';
import { eventPatch } from '../../src/modules/events/input.js';
import { ApiError } from '../../src/shared/errors.js';

function rejection(body: unknown) {
  try { eventPatch(body); } catch (error) {
    if (error instanceof ApiError) return { status: error.status, code: error.code, fields: error.fields };
    throw error;
  }
  return null;
}

describe('F-07 EventPatch validation (TEST-48 unit, AC-37)', () => {
  it('normalizes only the fields that were sent', () => {
    expect(eventPatch({ title: '  ชื่อใหม่ 🌱 ' })).toEqual({ title: 'ชื่อใหม่ 🌱' });
    expect(eventPatch({ capacity: 1000, location: ' ห้อง 2 ' })).toEqual({ capacity: 1000, location: 'ห้อง 2' });
    expect(eventPatch({ starts_at: '2026-11-08T10:00:00.5+07:00', ends_at: '2026-11-08T05:00:00Z', registration_closes_at: '2026-11-08T02:00:00Z' }))
      .toEqual({ startsAt: new Date('2026-11-08T03:00:00.500Z'), endsAt: new Date('2026-11-08T05:00:00.000Z'), registrationClosesAt: new Date('2026-11-08T02:00:00.000Z') });
  });

  it('accepts the EventInput boundaries', () => {
    expect(eventPatch({ title: '🌱'.repeat(120), description: 'ก'.repeat(2000), location: '🌱'.repeat(200), capacity: 1 }))
      .toEqual({ title: '🌱'.repeat(120), description: 'ก'.repeat(2000), location: '🌱'.repeat(200), capacity: 1 });
  });

  it('rejects empty, malformed, null, out-of-range and non-editable input with 400 INVALID_INPUT', () => {
    const invalid: unknown[] = [undefined, null, [], 'text', 1, {},
      { title: '   ' }, { title: '🌱'.repeat(121) }, { description: 'ก'.repeat(2001) }, { location: '🌱'.repeat(201) },
      { title: null }, { description: null }, { location: 2 },
      ...[0, 1001, '5', 2.5, true, null].map(capacity => ({ capacity })),
      { starts_at: '2026-11-06T05:00:00' }, { starts_at: '2026-11-06T05:00:00.0001Z' }, { ends_at: null }, { registration_closes_at: 123 },
      ...['id', 'organizer_id', 'status', 'created_at', 'updated_at', 'active_count', 'foo'].map(key => ({ title: 'okay', [key]: 'spoofed' }))];
    for (const body of invalid) expect(rejection(body), JSON.stringify(body) ?? 'undefined').toMatchObject({ status: 400, code: 'INVALID_INPUT' });
  });

  it('reuses the create-form field messages', () => {
    expect(rejection({ title: '' })?.fields).toEqual({ title: ['กรุณากรอก 3–120 ตัวอักษร'] });
    expect(rejection({ capacity: 0 })?.fields).toEqual({ capacity: ['จำนวนที่นั่งต้องเป็นจำนวนเต็ม 1–1000'] });
  });
});
