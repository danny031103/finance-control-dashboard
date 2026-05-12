'use client';

import { useState, useEffect } from 'react';

type TeamCard = { id: string; name: string; desc: string; shortUrl: string };
type TeamList = { id: string; name: string; cards: TeamCard[] };
type TeamData = { lists: TeamList[] };

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s ease', flexShrink: 0 }}
    >
      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Panel({ list }: { list: TeamList }) {
  const [open, setOpen] = useState(true);

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e8e8e8',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '13px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          borderBottom: open ? '1px solid #f0f0f0' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ChevronIcon open={open} />
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#111111' }}>{list.name}</span>
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#aaaaaa',
            background: '#f4f4f4',
            borderRadius: '10px',
            padding: '2px 7px',
          }}
        >
          {list.cards.length}
        </span>
      </button>

      {open && (
        <ul style={{ margin: 0, padding: '4px 0', listStyle: 'none' }}>
          {list.cards.length === 0 ? (
            <li style={{ padding: '10px 16px', fontSize: '13px', color: '#999999' }}>No cards</li>
          ) : (
            list.cards.map((card) => (
              <li
                key={card.id}
                style={{
                  padding: '9px 16px',
                  borderBottom: '1px solid #f7f7f7',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <a
                  href={card.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '13px', color: '#111111', textDecoration: 'none' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#2563eb')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#111111')}
                >
                  {card.name}
                </a>
                {card.desc && (
                  <span style={{ fontSize: '12px', color: '#999999', whiteSpace: 'pre-wrap' }}>
                    {card.desc.length > 160 ? card.desc.slice(0, 160) + '…' : card.desc}
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default function TeamPage() {
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/team')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<TeamData>;
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ padding: '28px 32px 0', flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '2px solid #111111',
          }}
        >
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 700,
              color: '#111111',
              margin: 0,
              fontFamily: 'var(--font-space-grotesk)',
              letterSpacing: '-0.02em',
            }}
          >
            Team
          </h1>
        </div>
      </div>

      <div style={{ padding: '0 32px 32px', overflowY: 'auto', flex: 1 }}>
        {loading && (
          <p style={{ fontSize: '13px', color: '#999999', marginTop: '24px' }}>Loading…</p>
        )}
        {error && (
          <p style={{ fontSize: '13px', color: '#dc2626', marginTop: '24px' }}>Failed to load team data.</p>
        )}
        {data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '640px', paddingTop: '4px' }}>
            {data.lists.map((list) => (
              <Panel key={list.id} list={list} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
