import { useState, type FormEvent } from 'react';
import { ApiError, mutate, type Identity } from '../../lib/api';
export function Login({ onLogin }: { onLogin: (identity: Identity) => void }) {
  const [username, setUsername] = useState(''), [password, setPassword] = useState('');
  const [pending, setPending] = useState(false), [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string[]>>({});
  async function submit(event: FormEvent) {
    event.preventDefault(); if (pending) return;
    const invalid: Record<string, string[]> = {};
    if (!username.trim()) invalid.username = ['กรุณากรอกชื่อผู้ใช้'];
    if (!password.length) invalid.password = ['กรุณากรอกรหัสผ่าน'];
    setFields(invalid); setError(''); if (Object.keys(invalid).length) return;
    setPending(true);
    try { onLogin(await mutate<Identity>('/auth/login', { username, password })); }
    catch (failure) {
      setPassword('');
      setError(failure instanceof ApiError ? failure.message : 'เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่');
      if (failure instanceof ApiError) setFields(failure.fields);
    } finally { setPending(false); }
  }
  return <section className="login-card card border-0 shadow-sm" aria-labelledby="login-title">
    <div className="card-body p-4 p-md-5">
      <span className="eyebrow">ยินดีต้อนรับ</span><h1 id="login-title" className="h2 mt-2 mb-2">ลงชื่อ แล้วไปด้วยกัน</h1>
      <p className="text-secondary mb-4">เข้าสู่ระบบเพื่อเริ่มต้นใช้งานกิจกรรมในมหาวิทยาลัย</p>
      {error && <div role="alert" className="alert alert-danger">{error}</div>}
      <form onSubmit={submit} noValidate>
        <div className="mb-3"><label htmlFor="username" className="form-label">ชื่อผู้ใช้</label>
          <input id="username" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} disabled={pending}
            className={`form-control form-control-lg ${fields.username ? 'is-invalid' : ''}`} aria-invalid={!!fields.username} aria-describedby={fields.username ? 'username-error' : undefined}/>
          {fields.username && <div id="username-error" className="invalid-feedback">{fields.username.join(' ')}</div>}</div>
        <div className="mb-4"><label htmlFor="password" className="form-label">รหัสผ่าน</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} disabled={pending}
            className={`form-control form-control-lg ${fields.password ? 'is-invalid' : ''}`} aria-invalid={!!fields.password} aria-describedby={fields.password ? 'password-error' : undefined}/>
          {fields.password && <div id="password-error" className="invalid-feedback">{fields.password.join(' ')}</div>}</div>
        <button type="submit" className="btn btn-success btn-lg w-100" disabled={pending}>{pending ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}</button>
      </form>
    </div>
  </section>;
}
