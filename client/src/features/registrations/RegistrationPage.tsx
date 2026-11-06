import { useEffect, useRef, useState } from 'react';
import { RegistrationAction, type RegistrationActionProps } from './RegistrationAction.js';
import { RegistrationFailure } from './api.js';
import { api, ApiError } from '../../lib/api';

interface SharedEvent {
  id: string;
  title: string;
  location: string;
  starts_at: string;
  registration_closes_at: string;
  registration_open: boolean;
  available_seats: number;
}
type Identity = RegistrationActionProps['identity'];
type PageState = { kind: 'loading' | 'auth' | 'missing' | 'error' }
  | { kind: 'ready'; event: SharedEvent };

async function read<T>(path: string, signal: AbortSignal): Promise<T> {
  try { return await api<T>(path.replace(/^\/api/, ''), { signal }); }
  catch (error) {
    if (error instanceof ApiError) throw new RegistrationFailure(error.code);
    throw error;
  }
}
const bangkok = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok' });

// Small F-03 host using #1 identity/CSRF and #2 event-read contracts.
// The teammate's shared app shell can render RegistrationAction directly instead.
export function RegistrationPage({ eventId, identity, onAuthRequired }: {
  eventId: string; identity: Identity; onAuthRequired: () => void;
}) {
  const [state, setState] = useState<PageState>({ kind: 'loading' });
  const [revision, setRevision] = useState(0);
  const activeRequest = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!eventId) return;
    const controller = new AbortController();
    activeRequest.current = controller;
    // Background refreshes must not unmount the form and erase timeout recovery.
    setState((current) => current.kind === 'ready' && current.event.id === eventId
      ? current : { kind: 'loading' });
    void (async () => {
      try {
        const event = await read<SharedEvent>(`/api/events/${encodeURIComponent(eventId)}`, controller.signal);
        if (!controller.signal.aborted) setState({ kind: 'ready', event });
      } catch (error) {
        if (!controller.signal.aborted && error instanceof RegistrationFailure && error.code === 'AUTH_REQUIRED') onAuthRequired();
        if (!controller.signal.aborted) {
          const kind = error instanceof RegistrationFailure && error.code === 'AUTH_REQUIRED' ? 'auth'
            : error instanceof RegistrationFailure && error.code === 'EVENT_NOT_FOUND' ? 'missing' : 'error';
          // Keep the form on transient refresh failures; access errors still clear it.
          setState((current) => kind === 'error' && current.kind === 'ready' && current.event.id === eventId
            ? current : { kind });
        }
      }
    })();
    const refreshIdentity = () => setRevision((value) => value + 1);
    window.addEventListener('focus', refreshIdentity);
    return () => { controller.abort(); window.removeEventListener('focus', refreshIdentity); };
  }, [eventId, revision]);

  return <section aria-label="รายละเอียดการลงทะเบียน" style={{ maxWidth: 760 }}>
    <h1 className="mb-4">ลงทะเบียนกิจกรรม</h1>
    {!eventId ? <div className="card card-body"><p className="mb-0">เลือกกิจกรรมที่ต้องการจาก <a href="/events">รายการกิจกรรม</a> เพื่อลงทะเบียน</p></div>
      : state.kind === 'loading' ? <p role="status">กำลังโหลดกิจกรรม…</p>
      : state.kind === 'auth' ? <div className="alert alert-warning" role="alert">กรุณา <a href="/login">เข้าสู่ระบบ</a> ก่อนลงทะเบียน</div>
      : state.kind === 'missing' ? <p role="alert">ไม่พบกิจกรรมนี้</p>
      : state.kind === 'error' ? <div role="alert"><p>โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่</p><button className="btn btn-outline-primary" onClick={() => setRevision((value) => value + 1)}>ลองใหม่</button></div>
      : state.kind === 'ready' && <article className="card shadow-sm"><div className="card-body p-4">
        <h2 className="h4">{state.event.title}</h2>
        <dl className="row mt-4">
          <dt className="col-sm-4">สถานที่</dt><dd className="col-sm-8">{state.event.location}</dd>
          <dt className="col-sm-4">เริ่มกิจกรรม</dt><dd className="col-sm-8">{bangkok.format(new Date(state.event.starts_at))}</dd>
          <dt className="col-sm-4">ปิดรับลงทะเบียน</dt><dd className="col-sm-8">{bangkok.format(new Date(state.event.registration_closes_at))}</dd>
        </dl>
        <p className="small text-body-secondary">เวลาประเทศไทย (Asia/Bangkok)</p>
        <RegistrationAction event={state.event} identity={identity}
          getCsrfToken={async (signal) => {
            const data = await read<{ csrf_token: string }>('/api/auth/csrf', signal);
            if (typeof data.csrf_token !== 'string' || !data.csrf_token) throw new Error('Missing CSRF token');
            return data.csrf_token;
          }}
          refreshEvent={async () => {
            const signal = activeRequest.current?.signal;
            if (!signal || signal.aborted) return;
            try {
              const event = await read<SharedEvent>(`/api/events/${encodeURIComponent(eventId)}`, signal);
              if (!signal.aborted) setState((current) => current.kind === 'ready' ? { ...current, event } : current);
            } catch (error) {
              if (!signal.aborted && error instanceof RegistrationFailure && error.code === 'AUTH_REQUIRED') { setState({ kind: 'auth' }); onAuthRequired(); }
              throw error;
            }
          }}
          onAuthRequired={() => { setState({ kind: 'auth' }); onAuthRequired(); }} />
      </div></article>}
  </section>;
}
