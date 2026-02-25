import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(userId = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

function createUnauthContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
  return { ctx };
}

describe("Auth Router", () => {
  it("auth.me returns null for unauthenticated users", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("auth.me returns user for authenticated users", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.name).toBe("Test User 1");
    expect(result?.email).toBe("user1@example.com");
  });

  it("auth.logout clears cookie and returns success", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(ctx.res.clearCookie).toHaveBeenCalled();
  });
});

describe("Channel Router", () => {
  it("channels.list returns an array", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.channels.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("channels.create creates a channel and returns id", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.channels.create({
      name: "test-channel-" + Date.now(),
      description: "A test channel",
      type: "public",
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("channels.join and leave work correctly", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    // Create a channel first
    const channel = await caller.channels.create({
      name: "join-test-" + Date.now(),
      type: "public",
    });

    // User 2 joins
    const { ctx: ctx2 } = createMockContext(2);
    const caller2 = appRouter.createCaller(ctx2);
    
    const joinResult = await caller2.channels.join({ channelId: channel.id });
    expect(joinResult).toEqual({ success: true });

    const leaveResult = await caller2.channels.leave({ channelId: channel.id });
    expect(leaveResult).toEqual({ success: true });
  });

  it("channels.markRead returns success", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const channels = await caller.channels.list();
    if (channels.length > 0) {
      const result = await caller.channels.markRead({ channelId: channels[0].id });
      expect(result).toEqual({ success: true });
    }
  });
});

describe("Messages Router", () => {
  it("messages.list returns an array", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const channels = await caller.channels.list();
    if (channels.length > 0) {
      const result = await caller.messages.list({ channelId: channels[0].id });
      expect(Array.isArray(result)).toBe(true);
    }
  });

  it("messages.send creates a message and returns id", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    // Create a channel first
    const channel = await caller.channels.create({
      name: "msg-test-" + Date.now(),
      type: "public",
    });

    const result = await caller.messages.send({
      channelId: channel.id,
      content: "Hello, world!",
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("messages.thread returns parent + replies", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const channel = await caller.channels.create({
      name: "thread-test-" + Date.now(),
      type: "public",
    });

    // Send parent message
    const parent = await caller.messages.send({
      channelId: channel.id,
      content: "Parent message",
    });

    // Send reply
    await caller.messages.send({
      channelId: channel.id,
      content: "Reply message",
      parentId: parent.id,
    });

    const thread = await caller.messages.thread({ parentId: parent.id });
    expect(thread.length).toBeGreaterThanOrEqual(2);
    expect(thread[0].content).toBe("Parent message");
  });

  it("messages.poll returns new messages after a given id", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const channel = await caller.channels.create({
      name: "poll-test-" + Date.now(),
      type: "public",
    });

    const msg1 = await caller.messages.send({ channelId: channel.id, content: "First" });
    await caller.messages.send({ channelId: channel.id, content: "Second" });

    const polled = await caller.messages.poll({ channelId: channel.id, after: msg1.id });
    expect(polled.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Conversations Router", () => {
  it("conversations.list returns an array", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.conversations.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Reactions Router", () => {
  it("reactions.toggle adds and removes a reaction", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const channel = await caller.channels.create({
      name: "react-test-" + Date.now(),
      type: "public",
    });

    const msg = await caller.messages.send({ channelId: channel.id, content: "React to this!" });

    // Add reaction
    const addResult = await caller.reactions.toggle({ messageId: msg.id, emoji: "👍" });
    expect(addResult.action).toBe("added");

    // Remove reaction
    const removeResult = await caller.reactions.toggle({ messageId: msg.id, emoji: "👍" });
    expect(removeResult.action).toBe("removed");
  });
});

describe("Search Router", () => {
  it("search.global returns messages, channels, and users", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.search.global({ query: "test" });
    expect(result).toHaveProperty("messages");
    expect(result).toHaveProperty("channels");
    expect(result).toHaveProperty("users");
    expect(Array.isArray(result.messages)).toBe(true);
    expect(Array.isArray(result.channels)).toBe(true);
    expect(Array.isArray(result.users)).toBe(true);
  });
});

describe("Users Router", () => {
  it("users.list returns an array", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.users.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("users.updatePresence sets presence", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.users.updatePresence({ presence: "online" });
    expect(result).toEqual({ success: true });
  });

  it("users.updateStatus sets status", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.users.updateStatus({ status: "In a meeting", statusEmoji: "📅" });
    expect(result).toEqual({ success: true });
  });

  it("users.heartbeat updates presence to online", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.users.heartbeat();
    expect(result).toEqual({ success: true });
  });
});
