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
import { AdminButton } from "@/components/admin/AdminButton";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Album } from "@/features/albums/types";

type AlbumsListProps = {
  initialAlbums: Album[];
};

export function AlbumsList({ initialAlbums }: AlbumsListProps) {
  const [albums, setAlbums] = useState<Album[]>(initialAlbums);
  const [searchQuery, setSearchQuery] = useState("");

  const handleDelete = async (id: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await fetch(`/api/admin/albums?id=${id}`, {
        method: "DELETE",
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete album");
      }

      toast.success("Album deleted successfully");
      setAlbums(albums.filter((a) => a.id !== id));
    } catch (error: any) {
      console.error("Error deleting album:", error);
      toast.error(error.message || "Failed to delete album");
      throw error;
    }
  };

  const filteredAlbums = albums.filter((album) => {
    const query = searchQuery.toLowerCase();
    return (
      album.title.toLowerCase().includes(query) ||
      album.catalog_number?.toLowerCase().includes(query) ||
      album.labels?.name.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-full">
      <div className="mb-6 md:mb-8 relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3 mb-2">
            <h1 className="text-4xl font-bold text-foreground leading-none">Albums</h1>
            <span className="inline-flex items-center justify-center h-5 px-2.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 leading-none">
              ({filteredAlbums.length} {filteredAlbums.length === 1 ? "album" : "albums"})
            </span>
          </div>
          <p className="text-base text-muted-foreground">
            Manage your music albums, including releases, track listings, and metadata.
          </p>
        </div>
      </div>
      <div className="space-y-3 md:space-y-4">
        <AdminToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search albums..."
        >
          <Button
            asChild
            variant="ghost"
            className="rounded-full w-10 h-10 p-0 bg-transparent text-muted-foreground hover:text-primary hover:bg-transparent border-0 shadow-none transition-colors"
            title="New Album"
          >
            <Link href="/admin/albums/new/edit">
              <FontAwesomeIcon icon={faPlus} className="h-5 w-5" />
            </Link>
          </Button>
        </AdminToolbar>

        <AdminTable>
          <TableHeader className="hidden md:table-header-group">
            <TableRow>
              <TableHead className="pl-4 w-24">Cover</TableHead>
              <TableHead className="w-64 max-w-64">Title</TableHead>
              <TableHead className="w-32 max-w-32">Catalog</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Release Date</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAlbums.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {searchQuery ? "No albums found matching your search" : "No albums found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredAlbums.map((album) => (
                <>
                  {/* Mobile Layout */}
                  <TableRow
                    key={`${album.id}-mobile`}
                    className="md:hidden group cursor-pointer hover:bg-muted/50 border-b border-border/50"
                    onMouseDown={(e) => {
                      if (e.button === 1) {
                        e.preventDefault();
                        window.open(`/admin/albums/${album.slug}/edit`, "_blank");
                      }
                    }}
                  >
                    <Link
                      href={`/admin/albums/${album.slug}/edit`}
                      className="contents"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest("[data-action-menu]")) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <TableCell className="px-3 md:pl-4 md:pr-4 py-4" colSpan={7}>
                        <div className="flex items-start gap-3 md:gap-4">
                          <div className="h-12 w-12 rounded-full overflow-hidden flex items-center justify-center bg-muted shadow-md flex-shrink-0">
                            {album.cover_image_url ? (
                              <img
                                src={album.cover_image_url}
                                alt={album.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-semibold text-muted-foreground">
                                {album.title
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
                              {album.title}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-0.5">
                              {album.release_date && (
                                <div>{format(new Date(album.release_date), "MMM d, yyyy")}</div>
                              )}
                            </div>
                            <div className="mt-2">
                              <StateBadge state={album.publish_status} />
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-2" data-action-menu>
                            <ActionMenu
                              itemId={album.id}
                              editHref={`/admin/albums/${album.slug}/edit`}
                              openPageHref={`/dev/albums/${album.slug}`}
                              statsHref={`/admin/albums/${album.slug}/stats`}
                              onDelete={handleDelete}
                              deleteLabel={`album "${album.title}"`}
                            />
                          </div>
                        </div>
                      </TableCell>
                    </Link>
                  </TableRow>

                  {/* Desktop Layout */}
                  <TableRow
                    key={`${album.id}-desktop`}
                    className="hidden md:table-row group cursor-pointer hover:bg-muted/50"
                    onMouseDown={(e) => {
                      if (e.button === 1) {
                        e.preventDefault();
                        window.open(`/admin/albums/${album.slug}/edit`, "_blank");
                      }
                    }}
                  >
                    <Link
                      href={`/admin/albums/${album.slug}/edit`}
                      className="contents"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest("[data-action-menu]")) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <CoverImageCell
                        imageUrl={album.cover_image_url}
                        title={album.title}
                        showInitials={true}
                        className="pl-4"
                      />
                      <TableTitleCell
                        title={album.title}
                        imageUrl={undefined}
                        showInitials={false}
                        href={`/dev/albums/${album.slug}`}
                        className="w-64 max-w-64"
                      />
                      <TableCell className="text-muted-foreground w-32 max-w-32">
                        <span className="block truncate" title={album.catalog_number || undefined}>
                          {album.catalog_number || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {album.labels?.name || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {album.release_date
                          ? format(new Date(album.release_date), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <StateBadge state={album.publish_status} />
                      </TableCell>
                      <TableCell className="text-right pr-4" data-action-menu>
                        <ActionMenu
                          itemId={album.id}
                          editHref={`/admin/albums/${album.slug}/edit`}
                          openPageHref={`/dev/albums/${album.slug}`}
                          statsHref={`/admin/albums/${album.slug}/stats`}
                          onDelete={handleDelete}
                          deleteLabel={`album "${album.title}"`}
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
