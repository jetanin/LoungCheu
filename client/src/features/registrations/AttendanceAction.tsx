import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { bangkokTime } from '../events/model';
import type { Roster } from './RegistrationViews';

type Entry = Roster['registrations'][number];

// Keep this cell mounted when a refresh changes attendance/status, so a domain
// rejection remains visible even after its action disappears.
export function AttendanceAction({ record, startsAt, endsAt, onSuccess, refresh, onAuthRequired, onDenied, eventId }: {
  record: Entry; eventId: string; startsAt: string; endsAt: string;
  onSuccess: (entry: Entry) => void; refresh: () => Promise<boolean>;
  onAuthRequired: () => void; onDenied: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [uncertain, setUncertain] = useState(false);
  const [clock, setClock] = useState(Date.now);
  const alive = useRef(true), inFlight = useRef(false), controller = useRef<AbortController | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const starts = Date.parse(startsAt), ends = Date.parse(endsAt);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; controller.current?.abort(); clearTimeout(timeout.current); };
  }, []);
  useEffect(() => {
    const at = Date.now();
    const next = at < starts ? starts : at <= ends ? ends + 1 : null;
    if (next === null) return;
    const timer = setTimeout(() => setClock(Date.now()), Math.min(next - at, 2_147_483_647));
    return () => clearTimeout(timer);
  }, [starts, ends, clock]);
  const inWindow = clock >= starts && clock <= ends;
  const available = record.status === 'ACTIVE' && !record.checked_in_at && inWindow;

  async function submit() {
    const at = Date.now(); // Server is authoritative; this also checks a stale visible button.
    if (!available || at < starts || at > ends || inFlight.current || uncertain
      || !window.confirm(`ยืนยันเช็กชื่อ ${record.participant.display_name}?`)) return;
    inFlight.current = true; setBusy(true); setMessage('');
    const abort = new AbortController(); controller.current = abort;
    timeout.current = setTimeout(() => abort.abort(), 15_000);
    let sent = false;
    try {
      const { csrf_token } = await api<{ csrf_token: string }>('/auth/csrf', { signal: abort.signal });
      if (!alive.current || abort.signal.aborted) return;
      sent = true;
      const entry = await api<Entry>(`/organizer/events/${encodeURIComponent(eventId)}/registrations/${encodeURIComponent(record.id)}/check-in`, {
        method: 'POST', signal: abort.signal, headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf_token }, body: '{}',
      });
      if (alive.current && !abort.signal.aborted) onSuccess(entry);
    } catch (failure) {
      if (!alive.current) return;
      if (failure instanceof ApiError) {
        if (failure.status === 401) { onAuthRequired(); return; }
        if (failure.status === 403 || failure.status === 404) { onDenied(failure.message); return; }
        setMessage(failure.message);
        if (failure.status === 409) void refresh().catch(() => undefined);
      } else if (sent) {
        setUncertain(true); setMessage('ยังยืนยันผลไม่ได้ กรุณาโหลดรายชื่อใหม่ก่อนเช็กชื่อซ้ำ');
      } else setMessage('เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      clearTimeout(timeout.current); inFlight.current = false;
      if (alive.current) setBusy(false);
    }
  }
  async function reconcile() {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true);
    try {
      if (await refresh() && alive.current) { setUncertain(false); setMessage(''); }
    } finally { inFlight.current = false; if (alive.current) setBusy(false); }
  }

  return <>
    {record.status === 'CANCELLED' ? '—' : record.checked_in_at ? `เช็กชื่อแล้ว ${bangkokTime(record.checked_in_at)}`
      : available ? <button type="button" className="btn btn-outline-success btn-sm" disabled={busy || uncertain}
        onClick={() => void submit()}>{busy ? 'กำลังเช็กชื่อ…' : 'เช็กชื่อ'}</button>
      : <span className="small text-secondary">เช็กชื่อได้ระหว่าง {bangkokTime(startsAt)}–{bangkokTime(endsAt)}</span>}
    {message && <div className="alert alert-warning mt-2" role="alert">{message}</div>}
    {uncertain && <button type="button" className="btn btn-outline-secondary btn-sm mt-2" disabled={busy}
      onClick={() => void reconcile()}>โหลดรายชื่อใหม่</button>}
  </>;
}
