"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AdminTable,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/admin/AdminTable";
import { TableTitleCell } from "@/components/admin/TableTitleCell";
import { CoverImageCell } from "@/components/admin/CoverImageCell";
import { ActionMenu } from "@/components/admin/ActionMenu";
import { AdminPageTitle } from "@/components/admin/AdminPageTitle";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

type Platform = {
  id: string;
  name: string;
  slug: string;
  base_url: string | null;
  icon_url: string | null;
  icon_horizontal_url: string | null;
  default_cta_label: string | null;
};

type PlatformsListProps = {
  initialPlatforms: Platform[];
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function PlatformsList({ initialPlatforms }: PlatformsListProps) {
  const [platforms, setPlatforms] = useState<Platform[]>(initialPlatforms);
  const [searchQuery, setSearchQuery] = useState("");

  const handleDelete = async (id: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await fetch(`/api/admin/platforms?id=${id}`, {
        method: "DELETE",
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete platform");
      }

      toast.success("Platform deleted successfully");
      setPlatforms(platforms.filter((p) => p.id !== id));
    } catch (error: any) {
      console.error("Error deleting platform:", error);
      toast.error(error.message || "Failed to delete platform");
      throw error;
    }
  };

  const filteredPlatforms = platforms.filter((platform) => {
    const query = searchQuery.toLowerCase();
    return platform.name.toLowerCase().includes(query);
  });

  return (
    <div className="w-full">
      <div className="mb-6 md:mb-8 relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />
        <AdminPageTitle
          title="Platforms"
          description="Manage music streaming platforms and distribution channels where your music is available."
        />
      </div>
      <div className="space-y-3 md:space-y-4">
        <AdminToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search platforms..."
        >
          <Button
            asChild
            variant="ghost"
            className="rounded-full w-10 h-10 p-0 bg-transparent text-muted-foreground hover:text-primary hover:bg-transparent border-0 shadow-none transition-colors"
            title="New Platform"
          >
            <Link href="/admin/platforms/new/edit">
              <FontAwesomeIcon icon={faPlus} className="h-5 w-5" />
            </Link>
          </Button>
        </AdminToolbar>

        <AdminTable>
          <TableHeader className="hidden md:table-header-group">
            <TableRow>
              <TableHead className="pl-4 w-24">Cover</TableHead>
              <TableHead className="w-64">Name</TableHead>
              <TableHead className="w-80">Display Icon</TableHead>
              <TableHead>Default CTA Label</TableHead>
              <TableHead className="text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlatforms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {searchQuery ? "No platforms found matching your search" : "No platforms found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredPlatforms.map((platform) => {
                const platformSlug = platform.slug || generateSlug(platform.name);
                return (
                  <>
                    {/* Mobile Layout */}
                    <TableRow
                      key={`${platform.id}-mobile`}
                      className="md:hidden group cursor-pointer hover:bg-muted/50 border-b border-border/50"
                      onMouseDown={(e) => {
                        if (e.button === 1) {
                          e.preventDefault();
                          window.open(`/admin/platforms/${platformSlug}/edit`, "_blank");
                        }
                      }}
                    >
                      <Link
                        href={`/admin/platforms/${platformSlug}/edit`}
                        className="contents"
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest("[data-action-menu]")) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <TableCell className="px-3 md:pl-4 md:pr-4 py-4" colSpan={5}>
                          <div className="flex items-start gap-3 md:gap-4">
                            <div className="h-12 w-12 rounded-full overflow-hidden flex items-center justify-center bg-muted shadow-md flex-shrink-0">
                              {platform.icon_url ? (
                                <img
                                  src={platform.icon_url}
                                  alt={platform.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-semibold text-muted-foreground">
                                  {platform.name
                                    .split(/\s+/)
                                    .map((w) => w[0])
                                    .join("")
                                    .substring(0, 2)
                                    .toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-base mb-1.5 break-words">
                                {platform.name}
                              </div>
                              <div className="text-sm text-muted-foreground space-y-0.5">
                                {platform.default_cta_label && (
                                  <div className="truncate">CTA: {platform.default_cta_label}</div>
                                )}
                                {platform.base_url && (
                                  <div className="truncate text-xs">{platform.base_url}</div>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0 ml-2" data-action-menu>
                              <ActionMenu
                                itemId={platform.id}
                                editHref={`/admin/platforms/${platformSlug}/edit`}
                                onDelete={handleDelete}
                                deleteLabel={`platform "${platform.name}"`}
                              />
                            </div>
                          </div>
                        </TableCell>
                      </Link>
                    </TableRow>

                    {/* Desktop Layout */}
                    <TableRow
                      key={`${platform.id}-desktop`}
                      className="hidden md:table-row group cursor-pointer hover:bg-muted/50"
                      onMouseDown={(e) => {
                        if (e.button === 1) {
                          e.preventDefault();
                          window.open(`/admin/platforms/${platformSlug}/edit`, "_blank");
                        }
                      }}
                    >
                      <Link
                        href={`/admin/platforms/${platformSlug}/edit`}
                        className="contents"
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest("[data-action-menu]")) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <CoverImageCell
                          imageUrl={platform.icon_url}
                          title={platform.name}
                          showInitials={true}
                          className="pl-4"
                        />
                        <TableTitleCell
                          title={platform.name}
                          imageUrl={undefined}
                          showInitials={false}
                          className="w-64"
                        />
                        <CoverImageCell
                          imageUrl={platform.icon_horizontal_url}
                          title={platform.name}
                          showInitials={true}
                          horizontal={true}
                        />
                        <TableCell>{platform.default_cta_label || "-"}</TableCell>
                        <TableCell className="text-right pr-4" data-action-menu>
                          <ActionMenu
                            itemId={platform.id}
                            editHref={`/admin/platforms/${platformSlug}/edit`}
                            onDelete={handleDelete}
                            deleteLabel={`platform "${platform.name}"`}
                          />
                        </TableCell>
                      </Link>
                    </TableRow>
                  </>
                );
              })
            )}
          </TableBody>
        </AdminTable>
      </div>
    </div>
  );
}
