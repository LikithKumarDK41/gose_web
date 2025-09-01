// src/components/nav/Sidebar.tsx
"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight } from "lucide-react";
import NavLink from "@/components/nav/NavLink";
import { NAV_ITEMS, isActivePath } from "./routes";

export default function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const w = collapsed ? "w-16" : "w-64";

  return (
    <aside className={`${w} relative h-full shrink-0 border-r border-border bg-card`}>
      {/* Collapse handle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute -right-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full bg-background shadow"
            onClick={onToggle}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" align="center" className="text-xs">
          {collapsed ? "Expand" : "Collapse"}
        </TooltipContent>
      </Tooltip>

      <div className="flex h-full flex-col overflow-y-auto">
        <div className="p-2">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;

              const base = "relative flex items-center rounded-md text-sm transition-colors";
              const expandedPad = "px-3 py-2 gap-2";
              const collapsedPad = "justify-center p-2 w-12 h-10 mx-auto";
              const state = active
                ? "text-foreground bg-muted"
                : "text-muted-foreground hover:bg-muted hover:text-foreground";

              const linkEl = (
                <NavLink
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  className={`${base} ${state} ${collapsed ? collapsedPad : expandedPad}`}
                >
                  {/* colorful rail for active item */}
                  <span
                    className={[
                      "pointer-events-none absolute left-0 top-0 h-full w-1 rounded-r",
                      active
                        ? "bg-gradient-to-b from-indigo-500 via-sky-500 to-emerald-500"
                        : "bg-transparent",
                    ].join(" ")}
                  />
                  <Icon className="h-5 w-5" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              );

              return collapsed ? (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                  <TooltipContent side="right" align="center" className="text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              ) : (
                linkEl
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
