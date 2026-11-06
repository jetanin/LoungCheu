import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiError, mutate } from '../../lib/api';
import { labels, validateForm, type FormValues, type OwnerEvent } from './model';
import { EventSchedule } from './EventSchedule';

export function EventForm({ onCreated, onAuthRequired }: { onCreated: (event: OwnerEvent) => void; onAuthRequired: () => void }) {
  const [values, setValues] = useState<FormValues>({ title: '', description: '', location: '', capacity: '', starts_at: '', ends_at: '', registration_closes_at: '' });
  const [fields, setFields] = useState<Record<string, string[]>>({}), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const mounted = useRef(true), activeMutation = useRef<AbortController | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; activeMutation.current?.abort(); };
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault(); if (inFlight.current) return;
    const checked = validateForm(values); setFields(checked.fields); setError('');
    if (Object.keys(checked.fields).length) return;
    inFlight.current = true; setBusy(true);
    const controller = new AbortController(); activeMutation.current = controller;
    try {
      const event = await mutate<OwnerEvent>('/organizer/events', checked.body, controller.signal);
      if (mounted.current) onCreated(event);
    }
    catch (failure) {
      if (!mounted.current) return;
      if (failure instanceof ApiError && failure.status === 401) onAuthRequired();
      else if (failure instanceof ApiError) { setFields(failure.fields); setError(failure.message); }
      else setError('ยังยืนยันผลการบันทึกไม่ได้ กรุณาตรวจรายการกิจกรรมของฉันก่อนบันทึกซ้ำ');
    } finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  }
  return <section className="card border-0 shadow-sm p-4 mx-auto" style={{ maxWidth: 800 }}>
    <h1 className="h2">สร้างกิจกรรม</h1><p className="text-secondary">บันทึกเป็น DRAFT แล้วตรวจตัวอย่างก่อนเผยแพร่ · เลือกวันและเวลาเป็นชั่วโมงและนาที ตามเวลาประเทศไทย (Asia/Bangkok)</p>
    <form onSubmit={e => void submit(e)} noValidate aria-busy={busy}>
      {(['title', 'description', 'location', 'capacity'] as const).map(key => <div className="mb-3" key={key}>
        <label className="form-label" htmlFor={`event-${key}`}>{labels[key]}</label>
        {key === 'description' ? <textarea className="form-control" id={`event-${key}`} value={values[key]} disabled={busy} aria-invalid={!!fields[key]} aria-describedby={fields[key] ? `${key}-error` : undefined} onChange={e => setValues({ ...values, [key]: e.target.value })}/>
          : <input className="form-control" id={`event-${key}`} type={key === 'capacity' ? 'number' : 'text'}
            step={key === 'capacity' ? '1' : undefined} min={key === 'capacity' ? 1 : undefined} max={key === 'capacity' ? 1000 : undefined}
            value={values[key]} disabled={busy} aria-invalid={!!fields[key]} aria-describedby={fields[key] ? `${key}-error` : undefined} onChange={e => setValues({ ...values, [key]: e.target.value })}/>}
        {fields[key] && <div className="text-danger small mt-1" id={`${key}-error`}>{fields[key].join(' ')}</div>}
      </div>)}
      <EventSchedule values={values} errors={fields} disabled={busy} onChange={(key, value) => setValues(current => ({ ...current, [key]: value }))}/>
      {error && <p className="alert alert-warning" role="alert">{error} <a href="/organizer/events">กิจกรรมของฉัน</a></p>}
      <button className="btn btn-success" disabled={busy}>{busy ? 'กำลังบันทึก…' : 'บันทึก DRAFT'}</button>
    </form>
  </section>;
}
