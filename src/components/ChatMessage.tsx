import { useState } from "react";
import { Bot, User, Copy, Edit2, Trash2, Check, X, RotateCw, ThumbsUp, ThumbsDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type MessageProps = {
  message: {
    role: "user" | "assistant";
    content: string;
    id?: string; // For database ID
  };
  isLoading?: boolean;
  onEdit?: (content: string) => void;
  onDelete?: () => void;
  onRegenerate?: () => void;
  onFeedback?: (feedback: "positive" | "negative") => void;
  isEditable?: boolean;
  canRegenerate?: boolean;
};

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="ml-4">{children}</li>,
  code: ({ children }) => (
    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="bg-muted p-3 rounded-lg overflow-x-auto my-2">{children}</pre>
  ),
};

const ChatMessage = ({ message, isLoading = false, onEdit, onDelete, onRegenerate, onFeedback, isEditable = false, canRegenerate = false }: MessageProps) => {
  const isBot = message.role === "assistant";
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(null);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Message copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy message",
        variant: "destructive",
      });
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(message.content);
  };

  const handleSaveEdit = () => {
    if (onEdit && editContent.trim()) {
      onEdit(editContent.trim());
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate();
    }
  };

  const handleFeedback = (type: "positive" | "negative") => {
    setFeedback(type);
    if (onFeedback) {
      onFeedback(type);
    }
    toast({
      title: "Thank you!",
      description: "Your feedback helps us improve.",
    });
  };

  return (
    <div className={`flex gap-3 ${isBot ? "justify-start" : "justify-end"} group`}>
      {isBot && (
        <div className="shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
      )}
      
      <div className="relative flex flex-col max-w-[80%]">
        <div
          className={`rounded-2xl px-4 py-3 ${
            isBot
              ? "bg-chat-bot text-foreground shadow-sm"
              : "bg-chat-user text-chat-user-fg"
          }`}
        >
          {isLoading ? (
            <div className="flex gap-1 items-center py-1">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
            </div>
          ) : isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 rounded border bg-background text-foreground resize-none"
                rows={4}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={handleSaveEdit}>
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:my-2 prose-strong:font-semibold prose-strong:text-foreground prose-ul:my-2 prose-li:my-0">
              <ReactMarkdown components={markdownComponents}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        
        {/* Action buttons - visible on hover */}
        {!isLoading && !isEditing && (
          <div className={`flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
            isBot ? "justify-start" : "justify-end"
          }`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleCopy}
              title="Copy message"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
            {isBot && canRegenerate && onRegenerate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleRegenerate}
                title="Regenerate response"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
            )}
            {isBot && onFeedback && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 ${feedback === "positive" ? "text-green-600" : ""}`}
                  onClick={() => handleFeedback("positive")}
                  title="Helpful"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 ${feedback === "negative" ? "text-red-600" : ""}`}
                  onClick={() => handleFeedback("negative")}
                  title="Not helpful"
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            {isEditable && !isBot && onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleEdit}
                title="Edit message"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            )}
            {isEditable && !isBot && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleDelete}
                title="Delete message"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>

      {!isBot && (
        <div className="shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
          <User className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
