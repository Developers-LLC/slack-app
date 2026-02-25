***

# Product Requirements Document (PRD): Slack
**Version:** 1.0
**Status:** Draft
**Product Owner:** Stewart Butterfield
**Date:** [Foundational Date]

---

## 1. Executive Summary
Slack is a channel-based messaging platform designed to replace internal email. It serves as a "Searchable Log of All Conversation and Knowledge" (SLACK) for organizations. By centralizing communication into public channels, we break down information silos, increase transparency, and integrate third-party tools into a single "digital HQ."

## 2. Problem Statement
*   **Email is Siloed:** Valuable knowledge is trapped in private inboxes (Subject: FW: FW: RE:). New employees cannot access historical context.
*   **Lack of Urgency:** Email is asynchronous and formal, making it unsuitable for rapid, agile decision-making or incident response.
*   **Fragmented Workflows:** Teams constantly context-switch between chat apps, file storage, and project management tools.

## 3. Goals & Objectives
*   **Kill Internal Email:** Reduce internal email volume by 50% within adopting teams.
*   **Centralize Knowledge:** Make every conversation, file, and link searchable from a single search bar.
*   **Platform Agnostic:** Integrate deeply with the tools developers and knowledge workers already use (GitHub, Google Drive, Jira).

## 4. Target Audience
| Persona | Description | Needs |
| :--- | :--- | :--- |
| **The Agile Developer** | Software engineers and DevOps. | Syntax highlighting for code, Git integration, and zero-mouse navigation. |
| **The Project Lead** | Product/Project Managers. | Visibility into team progress without scheduling status meetings. |
| **The Enterprise Admin** | IT/Security Managers. | Data retention policies, SSO, and user provisioning control. |

## 5. Functional Requirements

### 5.1 Channels (The Core Unit)
*   **Public Channels (`#general`):** Open to anyone in the organization. History is searchable by all.
*   **Private Channels:** Invite-only groups for sensitive discussions (HR, Finance).
*   **Creation:** Users can create channels ad-hoc around projects, topics, or teams.

### 5.2 Messaging & Collaboration
*   **Direct Messages (DMs):** 1:1 or small group private chats.
*   **Rich Text Editor:** Support for bold, italics, lists, and **code blocks** (essential for the dev persona).
*   **File Sharing:** Drag-and-drop functionality for images, PDFs, and code snippets directly into the chat stream.

### 5.3 Mentions & Notifications
*   **@Mentions:** `@username` to alert a specific person; `@channel` to alert the whole room.
*   **Status:** customizable user statuses (e.g., "In a meeting," "Vacation") to manage expectations.

### 5.4 Search (The "Brain")
*   **Universal Search:** A single query must index messages, files, and people.
*   **Filters:** Ability to narrow search by "from user," "in channel," or date range.

## 6. Non-Functional Requirements
*   **Real-Time Latency:** Message delivery must occur in < 200ms.
*   **Data Persistence:** Chat history must be infinite (unless restricted by plan) and retrieved quickly.
*   **Security:** Data encryption in transit (TLS) and at rest.

## 7. Technical Stack & Architecture

### 7.1 Frontend Framework & Rendering
*   **Core Framework:** **React** via **Next.js (App Router)**.
    *   *Rationale:* Next.js allows for a highly performant web client that can easily be wrapped into desktop apps (Electron style) later. Server Components help load heavy channel history efficiently.
*   **Hosting & Edge:** **Vercel**.
    *   *Rationale:* Instant deployment and edge caching for static assets (avatars, attachments) to ensure the app feels "native" and snappy globally.

### 7.2 Interface Design (UI/UX)
*   **Component Library:** **Shadcn UI**.
    *   *Rationale:* High-quality, accessible primitives (Radix UI) allow us to build complex interactive elements (popovers, command menus, dialogs) that are keyboard navigable.
*   **Aesthetic Direction:** **"Apple MacOS" Inspired**.
    *   *Sidebar:* Translucent, frosted glass effect (`backdrop-filter`) for the channel navigation sidebar, similar to MacOS Finder.
    *   *Typography:* Inter or San Francisco font. High legibility.
    *   *Subtlety:* Minimalist iconography. Active channels highlight with a soft rounded background rather than harsh blocks.
    *   *Command Palette:* A global `Cmd+K` menu (styled with Shadcn's Command component) for jumping between channels instantly without using a mouse.

### 7.3 Backend, Data & Realtime
*   **Runtime Environment:** **Node.js**.
*   **BaaS (Backend as a Service):** **Supabase**.
    *   **Realtime Subscriptions:** **Supabase Realtime** is critical here. It handles the WebSocket connections required to update chat windows instantly when a new message is inserted into the database.
    *   **Database:** PostgreSQL. Relational data is required to map `Users` -> `Workspaces` -> `Channels` -> `Messages`.
    *   **Vector Search (Future proofing):** Use `pgvector` in Supabase to power semantic search (finding messages based on meaning, not just keywords).

### 7.4 Payments & Monetization
*   **Payment Gateway:** **Stripe**.
    *   *Billing Model:* Per-seat/Per-user recurring billing (SaaS).
    *   *Implementation:* Stripe Customer Portal for managing team seats and credit card updates.

## 8. User Stories
*   **Story 1:** *As a developer, I want to paste a block of Python code into a channel so that it retains its formatting and syntax highlighting.*
*   **Story 2:** *As a new hire, I want to search for "Q3 Roadmap" and see all files and conversations related to that topic from before I joined.*
*   **Story 3:** *As a manager, I want to create a private channel for "Hiring" so we can discuss candidates confidentially.*

## 9. UI/UX Wireframe Guidelines
*   **The Layout:** Three-column layout (Sidebar, Main Chat, Thread/Details View).
*   **The Input Bar:** Fixed at the bottom of the Main Chat. Must support multi-line text and file attachment icons.
*   **Visual Hierarchy:** Channel names in the sidebar should be dimmed if read, and bold/white if unread. Mentions should trigger a red badge count.

## 10. Analytics & Success Metrics (KPIs)

### North Star Metric
*   **Messages Sent Per Active User Per Day:** This indicates true engagement and value. If users are sending messages, they are working.

### Secondary Metrics
*   **Daily Active Users (DAU):** Total login count.
*   **Search Queries Performed:** Indicates the platform is being used as a knowledge base.
*   **Integration Installs:** Average number of apps (GitHub, Google Drive) connected per workspace.

## 11. Risks & Mitigation Strategies
*   **Risk:** Notification Fatigue (The "Always On" problem).
    *   *Mitigation:* Granular notification settings (Snooze, Do Not Disturb schedules) and "Thread" views to compartmentalize noisy conversations.
*   **Risk:** Information Overload.
    *   *Mitigation:* Robust search and the ability to "Archive" channels that are no longer active.
*   **Risk:** Adoption Resistance from Non-Tech users.
    *   *Mitigation:* Focus heavily on the "WYSIWYG" editor and simple onboarding flows to make it feel as easy as email.

---
**Approved By:**
*Stewart Butterfield (CEO)*
