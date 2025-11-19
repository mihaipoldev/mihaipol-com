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

export function UserMenu({ isMobile = false }: { isMobile?: boolean }) {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <div className={cn("mt-auto", isMobile ? "p-3" : "p-2")}>
        <div className={cn("flex items-center rounded-md", isMobile ? "gap-3 p-3" : "gap-2 p-2")}>
          <div
            className={cn(
              "rounded-full bg-muted animate-pulse",
              isMobile ? "h-12 w-12" : "h-8 w-8"
            )}
          />
          <div className="flex-1 space-y-1">
            <div
              className={cn("bg-muted rounded animate-pulse", isMobile ? "h-4 w-24" : "h-3 w-20")}
            />
            <div
              className={cn("bg-muted rounded animate-pulse", isMobile ? "h-3 w-36" : "h-2 w-32")}
            />
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

  // Render a non-dropdown version during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className={cn("mt-auto", isMobile ? "p-3" : "p-2")}>
        <button
          className={cn(
            "flex w-full items-center rounded-md text-left outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            isMobile ? "gap-3 px-3 py-2.5 text-base" : "gap-2 px-2 py-1.5 text-sm"
          )}
        >
          <div
            className={cn(
              "relative flex shrink-0 overflow-hidden rounded-lg",
              isMobile ? "h-12 w-12" : "h-8 w-8"
            )}
          >
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt={userEmail}
                className="aspect-square h-full w-full rounded-lg object-cover"
              />
            ) : (
              <div
                className={cn(
                  "flex h-full w-full items-center justify-center rounded-lg bg-muted font-semibold",
                  isMobile ? "text-base" : "text-xs"
                )}
              >
                {userInitials}
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-0 overflow-hidden text-left">
            <div
              className={cn(
                "truncate font-bold text-foreground leading-none",
                isMobile ? "text-base" : "text-md"
              )}
            >
              {emailName}
            </div>
            <div
              className={cn(
                "truncate font-normal leading-none text-muted-foreground",
                isMobile ? "text-sm" : "text-xs"
              )}
            >
              {userEmail}
            </div>
          </div>
          <MoreVertical
            className={cn(
              "ml-auto shrink-0 text-muted-foreground",
              isMobile ? "h-5 w-5" : "h-4 w-4"
            )}
          />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("mt-auto", isMobile ? "p-3" : "p-2")}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "flex w-full items-center rounded-md text-left outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              isMobile ? "gap-3 px-3 py-2.5 text-base" : "gap-2 px-2 py-1.5 text-sm",
              open && "bg-accent text-accent-foreground"
            )}
          >
            <div
              className={cn(
                "relative flex shrink-0 overflow-hidden rounded-lg",
                isMobile ? "h-12 w-12" : "h-8 w-8"
              )}
            >
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={userEmail}
                  className="aspect-square h-full w-full rounded-lg object-cover"
                />
              ) : (
                <div
                  className={cn(
                    "flex h-full w-full items-center justify-center rounded-lg bg-muted font-semibold",
                    isMobile ? "text-base" : "text-xs"
                  )}
                >
                  {userInitials}
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-0.5 overflow-hidden text-left">
              <div
                className={cn(
                  "truncate font-bold text-foreground leading-none",
                  isMobile ? "text-base" : "text-md"
                )}
              >
                {emailName}
              </div>
              <div
                className={cn(
                  "truncate font-normal leading-none text-muted-foreground",
                  isMobile ? "text-sm" : "text-xs"
                )}
              >
                {userEmail}
              </div>
            </div>
            <MoreVertical
              className={cn(
                "ml-auto shrink-0 text-muted-foreground",
                isMobile ? "h-5 w-5" : "h-4 w-4"
              )}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className={cn("w-56", isMobile && "w-[248px]")}
          align={isMobile ? "start" : "end"}
          side={isMobile ? "top" : "right"}
          sideOffset={8}
        >
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
              <div className="flex flex-col gap-0">
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
