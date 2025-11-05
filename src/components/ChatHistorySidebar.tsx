import { useEffect, useState } from "react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, Trash2, Loader2, Search, X, Edit2, Check } from "lucide-react";
import { supabase } from "@/config/supabase";
import { Chat } from "@/types/database";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ChatHistorySidebarProps {
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onChatDelete: (chatId: string) => void;
}

export default function ChatHistorySidebar({
  currentChatId,
  onChatSelect,
  onNewChat,
  onChatDelete,
}: ChatHistorySidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    loadChats();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('chats-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'chats' },
        () => {
          loadChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadChats = async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setChats(data || []);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setDeletingId(chatId);
    
    try {
      // Delete messages first (due to foreign key constraint)
      await supabase.from('messages').delete().eq('chat_id', chatId);
      
      // Then delete the chat
      const { error } = await supabase.from('chats').delete().eq('id', chatId);
      
      if (error) throw error;
      
      // If deleting current chat, switch to new chat
      if (chatId === currentChatId) {
        onNewChat();
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleStartEdit = (e: React.MouseEvent, chat: Chat) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const handleSaveEdit = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('chats')
        .update({ title: editTitle.trim(), updated_at: new Date().toISOString() })
        .eq('id', chatId);

      if (error) throw error;
      
      setEditingId(null);
      setEditTitle("");
      // Reload chats to show updated title
      loadChats();
    } catch (error) {
      console.error('Error updating chat title:', error);
    }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle("");
  };

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4 space-y-2">
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2"
          variant="default"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 transform -translate-y-1/2 h-6 w-6"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <ScrollArea className="h-[calc(100vh-180px)]">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No chat history</p>
              <p className="text-xs text-muted-foreground mt-2">Start a new chat to begin</p>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No chats found</p>
              <p className="text-xs text-muted-foreground mt-2">Try a different search term</p>
            </div>
          ) : (
            <SidebarMenu>
              {filteredChats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <div className="group relative flex w-full items-center">
                    {editingId === chat.id ? (
                      <div className="flex items-center gap-1 w-full px-3 py-2">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveEdit(e as any, chat.id);
                            } else if (e.key === "Escape") {
                              handleCancelEdit(e as any);
                            }
                          }}
                          className="flex-1 h-8 text-sm"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => handleSaveEdit(e, chat.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => handleCancelEdit(e)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <SidebarMenuButton
                          onClick={() => onChatSelect(chat.id)}
                          className={cn(
                            "w-full justify-start gap-2 px-3 py-2",
                            currentChatId === chat.id && "bg-sidebar-accent text-sidebar-accent-foreground"
                          )}
                        >
                          <MessageSquare className="h-4 w-4 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium">{chat.title}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {format(new Date(chat.updated_at), "MMM d, h:mm a")}
                            </p>
                          </div>
                        </SidebarMenuButton>
                        <div className="absolute right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => handleStartEdit(e, chat)}
                            title="Rename chat"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => handleDelete(e, chat.id)}
                            disabled={deletingId === chat.id}
                            title="Delete chat"
                          >
                            {deletingId === chat.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          )}
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}

