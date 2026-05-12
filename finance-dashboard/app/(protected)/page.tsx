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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#999999', fontSize: '13px' }}>
        Loading board…
      </div>
    );
  }

  if (fatalError && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '14px' }}>
        <p style={{ color: '#666666', fontSize: '14px' }}>{fatalError}</p>
        <button
          onClick={handleRetry}
          style={{
            padding: '7px 16px',
            fontSize: '13px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const selectedCard = selectedCardId ? (data.cards.find((c) => c.id === selectedCardId) ?? null) : null;

  const HIDDEN_LIST_RE = /here.{0,10}team|team.{0,10}schedule|resources/i;
  const visibleLists = data.lists.filter((l) => !HIDDEN_LIST_RE.test(l.name));
  const hiddenListIds = new Set(data.lists.filter((l) => HIDDEN_LIST_RE.test(l.name)).map((l) => l.id));
  const totalCards = data.cards.filter((c) => !hiddenListIds.has(c.idList)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

      {/* Page header */}
      <div
        style={{
          padding: '28px 32px 0',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #111111' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111111', margin: 0, fontFamily: 'var(--font-space-grotesk)', letterSpacing: '-0.02em' }}>
              Board
            </h1>
            {/* Live indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#16a34a',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '12px', color: '#999999' }}>Live</span>
            </div>
          </div>
          <span style={{ fontSize: '12px', color: '#bbbbbb' }}>
            {totalCards} card{totalCards !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Stale banner */}
        {data.stale && !staleBannerDismissed && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 14px',
              marginBottom: '16px',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '7px',
            }}
          >
            <span style={{ fontSize: '13px', color: '#92400e' }}>
              Unable to reach Trello — showing last cached data
            </span>
            <button
              onClick={() => setStaleBannerDismissed(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#b45309',
                fontSize: '16px',
                lineHeight: 1,
                padding: '0 4px',
                fontFamily: 'inherit',
              }}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Board scroll area */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            alignItems: 'flex-start',
            padding: '16px 32px 32px',
            flex: 1,
          }}
        >
          {visibleLists.map((list) => {
            const cards = data.cards
              .filter((c) => c.idList === list.id)
              .sort((a, b) => a.pos - b.pos);
            return (
              <div
                key={list.id}
                style={{
                  width: '278px',
                  flexShrink: 0,
                  background: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e8e8e8',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Column header */}
                <div
                  style={{
                    padding: '12px 14px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #f0f0f0',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#111111',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {list.name}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#aaaaaa',
                      background: '#f4f4f4',
                      borderRadius: '10px',
                      padding: '2px 7px',
                      lineHeight: '1.4',
                    }}
                  >
                    {cards.length}
                  </span>
                </div>

                {/* Cards drop zone */}
                <Droppable droppableId={list.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        padding: '8px',
                        minHeight: '48px',
                        maxHeight: 'calc(100vh - 240px)',
                        overflowY: 'auto',
                        background: snapshot.isDraggingOver ? 'rgba(37,99,235,0.02)' : 'transparent',
                        transition: 'background 0.15s ease',
                        borderRadius: '0 0 4px 4px',
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
                        padding: '8px 14px 10px',
                        fontSize: '13px',
                        color: '#c0c0c0',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        flexShrink: 0,
                        fontFamily: 'inherit',
                        borderTop: '1px solid #f4f4f4',
                        transition: 'color 0.1s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#666666')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#c0c0c0')}
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
          lists={data.lists}
          onClose={() => setSelectedCardId(null)}
          onCardUpdate={handleCardUpdate}
        />
      )}
    </div>
  );
}
