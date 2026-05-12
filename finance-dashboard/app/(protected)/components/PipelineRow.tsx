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

export default function PipelineRow({ card, members, onClick }: Props) {
  const [hovered, setHovered] = useState(false);
  const assignees = members.filter((m) => card.idMembers.includes(m.id));
  const isOverdue = card.due && !card.dueComplete && new Date(card.due) < new Date();
  const borderColor = stalenessColor(card.daysInColumn);

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
        display: 'grid',
        gridTemplateColumns: '4px 1fr 136px 56px 100px 76px 52px',
        alignItems: 'center',
        borderBottom: '1px solid #f2f2f2',
        cursor: 'pointer',
        background: hovered ? '#fafafa' : '#ffffff',
        transition: 'background 0.1s ease',
        minHeight: '44px',
      }}
    >
      {/* Staleness bar */}
      <div
        style={{
          alignSelf: 'stretch',
          background: borderColor,
        }}
      />

      {/* Title */}
      <span
        style={{
          fontSize: '13.5px',
          color: '#111111',
          fontWeight: 400,
          lineHeight: '1.4',
          padding: '10px 16px',
          minWidth: 0,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}
      >
        {card.name}
      </span>

      {/* Labels */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          paddingRight: '16px',
          alignItems: 'center',
          justifyContent: 'flex-end',
          overflow: 'hidden',
        }}
      >
        {card.labels.slice(0, 2).map((label) => {
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
                maxWidth: '64px',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}
            >
              {label.name || label.color}
            </span>
          );
        })}
        {card.labels.length > 2 && (
          <span style={{ fontSize: '10.5px', color: '#aaaaaa' }}>+{card.labels.length - 2}</span>
        )}
      </div>

      {/* Checklist */}
      <span
        style={{
          paddingRight: '16px',
          fontSize: '11px',
          color: totalChecklist === 0 ? 'transparent' : doneChecklist === totalChecklist ? '#16a34a' : '#aaaaaa',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          justifyContent: 'flex-end',
        }}
      >
        {totalChecklist > 0 && (
          <>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
              <rect x="0.75" y="0.75" width="8.5" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              {doneChecklist === totalChecklist && (
                <path d="M2.5 5l1.8 1.8 3-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
            {doneChecklist}/{totalChecklist}
          </>
        )}
      </span>

      {/* Assignees */}
      <div
        style={{
          display: 'flex',
          gap: '3px',
          paddingRight: '16px',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        {assignees.length === 0 ? (
          <span style={{ fontSize: '12px', color: '#d0d0d0' }}>—</span>
        ) : (
          assignees.slice(0, 3).map((member) => (
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

      {/* Due date */}
      <span
        style={{
          paddingRight: '16px',
          fontSize: '12px',
          color: isOverdue ? '#dc2626' : card.dueComplete ? '#16a34a' : '#888888',
          textAlign: 'right',
        }}
      >
        {card.due ? formatDue(card.due) : <span style={{ color: '#d0d0d0' }}>—</span>}
      </span>

      {/* Age */}
      <span
        style={{
          paddingRight: '16px',
          fontSize: '12px',
          color: '#c0c0c0',
          textAlign: 'right',
        }}
      >
        {card.daysInColumn}d
      </span>
    </div>
  );
}
