// src/components/nav/HeaderBar.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import ThemeToggle from "@/components/theme/ThemeToggle";
import LanguageToggle from "@/components/theme/LanguageToggle";
import { Menu, ChevronRight } from "lucide-react";
import { NAV_ITEMS, isActivePath, currentSectionTitle } from "./routes";
import BrandLogo from "@/components/nav/BrandLogo";
import { useLocale } from "@/providers/LocaleProvider";

export default function HeaderBar({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const { locale, t } = useLocale(); // get translation function
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const title = useMemo(() => t(currentSectionTitle(pathname)), [pathname, t]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/70 backdrop-blur">
      <div className="h-[2px] w-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />

      <div className="mx-auto flex h-14 items-center gap-3 px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => {
              setMobileOpen(true);
              onOpenSidebar?.();
            }}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <BrandLogo />
        </div>

        <div className="hidden md:flex items-center">
          <span className="rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
            {title}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden lg:block">
            <NavigationMenu>
              <NavigationMenuList>
                {NAV_ITEMS.map((l) => {
                  const active = isActivePath(pathname, l.href);
                  const Icon = l.icon;
                  return (
                    <NavigationMenuItem key={l.href}>
                      <Link
                        href={l.href}
                        className={[
                          "relative group inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                          active
                            ? "text-white"
                            : "text-muted-foreground hover:text-foreground",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "pointer-events-none absolute inset-0 -z-10 rounded-md transition-all duration-300",
                            active
                              ? "opacity-100 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 shadow-sm"
                              : "opacity-0 group-hover:opacity-100 bg-muted",
                          ].join(" ")}
                        />
                        <Icon className="h-4 w-4" />
                        <span>{t(l.labelKey)}</span>
                      </Link>
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
