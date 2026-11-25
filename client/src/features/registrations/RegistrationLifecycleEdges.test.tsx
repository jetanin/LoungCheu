// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LifecycleMutation } from './LifecycleMutation';
import { MyRegistrations } from './RegistrationViews';
import { RegistrationAction, type RegistrationActionProps } from './RegistrationAction';
import { EventPage } from '../events/EventPage';

const identity = { id: 'participant-a', display_name: 'Participant A', role: 'PARTICIPANT' as const };
const organizer = { id: 'organizer-a', display_name: 'Organizer A', role: 'ORGANIZER' as const };
const event = { id: 'event-a', title: 'Private lifecycle workshop', description: 'Synthetic fixture', location: 'Bangkok',
  status: 'PUBLISHED' as const, capacity: 1, active_count: 1, available_seats: 0, registration_open: false,
  starts_at: '2099-01-01T03:00:00.000Z', ends_at: '2099-01-01T04:00:00.000Z', registration_closes_at: '2099-01-01T02:00:00.000Z' };
const record = { id: 'private-reference-a', status: 'ACTIVE' as const, registered_at: '2026-11-24T03:00:00.000Z', cancelled_at: null, event };
const cancelled = { ...record, status: 'CANCELLED' as const, cancelled_at: '2026-11-24T04:00:00.000Z' };
const ownerEvent = { ...event, organizer_id: organizer.id, created_at: record.registered_at, updated_at: record.registered_at };
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ data }) });
const failure = (status: number, message = 'คำขอถูกปฏิเสธ') => ({ ok: false, status,
  json: async () => ({ error: { code: status === 401 ? 'AUTH_REQUIRED' : 'REGISTRATION_CLOSED', message, fields: {} } }) });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(complete => { resolve = complete; });
  return { promise, resolve };
}
function actionProps(): RegistrationActionProps {
  return { event: { ...event, registration_open: true, available_seats: 1 }, identity,
    getCsrfToken: vi.fn().mockResolvedValue('csrf'), refreshEvent: vi.fn().mockResolvedValue(undefined), onAuthRequired: vi.fn() };
}
beforeEach(() => { vi.spyOn(window, 'confirm').mockReturnValue(true); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe.each([
  { name: 'cancel', path: `/my/registrations/${record.id}/cancel`, label: 'ยกเลิกการลงทะเบียน' },
  { name: 'close', path: `/organizer/events/${event.id}/close`, label: 'ปิดรับกิจกรรม' },
])('TEST-43 $name mutation edges', ({ path, label }) => {
  function setup() {
    const props = { path, label, busyLabel: 'กำลังบันทึก…', confirmation: 'ยืนยัน?', visible: true,
      onSuccess: vi.fn(), refresh: vi.fn().mockResolvedValue(true), onAuthRequired: vi.fn(), onDenied: vi.fn() };
    render(<LifecycleMutation {...props}/>);
    return props;
  }

  it('keeps the action busy until the pending response and sends only one POST', async () => {
    const pending = deferred<ReturnType<typeof ok>>();
    const fetch = vi.fn((url: string) => url === '/api/auth/csrf' ? Promise.resolve(ok({ csrf_token: 'csrf' })) : pending.promise);
    vi.stubGlobal('fetch', fetch);
    const props = setup();
    fireEvent.click(screen.getByRole('button', { name: label }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    const busy = screen.getByRole('button', { name: 'กำลังบันทึก…' }) as HTMLButtonElement;
    expect(busy.disabled).toBe(true); fireEvent.click(busy);
    expect(fetch).toHaveBeenCalledTimes(2);
    await act(async () => { pending.resolve(ok({ saved: true })); });
    expect(props.onSuccess).toHaveBeenCalledExactlyOnceWith({ saved: true });
    expect(window.confirm).toHaveBeenCalledTimes(1);
  });

  it('does not send a mutation when CSRF bootstrap fails, and leaves retry available', async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new TypeError('offline')).mockResolvedValue(ok({ csrf_token: 'csrf' }));
    vi.stubGlobal('fetch', fetch); setup();
    fireEvent.click(screen.getByRole('button', { name: label }));
    expect((await screen.findByRole('alert')).textContent).toContain('เชื่อมต่อไม่สำเร็จ');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect((screen.getByRole('button', { name: label }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByRole('button', { name: 'ตรวจสถานะล่าสุด' })).toBeNull();
  });

  it.each(['network', 'timeout'])('requires a successful status read after %s uncertainty without replaying POST', async mode => {
    const fetch = vi.fn((url: string, init?: RequestInit) => {
      if (url === '/api/auth/csrf') return Promise.resolve(ok({ csrf_token: 'csrf' }));
      if (mode === 'network') return Promise.reject(new TypeError('connection lost after send'));
      return new Promise((_resolve, reject) => init!.signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))));
    });
    vi.stubGlobal('fetch', fetch);
    const props = setup();
    if (mode === 'timeout') vi.useFakeTimers();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: label })); });
    if (mode === 'timeout') {
      await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
      vi.useRealTimers();
    }
    expect((await screen.findByRole('alert')).textContent).toContain('คำขออาจบันทึกแล้ว');
    const mutation = screen.getByRole('button', { name: label }) as HTMLButtonElement;
    expect(mutation.disabled).toBe(true);
    fireEvent.click(mutation);
    expect(fetch).toHaveBeenCalledTimes(2);
    props.refresh.mockResolvedValueOnce(false);
    fireEvent.click(screen.getByRole('button', { name: 'ตรวจสถานะล่าสุด' }));
    await waitFor(() => expect(props.refresh).toHaveBeenCalledTimes(1));
    await waitFor(() => expect((screen.getByRole('button', { name: 'ตรวจสถานะล่าสุด' }) as HTMLButtonElement).disabled).toBe(false));
    expect(mutation.disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'ตรวจสถานะล่าสุด' }));
    await waitFor(() => expect(mutation.disabled).toBe(false));
    expect(fetch).toHaveBeenCalledTimes(2); // Successful read never replays a write.
    expect(props.onSuccess).not.toHaveBeenCalled();
  });
});

describe('TEST-43 integrated mutation rejections', () => {
  it.each([401, 403, 404])('cancel %s clears private detail and disables further mutation', async status => {
    const onAuthRequired = vi.fn();
    const fetch = vi.fn((url: string) => Promise.resolve(url === '/api/auth/csrf' ? ok({ csrf_token: 'csrf' })
      : url.endsWith('/cancel') ? failure(status) : ok(record)));
    vi.stubGlobal('fetch', fetch);
    render(<MyRegistrations id={record.id} identity={identity} onAuthRequired={onAuthRequired}/>);
    fireEvent.click(await screen.findByRole('button', { name: 'ยกเลิกการลงทะเบียน' }));
    await waitFor(() => expect(screen.queryByText(record.id)).toBeNull());
    expect(screen.queryByRole('button', { name: 'ยกเลิกการลงทะเบียน' })).toBeNull();
    expect(onAuthRequired).toHaveBeenCalledTimes(status === 401 ? 1 : 0);
    if (status !== 401) expect(screen.getByRole('alert').textContent).toContain('คำขอถูกปฏิเสธ');
  });

  it.each([401, 403, 404])('close %s clears owner detail and disables further mutation', async status => {
    const onAuthRequired = vi.fn();
    vi.stubGlobal('fetch', vi.fn((url: string) => Promise.resolve(url === '/api/auth/csrf' ? ok({ csrf_token: 'csrf' })
      : url.endsWith('/close') ? failure(status) : ok(ownerEvent))));
    render(<EventPage path={`/organizer/events/${event.id}`} identity={organizer} onAuthRequired={onAuthRequired} onNavigate={vi.fn()}/>);
    fireEvent.click(await screen.findByRole('button', { name: 'ปิดรับกิจกรรม' }));
    await waitFor(() => expect(screen.queryByRole('heading', { name: event.title })).toBeNull());
    expect(screen.queryByRole('button', { name: 'ปิดรับกิจกรรม' })).toBeNull();
    expect(onAuthRequired).toHaveBeenCalledTimes(status === 401 ? 1 : 0);
  });

  it('cancel 409 refreshes to CLOSED while retaining the rejection message', async () => {
    let reads = 0;
    const fetch = vi.fn((url: string) => Promise.resolve(url === '/api/auth/csrf' ? ok({ csrf_token: 'csrf' })
      : url.endsWith('/cancel') ? failure(409, 'กิจกรรมนี้ปิดรับลงทะเบียนแล้ว')
      : ok(++reads === 1 ? record : { ...record, event: { ...event, status: 'CLOSED' } })));
    vi.stubGlobal('fetch', fetch);
    render(<MyRegistrations id={record.id} identity={identity} onAuthRequired={vi.fn()}/>);
    fireEvent.click(await screen.findByRole('button', { name: 'ยกเลิกการลงทะเบียน' }));
    await screen.findByText('CLOSED');
    expect(screen.getByRole('alert').textContent).toContain('กิจกรรมนี้ปิดรับลงทะเบียนแล้ว');
    expect(screen.queryByRole('button', { name: 'ยกเลิกการลงทะเบียน' })).toBeNull();
    expect(reads).toBe(2);
  });

  it('close 409 refreshes owner status while retaining the rejection message', async () => {
    let reads = 0;
    vi.stubGlobal('fetch', vi.fn((url: string) => Promise.resolve(url === '/api/auth/csrf' ? ok({ csrf_token: 'csrf' })
      : url.endsWith('/close') ? failure(409, 'ไม่สามารถเปลี่ยนสถานะกิจกรรมได้')
      : ok(++reads === 1 ? ownerEvent : { ...ownerEvent, status: 'CLOSED' }))));
    render(<EventPage path={`/organizer/events/${event.id}`} identity={organizer} onAuthRequired={vi.fn()} onNavigate={vi.fn()}/>);
    fireEvent.click(await screen.findByRole('button', { name: 'ปิดรับกิจกรรม' }));
    await screen.findByText('CLOSED');
    expect(screen.getByRole('alert').textContent).toContain('ไม่สามารถเปลี่ยนสถานะกิจกรรมได้');
    expect(screen.queryByRole('button', { name: 'ปิดรับกิจกรรม' })).toBeNull();
    expect(reads).toBe(2);
  });
});

describe('TEST-43 own-registration lookup and stale responses', () => {
  it('retries a failed own lookup and uses the cancelled record instead of a first-registration action', async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(ok([cancelled]));
    vi.stubGlobal('fetch', fetch);
    render(<RegistrationAction {...actionProps()}/>);
    fireEvent.click(await screen.findByRole('button', { name: 'ลองใหม่' }));
    await screen.findByRole('button', { name: 'ลงทะเบียนใหม่' });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('button', { name: /^ลงทะเบียน$/ })).toBeNull();
  });

  it.each(['account', 'event'])('ignores old own lookup after changing %s, including a late 401', async change => {
    const stale = deferred<ReturnType<typeof failure>>();
    const fetch = vi.fn().mockReturnValueOnce(stale.promise).mockResolvedValueOnce(ok([]));
    vi.stubGlobal('fetch', fetch);
    const props = actionProps();
    const view = render(<RegistrationAction {...props}/>);
    view.rerender(<RegistrationAction {...props}
      identity={change === 'account' ? { ...identity, id: 'participant-b' } : identity}
      event={change === 'event' ? { ...props.event, id: 'event-b' } : props.event}/>);
    await waitFor(() => expect((screen.getByRole('button', { name: /^ลงทะเบียน$/ }) as HTMLButtonElement).disabled).toBe(false));
    await act(async () => { stale.resolve(failure(401)); });
    expect(props.onAuthRequired).not.toHaveBeenCalled();
    expect((screen.getByRole('button', { name: /^ลงทะเบียน$/ }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it.each(['account', 'event'])('ignores a late private ACTIVE record after changing %s', async change => {
    const stale = deferred<ReturnType<typeof ok>>();
    vi.stubGlobal('fetch', vi.fn().mockReturnValueOnce(stale.promise).mockResolvedValueOnce(ok([])));
    const props = actionProps();
    const view = render(<RegistrationAction {...props}/>);
    view.rerender(<RegistrationAction {...props}
      identity={change === 'account' ? { ...identity, id: 'participant-b' } : identity}
      event={change === 'event' ? { ...props.event, id: 'event-b' } : props.event}/>);
    await waitFor(() => expect((screen.getByRole('button', { name: /^ลงทะเบียน$/ }) as HTMLButtonElement).disabled).toBe(false));
    await act(async () => { stale.resolve(ok([record])); });
    expect(screen.queryByText(/คุณลงทะเบียนกิจกรรมนี้แล้ว/)).toBeNull();
    expect((screen.getByRole('button', { name: /^ลงทะเบียน$/ }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('ignores an older ACTIVE lookup after a newer focus read returns CANCELLED', async () => {
    const stale = deferred<ReturnType<typeof ok>>();
    vi.stubGlobal('fetch', vi.fn().mockReturnValueOnce(stale.promise).mockResolvedValueOnce(ok([cancelled])));
    render(<RegistrationAction {...actionProps()}/>);
    fireEvent.focus(window);
    await screen.findByRole('button', { name: 'ลงทะเบียนใหม่' });
    await act(async () => { stale.resolve(ok([record])); });
    expect((screen.getByRole('button', { name: 'ลงทะเบียนใหม่' }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByText(/คุณลงทะเบียนกิจกรรมนี้แล้ว/)).toBeNull();
  });

  it('a focus lookup 401 blocks a later mutation success from restoring private data', async () => {
    const mutation = deferred<ReturnType<typeof ok>>();
    let reads = 0;
    const props = actionProps();
    const fetch = vi.fn((url: string) => url === '/api/my/registrations'
      ? Promise.resolve(++reads === 1 ? ok([cancelled]) : failure(401)) : mutation.promise);
    vi.stubGlobal('fetch', fetch);
    render(<RegistrationAction {...props}/>);
    fireEvent.click(await screen.findByRole('button', { name: 'ลงทะเบียนใหม่' }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(`/api/events/${event.id}/registrations`, expect.objectContaining({ method: 'POST' })));
    fireEvent.focus(window);
    await waitFor(() => expect(props.onAuthRequired).toHaveBeenCalledTimes(1));
    await act(async () => { mutation.resolve(ok({ id: record.id, event_id: event.id, status: 'ACTIVE', registered_at: record.registered_at, cancelled_at: null })); });
    expect(screen.queryByText(record.id)).toBeNull();
    expect(screen.queryByText(/ลงทะเบียนสำเร็จ/)).toBeNull();
    expect((screen.getByRole('button', { name: /^ลงทะเบียน$/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(props.refreshEvent).not.toHaveBeenCalled();
  });

  it('a focus lookup 401 removes an already displayed private success reference', async () => {
    let reads = 0;
    const props = actionProps();
    vi.stubGlobal('fetch', vi.fn((url: string) => Promise.resolve(url === '/api/my/registrations'
      ? ++reads === 1 ? ok([cancelled]) : failure(401)
      : ok({ id: record.id, event_id: event.id, status: 'ACTIVE', registered_at: record.registered_at, cancelled_at: null }))));
    render(<RegistrationAction {...props}/>);
    fireEvent.click(await screen.findByRole('button', { name: 'ลงทะเบียนใหม่' }));
    await screen.findByText(record.id);
    fireEvent.focus(window);
    await waitFor(() => expect(props.onAuthRequired).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(record.id)).toBeNull();
    expect(screen.queryByText(/ลงทะเบียนสำเร็จ/)).toBeNull();
    expect((screen.getByRole('button', { name: /^ลงทะเบียน$/ }) as HTMLButtonElement).disabled).toBe(true);
  });
});
