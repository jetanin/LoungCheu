export interface Identity { id: string; display_name: string; role: 'PARTICIPANT' | 'ORGANIZER'; }
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public fields: Record<string, string[]> = {}) { super(message); }
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, { ...init, credentials: 'same-origin', cache: 'no-store' });
  if (response.status === 204) return undefined as T;
  const body = await response.json();
  if (!response.ok) throw new ApiError(response.status, body.error.code, body.error.message, body.error.fields);
  return body.data as T;
}
export const getIdentity = () => api<Identity>('/auth/me');
export async function mutate<T>(path: string, body?: object): Promise<T> {
  // Always bootstrap against the current session, including after session rotation.
  const { csrf_token } = await api<{ csrf_token: string }>('/auth/csrf');
  return api<T>(path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf_token }, body: JSON.stringify(body ?? {}) });
}
