'use client';

import { useState } from 'react';

// ── Section config ────────────────────────────────────────────────────────────

interface SectionMeta {
  accent: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
}

function getSectionMeta(title: string): SectionMeta {
  const t = title.toLowerCase();
  if (t.includes('summary'))
    return { accent: '#2563eb', bg: '#f0f6ff', border: '#bfdbfe', icon: <SummaryIcon /> };
  if (t.includes('risk'))
    return { accent: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: <RiskIcon /> };
  if (t.includes('completed'))
    return { accent: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: <CheckIcon /> };
  if (t.includes('progress'))
    return { accent: '#0891b2', bg: '#f0f9ff', border: '#bae6fd', icon: <ProgressIcon /> };
  if (t.includes('attention') || t.includes('blocked'))
    return { accent: '#ca8a04', bg: '#fefce8', border: '#fde68a', icon: <AttentionIcon /> };
  if (t.includes('notice') || t.includes('schedule') || t.includes('holiday'))
    return { accent: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', icon: <CalendarIcon /> };
  return { accent: '#666666', bg: '#f5f5f5', border: '#e5e5e5', icon: null };
}

// ── SVG icons ─────────────────────────────────────────────────────────────────

function SummaryIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 4v3l2 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function RiskIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1.5L13 12.5H1L7 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7 5.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="7" cy="10" r="0.75" fill="currentColor" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ProgressIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 7h10M8 4l4 3-4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function AttentionIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="7" cy="10" r="0.75" fill="currentColor" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1.5 6h11" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 1v3M9.5 1v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function SparkleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 2L12.5 8L18 9L12.5 10.5L11 17L9.5 10.5L4 9L9.5 8L11 2Z" stroke="#2563eb" strokeWidth="1.5" strokeLinejoin="round" fill="#dbeafe" />
      <path d="M17.5 3L18.3 5.7L21 6L18.3 6.8L17.5 9L16.7 6.8L14 6L16.7 5.7L17.5 3Z" stroke="#2563eb" strokeWidth="1.2" strokeLinejoin="round" fill="#dbeafe" />
    </svg>
  );
}

// ── Markdown renderer ─────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inlineBold(s: string): string {
  return escapeHtml(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function renderContent(text: string, accent: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items: string[] = [];
      while (
        i < lines.length &&
        (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))
      ) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul key={key++} style={{ margin: '0 0 10px 0', padding: 0, listStyle: 'none' }}>
          {items.map((item, j) => (
            <li
              key={j}
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
                fontSize: '13.5px',
                color: '#333333',
                lineHeight: '1.65',
                paddingBottom: '4px',
              }}
            >
              <span style={{ color: accent, flexShrink: 0, marginTop: '1px', fontWeight: 600 }}>•</span>
              <span dangerouslySetInnerHTML={{ __html: inlineBold(item) }} />
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <p
          key={key++}
          style={{ fontSize: '13.5px', color: '#333333', lineHeight: '1.7', margin: '0 0 8px 0' }}
          dangerouslySetInnerHTML={{ __html: inlineBold(trimmed) }}
        />
      );
      i++;
    }
  }

  return elements;
}

// ── Section parser ────────────────────────────────────────────────────────────

interface ParsedSection {
  title: string;
  content: string;
  isPartial: boolean;
}

function parseSections(text: string, streaming: boolean): ParsedSection[] {
  const sections: { title: string; content: string[] }[] = [];
  let current: { title: string; content: string[] } | null = null;

  for (const line of text.split('\n')) {
    if (line.startsWith('## ')) {
      if (current) sections.push(current);
      current = { title: line.slice(3).trim(), content: [] };
    } else if (current) {
      current.content.push(line);
    }
  }
  if (current) sections.push(current);

  return sections.map((s, i) => ({
    title: s.title,
    content: s.content.join('\n').trim(),
    isPartial: streaming && i === sections.length - 1,
  }));
}

// ── Section card ──────────────────────────────────────────────────────────────

function SectionCard({ section }: { section: ParsedSection }) {
  const meta = getSectionMeta(section.title);
  return (
    <div
      style={{
        background: '#ffffff',
        border: `1px solid ${section.isPartial ? '#e5e5e5' : '#111111'}`,
        borderRadius: '8px',
        overflow: 'hidden',
        opacity: section.isPartial ? 0.75 : 1,
        transition: 'opacity 0.2s ease, border-color 0.2s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '11px 16px',
          background: section.isPartial ? '#f9f9f9' : meta.bg,
          borderBottom: `1px solid ${section.isPartial ? '#e5e5e5' : '#111111'}`,
        }}
      >
        <span style={{ color: meta.accent, display: 'flex', alignItems: 'center' }}>
          {meta.icon}
        </span>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: meta.accent,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {section.title}
        </span>
        {section.isPartial && (
          <span style={{ marginLeft: 'auto', display: 'flex', gap: '3px', alignItems: 'center' }}>
            {[0, 1, 2].map((n) => (
              <span
                key={n}
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: '#aaaaaa',
                  animation: `pulse 1.2s ease-in-out ${n * 0.2}s infinite`,
                }}
              />
            ))}
          </span>
        )}
      </div>
      <div style={{ padding: '14px 16px 10px' }}>
        {section.content
          ? renderContent(section.content, meta.accent)
          : <p style={{ fontSize: '13px', color: '#aaaaaa', margin: 0, fontStyle: 'italic' }}>Generating…</p>}
      </div>
    </div>
  );
}

// ── State ─────────────────────────────────────────────────────────────────────

type State =
  | { status: 'idle' }
  | { status: 'streaming'; text: string; truncated: boolean }
  | { status: 'success'; text: string; truncated: boolean; generatedAt: string }
  | { status: 'error' };

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const day = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  return `Generated at ${time} on ${day}`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BriefingPage() {
  const [state, setState] = useState<State>({ status: 'idle' });
  const [copied, setCopied] = useState(false);

  async function generate() {
    setState({ status: 'streaming', text: '', truncated: false });
    try {
      const res = await fetch('/api/briefing', { method: 'POST' });
      if (!res.ok) throw new Error('failed');

      const truncated = res.headers.get('X-Truncated') === 'true';
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let text = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setState({ status: 'streaming', text, truncated });
      }

      setState({ status: 'success', text, truncated, generatedAt: new Date().toISOString() });
    } catch {
      setState({ status: 'error' });
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Idle ──
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
            <h2 style={{ fontSize: '22px', fontWeight: 500, color: '#111111', margin: '0 0 8px 0', letterSpacing: '0', fontFamily: 'var(--font-playfair)' }}>
              Monday Briefing
            </h2>
            <p style={{ fontSize: '13px', color: '#888888', lineHeight: '1.65', margin: 0 }}>
              AI-generated summary of board health — what&apos;s stuck, what shipped, who&apos;s working on what.
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

  // ── Error ──
  if (state.status === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '70vh', gap: '14px' }}>
        <p style={{ color: '#666666', fontSize: '14px', margin: 0 }}>Failed to generate briefing.</p>
        <button
          onClick={generate}
          style={{ padding: '8px 18px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Try again
        </button>
      </div>
    );
  }

  // ── Streaming or Success ──
  const isStreaming = state.status === 'streaming';
  const sections = parseSections(state.text, isStreaming);

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>

      <div style={{ padding: '28px 32px 40px', maxWidth: '780px' }}>
        {/* Header */}
        <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e8e8e8' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 500, color: '#111111', margin: '0 0 14px 0', letterSpacing: '0', fontFamily: 'var(--font-playfair)' }}>
            Monday Briefing
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '12px', color: '#bbbbbb', margin: 0 }}>
              {isStreaming
                ? 'Generating…'
                : formatTimestamp((state as { generatedAt: string }).generatedAt)}
            </p>
            {!isStreaming && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => copy(state.text)}
                  style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 500, border: '1px solid #e5e5e5', borderRadius: '6px', color: '#555555', background: '#ffffff', cursor: 'pointer', fontFamily: 'inherit' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={generate}
                  style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 500, background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#1d4ed8')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#2563eb')}
                >
                  Regenerate
                </button>
              </div>
            )}
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
            Board has &gt;60 cards — briefing based on the 60 most recently active.
          </div>
        )}

        {/* Sections */}
        {sections.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sections.map((section) => (
              <SectionCard key={section.title} section={section} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '24px', color: '#aaaaaa', fontSize: '13px' }}>
            <span style={{ display: 'flex', gap: '3px' }}>
              {[0, 1, 2].map((n) => (
                <span
                  key={n}
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: '#cccccc',
                    animation: `pulse 1.2s ease-in-out ${n * 0.2}s infinite`,
                  }}
                />
              ))}
            </span>
            Starting…
          </div>
        )}
      </div>
    </>
  );
}
