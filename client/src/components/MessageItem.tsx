import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MessageSquare, SmilePlus, Image as ImageIcon, FileText } from "lucide-react";
import { format } from "date-fns";
import { Streamdown } from "streamdown";

const EMOJI_LIST = ["👍", "❤️", "😂", "🎉", "🤔", "👀", "🔥", "✅", "👏", "💯", "🚀", "😍", "🙏", "💪", "😊", "🤣"];

interface MessageItemProps {
  message: any;
  onOpenThread: (messageId: number) => void;
  currentUserId: number;
  className?: string;
}

export function MessageItem({ message, onOpenThread, currentUserId, className }: MessageItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const toggleReaction = trpc.reactions.toggle.useMutation({
    onSuccess: () => {
      // Will be refreshed by polling
    },
  });

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const isImage = message.fileMimeType?.startsWith("image/");
  const hasFile = !!message.fileUrl;

  return (
    <div
      className={`group relative flex gap-3 px-2 py-1.5 rounded-lg message-hover transition-colors ${className ?? ""}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowEmojiPicker(false); }}
    >
      {/* Avatar */}
      <Avatar className="w-8 h-8 mt-0.5 shrink-0">
        <AvatarFallback className="text-[10px] bg-secondary font-medium">
          {getInitials(message.user?.name)}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">{message.user?.name || "Unknown"}</span>
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(message.createdAt), "h:mm a")}
          </span>
          {message.isEdited && <span className="text-[10px] text-muted-foreground">(edited)</span>}
        </div>

        {/* Message content with markdown */}
        <div className="text-sm text-foreground/90 mt-0.5 prose prose-sm prose-invert max-w-none [&>p]:mb-1 [&>p:last-child]:mb-0">
          <Streamdown>{message.content}</Streamdown>
        </div>

        {/* File attachment */}
        {hasFile && (
          <div className="mt-2">
            {isImage ? (
              <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={message.fileUrl}
                  alt={message.fileName || "Image"}
                  className="max-w-xs max-h-64 rounded-lg border border-border/50 object-cover"
                />
              </a>
            ) : (
              <a
                href={message.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border/50 hover:bg-secondary transition-colors"
              >
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{message.fileName || "File"}</p>
                  {message.fileSize && (
                    <p className="text-[10px] text-muted-foreground">
                      {(message.fileSize / 1024).toFixed(1)} KB
                    </p>
                  )}
                </div>
              </a>
            )}
          </div>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {message.reactions.map((r: any) => {
              const isOwn = r.userIds?.includes(currentUserId);
              return (
                <button
                  key={r.emoji}
                  onClick={() => toggleReaction.mutate({ messageId: message.id, emoji: r.emoji })}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                    isOwn ? "bg-primary/15 border-primary/30 text-primary" : "bg-secondary/50 border-border/50 text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <span>{r.emoji}</span>
                  <span className="font-medium">{r.count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Thread indicator */}
        {message.replyCount > 0 && (
          <button
            onClick={() => onOpenThread(message.id)}
            className="flex items-center gap-1.5 mt-1.5 text-xs text-primary hover:underline"
          >
            <MessageSquare className="w-3 h-3" />
            {message.replyCount} {message.replyCount === 1 ? "reply" : "replies"}
          </button>
        )}
      </div>

      {/* Hover Actions */}
      {showActions && (
        <div className="absolute -top-3 right-2 flex items-center gap-0.5 bg-card border border-border/50 rounded-lg px-1 py-0.5 shadow-lg z-10">
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <SmilePlus className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2 bg-card border-border" align="end">
              <div className="grid grid-cols-8 gap-1">
                {EMOJI_LIST.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      toggleReaction.mutate({ messageId: message.id, emoji });
                      setShowEmojiPicker(false);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-secondary transition-colors text-base"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onOpenThread(message.id)}>
            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
        </div>
      )}
    </div>
  );
}
