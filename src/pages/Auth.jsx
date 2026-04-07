import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const { user, signIn, signUp, sendOtp, verifyOtp, hasSupabaseConfig } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', token: '' });
  const [message, setMessage] = useState('');

  if (user) return <Navigate to="/products" replace />;

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setMessage('One moment...');
      if (mode === 'signup') {
        await signUp(form);
        setMessage('Profile created. Check your email if confirmation is enabled.');
      } else if (mode === 'otp') {
        await sendOtp({ email: form.email, phone: form.phone });
        setMessage(form.phone ? 'SMS OTP sent. Enter the code below.' : 'Magic link sent to your email.');
      } else if (mode === 'verify') {
        await verifyOtp({ phone: form.phone, token: form.token });
        setMessage('OTP verified.');
      } else {
        await signIn(form);
        setMessage('Welcome back.');
      }
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="page auth-layout">
      <div className="auth-card">
        <p className="eyebrow">Secure access</p>
        <h1>{mode === 'signup' ? 'Create your Paskal account.' : 'Enter the private salon.'}</h1>
        {!hasSupabaseConfig && <p className="status-note">Add `.env` Supabase keys to enable live authentication.</p>}

        <div className="tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Login</button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Signup</button>
          <button className={mode === 'otp' || mode === 'verify' ? 'active' : ''} onClick={() => setMode('otp')}>OTP</button>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          {mode === 'signup' && (
            <>
              <label>Name<input value={form.name} onChange={(event) => update('name', event.target.value)} /></label>
              <label>Phone<input value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+919999999999" /></label>
            </>
          )}

          {mode !== 'verify' && (
            <label>Email<input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} /></label>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <label>Password<input type="password" value={form.password} onChange={(event) => update('password', event.target.value)} /></label>
          )}

          {mode === 'otp' && (
            <>
              <label>Phone for SMS OTP<input value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+919999999999" /></label>
              <button type="button" className="text-button" onClick={() => setMode('verify')}>I already have a phone OTP</button>
            </>
          )}

          {mode === 'verify' && (
            <>
              <label>Phone<input value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+919999999999" /></label>
              <label>OTP code<input value={form.token} onChange={(event) => update('token', event.target.value)} /></label>
            </>
          )}

          <button className="button primary full" type="submit">
            {mode === 'signup' ? 'Create account' : mode === 'otp' ? 'Send OTP' : mode === 'verify' ? 'Verify OTP' : 'Login'}
          </button>
        </form>

        {message && <p className="status-note">{message}</p>}
      </div>
    </section>
  );
}
