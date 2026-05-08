'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      router.push('/');
    } else {
      setError('Incorrect password');
    }
  }

  return (
    <div
      style={{ background: '#fafafa', minHeight: '100vh' }}
      className="flex items-center justify-center"
    >
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          padding: '40px 36px',
          width: '100%',
          maxWidth: '360px',
        }}
      >
        <p
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#111111',
            marginBottom: '24px',
          }}
        >
          Finance Dashboard
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '14px',
              color: '#111111',
              background: '#ffffff',
              border: '1px solid #e5e5e5',
              borderRadius: '6px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          {error && (
            <p style={{ fontSize: '13px', color: '#dc2626', marginTop: '8px' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '16px',
              width: '100%',
              padding: '8px 0',
              fontSize: '14px',
              fontWeight: 500,
              color: '#ffffff',
              background: loading ? '#93c5fd' : '#2563eb',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
