export interface RegistrationCreated {
  id: string;
  event_id: string;
  status: 'ACTIVE';
  registered_at: string;
}

export class RegistrationFailure extends Error {
  constructor(public readonly code: string) { super(code); }
}

export async function registerForEvent(eventId: string, csrfToken: string, signal: AbortSignal): Promise<RegistrationCreated> {
  const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/registrations`, {
    method: 'POST', credentials: 'same-origin', signal,
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: '{}',
  });
  const payload = await response.json();
  if (!response.ok) throw new RegistrationFailure(payload?.error?.code ?? 'INTERNAL_ERROR');
  if (typeof payload?.data?.id !== 'string' || payload.data.event_id !== eventId ||
    payload.data.status !== 'ACTIVE' || typeof payload.data.registered_at !== 'string') {
    throw new Error('Invalid registration response');
  }
  return payload.data;
}
