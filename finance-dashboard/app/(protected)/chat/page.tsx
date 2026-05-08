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
    <div className="flex flex-col h-full" style={{ minHeight: 'calc(100vh - 0px)' }}>
      {/* Message list */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 pt-16">
            <p className="text-sm text-[#666666]">Ask a question about your Trello board</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-xl">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => submit(q)}
                  className="px-3 py-2 text-xs border border-[#e5e5e5] rounded-lg text-[#111111] bg-white hover:bg-[#f5f5f5] transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] px-4 py-3 text-sm rounded-lg whitespace-pre-wrap leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#111111] text-white'
                    : 'bg-white border border-[#e5e5e5] text-[#111111]'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input bar */}
      <div className="border-t border-[#e5e5e5] bg-[#fafafa] px-6 py-4">
        <div className="flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={1}
            placeholder="Ask a question..."
            className="flex-1 resize-none border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm text-[#111111] bg-white placeholder-[#999999] focus:outline-none focus:border-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />
          <button
            onClick={() => submit(input)}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-[#2563eb] text-white text-sm font-medium rounded-lg hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
        <p className="mt-1 text-xs text-[#999999]">Press Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  );
}
