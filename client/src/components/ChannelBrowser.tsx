import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Hash, Lock, Users, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface ChannelBrowserProps {
  onSelectChannel: (id: number) => void;
}

export function ChannelBrowser({ onSelectChannel }: ChannelBrowserProps) {
  const channelsQuery = trpc.channels.list.useQuery();
  const joinChannel = trpc.channels.join.useMutation({
    onSuccess: () => {
      channelsQuery.refetch();
      toast.success("Joined channel!");
    },
  });

  const channels = channelsQuery.data ?? [];

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="h-14 px-5 flex items-center border-b border-border/50 shrink-0">
        <span className="font-semibold text-sm">Browse Channels</span>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {channelsQuery.isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Hash className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium mb-1">No channels yet</p>
            <p className="text-xs text-muted-foreground">Create a channel to get started!</p>
          </div>
        ) : (
          <div className="space-y-2 max-w-xl mx-auto">
            <p className="text-sm text-muted-foreground mb-4">Select a channel from the sidebar or browse available channels below.</p>
            {channels.map(ch => (
              <div
                key={ch.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer group"
                onClick={() => {
                  if (ch.isMember) {
                    onSelectChannel(ch.id);
                  } else {
                    joinChannel.mutate({ channelId: ch.id }, { onSuccess: () => onSelectChannel(ch.id) });
                  }
                }}
              >
                {ch.type === "private" ? <Lock className="w-4 h-4 text-muted-foreground shrink-0" /> : <Hash className="w-4 h-4 text-muted-foreground shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{ch.name}</p>
                  {ch.description && <p className="text-xs text-muted-foreground truncate">{ch.description}</p>}
                </div>
                {ch.isMember ? (
                  <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-secondary/50">Joined</span>
                ) : (
                  <Button size="sm" variant="ghost" className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    Join <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
