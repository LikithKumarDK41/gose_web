"use client";
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
import { Menu } from "lucide-react";

export default function HeaderBar({
  onOpenSidebar,
}: {
  onOpenSidebar?: () => void;
}) {
  const pathname = usePathname();
  const links = [
    { href: "/", label: "Home" },
    { href: "/tour", label: "Timeline" },
    { href: "/map", label: "Map" },
    { href: "/tracking", label: "Live" },
    { href: "/admin", label: "Admin" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 items-center px-4">
        {/* Left: Logo + mobile menu */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onOpenSidebar}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/" className="font-semibold">
            Tourist
          </Link>
        </div>

        {/* Right: nav + actions */}
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden lg:block">
            <NavigationMenu>
              <NavigationMenuList>
                {links.map((l) => (
                  <NavigationMenuItem key={l.href}>
                    <Link
                      href={l.href}
                      className={`px-3 py-2 text-sm rounded-md ${pathname === l.href
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      {l.label}
                    </Link>
                  </NavigationMenuItem>
                ))}
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
