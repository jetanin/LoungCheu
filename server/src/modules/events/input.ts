import { invalidInput } from '../../shared/errors.js';

export function eventId(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw invalidInput();
  return value;
}
export function emptyInput(body: unknown) {
  if (body !== undefined && (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length)) throw invalidInput();
}

// Reject calendar rollover, missing offset, and precision loss before Date parses it.
export function timestamp(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, , zone] = m;
  const year = Number(y), month = Number(mo), day = Number(d);
  const days = [31, year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1] || Number(h) > 23 || Number(mi) > 59 || Number(s) > 59
    || (zone !== 'Z' && (Number(zone.slice(1, 3)) > 23 || Number(zone.slice(4)) > 59))) return null;
  const date = new Date(value);
  // Keep the contract's four digit UTC output year even at offset boundaries.
  return Number.isFinite(date.getTime()) && date.getUTCFullYear() >= 1 && date.getUTCFullYear() <= 9999 ? date : null;
}

export function eventInput(body: unknown) {
  const keys = ['title', 'description', 'location', 'capacity', 'starts_at', 'ends_at', 'registration_closes_at'];
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !keys.includes(k))) throw invalidInput();
  const b = body as Record<string, unknown>, fields: Record<string, string[]> = {};
  function text(key: string, max: number) {
    const value = b[key];
    if (typeof value !== 'string' || !value.trim() || [...value.trim()].length > max) { fields[key] = [`กรุณากรอก 1–${max} ตัวอักษร`]; return ''; }
    return value.trim();
  }
  const title = text('title', 120), description = text('description', 2000), location = text('location', 200);
  if (typeof b.capacity !== 'number' || !Number.isInteger(b.capacity) || b.capacity < 1 || b.capacity > 1000) fields.capacity = ['จำนวนที่นั่งต้องเป็นจำนวนเต็ม 1–1000'];
  const dates = ['starts_at', 'ends_at', 'registration_closes_at'].map(key => {
    const date = timestamp(b[key]); if (!date) fields[key] = ['กรุณาระบุวันเวลาพร้อมเขตเวลา ความละเอียดไม่เกิน millisecond']; return date;
  });
  const [startsAt, endsAt, registrationClosesAt] = dates;
  if (startsAt && endsAt && startsAt >= endsAt) fields.ends_at = ['เวลาสิ้นสุดต้องหลังเวลาเริ่ม'];
  if (registrationClosesAt && startsAt && registrationClosesAt > startsAt) fields.registration_closes_at = ['เวลาปิดรับต้องไม่หลังเวลาเริ่ม'];
  if (Object.keys(fields).length) throw invalidInput(fields);
  return { title, description, location, capacity: b.capacity as number, startsAt: startsAt!, endsAt: endsAt!, registrationClosesAt: registrationClosesAt! };
}
