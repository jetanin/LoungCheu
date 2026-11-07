import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError, mutate, type Identity } from '../../lib/api';
import { RegistrationAction } from '../registrations/RegistrationAction';
import { bangkokTime, type OwnerEvent, type EventView } from './model';
import { EventForm } from './EventForm';

export function EventPage({ path, identity, onAuthRequired, onNavigate }: {
  path: string; identity: Identity; onAuthRequired: () => void; onNavigate: (path: string) => void;
}) {
  const owner = path.startsWith('/organizer/events'), base = owner ? '/organizer/events' : '/events';
  const id = path.replace(/\/+$/, '').slice(base.length + 1), creating = owner && id === 'new';
  const [data, setData] = useState<EventView | EventView[] | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const generation = useRef(0), publishInFlight = useRef(false);
  const mounted = useRef(true), activeMutation = useRef<AbortController | null>(null), scopeVersion = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; activeMutation.current?.abort(); };
  }, []);
  const refresh = useCallback(async (preserveError = false) => {
    if (creating) return;
    const version = ++generation.current; setLoading(true); if (!preserveError) setError('');
    try {
      const result = await api<EventView | EventView[]>(id ? `${base}/${encodeURIComponent(id)}` : base);
      if (version === generation.current) setData(result);
    } catch (failure) {
      if (!mounted.current) return;
      // A received 401 rejects this mounted session even if a newer read only
      // failed to connect. Unmounted account/route instances cannot sign out
      // the next login. Still discard stale non-auth read results below.
      if (failure instanceof ApiError && failure.status === 401) {
        generation.current++; scopeVersion.current++; setData(null); setLoading(false);
        onAuthRequired(); return;
      }
      if (version !== generation.current) return;
      // Access failures clear protected data. Transient refresh errors keep the
      // mounted action and its pending/success/uncertain outcome intact.
      if (failure instanceof ApiError && [403, 404].includes(failure.status)) { scopeVersion.current++; setData(null); }
      if (!preserveError) setError(failure instanceof ApiError ? failure.message : 'โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่');
    } finally { if (version === generation.current) setLoading(false); }
  }, [base, creating, id, onAuthRequired]);
  useEffect(() => {
    void refresh(); const focus = () => { void refresh(); }; window.addEventListener('focus', focus);
    return () => { generation.current++; window.removeEventListener('focus', focus); };
  }, [refresh]);
  async function publish() {
    if (publishInFlight.current) return;
    publishInFlight.current = true; generation.current++; setLoading(false); setPublishing(true); setError('');
    const scope = scopeVersion.current, controller = new AbortController(); activeMutation.current = controller;
    try {
      const published = await mutate<OwnerEvent>(`${base}/${encodeURIComponent(id)}/publish`, undefined, controller.signal);
      if (!mounted.current || scope !== scopeVersion.current) return;
      // A read started before commit can still contain DRAFT, including a focus
      // refresh issued while publishing. It must not replace the mutation result.
      generation.current++; setLoading(false); setData(published);
    }
    catch (failure) {
      if (!mounted.current || scope !== scopeVersion.current) return;
      if (failure instanceof ApiError && failure.status === 401) onAuthRequired();
      else {
        if (failure instanceof ApiError && [403, 404].includes(failure.status)) {
          scopeVersion.current++; generation.current++; setLoading(false); setData(null);
        }
        setError(failure instanceof ApiError ? failure.message : 'ยังยืนยันผลเผยแพร่ไม่ได้ กรุณารีเฟรชกิจกรรมก่อนลองใหม่');
        if (failure instanceof ApiError && failure.status === 409) void refresh(true);
      }
    } finally { publishInFlight.current = false; if (mounted.current) setPublishing(false); }
  }
  if (owner && identity.role !== 'ORGANIZER') return <section className="card page-panel" role="alert"><h1 className="page-title">ไม่มีสิทธิ์ใช้งาน</h1></section>;
  if (creating) return <EventForm onAuthRequired={onAuthRequired} onCreated={event => onNavigate(`${base}/${event.id}`)}/>;
  const event = data && !Array.isArray(data) ? data : null;
  return <section className={id ? 'event-detail-page' : undefined} aria-label={owner ? 'จัดการกิจกรรม' : 'กิจกรรม'}>
    {!id && <div className="page-heading">
      {owner ? <h1 className="page-title">กิจกรรมของฉัน</h1> : <h2 className="section-title">กิจกรรมในมหาวิทยาลัย</h2>}
      {owner && <a className="btn btn-success" href="/organizer/events/new">สร้างกิจกรรม</a>}
    </div>}
    {id && !event && <h1 className="page-title mb-3">รายละเอียดกิจกรรม</h1>}
    {loading && <p className="event-meta" role="status">{data ? 'กำลังรีเฟรชกิจกรรม…' : 'กำลังโหลดกิจกรรม…'}</p>}
    {error && <div className="alert alert-warning" role="alert">{error} <button className="btn btn-outline-secondary btn-sm" onClick={() => void refresh()}>ลองใหม่</button></div>}
    {!loading && Array.isArray(data) && !data.length && <p className="page-state">ยังไม่มีกิจกรรม {owner ? <a href="/organizer/events/new">เริ่มสร้างกิจกรรม</a> : <span>กลับมาดูกิจกรรมใหม่ได้ภายหลัง</span>}</p>}
    {Array.isArray(data) && <div className="row g-3">{data.map(item => <div className="col-md-6" key={item.id}><article className="card h-100 event-card">
      <span className="event-status" data-status={item.status}>{item.status}</span><h2 className="event-card-title"><a className="link-success" href={`${base}/${item.id}`}>{item.title}</a></h2>
      <p className="event-meta">{item.location}</p><p className="event-meta">{bangkokTime(item.starts_at)} · Asia/Bangkok</p>
      <p className="event-card-availability">ว่าง {item.available_seats} / {item.capacity} ที่นั่ง · {item.registration_open ? 'เปิดรับลงทะเบียน' : 'ยังไม่เปิดรับ / ปิดรับแล้ว'}</p>
    </article></div>)}</div>}
    {event && <article className="card page-panel event-detail">
      <span className="event-status mb-3" data-status={event.status}>{event.status}</span><h1 className="page-title">{event.title}</h1>
      {owner && event.status === 'DRAFT' && <p className="text-secondary">ตัวอย่างกิจกรรม · กิจกรรมนี้จะปรากฏในรายการทั่วไปหลังเผยแพร่</p>}
      <p className="event-description">{event.description}</p>
      <dl className="event-details">
        <dt>สถานที่</dt><dd>{event.location}</dd>
        <dt>เริ่มกิจกรรม</dt><dd data-testid="starts-at">{bangkokTime(event.starts_at)}</dd>
        <dt>สิ้นสุดกิจกรรม</dt><dd>{bangkokTime(event.ends_at)}</dd>
        <dt>ปิดรับลงทะเบียน</dt><dd>{bangkokTime(event.registration_closes_at)}</dd>
      </dl>
      <p className="small text-secondary">เวลาประเทศไทย (Asia/Bangkok) · ปิดรับเมื่อถึงกำหนดตามเวลาเซิร์ฟเวอร์</p>
      <p>ว่าง {event.available_seats} / {event.capacity} ที่นั่ง</p><p>ลงทะเบียน ACTIVE {event.active_count} คน</p>
      <div className="event-actions">
        <button className="btn btn-outline-secondary" onClick={() => void refresh()}>รีเฟรชที่นั่ง</button>
        {owner && event.status === 'DRAFT' && <button className="btn btn-success" disabled={publishing} onClick={() => void publish()}>{publishing ? 'กำลังเผยแพร่…' : 'เผยแพร่กิจกรรม'}</button>}
        {owner && event.status !== 'DRAFT' && <a className="btn btn-outline-success" href={`/events/${event.id}`}>ดูหน้ากิจกรรมทั่วไป</a>}
      </div>
      {!owner && <RegistrationAction event={event} identity={identity} getCsrfToken={async signal => (await api<{ csrf_token: string }>('/auth/csrf', { signal })).csrf_token}
        refreshEvent={refresh} onAuthRequired={onAuthRequired}/>}
    </article>}
  </section>;
}
