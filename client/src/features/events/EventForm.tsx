import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, ApiError, mutate } from '../../lib/api';
import { bangkokInput, labels, validateForm, type FormValues, type OwnerEvent } from './model';
import { EventSchedule } from './EventSchedule';

const timeKeys = ['starts_at', 'ends_at', 'registration_closes_at'] as const;
const blank: FormValues = { title: '', description: '', location: '', capacity: '', starts_at: '', ends_at: '', registration_closes_at: '' };
const valuesOf = (event: OwnerEvent): FormValues => ({ title: event.title, description: event.description, location: event.location,
  capacity: String(event.capacity), starts_at: bangkokInput(event.starts_at), ends_at: bangkokInput(event.ends_at),
  registration_closes_at: bangkokInput(event.registration_closes_at) });

// F-07: send only fields whose normalized value changed; time fields only while DRAFT.
function changedFields(values: FormValues, initial: FormValues, status: OwnerEvent['status']) {
  const next = validateForm(values).body, base = validateForm(initial).body, patch: Record<string, string | number> = {};
  for (const key of ['title', 'description', 'location'] as const) if (next[key] !== base[key]) patch[key] = next[key];
  if (!Object.is(next.capacity, base.capacity)) patch.capacity = next.capacity;
  if (status === 'DRAFT') for (const key of timeKeys) {
    if (next[key] !== base[key] && Date.parse(next[key]) !== Date.parse(base[key])) patch[key] = next[key];
  }
  return patch;
}

export function EventForm({ onCreated, onSaved, onLost, onAuthRequired, editing }: {
  onCreated?: (event: OwnerEvent) => void; onSaved?: (event: OwnerEvent) => void; onLost?: (message: string) => void;
  onAuthRequired: () => void; editing?: OwnerEvent;
}) {
  const [initial] = useState<FormValues>(() => editing ? valuesOf(editing) : blank);
  const [values, setValues] = useState<FormValues>(initial);
  // Latest status/active_count from page refreshes or a 409 reload; typed values stay.
  const [current, setCurrent] = useState(editing);
  const [fields, setFields] = useState<Record<string, string[]>>({}), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const hasSubmitted = useRef(false);
  const mounted = useRef(true), activeMutation = useRef<AbortController | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; activeMutation.current?.abort(); };
  }, []);
  function adopt(latest: OwnerEvent) {
    setCurrent(latest);
    // Time fields can no longer be edited once published: show the stored values.
    if (latest.status !== 'DRAFT') setValues(v => ({ ...v, starts_at: bangkokInput(latest.starts_at), ends_at: bangkokInput(latest.ends_at),
      registration_closes_at: bangkokInput(latest.registration_closes_at) }));
  }
  useEffect(() => { if (editing) adopt(editing); }, [editing]);
  const timesLocked = !!current && current.status !== 'DRAFT';
  const pending = current ? changedFields(values, initial, current.status) : null;
  function change(key: keyof FormValues, value: string) {
    const next = { ...values, [key]: value };
    setValues(next);
    // Recheck dependent time fields too; correcting one field can invalidate
    // or resolve another. Keep mutation warnings until the next submission.
    if (hasSubmitted.current) setFields(validateForm(next).fields);
  }
  async function reload(id: string) {
    try { const latest = await api<OwnerEvent>(`/organizer/events/${encodeURIComponent(id)}`); if (mounted.current) adopt(latest); }
    catch (failure) {
      if (!mounted.current || !(failure instanceof ApiError)) return;
      if (failure.status === 401) onAuthRequired();
      else if ([403, 404].includes(failure.status)) onLost?.(failure.message);
    }
  }
  async function submit(e: FormEvent) {
    e.preventDefault(); if (inFlight.current) return;
    hasSubmitted.current = true;
    const checked = validateForm(values); setFields(checked.fields); setError('');
    if (Object.keys(checked.fields).length) return;
    if (pending && !Object.keys(pending).length) return;
    inFlight.current = true; setBusy(true);
    const controller = new AbortController(); activeMutation.current = controller;
    try {
      if (current) {
        const saved = await mutate<OwnerEvent>(`/organizer/events/${encodeURIComponent(current.id)}`, pending!, controller.signal, 'PATCH');
        if (mounted.current) onSaved?.(saved);
      } else {
        const event = await mutate<OwnerEvent>('/organizer/events', checked.body, controller.signal);
        if (mounted.current) onCreated?.(event);
      }
    }
    catch (failure) {
      if (!mounted.current) return;
      if (failure instanceof ApiError && failure.status === 401) onAuthRequired();
      else if (current && failure instanceof ApiError && [403, 404].includes(failure.status)) onLost?.(failure.message);
      else if (failure instanceof ApiError) {
        setFields(failure.fields); setError(failure.message);
        if (current && failure.status === 409) void reload(current.id);
      }
      else setError(current ? 'ยังยืนยันผลการบันทึกไม่ได้ กรุณาเปิดหน้ากิจกรรมเพื่อตรวจค่าล่าสุดก่อนบันทึกซ้ำ'
        : 'ยังยืนยันผลการบันทึกไม่ได้ กรุณาตรวจรายการกิจกรรมของฉันก่อนบันทึกซ้ำ');
    } finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  }
  const back = current ? `/organizer/events/${current.id}` : '/organizer/events';
  return <section className="card page-panel">
    <div className="mb-4">
      <h1 className="page-title">{current ? 'แก้ไขกิจกรรม' : 'สร้างกิจกรรม'}</h1>
      <p className="page-subtitle">{current ? 'แก้ค่าที่ต้องการแล้วบันทึก ระบบจะส่งเฉพาะช่องที่เปลี่ยน' : 'บันทึกเป็น DRAFT แล้วตรวจตัวอย่างก่อนเผยแพร่'} · เลือกวันและเวลาเป็นชั่วโมงและนาที ตามเวลาประเทศไทย (Asia/Bangkok)</p>
    </div>
    <form onSubmit={e => void submit(e)} noValidate aria-busy={busy}>
      {(['title', 'description', 'location', 'capacity'] as const).map(key => {
        const hint = key === 'capacity' && current?.status === 'PUBLISHED'
          ? `มีผู้ลงทะเบียน ACTIVE ${current.active_count} คน ตั้งได้ไม่ต่ำกว่า ${current.active_count}` : '';
        const describedBy = [fields[key] ? `${key}-error` : '', hint ? `${key}-hint` : ''].filter(Boolean).join(' ') || undefined;
        return <div className="mb-3" key={key}>
          <label className="form-label" htmlFor={`event-${key}`}>{labels[key]}</label>
          {key === 'description' ? <textarea className="form-control" id={`event-${key}`} value={values[key]} disabled={busy} aria-invalid={!!fields[key]} aria-describedby={describedBy} onChange={e => change(key, e.target.value)}/>
            : <input className="form-control" id={`event-${key}`} type={key === 'capacity' ? 'number' : 'text'}
              step={key === 'capacity' ? '1' : undefined} min={key === 'capacity' ? 1 : undefined} max={key === 'capacity' ? 1000 : undefined}
              value={values[key]} disabled={busy} aria-invalid={!!fields[key]} aria-describedby={describedBy} onChange={e => change(key, e.target.value)}/>}
          {hint && <div className="form-text" id={`${key}-hint`}>{hint}</div>}
          {fields[key] && <div className="text-danger small mt-1" id={`${key}-error`}>{fields[key].join(' ')}</div>}
        </div>;
      })}
      {timesLocked && <p className="small text-secondary mb-2">เผยแพร่แล้ว แก้เวลาไม่ได้</p>}
      <EventSchedule values={values} errors={fields} disabled={busy || timesLocked} onChange={change}/>
      {error && <p className="alert alert-warning" role="alert">{error} <a href={back}>{current ? 'กลับหน้ากิจกรรม' : 'กิจกรรมของฉัน'}</a></p>}
      {current ? <div className="event-actions">
        <button className="btn btn-success" disabled={busy || !Object.keys(pending!).length || current.status === 'CLOSED'}>{busy ? 'กำลังบันทึก…' : 'บันทึกการแก้ไข'}</button>
        <a className="btn btn-outline-secondary" href={back}>ยกเลิก</a>
      </div> : <button className="btn btn-success" disabled={busy}>{busy ? 'กำลังบันทึก…' : 'บันทึก DRAFT'}</button>}
    </form>
  </section>;
}
