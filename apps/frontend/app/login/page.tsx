'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || 'Login failed');
        setSubmitting(false);
        return;
      }
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      window.location.href = next && next.startsWith('/') ? next : '/';
    } catch (err) {
      console.error(err);
      setError('Failed to connect to server');
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg-primary)',
      padding: '20px',
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '380px' }}>
        <div className="card-body" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
            <img src="/venture27-logo.png" alt="Venture27" style={{ width: '155px', height: '25px', marginBottom: '20px' }} />
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Programmatic Page</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Sign in to continue</div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter dashboard password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div style={{
                marginTop: '12px',
                padding: '10px 12px',
                background: 'var(--color-error-bg)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                color: 'var(--color-error)',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }}
              disabled={submitting}
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
