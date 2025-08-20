// src/components/system/FullScreenLoader.tsx
"use client";
import { Loader2 } from "lucide-react";

export function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-background/80 backdrop-blur-sm">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}
