import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, FileText, Briefcase, MessageSquare, Sun, Moon, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import ChatMessage from "@/components/ChatMessage";
import { GEMINI_API_KEY } from "@/config/api";
import { supabase } from "@/config/supabase";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import ChatHistorySidebar from "@/components/ChatHistorySidebar";
import TemplatesLibrary from "@/components/TemplatesLibrary";
import JobDescriptionAnalyzer from "@/components/JobDescriptionAnalyzer";
import ATSChecker from "@/components/ATSChecker";

type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
};

const QUICK_ACTIONS = [
  { label: "Draft Cover Letter", prompt: "Help me draft a professional cover letter for a software engineer position." },
  { label: "Critique Resume Bullet", prompt: "Review and improve this resume bullet point: [paste your bullet point here]" },
  { label: "Practice Interview Questions", prompt: "Generate 5 common interview questions for a software engineer role and help me prepare answers." },
  { label: "Salary Negotiation Tips", prompt: "Give me tips on how to negotiate salary for a software engineering position." },
  { label: "LinkedIn Connection Message", prompt: "Help me write a professional LinkedIn connection request message." },
  { label: "Follow-up Email", prompt: "Help me write a follow-up email after a job interview." },
];

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [messageIds, setMessageIds] = useState<Map<number, string>>(new Map());
  const [lastUserMessage, setLastUserMessage] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

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

  // Load drafts from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem("careerSparkDraft");
    if (savedDraft && !currentChatId) {
      setInput(savedDraft);
    }
  }, [currentChatId]);

  // Auto-save draft to localStorage with debounce
  useEffect(() => {
    if (!currentChatId && input) {
      const timer = setTimeout(() => {
        localStorage.setItem("careerSparkDraft", input);
      }, 500); // Debounce 500ms
      return () => clearTimeout(timer);
    } else if (!input) {
      localStorage.removeItem("careerSparkDraft");
    }
  }, [input, currentChatId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus input
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      
      // Esc to clear input
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        setInput("");
        localStorage.removeItem("careerSparkDraft");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Load messages when chat changes
  useEffect(() => {
    if (currentChatId) {
      loadChatMessages(currentChatId);
      // Clear draft when loading a chat
      setInput("");
      localStorage.removeItem("careerSparkDraft");
    } else {
      // New chat - show welcome message
      setMessages([
        {
          role: "assistant",
          content: "Hi! I'm Career Spark, your AI career assistant. I can help you draft cover letters, prepare for interviews, update your resume, and more. What can I help you with today?",
        },
      ]);
      setMessageIds(new Map());
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
        const loadedMessages = data.map((msg) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));
        setMessages(loadedMessages);
        
        // Store message IDs for editing/deletion
        const idsMap = new Map<number, string>();
        loadedMessages.forEach((msg, index) => {
          if (msg.id) idsMap.set(index, msg.id);
        });
        setMessageIds(idsMap);
      } else {
        setMessages([
          {
            role: "assistant",
            content: "Hi! I'm Career Spark, your AI career assistant. I can help you draft cover letters, prepare for interviews, update your resume, and more. What can I help you with today?",
          },
        ]);
        setMessageIds(new Map());
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
    setMessageIds(new Map());
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

  const saveMessage = async (chatId: string, role: "user" | "assistant", content: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          chat_id: chatId,
          role,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error("Error saving message:", error);
      return null;
    }
  };

  const updateMessage = async (messageId: string, content: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ content })
        .eq("id", messageId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating message:", error);
      throw error;
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase.from("messages").delete().eq("id", messageId);
      if (error) throw error;
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  };

  const handleEditMessage = async (index: number, newContent: string) => {
    const messageId = messageIds.get(index);
    if (!messageId) {
      // Update local state only if no ID (message not saved yet)
      const updatedMessages = [...messages];
      updatedMessages[index] = { ...updatedMessages[index], content: newContent };
      setMessages(updatedMessages);
      return;
    }

    try {
      await updateMessage(messageId, newContent);
      const updatedMessages = [...messages];
      updatedMessages[index] = { ...updatedMessages[index], content: newContent };
      setMessages(updatedMessages);
      toast({
        title: "Success",
        description: "Message updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update message",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMessage = async (index: number) => {
    const messageId = messageIds.get(index);
    
    if (!messageId) {
      // Just remove from local state if no ID
      const updatedMessages = messages.filter((_, i) => i !== index);
      setMessages(updatedMessages);
      return;
    }

    try {
      await deleteMessage(messageId);
      const updatedMessages = messages.filter((_, i) => i !== index);
      setMessages(updatedMessages);
      
      // Update message IDs map
      const newIdsMap = new Map<number, string>();
      updatedMessages.forEach((msg, i) => {
        if (msg.id) newIdsMap.set(i, msg.id);
      });
      setMessageIds(newIdsMap);
      
      toast({
        title: "Success",
        description: "Message deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  const exportChat = () => {
    if (messages.length === 0) {
      toast({
        title: "No messages",
        description: "There are no messages to export",
        variant: "destructive",
      });
      return;
    }

    const chatText = messages
      .map((msg) => {
        const role = msg.role === "user" ? "You" : "Career Spark";
        return `${role}:\n${msg.content}\n\n`;
      })
      .join("---\n\n");

    const blob = new Blob([chatText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `career-spark-chat-${currentChatId || "new"}-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exported!",
      description: "Chat exported successfully",
    });
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
    setLastUserMessage(userMessage);
    localStorage.removeItem("careerSparkDraft");

    // Add user message to UI immediately
    const userMessageIndex = messages.length;
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
    const userMessageId = await saveMessage(chatId, "user", userMessage);
    if (userMessageId) {
      setMessageIds((prev) => new Map(prev).set(userMessageIndex, userMessageId));
    }

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
      const assistantMessageIndex = newMessages.length;
      const finalMessages = [...newMessages, { role: "assistant" as const, content: aiResponse }];
      setMessages(finalMessages);

      // Save assistant message to database
      const assistantMessageId = await saveMessage(chatId, "assistant", aiResponse);
      if (assistantMessageId) {
        setMessageIds((prev) => new Map(prev).set(assistantMessageIndex, assistantMessageId));
      }

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
        const errorMessageId = await saveMessage(chatId, "assistant", `Sorry, I ran into an error: ${errorMessage}`);
        if (errorMessageId) {
          setMessageIds((prev) => new Map(prev).set(errorMessages.length - 1, errorMessageId));
        }
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

  const handleRegenerate = async (messageIndex: number) => {
    if (isLoading) return;

    setIsLoading(true);
    
    // Find the last user message before this assistant message
    let lastUserMsgIndex = -1;
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        lastUserMsgIndex = i;
        break;
      }
    }

    if (lastUserMsgIndex === -1) {
      setIsLoading(false);
      return;
    }

    // Remove all messages after the last user message (including the assistant message we're regenerating)
    const messagesBeforeLast = messages.slice(0, lastUserMsgIndex + 1);
    setMessages(messagesBeforeLast);

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

      // Format message history up to the user message (excluding the assistant message we're regenerating)
      const contents = messagesBeforeLast.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

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

      // Add new assistant message
      const assistantMessageIndex = messagesBeforeLast.length;
      const finalMessages = [...messagesBeforeLast, { role: "assistant" as const, content: aiResponse }];
      setMessages(finalMessages);

      // Save new assistant message to database
      if (currentChatId) {
        const assistantMessageId = await saveMessage(currentChatId, "assistant", aiResponse);
        if (assistantMessageId) {
          setMessageIds((prev) => {
            const newMap = new Map(prev);
            // Remove old assistant message ID if exists
            newMap.delete(messageIndex);
            // Add new assistant message ID
            newMap.set(assistantMessageIndex, assistantMessageId);
            return newMap;
          });
        }
      }
    } catch (error) {
      console.error("Error regenerating response:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, feedback: "positive" | "negative") => {
    try {
      // Store feedback in localStorage (or Supabase if you add a feedback table)
      const feedbackKey = `feedback_${messageId}`;
      localStorage.setItem(feedbackKey, feedback);
      
      // You could also save to Supabase if you create a feedback table
      // await supabase.from('message_feedback').insert({
      //   message_id: messageId,
      //   feedback: feedback
      // });
    } catch (error) {
      console.error("Error saving feedback:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Ctrl/Cmd + Enter to send (but not if Shift is pressed, which allows new line)
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        handleSubmit(e as any);
      }
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
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
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
              <div className="flex items-center gap-2">
                <TemplatesLibrary onSelectTemplate={(content) => setInput(content)} />
                <JobDescriptionAnalyzer
                  onAnalyzeComplete={(analysis) => {
                    // Optionally add analysis to chat or show in a message
                    const analysisMessage = `Here's the job description analysis:\n\n${analysis}`;
                    setInput(`Please help me understand this job description analysis and provide recommendations:\n\n${analysisMessage}`);
                  }}
                />
                <ATSChecker
                  onCheckComplete={(analysis) => {
                    // Optionally add analysis to chat
                    const analysisMessage = `Here's my ATS compatibility analysis:\n\n${analysis}`;
                    setInput(`Please help me improve my resume based on this ATS analysis:\n\n${analysisMessage}`);
                  }}
                />
                {messages.length > 0 && (
                  <Button variant="outline" size="sm" onClick={exportChat}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  title="Toggle theme"
                >
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </header>

          {/* Chat Messages - Scrollable */}
          <div className="flex-1 overflow-y-auto" ref={messagesContainerRef}>
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id || index}
                  message={message}
                  isEditable={message.role === "user"}
                  canRegenerate={message.role === "assistant" && index === messages.length - 1 && !isLoading}
                  onEdit={(content) => handleEditMessage(index, content)}
                  onDelete={() => handleDeleteMessage(index)}
                  onRegenerate={() => handleRegenerate(index)}
                  onFeedback={(feedback) => message.id && handleFeedback(message.id, feedback)}
                />
              ))}

              {isLoading && (
                <ChatMessage message={{ role: "assistant", content: "" }} isLoading={true} />
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="bg-card border-t border-border px-4 py-3">
              <div className="max-w-4xl mx-auto">
                <p className="text-sm text-muted-foreground mb-2">Quick actions:</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_ACTIONS.map((action, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction(action.prompt)}
                      className="text-xs"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Input Bar */}
          <div className="bg-card border-t border-border shadow-lg">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me to draft a cover letter... (Ctrl/Cmd+K to focus, Ctrl/Cmd+Enter to send)"
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
