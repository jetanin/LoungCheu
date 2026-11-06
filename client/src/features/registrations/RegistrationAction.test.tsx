// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RegistrationAction, type RegistrationActionProps } from './RegistrationAction.js';

const eventId = '22222222-2222-4222-8222-222222222222';
const result = { id: 'registration-reference', event_id: eventId, status: 'ACTIVE', registered_at: '2026-11-06T03:00:00.000Z' };
function props(): RegistrationActionProps {
  return {
    event: { id: eventId, registration_open: true, available_seats: 1 },
    identity: { id: 'participant-a', role: 'PARTICIPANT' },
    getCsrfToken: vi.fn().mockResolvedValue('csrf-token'),
    refreshEvent: vi.fn().mockResolvedValue(undefined), onAuthRequired: vi.fn(),
  };
}
function reply(ok: boolean, payload: unknown) { return { ok, json: async () => payload }; }
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('F-03 registration UI', () => {
  it('submits only event reference/empty input, disables repeat clicks, and displays reference', async () => {
    let resolve!: (value: unknown) => void;
    const fetchMock = vi.fn().mockReturnValue(new Promise((r) => { resolve = r; }));
    vi.stubGlobal('fetch', fetchMock);
    render(<RegistrationAction {...props()} />);
    const button = screen.getByRole('button', { name: 'ลงทะเบียน' });
    fireEvent.click(button);
    fireEvent.click(button);
    expect((button as HTMLButtonElement).disabled).toBe(true);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(`/api/events/${eventId}/registrations`, expect.objectContaining({
      method: 'POST', credentials: 'same-origin', body: '{}',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'csrf-token' },
    }));
    await act(async () => resolve(reply(true, { data: result })));
    expect(screen.getByText(result.id)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'ดูรายการของฉัน' }).getAttribute('href')).toBe('/my/registrations');
  });
  it.each(['EVENT_FULL', 'REGISTRATION_CLOSED', 'ALREADY_REGISTERED'])('explains %s and refreshes availability', async (code) => {
    const options = props();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(false, { error: { code } })));
    render(<RegistrationAction {...options} />);
    fireEvent.click(screen.getByRole('button', { name: 'ลงทะเบียน' }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    await waitFor(() => expect(options.refreshEvent).toHaveBeenCalledTimes(1));
  });
  it('requires checking own records before retrying an uncertain network result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network failed')));
    render(<RegistrationAction {...props()} />);
    fireEvent.click(screen.getByRole('button', { name: 'ลงทะเบียน' }));
    expect((await screen.findByRole('alert')).textContent).toContain('คำขออาจบันทึกแล้ว');
    expect((screen.getByRole('button', { name: 'ลงทะเบียน' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole('link', { name: 'ตรวจรายการของฉัน' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'ตรวจแล้ว ลองลงทะเบียนอีกครั้ง' }));
    expect((screen.getByRole('button', { name: 'ลงทะเบียน' }) as HTMLButtonElement).disabled).toBe(false);
  });
  it('handles expired authentication and blocks further submissions', async () => {
    const options = props();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(false, { error: { code: 'AUTH_REQUIRED' } })));
    render(<RegistrationAction {...options} />);
    fireEvent.click(screen.getByRole('button', { name: 'ลงทะเบียน' }));
    await waitFor(() => expect(options.onAuthRequired).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('link', { name: 'เข้าสู่ระบบ' })).toBeTruthy();
    expect((screen.getByRole('button', { name: 'ลงทะเบียน' }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('treats request timeout as uncertain instead of automatically retrying', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((_path: string, options: RequestInit) => new Promise((_resolve, reject) => {
      options.signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    }));
    vi.stubGlobal('fetch', fetchMock);
    render(<RegistrationAction {...props()} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'ลงทะเบียน' })); });
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(screen.getByRole('alert').textContent).toContain('คำขออาจบันทึกแล้ว');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('does not send a mutation when CSRF bootstrap fails', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<RegistrationAction {...props()} getCsrfToken={vi.fn().mockRejectedValue(new TypeError('offline'))} />);
    fireEvent.click(screen.getByRole('button', { name: 'ลงทะเบียน' }));
    expect((await screen.findByRole('alert')).textContent).toBe('เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('clears private success on account change', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(true, { data: result })));
    const options = props();
    const view = render(<RegistrationAction {...options} />);
    fireEvent.click(screen.getByRole('button', { name: 'ลงทะเบียน' }));
    await screen.findByText(result.id);
    view.rerender(<RegistrationAction {...options} identity={{ id: 'participant-b', role: 'PARTICIPANT' }} />);
    expect(screen.queryByText(result.id)).toBeNull();
    expect(screen.getByRole('button', { name: 'ลงทะเบียน' })).toBeTruthy();
  });
  it('ignores a pending response after changing account', async () => {
    let resolve!: (value: unknown) => void;
    const fetchMock = vi.fn().mockReturnValue(new Promise((r) => { resolve = r; }));
    vi.stubGlobal('fetch', fetchMock);
    const options = props();
    const view = render(<RegistrationAction {...options} />);
    fireEvent.click(screen.getByRole('button', { name: 'ลงทะเบียน' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    view.rerender(<RegistrationAction {...options} identity={{ id: 'participant-b', role: 'PARTICIPANT' }} />);
    await act(async () => resolve(reply(true, { data: result })));
    expect(screen.queryByText(result.id)).toBeNull();
  });
  it('disables closed events and excludes organizer registration controls', () => {
    const options = props();
    const view = render(<RegistrationAction {...options} event={{ ...options.event, registration_open: false }} />);
    expect((screen.getByRole('button', { name: 'ลงทะเบียน' }) as HTMLButtonElement).disabled).toBe(true);
    view.rerender(<RegistrationAction {...options} identity={{ id: 'organizer', role: 'ORGANIZER' }} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
