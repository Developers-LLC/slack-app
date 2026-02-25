import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Paperclip, Send, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface MessageInputProps {
  onSend: (content: string, file?: { url: string; name: string; mimeType: string; size: number }) => void;
  placeholder?: string;
  channelId?: number;
  conversationId?: number;
}

export function MessageInput({ onSend, placeholder = "Type a message...", channelId, conversationId }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string; mimeType: string; size: number } | null>(null);
  const [showSmartReplies, setShowSmartReplies] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const smartReply = trpc.ai.smartReply.useMutation({
    onSuccess: (data) => {
      if (data.replies && data.replies.length > 0) {
        setShowSmartReplies(true);
      } else {
        toast.info("No smart reply suggestions available");
      }
    },
  });

  const handleSubmit = useCallback(() => {
    if (!content.trim() && !attachedFile) return;
    onSend(content, attachedFile ?? undefined);
    setContent("");
    setAttachedFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [content, attachedFile, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + "px";
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }
    setUploading(true);
    try {
      // Upload to server via form data
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setAttachedFile({ url: data.url, name: file.name, mimeType: file.type, size: file.size });
      toast.success("File attached!");
    } catch (err) {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && fileInputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInputRef.current.files = dt.files;
      fileInputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, []);

  return (
    <div
      className="rounded-xl border border-border/50 bg-secondary/30 focus-within:border-primary/30 transition-colors"
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
    >
      {/* Attached file preview */}
      {attachedFile && (
        <div className="px-3 pt-2 flex items-center gap-2">
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-secondary/50 text-sm">
            <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="truncate max-w-48">{attachedFile.name}</span>
            <button onClick={() => setAttachedFile(null)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Smart replies */}
      {showSmartReplies && smartReply.data?.replies && (
        <div className="px-3 pt-2 flex flex-wrap gap-1.5">
          {(smartReply.data.replies as string[]).map((reply, i) => (
            <button
              key={i}
              onClick={() => { setContent(reply); setShowSmartReplies(false); textareaRef.current?.focus(); }}
              className="px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
            >
              {reply}
            </button>
          ))}
          <button onClick={() => setShowSmartReplies(false)} className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 p-2">
        {/* File upload */}
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Paperclip className="w-4 h-4" />
        </Button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="flex-1 bg-transparent text-sm resize-none outline-none placeholder:text-muted-foreground/60 py-1.5 max-h-40"
        />

        {/* AI Smart Reply */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary"
          onClick={() => smartReply.mutate({ channelId, conversationId })}
          disabled={smartReply.isPending}
        >
          <Sparkles className="w-4 h-4" />
        </Button>

        {/* Send */}
        <Button
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleSubmit}
          disabled={!content.trim() && !attachedFile}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* Formatting hint */}
      <div className="px-3 pb-1.5 flex items-center gap-3 text-[10px] text-muted-foreground/50">
        <span>**bold**</span>
        <span>*italic*</span>
        <span>`code`</span>
        <span>```code block```</span>
        <span className="ml-auto">Shift+Enter for new line</span>
      </div>
    </div>
  );
}
