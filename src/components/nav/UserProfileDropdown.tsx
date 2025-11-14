"use client";

import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";
import { logout } from "@/lib/store/slices/authSlice";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/providers/LocaleProvider";
import { User } from "lucide-react";

export default function UserProfileDropdown({
  onViewProfile,
}: {
  onViewProfile: () => void;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
    const { t } = useLocale(); // ⭐ Translation hook

  const auth = useAppSelector((state) => state.auth);
  const user = auth?.data?.user || null;

  console.log("🔥 FINAL Dropdown User =", user);

  const userName = user?.name || "Guest User";
  const userEmail = user?.email || "No email available";

  const avatar =
    user?.image?.secure_url ||
    user?.image?.url ||
    null;

  async function handleLogout() {
    await dispatch(logout());
    router.replace("/signin");
  }

return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
          {avatar ? (
            <img
              src={avatar}
              alt={userName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <User className="h-5 w-5" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex items-center gap-3">
            {avatar ? (
              <img
                src={avatar}
                alt={userName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <User className="w-10 h-10" />
            )}

            <div>
              <p className="font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* View Profile */}
        <DropdownMenuItem onClick={onViewProfile}>
          {t("profile.viewProfile")}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem onClick={handleLogout} className="text-red-500">
          {t("profile.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
