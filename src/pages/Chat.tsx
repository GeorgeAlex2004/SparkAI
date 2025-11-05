import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ChatMessage from "@/components/ChatMessage";
import { GEMINI_API_KEY } from "@/config/api";
import { supabase } from "@/config/supabase";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import ChatHistorySidebar from "@/components/ChatHistorySidebar";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive (only if user hasn't scrolled up)
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, autoScroll]);

  // Detect if user manually scrolled up
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isAtBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Load messages when chat changes
  useEffect(() => {
    if (currentChatId) {
      loadChatMessages(currentChatId);
    } else {
      // New chat - show welcome message
      setMessages([
        {
          role: "assistant",
          content: "Hi! I'm Career Spark, your AI career assistant. I can help you draft cover letters, prepare for interviews, update your resume, and more. What can I help you with today?",
        },
      ]);
    }
  }, [currentChatId]);

  const loadChatMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setMessages(
          data.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }))
        );
      } else {
        setMessages([
          {
            role: "assistant",
            content: "Hi! I'm Career Spark, your AI career assistant. I can help you draft cover letters, prepare for interviews, update your resume, and more. What can I help you with today?",
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      toast({
        title: "Error",
        description: "Failed to load chat messages.",
        variant: "destructive",
      });
    }
  };

  const createNewChat = async () => {
    setCurrentChatId(null);
    setMessages([
      {
        role: "assistant",
        content: "Hi! I'm Career Spark, your AI career assistant. I can help you draft cover letters, prepare for interviews, update your resume, and more. What can I help you with today?",
      },
    ]);
    setInput("");
    setAutoScroll(true);
  };

  const handleChatSelect = async (chatId: string) => {
    setCurrentChatId(chatId);
    setAutoScroll(true);
  };

  const handleChatDelete = async (chatId: string) => {
    if (chatId === currentChatId) {
      createNewChat();
    }
  };

  const saveMessage = async (chatId: string, role: "user" | "assistant", content: string) => {
    try {
      const { error } = await supabase.from("messages").insert({
        chat_id: chatId,
        role,
        content,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const createOrUpdateChat = async (title: string): Promise<string> => {
    try {
      if (currentChatId) {
        // Update existing chat title and timestamp
        const { error } = await supabase
          .from("chats")
          .update({ title, updated_at: new Date().toISOString() })
          .eq("id", currentChatId);

        if (error) throw error;
        return currentChatId;
      } else {
        // Create new chat
        const { data, error } = await supabase
          .from("chats")
          .insert({ title })
          .select()
          .single();

        if (error) throw error;
        return data.id;
      }
    } catch (error) {
      console.error("Error creating/updating chat:", error);
      throw error;
    }
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const fetchWithRetry = async (url: string, options: RequestInit, retries = 3): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);

        if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
          if (i < retries - 1) {
            const delay = Math.pow(2, i) * 1000; // Exponential backoff: 1s, 2s, 4s
            await sleep(delay);
            continue;
          }
        }

        return response;
      } catch (error) {
        if (i === retries - 1) {
          throw error;
        }
        if (error instanceof Error && (error.message.includes("Failed to fetch") || error.message.includes("Network"))) {
          const delay = Math.pow(2, i) * 1000;
          await sleep(delay);
          continue;
        }
        throw error;
      }
    }
    throw new Error("Max retries exceeded");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message to UI immediately
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    // Get or create chat ID
    let chatId = currentChatId;
    if (!chatId) {
      try {
        setIsSaving(true);
        // Use first 50 chars of first user message as title
        const title = userMessage.length > 50 ? userMessage.substring(0, 50) + "..." : userMessage;
        chatId = await createOrUpdateChat(title);
        setCurrentChatId(chatId);
      } catch (error) {
        console.error("Error creating chat:", error);
        toast({
          title: "Error",
          description: "Failed to create chat. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        setIsSaving(false);
        return;
      } finally {
        setIsSaving(false);
      }
    }

    // Save user message to database
    saveMessage(chatId, "user", userMessage);

    try {
      if (!GEMINI_API_KEY || !GEMINI_API_KEY.trim()) {
        toast({
          title: "API Key Missing",
          description: "Please set the VITE_GEMINI_API_KEY environment variable.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Format message history for Gemini API
      const contents = [
        ...messages.map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        })),
        {
          role: "user",
          parts: [{ text: userMessage }],
        },
      ];

      // Call Google Gemini API with retry logic
      const response = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: contents,
            systemInstruction: {
              parts: [
                {
                  text: "You are 'Career Spark', a helpful and encouraging AI assistant for job seekers. Your goal is to help users polish their job application materials. You can draft cover letters, critique resume bullet points, and generate practice interview questions. You are friendly, professional, and always provide actionable advice. Do not ask for their resume, just work with the text they provide. Keep your answers concise and focused on the task.",
                },
              ],
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse =
        data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response. Please try again.";

      // Add assistant message to UI
      const finalMessages = [...newMessages, { role: "assistant" as const, content: aiResponse }];
      setMessages(finalMessages);

      // Save assistant message to database
      saveMessage(chatId, "assistant", aiResponse);

      // Update chat title if it's the first message (use first user message)
      if (messages.length === 1) {
        try {
          const title = userMessage.length > 50 ? userMessage.substring(0, 50) + "..." : userMessage;
          await supabase
            .from("chats")
            .update({ title, updated_at: new Date().toISOString() })
            .eq("id", chatId);
        } catch (error) {
          console.error("Error updating chat title:", error);
        }
      }
    } catch (error) {
      console.error("Error calling AI:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      const errorMessages = [...newMessages, { role: "assistant" as const, content: `Sorry, I ran into an error: ${errorMessage}` }];
      setMessages(errorMessages);
      
      // Save error message to database
      if (chatId) {
        saveMessage(chatId, "assistant", `Sorry, I ran into an error: ${errorMessage}`);
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <ChatHistorySidebar
        currentChatId={currentChatId}
        onChatSelect={handleChatSelect}
        onNewChat={createNewChat}
        onChatDelete={handleChatDelete}
      />
      <SidebarInset>
        <div className="flex flex-col h-screen bg-chat-bg">
          {/* Header */}
          <header className="bg-card border-b border-border shadow-sm">
            <div className="px-4 py-4 flex items-center gap-2">
              <SidebarTrigger />
              <div className="flex items-center gap-3">
                <img 
                  src="/Logo.png" 
                  alt="Career Spark Logo" 
                  className="h-16 w-16 object-contain"
                />
                <h1 className="text-2xl font-bold text-foreground">Career Spark</h1>
              </div>
            </div>
          </header>

          {/* Chat Messages - Scrollable */}
          <div className="flex-1 overflow-y-auto" ref={messagesContainerRef}>
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
              {messages.map((message, index) => (
                <ChatMessage key={index} message={message} />
              ))}

              {isLoading && (
                <ChatMessage message={{ role: "assistant", content: "" }} isLoading={true} />
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Bar */}
          <div className="bg-card border-t border-border shadow-lg">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me to draft a cover letter..."
                  disabled={isLoading || isSaving}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim() || isSaving} className="shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Chat;
