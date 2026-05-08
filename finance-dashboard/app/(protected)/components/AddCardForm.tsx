'use client';

import { useState } from 'react';
import type { TrelloMember } from '@/lib/trello';
import type { EnrichedCard } from './KanbanCard';

interface Props {
  listId: string;
  members: TrelloMember[];
  onCancel: () => void;
  onAdd: (card: EnrichedCard) => void;
}

export default function AddCardForm({ listId, members, onCancel, onAdd }: Props) {
  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [due, setDue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listId,
          name: title.trim(),
          idMembers: assigneeId ? [assigneeId] : [],
          due: due || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to create card');
      const newCard = await res.json();
      onAdd({ ...newCard, daysInColumn: 0 });
    } catch {
      setError('Failed to create card — please try again.');
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '7px 9px',
    fontSize: '13px',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    fontFamily: 'inherit',
    outline: 'none',
    background: '#fff',
    boxSizing: 'border-box',
    color: '#111111',
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: '10px',
        borderTop: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <textarea
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Card title…"
        rows={2}
        style={{ ...inputStyle, resize: 'none' }}
        autoFocus
        onFocus={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
        onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e5e5')}
      />

      <select
        value={assigneeId}
        onChange={(e) => setAssigneeId(e.target.value)}
        style={{ ...inputStyle, cursor: 'pointer' }}
      >
        <option value="">Unassigned</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>{m.fullName}</option>
        ))}
      </select>

      <input
        type="date"
        value={due}
        onChange={(e) => setDue(e.target.value)}
        style={inputStyle}
        onFocus={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
        onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e5e5')}
      />

      {error && (
        <p style={{ fontSize: '12px', color: '#dc2626', margin: 0 }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '6px 14px',
            fontSize: '13px',
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.7 : 1,
            fontFamily: 'inherit',
            fontWeight: 500,
          }}
        >
          {submitting ? 'Adding…' : 'Add'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            background: 'transparent',
            color: '#888888',
            border: '1px solid #e5e5e5',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
