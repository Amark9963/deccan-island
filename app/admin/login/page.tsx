'use client';

import { FormEvent, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import '../admin.css';

export default function AdminLoginPage() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setLoading(true); setError(''); const { error } = await getSupabaseBrowser().auth.signInWithPassword({ email, password }); if (error) setError('Unable to sign in with those details.'); else window.location.href = '/admin'; setLoading(false); }
  return <main className="admin-auth"><a href="/" className="admin-logo"><img src="/deccan-island-logo.svg" alt="Deccan Island" /></a><form className="admin-login-card" onSubmit={submit}><p className="eyebrow">Operations</p><h1>Admin sign in</h1><p>Manage weekend dates, orders and production from one place.</p><label>Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <div className="admin-error">{error}</div>}<button className="button" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'} <span>→</span></button></form></main>;
}
