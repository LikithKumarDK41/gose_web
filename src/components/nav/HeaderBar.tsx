"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import ThemeToggle from "@/components/theme/ThemeToggle";
import LanguageToggle from "@/components/theme/LanguageToggle";
import { Menu } from "lucide-react";
import { NAV_ITEMS, isActivePath, currentSectionTitle, NavItem } from "./routes";
import BrandLogo from "@/components/nav/BrandLogo";
import { useLocale } from "@/providers/LocaleProvider";
import { useAppDispatch } from "@/lib/store/hook";
import { logout } from "@/lib/store/slices/authSlice";

import { User } from "lucide-react";
import UserProfileDropdown from "./UserProfileDropdown";
import ProfileModal from "./ProfileModal";
export default function HeaderBar({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const { t } = useLocale();
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [mobileOpen, setMobileOpen] = useState(false);

  const title = useMemo(() => t(currentSectionTitle(pathname)), [pathname, t]);

  async function handleItemClick(item: NavItem) {
    if (item.type === "action" && item.action === "logout") {
      await dispatch(logout());
      router.replace("/signin");
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/70 backdrop-blur">
      <div className="h-[2px] w-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />

      <div className="mx-auto flex h-14 items-center gap-3 px-4">
        {/* Left: logo + mobile toggle */}
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

        {/* Right: nav + toggles */}
<div className="ml-auto flex items-center gap-3">
  {/* Desktop Nav */}
  <div className="hidden lg:block">
    <NavigationMenu>
      <NavigationMenuList className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          if (item.type === "link") {
            const active = isActivePath(pathname, item);
            return (
              <NavigationMenuItem key={item.href}>
                <Link
                  href={item.href}
                  className={[
                    "relative inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-300",
                    active
                      ? "text-white bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  <span>{t(item.labelKey)}</span>
                </Link>
              </NavigationMenuItem>
            );
          }

          // Action items (like Logout)
          return (
            <NavigationMenuItem key={item.action}>
              <button
                type="button"
                onClick={() => handleItemClick(item)}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Icon className="h-4 w-4" />
                <span>{t(item.labelKey)}</span>
              </button>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  </div>

  {/* 🌐 Language & Theme */}
  <LanguageToggle />
  <ThemeToggle />

  <UserProfileDropdown onViewProfile={() => setProfileOpen(true)} />
    <ProfileModal
  open={profileOpen}
  onClose={() => setProfileOpen(false)}
/>
</div>

      </div>
    </header>
  );
}
