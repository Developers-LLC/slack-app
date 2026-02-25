import { eq, and, or, desc, asc, like, sql, inArray, isNull, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, channels, channelMembers, messages,
  conversations, conversationParticipants, reactions,
  type Channel, type InsertChannel, type InsertMessage
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User Helpers ───────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, avatarUrl: users.avatarUrl, presence: users.presence, status: users.status, statusEmoji: users.statusEmoji, lastSeen: users.lastSeen }).from(users).orderBy(asc(users.name));
}

export async function updateUserPresence(userId: number, presence: "online" | "away" | "offline") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ presence, lastSeen: new Date() }).where(eq(users.id, userId));
}

export async function updateUserStatus(userId: number, status: string, statusEmoji: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ status, statusEmoji }).where(eq(users.id, userId));
}

// ─── Channel Helpers ────────────────────────────────────────────

export async function createChannel(data: { name: string; description?: string; type: "public" | "private"; createdBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(channels).values(data);
  const channelId = result[0].insertId;
  // Creator auto-joins as owner
  await db.insert(channelMembers).values({ channelId, userId: data.createdBy, role: "owner" });
  return channelId;
}

export async function getChannelById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(channels).where(eq(channels.id, id)).limit(1);
  return result[0];
}

export async function listChannels(userId: number) {
  const db = await getDb();
  if (!db) return [];
  // Get all public channels + private channels user is a member of
  const allChannels = await db.select().from(channels).where(eq(channels.isArchived, false)).orderBy(asc(channels.name));
  const memberships = await db.select().from(channelMembers).where(eq(channelMembers.userId, userId));
  const memberChannelIds = new Set(memberships.map(m => m.channelId));

  return allChannels.filter(c => c.type === "public" || memberChannelIds.has(c.id)).map(c => ({
    ...c,
    isMember: memberChannelIds.has(c.id),
  }));
}

export async function joinChannel(channelId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(channelMembers).where(and(eq(channelMembers.channelId, channelId), eq(channelMembers.userId, userId))).limit(1);
  if (existing.length > 0) return;
  await db.insert(channelMembers).values({ channelId, userId });
}

export async function leaveChannel(channelId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(channelMembers).where(and(eq(channelMembers.channelId, channelId), eq(channelMembers.userId, userId)));
}

export async function getChannelMembers(channelId: number) {
  const db = await getDb();
  if (!db) return [];
  const members = await db.select({ userId: channelMembers.userId, role: channelMembers.role, joinedAt: channelMembers.joinedAt }).from(channelMembers).where(eq(channelMembers.channelId, channelId));
  if (members.length === 0) return [];
  const userIds = members.map(m => m.userId);
  const userList = await db.select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl, presence: users.presence }).from(users).where(inArray(users.id, userIds));
  const userMap = new Map(userList.map(u => [u.id, u]));
  return members.map(m => ({ ...m, user: userMap.get(m.userId) }));
}

export async function isChannelMember(channelId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(channelMembers).where(and(eq(channelMembers.channelId, channelId), eq(channelMembers.userId, userId))).limit(1);
  return result.length > 0;
}

export async function markChannelRead(channelId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(channelMembers).set({ lastReadAt: new Date() }).where(and(eq(channelMembers.channelId, channelId), eq(channelMembers.userId, userId)));
}

// ─── Message Helpers ────────────────────────────────────────────

export async function createMessage(data: { channelId?: number; conversationId?: number; userId: number; content: string; parentId?: number; type?: "text" | "system" | "file"; fileUrl?: string; fileName?: string; fileMimeType?: string; fileSize?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messages).values({
    channelId: data.channelId ?? null,
    conversationId: data.conversationId ?? null,
    userId: data.userId,
    content: data.content,
    parentId: data.parentId ?? null,
    type: data.type ?? "text",
    fileUrl: data.fileUrl ?? null,
    fileName: data.fileName ?? null,
    fileMimeType: data.fileMimeType ?? null,
    fileSize: data.fileSize ?? null,
  });
  // If this is a thread reply, increment parent's replyCount
  if (data.parentId) {
    await db.update(messages).set({ replyCount: sql`${messages.replyCount} + 1` }).where(eq(messages.id, data.parentId));
  }
  return result[0].insertId;
}

export async function getMessages(opts: { channelId?: number; conversationId?: number; limit?: number; before?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts.channelId) conditions.push(eq(messages.channelId, opts.channelId));
  if (opts.conversationId) conditions.push(eq(messages.conversationId, opts.conversationId));
  conditions.push(isNull(messages.parentId)); // Only top-level messages
  if (opts.before) conditions.push(sql`${messages.id} < ${opts.before}`);

  const msgs = await db.select().from(messages).where(and(...conditions)).orderBy(desc(messages.createdAt)).limit(opts.limit ?? 50);
  return enrichMessages(msgs.reverse());
}

export async function getThreadMessages(parentId: number) {
  const db = await getDb();
  if (!db) return [];
  const parent = await db.select().from(messages).where(eq(messages.id, parentId)).limit(1);
  const replies = await db.select().from(messages).where(eq(messages.parentId, parentId)).orderBy(asc(messages.createdAt));
  return enrichMessages([...parent, ...replies]);
}

export async function getNewMessages(opts: { channelId?: number; conversationId?: number; after: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts.channelId) conditions.push(eq(messages.channelId, opts.channelId));
  if (opts.conversationId) conditions.push(eq(messages.conversationId, opts.conversationId));
  conditions.push(isNull(messages.parentId));
  conditions.push(sql`${messages.id} > ${opts.after}`);

  const msgs = await db.select().from(messages).where(and(...conditions)).orderBy(asc(messages.createdAt));
  return enrichMessages(msgs);
}

async function enrichMessages(msgs: any[]) {
  const db = await getDb();
  if (!db || msgs.length === 0) return [];
  const userIds = Array.from(new Set(msgs.map(m => m.userId)));
  const msgIds = msgs.map(m => m.id);
  const [userList, reactionList] = await Promise.all([
    db.select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl, presence: users.presence }).from(users).where(inArray(users.id, userIds)),
    msgIds.length > 0 ? db.select().from(reactions).where(inArray(reactions.messageId, msgIds)) : Promise.resolve([]),
  ]);
  const userMap = new Map(userList.map(u => [u.id, u]));
  // Group reactions by message
  const reactionMap = new Map<number, Map<string, { emoji: string; count: number; userIds: number[] }>>();
  for (const r of reactionList) {
    if (!reactionMap.has(r.messageId)) reactionMap.set(r.messageId, new Map());
    const msgReactions = reactionMap.get(r.messageId)!;
    if (!msgReactions.has(r.emoji)) msgReactions.set(r.emoji, { emoji: r.emoji, count: 0, userIds: [] });
    const entry = msgReactions.get(r.emoji)!;
    entry.count++;
    entry.userIds.push(r.userId);
  }
  return msgs.map(m => ({
    ...m,
    user: userMap.get(m.userId) ?? { id: m.userId, name: "Unknown", avatarUrl: null, presence: "offline" },
    reactions: reactionMap.has(m.id) ? Array.from(reactionMap.get(m.id)!.values()) : [],
  }));
}

// ─── Conversation (DM) Helpers ──────────────────────────────────

export async function findOrCreateDM(userId1: number, userId2: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Find existing DM between these two users
  const existing = await db.execute(sql`
    SELECT cp1.conversationId FROM conversation_participants cp1
    JOIN conversation_participants cp2 ON cp1.conversationId = cp2.conversationId
    JOIN conversations c ON c.id = cp1.conversationId
    WHERE cp1.userId = ${userId1} AND cp2.userId = ${userId2} AND c.type = 'dm'
    LIMIT 1
  `);
  const rows = (existing as any)[0] as any[];
  if (rows.length > 0) return rows[0].conversationId as number;

  // Create new DM conversation
  const result = await db.insert(conversations).values({ type: "dm" });
  const convId = result[0].insertId;
  await db.insert(conversationParticipants).values([
    { conversationId: convId, userId: userId1 },
    { conversationId: convId, userId: userId2 },
  ]);
  return convId;
}

export async function getUserConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const parts = await db.select().from(conversationParticipants).where(eq(conversationParticipants.userId, userId));
  if (parts.length === 0) return [];
  const convIds = parts.map(p => p.conversationId);
  const convs = await db.select().from(conversations).where(inArray(conversations.id, convIds)).orderBy(desc(conversations.updatedAt));

  // Get all participants for these conversations
  const allParts = await db.select().from(conversationParticipants).where(inArray(conversationParticipants.conversationId, convIds));
  const otherUserIds = Array.from(new Set(allParts.filter(p => p.userId !== userId).map(p => p.userId)));
  const otherUsers = otherUserIds.length > 0 ? await db.select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl, presence: users.presence }).from(users).where(inArray(users.id, otherUserIds)) : [];
  const userMap = new Map(otherUsers.map(u => [u.id, u]));

  // Get last message for each conversation
  const lastMessages = await Promise.all(convIds.map(async (cid) => {
    const msgs = await db.select().from(messages).where(eq(messages.conversationId, cid)).orderBy(desc(messages.createdAt)).limit(1);
    return { convId: cid, message: msgs[0] ?? null };
  }));
  const lastMsgMap = new Map(lastMessages.map(lm => [lm.convId, lm.message]));

  return convs.map(c => {
    const participants = allParts.filter(p => p.conversationId === c.id && p.userId !== userId).map(p => userMap.get(p.userId)).filter(Boolean);
    return { ...c, participants, lastMessage: lastMsgMap.get(c.id) ?? null };
  });
}

// ─── Reaction Helpers ───────────────────────────────────────────

export async function toggleReaction(messageId: number, userId: number, emoji: string) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(reactions).where(and(eq(reactions.messageId, messageId), eq(reactions.userId, userId), eq(reactions.emoji, emoji))).limit(1);
  if (existing.length > 0) {
    await db.delete(reactions).where(eq(reactions.id, existing[0].id));
    return "removed";
  } else {
    await db.insert(reactions).values({ messageId, userId, emoji });
    return "added";
  }
}

// ─── Search Helpers ─────────────────────────────────────────────

export async function searchMessages(query: string, userId: number, opts?: { channelId?: number; fromUserId?: number; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [like(messages.content, `%${query}%`)];
  if (opts?.channelId) conditions.push(eq(messages.channelId, opts.channelId));
  if (opts?.fromUserId) conditions.push(eq(messages.userId, opts.fromUserId));

  const msgs = await db.select().from(messages).where(and(...conditions)).orderBy(desc(messages.createdAt)).limit(opts?.limit ?? 20);
  return enrichMessages(msgs);
}

export async function searchChannels(query: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(channels).where(and(like(channels.name, `%${query}%`), eq(channels.isArchived, false))).limit(10);
}

export async function searchUsers(query: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl, presence: users.presence }).from(users).where(like(users.name, `%${query}%`)).limit(10);
}

// ─── Unread Helpers ─────────────────────────────────────────────

export async function getUnreadCounts(userId: number) {
  const db = await getDb();
  if (!db) return {};
  const memberships = await db.select().from(channelMembers).where(eq(channelMembers.userId, userId));
  const counts: Record<number, number> = {};
  for (const m of memberships) {
    const result = await db.select({ count: sql<number>`count(*)` }).from(messages).where(and(eq(messages.channelId, m.channelId), isNull(messages.parentId), sql`${messages.createdAt} > ${m.lastReadAt}`));
    counts[m.channelId] = Number(result[0]?.count ?? 0);
  }
  return counts;
}
