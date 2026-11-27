// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MyRegistrations, OrganizerRoster } from './RegistrationViews';
import { bangkokTime } from '../events/model';

// TEST-59 starts with existing public components; missing UI is the RED cause.
const now = '2026-11-06T06:00:00.000Z';
const participant = { id: 'participant-a', display_name: 'Participant A', role: 'PARTICIPANT' as const };
const organizer = { id: 'organizer-a', display_name: 'Organizer A', role: 'ORGANIZER' as const };
const event = { id: 'event-a', title: 'Attendance workshop', description: 'Synthetic component fixture', location: 'Test room',
  status: 'PUBLISHED' as const, organizer_id: organizer.id, capacity: 5, active_count: 1, available_seats: 4, registration_open: false,
  starts_at: '2026-11-06T05:00:00.000Z', ends_at: '2026-11-06T07:00:00.000Z', registration_closes_at: '2026-11-06T04:00:00.000Z',
  created_at: '2026-11-01T03:00:00.000Z', updated_at: '2026-11-01T03:00:00.000Z' };
const row = { id: 'registration-a', participant: { display_name: participant.display_name },
  status: 'ACTIVE' as 'ACTIVE' | 'CANCELLED', registered_at: '2026-11-06T03:00:00.000Z', checked_in_at: null as string | null };
const base = { event_id: event.id, capacity: 5, active_count: 1, checked_in_count: 0, registrations: [row] };
type RosterData = typeof base;
const own = { id: row.id, status: 'ACTIVE' as 'ACTIVE' | 'CANCELLED', registered_at: row.registered_at,
  cancelled_at: null as string | null, checked_in_at: null as string | null, event };
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ data: JSON.parse(JSON.stringify(data)) }) });
const failed = (status: number, code: string, message: string) => ({ ok: false, status,
  json: async () => ({ error: { code, message, fields: {} } }) });
type Reply = ReturnType<typeof ok> | ReturnType<typeof failed>;
const checkPath = `/api/organizer/events/${event.id}/registrations/${row.id}/check-in`;

function rosterMock(options: { data?: RosterData; onPost?: (data: RosterData) => Reply | Promise<Reply> } = {}) {
  let data = options.data ?? { ...base, registrations: [{ ...row }] };
  let reads = 0;
  const fetch = vi.fn(async (path: string, init?: RequestInit): Promise<Reply> => {
    if (path === '/api/auth/csrf') return ok({ csrf_token: 'synthetic-csrf' });
    if (path === `/api/organizer/events/${event.id}`) return ok(event);
    if (path === `/api/organizer/events/${event.id}/registrations`) { reads++; return ok(data); }
    if (path === checkPath && init?.method === 'POST') {
      if (options.onPost) return options.onPost(data);
      data = { ...data, checked_in_count: 1, registrations: [{ ...row, checked_in_at: now }] };
      return ok(data.registrations[0]);
    }
    throw new Error(`Unexpected attendance request: ${path}`);
  });
  vi.stubGlobal('fetch', fetch);
  return { fetch, reads: () => reads, posts: () => fetch.mock.calls.filter(([, init]) => init?.method === 'POST') };
}
function roster(onAuthRequired = vi.fn()) {
  return render(<OrganizerRoster eventId={event.id} identity={organizer} onAuthRequired={onAuthRequired}/>);
}
async function action() {
  return screen.findByRole('button', { name: 'เช็กชื่อ' });
}

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(now)); vi.spyOn(window, 'confirm').mockReturnValue(true); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('F-08 TEST-59 own attendance display', () => {
  it.each(['list', 'detail'])('renders checked-in time in own %s without organizer identity', async view => {
    const record = { ...own, checked_in_at: now };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok(view === 'list' ? [record] : record)));
    render(<MyRegistrations identity={participant} onAuthRequired={vi.fn()} id={view === 'detail' ? row.id : undefined}/>);
    const label = await screen.findByText(/^เช็กชื่อแล้วเมื่อ /);
    expect(label.textContent).toContain(bangkokTime(now));
    expect(screen.getByText('การเข้าร่วม', { selector: 'dt' })).toBeTruthy();
    expect(screen.queryByText(organizer.id)).toBeNull();
    expect(screen.queryByText('ยังไม่ได้เช็กชื่อ')).toBeNull();
  });
  it.each(['list', 'detail'])('renders required not-yet-checked status in own %s', async view => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok(view === 'list' ? [own] : own)));
    render(<MyRegistrations identity={participant} onAuthRequired={vi.fn()} id={view === 'detail' ? row.id : undefined}/>);
    expect(await screen.findByText('ยังไม่ได้เช็กชื่อ')).toBeTruthy();
    expect(screen.getByText('การเข้าร่วม', { selector: 'dt' })).toBeTruthy();
  });
  it.each(['list', 'detail'])('omits attendance for CANCELLED in own %s', async view => {
    const record = { ...own, status: 'CANCELLED', cancelled_at: '2026-11-06T03:30:00.000Z' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok(view === 'list' ? [record] : record)));
    render(<MyRegistrations identity={participant} onAuthRequired={vi.fn()} id={view === 'detail' ? row.id : undefined}/>);
    await screen.findByText('CANCELLED');
    expect(screen.queryByText('การเข้าร่วม', { selector: 'dt' })).toBeNull();
    expect(screen.queryByText('ยังไม่ได้เช็กชื่อ')).toBeNull();
  });
});

describe('F-08 TEST-59 organizer attendance actions', () => {
  it('renders attendance column and authoritative checked-in/ACTIVE counts', async () => {
    rosterMock(); roster();
    await screen.findByRole('columnheader', { name: 'การเข้าร่วม' });
    expect(screen.getByLabelText('รายชื่อผู้ลงทะเบียน').textContent).toContain('เช็กชื่อแล้ว 0 / ACTIVE 1 คน');
    expect(await action()).toBeTruthy();
  });
  it.each([false, true])('confirms the participant name before mutation (accepted=%s)', async accepted => {
    vi.mocked(window.confirm).mockReturnValue(accepted);
    const mock = rosterMock(); roster();
    fireEvent.click(await action());
    expect(window.confirm).toHaveBeenCalledExactlyOnceWith(`ยืนยันเช็กชื่อ ${participant.display_name}?`);
    if (accepted) {
      await screen.findByText(`เช็กชื่อแล้ว ${bangkokTime(now)}`);
      expect(mock.posts()).toHaveLength(1);
      expect(mock.posts()[0]).toEqual([checkPath, expect.objectContaining({ credentials: 'same-origin', body: '{}',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'synthetic-csrf' } })]);
      await waitFor(() => expect(mock.reads()).toBeGreaterThanOrEqual(2));
      expect(screen.getByLabelText('รายชื่อผู้ลงทะเบียน').textContent).toContain('เช็กชื่อแล้ว 1 / ACTIVE 1 คน');
    } else { expect(mock.posts()).toHaveLength(0); expect(mock.reads()).toBe(1); }
  });
  it('disables the pending row and sends one request even after a second click', async () => {
    let finish!: (value: Reply) => void;
    const pending = new Promise<Reply>(resolve => { finish = resolve; });
    const mock = rosterMock({ onPost: () => pending }); roster();
    fireEvent.click(await action());
    const busy = await screen.findByRole('button', { name: 'กำลังเช็กชื่อ…' });
    expect((busy as HTMLButtonElement).disabled).toBe(true); fireEvent.click(busy);
    await waitFor(() => expect(mock.posts()).toHaveLength(1));
    await act(async () => { finish(ok({ ...row, checked_in_at: now })); });
    expect(mock.posts()).toHaveLength(1); expect(window.confirm).toHaveBeenCalledTimes(1);
  });
  it.each([Date.parse(event.starts_at) - 1, Date.parse(event.ends_at) + 1])('does not offer check-in outside the window (%s)', async at => {
    vi.setSystemTime(at); rosterMock(); roster();
    await screen.findByRole('columnheader', { name: 'การเข้าร่วม' });
    expect(screen.queryByRole('button', { name: 'เช็กชื่อ' })).toBeNull();
    const hint = screen.getByText(/^เช็กชื่อได้ระหว่าง /);
    expect(hint.textContent).toContain(bangkokTime(event.starts_at)); expect(hint.textContent).toContain(bangkokTime(event.ends_at));
  });
  it('shows a dash for CANCELLED and no action', async () => {
    rosterMock({ data: { ...base, active_count: 0, registrations: [{ ...row, status: 'CANCELLED' }] } }); roster();
    await screen.findByRole('columnheader', { name: 'การเข้าร่วม' });
    const record = screen.getByRole('row', { name: /Participant A/ });
    expect(within(record).getByRole('cell', { name: '—' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'เช็กชื่อ' })).toBeNull();
  });
  it('shows a previously checked-in row without another action', async () => {
    rosterMock({ data: { ...base, checked_in_count: 1, registrations: [{ ...row, checked_in_at: now }] } }); roster();
    expect(await screen.findByText(`เช็กชื่อแล้ว ${bangkokTime(now)}`)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'เช็กชื่อ' })).toBeNull();
  });
  it.each([
    ['CHECK_IN_NOT_OPEN', 'เช็กชื่อได้เฉพาะระหว่างเวลาเริ่มถึงเวลาสิ้นสุดกิจกรรม'],
    ['REGISTRATION_NOT_ACTIVE', 'รายการนี้ถูกยกเลิกแล้ว เช็กชื่อไม่ได้'],
    ['ALREADY_CHECKED_IN', 'ผู้เข้าร่วมคนนี้เช็กชื่อแล้ว'],
  ])('shows %s in Thai and reloads authoritative roster', async (code, message) => {
    const mock = rosterMock({ onPost: () => failed(409, code, message) }); roster();
    fireEvent.click(await action());
    expect((await screen.findByRole('alert')).textContent).toContain(message);
    await waitFor(() => expect(mock.reads()).toBeGreaterThanOrEqual(2));
    expect(mock.posts()).toHaveLength(1);
  });
  it.each([401, 403, 404])('clears private roster when mutation is denied with %s', async status => {
    const onAuthRequired = vi.fn(), message = status === 401 ? 'กรุณาเข้าสู่ระบบ' : 'ไม่พบกิจกรรมนี้';
    rosterMock({ onPost: () => failed(status, status === 401 ? 'AUTH_REQUIRED' : 'EVENT_NOT_FOUND', message) }); roster(onAuthRequired);
    fireEvent.click(await action());
    await waitFor(() => expect(screen.queryByRole('cell', { name: participant.display_name })).toBeNull());
    expect(onAuthRequired).toHaveBeenCalledTimes(status === 401 ? 1 : 0);
    if (status !== 401) expect((await screen.findByRole('alert')).textContent).toContain(message);
  });
  it('never retries an uncertain POST timeout automatically and reconciles via explicit roster reload', async () => {
    const mock = rosterMock({ onPost: data => {
      data.checked_in_count = 1; data.registrations = [{ ...row, checked_in_at: now }];
      throw new DOMException('Timed out after send', 'AbortError');
    } }); roster();
    fireEvent.click(await action());
    expect((await screen.findByRole('alert')).textContent).toContain('ยังยืนยันผลไม่ได้ กรุณาโหลดรายชื่อใหม่ก่อนเช็กชื่อซ้ำ');
    expect(mock.posts()).toHaveLength(1); expect(mock.reads()).toBe(1);
    const retry = screen.queryByRole('button', { name: 'เช็กชื่อ' });
    if (retry) expect((retry as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'โหลดรายชื่อใหม่' }));
    await screen.findByText(`เช็กชื่อแล้ว ${bangkokTime(now)}`);
    expect(mock.posts()).toHaveLength(1); expect(mock.reads()).toBe(2);
  });
});
