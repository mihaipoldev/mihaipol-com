"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
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
import { StateBadge } from "@/components/admin/StateBadge";
import { AdminPageTitle } from "@/components/admin/AdminPageTitle";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

type Update = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  date: string | null;
  publish_status: "draft" | "scheduled" | "published" | "archived";
  image_url: string | null;
};

type UpdatesListProps = {
  initialUpdates: Update[];
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function UpdatesList({ initialUpdates }: UpdatesListProps) {
  const [updates, setUpdates] = useState<Update[]>(
    Array.isArray(initialUpdates) ? initialUpdates : []
  );
  const [searchQuery, setSearchQuery] = useState("");

  const handleDelete = async (id: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await fetch(`/api/admin/updates?id=${id}`, {
        method: "DELETE",
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete update");
      }

      toast.success("Update deleted successfully");
      setUpdates(updates.filter((u) => u.id !== id));
    } catch (error: any) {
      console.error("Error deleting update:", error);
      toast.error(error.message || "Failed to delete update");
      throw error;
    }
  };

  const filteredUpdates = updates.filter((update) => {
    const query = searchQuery.toLowerCase();
    return (
      update.title.toLowerCase().includes(query) || update.subtitle?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-full">
      <div className="mb-6 md:mb-8 relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />
        <AdminPageTitle
          title="Updates"
          description="Create and manage news updates, announcements, and blog posts for your audience."
        />
      </div>
      <div className="space-y-3 md:space-y-4">
        <AdminToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search updates..."
        >
          <Button
            asChild
            variant="ghost"
            className="rounded-full w-10 h-10 p-0 bg-transparent text-muted-foreground hover:text-primary hover:bg-transparent border-0 shadow-none transition-colors"
            title="New Update"
          >
            <Link href="/admin/updates/new/edit">
              <FontAwesomeIcon icon={faPlus} className="h-5 w-5" />
            </Link>
          </Button>
        </AdminToolbar>

        <AdminTable>
          <TableHeader className="hidden md:table-header-group">
            <TableRow>
              <TableHead className="pl-4 w-24">Cover</TableHead>
              <TableHead className="w-[40%]">Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUpdates.length === 0 ? (
              <TableRow className="cursor-default">
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {searchQuery ? "No updates found matching your search" : "No updates found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredUpdates.map((update) => {
                const updateSlug = update.slug || generateSlug(update.title);
                return (
                  <>
                    {/* Mobile Layout */}
                    <TableRow
                      key={`${update.id}-mobile`}
                      className="md:hidden group cursor-pointer hover:bg-muted/50 border-b border-border/50"
                      onMouseDown={(e) => {
                        if (e.button === 1) {
                          e.preventDefault();
                          window.open(`/admin/updates/${updateSlug}/edit`, "_blank");
                        }
                      }}
                    >
                      <Link
                        href={`/admin/updates/${updateSlug}/edit`}
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
                              {update.image_url ? (
                                <img
                                  src={update.image_url}
                                  alt={update.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-semibold text-muted-foreground">
                                  {update.title
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
                                {update.title}
                              </div>
                              {update.subtitle && (
                                <div className="text-sm text-muted-foreground truncate mb-1">
                                  {update.subtitle}
                                </div>
                              )}
                              <div className="text-sm text-muted-foreground space-y-0.5">
                                {update.date && (
                                  <div>{format(new Date(update.date), "MMM d, yyyy")}</div>
                                )}
                              </div>
                              <div className="mt-2">
                                <StateBadge state={update.publish_status} />
                              </div>
                            </div>
                            <div className="flex-shrink-0 ml-2" data-action-menu>
                              <ActionMenu
                                itemId={update.id}
                                editHref={`/admin/updates/${updateSlug}/edit`}
                                openPageHref={`/dev/updates/${updateSlug}`}
                                statsHref={`/admin/updates/${updateSlug}/stats`}
                                onDelete={handleDelete}
                                deleteLabel={`update "${update.title}"`}
                              />
                            </div>
                          </div>
                        </TableCell>
                      </Link>
                    </TableRow>

                    {/* Desktop Layout */}
                    <TableRow
                      key={`${update.id}-desktop`}
                      className="hidden md:table-row group cursor-pointer hover:bg-muted/50"
                      onMouseDown={(e) => {
                        if (e.button === 1) {
                          e.preventDefault();
                          window.open(`/admin/updates/${updateSlug}/edit`, "_blank");
                        }
                      }}
                    >
                      <Link
                        href={`/admin/updates/${updateSlug}/edit`}
                        className="contents"
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest("[data-action-menu]")) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <CoverImageCell
                          imageUrl={update.image_url}
                          title={update.title}
                          showInitials={true}
                          className="pl-4"
                        />
                        <TableTitleCell
                          title={update.title}
                          imageUrl={undefined}
                          description={update.subtitle || undefined}
                          showInitials={false}
                          href={`/dev/updates/${updateSlug}`}
                          className="w-[40%]"
                        />
                        <TableCell>
                          {update.date ? format(new Date(update.date), "MMM d, yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          <StateBadge state={update.publish_status} />
                        </TableCell>
                        <TableCell className="text-right pr-4" data-action-menu>
                          <ActionMenu
                            itemId={update.id}
                            editHref={`/admin/updates/${updateSlug}/edit`}
                            openPageHref={`/dev/updates/${updateSlug}`}
                            statsHref={`/admin/updates/${updateSlug}/stats`}
                            onDelete={handleDelete}
                            deleteLabel={`update "${update.title}"`}
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
