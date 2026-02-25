import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Hash, Lock, MessageSquare, User as UserIcon, Search, FileText } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectChannel: (id: number) => void;
  onSelectConversation: (id: number) => void;
}

export function CommandPalette({ open, onOpenChange, onSelectChannel, onSelectConversation }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const searchQuery = trpc.search.global.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 2 }
  );

  const channelsQuery = trpc.channels.list.useQuery(undefined, { enabled: open });
  const usersQuery = trpc.users.list.useQuery(undefined, { enabled: open });

  const createDM = trpc.conversations.findOrCreate.useMutation({
    onSuccess: (data) => {
      onSelectConversation(data.id);
      onOpenChange(false);
    },
  });

  const handleSelect = useCallback((type: string, id: number) => {
    if (type === "channel") {
      onSelectChannel(id);
    } else if (type === "conversation") {
      onSelectConversation(id);
    } else if (type === "user") {
      createDM.mutate({ userId: id });
      return; // Don't close yet, wait for mutation
    }
    onOpenChange(false);
    setQuery("");
  }, [onSelectChannel, onSelectConversation, onOpenChange, createDM]);

  const isSearching = debouncedQuery.length >= 2;
  const searchResults = searchQuery.data;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search messages, channels, or people..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {searchQuery.isLoading ? "Searching..." : "No results found."}
        </CommandEmpty>

        {/* Search Results */}
        {isSearching && searchResults && (
          <>
            {searchResults.channels.length > 0 && (
              <CommandGroup heading="Channels">
                {searchResults.channels.map((ch: any) => (
                  <CommandItem key={`ch-${ch.id}`} onSelect={() => handleSelect("channel", ch.id)} className="gap-2">
                    {ch.type === "private" ? <Lock className="w-3.5 h-3.5 text-muted-foreground" /> : <Hash className="w-3.5 h-3.5 text-muted-foreground" />}
                    <span>{ch.name}</span>
                    {ch.description && <span className="text-xs text-muted-foreground ml-1">— {ch.description}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {searchResults.users.length > 0 && (
              <CommandGroup heading="People">
                {searchResults.users.map((u: any) => (
                  <CommandItem key={`u-${u.id}`} onSelect={() => handleSelect("user", u.id)} className="gap-2">
                    <Avatar className="w-5 h-5">
                      <AvatarFallback className="text-[9px] bg-secondary">{u.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                    </Avatar>
                    <span>{u.name || "Unknown"}</span>
                    <div className={`w-2 h-2 rounded-full presence-${u.presence}`} />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {searchResults.messages.length > 0 && (
              <CommandGroup heading="Messages">
                {searchResults.messages.map((msg: any) => (
                  <CommandItem
                    key={`msg-${msg.id}`}
                    onSelect={() => {
                      if (msg.channelId) handleSelect("channel", msg.channelId);
                      else if (msg.conversationId) handleSelect("conversation", msg.conversationId);
                    }}
                    className="gap-2"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium">{msg.user?.name || "Unknown"}</span>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(msg.createdAt), "MMM d")}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{msg.content}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}

        {/* Quick Navigation (when not searching) */}
        {!isSearching && (
          <>
            <CommandGroup heading="Channels">
              {(channelsQuery.data ?? []).filter((c: any) => c.isMember).slice(0, 8).map((ch: any) => (
                <CommandItem key={`nav-ch-${ch.id}`} onSelect={() => handleSelect("channel", ch.id)} className="gap-2">
                  {ch.type === "private" ? <Lock className="w-3.5 h-3.5 text-muted-foreground" /> : <Hash className="w-3.5 h-3.5 text-muted-foreground" />}
                  <span>{ch.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="People">
              {(usersQuery.data ?? []).slice(0, 8).map((u: any) => (
                <CommandItem key={`nav-u-${u.id}`} onSelect={() => handleSelect("user", u.id)} className="gap-2">
                  <Avatar className="w-5 h-5">
                    <AvatarFallback className="text-[9px] bg-secondary">{u.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                  </Avatar>
                  <span>{u.name || "Unknown"}</span>
                  <div className={`w-2 h-2 rounded-full presence-${u.presence}`} />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
