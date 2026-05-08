'use client';

import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd';
import type { TrelloList, TrelloMember } from '@/lib/trello';
import KanbanCard, { type EnrichedCard } from './components/KanbanCard';
import AddCardForm from './components/AddCardForm';
import CardSidePanel from './components/CardSidePanel';

type BoardData = {
  lists: TrelloList[];
  cards: EnrichedCard[];
  members: TrelloMember[];
  stale: boolean;
};

export default function BoardPage() {
  const [data, setData] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [staleBannerDismissed, setStaleBannerDismissed] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [addingToList, setAddingToList] = useState<string | null>(null);

  const loadBoardData = useCallback((): Promise<BoardData> => {
    return fetch('/api/board').then((res) => {
      if (!res.ok) throw new Error('Non-OK response');
      return res.json() as Promise<BoardData>;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadBoardData()
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFatalError('Failed to load board data');
          setLoading(false);
        }
      });

    const interval = setInterval(() => {
      loadBoardData()
        .then((json) => { if (!cancelled) setData(json); })
        .catch(() => {});
    }, 60_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [loadBoardData]);

  const handleRetry = () => {
    setFatalError(null);
    setLoading(true);
    loadBoardData()
      .then((json) => { setData(json); setLoading(false); })
      .catch(() => { setFatalError('Failed to load board data'); setLoading(false); });
  };

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination || !data) return;
      const { draggableId: cardId, source, destination } = result;
      if (source.droppableId === destination.droppableId) return;

      const newListId = destination.droppableId;
      const oldListId = source.droppableId;

      // Optimistic update
      setData((prev) =>
        prev
          ? { ...prev, cards: prev.cards.map((c) => (c.id === cardId ? { ...c, idList: newListId } : c)) }
          : prev
      );

      try {
        const res = await fetch(`/api/card/${cardId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idList: newListId }),
        });
        if (!res.ok) throw new Error();
      } catch {
        // Revert
        setData((prev) =>
          prev
            ? { ...prev, cards: prev.cards.map((c) => (c.id === cardId ? { ...c, idList: oldListId } : c)) }
            : prev
        );
      }
    },
    [data]
  );

  const handleCardUpdate = useCallback((cardId: string, changes: Partial<EnrichedCard>) => {
    setData((prev) =>
      prev
        ? { ...prev, cards: prev.cards.map((c) => (c.id === cardId ? { ...c, ...changes } : c)) }
        : prev
    );
  }, []);

  const handleCardAdded = useCallback((card: EnrichedCard) => {
    setData((prev) => (prev ? { ...prev, cards: [...prev.cards, card] } : prev));
    setAddingToList(null);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#999999', fontSize: '14px' }}>
        Loading board…
      </div>
    );
  }

  if (fatalError && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '12px' }}>
        <p style={{ color: '#666666', fontSize: '14px' }}>{fatalError}</p>
        <button
          onClick={handleRetry}
          style={{ padding: '6px 14px', fontSize: '13px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const selectedCard = selectedCardId ? (data.cards.find((c) => c.id === selectedCardId) ?? null) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Stale banner */}
      {data.stale && !staleBannerDismissed && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            marginBottom: '16px',
            background: '#fef9c3',
            border: '1px solid #fde68a',
            borderRadius: '6px',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '13px', color: '#92400e' }}>
            Unable to reach Trello — showing last cached data
          </span>
          <button
            onClick={() => setStaleBannerDismissed(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', fontSize: '18px', lineHeight: 1, padding: '0 4px' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div
          style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            alignItems: 'flex-start',
            paddingBottom: '16px',
          }}
        >
          {data.lists.map((list) => {
            const cards = data.cards
              .filter((c) => c.idList === list.id)
              .sort((a, b) => a.pos - b.pos);
            const isTeamSchedules = /team\s*schedule/i.test(list.name);

            return (
              <div
                key={list.id}
                style={{
                  width: '272px',
                  flexShrink: 0,
                  background: isTeamSchedules ? '#f5f5f0' : '#f0f0ef',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Column header */}
                <div
                  style={{
                    padding: '10px 12px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#111111' }}>{list.name}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#777777',
                      background: '#e5e5e5',
                      borderRadius: '10px',
                      padding: '1px 7px',
                    }}
                  >
                    {cards.length}
                  </span>
                </div>

                {/* Cards drop zone */}
                <Droppable droppableId={list.id}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        padding: '0 8px',
                        minHeight: '40px',
                        maxHeight: 'calc(100vh - 220px)',
                        overflowY: 'auto',
                      }}
                    >
                      {cards.map((card, index) => (
                        <KanbanCard
                          key={card.id}
                          card={card}
                          index={index}
                          members={data.members}
                          onClick={() => setSelectedCardId(card.id)}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {/* Add card */}
                {addingToList === list.id ? (
                  <AddCardForm
                    listId={list.id}
                    members={data.members}
                    onCancel={() => setAddingToList(null)}
                    onAdd={handleCardAdded}
                  />
                ) : (
                  <button
                    onClick={() => setAddingToList(list.id)}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      fontSize: '13px',
                      color: '#999999',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#555555')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#999999')}
                  >
                    + Add card
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Side panel */}
      {selectedCard && (
        <CardSidePanel
          key={selectedCard.id}
          card={selectedCard}
          members={data.members}
          onClose={() => setSelectedCardId(null)}
          onCardUpdate={handleCardUpdate}
        />
      )}
    </div>
  );
}
