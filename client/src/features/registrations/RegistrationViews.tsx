import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError, type Identity } from '../../lib/api';
import { bangkokTime } from '../events/model';

export interface MyRegistration {
  id: string; status: 'ACTIVE' | 'CANCELLED'; registered_at: string;
  event: { id: string; title: string; location: string; starts_at: string; ends_at: string; registration_closes_at: string; status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' };
}
export interface Roster {
  event_id: string; capacity: number; active_count: number;
  registrations: { id: string; participant: { display_name: string }; status: 'ACTIVE' | 'CANCELLED'; registered_at: string }[];
}

function usePrivateRead<T>(path: string, allowed: boolean, onAuthRequired: () => void) {
  const [data, setData] = useState<T | null>(null), [loading, setLoading] = useState(allowed), [error, setError] = useState('');
  const generation = useRef(0), active = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    if (!allowed) return;
    active.current?.abort();
    const controller = new AbortController(), version = ++generation.current;
    active.current = controller;
    setData(null); setLoading(true); setError('');
    try {
      const result = await api<T>(path, { signal: controller.signal });
      if (!controller.signal.aborted && version === generation.current) setData(result);
    } catch (failure) {
      if (controller.signal.aborted || version !== generation.current) return;
      setData(null);
      if (failure instanceof ApiError && failure.status === 401) onAuthRequired();
      else setError(failure instanceof ApiError ? failure.message : 'โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่');
    } finally { if (!controller.signal.aborted && version === generation.current) setLoading(false); }
  }, [path, allowed, onAuthRequired]);
  useEffect(() => {
    void refresh();
    const focus = () => { void refresh(); };
    window.addEventListener('focus', focus);
    return () => { generation.current++; active.current?.abort(); window.removeEventListener('focus', focus); };
  }, [refresh]);
  return { data, loading, error, refresh };
}

type Props = { identity: Identity; onAuthRequired: () => void };
export function MyRegistrations({ id, ...props }: Props & { id?: string }) {
  return <MyRegistrationsContent key={`${props.identity.id}:${props.identity.role}:${id ?? 'list'}`} id={id} {...props}/>;
}
function MyRegistrationsContent({ id, identity, onAuthRequired }: Props & { id?: string }) {
  const allowed = identity.role === 'PARTICIPANT';
  const { data, loading, error, refresh } = usePrivateRead<MyRegistration | MyRegistration[]>(
    `/my/registrations${id ? `/${encodeURIComponent(id)}` : ''}`, allowed, onAuthRequired);
  if (!allowed) return <section className="card page-panel" role="alert"><h1 className="page-title">เฉพาะผู้เข้าร่วมเท่านั้นที่ดูรายการลงทะเบียนได้</h1></section>;
  const records = data ? (Array.isArray(data) ? data : [data]) : [];
  return <section aria-label="รายการลงทะเบียนของฉัน">
    <div className="page-heading"><h1 className="page-title">{id ? 'รายละเอียดการลงทะเบียน' : 'รายการลงทะเบียนของฉัน'}</h1>
      <button className="btn btn-outline-success" disabled={loading} onClick={() => void refresh()}>รีเฟรชรายการ</button></div>
    {id && <p><a className="link-success" href="/my/registrations">กลับรายการลงทะเบียนของฉัน</a></p>}
    {loading && <p role="status">กำลังโหลดรายการลงทะเบียน…</p>}
    {error && <div className="alert alert-warning" role="alert">{error} <button className="btn btn-outline-secondary btn-sm" onClick={() => void refresh()}>ลองใหม่</button></div>}
    {data && records.length === 0 && <div className="card page-panel"><p>ยังไม่มีรายการลงทะเบียน</p><a className="link-success" href="/events">เลือกกิจกรรม</a></div>}
    <div className="row g-3">{records.map(record => <div className={id ? 'col-12' : 'col-md-6'} key={record.id}><article className="card page-panel h-100">
      <span className="event-status">{record.status}</span>
      <h2 className="event-card-title mt-3">{id ? record.event.title : <a className="link-success" href={`/my/registrations/${record.id}`}>{record.event.title}</a>}</h2>
      <p className="text-break">เลขอ้างอิง: <strong>{record.id}</strong></p>
      <dl className="event-details">
        <dt>สถานที่</dt><dd>{record.event.location}</dd>
        <dt>เริ่มกิจกรรม</dt><dd>{bangkokTime(record.event.starts_at)}</dd>
        <dt>สิ้นสุดกิจกรรม</dt><dd>{bangkokTime(record.event.ends_at)}</dd>
        <dt>ปิดรับลงทะเบียน</dt><dd>{bangkokTime(record.event.registration_closes_at)}</dd>
        <dt>ลงทะเบียนเมื่อ</dt><dd>{bangkokTime(record.registered_at)}</dd>
        <dt>สถานะกิจกรรม</dt><dd>{record.event.status}</dd>
      </dl><p className="small text-secondary">เวลาประเทศไทย (Asia/Bangkok)</p>
      <a className="link-success" href={`/events/${record.event.id}`}>ดูรายละเอียดกิจกรรม</a>
    </article></div>)}</div>
  </section>;
}

export function OrganizerRoster({ eventId, ...props }: Props & { eventId: string }) {
  return <OrganizerRosterContent key={`${props.identity.id}:${props.identity.role}:${eventId}`} eventId={eventId} {...props}/>;
}
function OrganizerRosterContent({ eventId, identity, onAuthRequired }: Props & { eventId: string }) {
  const allowed = identity.role === 'ORGANIZER';
  const { data, loading, error, refresh } = usePrivateRead<Roster>(`/organizer/events/${encodeURIComponent(eventId)}/registrations`, allowed, onAuthRequired);
  if (!allowed) return <section className="card page-panel" role="alert"><h1 className="page-title">เฉพาะผู้จัดกิจกรรมเท่านั้นที่ดูรายชื่อได้</h1></section>;
  return <section aria-label="รายชื่อผู้ลงทะเบียน">
    <div className="page-heading"><h1 className="page-title">รายชื่อผู้ลงทะเบียน</h1><button className="btn btn-outline-success" disabled={loading} onClick={() => void refresh()}>รีเฟรชรายชื่อ</button></div>
    <p><a className="link-success" href={`/organizer/events/${eventId}`}>กลับรายละเอียดกิจกรรม</a></p>
    {loading && <p role="status">กำลังโหลดรายชื่อ…</p>}
    {error && <div className="alert alert-warning" role="alert">{error} <button className="btn btn-outline-secondary btn-sm" onClick={() => void refresh()}>ลองใหม่</button></div>}
    {data && <div className="card page-panel"><p>ลงทะเบียน ACTIVE <strong>{data.active_count}</strong> / {data.capacity} คน</p>
      {!data.registrations.length ? <p className="page-state">ยังไม่มีผู้ลงทะเบียน</p> : <div className="table-responsive"><table className="table align-middle">
        <caption>เวลาประเทศไทย (Asia/Bangkok) · เรียงตามเวลาลงทะเบียนจากเก่าไปใหม่</caption>
        <thead><tr><th scope="col">เลขอ้างอิง</th><th scope="col">ชื่อผู้เข้าร่วม</th><th scope="col">สถานะ</th><th scope="col">ลงทะเบียนเมื่อ</th></tr></thead>
        <tbody>{data.registrations.map(record => <tr key={record.id}><td className="text-break">{record.id}</td><td>{record.participant.display_name}</td><td>{record.status}</td><td>{bangkokTime(record.registered_at)}</td></tr>)}</tbody>
      </table></div>}
    </div>}
  </section>;
}
