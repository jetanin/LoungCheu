import { labels, type FormValues } from './model';

type TimeField = 'starts_at' | 'ends_at' | 'registration_closes_at';

export function EventSchedule({ values, errors, disabled, onChange }: {
  values: FormValues; errors: Record<string, string[]>; disabled: boolean;
  onChange: (key: TimeField, value: string) => void;
}) {
  function row(key: TimeField) {
    const [date = '', time = ''] = values[key].split('T');
    const errorId = `${key}-error`;
    const change = (nextDate: string, nextTime: string) => onChange(key, nextDate || nextTime ? `${nextDate}T${nextTime}` : '');
    return <fieldset key={key} className="event-schedule-field" disabled={disabled}>
      <legend>{labels[key]}</legend>
      <div className="event-date-time-row">
        <input className="form-control" type="date" aria-label={`วันที่${labels[key]}`} value={date}
          aria-invalid={!!errors[key]} aria-describedby={errors[key] ? errorId : undefined}
          onChange={event => change(event.target.value, time)}/>
        <input className="form-control" type="time" aria-label={`เวลา${labels[key]}`} value={time} step="60"
          aria-invalid={!!errors[key]} aria-describedby={errors[key] ? errorId : undefined}
          onChange={event => change(date, event.target.value)}/>
      </div>
      {errors[key] && <div className="text-danger small mt-1" id={errorId}>{errors[key].join(' ')}</div>}
    </fieldset>;
  }
  return <div className="event-schedule-grid mb-4">
    {row('registration_closes_at')}
    {row('starts_at')}
    {row('ends_at')}
    <aside className="event-schedule-zone" aria-label="เขตเวลากิจกรรม">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>
      </svg>
      <div><strong>GMT+07:00</strong><span>กรุงเทพมหานคร</span><small>Asia/Bangkok</small></div>
    </aside>
  </div>;
}
