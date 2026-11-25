import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../../lib/api';

// Cancel and close share confirmation, CSRF and uncertain-result behaviour.
// Keep the component mounted when a refreshed state hides the action, so a
// domain rejection is still readable after refresh.
export function LifecycleMutation<T>({ path, label, busyLabel, confirmation, visible,
  onSuccess, refresh, onAuthRequired, onDenied }: {
  path: string; label: string; busyLabel: string; confirmation: string; visible: boolean;
  onSuccess: (result: T) => void; refresh: () => Promise<boolean>;
  onAuthRequired: () => void; onDenied: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const [denied, setDenied] = useState(false);
  const mounted = useRef(true), inFlight = useRef(false), controller = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; controller.current?.abort(); clearTimeout(timer.current); };
  }, []);

  async function submit() {
    if (!visible || inFlight.current || uncertain || denied || !window.confirm(confirmation)) return;
    inFlight.current = true; setBusy(true); setMessage('');
    const abort = new AbortController(); controller.current = abort;
    timer.current = setTimeout(() => abort.abort(), 15_000);
    let sent = false;
    try {
      const { csrf_token } = await api<{ csrf_token: string }>('/auth/csrf', { signal: abort.signal });
      if (!mounted.current || abort.signal.aborted) return;
      sent = true;
      const result = await api<T>(path, { method: 'POST', signal: abort.signal,
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf_token }, body: '{}' });
      if (mounted.current) onSuccess(result);
    } catch (failure) {
      if (!mounted.current) return;
      if (failure instanceof ApiError) {
        if (failure.status === 401) { setDenied(true); onAuthRequired(); return; }
        if ([403, 404].includes(failure.status)) { setDenied(true); onDenied(failure.message); return; }
        setMessage(failure.message);
        if (failure.status === 409) void refresh().catch(() => undefined);
      } else if (sent) {
        setUncertain(true);
        setMessage('ยังยืนยันผลไม่ได้ คำขออาจบันทึกแล้ว กรุณาตรวจสถานะล่าสุดก่อนลองใหม่');
      } else setMessage('เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      clearTimeout(timer.current); inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function checkResult() {
    setBusy(true);
    try {
      const refreshed = await refresh();
      if (mounted.current && refreshed) { setUncertain(false); setMessage(''); }
    } finally { if (mounted.current) setBusy(false); }
  }

  return <>
    {visible && <button type="button" className="btn btn-outline-danger" disabled={busy || uncertain || denied}
      onClick={() => void submit()}>{busy ? busyLabel : label}</button>}
    {message && <div className="alert alert-warning mt-3" role="alert">{message}</div>}
    {uncertain && <button type="button" className="btn btn-outline-secondary" disabled={busy}
      onClick={() => void checkResult()}>ตรวจสถานะล่าสุด</button>}
  </>;
}
