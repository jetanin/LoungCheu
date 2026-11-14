import { describe, expect, it } from 'vitest';
import { bangkokTime, validateForm, type FormValues } from './model';

const values = (): FormValues => ({ title: ' กิจกรรม 🌱 ', description: ' รายละเอียด ', location: ' บางมด ', capacity: '2',
  starts_at: '2026-11-07T00:30', ends_at: '2026-11-07T01:30', registration_closes_at: '2026-11-06T23:30' });

describe('F-02 form/time contract audit', () => {
  it.each(['title', 'description', 'location'] as const)('TEST-08 rejects unrepresentable text in %s and permits paired emoji', key => {
    for (const invalid of [String.fromCharCode(0), String.fromCharCode(0xD800), String.fromCharCode(0xDC00)]) expect(validateForm({ ...values(), [key]: `text${invalid}` }).fields[key]).toBeDefined();
    expect(validateForm({ ...values(), [key]: ' 🌱 ภาษาไทย ' }).fields[key]).toBeUndefined();
  });
  it.each(['2026-02-29T10:00', '2026-02-30T10:00', '2026-04-31T10:00', '0000-01-01T10:00', '0001-01-01T00:00'])('TEST-08/36 rejects invalid/UTC-out-of-range calendar input %s before sending', value => {
    expect(validateForm({ ...values(), starts_at: value }).fields.starts_at).toBeDefined();
  });
  it('TEST-08/36 accepts leap dates, millisecond Bangkok input and normalizes strings without using host timezone', () => {
    const checked = validateForm({ ...values(), starts_at: '2028-02-29T00:30:00.123', ends_at: '2028-02-29T01:30', registration_closes_at: '2028-02-28T23:30' });
    expect(checked.fields).toEqual({});
    expect(checked.body).toMatchObject({ title: 'กิจกรรม 🌱', description: 'รายละเอียด', location: 'บางมด', capacity: 2 });
    expect(new Date(checked.body.starts_at).toISOString()).toBe('2028-02-28T17:30:00.123Z');
    expect(bangkokTime('2028-02-28T17:30:00.123Z')).toContain('29 ก.พ. 2571');
    expect(bangkokTime('2028-02-28T17:30:00.123Z')).toContain('00:30');
  });
});
