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

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");

  // Initialize from the layout helper or localStorage; keep in sync across tabs.
  useEffect(() => {
    const w = window as any;
    const initial: Mode =
      w.__theme?.get?.() ??
      ((localStorage.getItem("theme-mode") as Mode) || "system");
    setMode(initial);

    // Keep this tab updated if another tab changes it.
    const onStorage = (e: StorageEvent) => {
      if (e.key === "theme-mode") {
        setMode((e.newValue as Mode) || "system");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const apply = (next: Mode) => {
    setMode(next);
    (window as any).__theme?.set?.(next);
    localStorage.setItem("theme-mode", next);
  };

  // Effective dark? (for the icon only)
  const effectiveDark = useMemo(() => {
    if (mode === "dark") return true;
    if (mode === "light") return false;
    // system
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }, [mode]);

  const label =
    mode === "system"
      ? "Theme: System"
      : mode === "dark"
      ? "Theme: Dark"
      : "Theme: Light";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={label}
          title={label}
          className="relative"
        >
          {/* CSS-only swap avoids hydration mismatches */}
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => apply("light")}
          className={mode === "light" ? "font-semibold" : ""}
        >
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => apply("dark")}
          className={mode === "dark" ? "font-semibold" : ""}
        >
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => apply("system")}
          className={mode === "system" ? "font-semibold" : ""}
        >
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
