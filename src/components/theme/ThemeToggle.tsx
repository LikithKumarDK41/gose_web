// src/components/ThemeToggle.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, Monitor } from "lucide-react";

type Mode = "light" | "dark" | "system";

function applyTheme(next: Mode) {
  const root = document.documentElement;

  // Set attribute for CSS to read
  root.setAttribute("data-theme", next);

  // Manage .dark class for Tailwind utilities
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const isDark = next === "dark" || (next === "system" && mq.matches);
  root.classList.toggle("dark", isDark);

  // Keep OS listener only when system
  const KEY = "__theme_mql_listener__" as const;
  const old = (root as any)[KEY] as ((e: MediaQueryListEvent) => void) | undefined;
  if (old) mq.removeEventListener("change", old);

  if (next === "system") {
    const handler = (e: MediaQueryListEvent) => {
      const nowDark = e.matches;
      root.classList.toggle("dark", nowDark);
    };
    mq.addEventListener("change", handler);
    (root as any)[KEY] = handler;
  } else {
    (root as any)[KEY] = undefined;
  }
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => {
    const stored = (localStorage.getItem("theme-mode") as Mode) || "system";
    setMode(stored);
    applyTheme(stored);
  }, []);

  const onPick = (next: Mode) => {
    setMode(next);
    localStorage.setItem("theme-mode", next);
    applyTheme(next);
  };

  // Only for accessible label
  const label =
    mode === "system" ? "Theme: System" : mode === "dark" ? "Theme: Dark" : "Theme: Light";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label={label} title={label} className="relative cursor-pointer">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onPick("light")} className={`cursor-pointer ${mode === "light" ? "font-semibold" : ""}`}>
          <Sun className="mr-2 h-4 w-4" /> Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onPick("dark")} className={`cursor-pointer ${mode === "dark" ? "font-semibold" : ""}`}>
          <Moon className="mr-2 h-4 w-4" /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onPick("system")}className={`cursor-pointer ${mode === "system" ? "font-semibold" : ""}`}>
          <Monitor className="mr-2 h-4 w-4" /> System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
