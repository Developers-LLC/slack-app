import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useEffect, useState, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { ThreadPanel } from "@/components/ThreadPanel";
import { CommandPalette } from "@/components/CommandPalette";
import { useNotifications } from "@/hooks/useNotifications";

export default function Workspace() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();

  const [activeChannelId, setActiveChannelId] = useState<number | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Browser notifications
  const { showNotification } = useNotifications();

  // Heartbeat for presence
  const heartbeat = trpc.users.heartbeat.useMutation();
  useEffect(() => {
    if (!isAuthenticated) return;
    heartbeat.mutate();
    const interval = setInterval(() => heartbeat.mutate(), 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Parse route params
  useEffect(() => {
    if (params.channelId) {
      setActiveChannelId(Number(params.channelId));
      setActiveConversationId(null);
    } else if (params.conversationId) {
      setActiveConversationId(Number(params.conversationId));
      setActiveChannelId(null);
    }
  }, [params.channelId, params.conversationId]);

  // Cmd+K handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  const handleSelectChannel = useCallback((id: number) => {
    setActiveChannelId(id);
    setActiveConversationId(null);
    setActiveThreadId(null);
    setLocation(`/app/channel/${id}`);
  }, [setLocation]);

  const handleSelectConversation = useCallback((id: number) => {
    setActiveConversationId(id);
    setActiveChannelId(null);
    setActiveThreadId(null);
    setLocation(`/app/dm/${id}`);
  }, [setLocation]);

  const handleOpenThread = useCallback((messageId: number) => {
    setActiveThreadId(messageId);
  }, []);

  const handleCloseThread = useCallback(() => {
    setActiveThreadId(null);
  }, []);

  if (loading || !isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        activeChannelId={activeChannelId}
        activeConversationId={activeConversationId}
        onSelectChannel={handleSelectChannel}
        onSelectConversation={handleSelectConversation}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex">
        <ChatArea
          channelId={activeChannelId}
          conversationId={activeConversationId}
          onOpenThread={handleOpenThread}
          onSelectChannel={handleSelectChannel}
        />

        {/* Thread Panel */}
        {activeThreadId && (
          <ThreadPanel
            messageId={activeThreadId}
            onClose={handleCloseThread}
          />
        )}
      </div>

      {/* Command Palette */}
      <CommandPalette
        open={showCommandPalette}
        onOpenChange={setShowCommandPalette}
        onSelectChannel={handleSelectChannel}
        onSelectConversation={handleSelectConversation}
      />
    </div>
  );
}
