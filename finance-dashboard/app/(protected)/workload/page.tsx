'use client';

import { useEffect, useState } from 'react';
import type { WorkloadData, MemberWorkload, StuckCard } from '@/app/api/workload/route';

// ── Loading / Error states ────────────────────────────────────────────────────

function CenteredMessage({ children, color = '#999999' }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color, fontSize: '13px' }}>
      {children}
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: '11px',
        fontWeight: 600,
        color: '#999999',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        margin: '0 0 12px 0',
      }}
    >
      {children}
    </p>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ initials, color }: { initials: string; color: string }) {
  return (
    <div
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 600,
        color: '#ffffff',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

// ── Column distribution bar ───────────────────────────────────────────────────

const BAR_COLORS = ['#2563eb', '#0891b2', '#059669', '#d97706', '#9333ea', '#dc2626'];

function ColumnBar({
  breakdown,
  total,
}: {
  breakdown: { columnName: string; count: number }[];
  total: number;
}) {
  if (total === 0) return <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '3px' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/* Stacked bar */}
      <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', background: '#f0f0f0' }}>
        {breakdown.map((seg, i) => (
          <div
            key={seg.columnName}
            title={`${seg.columnName}: ${seg.count}`}
            style={{
              width: `${(seg.count / total) * 100}%`,
              background: BAR_COLORS[i % BAR_COLORS.length],
              flexShrink: 0,
            }}
          />
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', marginTop: '2px' }}>
        {breakdown.map((seg, i) => (
          <span key={seg.columnName} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#666666' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '2px', background: BAR_COLORS[i % BAR_COLORS.length], display: 'inline-block', flexShrink: 0 }} />
            {seg.columnName}
            <span style={{ color: '#999999' }}>({seg.count})</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Member card ───────────────────────────────────────────────────────────────

function MemberCard({ member }: { member: MemberWorkload }) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e5e5',
        borderRadius: '8px',
        padding: '16px 18px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <Avatar initials={member.initials} color={member.color} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#111111', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {member.name}
          </p>
          <p style={{ fontSize: '12px', color: '#999999', margin: '1px 0 0' }}>
            {member.totalCards} active card{member.totalCards !== 1 ? 's' : ''}
            {member.stuckCount > 0 && (
              <span style={{ marginLeft: '8px', color: '#dc2626', fontWeight: 500 }}>
                {member.stuckCount} stuck
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Column distribution */}
      <div style={{ marginBottom: '0' }}>
        <p style={{ fontSize: '11px', fontWeight: 500, color: '#999999', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Column distribution
        </p>
        <ColumnBar breakdown={member.columnBreakdown} total={member.totalCards} />
      </div>
    </div>
  );
}

// ── Stuck card row ────────────────────────────────────────────────────────────

function StuckRow({ card, memberName, memberColor, memberInitials }: { card: StuckCard; memberName: string; memberColor: string; memberInitials: string }) {
  const stuckColor = card.daysStuck >= 14 ? '#dc2626' : '#ca8a04';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 16px',
        borderBottom: '1px solid #f4f4f4',
      }}
    >
      <Avatar initials={memberInitials} color={memberColor} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <a
          href={card.shortUrl}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: '13px', fontWeight: 500, color: '#111111', textDecoration: 'none', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {card.name}
        </a>
        <p style={{ fontSize: '12px', color: '#999999', margin: '1px 0 0' }}>
          {memberName} &middot; {card.columnName}
        </p>
      </div>
      <div
        style={{
          fontSize: '12px',
          fontWeight: 500,
          color: stuckColor,
          whiteSpace: 'nowrap',
          background: `${stuckColor}14`,
          padding: '2px 8px',
          borderRadius: '4px',
        }}
      >
        {card.daysStuck}d
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WorkloadPage() {
  const [data, setData] = useState<WorkloadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/workload')
      .then((r) => {
        if (!r.ok) throw new Error('Failed');
        return r.json() as Promise<WorkloadData>;
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CenteredMessage>Loading workload data…</CenteredMessage>;
  if (error || !data) return <CenteredMessage color="#dc2626">Failed to load workload data.</CenteredMessage>;

  // Collect all stuck cards across all members (deduplicated by card id, keeping shortest-days entry per person)
  const allStuckRows: { card: StuckCard; memberName: string; memberColor: string; memberInitials: string }[] = [];

  for (const member of data.members) {
    for (const card of member.stuckCards) {
      allStuckRows.push({
        card,
        memberName: member.name,
        memberColor: member.color,
        memberInitials: member.initials,
      });
    }
  }

  if (data.unassigned.stuckCount > 0) {
    for (const card of data.unassigned.stuckCards) {
      allStuckRows.push({
        card,
        memberName: 'Unassigned',
        memberColor: '#aaaaaa',
        memberInitials: '—',
      });
    }
  }

  allStuckRows.sort((a, b) => b.card.daysStuck - a.card.daysStuck);

  const totalActive = data.members.reduce((s, m) => s + m.totalCards, 0) + data.unassigned.totalCards;
  const totalStuck = allStuckRows.length;

  return (
    <div style={{ padding: '28px 32px 48px', maxWidth: '960px' }}>

      {/* Page header */}
      <div style={{ marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid #e5e5e5' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#111111', margin: '0 0 4px' }}>
          Workload
        </h1>
        <p style={{ fontSize: '13px', color: '#666666', margin: 0 }}>
          {totalActive} active card{totalActive !== 1 ? 's' : ''} across {data.members.length} team member{data.members.length !== 1 ? 's' : ''}
          {totalStuck > 0 && (
            <span style={{ marginLeft: '8px', color: '#dc2626' }}>
              &middot; {totalStuck} stuck card{totalStuck !== 1 ? 's' : ''}
            </span>
          )}
        </p>
      </div>

      {/* Per-person cards */}
      <div style={{ marginBottom: '36px' }}>
        <SectionLabel>Card count &amp; distribution</SectionLabel>

        {data.members.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#999999' }}>No active cards assigned to team members.</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '12px',
            }}
          >
            {data.members.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}

            {/* Unassigned bucket — only show if non-zero */}
            {data.unassigned.totalCards > 0 && (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px',
                  padding: '16px 18px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#e5e5e5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#999999',
                      flexShrink: 0,
                    }}
                  >
                    ?
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#111111', margin: 0 }}>Unassigned</p>
                    <p style={{ fontSize: '12px', color: '#999999', margin: '1px 0 0' }}>
                      {data.unassigned.totalCards} active card{data.unassigned.totalCards !== 1 ? 's' : ''}
                      {data.unassigned.stuckCount > 0 && (
                        <span style={{ marginLeft: '8px', color: '#dc2626', fontWeight: 500 }}>
                          {data.unassigned.stuckCount} stuck
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 500, color: '#999999', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Column distribution
                  </p>
                  <ColumnBar breakdown={data.unassigned.columnBreakdown} total={data.unassigned.totalCards} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stuck cards detail */}
      <div>
        <SectionLabel>Stuck cards (7+ days)</SectionLabel>

        {allStuckRows.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              padding: '24px 20px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '13px', color: '#16a34a', fontWeight: 500, margin: 0 }}>
              No stuck cards — all cards have moved within the last 7 days.
            </p>
          </div>
        ) : (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 16px',
                borderBottom: '1px solid #e5e5e5',
                background: '#fafafa',
              }}
            >
              <div style={{ width: '32px', flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: '11px', fontWeight: 600, color: '#999999', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Card
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#999999', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                Days stuck
              </div>
            </div>

            {allStuckRows.map(({ card, memberName, memberColor, memberInitials }) => (
              <StuckRow
                key={`${memberName}-${card.id}`}
                card={card}
                memberName={memberName}
                memberColor={memberColor}
                memberInitials={memberInitials}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
