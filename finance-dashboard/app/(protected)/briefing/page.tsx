'use client';

import { useState } from 'react';

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; briefing: string; generatedAt: string; truncated: boolean }
  | { status: 'error' };

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const day = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  return `Generated at ${time} on ${day}`;
}

export default function BriefingPage() {
  const [state, setState] = useState<State>({ status: 'idle' });
  const [copied, setCopied] = useState(false);

  async function generate() {
    setState({ status: 'loading' });
    try {
      const res = await fetch('/api/briefing', { method: 'POST' });
      if (!res.ok) throw new Error('failed');
      const data = (await res.json()) as { briefing: string; generatedAt: string; truncated: boolean };
      setState({ status: 'success', ...data });
    } catch {
      setState({ status: 'error' });
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (state.status === 'idle') {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <button
          onClick={generate}
          className="px-6 py-3 bg-[#2563eb] text-white text-sm font-medium rounded-lg hover:bg-[#1d4ed8] transition-colors"
        >
          Generate Briefing
        </button>
      </div>
    );
  }

  if (state.status === 'loading') {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <p className="text-[#666666] text-sm">Generating briefing...</p>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-3">
        <p className="text-[#111111] text-sm">Failed to generate briefing.</p>
        <button
          onClick={generate}
          className="px-5 py-2 bg-[#2563eb] text-white text-sm font-medium rounded-lg hover:bg-[#1d4ed8] transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-[#999999]">{formatTimestamp(state.generatedAt)}</p>
        <div className="flex gap-2">
          <button
            onClick={() => copy(state.briefing)}
            className="px-4 py-2 text-xs font-medium border border-[#e5e5e5] rounded-lg text-[#111111] hover:bg-[#f0f0f0] transition-colors"
          >
            {copied ? 'Copied' : 'Copy to Clipboard'}
          </button>
          <button
            onClick={generate}
            className="px-4 py-2 text-xs font-medium bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors"
          >
            Regenerate
          </button>
        </div>
      </div>

      {state.truncated && (
        <div className="mb-4 px-3 py-2 bg-[#fefce8] border border-[#e5e5e5] rounded-lg text-xs text-[#666666]">
          Note: Board has &gt;50 cards — briefing based on the 50 most recently active.
        </div>
      )}

      <div className="bg-white border border-[#e5e5e5] rounded-lg p-6">
        <pre className="whitespace-pre-wrap text-sm text-[#111111] font-sans leading-relaxed">
          {state.briefing}
        </pre>
      </div>
    </div>
  );
}
