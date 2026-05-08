import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  getBoardData,
  getBoardHistory,
  computeDaysInColumn,
  type CardAction,
} from '@/lib/trello';

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

function withinLast7Days(dateStr: string): boolean {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return new Date(dateStr) >= cutoff;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { question: string; history?: HistoryMessage[] };
    const { question, history = [] } = body;

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'question is required' }, { status: 400 });
    }

    const [boardData, boardHistory] = await Promise.all([getBoardData(), getBoardHistory()]);

    const teamSchedulesIds = new Set(
      boardData.lists
        .filter((l) => /team\s*schedules/i.test(l.name))
        .map((l) => l.id)
    );

    const listMap = new Map(boardData.lists.map((l) => [l.id, l.name]));
    const memberMap = new Map(boardData.members.map((m) => [m.id, m.fullName]));

    const cards = boardData.cards.filter((c) => !teamSchedulesIds.has(c.idList));

    const cardSnapshots = cards.map((card) => {
      const cardActions: CardAction[] = boardHistory[card.id] ?? [];

      const recentComments = cardActions
        .filter((a) => a.type === 'commentCard' && withinLast7Days(a.date))
        .map((a) => ({ author: a.memberCreator.fullName, text: a.data.text ?? '' }));

      return {
        title: card.name,
        column: listMap.get(card.idList) ?? card.idList,
        assignees: card.idMembers.map((id) => memberMap.get(id) ?? id),
        daysInColumn: computeDaysInColumn(card, cardActions),
        due: card.due ?? null,
        overdue: card.due ? new Date(card.due) < new Date() && !card.dueComplete : false,
        recentComments,
      };
    });

    const boardText = JSON.stringify(cardSnapshots, null, 2);

    const systemPrompt = `You are an assistant for a project management team. Answer questions about their Trello board using only the data below. Be concise. If a card name is ambiguous, make your best guess and clarify. If the question is unrelated to the board, respond: "I can only answer questions about your Trello board."

Board data:
${boardText}`;

    const prior = history.slice(-5);

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        ...prior.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: question },
      ],
    });

    const reply = message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
