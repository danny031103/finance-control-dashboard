'use client';

import { useState } from 'react';

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; briefing: string; generatedAt: string; truncated: boolean }
  | { status: 'error' };

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const day = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  return `Generated at ${time} on ${day}`;
}

function SparkleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 2L12.5 8L18 9L12.5 10.5L11 17L9.5 10.5L4 9L9.5 8L11 2Z" stroke="#2563eb" strokeWidth="1.5" strokeLinejoin="round" fill="#dbeafe" />
      <path d="M17.5 3L18.3 5.7L21 6L18.3 6.8L17.5 9L16.7 6.8L14 6L16.7 5.7L17.5 3Z" stroke="#2563eb" strokeWidth="1.2" strokeLinejoin="round" fill="#dbeafe" />
    </svg>
  )
}

export default function BriefingPage() {
  const [state, setState] = useState<State>({ status: 'idle' });
  const [copied, setCopied] = useState(false);

  async function generate() {
    setState({ status: 'loading' });
    try {
      const res = await fetch('/api/briefing', { method: 'POST' });
      if (!res.ok) throw new Error('failed');
      const data = (await res.json()) as { briefing: string; generatedAt: string; truncated: boolean };
      setState({ status: 'success', ...data });
    } catch {
      setState({ status: 'error' });
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (state.status === 'idle') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '70vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '380px', textAlign: 'center' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: '#eff6ff',
              border: '1px solid #dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SparkleIcon />
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111111', margin: '0 0 8px 0', fontFamily: 'var(--font-space-grotesk)', letterSpacing: '-0.02em' }}>
              Monday Briefing
            </h2>
            <p style={{ fontSize: '13px', color: '#888888', lineHeight: '1.65', margin: 0 }}>
              Get an AI-generated summary of your team&apos;s board — highlights, blockers, and upcoming deadlines — in seconds.
            </p>
          </div>
          <button
            onClick={generate}
            style={{
              padding: '9px 22px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '7px',
              fontSize: '13.5px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.1s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1d4ed8')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#2563eb')}
          >
            Generate Briefing
          </button>
        </div>
      </div>
    );
  }

  if (state.status === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '70vh', gap: '14px' }}>
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: '#eff6ff',
            border: '1px solid #dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SparkleIcon />
        </div>
        <p style={{ color: '#888888', fontSize: '13px', margin: 0 }}>Generating briefing…</p>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '70vh', gap: '14px' }}>
        <p style={{ color: '#666666', fontSize: '14px', margin: 0 }}>Failed to generate briefing.</p>
        <button
          onClick={generate}
          style={{
            padding: '8px 18px',
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '7px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px 40px', maxWidth: '760px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '2px solid #111111' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111111', margin: '0 0 16px 0', fontFamily: 'var(--font-space-grotesk)', letterSpacing: '-0.02em' }}>
          Monday Briefing
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '12px', color: '#bbbbbb', margin: 0 }}>
            {formatTimestamp(state.generatedAt)}
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => copy(state.briefing)}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 500,
                border: '1px solid #e5e5e5',
                borderRadius: '6px',
                color: '#555555',
                background: '#ffffff',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background 0.1s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={generate}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 500,
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background 0.1s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#1d4ed8')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#2563eb')}
            >
              Regenerate
            </button>
          </div>
        </div>
      </div>

      {state.truncated && (
        <div
          style={{
            marginBottom: '16px',
            padding: '10px 14px',
            background: '#fefce8',
            border: '1px solid #fde68a',
            borderRadius: '7px',
            fontSize: '12px',
            color: '#92400e',
          }}
        >
          Board has &gt;50 cards — briefing based on the 50 most recently active.
        </div>
      )}

      <div
        style={{
          background: '#ffffff',
          border: '1px solid #ebebeb',
          borderRadius: '8px',
          padding: '24px 28px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            fontSize: '13.5px',
            color: '#222222',
            fontFamily: 'inherit',
            lineHeight: '1.75',
            margin: 0,
          }}
        >
          {state.briefing}
        </pre>
      </div>
    </div>
  );
}
