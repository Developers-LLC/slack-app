import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Hash, Lock, Plus, Search, MessageSquare, ChevronDown, ChevronRight,
  LogOut, Sparkles, User as UserIcon
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

interface SidebarProps {
  activeChannelId: number | null;
  activeConversationId: number | null;
  onSelectChannel: (id: number) => void;
  onSelectConversation: (id: number) => void;
  onOpenCommandPalette: () => void;
}

export function Sidebar({ activeChannelId, activeConversationId, onSelectChannel, onSelectConversation, onOpenCommandPalette }: SidebarProps) {
  const { user, logout } = useAuth();
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [dmsOpen, setDmsOpen] = useState(true);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showNewDM, setShowNewDM] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [newChannelType, setNewChannelType] = useState<"public" | "private">("public");

  const channelsQuery = trpc.channels.list.useQuery();
  const conversationsQuery = trpc.conversations.list.useQuery();
  const unreadQuery = trpc.channels.unreadCounts.useQuery(undefined, { refetchInterval: 5000 });
  const usersQuery = trpc.users.list.useQuery();
  const createChannel = trpc.channels.create.useMutation({
    onSuccess: (data) => {
      channelsQuery.refetch();
      setShowCreateChannel(false);
      setNewChannelName("");
      setNewChannelDesc("");
      onSelectChannel(data.id);
      toast.success("Channel created!");
    },
  });
  const joinChannel = trpc.channels.join.useMutation({
    onSuccess: () => channelsQuery.refetch(),
  });
  const createDM = trpc.conversations.findOrCreate.useMutation({
    onSuccess: (data) => {
      conversationsQuery.refetch();
      setShowNewDM(false);
      onSelectConversation(data.id);
    },
  });

  const myChannels = channelsQuery.data?.filter(c => c.isMember) ?? [];
  const unreadCounts = (unreadQuery.data ?? {}) as Record<number, number>;

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <>
      <div className="glass-sidebar w-64 flex flex-col h-full shrink-0">
        {/* Workspace Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Hash className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">Slack</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => { logout(); window.location.href = "/"; }}>
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Search Button */}
        <div className="px-3 py-2 shrink-0">
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/50 text-muted-foreground text-sm hover:bg-secondary transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="flex-1 text-left">Search</span>
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-background/50 font-mono">⌘K</kbd>
          </button>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-2 py-1">
            {/* Channels Section */}
            <div className="mb-1">
              <button
                onClick={() => setChannelsOpen(!channelsOpen)}
                className="w-full flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {channelsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                Channels
              </button>
              {channelsOpen && (
                <div className="mt-0.5 space-y-px">
                  {myChannels.map(ch => {
                    const isActive = activeChannelId === ch.id;
                    const unread = unreadCounts[ch.id] ?? 0;
                    return (
                      <button
                        key={ch.id}
                        onClick={() => onSelectChannel(ch.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1 rounded-md text-sm transition-colors ${
                          isActive ? "bg-primary/15 text-foreground" : unread > 0 ? "text-foreground font-medium hover:bg-secondary/50" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                        }`}
                      >
                        {ch.type === "private" ? <Lock className="w-3.5 h-3.5 shrink-0 opacity-60" /> : <Hash className="w-3.5 h-3.5 shrink-0 opacity-60" />}
                        <span className="truncate flex-1 text-left">{ch.name}</span>
                        {unread > 0 && (
                          <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                            {unread > 9 ? "9+" : unread}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setShowCreateChannel(true)}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add channel</span>
                  </button>
                </div>
              )}
            </div>

            {/* DMs Section */}
            <div className="mb-1 mt-2">
              <button
                onClick={() => setDmsOpen(!dmsOpen)}
                className="w-full flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {dmsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                Direct Messages
              </button>
              {dmsOpen && (
                <div className="mt-0.5 space-y-px">
                  {(conversationsQuery.data ?? []).map(conv => {
                    const isActive = activeConversationId === conv.id;
                    const otherUser = (conv.participants as any)?.[0];
                    const displayName = otherUser?.name || "Unknown";
                    const presence = otherUser?.presence || "offline";
                    return (
                      <button
                        key={conv.id}
                        onClick={() => onSelectConversation(conv.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1 rounded-md text-sm transition-colors ${
                          isActive ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                        }`}
                      >
                        <div className="relative shrink-0">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="text-[9px] bg-secondary">{getInitials(displayName)}</AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full presence-${presence}`} />
                        </div>
                        <span className="truncate flex-1 text-left">{displayName}</span>
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setShowNewDM(true)}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New message</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* User Footer */}
        <div className="h-12 px-3 flex items-center gap-2 border-t border-border/50 shrink-0">
          <div className="relative">
            <Avatar className="w-7 h-7">
              <AvatarFallback className="text-[10px] bg-primary/20 text-primary">{getInitials(user?.name ?? null)}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full presence-online" />
          </div>
          <span className="text-xs font-medium truncate flex-1">{user?.name || "User"}</span>
        </div>
      </div>

      {/* Create Channel Dialog */}
      <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Create a channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Channel name</label>
              <Input
                placeholder="e.g. project-alpha"
                value={newChannelName}
                onChange={e => setNewChannelName(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "-"))}
                className="bg-secondary/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description (optional)</label>
              <Textarea
                placeholder="What's this channel about?"
                value={newChannelDesc}
                onChange={e => setNewChannelDesc(e.target.value)}
                className="bg-secondary/50 resize-none"
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Visibility</label>
              <Select value={newChannelType} onValueChange={(v: "public" | "private") => setNewChannelType(v)}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public"><span className="flex items-center gap-2"><Hash className="w-3.5 h-3.5" /> Public</span></SelectItem>
                  <SelectItem value="private"><span className="flex items-center gap-2"><Lock className="w-3.5 h-3.5" /> Private</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateChannel(false)}>Cancel</Button>
            <Button onClick={() => createChannel.mutate({ name: newChannelName, description: newChannelDesc, type: newChannelType })} disabled={!newChannelName || createChannel.isPending}>
              {createChannel.isPending ? "Creating..." : "Create Channel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New DM Dialog */}
      <Dialog open={showNewDM} onOpenChange={setShowNewDM}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>New Direct Message</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2 max-h-64 overflow-y-auto">
            {(usersQuery.data ?? []).filter(u => u.id !== user?.id).map(u => (
              <button
                key={u.id}
                onClick={() => createDM.mutate({ userId: u.id })}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary/50 transition-colors"
              >
                <div className="relative">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs bg-secondary">{getInitials(u.name)}</AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full presence-${u.presence}`} />
                </div>
                <span className="text-sm font-medium">{u.name || "Unknown"}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
