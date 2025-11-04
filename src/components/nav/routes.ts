import type { ComponentType, SVGProps } from "react";
import { Home, List, BookmarkCheck, LogOut } from "lucide-react";

/** Discriminated union: link items vs. action items */
export type NavLinkItem = {
  type: "link";
  href: string;
  labelKey: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export type NavActionItem = {
  type: "action";
  action: "logout";
  labelKey: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export type NavItem = NavLinkItem | NavActionItem;

export const NAV_ITEMS: NavItem[] = [
  // { type: "link", href: "/", labelKey: "nav.home", icon: Home },
  { type: "link", href: "/tours", labelKey: "nav.tours", icon: List },
  { type: "link", href: "/mylist", labelKey: "nav.myList", icon: BookmarkCheck },
  { type: "action", action: "logout", labelKey: "nav.logout", icon: LogOut },
];

/** active matcher only for links */
export function isActivePath(pathname: string, item: NavItem) {
  if (item.type !== "link") return false;
  if (item.href === "/") return pathname === "/";
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

/** title for current route */
export function currentSectionTitle(pathname: string) {
  const found = NAV_ITEMS.find(
    (n) => n.type === "link" && isActivePath(pathname, n)
  ) as NavLinkItem | undefined;
  return found?.labelKey ?? "Tourist";
}
