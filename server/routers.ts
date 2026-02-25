import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getAllUsers, updateUserPresence, updateUserStatus,
  createChannel, getChannelById, listChannels, joinChannel, leaveChannel, getChannelMembers, isChannelMember, markChannelRead,
  createMessage, getMessages, getThreadMessages, getNewMessages,
  findOrCreateDM, getUserConversations,
  toggleReaction,
  searchMessages, searchChannels, searchUsers,
  getUnreadCounts,
} from "./db";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Users ──────────────────────────────────────────────────
  users: router({
    list: protectedProcedure.query(async () => {
      return getAllUsers();
    }),
    updatePresence: protectedProcedure
      .input(z.object({ presence: z.enum(["online", "away", "offline"]) }))
      .mutation(async ({ ctx, input }) => {
        await updateUserPresence(ctx.user.id, input.presence);
        return { success: true };
      }),
    updateStatus: protectedProcedure
      .input(z.object({ status: z.string().max(255), statusEmoji: z.string().max(32) }))
      .mutation(async ({ ctx, input }) => {
        await updateUserStatus(ctx.user.id, input.status, input.statusEmoji);
        return { success: true };
      }),
    heartbeat: protectedProcedure.mutation(async ({ ctx }) => {
      await updateUserPresence(ctx.user.id, "online");
      return { success: true };
    }),
  }),

  // ─── Channels ───────────────────────────────────────────────
  channels: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return listChannels(ctx.user.id);
    }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getChannelById(input.id);
      }),
    create: protectedProcedure
      .input(z.object({ name: z.string().min(1).max(100), description: z.string().optional(), type: z.enum(["public", "private"]).default("public") }))
      .mutation(async ({ ctx, input }) => {
        const id = await createChannel({ ...input, description: input.description ?? "", createdBy: ctx.user.id });
        return { id };
      }),
    join: protectedProcedure
      .input(z.object({ channelId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await joinChannel(input.channelId, ctx.user.id);
        return { success: true };
      }),
    leave: protectedProcedure
      .input(z.object({ channelId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await leaveChannel(input.channelId, ctx.user.id);
        return { success: true };
      }),
    members: protectedProcedure
      .input(z.object({ channelId: z.number() }))
      .query(async ({ input }) => {
        return getChannelMembers(input.channelId);
      }),
    markRead: protectedProcedure
      .input(z.object({ channelId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await markChannelRead(input.channelId, ctx.user.id);
        return { success: true };
      }),
    unreadCounts: protectedProcedure.query(async ({ ctx }) => {
      return getUnreadCounts(ctx.user.id);
    }),
  }),

  // ─── Messages ───────────────────────────────────────────────
  messages: router({
    list: protectedProcedure
      .input(z.object({ channelId: z.number().optional(), conversationId: z.number().optional(), limit: z.number().optional(), before: z.number().optional() }))
      .query(async ({ input }) => {
        return getMessages(input);
      }),
    send: protectedProcedure
      .input(z.object({
        channelId: z.number().optional(), conversationId: z.number().optional(),
        content: z.string().min(1), parentId: z.number().optional(),
        fileUrl: z.string().optional(), fileName: z.string().optional(),
        fileMimeType: z.string().optional(), fileSize: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createMessage({
          ...input,
          userId: ctx.user.id,
          type: input.fileUrl ? "file" : "text",
        });
        return { id };
      }),
    thread: protectedProcedure
      .input(z.object({ parentId: z.number() }))
      .query(async ({ input }) => {
        return getThreadMessages(input.parentId);
      }),
    poll: protectedProcedure
      .input(z.object({ channelId: z.number().optional(), conversationId: z.number().optional(), after: z.number() }))
      .query(async ({ input }) => {
        return getNewMessages(input);
      }),
  }),

  // ─── Conversations (DMs) ───────────────────────────────────
  conversations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserConversations(ctx.user.id);
    }),
    findOrCreate: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const id = await findOrCreateDM(ctx.user.id, input.userId);
        return { id };
      }),
  }),

  // ─── Reactions ──────────────────────────────────────────────
  reactions: router({
    toggle: protectedProcedure
      .input(z.object({ messageId: z.number(), emoji: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const result = await toggleReaction(input.messageId, ctx.user.id, input.emoji);
        return { action: result };
      }),
  }),

  // ─── File Upload ────────────────────────────────────────────
  files: router({
    getUploadUrl: protectedProcedure
      .input(z.object({ fileName: z.string(), mimeType: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Return a key for the client to upload to
        const ext = input.fileName.split('.').pop() || 'bin';
        const key = `uploads/${ctx.user.id}/${nanoid()}.${ext}`;
        return { key, mimeType: input.mimeType };
      }),
  }),

  // ─── Search ─────────────────────────────────────────────────
  search: router({
    global: protectedProcedure
      .input(z.object({ query: z.string().min(1), channelId: z.number().optional(), fromUserId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const [msgs, chans, usrs] = await Promise.all([
          searchMessages(input.query, ctx.user.id, { channelId: input.channelId, fromUserId: input.fromUserId }),
          searchChannels(input.query),
          searchUsers(input.query),
        ]);
        return { messages: msgs, channels: chans, users: usrs };
      }),
  }),

  // ─── AI Features ───────────────────────────────────────────
  ai: router({
    summarize: protectedProcedure
      .input(z.object({ channelId: z.number().optional(), conversationId: z.number().optional(), messageCount: z.number().default(50) }))
      .mutation(async ({ input }) => {
        const msgs = await getMessages({ channelId: input.channelId, conversationId: input.conversationId, limit: input.messageCount });
        if (msgs.length === 0) return { summary: "No messages to summarize." };
        const transcript = msgs.map((m: any) => `${m.user?.name || "Unknown"}: ${m.content}`).join("\n");
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a helpful assistant that summarizes team conversations. Provide a concise, structured summary with key topics, decisions, and action items." },
            { role: "user", content: `Please summarize this conversation:\n\n${transcript}` },
          ],
        });
        return { summary: response.choices[0]?.message?.content || "Could not generate summary." };
      }),
    smartReply: protectedProcedure
      .input(z.object({ channelId: z.number().optional(), conversationId: z.number().optional() }))
      .mutation(async ({ input }) => {
        const msgs = await getMessages({ channelId: input.channelId, conversationId: input.conversationId, limit: 10 });
        if (msgs.length === 0) return { replies: [] };
        const transcript = msgs.map((m: any) => `${m.user?.name || "Unknown"}: ${m.content}`).join("\n");
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a helpful assistant. Based on the conversation, suggest 3 short, natural reply options. Return them as a JSON array of strings." },
            { role: "user", content: `Conversation:\n${transcript}\n\nSuggest 3 brief replies:` },
          ],
        });
        try {
          const content = String(response.choices[0]?.message?.content || "[]");
          const cleaned = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
          const replies = JSON.parse(cleaned);
          return { replies: Array.isArray(replies) ? replies.slice(0, 3) : [] };
        } catch {
          return { replies: [] };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
