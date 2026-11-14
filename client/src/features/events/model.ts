export interface SharedEvent {
  id: string; title: string; description: string; location: string; capacity: number;
  starts_at: string; ends_at: string; registration_closes_at: string;
  status: 'PUBLISHED' | 'CLOSED'; active_count: number; available_seats: number; registration_open: boolean;
}
export interface OwnerEvent extends Omit<SharedEvent, 'status'> {
  status: 'DRAFT' | SharedEvent['status']; organizer_id: string; created_at: string; updated_at: string;
}
export type EventView = SharedEvent | OwnerEvent;
export const bangkokTime = (value: string) => new Intl.DateTimeFormat('th-TH', {
  dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Asia/Bangkok', hourCycle: 'h23',
}).format(new Date(value));
export const labels = { title: 'ชื่อกิจกรรม', description: 'รายละเอียด', location: 'สถานที่', capacity: 'จำนวนที่นั่ง',
  starts_at: 'เริ่มกิจกรรม', ends_at: 'สิ้นสุดกิจกรรม', registration_closes_at: 'ปิดรับลงทะเบียน' };
export type FormValues = Record<keyof typeof labels, string>;
export function validateForm(values: FormValues) {
  const fields: Record<string, string[]> = {};
  for (const [key, max] of [['title', 120], ['description', 2000], ['location', 200]] as const) {
    if (![...values[key].trim()].length || [...values[key].trim()].length > max) fields[key] = [`กรุณากรอก 1–${max} ตัวอักษร`];
    else if (/[\u0000\uD800-\uDFFF]/u.test(values[key])) fields[key] = ['มีอักขระที่ไม่รองรับ กรุณากรอกข้อความใหม่'];
  }
  const capacity = Number(values.capacity);
  if (!/^\d+$/.test(values.capacity) || !Number.isInteger(capacity) || capacity < 1 || capacity > 1000) fields.capacity = ['จำนวนที่นั่งต้องเป็นจำนวนเต็ม 1–1000'];
  // datetime-local expresses Bangkok wall time; never use the host/browser zone.
  const timestamps: Pick<FormValues, 'starts_at' | 'ends_at' | 'registration_closes_at'> = { starts_at: '', ends_at: '', registration_closes_at: '' };
  for (const key of ['starts_at', 'ends_at', 'registration_closes_at'] as const) {
    const value = values[key];
    const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/.test(value) ? `${value.length === 16 ? `${value}:00` : value}+07:00` : '';
    const instant = new Date(iso), local = new Date(instant.getTime() + 7 * 60 * 60 * 1000);
    const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(value);
    // Date.parse silently rolls invalid calendar dates into the next month.
    // Round-trip Bangkok wall time and require the same UTC range as the API.
    if (!parts || !Number.isFinite(instant.getTime()) || instant.getUTCFullYear() < 1 || instant.getUTCFullYear() > 9999
      || local.getUTCFullYear() !== Number(parts[1]) || local.getUTCMonth() + 1 !== Number(parts[2]) || local.getUTCDate() !== Number(parts[3])
      || local.getUTCHours() !== Number(parts[4]) || local.getUTCMinutes() !== Number(parts[5]) || local.getUTCSeconds() !== Number(parts[6] ?? 0)
      || local.getUTCMilliseconds() !== Number((parts[7] ?? '').padEnd(3, '0'))) fields[key] = ['กรุณาระบุวันเวลา'];
    timestamps[key] = iso;
  }
  if (Date.parse(timestamps.starts_at) >= Date.parse(timestamps.ends_at)) fields.ends_at = ['เวลาสิ้นสุดต้องหลังเวลาเริ่ม'];
  if (Date.parse(timestamps.registration_closes_at) > Date.parse(timestamps.starts_at)) fields.registration_closes_at = ['เวลาปิดรับต้องไม่หลังเวลาเริ่ม'];
  return { fields, body: { title: values.title.trim(), description: values.description.trim(), location: values.location.trim(), capacity, ...timestamps } };
}
