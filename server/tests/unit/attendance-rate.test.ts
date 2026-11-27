import { describe, expect, it } from 'vitest';
import { attendanceRate } from '../../src/modules/attendance/rate.js';

// F-09 TEST-61 / AC-48 (unit part): half-up to 2 decimals with integer math, always a 2-decimal string (DEC-18).
describe('F-09 attendanceRate (TEST-61 unit)', () => {
  it.each([
    [2, 3, '66.67'],
    [1, 3, '33.33'],
    [1, 32, '3.13'], // 3.125 → half-up 3.13 (banker's rounding would give 3.12)
    [3, 3, '100.00'],
    [0, 5, '0.00'],
    [0, 0, '0.00'], // ACTIVE = 0 must not divide by zero
    [1, 8, '12.50'],
  ])('checked %i of active %i → "%s"', (checked, active, expected) => {
    expect(attendanceRate(checked, active)).toBe(expected);
  });
});
