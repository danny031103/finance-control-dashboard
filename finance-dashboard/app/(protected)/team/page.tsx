'use client';

import { useState, useEffect, useRef } from 'react';

type TeamCard = { id: string; name: string; desc: string; shortUrl: string };
type TeamList = { id: string; name: string; cards: TeamCard[] };
type TeamData = { lists: TeamList[] };

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s ease', flexShrink: 0 }}
    >
      <path d="M4.5 2.5l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M8.5 1.5a1.207 1.207 0 011.707 1.707L3.5 9.914 1 10.5l.586-2.5L8.5 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CardItem({ card, onSave }: { card: TeamCard; onSave: (id: string, name: string, desc: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(card.name);
  const [desc, setDesc] = useState(card.desc);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setName(card.name);
    setDesc(card.desc);
    setError(false);
    setEditing(true);
    setTimeout(() => nameRef.current?.focus(), 0);
  }

  function cancel() {
    setEditing(false);
    setError(false);
  }

  async function save() {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setSaving(true);
    setError(false);
    try {
      const res = await fetch(`/api/card/${card.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, desc: desc.trim() }),
      });
      if (!res.ok) throw new Error();
      onSave(card.id, trimmedName, desc.trim());
      setEditing(false);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div
        style={{
          padding: '10px 14px',
          borderRadius: '6px',
          background: '#ffffff',
          border: '1px solid #2563eb',
          boxShadow: '0 0 0 3px rgba(37,99,235,0.08)',
        }}
      >
        <input
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
          style={{
            width: '100%',
            fontSize: '13px',
            fontWeight: 500,
            color: '#111111',
            border: '1px solid #e5e5e5',
            borderRadius: '4px',
            padding: '4px 8px',
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          placeholder="Card name"
        />
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') cancel(); }}
          rows={3}
          style={{
            width: '100%',
            marginTop: '6px',
            fontSize: '12px',
            color: '#444444',
            border: '1px solid #e5e5e5',
            borderRadius: '4px',
            padding: '4px 8px',
            fontFamily: 'inherit',
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box',
            lineHeight: '1.5',
          }}
          placeholder="Description (optional)"
        />
        {error && (
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#dc2626' }}>
            Failed to save — try again.
          </p>
        )}
        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
          <button
            onClick={save}
            disabled={saving || !name.trim()}
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#ffffff',
              background: saving ? '#93b4f8' : '#2563eb',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 12px',
              cursor: saving ? 'default' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={cancel}
            disabled={saving}
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#666666',
              background: '#f4f4f4',
              border: '1px solid #e5e5e5',
              borderRadius: '4px',
              padding: '4px 12px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '10px 14px',
        borderRadius: '6px',
        background: '#ffffff',
        border: '1px solid #e5e5e5',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        const btn = e.currentTarget.querySelector<HTMLElement>('[data-edit-btn]');
        if (btn) btn.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        const btn = e.currentTarget.querySelector<HTMLElement>('[data-edit-btn]');
        if (btn) btn.style.opacity = '0';
      }}
    >
      <button
        data-edit-btn
        onClick={startEdit}
        style={{
          position: 'absolute',
          top: '8px',
          right: '10px',
          opacity: '0',
          transition: 'opacity 0.1s',
          background: '#f4f4f4',
          border: '1px solid #e5e5e5',
          borderRadius: '4px',
          padding: '3px 6px',
          cursor: 'pointer',
          color: '#666666',
          display: 'flex',
          alignItems: 'center',
        }}
        title="Edit card"
      >
        <PencilIcon />
      </button>
      <span
        style={{
          fontSize: '13px',
          fontWeight: 500,
          color: '#111111',
          lineHeight: '1.45',
          display: 'block',
          paddingRight: '28px',
        }}
      >
        {card.name}
      </span>
      {card.desc && (
        <p
          style={{
            margin: '4px 0 0',
            fontSize: '12px',
            color: '#888888',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
          }}
        >
          {card.desc.length > 180 ? card.desc.slice(0, 180) + '…' : card.desc}
        </p>
      )}
    </div>
  );
}

function Panel({ list }: { list: TeamList }) {
  const [open, setOpen] = useState(true);
  const [cards, setCards] = useState(list.cards);

  function handleSave(id: string, name: string, desc: string) {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, name, desc } : c)));
  }

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #111111',
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
          padding: '12px 14px',
          background: '#fafafa',
          border: 'none',
          borderBottom: open ? '1px solid #e5e5e5' : 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ color: '#999999' }}>
            <ChevronIcon open={open} />
          </span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#111111', letterSpacing: '-0.01em' }}>
            {list.name}
          </span>
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#666666',
            background: '#efefef',
            borderRadius: '10px',
            padding: '2px 8px',
            letterSpacing: '0.01em',
          }}
        >
          {cards.length}
        </span>
      </button>

      {open && (
        <div style={{ padding: '6px 6px 8px' }}>
          {cards.length === 0 ? (
            <div
              style={{
                padding: '20px 14px',
                fontSize: '13px',
                color: '#aaaaaa',
                textAlign: 'center',
              }}
            >
              No items in this list
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {cards.map((card) => (
                <CardItem key={card.id} card={card} onSave={handleSave} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 32px',
        gap: '8px',
      }}
    >
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="8" width="24" height="18" rx="2" stroke="#dddddd" strokeWidth="1.5" />
        <path d="M4 13h24" stroke="#dddddd" strokeWidth="1.5" />
        <path d="M10 18h6M10 22h4" stroke="#dddddd" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <p style={{ fontSize: '13px', color: '#aaaaaa', margin: 0 }}>No team lists found</p>
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

  const totalCards = data?.lists.reduce((sum, l) => sum + l.cards.length, 0) ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Header */}
      <div style={{ padding: '28px 32px 0', flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid #e5e5e5',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 500,
                color: '#111111',
                margin: '0 0 3px',
                letterSpacing: '0',
                fontFamily: 'var(--font-playfair)',
              }}
            >
              Team
            </h1>
            {data && (
              <p style={{ margin: 0, fontSize: '13px', color: '#999999' }}>
                {data.lists.length} {data.lists.length === 1 ? 'list' : 'lists'} · {totalCards} {totalCards === 1 ? 'item' : 'items'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 32px 32px', overflowY: 'auto', flex: 1 }}>
        {loading && (
          <div style={{ paddingTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '800px' }}>
            {[1, 2].map((i) => (
              <div
                key={i}
                style={{
                  height: '120px',
                  borderRadius: '8px',
                  background: '#f0f0f0',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: '24px',
              padding: '12px 14px',
              borderRadius: '6px',
              background: '#fff5f5',
              border: '1px solid #fecaca',
              fontSize: '13px',
              color: '#dc2626',
            }}
          >
            Failed to load team data.
          </div>
        )}

        {data && data.lists.length === 0 && <EmptyState />}

        {data && data.lists.length > 0 && (
          <div
            style={{
              paddingTop: '4px',
              display: 'grid',
              gridTemplateColumns: data.lists.length > 1 ? 'repeat(auto-fill, minmax(340px, 1fr))' : '1fr',
              maxWidth: data.lists.length === 1 ? '560px' : '100%',
              gap: '12px',
              alignItems: 'start',
            }}
          >
            {data.lists.map((list) => (
              <Panel key={list.id} list={list} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
