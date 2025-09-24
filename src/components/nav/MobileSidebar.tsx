// src/components/nav/MobileSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetClose, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS, isActivePath, NavItem } from "./routes";
import { useLocale } from "@/providers/LocaleProvider";
import { useAppDispatch } from "@/lib/store/hook";
import { logout } from "@/lib/store/slices/authSlice";

export default function MobileSidebar({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useLocale();

  async function handleAction(item: NavItem) {
    if (item.type === "action" && item.action === "logout") {
      await dispatch(logout());
      onOpenChange(false);
      router.replace("/signin");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 p-0">
        <VisuallyHidden>
          <SheetTitle>{t("Sidebar Navigation") || "Sidebar Navigation"}</SheetTitle>
        </VisuallyHidden>

        {/* Top bar with close button */}
        <div className="flex items-center justify-end border-b border-border p-2">
          <SheetClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              aria-label={t("Close sidebar") || "Close sidebar"}
              title={t("Close sidebar") || "Close sidebar"}
            >
              <X className="h-5 w-5" />
            </Button>
          </SheetClose>
        </div>

        {/* Gradient banner */}
        <div className="m-4 overflow-hidden rounded-xl border">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 opacity-90" />
            <div className="relative p-4 text-sm text-white">
              <div className="font-semibold">{t("Tourist") || "Tourist"}</div>
              <div className="opacity-90">
                {t("Navigate your trips with style.") || "Navigate your trips with style."}
              </div>
            </div>
          </div>
        </div>

        {/* Nav list */}
        <nav className="flex flex-col space-y-2 p-3" aria-label={t("Main navigation") || "Main navigation"}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const label =
              typeof item.labelKey === "string" ? (t(item.labelKey) || item.labelKey) : String(item.labelKey);

            // LINK ITEM
            if (item.type === "link") {
              const active = isActivePath(pathname, item);
              return (
                <SheetClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    className={[
                      "group flex h-11 items-center justify-between rounded-md px-3 text-sm transition",
                      active
                        ? "text-white bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500"
                        : "text-foreground hover:bg-muted",
                    ].join(" ")}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      {label}
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-70 group-hover:translate-x-0.5 group-hover:opacity-100 transition" />
                  </Link>
                </SheetClose>
              );
            }

            // ACTION ITEM (e.g., Logout)
            return (
              <button
                key={item.action}
                type="button"
                onClick={() => handleAction(item)}
                className="group flex h-11 items-center justify-between rounded-md px-3 text-sm transition text-foreground hover:bg-muted"
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  {label}
                </span>
                <ChevronRight className="h-4 w-4 opacity-70 group-hover:translate-x-0.5 group-hover:opacity-100 transition" />
              </button>
            );
          })}
        </nav>

        {/* Tiny footer */}
        <div className="px-3 pb-4 pt-2 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} {t("Tourist") || "Tourist"}
        </div>
      </SheetContent>
    </Sheet>
  );
}
