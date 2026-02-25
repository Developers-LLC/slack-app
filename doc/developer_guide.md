# Slack App — Developer Guide

**Version 1.0** | Last updated: February 2026

---

## 1. Overview

This document provides a comprehensive technical reference for the Slack team communication application. It covers the system architecture, technology stack, database schema, API surface, frontend component hierarchy, testing strategy, and deployment workflow. The intended audience is software engineers who will maintain, extend, or contribute to this codebase.

---

## 2. Technology Stack

The application is built on a modern, full-stack TypeScript architecture with end-to-end type safety.

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend Framework** | React | 19.x | Component-based UI rendering |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS framework |
| **Component Library** | shadcn/ui (Radix primitives) | Latest | Accessible, composable UI components |
| **Routing** | Wouter | 3.x | Lightweight client-side routing |
| **State & Data Fetching** | TanStack React Query + tRPC | 5.x / 11.x | Type-safe API calls with caching |
| **Backend Framework** | Express | 4.x | HTTP server and middleware |
| **API Layer** | tRPC | 11.x | End-to-end typesafe RPC procedures |
| **ORM** | Drizzle ORM | 0.44.x | Type-safe SQL query builder |
| **Database** | MySQL (TiDB) | — | Relational data persistence |
| **File Storage** | AWS S3 | — | Binary file storage for uploads |
| **Authentication** | Manus OAuth | — | Session-based OAuth 2.0 flow |
| **AI/LLM** | Built-in LLM service | — | Conversation summarization and smart replies |
| **Build Tool** | Vite | 7.x | Frontend bundling and HMR |
| **Testing** | Vitest | 2.x | Unit and integration testing |
| **Language** | TypeScript | 5.9.x | Static typing across the entire stack |

---

## 3. Project Structure

The project follows a monorepo-style layout with clear separation between client, server, and shared code.

```
slack-app/
├── client/                    # Frontend application
│   ├── public/                # Static assets (favicon, etc.)
│   ├── index.html             # HTML entry point with Google Fonts
│   └── src/
│       ├── _core/             # Framework internals (auth hooks, providers)
│       ├── components/        # Reusable UI components
│       │   ├── ui/            # shadcn/ui primitives (button, dialog, etc.)
│       │   ├── Sidebar.tsx    # Navigation sidebar with channels and DMs
│       │   ├── ChatArea.tsx   # Main messaging area
│       │   ├── MessageItem.tsx # Individual message renderer
│       │   ├── MessageInput.tsx # Rich text message composer
│       │   ├── ThreadPanel.tsx # Threaded reply side panel
│       │   ├── ChannelBrowser.tsx # Channel discovery view
│       │   └── CommandPalette.tsx # Search and navigation (Cmd+K)
│       ├── contexts/          # React context providers (Theme)
│       ├── hooks/             # Custom hooks (useNotifications, etc.)
│       ├── lib/               # Utility libraries (trpc client binding)
│       ├── pages/             # Route-level page components
│       │   ├── Home.tsx       # Landing page
│       │   ├── Workspace.tsx  # Main app workspace (3-column layout)
│       │   └── NotFound.tsx   # 404 page
│       ├── App.tsx            # Root component with routing
│       ├── main.tsx           # React entry point with providers
│       └── index.css          # Global styles, theme variables, glassmorphism
├── server/                    # Backend application
│   ├── _core/                 # Framework internals (auth, context, LLM, etc.)
│   │   ├── index.ts           # Express server entry point
│   │   ├── context.ts         # tRPC context builder
│   │   ├── trpc.ts            # tRPC router and procedure definitions
│   │   ├── llm.ts             # LLM invocation helper
│   │   ├── env.ts             # Environment variable access
│   │   └── oauth.ts           # OAuth callback handler
│   ├── db.ts                  # Database query helpers
│   ├── routers.ts             # tRPC router definitions (API surface)
│   ├── storage.ts             # S3 file storage helpers
│   ├── auth.logout.test.ts    # Auth logout test
│   └── features.test.ts       # Feature integration tests
├── drizzle/                   # Database schema and migrations
│   └── schema.ts              # Drizzle ORM table definitions
├── shared/                    # Shared constants and types
│   └── const.ts               # Cookie names, shared constants
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite build configuration
└── vitest.config.ts           # Test configuration
```

---

## 4. Database Schema

The application uses six core tables in a MySQL database. All timestamps are stored in UTC. The schema is defined in `drizzle/schema.ts` and managed through Drizzle Kit migrations.

### 4.1 Entity-Relationship Overview

```
users ──┬── channel_members ──── channels
        │
        ├── messages ──────────── reactions
        │
        ├── conversation_participants ──── conversations
        │
        └── (self-referential: messages.parentId → messages.id)
```

### 4.2 Table Definitions

**`users`** — Stores all authenticated user accounts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK, auto) | Surrogate primary key |
| `openId` | VARCHAR(64), unique | Manus OAuth identifier |
| `name` | TEXT | Display name |
| `email` | VARCHAR(320) | Email address |
| `role` | ENUM(`user`, `admin`) | Access level |
| `avatarUrl` | TEXT | Profile image URL |
| `status` | VARCHAR(255) | Custom status text |
| `statusEmoji` | VARCHAR(32) | Status emoji |
| `presence` | ENUM(`online`, `away`, `offline`) | Current presence state |
| `lastSeen` | TIMESTAMP | Last heartbeat timestamp |
| `createdAt` | TIMESTAMP | Account creation time |
| `updatedAt` | TIMESTAMP | Last profile update |
| `lastSignedIn` | TIMESTAMP | Most recent login |

**`channels`** — Represents public or private communication channels.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK, auto) | Channel identifier |
| `name` | VARCHAR(100) | Channel name |
| `description` | TEXT | Channel purpose/description |
| `type` | ENUM(`public`, `private`) | Visibility setting |
| `createdBy` | INT (FK → users.id) | Creator's user ID |
| `isArchived` | BOOLEAN | Whether the channel is archived |
| `createdAt` | TIMESTAMP | Creation time |
| `updatedAt` | TIMESTAMP | Last modification |

**`channel_members`** — Junction table for channel membership.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK, auto) | Membership record ID |
| `channelId` | INT (FK → channels.id) | Associated channel |
| `userId` | INT (FK → users.id) | Member user |
| `role` | ENUM(`owner`, `admin`, `member`) | Membership role |
| `lastReadAt` | TIMESTAMP | Last read watermark for unread tracking |
| `joinedAt` | TIMESTAMP | When the user joined |

**`messages`** — All messages sent in channels or DM conversations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK, auto) | Message identifier |
| `channelId` | INT (nullable, FK → channels.id) | Channel context (null for DMs) |
| `conversationId` | INT (nullable, FK → conversations.id) | DM context (null for channels) |
| `userId` | INT (FK → users.id) | Author |
| `parentId` | INT (nullable, self-FK) | Parent message for threads |
| `content` | TEXT | Message body (Markdown) |
| `type` | ENUM(`text`, `system`, `file`) | Message type |
| `isEdited` | BOOLEAN | Whether the message was edited |
| `replyCount` | INT | Cached count of thread replies |
| `fileUrl` | TEXT | S3 URL for file attachments |
| `fileName` | VARCHAR(255) | Original file name |
| `fileMimeType` | VARCHAR(128) | MIME type of attached file |
| `fileSize` | INT | File size in bytes |
| `createdAt` | TIMESTAMP | Send time |
| `updatedAt` | TIMESTAMP | Last edit time |

**`conversations`** — DM conversation containers.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK, auto) | Conversation identifier |
| `type` | ENUM(`dm`, `group`) | Conversation type |
| `name` | VARCHAR(100) | Optional group name |
| `createdAt` | TIMESTAMP | Creation time |
| `updatedAt` | TIMESTAMP | Last activity |

**`conversation_participants`** — Junction table for DM participants.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK, auto) | Participant record ID |
| `conversationId` | INT (FK → conversations.id) | Associated conversation |
| `userId` | INT (FK → users.id) | Participant user |
| `lastReadAt` | TIMESTAMP | Read watermark |
| `joinedAt` | TIMESTAMP | Join time |

**`reactions`** — Emoji reactions on messages.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK, auto) | Reaction record ID |
| `messageId` | INT (FK → messages.id) | Target message |
| `userId` | INT (FK → users.id) | Reacting user |
| `emoji` | VARCHAR(64) | Emoji character or shortcode |
| `createdAt` | TIMESTAMP | Reaction time |

### 4.3 Schema Migrations

Schema changes follow a generate-then-migrate workflow:

```bash
# Edit drizzle/schema.ts, then run:
pnpm db:push
# This executes: drizzle-kit generate && drizzle-kit migrate
```

---

## 5. API Reference

The backend exposes a tRPC router at `/api/trpc`. All procedures are type-safe and validated with Zod schemas. Procedures marked as **protected** require an authenticated session.

### 5.1 Authentication Router (`auth`)

| Procedure | Type | Auth | Input | Description |
|-----------|------|------|-------|-------------|
| `auth.me` | Query | Public | — | Returns the current user object or `null` |
| `auth.logout` | Mutation | Public | — | Clears the session cookie |

### 5.2 Users Router (`users`)

| Procedure | Type | Auth | Input | Description |
|-----------|------|------|-------|-------------|
| `users.list` | Query | Protected | — | Returns all users with profile and presence data |
| `users.updatePresence` | Mutation | Protected | `{ presence: "online" \| "away" \| "offline" }` | Updates the caller's presence status |
| `users.updateStatus` | Mutation | Protected | `{ status: string, statusEmoji: string }` | Sets a custom status message |
| `users.heartbeat` | Mutation | Protected | — | Pings the server to maintain "online" presence |

### 5.3 Channels Router (`channels`)

| Procedure | Type | Auth | Input | Description |
|-----------|------|------|-------|-------------|
| `channels.list` | Query | Protected | — | Lists all visible channels with membership status |
| `channels.get` | Query | Protected | `{ id: number }` | Returns a single channel by ID |
| `channels.create` | Mutation | Protected | `{ name, description?, type? }` | Creates a new channel; creator auto-joins as owner |
| `channels.join` | Mutation | Protected | `{ channelId: number }` | Joins a channel |
| `channels.leave` | Mutation | Protected | `{ channelId: number }` | Leaves a channel |
| `channels.members` | Query | Protected | `{ channelId: number }` | Lists members of a channel with user profiles |
| `channels.markRead` | Mutation | Protected | `{ channelId: number }` | Updates the read watermark for unread tracking |
| `channels.unreadCounts` | Query | Protected | — | Returns unread message counts per channel |

### 5.4 Messages Router (`messages`)

| Procedure | Type | Auth | Input | Description |
|-----------|------|------|-------|-------------|
| `messages.list` | Query | Protected | `{ channelId?, conversationId?, limit?, before? }` | Fetches paginated messages (top-level only) |
| `messages.send` | Mutation | Protected | `{ channelId?, conversationId?, content, parentId?, fileUrl?, fileName?, fileMimeType?, fileSize? }` | Sends a new message or thread reply |
| `messages.thread` | Query | Protected | `{ parentId: number }` | Fetches the parent message and all thread replies |
| `messages.poll` | Query | Protected | `{ channelId?, conversationId?, after: number }` | Returns messages newer than the given ID (for polling) |

### 5.5 Conversations Router (`conversations`)

| Procedure | Type | Auth | Input | Description |
|-----------|------|------|-------|-------------|
| `conversations.list` | Query | Protected | — | Lists the caller's DM conversations with participants and last message |
| `conversations.findOrCreate` | Mutation | Protected | `{ userId: number }` | Finds or creates a 1:1 DM with the specified user |

### 5.6 Reactions Router (`reactions`)

| Procedure | Type | Auth | Input | Description |
|-----------|------|------|-------|-------------|
| `reactions.toggle` | Mutation | Protected | `{ messageId: number, emoji: string }` | Adds or removes a reaction (toggle behavior) |

### 5.7 Files Router (`files`)

| Procedure | Type | Auth | Input | Description |
|-----------|------|------|-------|-------------|
| `files.getUploadUrl` | Mutation | Protected | `{ fileName: string, mimeType: string }` | Generates a unique S3 key for file upload |

The actual file upload is handled by a separate Express route (`POST /api/upload`) that accepts `multipart/form-data` and stores the file in S3 via the `storagePut` helper.

### 5.8 Search Router (`search`)

| Procedure | Type | Auth | Input | Description |
|-----------|------|------|-------|-------------|
| `search.global` | Query | Protected | `{ query: string, channelId?, fromUserId? }` | Searches messages, channels, and users simultaneously |

### 5.9 AI Router (`ai`)

| Procedure | Type | Auth | Input | Description |
|-----------|------|------|-------|-------------|
| `ai.summarize` | Mutation | Protected | `{ channelId?, conversationId?, messageCount? }` | Generates an AI summary of recent messages |
| `ai.smartReply` | Mutation | Protected | `{ channelId?, conversationId? }` | Suggests 3 contextual reply options |

---

## 6. Frontend Architecture

### 6.1 Component Hierarchy

The frontend follows a hierarchical component structure rooted in the `Workspace` page:

```
App.tsx
├── ThemeProvider (dark mode)
├── TooltipProvider
├── Toaster (sonner notifications)
└── Router
    ├── Home.tsx (landing page — unauthenticated)
    └── Workspace.tsx (main app — authenticated)
        ├── Sidebar.tsx
        │   ├── Channel list (with unread badges)
        │   ├── DM conversation list
        │   └── User profile footer
        ├── ChatArea.tsx
        │   ├── ChannelBrowser.tsx (when no channel selected)
        │   ├── MessageItem.tsx (repeated for each message)
        │   └── MessageInput.tsx (composer with file upload)
        ├── ThreadPanel.tsx (conditional, slides in from right)
        └── CommandPalette.tsx (modal overlay)
```

### 6.2 Routing

Client-side routing is handled by Wouter with the following route definitions:

| Route Pattern | Component | Description |
|---------------|-----------|-------------|
| `/` | `Home` | Landing page; redirects to `/app` if authenticated |
| `/app` | `Workspace` | Main workspace with channel browser |
| `/app/channel/:channelId` | `Workspace` | Workspace focused on a specific channel |
| `/app/dm/:conversationId` | `Workspace` | Workspace focused on a DM conversation |
| `/404` | `NotFound` | 404 error page |

### 6.3 State Management

The application uses **tRPC + React Query** for server state management. There is no separate client-side state store (e.g., Redux or Zustand). Local UI state (active channel, thread panel visibility, command palette) is managed with React `useState` hooks in the `Workspace` component and passed down as props.

### 6.4 Real-Time Updates

Real-time messaging is implemented via **polling**. The `ChatArea` component uses `trpc.messages.poll` with a `refetchInterval` of approximately 3 seconds. When new messages arrive, they are appended to the existing message list. The polling query passes the ID of the last known message as the `after` parameter to fetch only new messages.

### 6.5 Theming and Design System

The application uses a **dark theme** with macOS-inspired glassmorphism. All color tokens are defined as CSS custom properties in `client/src/index.css` using the OKLCH color space. Key design tokens include:

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `oklch(0.13 0.008 280)` | Page background |
| `--foreground` | `oklch(0.93 0.005 280)` | Primary text color |
| `--primary` | `oklch(0.55 0.2 260)` | Accent color (indigo-blue) |
| `--card` | `oklch(0.17 0.01 280)` | Card/panel backgrounds |
| `--border` | `oklch(1 0 0 / 8%)` | Subtle borders |
| `--sidebar` | `oklch(0.15 0.01 280)` | Sidebar background |

Custom CSS classes provide the glassmorphism effect:

- `.glass-sidebar` — Frosted glass sidebar with `backdrop-filter: blur(24px) saturate(180%)`.
- `.glass-panel` — Thread panel with `backdrop-filter: blur(20px) saturate(150%)`.
- `.message-hover` — Subtle highlight on message hover.
- `.presence-online/away/offline` — Colored presence indicator dots.

### 6.6 Custom Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useAuth` | `_core/hooks/useAuth.ts` | Provides `user`, `isAuthenticated`, `loading`, `logout` |
| `useNotifications` | `hooks/useNotifications.ts` | Manages browser Notification API permission and display |

---

## 7. Authentication Flow

Authentication uses Manus OAuth with session cookies:

1. The user clicks "Sign In" on the landing page, which redirects to the Manus OAuth portal via `getLoginUrl()`.
2. After successful authentication, the OAuth server redirects back to `/api/oauth/callback`.
3. The callback handler creates or updates the user record in the database via `upsertUser()`, signs a JWT session token, and sets it as an HTTP-only cookie.
4. Subsequent requests to `/api/trpc` include the cookie. The tRPC context builder (`server/_core/context.ts`) verifies the JWT and injects `ctx.user` into every procedure.
5. Protected procedures use `protectedProcedure`, which throws `UNAUTHORIZED` if `ctx.user` is null.

The owner (first admin) is automatically assigned the `admin` role based on the `OWNER_OPEN_ID` environment variable.

---

## 8. File Upload Architecture

File uploads follow a two-step process:

1. **Client** selects a file and calls `POST /api/upload` with the file as `multipart/form-data`.
2. **Server** receives the file via the Express upload route, generates a unique S3 key using `nanoid`, and uploads the file to S3 via `storagePut()`.
3. The server returns the public S3 URL to the client.
4. The client includes the `fileUrl`, `fileName`, `fileMimeType`, and `fileSize` in the `messages.send` mutation to create a file-type message.

Files are stored in S3 under the path `uploads/{userId}/{nanoid}.{ext}` with randomized keys to prevent enumeration.

---

## 9. AI Integration

AI features are powered by the built-in LLM service accessed via the `invokeLLM()` helper in `server/_core/llm.ts`. No external API keys are required — credentials are injected by the platform.

### 9.1 Summarization

The `ai.summarize` procedure fetches the last N messages (default 50), formats them as a transcript (`"UserName: message content"`), and sends them to the LLM with a system prompt requesting a structured summary with key topics, decisions, and action items.

### 9.2 Smart Replies

The `ai.smartReply` procedure fetches the last 10 messages, formats them as a transcript, and asks the LLM to suggest 3 short, natural reply options returned as a JSON array of strings. The response is parsed and validated before being returned to the client.

---

## 10. Testing

### 10.1 Test Framework

Tests are written with **Vitest** and executed via `pnpm test`. The test suite uses tRPC's `createCaller` API to invoke procedures directly without HTTP overhead.

### 10.2 Test Coverage

The test suite contains **19 tests** across 2 files:

| File | Tests | Coverage |
|------|-------|----------|
| `server/auth.logout.test.ts` | 1 | Auth cookie clearing |
| `server/features.test.ts` | 18 | Channels (4), Messages (4), Auth (3), Users (4), Conversations (1), Reactions (1), Search (1) |

### 10.3 Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode (during development)
pnpm vitest

# Run a specific test file
pnpm vitest server/features.test.ts
```

### 10.4 Writing New Tests

Follow the pattern established in `server/features.test.ts`:

1. Create a mock context with `createAuthContext()` that provides a fake user and mock `req`/`res` objects.
2. Create a tRPC caller with `appRouter.createCaller(ctx)`.
3. Call procedures directly: `await caller.channels.create({ name: "test" })`.
4. Assert results with Vitest's `expect` API.

---

## 11. Development Workflow

### 11.1 Local Development

```bash
# Start the development server (frontend + backend with HMR)
pnpm dev

# The server runs on http://localhost:3000
# Vite HMR provides instant frontend updates
# TSX watch provides backend hot-reloading
```

### 11.2 Build Loop

The recommended development loop follows four touch points:

1. **Schema** — Edit `drizzle/schema.ts`, then run `pnpm db:push` to apply migrations.
2. **Database helpers** — Add query functions in `server/db.ts`.
3. **API procedures** — Define tRPC procedures in `server/routers.ts`.
4. **Frontend UI** — Build React components that call `trpc.*.useQuery/useMutation`.

### 11.3 Type Checking

```bash
# Run TypeScript compiler in check mode (no emit)
pnpm check
```

### 11.4 Production Build

```bash
# Build frontend (Vite) and backend (esbuild)
pnpm build

# Start the production server
pnpm start
```

---

## 12. Environment Variables

The application relies on platform-injected environment variables. These should never be hardcoded or committed to version control.

| Variable | Scope | Description |
|----------|-------|-------------|
| `DATABASE_URL` | Server | MySQL/TiDB connection string |
| `JWT_SECRET` | Server | Session cookie signing secret |
| `VITE_APP_ID` | Client | Manus OAuth application ID |
| `OAUTH_SERVER_URL` | Server | Manus OAuth backend base URL |
| `VITE_OAUTH_PORTAL_URL` | Client | Manus login portal URL |
| `OWNER_OPEN_ID` | Server | Owner's OAuth identifier (auto-admin) |
| `OWNER_NAME` | Server | Owner's display name |
| `BUILT_IN_FORGE_API_URL` | Server | Internal API hub URL (LLM, storage, etc.) |
| `BUILT_IN_FORGE_API_KEY` | Server | Bearer token for internal APIs |
| `VITE_FRONTEND_FORGE_API_KEY` | Client | Frontend token for internal APIs |
| `VITE_FRONTEND_FORGE_API_URL` | Client | Frontend internal API URL |

---

## 13. Key Design Decisions

**Polling over WebSockets.** The application uses HTTP polling (3-second interval) for real-time updates rather than WebSockets. This simplifies deployment, avoids connection management complexity, and works reliably behind all proxy configurations. The trade-off is slightly higher latency (up to 3 seconds) compared to push-based WebSockets.

**tRPC over REST.** tRPC provides end-to-end type safety between the frontend and backend without code generation or schema files. Procedure inputs are validated with Zod, and return types flow automatically to the React Query hooks.

**Drizzle over Prisma.** Drizzle ORM was chosen for its lightweight footprint, SQL-like query API, and fast migration tooling. It generates TypeScript types directly from the schema definition without a separate generation step.

**S3 for file storage.** All uploaded files are stored in S3 rather than the database. The database stores only metadata (URL, filename, MIME type, size). This keeps the database lean and leverages S3's scalability for binary content.

**Server-side AI calls.** LLM invocations are performed exclusively on the server to protect API credentials and control costs. The frontend triggers AI features via tRPC mutations and receives the results asynchronously.

---

## 14. Extending the Application

### 14.1 Adding a New Feature

Follow this checklist when adding a new feature:

1. Define new tables in `drizzle/schema.ts` and run `pnpm db:push`.
2. Add query helpers in `server/db.ts`.
3. Create tRPC procedures in `server/routers.ts` (choose `publicProcedure` or `protectedProcedure`).
4. Build the frontend UI in `client/src/components/` or `client/src/pages/`.
5. Wire the UI to the backend with `trpc.*.useQuery` or `trpc.*.useMutation`.
6. Write Vitest tests in `server/` to cover the new procedures.
7. Run `pnpm test` and `pnpm check` to verify.

### 14.2 Adding a New shadcn/ui Component

shadcn/ui components are already installed as dependencies. To use a new component, import it from `@/components/ui/{component}`. If a component is not yet available, add it following the shadcn/ui documentation and place it in `client/src/components/ui/`.

### 14.3 Upgrading to WebSockets

To replace polling with WebSockets for lower-latency messaging:

1. Install `socket.io` and `socket.io-client`.
2. Register the Socket.IO server in `server/_core/index.ts` (all API routes should start with `/api/`).
3. Emit events from message creation procedures.
4. Replace the `refetchInterval` polling in `ChatArea.tsx` with Socket.IO event listeners.
5. Maintain the polling fallback for environments where WebSockets are blocked.

---

## 15. Troubleshooting (Developer)

**`pnpm db:push` fails.** Ensure the `DATABASE_URL` environment variable is set and the database is accessible. Check for syntax errors in `drizzle/schema.ts`.

**TypeScript errors after schema changes.** Run `pnpm check` to identify type mismatches. Drizzle types are inferred directly from the schema, so any column changes will propagate type errors to `db.ts` and `routers.ts`.

**Tests fail with database errors.** The test suite connects to the real database. Ensure the database is running and accessible. Test channels are created with unique timestamp-based names to avoid collisions.

**Vite HMR not working.** Check the dev server logs in `.manus-logs/devserver.log`. Restart the dev server if HMR becomes unresponsive.

---

*For end-user documentation, refer to the User Guide. For deployment instructions, use the Manus platform's built-in Publish workflow.*
