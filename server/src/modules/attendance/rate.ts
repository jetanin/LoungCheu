// F-09 / BR-13 / DEC-18: checked_in / active × 100, half-up to 2 decimals, integer math only.
// hundredths = floor((checked × 10000 × 2 + active) / (active × 2)) rounds checked × 10000 / active half-up.
export function attendanceRate(checked: number, active: number): string {
  if (active === 0) return '0.00';
  const hundredths = Math.floor((checked * 10000 * 2 + active) / (active * 2));
  return `${Math.floor(hundredths / 100)}.${String(hundredths % 100).padStart(2, '0')}`;
}
