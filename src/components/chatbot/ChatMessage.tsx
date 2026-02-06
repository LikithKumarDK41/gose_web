import React from "react";
import { cn } from "@/lib/utils";
import { ChatOptions } from "./ChatOptions";

interface Option {
  label: string;
  value: string;
  link?: string;
  helptext?: string;
}

interface ChatMessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  options?: Option[];
  onOptionSelect?: (value: string, label: string) => void;
}

export function ChatMessage({ role, content, options, onOptionSelect }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex w-full mb-4 items-end gap-2",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
         <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden border border-border">
            {/* Simple Avatar Placeholder */}
            <img src="/logos/gose_logo.png" alt="Bot" className="w-full h-full object-cover" />
         </div>
      )}
      <div className="flex flex-col max-w-[80%]">
        <div
            className={cn(
            "px-4 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm w-fit",
            isUser
                ? "bg-primary text-primary-foreground rounded-br-none ml-auto" // User bubble (Primary)
                : "bg-muted text-foreground rounded-bl-none border border-border"  // Bot bubble (Muted/Light Gray)
            )}
        >
            <div style={{ whiteSpace: "pre-wrap" }}>{content}</div>
        </div>
        {!isUser && options && options.length > 0 && onOptionSelect && (
            <div className="-ml-2">
                 <ChatOptions options={options} onSelect={onOptionSelect} />
            </div>
        )}
      </div>
      {isUser && (
         <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden border border-border">
            <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=Alex" alt="User" className="w-full h-full" />
         </div>
      )}
    </div>
  );
}
