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
  boxShadow: 'none',
  fontSize: '12px',
  color: '#111111',
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
    <div style={tooltipStyle} className="px-3 py-2">
      {label && <p className="mb-1 font-medium text-xs text-gray-600">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.name} className="text-xs" style={{ color: entry.color ?? '#111111' }}>
          {entry.name}: <span className="font-medium">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-3 uppercase tracking-widest"
      style={{ fontSize: '11px', color: '#999999', fontWeight: 500 }}
    >
      {children}
    </p>
  );
}

function ChartSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <SectionLabel>{title}</SectionLabel>
      {children}
    </section>
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
      <div className="flex items-center justify-center h-64" style={{ color: '#999999', fontSize: '14px' }}>
        Loading analytics…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: '#dc2626', fontSize: '14px' }}>
        Failed to load analytics.
      </div>
    );
  }

  const axisStyle = { fill: '#999999', fontSize: 12 };

  return (
    <div style={{ maxWidth: '860px' }}>
      <h1 className="mb-8" style={{ fontSize: '18px', fontWeight: 600, color: '#111111' }}>
        Analytics
      </h1>

      {data.weekCount < 8 && (
        <p className="mb-6 text-xs" style={{ color: '#999999' }}>
          Showing {data.weekCount} weeks of available data
        </p>
      )}

      <ChartSection title="Cards Completed per Week">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.cardsCompletedPerWeek} barSize={28}>
            <CartesianGrid vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="week" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f5f5' }} />
            <Bar dataKey="count" name="Cards" fill="#2563eb" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      <ChartSection title="Average Days per Column">
        <ResponsiveContainer width="100%" height={Math.max(200, data.avgTimePerColumn.length * 36)}>
          <BarChart data={data.avgTimePerColumn} layout="vertical" barSize={18}>
            <CartesianGrid horizontal={false} stroke="#f0f0f0" />
            <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="list"
              tick={axisStyle}
              axisLine={false}
              tickLine={false}
              width={120}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f5f5' }} />
            <Bar dataKey="avgDays" name="Avg Days" fill="#2563eb" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      <ChartSection title="Completions per Person per Week">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.cardsPerPersonPerWeek} barSize={20}>
            <CartesianGrid vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="week" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f5f5' }} />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#666666' }} />
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
      </ChartSection>

      <ChartSection title="Active Cards by Assignee">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data.activeCardsByAssignee}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={2}
            >
              {data.activeCardsByAssignee.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#666666' }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartSection>

      <ChartSection title="Card Age Distribution">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.cardAgeDistribution} barSize={36}>
            <CartesianGrid vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="bucket" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f5f5' }} />
            <Bar dataKey="count" name="Cards" fill="#93c5fd" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>
    </div>
  );
}
