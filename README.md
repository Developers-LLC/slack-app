# Slack — Digital HQ

A full-featured team communication and collaboration platform built with React, TypeScript, tRPC, and Tailwind CSS. Organize conversations in channels, send direct messages, reply in threads, search everything with **Cmd+K**, react with emoji, upload files, and leverage AI-powered conversation summaries and smart replies.

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Push database schema
pnpm db:push

# Start the development server
pnpm dev
```

The application will be available at `http://localhost:3000`.

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Channels** | Public and private channels for topic-based conversations |
| **Direct Messages** | Private 1:1 messaging between team members |
| **Threaded Replies** | Keep discussions organized with side-panel threads |
| **Real-Time Updates** | Automatic polling ensures messages appear within seconds |
| **Markdown Editor** | Rich text formatting with full Markdown support |
| **Global Search** | Search messages, channels, and users with Cmd/Ctrl+K |
| **Emoji Reactions** | React to messages with a curated emoji picker |
| **File Uploads** | Attach and preview images and documents in messages |
| **User Presence** | Online, away, and offline indicators for all team members |
| **Browser Notifications** | Push notifications for new messages when the app is in the background |
| **AI Summarization** | Generate structured summaries of channel conversations |
| **Smart Replies** | AI-suggested reply options based on conversation context |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind CSS 4, shadcn/ui, Wouter |
| Backend | Express 4, tRPC 11, Drizzle ORM |
| Database | MySQL (TiDB) |
| Storage | AWS S3 |
| Auth | Manus OAuth (session-based) |
| AI | Built-in LLM service |
| Testing | Vitest |

---

## Documentation

All project documentation is maintained in the [`doc/`](doc/) directory:

| Document | Description |
|----------|-------------|
| [Product Requirements Document (PRD)](doc/prd.md) | Product vision, goals, feature specifications, and acceptance criteria |
| [User Guide](doc/user_guide.md) | End-user documentation covering all features, keyboard shortcuts, and troubleshooting |
| [Developer Guide](doc/developer_guide.md) | Technical architecture, database schema, API reference, component hierarchy, testing strategy, and extension guidelines |

---

## Project Structure

```
slack-app/
├── client/              # React frontend (Vite + Tailwind + shadcn/ui)
├── server/              # Express + tRPC backend
├── drizzle/             # Database schema and migrations
├── shared/              # Shared constants and types
├── storage/             # S3 file storage helpers
├── doc/                 # Project documentation
│   ├── prd.md           # Product Requirements Document
│   ├── user_guide.md    # End-user guide
│   └── developer_guide.md # Developer reference
└── README.md            # This file
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with HMR |
| `pnpm build` | Build for production |
| `pnpm start` | Run production server |
| `pnpm check` | TypeScript type checking |
| `pnpm test` | Run Vitest test suite |
| `pnpm db:push` | Generate and apply database migrations |

---

## License

MIT
