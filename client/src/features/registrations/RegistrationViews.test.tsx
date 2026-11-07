// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MyRegistrations, OrganizerRoster } from './RegistrationViews';

const participant = { id: 'a', display_name: 'Alice', role: 'PARTICIPANT' as const };
const organizer = { id: 'owner', display_name: 'Owner', role: 'ORGANIZER' as const };
const record = { id: 'reference-a', status: 'ACTIVE', registered_at: '2026-11-07T03:00:00.000Z', event: {
  id: 'event', title: 'Private workshop', location: 'Campus', starts_at: '2026-11-08T03:00:00.000Z',
  ends_at: '2026-11-08T04:00:00.000Z', registration_closes_at: '2026-11-08T02:00:00.000Z', status: 'PUBLISHED',
} };
const reply = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ data }) });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('TEST-25: shows loading/empty and retries failure without stale records', async () => {
  const fetch = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(reply([]));
  vi.stubGlobal('fetch', fetch);
  render(<MyRegistrations identity={participant} onAuthRequired={vi.fn()}/>);
  expect(screen.getByRole('status').textContent).toContain('กำลังโหลด');
  fireEvent.click(await screen.findByRole('button', { name: 'ลองใหม่' }));
  expect(await screen.findByText('ยังไม่มีรายการลงทะเบียน')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'เลือกกิจกรรม' }).getAttribute('href')).toBe('/events');
});
it('TEST-22/24: links own list to detail and renders reference/Bangkok time', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(reply([record])).mockResolvedValueOnce(reply(record)));
  const props = { identity: participant, onAuthRequired: vi.fn() };
  const view = render(<MyRegistrations {...props}/>);
  expect((await screen.findByRole('link', { name: record.event.title })).getAttribute('href')).toBe('/my/registrations/reference-a');
  view.rerender(<MyRegistrations {...props} id={record.id}/>);
  expect(await screen.findByRole('heading', { name: record.event.title })).toBeTruthy();
  expect(screen.getByText(record.id)).toBeTruthy();
  expect(screen.getByText('เวลาประเทศไทย (Asia/Bangkok)')).toBeTruthy();
});
it('TEST-25: clears private records immediately on account changes and ignores late results', async () => {
  let finish!: (value: unknown) => void;
  const fetch = vi.fn().mockResolvedValueOnce(reply([record])).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }))
    .mockResolvedValueOnce(reply([]));
  vi.stubGlobal('fetch', fetch);
  const props = { onAuthRequired: vi.fn() };
  const view = render(<MyRegistrations identity={participant} {...props}/>);
  await screen.findByText(record.event.title);
  fireEvent.focus(window);
  expect(screen.queryByText(record.event.title)).toBeNull();
  view.rerender(<MyRegistrations identity={{ ...participant, id: 'b' }} {...props}/>);
  await screen.findByText('ยังไม่มีรายการลงทะเบียน');
  await act(async () => { finish(reply([record])); });
  expect(screen.queryByText(record.event.title)).toBeNull();
});
it.each([401, 403, 404])('clears protected records when refreshed access is rejected with %s', async status => {
  const onAuthRequired = vi.fn();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(reply([record])).mockResolvedValueOnce({ ok: false, status,
    json: async () => ({ error: { code: 'DENIED', message: 'Access denied', fields: {} } }) }));
  render(<MyRegistrations identity={participant} onAuthRequired={onAuthRequired}/>);
  await screen.findByText(record.event.title);
  await act(async () => { fireEvent.focus(window); });
  expect(screen.queryByText(record.event.title)).toBeNull();
  expect(onAuthRequired).toHaveBeenCalledTimes(status === 401 ? 1 : 0);
  if (status !== 401) expect(screen.getByRole('alert').textContent).toContain('Access denied');
});
it('TEST-28/29: roster empty state then reloads names, references and ACTIVE count', async () => {
  const base = { event_id: 'event', capacity: 3, active_count: 0, registrations: [] };
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(reply(base)).mockResolvedValueOnce(reply({ ...base, active_count: 1,
    registrations: [{ id: 'registration', participant: { display_name: 'Alice' }, status: 'ACTIVE', registered_at: record.registered_at }] })));
  render(<OrganizerRoster identity={organizer} eventId="event" onAuthRequired={vi.fn()}/>);
  await screen.findByText('ยังไม่มีผู้ลงทะเบียน');
  fireEvent.click(screen.getByRole('button', { name: 'รีเฟรชรายชื่อ' }));
  expect(await screen.findByRole('cell', { name: 'Alice' })).toBeTruthy();
  expect(screen.getByRole('cell', { name: 'registration' })).toBeTruthy();
  expect(screen.getByText('1', { selector: 'strong' })).toBeTruthy();
});
it('TEST-23/27: wrong-role views do not fetch protected data', () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  render(<MyRegistrations identity={organizer} onAuthRequired={vi.fn()}/>);
  render(<OrganizerRoster identity={participant} eventId="foreign" onAuthRequired={vi.fn()}/>);
  expect(screen.getAllByRole('alert')).toHaveLength(2);
  expect(fetch).not.toHaveBeenCalled();
});
