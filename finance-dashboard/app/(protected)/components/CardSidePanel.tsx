'use client';

import { useState, useEffect } from 'react';
import type { TrelloMember, CardAction } from '@/lib/trello';
import { getMemberColor, getInitials, labelHexColor } from '@/lib/utils';
import type { EnrichedCard } from './KanbanCard';

interface Props {
  card: EnrichedCard;
  members: TrelloMember[];
  onClose: () => void;
  onCardUpdate: (cardId: string, changes: Partial<EnrichedCard>) => void;
}

export default function CardSidePanel({ card, members, onClose, onCardUpdate }: Props) {
  const [history, setHistory] = useState<CardAction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/card/${card.id}/history`)
      .then((r) => r.json())
      .then((data: unknown) => {
        if (!cancelled) setHistory(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [card.id]);

  const comments = history.filter((a) => a.type === 'commentCard');
  const movements = history.filter((a) => a.type === 'updateCard' && a.data.listAfter);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    setCommentError('');
    try {
      const res = await fetch(`/api/card/${card.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText.trim() }),
      });
      if (!res.ok) throw new Error();
      const optimistic: CardAction = {
        id: `temp-${Date.now()}`,
        type: 'commentCard',
        date: new Date().toISOString(),
        data: { text: commentText.trim() },
        memberCreator: { id: '', fullName: 'You' },
      };
      setHistory((prev) => [optimistic, ...prev]);
      setCommentText('');
    } catch {
      setCommentError('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAssigneeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    const newMembers = newId ? [newId] : [];
    try {
      const res = await fetch(`/api/card/${card.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idMembers: newMembers }),
      });
      if (!res.ok) throw new Error();
      onCardUpdate(card.id, { idMembers: newMembers });
    } catch {
      // selection will snap back on next render since card.idMembers unchanged
    }
  };

  const primaryAssigneeId = card.idMembers[0] ?? '';
  const isOverdue = card.due && !card.dueComplete && new Date(card.due) < new Date();
  const primaryMember = members.find((m) => m.id === primaryAssigneeId);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const fmtDateTime = (d: string) =>
    new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 500,
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '6px',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 40 }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '380px',
          background: '#ffffff',
          borderLeft: '1px solid #e5e5e5',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e5e5e5',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <h2 style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: '#111111', lineHeight: 1.4 }}>
            {card.name}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#999999',
              fontSize: '20px',
              lineHeight: 1,
              padding: '0 2px',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Assignee */}
          <div>
            <label style={labelStyle}>Assignee</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {primaryMember && (
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: getMemberColor(primaryMember.fullName),
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getInitials(primaryMember.fullName)}
                </div>
              )}
              <select
                value={primaryAssigneeId}
                onChange={handleAssigneeChange}
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  fontSize: '13px',
                  border: '1px solid #e5e5e5',
                  borderRadius: '4px',
                  background: '#fff',
                  fontFamily: 'inherit',
                }}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.fullName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due date */}
          {card.due && (
            <div>
              <label style={labelStyle}>Due Date</label>
              <span style={{ fontSize: '13px', color: isOverdue ? '#dc2626' : '#111111' }}>
                {fmtDate(card.due)}
                {isOverdue && ' · Overdue'}
                {card.dueComplete && ' · Complete'}
              </span>
            </div>
          )}

          {/* Labels */}
          {card.labels.length > 0 && (
            <div>
              <label style={labelStyle}>Labels</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {card.labels.map((label) => {
                  const hex = labelHexColor(label.color);
                  return (
                    <span
                      key={label.id}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '3px',
                        fontSize: '12px',
                        background: hex + '1a',
                        color: hex,
                        border: `1px solid ${hex}33`,
                      }}
                    >
                      {label.name || label.color}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Checklists */}
          {card.checklists.length > 0 && (
            <div>
              <label style={labelStyle}>Checklists</label>
              {card.checklists.map((cl) => {
                const done = cl.checkItems.filter((i) => i.state === 'complete').length;
                return (
                  <div key={cl.id} style={{ marginBottom: '10px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#111111', marginBottom: '6px' }}>
                      {cl.name} — {done}/{cl.checkItems.length}
                    </p>
                    {cl.checkItems.map((item) => (
                      <div
                        key={item.id}
                        style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}
                      >
                        <div
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '3px',
                            border: `1px solid ${item.state === 'complete' ? '#2563eb' : '#d1d5db'}`,
                            background: item.state === 'complete' ? '#2563eb' : '#fff',
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: '13px',
                            color: item.state === 'complete' ? '#999999' : '#111111',
                            textDecoration: item.state === 'complete' ? 'line-through' : 'none',
                          }}
                        >
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* Description */}
          {card.desc && (
            <div>
              <label style={labelStyle}>Description</label>
              <p style={{ fontSize: '13px', color: '#444444', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {card.desc}
              </p>
            </div>
          )}

          {/* Comments */}
          <div>
            <label style={labelStyle}>Comments</label>

            <form onSubmit={handleAddComment} style={{ marginBottom: '14px' }}>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment…"
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '13px',
                  border: '1px solid #e5e5e5',
                  borderRadius: '4px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {commentError && (
                <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '2px' }}>{commentError}</p>
              )}
              {commentText.trim() && (
                <button
                  type="submit"
                  disabled={submittingComment}
                  style={{
                    marginTop: '6px',
                    padding: '5px 12px',
                    fontSize: '13px',
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: submittingComment ? 'not-allowed' : 'pointer',
                    opacity: submittingComment ? 0.7 : 1,
                  }}
                >
                  {submittingComment ? 'Saving…' : 'Save'}
                </button>
              )}
            </form>

            {historyLoading ? (
              <p style={{ fontSize: '13px', color: '#999999' }}>Loading…</p>
            ) : comments.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#999999' }}>No comments yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {comments.map((action) => (
                  <div key={action.id} style={{ display: 'flex', gap: '8px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: getMemberColor(action.memberCreator.fullName),
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '1px',
                      }}
                    >
                      {getInitials(action.memberCreator.fullName)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '3px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#111111' }}>
                          {action.memberCreator.fullName}
                        </span>
                        <span style={{ fontSize: '11px', color: '#999999' }}>
                          {fmtDateTime(action.date)}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#444444', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {action.data.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity */}
          {!historyLoading && movements.length > 0 && (
            <div>
              <label style={labelStyle}>Activity</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {movements.slice(0, 10).map((action) => (
                  <div key={action.id} style={{ fontSize: '12px', color: '#666666', lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 500 }}>{action.memberCreator.fullName}</span>
                    {' moved '}
                    <span style={{ color: '#999999' }}>{action.data.listBefore?.name}</span>
                    {' → '}
                    <span style={{ color: '#111111' }}>{action.data.listAfter?.name}</span>
                    {'  ·  '}
                    <span style={{ color: '#bbbbbb' }}>{fmtDateTime(action.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
