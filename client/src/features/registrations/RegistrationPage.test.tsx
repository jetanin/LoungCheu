// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RegistrationPage } from './RegistrationPage.js';

const eventId = '22222222-2222-4222-8222-222222222222';
const event = { id: eventId, title: 'กิจกรรมทดสอบ', location: 'มหาวิทยาลัย', starts_at: '2026-11-06T05:00:00.000Z', registration_closes_at: '2026-11-06T04:00:00.000Z', registration_open: true, available_seats: 1 };
const identity = { id: 'participant-a', role: 'PARTICIPANT' };
function reply(ok: boolean, payload: unknown) { return { ok, json: async () => payload }; }
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('Vite registration page integration adapter', () => {
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
  it('retries failed reads without exposing stale private data', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(reply(true, { data: event }));
    vi.stubGlobal('fetch', fetchMock);
    render(<RegistrationPage eventId={eventId} identity={{ id: identity.id, role: 'PARTICIPANT' }} onAuthRequired={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'ลองใหม่' }));
    expect(await screen.findByText(event.title)).toBeTruthy();
  });
});
