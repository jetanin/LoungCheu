import { useCallback, useEffect, useRef, useState } from 'react';
import { registerForEvent, RegistrationFailure, type RegistrationCreated } from './api.js';
import { api, ApiError } from '../../lib/api';
import type { MyRegistration } from './RegistrationViews';

export interface RegistrationActionProps {
  event: { id: string; registration_open: boolean; available_seats: number;
    status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED'; registration_closes_at?: string };
  identity: { id: string; role: 'PARTICIPANT' | 'ORGANIZER' };
  getCsrfToken: (signal: AbortSignal) => Promise<string>;
  refreshEvent: () => Promise<void>;
  onAuthRequired: () => void;
}

const messages: Record<string, string> = {
  ALREADY_REGISTERED: 'คุณลงทะเบียนกิจกรรมนี้แล้ว ตรวจสอบได้ในรายการของฉัน',
  EVENT_FULL: 'กิจกรรมเต็มแล้ว',
  REGISTRATION_CLOSED: 'กิจกรรมนี้ปิดรับลงทะเบียนแล้ว',
  EVENT_NOT_FOUND: 'ไม่พบกิจกรรมนี้',
  ROLE_FORBIDDEN: 'เฉพาะผู้เข้าร่วมเท่านั้นที่ลงทะเบียนได้',
  CSRF_FAILED: 'การยืนยันคำขอหมดอายุ กรุณาลองใหม่',
  INVALID_INPUT: 'ข้อมูลคำขอไม่ถูกต้อง กรุณาโหลดหน้าใหม่',
};

export function RegistrationAction(props: RegistrationActionProps) {
  // Remount on account/event changes so private success/error data cannot cross sessions.
  return <RegistrationActionContent key={`${props.identity.id}:${props.identity.role}:${props.event.id}`} {...props} />;
}

function RegistrationActionContent({ event, identity, getCsrfToken, refreshEvent, onAuthRequired }: RegistrationActionProps) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RegistrationCreated | null>(null);
  const [message, setMessage] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const [expired, setExpired] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const expiredSession = useRef(false);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const controller = useRef<AbortController | null>(null);
  const [own, setOwn] = useState<MyRegistration | null>(null);
  const [readingOwn, setReadingOwn] = useState(identity.role === 'PARTICIPANT'), [ownError, setOwnError] = useState('');
  const ownGeneration = useRef(0), ownController = useRef<AbortController | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; controller.current?.abort(); ownController.current?.abort(); };
  }, []);

  const refreshOwn = useCallback(async () => {
    if (identity.role !== 'PARTICIPANT' || expiredSession.current) return;
    ownController.current?.abort();
    const abort = new AbortController(), version = ++ownGeneration.current;
    ownController.current = abort; setReadingOwn(true); setOwnError('');
    try {
      const records = await api<MyRegistration[]>('/my/registrations', { signal: abort.signal });
      if (!Array.isArray(records)) throw new Error('Invalid own-registration response');
      if (mounted.current && !expiredSession.current && !abort.signal.aborted && version === ownGeneration.current) {
        const latest = records.find(record => record.event.id === event.id) ?? null;
        setOwn(latest);
        // A cancellation in another tab must replace an earlier success banner
        // with the current re-registration action when this tab regains focus.
        if (latest?.status === 'CANCELLED') setResult(null);
      }
    } catch (failure) {
      if (!mounted.current || abort.signal.aborted || version !== ownGeneration.current) return;
      setOwn(null);
      if (failure instanceof ApiError && failure.status === 401) {
        expiredSession.current = true; controller.current?.abort();
        setExpired(true); setResult(null); onAuthRequired();
      } else setOwnError(failure instanceof ApiError ? failure.message : 'โหลดรายการลงทะเบียนไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      if (mounted.current && version === ownGeneration.current) setReadingOwn(false);
    }
  }, [event.id, identity.role, onAuthRequired]);
  useEffect(() => {
    void refreshOwn();
    const focus = () => { void refreshOwn(); };
    window.addEventListener('focus', focus);
    return () => { ownGeneration.current++; ownController.current?.abort(); window.removeEventListener('focus', focus); };
  }, [refreshOwn]);

  async function submit() {
    if (inFlight.current || result || uncertain || expired || readingOwn || ownError
      || own?.status === 'ACTIVE' || !event.registration_open) return;
    inFlight.current = true;
    setBusy(true);
    setMessage('');
    setDuplicate(false);
    const abort = new AbortController();
    controller.current = abort;
    const timeout = setTimeout(() => abort.abort(), 15_000);
    let sent = false;
    try {
      const token = await getCsrfToken(abort.signal);
      if (!mounted.current || abort.signal.aborted) return;
      sent = true;
      const registration = await registerForEvent(event.id, token, abort.signal);
      if (mounted.current && !expiredSession.current) {
        setResult(registration);
        void Promise.resolve().then(refreshEvent).catch(() => undefined);
        setOwn(previous => previous ? { ...previous, status: 'ACTIVE', cancelled_at: null } : previous);
      }
    } catch (error) {
      if (!mounted.current) return;
      if (error instanceof RegistrationFailure && error.code === 'AUTH_REQUIRED') {
        expiredSession.current = true; setExpired(true);
        setResult(null);
        setMessage('กรุณาเข้าสู่ระบบใหม่');
        onAuthRequired();
      } else if (error instanceof RegistrationFailure) {
        setMessage(messages[error.code] ?? 'ระบบขัดข้อง กรุณาลองใหม่');
        setDuplicate(error.code === 'ALREADY_REGISTERED');
        if (['ALREADY_REGISTERED', 'EVENT_FULL', 'REGISTRATION_CLOSED', 'EVENT_NOT_FOUND'].includes(error.code)) {
          // A failed availability refresh must not replace the original rejection reason.
          void Promise.resolve().then(refreshEvent).catch(() => undefined);
          void refreshOwn();
        }
      } else if (sent) {
        setUncertain(true);
        setMessage('ยังยืนยันผลไม่ได้ คำขออาจบันทึกแล้ว กรุณาตรวจรายการของฉันก่อนลองใหม่');
      } else {
        setMessage('เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่');
      }
    } finally {
      clearTimeout(timeout);
      inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  if (identity.role !== 'PARTICIPANT') return <p>เฉพาะผู้เข้าร่วมเท่านั้นที่ลงทะเบียนได้</p>;
  if (result) return <div className="alert alert-success" role="status">
    <p>ลงทะเบียนสำเร็จ เลขอ้างอิง: <strong>{result.id}</strong></p>
    <a href="/my/registrations">ดูรายการของฉัน</a>
  </div>;
  const wasCancelled = own?.status === 'CANCELLED';
  const closed = event.status === 'CLOSED' || (event.registration_closes_at !== undefined
    && Date.now() >= Date.parse(event.registration_closes_at));
  const cancelledUnavailable = wasCancelled && !event.registration_open;
  return <section aria-label="ลงทะเบียนกิจกรรม" aria-busy={busy}>
    {readingOwn && <p role="status">กำลังตรวจรายการลงทะเบียนของคุณ…</p>}
    {ownError && <div className="alert alert-warning" role="alert">{ownError} <button className="btn btn-outline-secondary"
      onClick={() => void refreshOwn()}>ลองใหม่</button></div>}
    {own?.status === 'ACTIVE' && <p>คุณลงทะเบียนกิจกรรมนี้แล้ว ตรวจสอบได้ในรายการของฉัน <a href="/my/registrations">ดูรายการของฉัน</a></p>}
    {cancelledUnavailable && <p>{closed ? 'คุณยกเลิกการลงทะเบียนแล้ว กิจกรรมนี้ปิดรับลงทะเบียนแล้ว' : 'คุณยกเลิกการลงทะเบียนแล้ว ขณะนี้กิจกรรมเต็ม'}</p>}
    {!event.registration_open && <p>กิจกรรมนี้ไม่เปิดรับลงทะเบียน หรือไม่มีที่นั่งว่าง</p>}
    {event.registration_open && <p>ที่นั่งว่าง {event.available_seats} ที่ (ยืนยันเมื่อบันทึกสำเร็จ)</p>}
    {!cancelledUnavailable && <button type="button" className="btn btn-primary" onClick={() => void submit()}
      disabled={busy || !event.registration_open || uncertain || expired || readingOwn || !!ownError || own?.status === 'ACTIVE'}>
      {busy ? 'กำลังลงทะเบียน…' : wasCancelled ? 'ลงทะเบียนใหม่' : 'ลงทะเบียน'}
    </button>}
    {message && <div className="alert alert-warning mt-3" role="alert">{message}</div>}
    {(uncertain || duplicate) && <p><a href="/my/registrations">ตรวจรายการของฉัน</a></p>}
    {uncertain && <button className="btn btn-outline-secondary" type="button" onClick={() => setUncertain(false)}>ตรวจแล้ว ลองลงทะเบียนอีกครั้ง</button>}
    {expired && <a href="/login">เข้าสู่ระบบ</a>}
  </section>;
}
