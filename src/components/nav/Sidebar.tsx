// src/components/nav/Sidebar.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight } from "lucide-react";
import NavLink from "@/components/nav/NavLink";
import { NAV_ITEMS, isActivePath, NavItem } from "./routes";
import { useLocale } from "@/providers/LocaleProvider";
import { useAppDispatch } from "@/lib/store/hook";
import { logout } from "@/lib/store/slices/authSlice";

export default function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useLocale();

  const w = collapsed ? "w-16" : "w-64";

  const base = "relative flex items-center rounded-md text-sm transition-colors";
  const expandedPad = "px-3 py-2 gap-2";
  const collapsedPad = "justify-center p-2 w-12 h-10 mx-auto";

  async function handleAction(item: NavItem) {
    if (item.type === "action" && item.action === "logout") {
      await dispatch(logout());
      router.replace("/signin");
    }
  }

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
            aria-label={collapsed ? (t("Expand") || "Expand") : (t("Collapse") || "Collapse")}
            title={collapsed ? (t("Expand") || "Expand") : (t("Collapse") || "Collapse")}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" align="center" className="text-xs">
          {collapsed ? (t("Expand") || "Expand") : (t("Collapse") || "Collapse")}
        </TooltipContent>
      </Tooltip>

      <div className="flex h-full flex-col overflow-y-auto">
        <div className="p-2">
          <nav className="flex flex-col gap-1" aria-label={t("Main navigation") || "Main navigation"}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const translatedLabel =
                typeof item.labelKey === "string" ? (t(item.labelKey) || item.labelKey) : String(item.labelKey);

              // LINK ITEM
              if (item.type === "link") {
                const active = isActivePath(pathname, item);
                const state = active
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground";

                const linkEl = (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    title={collapsed ? translatedLabel : undefined}
                    aria-label={collapsed ? translatedLabel : undefined}
                    className={`${base} ${state} ${collapsed ? collapsedPad : expandedPad}`}
                  >
                    <span
                      className={[
                        "pointer-events-none absolute left-0 top-0 h-full w-1 rounded-r",
                        active ? "bg-gradient-to-b from-indigo-500 via-sky-500 to-emerald-500" : "bg-transparent",
                      ].join(" ")}
                    />
                    <Icon className="h-5 w-5" />
                    {!collapsed && <span>{translatedLabel}</span>}
                  </NavLink>
                );

                return collapsed ? (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                    <TooltipContent side="right" align="center" className="text-xs">
                      {translatedLabel}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  linkEl
                );
              }

              // ACTION ITEM (e.g., Logout)
              const btn = (
                <button
                  key={item.action}
                  type="button"
                  onClick={() => handleAction(item)}
                  title={collapsed ? translatedLabel : undefined}
                  aria-label={collapsed ? translatedLabel : undefined}
                  className={`${base} text-muted-foreground hover:bg-muted hover:text-foreground ${collapsed ? collapsedPad : expandedPad
                    }`}
                >
                  <span className="pointer-events-none absolute left-0 top-0 h-full w-1 rounded-r bg-transparent" />
                  <Icon className="h-5 w-5" />
                  {!collapsed && <span>{translatedLabel}</span>}
                </button>
              );

              return collapsed ? (
                <Tooltip key={item.action}>
                  <TooltipTrigger asChild>{btn}</TooltipTrigger>
                  <TooltipContent side="right" align="center" className="text-xs">
                    {translatedLabel}
                  </TooltipContent>
                </Tooltip>
              ) : (
                btn
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
