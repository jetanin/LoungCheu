// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AttendanceSummary } from './AttendanceSummary';

// F-09 TEST-64 / AC-50 (component part, mocked API). Contract: Sprint 3 F-09 Workflow / UI rules.
const organizer = { id: 'owner', display_name: 'Owner', role: 'ORGANIZER' as const };
const participant = { id: 'p', display_name: 'Alice', role: 'PARTICIPANT' as const };
const eventId = '11111111-1111-4111-8111-111111111111';
const summary = { event_id: eventId, status: 'PUBLISHED', capacity: 5, active_count: 2, cancelled_count: 1,
  checked_in_count: 1, attendance_rate: '50.00', generated_at: '2026-11-06T05:30:00.000Z' };
const reply = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ data }) });
const failure = (status: number, code: string, message: string) =>
  ({ ok: false, status, json: async () => ({ error: { code, message } }) });
const value = (label: string) => screen.getByText(label).nextElementSibling?.textContent;
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('TEST-64: shows a placeholder while loading, then the four values, rate line and Bangkok read time', async () => {
  let finish!: (value: unknown) => void;
  const fetch = vi.fn().mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  vi.stubGlobal('fetch', fetch);
  render(<AttendanceSummary identity={organizer} eventId={eventId} onAuthRequired={vi.fn()}/>);
  expect(fetch.mock.calls[0][0]).toBe(`/api/organizer/events/${eventId}/summary`);
  expect(screen.getByRole('status').textContent).toContain('กำลังโหลด');
  // Loading must not show zero before data arrives.
  expect(screen.queryByText('0')).toBeNull();
  expect(screen.queryByText('0.00%')).toBeNull();
  finish(reply(summary));
  expect(await screen.findByText('50.00%')).toBeTruthy();
  expect(value('ลงทะเบียนอยู่ (ACTIVE)')).toBe('2');
  expect(value('ยกเลิก (CANCELLED)')).toBe('1');
  expect(value('เช็กชื่อแล้ว')).toBe('1');
  expect(value('อัตราเข้าร่วม')).toBe('50.00%');
  expect(screen.getByText('เช็กชื่อแล้ว 1 จาก ACTIVE 2 คน')).toBeTruthy();
  // 05:30Z = 12:30 Asia/Bangkok.
  expect(screen.getByText(/ข้อมูล ณ .*12:30:00/)).toBeTruthy();
  expect(screen.getByRole('link', { name: 'กลับรายละเอียดกิจกรรม' }).getAttribute('href')).toBe(`/organizer/events/${eventId}`);
  expect(screen.queryByRole('status')).toBeNull();
});

it('TEST-64: ACTIVE=0 shows 0.00% with the empty note and keeps every number visible (DRAFT)', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(reply({ ...summary, status: 'DRAFT', active_count: 0,
    cancelled_count: 0, checked_in_count: 0, attendance_rate: '0.00' })));
  render(<AttendanceSummary identity={organizer} eventId={eventId} onAuthRequired={vi.fn()}/>);
  expect(await screen.findByText('ยังไม่มีผู้ลงทะเบียน ACTIVE')).toBeTruthy();
  expect(value('ลงทะเบียนอยู่ (ACTIVE)')).toBe('0');
  expect(value('ยกเลิก (CANCELLED)')).toBe('0');
  expect(value('เช็กชื่อแล้ว')).toBe('0');
  expect(value('อัตราเข้าร่วม')).toBe('0.00%');
});

it('TEST-64: รีเฟรชสรุป reads again and replaces the values; focus does not auto-refresh', async () => {
  const fetch = vi.fn().mockResolvedValueOnce(reply(summary)).mockResolvedValueOnce(reply({ ...summary,
    checked_in_count: 2, attendance_rate: '100.00', generated_at: '2026-11-06T05:40:00.000Z' }));
  vi.stubGlobal('fetch', fetch);
  render(<AttendanceSummary identity={organizer} eventId={eventId} onAuthRequired={vi.fn()}/>);
  await screen.findByText('50.00%');
  fireEvent.focus(window);
  expect(fetch).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'รีเฟรชสรุป' }));
  expect(await screen.findByText('100.00%')).toBeTruthy();
  expect(screen.getByText('เช็กชื่อแล้ว 2 จาก ACTIVE 2 คน')).toBeTruthy();
  expect(screen.getByText(/ข้อมูล ณ .*12:40:00/)).toBeTruthy();
  expect(fetch).toHaveBeenCalledTimes(2);
});

it('TEST-64: a failed read shows an error with retry, then recovers', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(reply(summary)));
  render(<AttendanceSummary identity={organizer} eventId={eventId} onAuthRequired={vi.fn()}/>);
  expect((await screen.findByRole('alert')).textContent).toContain('โหลดข้อมูลไม่สำเร็จ');
  expect(screen.queryByText('ลงทะเบียนอยู่ (ACTIVE)')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'ลองใหม่' }));
  expect(await screen.findByText('50.00%')).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
});

it('TEST-64: 401 sends the user back to login without showing values', async () => {
  const onAuthRequired = vi.fn();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(failure(401, 'AUTH_REQUIRED', 'กรุณาเข้าสู่ระบบ')));
  render(<AttendanceSummary identity={organizer} eventId={eventId} onAuthRequired={onAuthRequired}/>);
  await vi.waitFor(() => expect(onAuthRequired).toHaveBeenCalledTimes(1));
  expect(screen.queryByText('ลงทะเบียนอยู่ (ACTIVE)')).toBeNull();
});

it.each([
  [403, 'ROLE_FORBIDDEN', 'ไม่มีสิทธิ์ดำเนินการ'],
  [404, 'EVENT_NOT_FOUND', 'ไม่พบกิจกรรม'],
])('TEST-64: %s on refresh clears the shown values and shows the error', async (status, code, message) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(reply(summary)).mockResolvedValueOnce(failure(status, code, message)));
  render(<AttendanceSummary identity={organizer} eventId={eventId} onAuthRequired={vi.fn()}/>);
  await screen.findByText('50.00%');
  fireEvent.click(screen.getByRole('button', { name: 'รีเฟรชสรุป' }));
  expect((await screen.findByRole('alert')).textContent).toContain(message);
  expect(screen.queryByText('50.00%')).toBeNull();
  expect(screen.queryByText('ลงทะเบียนอยู่ (ACTIVE)')).toBeNull();
});

it('TEST-64: a participant gets a role message and no summary request', () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  render(<AttendanceSummary identity={participant} eventId={eventId} onAuthRequired={vi.fn()}/>);
  expect(screen.getByRole('alert').textContent).toContain('เฉพาะผู้จัดกิจกรรม');
  expect(fetch).not.toHaveBeenCalled();
});
