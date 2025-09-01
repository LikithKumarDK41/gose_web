// src/components/nav/routes.ts
import type { ComponentType, SVGProps } from "react";
import { Home, List, BookmarkCheck, BookOpen } from "lucide-react";

export type NavItem = {
    href: string;
    label: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const NAV_ITEMS: NavItem[] = [
    { href: "/", label: "Home", icon: Home },
    { href: "/tours", label: "Tour List", icon: List },
    { href: "/mylist", label: "My List", icon: BookmarkCheck },
    { href: "/guide", label: "Guide", icon: BookOpen },
];

/** best-effort active matcher: exact or prefix match for section roots */
export function isActivePath(pathname: string, href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
}

/** find a human title for the current route based on sidebar items */
export function currentSectionTitle(pathname: string) {
    const found = NAV_ITEMS.find((n) => isActivePath(pathname, n.href));
    return found?.label ?? "Tourist";
}
