const TRELLO_BASE = 'https://api.trello.com/1';

function credentials() {
  const key = process.env.TRELLO_API_KEY;
  const token = process.env.TRELLO_TOKEN;
  const boardId = process.env.TRELLO_BOARD_ID;
  if (!key || !token || !boardId) {
    throw new Error('Missing Trello env vars: TRELLO_API_KEY, TRELLO_TOKEN, TRELLO_BOARD_ID');
  }
  return { key, token, boardId };
}

function qs(params: Record<string, string>) {
  return new URLSearchParams(params).toString();
}

async function trelloFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const { key, token } = credentials();
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${TRELLO_BASE}${path}${sep}key=${key}&token=${token}`, options);
  if (!res.ok) {
    throw new Error(`Trello API error ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface TrelloMember {
  id: string;
  fullName: string;
  username: string;
  avatarUrl: string | null;
}

export interface TrelloLabel {
  id: string;
  name: string;
  color: string;
}

export interface TrelloChecklistItem {
  id: string;
  name: string;
  state: 'incomplete' | 'complete';
}

export interface TrelloChecklist {
  id: string;
  name: string;
  checkItems: TrelloChecklistItem[];
}

export interface TrelloCard {
  id: string;
  name: string;
  idList: string;
  idMembers: string[];
  due: string | null;
  dueComplete: boolean;
  labels: TrelloLabel[];
  checklists: TrelloChecklist[];
  dateLastActivity: string;
  desc: string;
  shortUrl: string;
  pos: number;
}

export interface TrelloList {
  id: string;
  name: string;
  pos: number;
  closed: boolean;
}

export interface BoardData {
  lists: TrelloList[];
  cards: TrelloCard[];
  members: TrelloMember[];
}

export interface CardAction {
  id: string;
  type: string;
  date: string;
  data: {
    listBefore?: { id: string; name: string };
    listAfter?: { id: string; name: string };
    text?: string;
    card?: { id: string; name: string };
  };
  memberCreator: { id: string; fullName: string };
}

// ── In-memory stale cache ─────────────────────────────────────────────────────

let cache: { data: BoardData; timestamp: number } | null = null;

// ── Public API ────────────────────────────────────────────────────────────────

export async function getBoardData(): Promise<BoardData> {
  const { boardId } = credentials();

  try {
    const [lists, cards, members] = await Promise.all([
      trelloFetch<TrelloList[]>(`/boards/${boardId}/lists`),
      trelloFetch<TrelloCard[]>(
        `/boards/${boardId}/cards?${qs({ members: 'true', checklists: 'all', fields: 'all' })}`
      ),
      trelloFetch<TrelloMember[]>(`/boards/${boardId}/members`),
    ]);

    const data: BoardData = {
      lists: lists.filter((l) => !l.closed),
      cards,
      members,
    };

    cache = { data, timestamp: Date.now() };
    return data;
  } catch (err) {
    if (cache) {
      const staleError = new Error('STALE_CACHE');
      (staleError as Error & { stale: boolean }).stale = true;
      throw staleError;
    }
    throw err;
  }
}

export function getCachedBoardData(): { data: BoardData; stale: boolean } | null {
  if (!cache) return null;
  return { data: cache.data, stale: true };
}

function daysAgoISO(days: number): string {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

export async function getCardHistory(cardId: string): Promise<CardAction[]> {
  return trelloFetch<CardAction[]>(
    `/cards/${cardId}/actions?${qs({ filter: 'updateCard,commentCard', since: daysAgoISO(90) })}`
  );
}

export async function getBoardHistory(): Promise<Record<string, CardAction[]>> {
  const { boardId } = credentials();
  const actions = await trelloFetch<CardAction[]>(
    `/boards/${boardId}/actions?${qs({
      filter: 'updateCard,commentCard',
      since: daysAgoISO(90),
      limit: '1000',
    })}`
  );

  const grouped: Record<string, CardAction[]> = {};
  for (const action of actions) {
    const cardId = action.data.card?.id;
    if (!cardId) continue;
    if (!grouped[cardId]) grouped[cardId] = [];
    grouped[cardId].push(action);
  }
  return grouped;
}

export async function updateCard(
  cardId: string,
  changes: Partial<{ idList: string; idMembers: string[] }>
): Promise<void> {
  const { key, token } = credentials();
  const body: Record<string, string> = { key, token };
  if (changes.idList) body.idList = changes.idList;
  if (changes.idMembers) body.idMembers = changes.idMembers.join(',');

  const res = await fetch(`${TRELLO_BASE}/cards/${cardId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  });
  if (!res.ok) throw new Error(`Trello updateCard failed: ${res.status}`);
}

export async function addComment(cardId: string, text: string): Promise<void> {
  const { key, token } = credentials();
  const res = await fetch(`${TRELLO_BASE}/cards/${cardId}/actions/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ key, token, text }).toString(),
  });
  if (!res.ok) throw new Error(`Trello addComment failed: ${res.status}`);
}

export async function createCard(
  listId: string,
  params: { name: string; idMembers?: string[]; due?: string }
): Promise<TrelloCard> {
  const { key, token } = credentials();
  const body: Record<string, string> = { key, token, idList: listId, name: params.name };
  if (params.idMembers?.length) body.idMembers = params.idMembers.join(',');
  if (params.due) body.due = params.due;

  const res = await fetch(`${TRELLO_BASE}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  });
  if (!res.ok) throw new Error(`Trello createCard failed: ${res.status}`);
  return res.json() as Promise<TrelloCard>;
}

// ── Helper ────────────────────────────────────────────────────────────────────

export function computeDaysInColumn(card: TrelloCard, actions: CardAction[]): number {
  const moves = actions
    .filter((a) => a.type === 'updateCard' && a.data.listAfter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const lastMove = moves[0];
  const since = lastMove ? new Date(lastMove.date) : new Date(card.dateLastActivity);
  return Math.floor((Date.now() - since.getTime()) / (1000 * 60 * 60 * 24));
}
