# Slack App - Project TODO

## Core Infrastructure
- [x] Database schema (users, channels, memberships, messages, threads, reactions, DMs, files)
- [x] Backend tRPC routers for all features
- [x] Global theming and CSS variables (macOS glassmorphism)

## UI Layout
- [x] Three-column layout (sidebar, main chat, thread panel)
- [x] macOS-inspired glassmorphism sidebar with frosted glass effect
- [x] Responsive design

## Channel Features
- [x] Create channels (public/private)
- [x] Browse/join/leave channels
- [x] Channel list in sidebar with unread indicators
- [x] Channel settings/info panel

## Direct Messaging
- [x] DM conversation list in sidebar
- [x] 1:1 DM creation
- [x] DM conversation view

## Messaging
- [x] Send and receive messages in channels/DMs
- [x] Rich text editor with markdown support
- [x] Code block support with syntax highlighting
- [x] Message timestamps and user avatars

## Threaded Replies
- [x] Click message to open thread side panel
- [x] Reply in thread
- [x] Thread reply count on parent message

## Real-Time Updates
- [x] Polling-based real-time message updates
- [x] New message indicators (unread counts)
- [ ] Typing indicators (stretch goal)

## Search & Command Palette
- [x] Global search across messages, channels, users (Cmd/Ctrl+K)
- [x] Command palette for quick navigation
- [x] Search filters (by user, channel)

## User Presence
- [x] Online/offline/away status indicators
- [x] User status updates
- [x] Presence heartbeat system

## Message Reactions
- [x] Add/remove emoji reactions on messages
- [x] Emoji picker component
- [x] Reaction counts display

## File Uploads
- [x] File upload in messages (drag-and-drop)
- [x] Image preview in chat
- [x] File attachment display

## Push Notifications
- [x] Browser push notifications for new messages
- [ ] Notification for @mentions (stretch goal)
- [ ] Notification preferences (stretch goal)

## AI Features
- [x] Message/conversation summarization
- [x] Smart reply suggestions
- [ ] Conversation insights (stretch goal)

## Testing
- [x] Vitest tests for auth, channels, messages, threads, reactions, search, users (19 tests passing)

## Landing Page
- [x] Professional landing page with login CTA
