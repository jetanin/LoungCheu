// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MyRegistrations, OrganizerRoster } from './RegistrationViews';
import { RegistrationAction } from './RegistrationAction';
import { EventPage } from '../events/EventPage';
import { bangkokTime } from '../events/model';

// TEST-43 component slice. All components already exist, so RED must be a
// missing user-visible behaviour, not a missing import or future prop type.
const now = new Date('2026-11-06T03:00:00.000Z');
const participant = { id: 'participant-a', display_name: 'Participant A', role: 'PARTICIPANT' as const };
const organizer = { id: 'organizer-a', display_name: 'Organizer A', role: 'ORGANIZER' as const };
const event = {
  id: 'event-a', title: 'Lifecycle workshop', description: 'Synthetic component fixture', location: 'Test room',
  capacity: 2, status: 'PUBLISHED' as const, active_count: 1, available_seats: 1, registration_open: true,
  starts_at: '2026-11-07T03:00:00.000Z', ends_at: '2026-11-07T06:00:00.000Z',
  registration_closes_at: '2026-11-06T04:00:00.000Z',
};
const ownerEvent = { ...event, organizer_id: organizer.id,
  created_at: '2026-11-01T03:00:00.000Z', updated_at: '2026-11-01T03:00:00.000Z' };
const active = { id: 'registration-a', status: 'ACTIVE' as const,
  registered_at: '2026-11-06T01:00:00.000Z', cancelled_at: null as string | null, event };
const cancelled = { ...active, status: 'CANCELLED' as const, cancelled_at: now.toISOString() };
const reply = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ data }) });

function actionProps() {
  return { event, identity: participant, getCsrfToken: vi.fn().mockResolvedValue('csrf-token'),
    refreshEvent: vi.fn().mockResolvedValue(undefined), onAuthRequired: vi.fn() };
}

beforeEach(() => {
  // Only Date is faked: RTL polling and mutation timers continue to run normally.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(now);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('F-06 TEST-43 / initial UI RED slice', () => {
  it('uses the first-registration label in own records without changing its timestamp', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply([active])));
    render(<MyRegistrations identity={participant} onAuthRequired={vi.fn()}/>);
    await screen.findByRole('link', { name: event.title });
    const label = screen.getByText('ลงทะเบียนครั้งแรกเมื่อ', { selector: 'dt' });
    expect(label.nextElementSibling?.textContent).toBe(bangkokTime(active.registered_at));
    expect(screen.queryByText('ลงทะเบียนเมื่อ', { selector: 'dt' })).toBeNull();
  });

  it('uses the same first-registration label in the organizer roster', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply({ event_id: event.id, capacity: 2, active_count: 1,
      registrations: [{ id: active.id, participant: { display_name: participant.display_name },
        status: 'ACTIVE', registered_at: active.registered_at }] })));
    render(<OrganizerRoster identity={organizer} eventId={event.id} onAuthRequired={vi.fn()}/>);
    await screen.findByRole('cell', { name: participant.display_name });
    expect(screen.getByRole('columnheader', { name: 'ลงทะเบียนครั้งแรกเมื่อ' })).toBeTruthy();
    expect(screen.getByRole('cell', { name: bangkokTime(active.registered_at) })).toBeTruthy();
  });

  it.each([false, true])('cancel asks for confirmation (accepted=%s) and never sends a duplicate mutation', async accepted => {
    let current: typeof active | typeof cancelled = active;
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(accepted);
    const fetch = vi.fn(async (path: string, init?: RequestInit) => {
      if (path === '/api/auth/csrf') return reply({ csrf_token: 'csrf-token' });
      if (path === `/api/my/registrations/${active.id}/cancel` && init?.method === 'POST') {
        current = cancelled;
        return reply(current);
      }
      if (path === `/api/my/registrations/${active.id}`) return reply(current);
      throw new Error(`Unexpected request: ${path}`);
    });
    vi.stubGlobal('fetch', fetch);
    render(<MyRegistrations id={active.id} identity={participant} onAuthRequired={vi.fn()}/>);
    await screen.findByRole('heading', { name: event.title });
    const button = screen.getByRole('button', { name: 'ยกเลิกการลงทะเบียน' });
    fireEvent.click(button);
    if (accepted) {
      expect((button as HTMLButtonElement).disabled).toBe(true);
      fireEvent.click(button);
    }
    expect(confirm).toHaveBeenCalledTimes(1);
    if (accepted) {
      await screen.findByText('CANCELLED');
      const mutations = fetch.mock.calls.filter(([, init]) => init?.method === 'POST');
      expect(mutations).toHaveLength(1);
      expect(mutations[0]).toEqual([`/api/my/registrations/${active.id}/cancel`, expect.objectContaining({
        body: '{}', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'csrf-token' },
      })]);
      expect(screen.queryByRole('button', { name: 'ยกเลิกการลงทะเบียน' })).toBeNull();
    } else {
      expect(fetch.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(0);
      expect(screen.getByText('ACTIVE')).toBeTruthy();
    }
  });

  it('shows the cancellation timestamp and retains the original reference on own detail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(cancelled)));
    render(<MyRegistrations id={active.id} identity={participant} onAuthRequired={vi.fn()}/>);
    await screen.findByText('CANCELLED');
    const label = screen.getByText('ยกเลิกเมื่อ', { selector: 'dt' });
    expect(label.nextElementSibling?.textContent).toBe(bangkokTime(cancelled.cancelled_at));
    expect(screen.getByText(active.id)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'ยกเลิกการลงทะเบียน' })).toBeNull();
  });

  it('looks up own registrations by event.id and re-registers using the existing endpoint', async () => {
    const options = actionProps();
    const fetch = vi.fn(async (path: string, init?: RequestInit) => {
      if (path === '/api/my/registrations') return reply([
        { ...active, id: 'unrelated-reference', event: { ...event, id: 'another-event' } }, cancelled,
      ]);
      if (path === `/api/events/${event.id}/registrations` && init?.method === 'POST') {
        return reply({ id: active.id, event_id: event.id, status: 'ACTIVE', registered_at: active.registered_at, cancelled_at: null });
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    vi.stubGlobal('fetch', fetch);
    render(<RegistrationAction {...options}/>);
    fireEvent.click(await screen.findByRole('button', { name: 'ลงทะเบียนใหม่' }));
    await screen.findByText(active.id);
    expect(fetch).toHaveBeenCalledWith('/api/my/registrations', expect.objectContaining({ credentials: 'same-origin' }));
    expect(fetch.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith(`/api/events/${event.id}/registrations`, expect.objectContaining({ method: 'POST', body: '{}' }));
    await waitFor(() => expect(options.refreshEvent).toHaveBeenCalled());
  });

  it('explains a cancelled registration on a full event instead of offering re-registration', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply([cancelled])));
    const options = actionProps();
    render(<RegistrationAction {...options} event={{ ...event, available_seats: 0, registration_open: false }}/>);
    expect(await screen.findByText('คุณยกเลิกการลงทะเบียนแล้ว ขณะนี้กิจกรรมเต็ม')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'ลงทะเบียนใหม่' })).toBeNull();
  });

  it('does not treat a failed own-registration lookup as permission to register', async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError('offline'));
    vi.stubGlobal('fetch', fetch);
    render(<RegistrationAction {...actionProps()}/>);
    expect(await screen.findByRole('button', { name: 'ลองใหม่' })).toBeTruthy();
    const registerButton = screen.queryByRole('button', { name: 'ลงทะเบียน' }) as HTMLButtonElement | null;
    expect(registerButton === null || registerButton.disabled).toBe(true);
    expect(fetch.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'POST')).toHaveLength(0);
  });

  it('closes a published owner event only after confirmation and displays CLOSED', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    let closed = false;
    const closedEvent = { ...ownerEvent, status: 'CLOSED', registration_open: false, updated_at: now.toISOString() };
    const fetch = vi.fn(async (path: string, init?: RequestInit) => {
      if (path === `/api/organizer/events/${event.id}`) return reply(closed ? closedEvent : ownerEvent);
      if (path === '/api/auth/csrf') return reply({ csrf_token: 'csrf-token' });
      if (path === `/api/organizer/events/${event.id}/close` && init?.method === 'POST') {
        closed = true;
        return reply(closedEvent);
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    vi.stubGlobal('fetch', fetch);
    render(<EventPage path={`/organizer/events/${event.id}`} identity={organizer}
      onAuthRequired={vi.fn()} onNavigate={vi.fn()}/>);
    await screen.findByRole('heading', { name: event.title });
    fireEvent.click(screen.getByRole('button', { name: 'ปิดรับกิจกรรม' }));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('เปิดกลับไม่ได้'));
    await screen.findByText('CLOSED');
    expect(screen.queryByRole('button', { name: 'ปิดรับกิจกรรม' })).toBeNull();
    expect(fetch.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1);
  });

  it.each(['DRAFT', 'CLOSED'] as const)('does not offer close for an owner event in %s', async status => {
    const fetch = vi.fn().mockResolvedValue(reply({ ...ownerEvent, status, registration_open: false }));
    vi.stubGlobal('fetch', fetch);
    render(<EventPage path={`/organizer/events/${event.id}`} identity={organizer}
      onAuthRequired={vi.fn()} onNavigate={vi.fn()}/>);
    await screen.findByRole('heading', { name: event.title });
    expect(screen.queryByRole('button', { name: 'ปิดรับกิจกรรม' })).toBeNull();
    expect(fetch.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'POST')).toHaveLength(0);
  });
});
