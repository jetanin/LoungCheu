// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { EventPage } from './EventPage.js';
import type { OwnerEvent } from './model.js';

// F-07 Edit event UI — Sprint 2 STS TEST-52 (component part), AC-40.
const id = '33333333-3333-4333-8333-333333333333';
const detailPath = `/organizer/events/${id}`, editPath = `${detailPath}/edit`;
const organizer = { id: 'organizer-a', display_name: 'Organizer A', role: 'ORGANIZER' as const };
const participant = { id: 'participant-a', display_name: 'Participant A', role: 'PARTICIPANT' as const };
function ownerEvent(over: Partial<OwnerEvent> = {}): OwnerEvent {
  return { id, title: 'กิจกรรมเดิม', description: 'รายละเอียดเดิม', location: 'KMUTT', capacity: 3,
    starts_at: '2099-01-01T03:00:00.000Z', ends_at: '2099-01-01T05:00:00.000Z', registration_closes_at: '2099-01-01T02:00:00.000Z',
    status: 'DRAFT', active_count: 0, available_seats: 3, registration_open: false,
    organizer_id: organizer.id, created_at: '2026-11-01T00:00:00.000Z', updated_at: '2026-11-01T00:00:00.000Z', ...over };
}
const reply = (status: number, payload: unknown) => Promise.resolve({ ok: status < 400, status, json: async () => payload });
type Call = { path: string; method: string; body?: unknown; csrf?: string };
// reads: successive GET results for the event (last one repeats); patch: reply for PATCH.
function server(reads: [number, unknown][], patch?: (body: unknown) => [number, unknown]) {
  const calls: Call[] = [];
  let read = 0;
  vi.stubGlobal('fetch', vi.fn((path: string, init: RequestInit = {}) => {
    const method = init.method ?? 'GET', headers = (init.headers ?? {}) as Record<string, string>;
    const body = init.body ? JSON.parse(init.body as string) : undefined;
    calls.push({ path, method, body, csrf: headers['X-CSRF-Token'] });
    if (path === '/api/auth/csrf') return reply(200, { data: { csrf_token: 'token-1' } });
    if (method === 'PATCH') return reply(...patch!(body));
    return reply(...reads[Math.min(read++, reads.length - 1)]);
  }));
  return calls;
}
const ok = (event: OwnerEvent): [number, unknown] => [200, { data: event }];
function open(path: string, identity: typeof organizer | typeof participant = organizer) {
  const onNavigate = vi.fn();
  render(<EventPage path={path} identity={identity} onAuthRequired={vi.fn()} onNavigate={onNavigate}/>);
  return onNavigate;
}
const field = (label: string) => screen.getByLabelText(label, { exact: true }) as HTMLInputElement;
const saveButton = () => screen.getByRole('button', { name: 'บันทึกการแก้ไข' }) as HTMLButtonElement;
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('F-07 edit event UI (TEST-52 component, AC-40)', () => {
  it.each(['DRAFT', 'PUBLISHED', 'CLOSED'] as const)('owner detail shows แก้ไขกิจกรรม only for DRAFT/PUBLISHED (%s)', async status => {
    server([ok(ownerEvent({ status }))]);
    open(detailPath);
    await screen.findByRole('heading', { name: 'กิจกรรมเดิม' });
    const edit = screen.queryByRole('link', { name: 'แก้ไขกิจกรรม' });
    if (status === 'CLOSED') { expect(edit).toBeNull(); return; }
    expect(edit?.getAttribute('href')).toBe(editPath);
    if (status === 'DRAFT') {
      const actions = [...edit!.parentElement!.children];
      expect(actions.indexOf(edit!)).toBeLessThan(actions.indexOf(screen.getByRole('button', { name: 'เผยแพร่กิจกรรม' })));
    }
  });

  it('prefills current values, enables save only after a real change and sends only changed fields', async () => {
    const calls = server([ok(ownerEvent())], body => ok(ownerEvent({ title: (body as { title: string }).title, ends_at: '2099-01-01T06:30:00.000Z' })));
    const onNavigate = open(editPath);
    await screen.findByRole('heading', { name: 'แก้ไขกิจกรรม' });
    expect(field('ชื่อกิจกรรม').value).toBe('กิจกรรมเดิม');
    expect(field('รายละเอียด').value).toBe('รายละเอียดเดิม');
    expect(field('จำนวนที่นั่ง').value).toBe('3');
    // Stored UTC instants are shown as Asia/Bangkok wall time.
    expect([field('วันที่เริ่มกิจกรรม').value, field('เวลาเริ่มกิจกรรม').value]).toEqual(['2099-01-01', '10:00']);
    expect(field('เวลาสิ้นสุดกิจกรรม').value).toBe('12:00');
    expect(field('เวลาปิดรับลงทะเบียน').value).toBe('09:00');
    expect(screen.queryByText(/มีผู้ลงทะเบียน ACTIVE/)).toBeNull(); // contract v0.6: hint only when PUBLISHED
    expect(screen.queryByText('เผยแพร่แล้ว แก้เวลาไม่ได้')).toBeNull();
    expect(saveButton().disabled).toBe(true);
    fireEvent.change(field('ชื่อกิจกรรม'), { target: { value: '  กิจกรรมเดิม ' } });
    expect(saveButton().disabled).toBe(true); // same value after trim is not a change
    fireEvent.change(field('ชื่อกิจกรรม'), { target: { value: '  ชื่อใหม่  ' } });
    fireEvent.change(field('เวลาสิ้นสุดกิจกรรม'), { target: { value: '13:30' } });
    expect(saveButton().disabled).toBe(false);
    fireEvent.click(saveButton());
    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith(detailPath));
    expect(calls.filter(c => c.method === 'PATCH')).toEqual([{ path: `/api${detailPath}`, method: 'PATCH', csrf: 'token-1',
      body: { title: 'ชื่อใหม่', ends_at: '2099-01-01T13:30:00+07:00' } }]);

    // The detail page that follows shows the success notice with values read from the server.
    cleanup(); server([ok(ownerEvent({ title: 'ชื่อใหม่' }))]);
    open(detailPath);
    expect(await screen.findByText('บันทึกการแก้ไขแล้ว')).toBeTruthy();
    expect(await screen.findByRole('heading', { name: 'ชื่อใหม่' })).toBeTruthy();
  });

  it('PUBLISHED keeps the three time fields disabled with a note and explains the ACTIVE floor', async () => {
    server([ok(ownerEvent({ status: 'PUBLISHED', active_count: 2, available_seats: 1 }))]);
    open(editPath);
    await screen.findByRole('heading', { name: 'แก้ไขกิจกรรม' });
    for (const label of ['เริ่มกิจกรรม', 'สิ้นสุดกิจกรรม', 'ปิดรับลงทะเบียน']) {
      for (const part of ['วันที่', 'เวลา']) expect(field(`${part}${label}`).closest('fieldset')?.disabled, `${part}${label}`).toBe(true);
    }
    expect(field('เวลาเริ่มกิจกรรม').value).toBe('10:00');
    expect(screen.getByText('เผยแพร่แล้ว แก้เวลาไม่ได้')).toBeTruthy();
    expect(screen.getByText('มีผู้ลงทะเบียน ACTIVE 2 คน ตั้งได้ไม่ต่ำกว่า 2')).toBeTruthy();
    expect(field('ชื่อกิจกรรม').disabled).toBe(false);
    expect(field('จำนวนที่นั่ง').disabled).toBe(false);
  });

  it('on 409 shows the Thai reason, reloads ACTIVE/status and keeps what the user typed', async () => {
    const calls = server([ok(ownerEvent({ status: 'PUBLISHED', active_count: 2, available_seats: 1 })), ok(ownerEvent({ status: 'PUBLISHED', active_count: 3, available_seats: 0 }))],
      () => [409, { error: { code: 'CAPACITY_BELOW_ACTIVE', message: 'จำนวนที่นั่งต้องไม่น้อยกว่าผู้ลงทะเบียน ACTIVE ปัจจุบัน (3 คน)', fields: {} } }]);
    const onNavigate = open(editPath);
    await screen.findByRole('heading', { name: 'แก้ไขกิจกรรม' });
    fireEvent.change(field('ชื่อกิจกรรม'), { target: { value: 'ชื่อที่พิมพ์ไว้' } });
    fireEvent.change(field('จำนวนที่นั่ง'), { target: { value: '2' } });
    fireEvent.click(saveButton());
    expect((await screen.findByRole('alert')).textContent).toContain('จำนวนที่นั่งต้องไม่น้อยกว่าผู้ลงทะเบียน ACTIVE ปัจจุบัน (3 คน)');
    await screen.findByText('มีผู้ลงทะเบียน ACTIVE 3 คน ตั้งได้ไม่ต่ำกว่า 3');
    expect(field('ชื่อกิจกรรม').value).toBe('ชื่อที่พิมพ์ไว้');
    expect(field('จำนวนที่นั่ง').value).toBe('2');
    expect(onNavigate).not.toHaveBeenCalled();
    expect(calls.filter(c => c.method === 'PATCH')).toHaveLength(1);
    expect(calls.filter(c => c.method === 'GET' && c.path === `/api${detailPath}`).length).toBeGreaterThanOrEqual(2);
  });

  it('shows client and server (400) field errors in Thai under the input', async () => {
    const calls = server([ok(ownerEvent())], () => [400, { error: { code: 'INVALID_INPUT', message: 'ข้อมูลไม่ถูกต้อง', fields: { location: ['กรุณากรอก 1–200 ตัวอักษร'] } } }]);
    open(editPath);
    await screen.findByRole('heading', { name: 'แก้ไขกิจกรรม' });
    fireEvent.change(field('ชื่อกิจกรรม'), { target: { value: '   ' } });
    fireEvent.click(saveButton());
    expect(await screen.findByText('กรุณากรอก 1–120 ตัวอักษร')).toBeTruthy();
    expect(calls.filter(c => c.method === 'PATCH')).toHaveLength(0);
    fireEvent.change(field('ชื่อกิจกรรม'), { target: { value: 'กิจกรรมเดิม' } });
    fireEvent.change(field('สถานที่'), { target: { value: 'ที่ใหม่' } });
    fireEvent.click(saveButton());
    expect(await screen.findByText('กรุณากรอก 1–200 ตัวอักษร')).toBeTruthy();
  });

  it('CLOSED has no edit form; 404 and Participant are refused like owner routes', async () => {
    server([ok(ownerEvent({ status: 'CLOSED' }))]);
    open(editPath);
    expect(await screen.findByText('กิจกรรมนี้ปิดแล้ว แก้ไขไม่ได้')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'บันทึกการแก้ไข' })).toBeNull();
    cleanup();
    server([[404, { error: { code: 'EVENT_NOT_FOUND', message: 'ไม่พบกิจกรรมนี้', fields: {} } }]]);
    open(editPath);
    expect(await screen.findByText(/ไม่พบกิจกรรมนี้/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'บันทึกการแก้ไข' })).toBeNull();
    cleanup();
    server([ok(ownerEvent())]);
    open(editPath, participant);
    expect(screen.getByRole('heading', { name: 'ไม่มีสิทธิ์ใช้งาน' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'บันทึกการแก้ไข' })).toBeNull();
  });
});
