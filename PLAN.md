# Implementation Plan: Finance & Control Dashboard

Each phase is a self-contained unit designed to be handed off to a separate agent. Each phase builds on the previous one. Agents should read `CLAUDE.md` and `prd.md` before starting their phase.

---

## Phase 1 — Project Scaffolding ✅ COMPLETE

**Goal:** Create a working Next.js app with all dependencies installed and the correct folder structure in place. Nothing functional yet — just the skeleton.

**Tasks:**
1. Run `npx create-next-app@latest` with App Router, TypeScript (strict), Tailwind CSS, ESLint enabled. App name: `finance-dashboard`.
2. Install additional dependencies:
   - `recharts` — charts
   - `@hello-pangea/dnd` — drag-and-drop for kanban (lighter alternative to react-beautiful-dnd, maintained fork)
   - `@anthropic-ai/sdk` — Claude API
3. Configure `next/font/google` to load Geist Sans, apply globally in `app/layout.tsx`.
4. Set up the base Tailwind config — extend colors with the project palette (`#fafafa`, `#111111`, `#e5e5e5`, `#2563eb`, etc.).
5. Create the folder structure:
   ```
   app/
     (protected)/
       page.tsx          ← Board view (/)
       analytics/page.tsx
       briefing/page.tsx
       chat/page.tsx
       layout.tsx        ← Shared layout with sidebar
     login/page.tsx
     api/
       board/route.ts
       card/[id]/route.ts
       card/[id]/comment/route.ts
       briefing/route.ts
       chat/route.ts
   lib/
     trello.ts
     auth.ts
   middleware.ts
   ```
6. Create `.env.local.example` listing all five env vars (not values).
7. Verify `npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck` all pass (build will have placeholder pages).

**Output:** A running Next.js skeleton at localhost:3000 with no errors.

**Verified:** 2026-05-08. typecheck, lint pass. All deps installed. Folder structure matches spec. Auth routes (Phase 2) were also scaffolded.

---

## Phase 2 — Auth (Middleware + Login Page) ✅ COMPLETE

**Goal:** Protect all routes behind a shared password. Unauthenticated requests redirect to `/login`.

**Tasks:**
1. **`lib/auth.ts`** — export two helpers:
   - `validatePassword(input: string): boolean` — compares input to `process.env.DASHBOARD_PASSWORD`
   - `SESSION_COOKIE_NAME` — constant string `'dashboard_session'`
2. **`middleware.ts`** — intercept every request:
   - Skip `/login` and `/_next/*` paths
   - Check for `SESSION_COOKIE_NAME` cookie with value `'authenticated'`
   - If missing/invalid → `NextResponse.redirect('/login')`
   - If valid → `NextResponse.next()`
3. **`app/login/page.tsx`** — client component:
   - Centered card on a `#fafafa` background
   - App title "Finance Dashboard" at the top in 18px/600 weight
   - Single password `<input>` (type=password) + "Sign in" button
   - On submit: POST to `/api/auth/login`
   - Inline error message on wrong password ("Incorrect password")
   - No username field
4. **`app/api/auth/login/route.ts`** — POST handler:
   - Reads `password` from JSON body
   - If correct: set `SESSION_COOKIE_NAME=authenticated; HttpOnly; Path=/; Max-Age=2592000 (30 days)`, return 200
   - If wrong: return 401 `{ error: 'Incorrect password' }`
5. **`app/api/auth/logout/route.ts`** — clears cookie, redirects to `/login`.

**Verification:** Visiting `/` without a cookie redirects to `/login`. Correct password grants access for 30 days. Wrong password shows error.

**Verified:** 2026-05-08. typecheck and lint pass. Middleware redirects unauthenticated requests. Login page matches design spec. Cookie set HttpOnly for 30 days. Logout clears cookie and redirects.

---

## Phase 3 — Shared Trello Utility (`lib/trello.ts`) ✅ COMPLETE

**Goal:** Build the single server-side data layer that all pages will use. This is the most critical shared component.

**Important:** All functions must be server-side only (no `'use client'`). All API credentials come from `process.env`.

**Tasks:**

1. **Types** — define and export TypeScript interfaces:
   ```ts
   TrelloMember { id, fullName, username, avatarUrl }
   TrelloLabel  { id, name, color }
   TrelloChecklistItem { id, name, state }
   TrelloChecklist { id, name, checkItems: TrelloChecklistItem[] }
   TrelloCard {
     id, name, idList, idMembers, due, dueComplete,
     labels, checklists, dateLastActivity,
     desc, shortUrl, pos
   }
   TrelloList { id, name, pos, closed }
   BoardData {
     lists: TrelloList[]
     cards: TrelloCard[]
     members: TrelloMember[]
   }
   CardAction {
     id, type, date,
     data: { listBefore?: { id, name }, listAfter?: { id, name }, text?: string }
     memberCreator: { id, fullName }
   }
   ```

2. **`getBoardData(): Promise<BoardData>`**
   - Parallel fetch: `GET /1/boards/{id}/lists`, `GET /1/boards/{id}/cards?members=true&checklists=all&fields=all`, `GET /1/boards/{id}/members`
   - Filter out closed lists from results
   - Return typed `BoardData`

3. **`getCardHistory(cardId: string): Promise<CardAction[]>`**
   - `GET /1/cards/{cardId}/actions?filter=updateCard,commentCard&since=90days`
   - Return typed array

4. **`getBoardHistory(): Promise<Record<string, CardAction[]>>`**
   - `GET /1/boards/{id}/actions?filter=updateCard,commentCard&since=90days&limit=1000`
   - Group by `data.card.id`
   - Used by analytics page to avoid N+1 requests

5. **`updateCard(cardId: string, changes: Partial<{ idList: string, idMembers: string[] }>): Promise<void>`**
   - `PUT /1/cards/{cardId}` with changes in body
   - Append `key` and `token` to request

6. **`addComment(cardId: string, text: string): Promise<void>`**
   - `POST /1/cards/{cardId}/actions/comments` with `{ text }`

7. **`createCard(listId: string, params: { name: string, idMembers?: string[], due?: string }): Promise<TrelloCard>`**
   - `POST /1/cards` with listId and params

8. **In-memory stale cache:**
   - Module-level `let cache: { data: BoardData; timestamp: number } | null = null`
   - `getBoardData()` updates cache on success, returns stale cache + throws a tagged error on failure so callers can display the banner

9. **Helper: `computeDaysInColumn(card: TrelloCard, actions: CardAction[]): number`**
   - Finds the most recent `updateCard` action where `listAfter` changed
   - Returns days since that move (or days since card creation if never moved)

**Verification:** Write a quick test script or verify via the API routes in later phases. Functions must throw typed errors, never crash silently.

**Verified:** 2026-05-08. typecheck and lint pass. All types, functions, in-memory cache, and `computeDaysInColumn` helper implemented. `getBoardData` returns stale cache on failure via tagged `STALE_CACHE` error. `getCachedBoardData()` added as a companion for callers that need the stale value without re-throwing.

---

## Phase 4 — Layout & Navigation Shell ✅ COMPLETE

**Goal:** Build the persistent sidebar layout that wraps all protected pages. No data yet — just structure and navigation.

**Tasks:**
1. **`app/(protected)/layout.tsx`** — server component wrapping all protected routes:
   - Flexbox row: fixed dark sidebar (220px) + scrollable main content area
   - Sidebar (`#111111` background, 1px `#e5e5e5` right border):
     - App name "Finance Dashboard" at top (white, 14px, 500 weight)
     - Nav links: Board, Analytics, Briefing, Chat — each as a Next.js `<Link>`
     - Active link: white text; inactive: `#888888`
     - No icons
     - "Sign out" link at the bottom
   - Main content area: `#fafafa` background, `flex-1`, `overflow-auto`, `p-8`
2. Navigation should highlight the active route using `usePathname()` (client component wrapper for just the nav items).
3. Placeholder `page.tsx` content for `/`, `/analytics`, `/briefing`, `/chat` so the layout is visible.

**Verification:** All four nav links work, active state updates correctly, sidebar stays fixed during scroll.

**Verified:** 2026-05-08. typecheck and lint pass. `SidebarNav` client component uses `usePathname` for active highlighting. Layout uses flexbox row with fixed 220px dark sidebar (`#111111`, `1px #e5e5e5` right border) and scrollable `#fafafa` main area. Sign out posts to `/api/auth/logout`. All four placeholder pages render correctly under the layout.

---

## Phase 5 — Board View (`/`) ✅ COMPLETE

**Goal:** The kanban board — the core page. Renders live Trello data, supports drag-and-drop, card side panel, comments, and card creation.

**Tasks:**

**API Routes:**
- `GET /api/board` → calls `getBoardData()`, returns JSON. If stale cache used, include `{ stale: true }` in response.
- `PATCH /api/card/[id]` → calls `updateCard(id, body)`
- `POST /api/card/[id]/comment` → calls `addComment(id, body.text)`
- `POST /api/card` → calls `createCard(body.listId, { name, idMembers, due })`
- `GET /api/card/[id]/history` → calls `getCardHistory(id)`, returns actions

**Board page (`app/(protected)/page.tsx`):**
1. On mount, fetch `GET /api/board`. Poll every 60s.
2. If `stale: true` in response, show top banner: "Unable to reach Trello — showing last cached data" (yellow, dismissible).
3. Render columns left-to-right. "Team Schedules" column gets `bg-[#f5f5f0]` (visually distinct, slightly warm off-white).
4. Each column header: list name + card count badge.
5. Each card displays:
   - Title (14px, `#111`)
   - Left border in staleness color (green/yellow/red based on `daysInColumn`)
   - Assignee avatar (initials circle, deterministic color from name hash) + name
   - Due date if set (red if overdue)
   - Label color dot if labels exist
   - Checklist progress `X/Y` if checklists exist
   - Days in column as muted metadata
6. **Drag and drop** using `@hello-pangea/dnd`:
   - `DragDropContext` wraps the board
   - Each column is a `Droppable`
   - Each card is a `Draggable`
   - On `onDragEnd`: optimistic UI update (move card in local state), then `PATCH /api/card/[id]` with new `idList`. On error, revert state.
7. **Card side panel:**
   - Clicking a card opens a right-side panel (fixed, ~380px wide, slides in)
   - Shows: title, assignee, due date, labels, checklist items (checkable — future scope, read-only for now), description, comments, activity log
   - Comments: load via `GET /api/card/[id]/history`, filter for `commentCard` actions
   - "Add comment" textarea + submit button → `POST /api/card/[id]/comment`
   - Assignee dropdown → `PATCH /api/card/[id]` with new `idMembers`
   - Close button (X) or click outside to dismiss
8. **Add Card form** (per column):
   - Subtle "+ Add card" text button at column bottom
   - Clicking reveals an inline form:
     - Title input (required)
     - Assignee dropdown (board members)
     - Due date input (optional, type=date)
     - "Add" and "Cancel" buttons
   - Validation: show inline error if title empty
   - On submit: `POST /api/card`, optimistic append to column
   - On API error: show inline error, keep form open

**Deterministic color hash helper** (put in `lib/utils.ts`):
```ts
const MEMBER_COLORS = ['#6366f1','#0891b2','#059669','#d97706','#dc2626']
function getMemberColor(name: string): string // hash name → index into MEMBER_COLORS
```

**Verification:** Board loads, cards render with correct staleness colors, drag-and-drop updates Trello, card creation works, side panel shows comments.

**Verified:** 2026-05-08. typecheck and lint pass. Production build clean. All API routes implemented (`GET /api/board`, `PATCH /api/card/[id]`, `POST /api/card/[id]/comment`, `GET /api/card/[id]/history`, `POST /api/card`). Board page (`app/(protected)/page.tsx`) is a full client component with `@hello-pangea/dnd` drag-and-drop, 60s polling, stale cache banner, card side panel (`CardSidePanel.tsx`), add card form (`AddCardForm.tsx`), and `KanbanCard.tsx` with staleness left border, assignee avatar, due date, label dots, and checklist progress. `lib/utils.ts` exports `getMemberColor`, `getInitials`, `stalenessColor`, `labelHexColor`. Board API route computes `daysInColumn` server-side via `getBoardHistory()`. Team Schedules column rendered with `#f5f5f0` background.

---

## Phase 6 — Analytics (`/analytics`) ✅ COMPLETE

**Goal:** Five charts derived from Trello action history.

**Tasks:**

**API Route:**
- `GET /api/analytics` → calls `getBoardData()` + `getBoardHistory()`, computes all chart datasets server-side, returns pre-shaped JSON. Do not compute chart data client-side.

**Computed datasets (server-side in the API route):**

1. **Cards completed per week (last 8 weeks)**
   - Filter actions for `updateCard` where `listAfter.name` contains "done" or "completed" (case-insensitive)
   - Group by ISO week, count per week
   - Return: `{ week: string, count: number }[]`

2. **Average time per column**
   - For each card, reconstruct column timeline from its actions
   - Compute days spent in each column (list name)
   - Average across all cards, exclude "Team Schedules"
   - Return: `{ list: string, avgDays: number }[]` sorted by avgDays desc

3. **Cards completed per person per week (last 8 weeks)**
   - Same as #1 but also capture `memberCreator.fullName` of the action
   - Return: `{ week: string, [memberName]: number }[]`

4. **Active cards by assignee (current snapshot)**
   - From current board data, count open cards per member (exclude done/completed columns)
   - Return: `{ name: string, count: number, color: string }[]`

5. **Card age distribution**
   - For each open card, compute `daysSinceCreated`
   - Bucket into: 0-7, 8-14, 15-30, 31-60, 60+ days
   - Return: `{ bucket: string, count: number }[]`

**Charts page (`app/(protected)/analytics/page.tsx`):**
- Fetch `GET /api/analytics` on mount
- Render each chart in a section with a label above it
- Chart style per CLAUDE.md: no borders, grid `#f0f0f0`, axis labels `#999` 12px, custom tooltip (white bg, `1px #e5e5e5` border)
- If data range is limited, show note "Showing X weeks of available data"
- Charts:
  - A: `BarChart` — cards completed per week
  - B: `BarChart` horizontal — avg time per column
  - C: `BarChart` stacked — per-person weekly completions (use member colors)
  - D: `PieChart` (donut) — active cards by assignee
  - E: `BarChart` — card age distribution (single muted blue)

**Verification:** All 5 charts render with real Trello data. Team Schedules excluded everywhere.

**Verified:** 2026-05-08. typecheck, lint, build all pass. `GET /api/analytics` computes all 5 datasets server-side. Analytics page renders BarChart (completions/week), horizontal BarChart (avg time/column), stacked BarChart (per-person weekly), donut PieChart (active cards by assignee), and BarChart (card age distribution). Custom tooltip and grid styling match spec. Card age uses `dateLastActivity` as proxy since Trello card object has no raw `dateCreated` field.

---

## Phase 7 — Monday Briefing (`/briefing`)

**Goal:** One-click AI briefing generated from live board data using Claude API.

**Tasks:**

**API Route (`POST /api/briefing`):**
1. Call `getBoardData()` and `getBoardHistory()`
2. Build board snapshot object (exclude Team Schedules):
   - For each card: title, assignee names, current column, daysInColumn, due date, recent comments (last 7 days), checklist summary `X/Y`
3. If >50 cards: truncate to most recently active 50, set `truncated = true`
4. Call Claude API (`claude-sonnet-4-20250514`):
   - System prompt: "You are a project status assistant. Analyze the board data and generate a structured Monday morning briefing. Output exactly the following sections in this format: [paste format from PRD]. Be concise. Base your output only on the data provided."
   - User message: JSON serialized board snapshot
5. Return `{ briefing: string, generatedAt: string, truncated: boolean }`
6. On Claude API error: return 500 with `{ error: 'AI generation failed' }`

**Briefing page (`app/(protected)/briefing/page.tsx`):**
- Initial state: "Generate Briefing" button centered on page
- On click: POST to `/api/briefing`, show loading state
- On success: render briefing in a clean `<pre>`-style block (preserve line breaks, monospace-adjacent styling)
- Show timestamp "Generated at HH:MM on Day, Month DD"
- "Copy to Clipboard" button — copies plain text
- "Regenerate" button to re-run
- If `truncated: true`, show note: "Note: Board has >50 cards — briefing based on the 50 most recently active."
- On error: show "Failed to generate briefing." + "Try again" button (no partial output)

**Verification:** Button generates a coherent briefing. Copy works. Error state handles Claude failures gracefully.

---

## Phase 8 — Chat (`/chat`)

**Goal:** Natural language Q&A about the live board, powered by Claude.

**Tasks:**

**API Route (`POST /api/chat`):**
1. Accept `{ question: string, history: { role: 'user'|'assistant', content: string }[] }`
2. Call `getBoardData()` + basic card metadata (daysInColumn, recent comments)
3. Build system prompt:
   ```
   You are an assistant for a project management team. Answer questions about their Trello board using only the data below. Be concise. If a card name is ambiguous, make your best guess and clarify. If the question is unrelated to the board, respond: "I can only answer questions about your Trello board."
   
   [Board data as structured text]
   ```
4. Include last 5 messages from `history` as prior turns
5. Call Claude, return `{ reply: string }`
6. On error: return 500 `{ error: 'Something went wrong' }`

**Chat page (`app/(protected)/chat/page.tsx`):**
- State: `messages: { role, content }[]` — session-only, not persisted
- Layout: message list (scrollable, flex-col) + fixed input bar at bottom
- User messages: right-aligned, dark background (`#111`), white text
- AI messages: left-aligned, white background, `1px #e5e5e5` border
- When `messages` is empty: show suggested questions as clickable chips:
  - "What's the status of the ESSBASE upgrade?"
  - "What does Yagnesh have on his plate right now?"
  - "What's been sitting in Pending the longest?"
  - "What's at risk of missing its due date this week?"
  - "What did we complete last week?"
- Clicking a chip populates the input and submits immediately
- On submit: append user message, POST to `/api/chat` with question + last 5 messages of history
- Show loading indicator (simple "..." in an AI message bubble) while waiting
- On success: append AI reply
- On error: append inline error message "Something went wrong — please try again" in the AI message position
- No streaming — wait for full response

**Verification:** Questions answered correctly. Follow-up questions work (history maintained). Suggested chips work. Error state shown inline.

---

## Phase 9 — Final Polish & Deploy

**Goal:** End-to-end QA, visual consistency pass, and Vercel deployment.

**Tasks:**

1. **Visual audit:**
   - Check every page against the color palette in CLAUDE.md
   - No gradients, no shadows above `0 1px 3px rgba(0,0,0,0.06)`, no border-radius above 8px
   - Typography consistent (Geist Sans, correct sizes/weights throughout)
   - Sidebar active states correct on all routes

2. **Functionality audit (Definition of Done checklist from PRD):**
   - [ ] Password login: correct password → cookie → access. Wrong password → error. Cookie lasts 30 days.
   - [ ] Board: all columns render, cards show correct data, drag-and-drop writes to Trello, new cards can be created
   - [ ] Analytics: all 5 charts render with real data, Team Schedules excluded
   - [ ] Briefing: generates accurate summary, copy works, error state works
   - [ ] Chat: answers questions, follow-ups work, suggested chips work, error state inline
   - [ ] Team Schedules column: visually distinct, excluded from analytics/briefing/chat
   - [ ] Stale cache banner appears when Trello is unreachable
   - [ ] All Trello credentials server-side only (verify nothing in client bundles)

3. **TypeScript / lint:**
   - `npm run typecheck` — zero errors
   - `npm run lint` — zero errors

4. **Vercel deploy:**
   - Push to a GitHub repo
   - Connect repo to Vercel
   - Add all 5 env vars in Vercel project settings
   - Deploy and verify the live URL works end-to-end

5. **Smoke test on live URL:**
   - Login flow
   - Board loads real Trello data
   - Briefing generates successfully
   - Chat answers a question

**Output:** Live Vercel URL, all features working.

---

## Dependency Order

```
Phase 1 (Scaffold)
  └─ Phase 2 (Auth)
       └─ Phase 3 (Trello Utility)
            ├─ Phase 4 (Layout Shell)  ←─ needed before any page
            │    ├─ Phase 5 (Board)
            │    ├─ Phase 6 (Analytics)
            │    ├─ Phase 7 (Briefing)
            │    └─ Phase 8 (Chat)
            └─ Phase 9 (Polish + Deploy)  ←─ after all pages done
```

Phases 5–8 can run in parallel once Phases 1–4 are complete.
