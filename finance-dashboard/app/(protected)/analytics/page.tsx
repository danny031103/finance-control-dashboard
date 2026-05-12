'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { getMemberColor } from '@/lib/utils';

interface AnalyticsData {
  cardsCompletedPerWeek: { week: string; count: number }[];
  avgTimePerColumn: { list: string; avgDays: number }[];
  cardsPerPersonPerWeek: Record<string, string | number>[];
  activeCardsByAssignee: { name: string; count: number; color: string }[];
  cardAgeDistribution: { bucket: string; count: number }[];
  members: string[];
  weekCount: number;
}

const tooltipStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e5e5',
  borderRadius: '6px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  fontSize: '12px',
  color: '#111111',
  padding: '8px 12px',
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle}>
      {label && <p style={{ marginBottom: '4px', fontWeight: 500, fontSize: '11px', color: '#888888' }}>{label}</p>}
      {payload.map((entry) => (
        <p key={entry.name} style={{ fontSize: '12px', color: entry.color ?? '#111111', margin: '2px 0' }}>
          {entry.name}: <span style={{ fontWeight: 600 }}>{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

function ChartCard({ title, children, fullWidth = false }: { title: string; children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #111111',
        borderRadius: '8px',
        overflow: 'hidden',
        gridColumn: fullWidth ? '1 / -1' : undefined,
      }}
    >
      <div
        style={{
          padding: '12px 16px 10px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <p
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: '#888888',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {title}
        </p>
      </div>
      <div style={{ padding: '18px 20px 16px' }}>
        {children}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => {
        if (!r.ok) throw new Error('Failed');
        return r.json() as Promise<AnalyticsData>;
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#999999', fontSize: '13px' }}>
        Loading analytics…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#dc2626', fontSize: '13px' }}>
        Failed to load analytics.
      </div>
    );
  }

  const axisStyle = { fill: '#bbbbbb', fontSize: 11 };

  const ageColors = ['#2a4a38', '#3d5a6b', '#6b4e2a', '#7b2d3b', '#5c3d6b'];

  return (
    <div style={{ padding: '28px 32px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px', paddingBottom: '16px', borderBottom: '1px solid #e8e8e8' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#111111', margin: '0 0 4px 0', letterSpacing: '-0.01em' }}>
          Analytics
        </h1>
        {data.weekCount < 8 && (
          <p style={{ fontSize: '12px', color: '#aaaaaa', margin: 0 }}>
            Showing {data.weekCount} week{data.weekCount !== 1 ? 's' : ''} of available data
          </p>
        )}
      </div>

      {/* Charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Cards completed per week — full width */}
        <ChartCard title="Cards Completed per Week" fullWidth>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.cardsCompletedPerWeek} barSize={28}>
              <CartesianGrid vertical={false} stroke="#f4f4f4" />
              <XAxis dataKey="week" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8f8f8' }} />
              <Bar dataKey="count" name="Cards" fill="#1d3557" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Active cards by assignee */}
        <ChartCard title="Active Cards by Assignee">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data.activeCardsByAssignee}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
              >
                {data.activeCardsByAssignee.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#888888' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Card age distribution */}
        <ChartCard title="Card Age Distribution">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.cardAgeDistribution} barSize={32}>
              <CartesianGrid vertical={false} stroke="#f4f4f4" />
              <XAxis dataKey="bucket" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8f8f8' }} />
              <Bar dataKey="count" name="Cards" radius={[3, 3, 0, 0]}>
                {data.cardAgeDistribution.map((entry, index) => (
                  <Cell key={entry.bucket} fill={ageColors[index % ageColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Completions per person per week — full width */}
        <ChartCard title="Completions per Person per Week" fullWidth>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.cardsPerPersonPerWeek} barSize={22}>
              <CartesianGrid vertical={false} stroke="#f4f4f4" />
              <XAxis dataKey="week" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8f8f8' }} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#888888' }} />
              {data.members.map((member) => (
                <Bar
                  key={member}
                  dataKey={member}
                  stackId="a"
                  fill={getMemberColor(member)}
                  radius={[0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Average days per column — full width */}
        <ChartCard title="Average Days per Column" fullWidth>
          <ResponsiveContainer width="100%" height={Math.max(180, data.avgTimePerColumn.length * 38)}>
            <BarChart data={data.avgTimePerColumn} layout="vertical" barSize={18}>
              <CartesianGrid horizontal={false} stroke="#f4f4f4" />
              <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="list"
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
                width={130}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8f8f8' }} />
              <Bar dataKey="avgDays" name="Avg Days" fill="#1d3557" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>
    </div>
  );
}
