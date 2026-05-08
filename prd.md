# PRD: Finance & Control Team Deployment Dashboard
**For Claude Code — Next.js App deployed on Vercel**

---

## Overview

Build an internal web dashboard for a small PepsiCo finance/IT operations team (~5 people) that surfaces their Trello board data in a more useful way than Trello's default UI. The core value is: replace the manual Monday morning status meeting prep with an AI-generated briefing, add analytics over time, and allow basic card management from the dashboard itself.

The app pulls from and writes back to an existing Trello board (Finance Control Team board) via the Trello REST API.

---

## Credentials Required

You will need the following environment variables. Store them in `.env.local` and in Vercel's environment variable settings:

```
TRELLO_API_KEY=        # From https://trello.com/app-key
TRELLO_TOKEN=          # OAuth token generated from your API key
TRELLO_BOARD_ID=       # The board ID (visible in the Trello URL: trello.com/b/{BOARD_ID}/...)
ANTHROPIC_API_KEY=     # For the AI briefing and chat features
DASHBOARD_PASSWORD=    # Shared password for accessing the dashboard
```

To get your Trello token: visit `https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&key={YOUR_API_KEY}`

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **AI:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Deployment:** Vercel
- **Data:** Trello REST API (no database needed — Trello is the source of truth)

---

## Access Model

- Single shared URL protected by a simple password
- On first visit, users see a minimal password entry screen — correct password sets a cookie and grants access for 30 days
- Password is stored as an environment variable (`DASHBOARD_PASSWORD`) — never hardcoded
- All users share the same password — no individual accounts
- All Trello API credentials are server-side only, never exposed to the client
- All Trello writes (moving cards, adding comments, creating cards) are made as the token owner (Daniel)

**Implementation:** Use Next.js middleware to check for a valid session cookie on every request. If missing or invalid, redirect to `/login`. The login page is a single centered password input — clean, minimal, matching the app's aesthetic. No username field, just password + submit button.

---

## Pages & Features

### 1. Board View (`/`)

A kanban-style view mirroring the Trello board with enhanced visibility.

**Display:**
- All columns rendered left to right matching Trello column order
- Each card shows: title, assignee avatar + name, due date (if set), label color, checklist progress (e.g. 2/5), days in current column
- Cards color-coded by staleness:
  - Green: moved in last 3 days
  - Yellow: 4–7 days in same column
  - Red: 8+ days in same column
- Columns show card count

**Interactions (writes back to Trello):**
- Drag and drop cards between columns → updates Trello via API
- Click a card → opens a side panel showing full card details, comments, checklist, activity log
- Add a comment to a card from the side panel → posts to Trello
- Change assignee from the side panel → updates Trello
- **Add Card:** each column has a subtle "+ Add Card" button at the bottom. Clicking it opens a small inline form with: title (required), assignee (dropdown of board members), due date (optional). On submit, creates the card in Trello via API and refreshes the column. No description field — keep it simple, full editing can be done in Trello.

**Edge cases (card creation):**
- If title is empty, show inline validation — do not submit
- If Trello card creation fails, show an inline error and keep the form open so the user doesn't lose their input
- After successful creation, clear the form and show the new card at the bottom of the column immediately (optimistic UI)

**Edge cases:**
- If Trello API is down or returns an error, show a banner: "Unable to reach Trello — showing last cached data" and serve a stale in-memory cache from the last successful fetch
- If a card has no assignee, show "Unassigned" with a neutral gray avatar
- Team Schedules column (used for notices/tips, not tasks) — render it visually distinct (lighter background) so it's clearly not a work column. Do not include it in analytics or the Monday briefing.

---

### 2. Analytics (`/analytics`)

Charts showing team output and card health over time. Data is derived from Trello's card action/activity log (Trello stores full movement history per card).

**Charts to build:**

**A. Cards Completed Per Week (bar chart)**
- X axis: week (last 8 weeks)
- Y axis: number of cards moved to the Done/Completed column
- Shows team throughput trend over time

**B. Average Time Per Column (horizontal bar chart)**
- One bar per column (excluding Team Schedules)
- Shows average days cards spend in each column across all cards
- Identifies bottlenecks — e.g. if cards sit in "Pending" for 12 days on average, that's a problem

**C. Cards Per Person (stacked bar chart, weekly)**
- X axis: week
- Y axis: cards completed
- Stacked by team member
- Shows individual contribution over time and identifies workload imbalance

**D. Active Cards by Assignee (donut chart)**
- Current snapshot of how many open cards each person owns
- Useful for spotting who's overloaded right now

**E. Card Age Distribution (histogram)**
- X axis: days since card was created
- Y axis: number of cards
- Shows how many cards are aging out vs. moving quickly

**Edge cases:**
- Trello action history only goes back so far for free boards — if historical data is limited, show whatever range is available and note "Showing X weeks of available data"
- Cards with no movement history (never moved columns) should be counted as having been in their current column since creation date
- Deleted cards won't appear in history — that's fine, don't try to recover them

---

### 3. Monday Briefing (`/briefing`)

A page with a single "Generate Briefing" button. On click, reads the full current board state and uses the Claude API to generate a structured Monday meeting summary.

**What gets fed to the AI:**
- All cards across all columns (excluding Team Schedules column)
- For each card: title, assignee, current column, days in current column, due date, any comments from the last 7 days, checklist completion status

**Briefing output format (instruct Claude to return this structure):**

```
✅ COMPLETED LAST WEEK
- [Card title] — [Assignee]
...

🔄 IN PROGRESS
- [Card title] — [Assignee] — X days in [column]
...

🚨 BLOCKED / AT RISK
- [Card title] — [Assignee] — [reason: overdue / stale / no movement in X days]
...

📅 DUE THIS WEEK
- [Card title] — [Assignee] — Due [date]
...

📝 NOTES
[Any other observations — workload imbalance, cards with no owner, etc.]
```

**Display:**
- Render the briefing in a clean readable format on the page
- "Copy to Clipboard" button — copies plain text version
- "Regenerate" button to re-run if needed
- Show timestamp of when it was generated

**Edge cases:**
- If no cards were completed last week, say "Nothing moved to Done last week" rather than leaving the section empty
- If the AI call fails, show an error with a retry button — do not show a partial response
- Briefing is not cached — each button press makes a fresh API call with fresh Trello data
- Cap the prompt to avoid token limits: if the board has an unusually large number of cards (>50), truncate older/less active cards and note this in the UI

---

### 4. Natural Language Chat (`/chat`)

A chat interface where anyone on the team can ask questions about the board in plain English and get an instant AI-generated answer grounded in live Trello data.

**UI:**
- Simple chat window with a text input at the bottom
- Message history displayed in the session (not persisted — refreshing clears it)
- User messages on the right, AI responses on the left
- Loading indicator while the AI is responding
- Suggested starter questions displayed when the chat is empty:
  - "What's the status of the ESSBASE upgrade?"
  - "What does Yagnesh have on his plate right now?"
  - "What's been sitting in Pending the longest?"
  - "What's at risk of missing its due date this week?"
  - "What did we complete last week?"

**How it works:**
- On each message, fetch fresh board data from Trello server-side
- Feed the full board state + conversation history + user question to Claude
- Return the plain English response to the UI
- Conversation history is maintained client-side for the session so follow-up questions work (e.g. "what about Bill specifically?" after asking about workload)

**What Claude is given per request:**
- Full board state: all cards, their columns, assignees, due dates, days in current column, checklist status, recent comments
- Last 5 messages of conversation history for context
- The user's new question
- System prompt instructing it to answer only based on the board data provided, be concise, and flag if it doesn't have enough information to answer

**Example interactions it should handle:**
- Status of a specific card: "What's the status of the Exadata migration?"
- Person-specific queries: "What is Dany working on?" / "Who has the most cards right now?"
- Risk queries: "What's overdue?" / "What hasn't moved in over a week?"
- Historical: "What did we ship last week?"
- Comparative: "Who completed the most cards this month?"

**Edge cases:**
- If the question is unrelated to the board (e.g. "what's the weather?"), Claude should respond: "I can only answer questions about your Trello board. Try asking about card status, team workload, or upcoming deadlines."
- If a card name is misspelled or ambiguous, Claude should make a best guess and clarify: "I think you're asking about the ESSBASE Production Upgrade — here's the status..."
- If the AI call fails, show an inline error in the chat: "Something went wrong — please try again"
- Do not stream the response — wait for the full answer before displaying it

---

## Data Fetching Strategy

**IMPORTANT ARCHITECTURAL NOTE FOR CLAUDE CODE:**
The Trello data fetching logic must be implemented as a single shared server-side utility (`lib/trello.ts`) that any page or API route can import and call. This is critical — the Board view, Analytics, Monday Briefing, and Chat all need the same board data. Do not inline Trello fetching logic into individual page components. The shared utility should export:
- `getBoardData()` — returns lists, cards, members in one call
- `getCardHistory(cardId)` — returns movement history for a card
- `updateCard(cardId, changes)` — writes changes back to Trello
- `addComment(cardId, text)` — posts a comment to a card

This abstraction makes adding new features trivially without refactoring existing pages.

---

- All Trello API calls are made server-side via Next.js API routes — API keys never reach the client
- On initial page load, fetch all board data: lists, cards, members, and card actions (movement history)
- Poll for updates every 60 seconds and update the UI without a full page reload
- For the analytics page, fetch card action history going back 90 days (Trello's `since` parameter)

**Key Trello API endpoints to use:**
```
GET /1/boards/{id}/lists          — get all columns
GET /1/boards/{id}/cards          — get all cards with members, labels, checklists
GET /1/boards/{id}/members        — get team member list
GET /1/cards/{id}/actions         — get movement history for a card
PUT /1/cards/{id}                 — update card (move column, reassign)
POST /1/cards/{id}/actions/comments — add a comment
```

---

## UI / Design Notes

**Aesthetic direction:** Clean, minimal, professional. Think Linear, Vercel, or Notion — not a colorful SaaS dashboard. This is an internal tool that should look like it was built by a good engineer at a serious startup, not generated by AI. No gradients, no drop shadows everywhere, no rounded-everything, no card carousels, no purple-on-white color schemes. No icons on every button. No decorative illustrations.

**Layout:**
- Fixed dark sidebar on the left (~220px wide) for navigation: Board, Analytics, Briefing, Chat
- Main content area takes the rest of the screen
- Sidebar background: near-black (`#0f0f0f` or `#111111`)
- Main content background: off-white or very light gray (`#f9f9f9` or `#fafafa`) — not pure white
- A thin 1px border (`#e5e5e5`) separates the sidebar from the content area
- No top navbar — the sidebar is the only navigation

**Typography:**
- Use Geist Sans (Vercel's font, available via `next/font/google`) — it's clean, modern, and reads well at small sizes
- Font sizes: page titles 18px, section labels 13px uppercase with letter-spacing, body 14px, metadata/timestamps 12px
- Font weights: use 400 for body, 500 for labels, 600 for titles — avoid 700+ bold except for key numbers/metrics
- All text in shades of gray — primary text `#111`, secondary `#666`, muted `#999`
- No colored text except for status indicators (green/yellow/red)

**Color palette — keep it tight:**
- Background: `#fafafa`
- Sidebar: `#111111`
- Sidebar text active: `#ffffff`
- Sidebar text inactive: `#888888`
- Borders: `#e5e5e5`
- Primary text: `#111111`
- Secondary text: `#666666`
- Accent (use sparingly, e.g. active states, buttons): `#2563eb` (clean blue)
- Status colors only where functionally necessary: green `#16a34a`, yellow `#ca8a04`, red `#dc2626`
- Chart colors: use a muted, desaturated palette — avoid neon or overly saturated colors

**Components:**
- Buttons: small, understated. Primary button is solid `#111` background with white text, no border radius above 6px. Secondary button is white with a 1px `#e5e5e5` border
- Cards on the kanban board: white background, 1px `#e5e5e5` border, 6px border radius, subtle left border in the staleness color (green/yellow/red) — not a full background color change
- Inputs: white background, 1px `#e5e5e5` border, no box shadow, focus state uses a thin `#2563eb` outline
- Avoid all box shadows except a very subtle `0 1px 3px rgba(0,0,0,0.06)` on cards if needed
- Table/list rows: use alternating `#fafafa` / `#ffffff` or simple hover states (`#f5f5f5`) — no zebra striping with strong colors

**Charts (Recharts):**
- No chart borders or background fills
- Grid lines should be `#f0f0f0` — barely visible
- Axis labels in `#999`, 12px
- Tooltips: white background, 1px `#e5e5e5` border, clean sans-serif text — not the default Recharts tooltip style
- Bar charts: use a single muted blue (`#3b82f6`) or gray (`#d1d5db`) — only use multiple colors when distinguishing between people

**What to actively avoid:**
- Gradient backgrounds or buttons
- Heavy drop shadows
- Rounded corners above 8px
- Emoji in UI elements (the briefing output can have them, the UI chrome cannot)
- Colored sidebar backgrounds or gradient sidebars
- Large hero sections or marketing-style layouts
- Animated loaders beyond a simple spinner
- Any font that isn't Geist Sans

**Each team member color:**
Assign each member a muted, desaturated color derived deterministically from their name (use a simple hash). Use these colors only for avatar initials backgrounds and chart series — never for large UI elements. Example palette: `#6366f1`, `#0891b2`, `#059669`, `#d97706`, `#dc2626` — one per person, consistent throughout the app.

- Mobile responsive is nice to have but not required — this will primarily be used on desktop during Monday calls
- Simple "Loading..." text state is fine — no skeleton loaders needed

---

## Out of Scope (do not build)

- Individual user accounts or role-based access
- Email or Slack notifications
- Any database or persistent storage — Trello is the only data store
- Support for multiple boards
- Card deletion from the dashboard (use Trello directly)

---

## Definition of Done

- Password login works — correct password sets a cookie, wrong password shows an error, all routes are protected
- Board view renders all cards correctly, drag-and-drop writes back to Trello, and new cards can be created from the dashboard
- Analytics page shows all 5 charts with real data from Trello action history
- Monday Briefing generates a coherent, accurate summary using the Claude API
- Chat answers natural language questions accurately based on live board data
- Trello data fetching is abstracted into a shared `lib/trello.ts` utility used by all pages
- App is deployed and accessible via a Vercel URL
- All environment variables are configured in Vercel (not hardcoded)
- Team Schedules column is excluded from briefing, analytics, and chat throughout