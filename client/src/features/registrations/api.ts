import { api, ApiError } from '../../lib/api';

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
  let data: RegistrationCreated;
  try {
    data = await api<RegistrationCreated>(`/events/${encodeURIComponent(eventId)}/registrations`, {
      method: 'POST', signal,
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken }, body: '{}',
    });
  } catch (error) {
    if (error instanceof ApiError) throw new RegistrationFailure(error.code);
    throw error;
  }
  const payload = { data };
  if (typeof payload?.data?.id !== 'string' || payload.data.event_id !== eventId ||
    payload.data.status !== 'ACTIVE' || typeof payload.data.registered_at !== 'string') {
    throw new Error('Invalid registration response');
  }
  return payload.data;
}
