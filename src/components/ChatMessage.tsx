import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

type MessageProps = {
  message: {
    role: "user" | "assistant";
    content: string;
  };
  isLoading?: boolean;
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

const ChatMessage = ({ message, isLoading = false }: MessageProps) => {
  const isBot = message.role === "assistant";

  return (
    <div className={`flex gap-3 ${isBot ? "justify-start" : "justify-end"}`}>
      {isBot && (
        <div className="shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
      )}
      
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
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
        ) : (
          <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:my-2 prose-strong:font-semibold prose-strong:text-foreground prose-ul:my-2 prose-li:my-0">
            <ReactMarkdown components={markdownComponents}>
              {message.content}
            </ReactMarkdown>
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
