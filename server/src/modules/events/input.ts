import { invalidInput } from '../../shared/errors.js';

export { uuidId as eventId } from '../../shared/input.js';
export function emptyInput(body: unknown) {
  if (body !== undefined && (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length)) throw invalidInput();
}

// Reject calendar rollover, missing offset, and precision loss before Date parses it.
export function timestamp(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, , zone] = m;
  const year = Number(y), month = Number(mo), day = Number(d);
  const days = [31, year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1] || Number(h) > 23 || Number(mi) > 59 || Number(s ?? '0') > 59
    || (zone !== 'Z' && (Number(zone.slice(1, 3)) > 23 || Number(zone.slice(4)) > 59))) return null;
  const date = new Date(value);
  // Keep the contract's four digit UTC output year even at offset boundaries.
  return Number.isFinite(date.getTime()) && date.getUTCFullYear() >= 1 && date.getUTCFullYear() <= 9999 ? date : null;
}

type Fields = Record<string, string[]>;
const eventKeys = ['title', 'description', 'location', 'capacity', 'starts_at', 'ends_at', 'registration_closes_at'];
const textLimits = { title: 120, description: 2000, location: 200 } as const;
const timeKeys = { starts_at: 'startsAt', ends_at: 'endsAt', registration_closes_at: 'registrationClosesAt' } as const;

// Per-field rules shared by create (EventInput) and edit (EventPatch) so both
// report the same Thai field messages (F-07 contract: INVALID_INPUT).
function text(b: Record<string, unknown>, key: keyof typeof textLimits, fields: Fields) {
  const value = b[key], max = textLimits[key], min = key === 'title' ? 3 : 1;
  const length = typeof value === 'string' ? [...value.trim()].length : 0;
  if (typeof value !== 'string' || length < min || length > max) { fields[key] = [`กรุณากรอก ${min}–${max} ตัวอักษร`]; return ''; }
  // PostgreSQL TEXT cannot store NUL; reject unpaired UTF-16 surrogates
  // before the driver silently replaces them. Paired emoji remain valid.
  if (/[\u0000\uD800-\uDFFF]/u.test(value)) { fields[key] = ['มีอักขระที่ไม่รองรับ กรุณากรอกข้อความใหม่']; return ''; }
  return value.trim();
}
function capacity(b: Record<string, unknown>, fields: Fields) {
  if (typeof b.capacity !== 'number' || !Number.isInteger(b.capacity) || b.capacity < 1 || b.capacity > 1000) fields.capacity = ['จำนวนที่นั่งต้องเป็นจำนวนเต็ม 1–1000'];
  return b.capacity as number;
}
function time(b: Record<string, unknown>, key: keyof typeof timeKeys, fields: Fields) {
  const date = timestamp(b[key]); if (!date) fields[key] = ['กรุณาระบุวันเวลาพร้อมเขตเวลา ความละเอียดไม่เกิน millisecond']; return date;
}
// BR-02: registration_closes_at <= starts_at < ends_at.
export function scheduleErrors(startsAt: Date | null, endsAt: Date | null, registrationClosesAt: Date | null): Fields {
  const fields: Fields = {};
  if (startsAt && endsAt && startsAt >= endsAt) fields.ends_at = ['เวลาสิ้นสุดต้องหลังเวลาเริ่ม'];
  if (registrationClosesAt && startsAt && registrationClosesAt > startsAt) fields.registration_closes_at = ['เวลาปิดรับต้องไม่หลังเวลาเริ่ม'];
  return fields;
}

export function eventInput(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !eventKeys.includes(k))) throw invalidInput();
  const b = body as Record<string, unknown>, fields: Fields = {};
  const title = text(b, 'title', fields), description = text(b, 'description', fields), location = text(b, 'location', fields);
  const seats = capacity(b, fields);
  const startsAt = time(b, 'starts_at', fields), endsAt = time(b, 'ends_at', fields), registrationClosesAt = time(b, 'registration_closes_at', fields);
  Object.assign(fields, scheduleErrors(startsAt, endsAt, registrationClosesAt));
  if (Object.keys(fields).length) throw invalidInput(fields);
  return { title, description, location, capacity: seats, startsAt: startsAt!, endsAt: endsAt!, registrationClosesAt: registrationClosesAt! };
}

export type EventPatch = Partial<ReturnType<typeof eventInput>>;
// F-07 EventPatch: at least one EventInput field, same per-field rules, no null,
// no system/unknown fields (BR-11). The merged BR-02 order is checked by the
// service after the status rules (contract check order step 6).
export function eventPatch(body: unknown): EventPatch {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalidInput();
  const b = body as Record<string, unknown>, keys = Object.keys(b);
  if (!keys.length || keys.some(k => !eventKeys.includes(k))) throw invalidInput();
  const fields: Fields = {}, patch: EventPatch = {};
  for (const key of Object.keys(textLimits) as (keyof typeof textLimits)[]) if (key in b) patch[key] = text(b, key, fields);
  if ('capacity' in b) patch.capacity = capacity(b, fields);
  for (const [key, prop] of Object.entries(timeKeys) as [keyof typeof timeKeys, (typeof timeKeys)[keyof typeof timeKeys]][]) {
    if (key in b) { const date = time(b, key, fields); if (date) patch[prop] = date; }
  }
  if (Object.keys(fields).length) throw invalidInput(fields);
  return patch;
}
