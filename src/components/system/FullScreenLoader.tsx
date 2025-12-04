// src/components/system/FullScreenLoader.tsx
"use client";

export function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-background/80 backdrop-blur-sm">
      <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-emerald-500 mx-auto mb-4" />
    </div>
  );
}
