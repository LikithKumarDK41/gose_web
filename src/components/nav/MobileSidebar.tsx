// src/components/nav/MobileSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Home, List, BookmarkCheck, BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/tours", label: "Tour List", icon: List },
  { href: "/mylist", label: "My List", icon: BookmarkCheck },
  { href: "/guide", label: "Guide", icon: BookOpen },
];

export default function MobileSidebar({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 p-0">
        <VisuallyHidden>
          <SheetTitle>Sidebar Navigation</SheetTitle>
        </VisuallyHidden>

        {/* ✅ Top bar with close button */}
        <div className="flex items-center justify-end border-b border-border p-2">
          <SheetClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </Button>
          </SheetClose>
        </div>

        {/* Nav list */}
        <nav className="flex flex-col space-y-2 p-3">
          {nav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <SheetClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm ${active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </SheetClose>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
