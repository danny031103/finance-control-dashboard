'use client';

import { Draggable } from '@hello-pangea/dnd';
import type { TrelloCard, TrelloMember } from '@/lib/trello';
import { getMemberColor, getInitials, stalenessColor, labelHexColor } from '@/lib/utils';

export type EnrichedCard = TrelloCard & { daysInColumn: number };

interface Props {
  card: EnrichedCard;
  index: number;
  members: TrelloMember[];
  onClick: () => void;
}

export default function KanbanCard({ card, index, members, onClick }: Props) {
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
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          style={{
            ...provided.draggableProps.style,
            borderLeft: `3px solid ${borderColor}`,
            background: snapshot.isDragging ? '#f5f5f5' : '#ffffff',
            boxShadow: snapshot.isDragging
              ? '0 4px 12px rgba(0,0,0,0.12)'
              : '0 1px 3px rgba(0,0,0,0.06)',
            borderRadius: '6px',
            padding: '10px 12px',
            marginBottom: '6px',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          {/* Label dots */}
          {card.labels.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
              {card.labels.slice(0, 4).map((label) => (
                <span
                  key={label.id}
                  title={label.name || label.color}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: labelHexColor(label.color),
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          )}

          {/* Title */}
          <p style={{ fontSize: '14px', color: '#111111', lineHeight: '1.4', marginBottom: '8px' }}>
            {card.name}
          </p>

          {/* Bottom row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            {/* Assignee avatars */}
            <div style={{ display: 'flex', gap: '3px' }}>
              {assignees.map((member) => (
                <div
                  key={member.id}
                  title={member.fullName}
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: getMemberColor(member.fullName),
                    color: '#ffffff',
                    fontSize: '9px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getInitials(member.fullName)}
                </div>
              ))}
            </div>

            {/* Metadata */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {totalChecklist > 0 && (
                <span style={{ fontSize: '11px', color: '#999999' }}>
                  {doneChecklist}/{totalChecklist}
                </span>
              )}
              {card.due && (
                <span style={{ fontSize: '11px', color: isOverdue ? '#dc2626' : '#666666' }}>
                  {formatDue(card.due)}
                </span>
              )}
              <span style={{ fontSize: '11px', color: '#bbbbbb' }}>
                {card.daysInColumn}d
              </span>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
