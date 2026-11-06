// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RegistrationPage } from './RegistrationPage.js';

const eventId = '22222222-2222-4222-8222-222222222222';
const event = { id: eventId, title: 'กิจกรรมทดสอบ', location: 'มหาวิทยาลัย', starts_at: '2026-11-06T05:00:00.000Z', registration_closes_at: '2026-11-06T04:00:00.000Z', registration_open: true, available_seats: 1 };
const identity = { id: 'participant-a', role: 'PARTICIPANT' as const };
function reply(ok: boolean, payload: unknown) { return { ok, json: async () => payload }; }
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('Vite registration page integration adapter', () => {
  it.each(['success', 'network failure'])('retains timeout recovery through a focus refresh with %s', async (refreshOutcome) => {
    let eventReads = 0;
    let finishRefresh!: () => void;
    const fetchMock = vi.fn((path: string, options?: RequestInit) => {
      if (path === '/api/auth/csrf') return Promise.resolve(reply(true, { data: { csrf_token: 'test-token' } }));
      if (options?.method === 'POST') return new Promise((_resolve, reject) => {
        options.signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      });
      eventReads++;
      if (eventReads === 1) return Promise.resolve(reply(true, { data: event }));
      return new Promise((resolve, reject) => {
        finishRefresh = () => refreshOutcome === 'success'
          ? resolve(reply(true, { data: { ...event, available_seats: 2 } }))
          : reject(new TypeError('offline'));
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<RegistrationPage eventId={eventId} identity={identity} onAuthRequired={vi.fn()} />);
    await screen.findByText(event.title);
    vi.useFakeTimers();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'ลงทะเบียน' })); });
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    const submit = screen.getByRole('button', { name: 'ลงทะเบียน' }) as HTMLButtonElement;
    expect(screen.getByRole('alert').textContent).toContain('คำขออาจบันทึกแล้ว');
    await act(async () => { fireEvent.focus(window); });
    expect(eventReads).toBe(2);
    expect(screen.getByRole('button', { name: 'ลงทะเบียน' })).toBe(submit);
    expect(submit.disabled).toBe(true);
    expect(screen.getByRole('alert').textContent).toContain('คำขออาจบันทึกแล้ว');
    await act(async () => { finishRefresh(); });
    expect(screen.getByRole('button', { name: 'ลงทะเบียน' })).toBe(submit);
    expect(submit.disabled).toBe(true);
    expect(screen.getByRole('alert').textContent).toContain('คำขออาจบันทึกแล้ว');
    expect(screen.getByRole('link', { name: 'ตรวจรายการของฉัน' }).getAttribute('href')).toBe('/my/registrations');
    if (refreshOutcome === 'success') expect(screen.getByText('ที่นั่งว่าง 2 ที่ (ยืนยันเมื่อบันทึกสำเร็จ)')).toBeTruthy();
    fireEvent.click(submit);
    expect(fetchMock.mock.calls.filter(([, options]) => options?.method === 'POST')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'ตรวจแล้ว ลองลงทะเบียนอีกครั้ง' }));
    expect(submit.disabled).toBe(false);
    await act(async () => { fireEvent.click(submit); });
    expect(fetchMock.mock.calls.filter(([, options]) => options?.method === 'POST')).toHaveLength(2);
  });
  it('loads identity/event and retains rejection while refreshing availability', async () => {
    let eventReads = 0;
    vi.stubGlobal('fetch', vi.fn(async (path: string, options?: RequestInit) => {
      if (path === '/api/auth/me') return reply(true, { data: identity });
      if (path === '/api/auth/csrf') return reply(true, { data: { csrf_token: 'test-token' } });
      if (options?.method === 'POST') return reply(false, { error: { code: 'EVENT_FULL' } });
      eventReads++;
      return reply(true, { data: eventReads === 1 ? event : { ...event, available_seats: 0, registration_open: false } });
    }));
    render(<RegistrationPage eventId={eventId} identity={{ id: identity.id, role: 'PARTICIPANT' }} onAuthRequired={vi.fn()} />);
    expect(await screen.findByText(event.title)).toBeTruthy();
    expect(screen.getByText('เวลาประเทศไทย (Asia/Bangkok)')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'ลงทะเบียน' }));
    expect((await screen.findByRole('alert')).textContent).toBe('กิจกรรมเต็มแล้ว');
    await waitFor(() => expect((screen.getByRole('button', { name: 'ลงทะเบียน' }) as HTMLButtonElement).disabled).toBe(true));
    expect(screen.getByRole('alert').textContent).toBe('กิจกรรมเต็มแล้ว');
    expect(eventReads).toBe(2);
  });
  it('does not load event data when identity is unauthenticated', async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply(false, { error: { code: 'AUTH_REQUIRED' } }));
    vi.stubGlobal('fetch', fetchMock);
    const onAuthRequired = vi.fn();
    render(<RegistrationPage eventId={eventId} identity={{ id: identity.id, role: 'PARTICIPANT' }} onAuthRequired={onAuthRequired} />);
    expect(await screen.findByRole('link', { name: 'เข้าสู่ระบบ' })).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onAuthRequired).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'ลงทะเบียน' })).toBeNull();
  });
  it.each(['AUTH_REQUIRED', 'EVENT_NOT_FOUND'])('clears the form when a focus refresh returns %s', async (code) => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(reply(true, { data: event }))
      .mockResolvedValueOnce(reply(false, { error: { code } })));
    const onAuthRequired = vi.fn();
    render(<RegistrationPage eventId={eventId} identity={identity} onAuthRequired={onAuthRequired} />);
    await screen.findByText(event.title);
    fireEvent.focus(window);
    expect((await screen.findByRole('alert')).textContent).toContain(code === 'AUTH_REQUIRED' ? 'เข้าสู่ระบบ' : 'ไม่พบกิจกรรมนี้');
    expect(screen.queryByText(event.title)).toBeNull();
    expect(screen.queryByRole('button', { name: 'ลงทะเบียน' })).toBeNull();
    expect(onAuthRequired).toHaveBeenCalledTimes(code === 'AUTH_REQUIRED' ? 1 : 0);
  });
  it('retries failed reads without exposing stale private data', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(reply(true, { data: event }));
    vi.stubGlobal('fetch', fetchMock);
    render(<RegistrationPage eventId={eventId} identity={{ id: identity.id, role: 'PARTICIPANT' }} onAuthRequired={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'ลองใหม่' }));
    expect(await screen.findByText(event.title)).toBeTruthy();
  });
});
