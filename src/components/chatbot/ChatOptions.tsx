import React from "react";
import { cn } from "@/lib/utils";

interface ChatOption {
  label: string;
  value: string;
  helptext?: string;
}

interface ChatOptionsProps {
  options: ChatOption[];
  onSelect: (value: string, label: string) => void;
}

export function ChatOptions({ options, onSelect }: ChatOptionsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 w-full">
      {options.map((option, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(option.value, option.label)}
          title={option.helptext} // Show helptext on hover
          className={cn(
            "p-3 text-sm font-semibold rounded-lg shadow-sm border transition-all text-left",
            "bg-background text-foreground hover:bg-muted", // Theme aware
            "border-border"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
