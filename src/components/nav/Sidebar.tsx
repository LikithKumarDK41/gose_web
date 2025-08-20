// src/components/nav/Sidebar.tsx
"use client";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Home,
  List,
  BookmarkCheck,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import NavLink from "@/components/nav/NavLink";

const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/tours", label: "Tour List", icon: List },
  { href: "/mylist", label: "My List", icon: BookmarkCheck },
  { href: "/guide", label: "Guide", icon: BookOpen },
];

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
    <aside
      className={`${w} relative h-full shrink-0 border-r border-border bg-card`}
    >
      {/* Collapse handle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute -right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full shadow bg-background"
            onClick={onToggle}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" align="center" className="text-xs">
          {collapsed ? "Expand" : "Collapse"}
        </TooltipContent>
      </Tooltip>

      <div className="flex h-full flex-col overflow-y-auto">
        <div className="p-2">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;

              const base =
                "flex items-center rounded-md text-sm transition-colors";
              const expandedPad = "px-3 py-2 gap-2";
              const collapsedPad = "justify-center p-2 w-12 h-10 mx-auto";
              const state = active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground";

              const linkEl = (
                <NavLink
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  className={`${base} ${state} ${collapsed ? collapsedPad : expandedPad
                    }`}
                >
                  <Icon className="h-6 w-6" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              );

              return collapsed ? (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                  <TooltipContent
                    side="right"
                    align="center"
                    className="text-xs"
                  >
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
