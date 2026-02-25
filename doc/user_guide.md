# Slack App — User Guide

**Version 1.0** | Last updated: February 2026

---

## 1. Introduction

Welcome to **Slack**, your team's Digital HQ for real-time communication and collaboration. This guide walks you through every feature of the platform — from sending your first message to leveraging AI-powered conversation insights. Whether you are a new team member or an experienced user, this document provides the information you need to communicate effectively.

---

## 2. Getting Started

### 2.1 Signing In

Navigate to the application's landing page. Click the **Sign In** or **Get Started Free** button in the top-right corner. You will be redirected to the Manus OAuth portal where you can authenticate with your account. After successful authentication, you are automatically redirected to the workspace.

> If you are already signed in, visiting the landing page will redirect you directly to the workspace.

### 2.2 The Workspace Layout

Once signed in, the workspace presents a **three-column layout** designed for efficient multitasking:

| Column | Position | Purpose |
|--------|----------|---------|
| **Sidebar** | Left (fixed, ~240px) | Navigate channels, direct messages, and access search |
| **Chat Area** | Center (flexible) | View and compose messages in the active channel or DM |
| **Thread Panel** | Right (slides in on demand) | View and reply to threaded conversations |

The dark, macOS-inspired interface uses a glassmorphism aesthetic with frosted-glass panels, subtle transparency, and smooth transitions for a polished desktop experience.

### 2.3 User Profile & Presence

Your profile is displayed at the bottom-left of the sidebar, showing your avatar (or initials), display name, and a **presence indicator** — a small colored dot:

| Indicator | Color | Meaning |
|-----------|-------|---------|
| Online | Green | You are actively using the app |
| Away | Yellow | You have been inactive for a period |
| Offline | Gray | You are not currently signed in |

Presence is updated automatically via a heartbeat system that pings the server every 30 seconds while you are connected.

---

## 3. Channels

Channels are the primary way to organize conversations by topic, project, or team. They appear in the **Channels** section of the sidebar.

### 3.1 Browsing Channels

When no channel is selected, the main area displays the **Browse Channels** view — a list of all available channels with their names, descriptions, and your membership status ("Joined" or "Join" button).

### 3.2 Creating a Channel

Click the **+ Add channel** button in the sidebar. A dialog appears where you can specify:

- **Name** — A short, descriptive name (e.g., `engineering`, `marketing-q1`).
- **Description** — An optional summary of the channel's purpose.
- **Type** — Choose between **Public** (visible to all team members) or **Private** (invite-only).

When you create a channel, you are automatically added as the channel **owner**.

### 3.3 Joining and Leaving Channels

Public channels can be joined by any team member from the channel browser. Click the channel card and then click **Join Channel** if you are not already a member. To leave a channel, open the channel and use the leave option from the channel header.

### 3.4 Channel Header

When viewing a channel, the header displays:

- The channel name prefixed with `#` and its description.
- A **members count** button that shows how many users are in the channel.
- An **AI Summary** button for generating conversation summaries (see Section 8).

### 3.5 Unread Indicators

Channels with unread messages display a **blue badge** with the unread count next to the channel name in the sidebar. When you open a channel, it is automatically marked as read.

---

## 4. Direct Messages

Direct Messages (DMs) enable private 1:1 conversations with other team members.

### 4.1 Starting a New DM

Click the **+ New message** button under the "Direct Messages" section in the sidebar. A dialog appears listing all team members with their presence status. Select a user to open (or create) a DM conversation with them.

### 4.2 DM Conversation List

Active DM conversations appear in the sidebar under "Direct Messages." Each entry shows the other participant's name, avatar, presence indicator, and a preview of the last message sent.

### 4.3 Sending Messages in DMs

The DM chat area works identically to channel messaging — the same rich text editor, file upload, reactions, and threading features are all available.

---

## 5. Messaging

### 5.1 Composing Messages

The message input area sits at the bottom of the chat area. Type your message and press **Enter** to send. Use **Shift+Enter** to insert a new line without sending.

### 5.2 Markdown Formatting

Messages support full Markdown syntax for rich text formatting:

| Syntax | Result | Example |
|--------|--------|---------|
| `**text**` | **Bold** | **important** |
| `*text*` | *Italic* | *emphasis* |
| `` `code` `` | `Inline code` | `variable` |
| ` ```code``` ` | Code block | Multi-line code with syntax highlighting |
| `> text` | Blockquote | Quoted text |
| `- item` | List item | Bulleted list |

A formatting hint bar below the input area reminds you of the available syntax.

### 5.3 Message Display

Each message shows:

- The sender's **avatar** (initials-based with a colored background).
- The sender's **display name** in bold.
- A **timestamp** showing when the message was sent.
- The message **content** rendered with Markdown formatting.
- **Reaction badges** (if any reactions have been added).
- A **reply count** indicator if the message has threaded replies.

### 5.4 Message Actions

Hover over any message to reveal an action toolbar with:

- **Emoji reaction** — Add a quick reaction to the message.
- **Reply in thread** — Open the thread panel to start or view a conversation thread.

---

## 6. Threaded Replies

Threads keep related discussions organized without cluttering the main channel timeline.

### 6.1 Opening a Thread

Click the **reply icon** on any message, or click the "X replies" indicator below a message. The **Thread Panel** slides in from the right side of the screen, showing the original (parent) message at the top followed by all replies in chronological order.

### 6.2 Replying in a Thread

The thread panel has its own message input at the bottom. Type your reply and press Enter. Thread replies are nested under the parent message and do not appear in the main channel feed, keeping the channel clean.

### 6.3 Closing a Thread

Click the **X** button in the top-right corner of the thread panel to close it and return to the full-width chat view.

---

## 7. Search & Command Palette

### 7.1 Opening the Command Palette

Press **Cmd+K** (macOS) or **Ctrl+K** (Windows/Linux) from anywhere in the workspace. Alternatively, click the **Search** button in the sidebar. The command palette opens as a centered modal overlay.

### 7.2 Searching

Type your query into the search field. Results are organized into three categories and appear in real time:

| Category | What It Searches | Result Display |
|----------|-----------------|----------------|
| **Messages** | Message content across all channels and DMs | Sender name, content preview, channel name, timestamp |
| **Channels** | Channel names and descriptions | Channel name, description, member count |
| **Users** | User display names | User name, avatar, presence status |

### 7.3 Quick Navigation

Click any search result to navigate directly to it:

- Clicking a **channel** result opens that channel.
- Clicking a **user** result initiates a DM conversation.
- Clicking a **message** result navigates to the channel or DM containing that message.

### 7.4 Closing the Palette

Press **Escape** or click outside the palette to dismiss it. You can also press **Cmd+K** / **Ctrl+K** again to toggle it off.

---

## 8. AI-Powered Features

The application integrates large language model (LLM) capabilities to help you work smarter.

### 8.1 Conversation Summarization

Click the **AI Summary** button (sparkles icon) in the channel or DM header. The AI reads the most recent messages (up to 50) and generates a structured summary that includes:

- Key topics discussed.
- Decisions that were made.
- Action items and next steps.

The summary appears in a modal overlay and can be dismissed when you are done reading.

### 8.2 Smart Reply Suggestions

Click the **sparkles icon** (✨) next to the message input. The AI analyzes the last 10 messages in the conversation and suggests three natural, contextually appropriate reply options. Click any suggestion to insert it into the message input, then edit or send as-is.

---

## 9. Emoji Reactions

### 9.1 Adding a Reaction

Hover over a message and click the **smiley face** icon in the action toolbar. An emoji picker appears with a curated set of commonly used emojis. Click an emoji to add it as a reaction to the message.

### 9.2 Toggling Reactions

Click an existing reaction badge on a message to toggle your reaction on or off. Each badge shows the emoji and the count of users who reacted. If you are the last person to remove a reaction, the badge disappears.

---

## 10. File Uploads

### 10.1 Attaching Files

Click the **paperclip icon** (📎) in the message input area to open a file picker. Select a file from your computer. A preview of the selected file appears above the message input before sending.

### 10.2 Image Previews

When an image file is attached to a message, it renders as an inline preview directly in the chat. Clicking the image opens it at full resolution. Non-image files display as a download link with the file name and size.

### 10.3 Supported Files

The upload system supports common file types including images (PNG, JPG, GIF, WebP), documents (PDF, DOCX), and other binary files. Files are stored securely in S3 cloud storage.

---

## 11. Browser Notifications

### 11.1 Enabling Notifications

When you first sign in, the browser will request permission to send notifications. Click **Allow** to enable push notifications for new messages.

### 11.2 When Notifications Appear

Notifications are sent when:

- A new message arrives in a channel or DM you are a member of.
- The application tab is **not focused** (i.e., you are in another browser tab or application).

Notifications include the sender's name and a preview of the message content. Clicking a notification brings the app back into focus.

### 11.3 Managing Notifications

Notification permissions can be managed through your browser's site settings. Revoking permission will stop all browser notifications from the application.

---

## 12. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Cmd/Ctrl + K** | Open/close the command palette and search |
| **Enter** | Send a message |
| **Shift + Enter** | Insert a new line in the message input |
| **Escape** | Close the command palette, thread panel, or modal |

---

## 13. Troubleshooting

**I cannot sign in.** Ensure your browser allows third-party cookies. Safari Private Browsing, Firefox Strict ETP, and Brave Aggressive Shields may block the authentication flow.

**Messages are not updating in real time.** The app uses polling to fetch new messages. If messages seem delayed, check your internet connection. The polling interval is approximately 3 seconds.

**Notifications are not appearing.** Verify that you granted notification permission when prompted. Check your browser's site settings to ensure notifications are allowed for this domain.

**The AI Summary button is not responding.** AI features require a server-side connection to the LLM service. If the service is temporarily unavailable, try again after a few moments.

---

*This guide covers the core functionality of the Slack application. For technical details, architecture, and contribution guidelines, refer to the Developer Guide.*
