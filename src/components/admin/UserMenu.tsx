"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const supabase = getSupabaseBrowser();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  async function handleLogout() {
    try {
      const supabase = getSupabaseBrowser();
      await supabase.auth.signOut();
      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }

  function handleAccountClick() {
    router.push("/admin/settings?tab=account");
  }

  if (loading) {
    return (
      <div className="mt-auto p-2">
        <div className="flex items-center gap-2 rounded-md p-2">
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
            <div className="h-2 w-32 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userEmail = user.email || "";
  const emailName = userEmail.split("@")[0];
  const userInitials = emailName ? emailName.slice(0, 1).toUpperCase() : "U";

  return (
    <div className="mt-auto p-2">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              open && "bg-accent text-accent-foreground"
            )}
          >
            <div className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-lg">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={userEmail}
                  className="aspect-square h-full w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-lg bg-muted text-xs font-semibold">
                  {userInitials}
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-0.5 overflow-hidden text-left">
              <div className="truncate text-md font-bold text-foreground leading-none">
                {emailName}
              </div>
              <div className="truncate text-xs font-normal leading-none text-muted-foreground">
                {userEmail}
              </div>
            </div>
            <MoreVertical className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" side="right" sideOffset={8}>
          <DropdownMenuLabel className="font-normal p-0">
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-lg">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={userEmail}
                    className="aspect-square h-full w-full rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-lg bg-muted text-xs font-normal text-muted-foreground">
                    {userInitials}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="text-sm font-bold text-foreground leading-none">{emailName}</div>
                <div className="text-xs font-normal leading-none text-muted-foreground">
                  {userEmail}
                </div>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleAccountClick} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Account</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
