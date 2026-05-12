'use client';

import { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import type { TrelloCard, TrelloMember } from '@/lib/trello';
import { stalenessColor, labelHexColor, getLabelAssignees } from '@/lib/utils';

export type EnrichedCard = TrelloCard & { daysInColumn: number };

interface Props {
  card: EnrichedCard;
  index: number;
  members: TrelloMember[];
  onClick: () => void;
}

export default function KanbanCard({ card, index, members: _members, onClick }: Props) {
  const [hovered, setHovered] = useState(false);
  const assignees = getLabelAssignees(card.labels);
  const isOverdue = card.due && !card.dueComplete && new Date(card.due) < new Date();
  const borderColor = stalenessColor(card.daysInColumn);

  const totalChecklist = card.checklists.reduce((sum, cl) => sum + cl.checkItems.length, 0);
  const doneChecklist = card.checklists.reduce(
    (sum, cl) => sum + cl.checkItems.filter((i) => i.state === 'complete').length,
    0
  );
  const checklistComplete = totalChecklist > 0 && doneChecklist === totalChecklist;

  const formatDue = (due: string) =>
    new Date(due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            ...provided.draggableProps.style,
            background: '#ffffff',
            boxShadow: snapshot.isDragging
              ? '0 8px 24px rgba(0,0,0,0.12)'
              : hovered
              ? '0 2px 8px rgba(0,0,0,0.09)'
              : '0 1px 3px rgba(0,0,0,0.05)',
            borderRadius: '6px',
            padding: '10px 12px',
            marginBottom: '7px',
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'box-shadow 0.15s ease',
            borderTop: `1px solid ${hovered ? '#e0e0e0' : '#eeeeee'}`,
            borderRight: `1px solid ${hovered ? '#e0e0e0' : '#eeeeee'}`,
            borderBottom: `1px solid ${hovered ? '#e0e0e0' : '#eeeeee'}`,
            borderLeft: `3px solid ${borderColor}`,
          }}
        >
          {/* Labels */}
          {card.labels.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', marginBottom: '7px', flexWrap: 'wrap' }}>
              {card.labels.slice(0, 3).map((label) => {
                const hex = labelHexColor(label.color);
                return (
                  <span
                    key={label.id}
                    title={label.name || label.color}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      fontSize: '10.5px',
                      fontWeight: 500,
                      background: hex + '18',
                      color: hex,
                      border: `1px solid ${hex}28`,
                      lineHeight: '1.3',
                      maxWidth: '80px',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {label.name || label.color}
                  </span>
                );
              })}
              {card.labels.length > 3 && (
                <span
                  style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10.5px',
                    color: '#aaaaaa',
                    background: '#f4f4f4',
                    border: '1px solid #eeeeee',
                  }}
                >
                  +{card.labels.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Title */}
          <p
            style={{
              fontSize: '13.5px',
              color: '#111111',
              lineHeight: '1.45',
              marginBottom: '9px',
              fontWeight: 400,
            }}
          >
            {card.name}
          </p>

          {/* Bottom row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            {/* Avatars */}
            <div style={{ display: 'flex', gap: '3px' }}>
              {assignees.map((assignee) => (
                <div
                  key={assignee.id}
                  title={assignee.name}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: assignee.color,
                    color: '#ffffff',
                    fontSize: '8.5px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    letterSpacing: '0.02em',
                  }}
                >
                  {assignee.initials}
                </div>
              ))}
            </div>

            {/* Metadata chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {totalChecklist > 0 && (
                <span
                  style={{
                    fontSize: '11px',
                    color: checklistComplete ? '#16a34a' : '#999999',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <rect x="0.75" y="0.75" width="8.5" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                    {checklistComplete && <path d="M2.5 5l1.8 1.8 3-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />}
                  </svg>
                  {doneChecklist}/{totalChecklist}
                </span>
              )}
              {card.due && (
                <span
                  style={{
                    fontSize: '11px',
                    color: isOverdue ? '#dc2626' : card.dueComplete ? '#16a34a' : '#888888',
                    background: isOverdue ? '#fef2f2' : card.dueComplete ? '#f0fdf4' : 'transparent',
                    padding: isOverdue || card.dueComplete ? '1px 5px' : '0',
                    borderRadius: '4px',
                    border: isOverdue ? '1px solid #fecaca' : card.dueComplete ? '1px solid #bbf7d0' : 'none',
                  }}
                >
                  {formatDue(card.due)}
                </span>
              )}
              <span style={{ fontSize: '11px', color: '#d0d0d0' }}>
                {card.daysInColumn}d
              </span>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
