# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

Internal web dashboard for a PepsiCo finance/IT team (~5 people) that surfaces their Trello board data with AI-generated briefings, analytics, and natural language chat. No database — Trello is the only data store.

Full requirements are in `prd.md`.

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **AI:** Anthropic Claude API — model `claude-sonnet-4-20250514`
- **Deployment:** Vercel
- **Data source:** Trello REST API

---

## Commands

```bash
npm run dev       # Start dev server (localhost:3000)
npm run build     # Production build
npm run lint      # ESLint
npm run typecheck # tsc --noEmit
```

---

## Environment Variables

Required in `.env.local` and Vercel settings:

```
TRELLO_API_KEY=
TRELLO_TOKEN=
TRELLO_BOARD_ID=
ANTHROPIC_API_KEY=
DASHBOARD_PASSWORD=
```

All Trello/Anthropic credentials are server-side only — never expose to the client.

---

## Architecture

### Route structure
- `/` — Kanban board view
- `/analytics` — 5 charts derived from Trello action history
- `/briefing` — AI-generated Monday meeting summary
- `/chat` — Natural language Q&A about the board
- `/login` — Password entry page (no username field)

### Auth
Next.js middleware checks for a valid session cookie on every request. Missing/invalid → redirect to `/login`. Correct password sets a cookie valid for 30 days. Password comes from `DASHBOARD_PASSWORD` env var.

### Critical: shared Trello utility
All Trello data fetching **must** go through `lib/trello.ts`. Never inline Trello API calls in page components or route handlers. The utility must export:

```ts
getBoardData()          // lists, cards, members in one call
getCardHistory(cardId)  // movement history for a card
updateCard(cardId, changes)
addComment(cardId, text)
```

### Data fetching pattern
- All Trello API calls via Next.js API routes (server-side only)
- Poll every 60 seconds on the client for live updates
- On Trello API failure: show banner "Unable to reach Trello — showing last cached data" and serve in-memory stale cache

### Team Schedules column
This column is used for notices/tips, not tasks. **Exclude it from analytics, the Monday briefing, and chat throughout the app.** Render it visually distinct (lighter background) on the board view.

---

## UI / Design Rules

**Aesthetic:** Linear/Vercel/Notion — minimal, professional, no gradients, no heavy shadows.

**Layout:** Fixed dark sidebar (`#111111`, ~220px) + main content area (`#fafafa`). No top navbar. 1px `#e5e5e5` border separating sidebar from content.

**Font:** Geist Sans only (`next/font/google`). Sizes: 18px titles, 14px body, 13px section labels (uppercase + letter-spacing), 12px metadata. Weights: 400/500/600 — avoid 700+.

**Color palette (strict):**
- Background: `#fafafa`, Sidebar: `#111111`
- Primary text: `#111111`, Secondary: `#666666`, Muted: `#999999`
- Borders: `#e5e5e5`
- Accent (buttons, active states): `#2563eb`
- Status: green `#16a34a`, yellow `#ca8a04`, red `#dc2626`

**Per-person colors** (avatars + chart series): derive deterministically from member name hash. Use `#6366f1`, `#0891b2`, `#059669`, `#d97706`, `#dc2626` — one per person, consistent app-wide.

**Kanban card staleness:**
- Green left border: moved in last 3 days
- Yellow left border: 4–7 days in same column
- Red left border: 8+ days in same column

**What to avoid:** gradient backgrounds/buttons, box shadows (max `0 1px 3px rgba(0,0,0,0.06)` on cards), border radius above 8px, emoji in UI chrome, skeleton loaders, any font other than Geist Sans.

---

## Key Trello API Endpoints

```
GET  /1/boards/{id}/lists
GET  /1/boards/{id}/cards          # include members, labels, checklists
GET  /1/boards/{id}/members
GET  /1/cards/{id}/actions         # movement history; use since= for 90-day window
PUT  /1/cards/{id}                 # move column, reassign
POST /1/cards/{id}/actions/comments
```

---

## Out of Scope

Do not build: individual user accounts, email/Slack notifications, any persistent database, multi-board support, or card deletion from the dashboard.
