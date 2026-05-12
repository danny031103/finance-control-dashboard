'use client';

import { useState, useEffect } from 'react';
import type { TrelloMember, TrelloList, CardAction } from '@/lib/trello';
import { getMemberColor, getInitials, labelHexColor, getLabelAssignees } from '@/lib/utils';
import type { EnrichedCard } from './KanbanCard';

interface Props {
  card: EnrichedCard;
  members: TrelloMember[];
  lists: TrelloList[];
  onClose: () => void;
  onCardUpdate: (cardId: string, changes: Partial<EnrichedCard>) => void;
}

export default function CardSidePanel({ card, members: _members, lists, onClose, onCardUpdate }: Props) {
  const [history, setHistory] = useState<CardAction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [movingCard, setMovingCard] = useState(false);
  const [moveSuccess, setMoveSuccess] = useState(false);
  const [moveError, setMoveError] = useState('');
  const [commentSuccess, setCommentSuccess] = useState(false);

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
      setCommentSuccess(true);
      setTimeout(() => setCommentSuccess(false), 2000);
    } catch {
      setCommentError('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleMoveCard = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newListId = e.target.value;
    if (!newListId || newListId === card.idList) return;
    setMovingCard(true);
    setMoveError('');
    setMoveSuccess(false);
    try {
      const res = await fetch(`/api/card/${card.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idList: newListId }),
      });
      if (!res.ok) throw new Error();
      onCardUpdate(card.id, { idList: newListId });
      setMoveSuccess(true);
      setTimeout(() => setMoveSuccess(false), 2000);
    } catch {
      setMoveError('Failed to move card');
    } finally {
      setMovingCard(false);
    }
  };

  const isOverdue = card.due && !card.dueComplete && new Date(card.due) < new Date();
  const labelAssignees = getLabelAssignees(card.labels);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const fmtDateTime = (d: string) =>
    new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  const sectionLabel: React.CSSProperties = {
    display: 'block',
    fontSize: '10.5px',
    fontWeight: 600,
    color: '#aaaaaa',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    marginBottom: '8px',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.18)', zIndex: 40 }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '390px',
          background: '#ffffff',
          borderLeft: '1px solid #e8e8e8',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.06)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 20px 16px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <h2 style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: '#111111', lineHeight: 1.4, margin: 0 }}>
            {card.name}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#cccccc',
              fontSize: '20px',
              lineHeight: 1,
              padding: '0 2px',
              flexShrink: 0,
              fontFamily: 'inherit',
              transition: 'color 0.1s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#888888')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#cccccc')}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Move to column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ ...sectionLabel, marginBottom: 0 }}>Move to Column</label>
              {moveSuccess && (
                <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 500 }}>Moved</span>
              )}
              {moveError && (
                <span style={{ fontSize: '12px', color: '#dc2626' }}>{moveError}</span>
              )}
            </div>
            <select
              value={card.idList}
              onChange={handleMoveCard}
              disabled={movingCard}
              style={{
                width: '100%',
                padding: '6px 9px',
                fontSize: '13px',
                border: '1px solid #e5e5e5',
                borderRadius: '6px',
                background: movingCard ? '#f8f8f8' : '#fff',
                fontFamily: 'inherit',
                color: '#111111',
                cursor: movingCard ? 'not-allowed' : 'pointer',
                outline: 'none',
                opacity: movingCard ? 0.7 : 1,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e5e5')}
            >
              {lists
                .filter((l) => !/team\s*schedule/i.test(l.name))
                .map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
            </select>
          </div>

          {/* Assignee */}
          <div>
            <label style={sectionLabel}>Assignee</label>
            {labelAssignees.length === 0 ? (
              <span style={{ fontSize: '13px', color: '#bbbbbb' }}>Unassigned</span>
            ) : (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {labelAssignees.map((assignee) => (
                  <div key={assignee.id} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: assignee.color,
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {assignee.initials}
                    </div>
                    <span style={{ fontSize: '13px', color: '#333333', fontWeight: 500 }}>{assignee.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Due date */}
          {card.due && (
            <div>
              <label style={sectionLabel}>Due Date</label>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '13px',
                  color: isOverdue ? '#dc2626' : card.dueComplete ? '#16a34a' : '#333333',
                  background: isOverdue ? '#fef2f2' : card.dueComplete ? '#f0fdf4' : '#f4f4f4',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: isOverdue ? '1px solid #fecaca' : card.dueComplete ? '1px solid #bbf7d0' : '1px solid #ebebeb',
                }}
              >
                {fmtDate(card.due)}
                {isOverdue && ' · Overdue'}
                {card.dueComplete && ' · Complete'}
              </span>
            </div>
          )}

          {/* Labels */}
          {card.labels.length > 0 && (
            <div>
              <label style={sectionLabel}>Labels</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {card.labels.map((label) => {
                  const hex = labelHexColor(label.color);
                  return (
                    <span
                      key={label.id}
                      style={{
                        padding: '3px 9px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: hex + '18',
                        color: hex,
                        border: `1px solid ${hex}28`,
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
              <label style={sectionLabel}>Checklists</label>
              {card.checklists.map((cl) => {
                const done = cl.checkItems.filter((i) => i.state === 'complete').length;
                const pct = cl.checkItems.length > 0 ? Math.round((done / cl.checkItems.length) * 100) : 0;
                return (
                  <div key={cl.id} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: '#111111', margin: 0 }}>
                        {cl.name}
                      </p>
                      <span style={{ fontSize: '11px', color: '#aaaaaa' }}>{done}/{cl.checkItems.length}</span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: '3px', background: '#f0f0f0', borderRadius: '2px', marginBottom: '8px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: pct === 100 ? '#16a34a' : '#2563eb',
                          borderRadius: '2px',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                    {cl.checkItems.map((item) => (
                      <div
                        key={item.id}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}
                      >
                        <div
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '3px',
                            border: `1.5px solid ${item.state === 'complete' ? '#2563eb' : '#d5d5d5'}`,
                            background: item.state === 'complete' ? '#2563eb' : '#fff',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {item.state === 'complete' && (
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                              <path d="M1 4l2 2 4-3.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: '13px',
                            color: item.state === 'complete' ? '#bbbbbb' : '#222222',
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
              <label style={sectionLabel}>Description</label>
              <p
                style={{
                  fontSize: '13px',
                  color: '#444444',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.65',
                  background: '#f8f8f8',
                  border: '1px solid #efefef',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  margin: 0,
                }}
              >
                {card.desc}
              </p>
            </div>
          )}

          {/* Comments */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ ...sectionLabel, marginBottom: 0 }}>Comments</label>
              {commentSuccess && (
                <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 500 }}>Saved</span>
              )}
            </div>

            <form onSubmit={handleAddComment} style={{ marginBottom: '16px' }}>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment…"
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: '13px',
                  border: '1px solid #e5e5e5',
                  borderRadius: '6px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                  color: '#111111',
                  transition: 'border-color 0.1s ease',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e5e5')}
              />
              {commentError && (
                <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '3px', marginBottom: 0 }}>{commentError}</p>
              )}
              {commentText.trim() && (
                <button
                  type="submit"
                  disabled={submittingComment}
                  style={{
                    marginTop: '7px',
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: 500,
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: submittingComment ? 'not-allowed' : 'pointer',
                    opacity: submittingComment ? 0.7 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  {submittingComment ? 'Saving…' : 'Save'}
                </button>
              )}
            </form>

            {historyLoading ? (
              <p style={{ fontSize: '13px', color: '#bbbbbb' }}>Loading…</p>
            ) : comments.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#bbbbbb' }}>No comments yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {comments.map((action) => (
                  <div key={action.id} style={{ display: 'flex', gap: '10px' }}>
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
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
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#111111' }}>
                          {action.memberCreator.fullName}
                        </span>
                        <span style={{ fontSize: '11px', color: '#bbbbbb' }}>
                          {fmtDateTime(action.date)}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: '13px',
                          color: '#444444',
                          lineHeight: '1.55',
                          whiteSpace: 'pre-wrap',
                          background: '#f8f8f8',
                          border: '1px solid #efefef',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          margin: 0,
                        }}
                      >
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
              <label style={sectionLabel}>Activity</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {movements.slice(0, 10).map((action) => (
                  <div
                    key={action.id}
                    style={{
                      fontSize: '12px',
                      color: '#777777',
                      lineHeight: '1.5',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontWeight: 500, color: '#555555' }}>{action.memberCreator.fullName}</span>
                    <span>moved</span>
                    <span
                      style={{
                        padding: '1px 6px',
                        background: '#f4f4f4',
                        borderRadius: '4px',
                        fontSize: '11.5px',
                        color: '#888888',
                        border: '1px solid #ebebeb',
                      }}
                    >
                      {action.data.listBefore?.name}
                    </span>
                    <span style={{ color: '#cccccc' }}>→</span>
                    <span
                      style={{
                        padding: '1px 6px',
                        background: '#f0f5ff',
                        borderRadius: '4px',
                        fontSize: '11.5px',
                        color: '#2563eb',
                        border: '1px solid #dbeafe',
                      }}
                    >
                      {action.data.listAfter?.name}
                    </span>
                    <span style={{ color: '#cccccc', fontSize: '11px' }}>{fmtDateTime(action.date)}</span>
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
