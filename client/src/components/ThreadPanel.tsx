import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { MessageItem } from "@/components/MessageItem";
import { X, Send } from "lucide-react";

interface ThreadPanelProps {
  messageId: number;
  onClose: () => void;
}

export function ThreadPanel({ messageId, onClose }: ThreadPanelProps) {
  const { user } = useAuth();
  const [replyContent, setReplyContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const threadQuery = trpc.messages.thread.useQuery(
    { parentId: messageId },
    { refetchInterval: 3000 }
  );

  const sendMessage = trpc.messages.send.useMutation({
    onSuccess: () => {
      setReplyContent("");
      threadQuery.refetch();
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    },
  });

  const messages = threadQuery.data ?? [];
  const parentMessage = messages[0];
  const replies = messages.slice(1);

  // Scroll to bottom on new replies
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSendReply = useCallback(() => {
    if (!replyContent.trim()) return;
    sendMessage.mutate({
      channelId: parentMessage?.channelId ?? undefined,
      conversationId: parentMessage?.conversationId ?? undefined,
      content: replyContent,
      parentId: messageId,
    });
  }, [replyContent, messageId, parentMessage, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  }, [handleSendReply]);

  return (
    <div className="glass-panel w-80 lg:w-96 flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-border/50 shrink-0">
        <span className="font-semibold text-sm">Thread</span>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Thread Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3">
        {threadQuery.isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-1">
            {/* Parent message */}
            {parentMessage && (
              <div className="pb-3 mb-3 border-b border-border/50">
                <MessageItem
                  message={parentMessage}
                  onOpenThread={() => {}}
                  currentUserId={user?.id ?? 0}
                />
              </div>
            )}
            {/* Replies */}
            {replies.length > 0 ? (
              <>
                <p className="text-xs text-muted-foreground px-2 mb-2">{replies.length} {replies.length === 1 ? "reply" : "replies"}</p>
                {replies.map((msg: any) => (
                  <MessageItem
                    key={msg.id}
                    message={msg}
                    onOpenThread={() => {}}
                    currentUserId={user?.id ?? 0}
                  />
                ))}
              </>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No replies yet. Start the conversation!</p>
            )}
          </div>
        )}
      </div>

      {/* Reply Input */}
      <div className="p-3 border-t border-border/50 shrink-0">
        <div className="flex items-end gap-2 rounded-lg border border-border/50 bg-secondary/30 p-2 focus-within:border-primary/30 transition-colors">
          <textarea
            ref={textareaRef}
            value={replyContent}
            onChange={e => {
              setReplyContent(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Reply..."
            rows={1}
            className="flex-1 bg-transparent text-sm resize-none outline-none placeholder:text-muted-foreground/60 py-1 max-h-24"
          />
          <Button
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={handleSendReply}
            disabled={!replyContent.trim() || sendMessage.isPending}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
