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

type Label = {
  id: string;
  name: string;
  slug: string;
  logo_image_url: string | null;
  website_url: string | null;
};

type LabelsListProps = {
  initialLabels: Label[];
};

export function LabelsList({ initialLabels }: LabelsListProps) {
  const [labels, setLabels] = useState<Label[]>(initialLabels);
  const [searchQuery, setSearchQuery] = useState("");

  const handleDelete = async (id: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await fetch(`/api/admin/labels?id=${id}`, {
        method: "DELETE",
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete label");
      }

      toast.success("Label deleted successfully");
      setLabels(labels.filter((l) => l.id !== id));
    } catch (error: any) {
      console.error("Error deleting label:", error);
      toast.error(error.message || "Failed to delete label");
      throw error;
    }
  };

  const filteredLabels = labels.filter((label) => {
    const query = searchQuery.toLowerCase();
    return (
      label.name.toLowerCase().includes(query) || label.website_url?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-full">
      <div className="mb-6 md:mb-8 relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />
        <AdminPageTitle
          title="Labels"
          description="Manage record labels and distributors associated with your music releases."
        />
      </div>
      <div className="space-y-3 md:space-y-4">
        <AdminToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search labels..."
        >
          <Button
            asChild
            variant="ghost"
            className="rounded-full w-10 h-10 p-0 bg-transparent text-muted-foreground hover:text-primary hover:bg-transparent border-0 shadow-none transition-colors"
            title="New Label"
          >
            <Link href="/admin/labels/new/edit">
              <FontAwesomeIcon icon={faPlus} className="h-5 w-5" />
            </Link>
          </Button>
        </AdminToolbar>

        <AdminTable>
          <TableHeader className="hidden md:table-header-group">
            <TableRow>
              <TableHead className="pl-4 w-24">Cover</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLabels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  {searchQuery ? "No labels found matching your search" : "No labels found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredLabels.map((label) => (
                <>
                  {/* Mobile Layout */}
                  <TableRow
                    key={`${label.id}-mobile`}
                    className="md:hidden group cursor-pointer hover:bg-muted/50 border-b border-border/50"
                    onMouseDown={(e) => {
                      if (e.button === 1) {
                        e.preventDefault();
                        window.open(`/admin/labels/${label.slug}/edit`, "_blank");
                      }
                    }}
                  >
                    <Link
                      href={`/admin/labels/${label.slug}/edit`}
                      className="contents"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest("[data-action-menu]")) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <TableCell className="px-3 md:pl-4 md:pr-4 py-4" colSpan={3}>
                        <div className="flex items-start gap-3 md:gap-4">
                          <div className="h-12 w-12 rounded-full overflow-hidden flex items-center justify-center bg-muted shadow-md flex-shrink-0">
                            {label.logo_image_url ? (
                              <img
                                src={label.logo_image_url}
                                alt={label.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-semibold text-muted-foreground">
                                {label.name
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
                              {label.name}
                            </div>
                            {label.website_url && (
                              <div className="text-sm text-muted-foreground truncate">
                                <a
                                  href={label.website_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {label.website_url}
                                </a>
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0 ml-2" data-action-menu>
                            <ActionMenu
                              itemId={label.id}
                              editHref={`/admin/labels/${label.slug}/edit`}
                              onDelete={handleDelete}
                              deleteLabel={`label "${label.name}"`}
                            />
                          </div>
                        </div>
                      </TableCell>
                    </Link>
                  </TableRow>

                  {/* Desktop Layout */}
                  <TableRow
                    key={`${label.id}-desktop`}
                    className="hidden md:table-row group cursor-pointer hover:bg-muted/50"
                    onMouseDown={(e) => {
                      if (e.button === 1) {
                        e.preventDefault();
                        window.open(`/admin/labels/${label.slug}/edit`, "_blank");
                      }
                    }}
                  >
                    <Link
                      href={`/admin/labels/${label.slug}/edit`}
                      className="contents"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest("[data-action-menu]")) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <CoverImageCell
                        imageUrl={label.logo_image_url}
                        title={label.name}
                        showInitials={true}
                        className="pl-4"
                      />
                      <TableTitleCell
                        title={label.name}
                        imageUrl={undefined}
                        showInitials={false}
                      />
                      <TableCell className="text-right pr-4" data-action-menu>
                        <ActionMenu
                          itemId={label.id}
                          editHref={`/admin/labels/${label.slug}/edit`}
                          onDelete={handleDelete}
                          deleteLabel={`label "${label.name}"`}
                        />
                      </TableCell>
                    </Link>
                  </TableRow>
                </>
              ))
            )}
          </TableBody>
        </AdminTable>
      </div>
    </div>
  );
}
