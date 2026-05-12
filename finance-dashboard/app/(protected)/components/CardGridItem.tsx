'use client';

import { useState } from 'react';
import type { TrelloMember } from '@/lib/trello';
import { getMemberColor, getInitials, stalenessColor, labelHexColor } from '@/lib/utils';
import type { EnrichedCard } from './KanbanCard';

interface Props {
  card: EnrichedCard;
  members: TrelloMember[];
  onClick: () => void;
}

export default function CardGridItem({ card, members, onClick }: Props) {
  const [hovered, setHovered] = useState(false);
  const assignees = members.filter((m) => card.idMembers.includes(m.id));
  const isOverdue = card.due && !card.dueComplete && new Date(card.due) < new Date();
  const staleness = stalenessColor(card.daysInColumn);

  const totalChecklist = card.checklists.reduce((sum, cl) => sum + cl.checkItems.length, 0);
  const doneChecklist = card.checklists.reduce(
    (sum, cl) => sum + cl.checkItems.filter((i) => i.state === 'complete').length,
    0
  );

  const formatDue = (due: string) =>
    new Date(due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: '#ffffff',
        borderTop: `1px solid ${hovered ? '#d0d0d0' : '#e5e5e5'}`,
        borderRight: `1px solid ${hovered ? '#d0d0d0' : '#e5e5e5'}`,
        borderBottom: `1px solid ${hovered ? '#d0d0d0' : '#e5e5e5'}`,
        borderLeft: `3px solid ${staleness}`,
        borderRadius: '8px',
        padding: '14px 14px 12px',
        cursor: 'pointer',
        boxShadow: hovered ? '0 2px 8px rgba(0,0,0,0.06)' : '0 1px 2px rgba(0,0,0,0.03)',
        transition: 'border-color 0.12s ease, box-shadow 0.12s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        minHeight: '96px',
      }}
    >
      {/* Title */}
      <span
        style={{
          fontSize: '13.5px',
          fontWeight: 500,
          color: '#111111',
          lineHeight: '1.45',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {card.name}
      </span>

      {/* Labels */}
      {card.labels.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {card.labels.slice(0, 3).map((label) => {
            const hex = labelHexColor(label.color);
            return (
              <span
                key={label.id}
                title={label.name || label.color}
                style={{
                  display: 'inline-block',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  fontSize: '10.5px',
                  fontWeight: 500,
                  background: hex + '18',
                  color: hex,
                  border: `1px solid ${hex}28`,
                  maxWidth: '110px',
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
            <span style={{ fontSize: '10.5px', color: '#aaaaaa', padding: '2px 0', lineHeight: '1.6' }}>
              +{card.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Bottom bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        {/* Assignee avatars */}
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
          {assignees.length === 0 ? (
            <span style={{ fontSize: '11px', color: '#d0d0d0' }}>Unassigned</span>
          ) : (
            assignees.slice(0, 4).map((member) => (
              <div
                key={member.id}
                title={member.fullName}
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: getMemberColor(member.fullName),
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
                {getInitials(member.fullName)}
              </div>
            ))
          )}
        </div>

        {/* Checklist + due */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {totalChecklist > 0 && (
            <span
              style={{
                fontSize: '11px',
                color: doneChecklist === totalChecklist ? '#16a34a' : '#aaaaaa',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                <rect x="0.75" y="0.75" width="8.5" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                {doneChecklist === totalChecklist && (
                  <path d="M2.5 5l1.8 1.8 3-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </svg>
              {doneChecklist}/{totalChecklist}
            </span>
          )}

          {card.due && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 500,
                color: isOverdue ? '#dc2626' : card.dueComplete ? '#16a34a' : '#888888',
                background: isOverdue ? '#fef2f2' : card.dueComplete ? '#f0fdf4' : '#f4f4f4',
                padding: '2px 7px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
              }}
            >
              {formatDue(card.due)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
