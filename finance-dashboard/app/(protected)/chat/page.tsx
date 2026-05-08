'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "What's the status of the ESSBASE upgrade?",
  "What does Yagnesh have on his plate right now?",
  "What's been sitting in Pending the longest?",
  "What's at risk of missing its due date this week?",
  "What did we complete last week?",
];

function ChatEmptyState({ onSelect }: { onSelect: (q: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '24px', padding: '40px 24px' }}>
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: '#f0f4ff',
          border: '1px solid #dbeafe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path
            d="M3 5C3 3.9 3.9 3 5 3H17C18.1 3 19 3.9 19 5V13C19 14.1 18.1 15 17 15H12.5L9 19V15H5C3.9 15 3 14.1 3 13V5Z"
            stroke="#2563eb"
            strokeWidth="1.5"
            strokeLinejoin="round"
            fill="#dbeafe"
          />
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111111', margin: '0 0 6px 0', fontFamily: 'var(--font-space-grotesk)', letterSpacing: '-0.02em' }}>
          Ask about your board
        </h2>
        <p style={{ fontSize: '13px', color: '#888888', margin: 0, lineHeight: '1.6' }}>
          Natural language Q&amp;A about your Trello data
        </p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '480px' }}>
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            style={{
              padding: '7px 13px',
              fontSize: '12.5px',
              border: '1px solid #e5e5e5',
              borderRadius: '20px',
              color: '#555555',
              background: '#ffffff',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.1s ease',
              lineHeight: '1.4',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f5f5f5'
              e.currentTarget.style.borderColor = '#d0d0d0'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff'
              e.currentTarget.style.borderColor = '#e5e5e5'
            }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  async function submit(question: string) {
    if (!question.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: question.trim() };
    const loadingMessage: Message = { role: 'assistant', content: '...' };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setInput('');
    setLoading(true);

    const history = [...messages, userMessage].slice(-5);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), history }),
      });

      const data = (await res.json()) as { reply?: string; error?: string };

      if (!res.ok || !data.reply) {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: 'Something went wrong — please try again' },
        ]);
      } else {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: data.reply! },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Something went wrong — please try again' },
      ]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 'calc(100vh - 0px)' }}>
      {/* Page header */}
      <div
        style={{
          padding: '28px 32px 0',
          flexShrink: 0,
          borderBottom: messages.length > 0 ? '2px solid #111111' : 'none',
          paddingBottom: messages.length > 0 ? '16px' : '0',
          marginBottom: messages.length > 0 ? '0' : '0',
        }}
      >
        {messages.length > 0 && (
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111111', margin: 0, fontFamily: 'var(--font-space-grotesk)', letterSpacing: '-0.02em' }}>
            Chat
          </h1>
        )}
      </div>

      {/* Message list */}
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: messages.length === 0 ? '0' : '24px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {messages.length === 0 ? (
          <ChatEmptyState onSelect={(q) => submit(q)} />
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '68%',
                  padding: '10px 14px',
                  fontSize: '13.5px',
                  borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  background: msg.role === 'user' ? '#111111' : '#ffffff',
                  color: msg.role === 'user' ? '#ffffff' : '#111111',
                  border: msg.role === 'user' ? 'none' : '1px solid #ebebeb',
                  boxShadow: msg.role === 'assistant' ? '0 1px 4px rgba(0,0,0,0.04)' : 'none',
                  opacity: msg.content === '...' ? 0.5 : 1,
                }}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input bar */}
      <div
        style={{
          borderTop: '1px solid #ebebeb',
          background: '#fafafa',
          padding: '14px 32px 18px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={1}
            placeholder="Ask a question…"
            style={{
              flex: 1,
              resize: 'none',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '9px 13px',
              fontSize: '13.5px',
              color: '#111111',
              background: '#ffffff',
              fontFamily: 'inherit',
              outline: 'none',
              maxHeight: '120px',
              overflowY: 'auto',
              lineHeight: '1.5',
              transition: 'border-color 0.1s ease',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
          />
          <button
            onClick={() => submit(input)}
            disabled={loading || !input.trim()}
            style={{
              padding: '9px 18px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: 500,
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !input.trim() ? 0.45 : 1,
              fontFamily: 'inherit',
              transition: 'background 0.1s ease, opacity 0.1s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (!loading && input.trim()) e.currentTarget.style.background = '#1d4ed8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#2563eb'
            }}
          >
            Send
          </button>
        </div>
        <p style={{ marginTop: '6px', fontSize: '11px', color: '#cccccc', margin: '6px 0 0 0' }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
