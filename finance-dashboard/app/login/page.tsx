'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (res.ok) {
      window.location.href = '/';
    } else {
      setError('Incorrect password');
    }
  }

  return (
    <div
      style={{
        background: '#fafafa',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e8e8e8',
          borderRadius: '12px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
          padding: '40px 36px',
          width: '100%',
          maxWidth: '360px',
        }}
      >
        {/* Logo lockup */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" rx="1.2" fill="white" />
              <rect x="9" y="2" width="5" height="5" rx="1.2" fill="white" fillOpacity="0.55" />
              <rect x="2" y="9" width="5" height="5" rx="1.2" fill="white" fillOpacity="0.55" />
              <rect x="9" y="9" width="5" height="5" rx="1.2" fill="white" fillOpacity="0.25" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#111111', margin: '0 0 1px 0', lineHeight: 1.2 }}>
              Finance Dashboard
            </p>
            <p style={{ fontSize: '11px', color: '#aaaaaa', margin: 0, lineHeight: 1.2 }}>
              PepsiCo · IT
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 500,
                color: '#777777',
                marginBottom: '6px',
              }}
            >
              Password
            </label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '9px 12px',
                fontSize: '14px',
                color: '#111111',
                background: '#ffffff',
                border: '1px solid #e0e0e0',
                borderRadius: '7px',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                transition: 'border-color 0.1s ease',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
            />
          </div>

          {error && (
            <p style={{ fontSize: '12.5px', color: '#dc2626', margin: 0 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '4px',
              width: '100%',
              padding: '9px 0',
              fontSize: '14px',
              fontWeight: 500,
              color: '#ffffff',
              background: loading ? '#93c5fd' : '#2563eb',
              border: 'none',
              borderRadius: '7px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.1s ease',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#1d4ed8' }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#2563eb' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
