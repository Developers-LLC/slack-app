import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageInput } from "@/components/MessageInput";
import { MessageItem } from "@/components/MessageItem";
import { ChannelBrowser } from "@/components/ChannelBrowser";
import { Hash, Lock, Users, Sparkles, Info, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface ChatAreaProps {
  channelId: number | null;
  conversationId: number | null;
  onOpenThread: (messageId: number) => void;
  onSelectChannel: (id: number) => void;
}

export function ChatArea({ channelId, conversationId, onOpenThread, onSelectChannel }: ChatAreaProps) {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lastMessageId, setLastMessageId] = useState(0);
  const [showAISummary, setShowAISummary] = useState(false);
  const [aiSummary, setAiSummary] = useState("");

  const channelQuery = trpc.channels.get.useQuery(
    { id: channelId! },
    { enabled: !!channelId }
  );
  const membersQuery = trpc.channels.members.useQuery(
    { channelId: channelId! },
    { enabled: !!channelId }
  );

  const messagesQuery = trpc.messages.list.useQuery(
    { channelId: channelId ?? undefined, conversationId: conversationId ?? undefined },
    { enabled: !!channelId || !!conversationId }
  );

  // Polling for new messages
  const pollQuery = trpc.messages.poll.useQuery(
    { channelId: channelId ?? undefined, conversationId: conversationId ?? undefined, after: lastMessageId },
    { enabled: (!!channelId || !!conversationId) && lastMessageId > 0, refetchInterval: 2000 }
  );

  const sendMessage = trpc.messages.send.useMutation({
    onSuccess: () => {
      messagesQuery.refetch();
    },
  });

  const joinChannel = trpc.channels.join.useMutation({
    onSuccess: () => {
      messagesQuery.refetch();
      toast.success("Joined channel!");
    },
  });

  const markRead = trpc.channels.markRead.useMutation();

  const summarize = trpc.ai.summarize.useMutation({
    onSuccess: (data) => {
      setAiSummary(String(data.summary));
      setShowAISummary(true);
    },
  });

  const conversationsQuery = trpc.conversations.list.useQuery(undefined, { enabled: !!conversationId });

  // Update lastMessageId when messages load
  useEffect(() => {
    const msgs = messagesQuery.data;
    if (msgs && msgs.length > 0) {
      const maxId = Math.max(...msgs.map((m: any) => m.id));
      setLastMessageId(maxId);
    }
  }, [messagesQuery.data]);

  // Merge polled messages
  const allMessages = useMemo(() => {
    const base = messagesQuery.data ?? [];
    const polled = pollQuery.data ?? [];
    if (polled.length === 0) return base;
    const existingIds = new Set(base.map((m: any) => m.id));
    const newMsgs = polled.filter((m: any) => !existingIds.has(m.id));
    return [...base, ...newMsgs];
  }, [messagesQuery.data, pollQuery.data]);

  // Update lastMessageId from polled data
  useEffect(() => {
    if (pollQuery.data && pollQuery.data.length > 0) {
      const maxId = Math.max(...pollQuery.data.map((m: any) => m.id));
      if (maxId > lastMessageId) setLastMessageId(maxId);
    }
  }, [pollQuery.data, lastMessageId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [allMessages.length]);

  // Mark channel as read
  useEffect(() => {
    if (channelId) {
      markRead.mutate({ channelId });
    }
  }, [channelId]);

  const handleSend = useCallback((content: string, file?: { url: string; name: string; mimeType: string; size: number }) => {
    if (!content.trim() && !file) return;
    sendMessage.mutate({
      channelId: channelId ?? undefined,
      conversationId: conversationId ?? undefined,
      content: content || (file ? file.name : ""),
      fileUrl: file?.url,
      fileName: file?.name,
      fileMimeType: file?.mimeType,
      fileSize: file?.size,
    });
  }, [channelId, conversationId, sendMessage]);

  // Get conversation info for DMs
  const currentConv = conversationsQuery.data?.find((c: any) => c.id === conversationId);
  const dmUser = (currentConv?.participants as any)?.[0];

  // Check if user is a member of the channel
  const isMember = membersQuery.data?.some((m: any) => m.userId === user?.id);
  const channel = channelQuery.data;

  // Empty state
  if (!channelId && !conversationId) {
    return <ChannelBrowser onSelectChannel={onSelectChannel} />;
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="h-14 px-5 flex items-center justify-between border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2">
          {channelId && channel && (
            <>
              {channel.type === "private" ? <Lock className="w-4 h-4 text-muted-foreground" /> : <Hash className="w-4 h-4 text-muted-foreground" />}
              <span className="font-semibold text-sm">{channel.name}</span>
              {channel.description && (
                <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">— {channel.description}</span>
              )}
            </>
          )}
          {conversationId && dmUser && (
            <>
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-[9px] bg-secondary">{dmUser.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
              </Avatar>
              <span className="font-semibold text-sm">{dmUser.name || "Unknown"}</span>
              <div className={`w-2 h-2 rounded-full presence-${dmUser.presence || "offline"}`} />
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          {channelId && membersQuery.data && (
            <Button variant="ghost" size="sm" className="text-muted-foreground h-7 text-xs gap-1">
              <Users className="w-3.5 h-3.5" />
              {membersQuery.data.length}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-7 text-xs gap-1"
            onClick={() => summarize.mutate({ channelId: channelId ?? undefined, conversationId: conversationId ?? undefined })}
            disabled={summarize.isPending}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {summarize.isPending ? "Summarizing..." : "AI Summary"}
          </Button>
        </div>
      </div>

      {/* AI Summary Banner */}
      {showAISummary && aiSummary && (
        <div className="px-5 py-3 bg-primary/5 border-b border-primary/10">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-primary mb-1">AI Summary</p>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{aiSummary}</p>
            </div>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowAISummary(false)}>Dismiss</Button>
          </div>
        </div>
      )}

      {/* Join banner for non-members */}
      {channelId && channel && isMember === false && (
        <div className="px-5 py-3 bg-secondary/50 border-b border-border/50 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">You're previewing <strong>#{channel.name}</strong></p>
          <Button size="sm" onClick={() => joinChannel.mutate({ channelId })} disabled={joinChannel.isPending}>
            {joinChannel.isPending ? "Joining..." : "Join Channel"}
          </Button>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
        {messagesQuery.isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              {channelId ? <Hash className="w-6 h-6 text-primary" /> : <MessageSquare className="w-6 h-6 text-primary" />}
            </div>
            <p className="text-sm font-medium mb-1">No messages yet</p>
            <p className="text-xs text-muted-foreground">Be the first to send a message!</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {allMessages.map((msg: any) => (
              <MessageItem
                key={msg.id}
                message={msg}
                onOpenThread={onOpenThread}
                currentUserId={user?.id ?? 0}
              />
            ))}
          </div>
        )}
      </div>

      {/* Message Input */}
      {(isMember !== false || conversationId) && (
        <div className="px-5 pb-4 shrink-0">
          <MessageInput
            onSend={handleSend}
            placeholder={channelId && channel ? `Message #${channel.name}` : dmUser ? `Message ${dmUser.name}` : "Type a message..."}
            channelId={channelId ?? undefined}
            conversationId={conversationId ?? undefined}
          />
        </div>
      )}
    </div>
  );
}
