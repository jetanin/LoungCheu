import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError, type Identity } from '../../lib/api';
import { bangkokTime } from '../events/model';

// F-09 attendance summary page (#74). Contract: Sprint 3 F-09 Workflow / UI.
export interface AttendanceSummaryData {
  event_id: string; status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'; capacity: number;
  active_count: number; cancelled_count: number; checked_in_count: number;
  attendance_rate: string; generated_at: string;
}
type Props = { identity: Identity; eventId: string; onAuthRequired: () => void };

export function AttendanceSummary(props: Props) {
  // A new account or event starts from an empty state; no values carry over.
  return <AttendanceSummaryContent key={`${props.identity.id}:${props.identity.role}:${props.eventId}`} {...props}/>;
}

function AttendanceSummaryContent({ identity, eventId, onAuthRequired }: Props) {
  const allowed = identity.role === 'ORGANIZER';
  const [data, setData] = useState<AttendanceSummaryData | null>(null);
  const [loading, setLoading] = useState(allowed), [error, setError] = useState('');
  const generation = useRef(0), active = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (!allowed) return;
    active.current?.abort();
    const controller = new AbortController(), version = ++generation.current;
    active.current = controller;
    // Placeholder while reading: never show the previous or zero values as current.
    setData(null); setLoading(true); setError('');
    try {
      const result = await api<AttendanceSummaryData>(
        `/organizer/events/${encodeURIComponent(eventId)}/summary`, { signal: controller.signal });
      if (!controller.signal.aborted && version === generation.current) setData(result);
    } catch (failure) {
      if (controller.signal.aborted || version !== generation.current) return;
      if (failure instanceof ApiError && failure.status === 401) onAuthRequired();
      else setError(failure instanceof ApiError ? failure.message : 'โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      if (!controller.signal.aborted && version === generation.current) setLoading(false);
    }
  }, [allowed, eventId, onAuthRequired]);

  // Read once on open. The summary does not auto-refresh (no polling, no focus refresh).
  useEffect(() => {
    void load();
    return () => { generation.current++; active.current?.abort(); };
  }, [load]);

  if (!allowed) return <section className="card page-panel" role="alert">
    <h1 className="page-title">เฉพาะผู้จัดกิจกรรมเท่านั้นที่ดูสรุปผลได้</h1></section>;

  return <section aria-label="สรุปผลการเข้าร่วม">
    <div className="page-heading"><h1 className="page-title">สรุปผลการเข้าร่วม</h1>
      <button className="btn btn-outline-success" disabled={loading} onClick={() => void load()}>รีเฟรชสรุป</button></div>
    <p><a className="link-success" href={`/organizer/events/${eventId}`}>กลับรายละเอียดกิจกรรม</a></p>
    {loading && <p role="status" className="page-state">กำลังโหลดสรุปผล…</p>}
    {error && <div className="alert alert-warning" role="alert">{error}{' '}
      <button className="btn btn-outline-secondary btn-sm" onClick={() => void load()}>ลองใหม่</button></div>}
    {data && <div className="card page-panel">
      <dl className="summary-grid">
        <div className="summary-item"><dt>ลงทะเบียนอยู่ (ACTIVE)</dt><dd>{data.active_count}</dd></div>
        <div className="summary-item"><dt>ยกเลิก (CANCELLED)</dt><dd>{data.cancelled_count}</dd></div>
        <div className="summary-item"><dt>เช็กชื่อแล้ว</dt><dd>{data.checked_in_count}</dd></div>
        <div className="summary-item"><dt>อัตราเข้าร่วม</dt><dd>{data.attendance_rate}%</dd></div>
      </dl>
      <p>{`เช็กชื่อแล้ว ${data.checked_in_count} จาก ACTIVE ${data.active_count} คน`}</p>
      {data.active_count === 0 && <p className="page-state">ยังไม่มีผู้ลงทะเบียน ACTIVE</p>}
      <p className="small text-secondary">{`ข้อมูล ณ ${bangkokTime(data.generated_at)}`} · เวลาประเทศไทย (Asia/Bangkok)</p>
    </div>}
  </section>;
}
