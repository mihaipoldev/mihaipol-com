"use client";

import { useState } from "react";
import React from "react";
import { format } from "date-fns";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AdminTable,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/admin/table/AdminTable";
import { TableTitleCell } from "@/components/admin/table/TableTitleCell";
import { CoverImageCell } from "@/components/admin/table/CoverImageCell";
import { ActionMenu } from "@/components/admin/ui/ActionMenu";
import { StateBadge } from "@/components/admin/StateBadge";
import { AdminPageTitle } from "@/components/admin/ui/AdminPageTitle";
import { AdminToolbar } from "@/components/admin/table/AdminToolbar";
import { AdminButton } from "@/components/admin/forms/AdminButton";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { EditAlbumDetailsModal } from "./EditAlbumDetailsModal";
import type { Album } from "@/features/albums/types";

type AlbumsListProps = {
  initialAlbums: Album[];
};

export function AlbumsList({ initialAlbums }: AlbumsListProps) {
  const [albums, setAlbums] = useState<Album[]>(initialAlbums);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEdit = (album: Album) => {
    setEditingAlbum(album);
    setIsEditModalOpen(true);
  };

  const handleCreate = () => {
    setEditingAlbum(null);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    // Refresh the albums list
    window.location.reload();
  };

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
    <motion.div
      className="w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="mb-4 md:mb-6 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
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
      </motion.div>
      <motion.div
        className="space-y-3 md:space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <AdminToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search albums..."
        >
          <Button
            variant="ghost"
            className="rounded-full w-10 h-10 p-0 bg-transparent text-muted-foreground hover:text-primary hover:bg-transparent border-0 shadow-none transition-colors"
            title="New Album"
            onClick={handleCreate}
          >
            <FontAwesomeIcon icon={faPlus} className="h-5 w-5" />
          </Button>
        </AdminToolbar>

        <AdminTable>
          <TableHeader className="hidden md:table-header-group">
            <TableRow>
              <TableHead className="pl-4 w-[81px]">Cover</TableHead>
              <TableHead className="w-80 max-w-80">Title</TableHead>
              <TableHead className="w-40 max-w-40">Label</TableHead>
              <TableHead className="w-36">Release Date</TableHead>
              <TableHead className="w-20">Status</TableHead>
              <TableHead className="text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAlbums.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {searchQuery ? "No albums found matching your search" : "No albums found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredAlbums.map((album, index) => (
                <React.Fragment key={album.id}>
                  <motion.div
                    style={{ display: "contents" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02, duration: 0.2 }}
                  >
                  {/* Mobile Layout */}
                  <TableRow
                    key={`${album.id}-mobile`}
                    className="md:hidden group cursor-pointer hover:bg-muted/50 border-b border-border/50"
                    onClick={(e) => {
                      if (!(e.target as HTMLElement).closest("[data-action-menu]")) {
                        window.location.href = `/admin/albums/${album.slug}`;
                      }
                    }}
                    onMouseDown={(e) => {
                      if (e.button === 1) {
                        e.preventDefault();
                        window.open(`/admin/albums/${album.slug}`, "_blank");
                      }
                    }}
                  >
                    <TableCell className="px-3 md:pl-4 md:pr-4 py-4" colSpan={6}>
                      <div className="flex items-start gap-3 md:gap-4">
                        <div className="h-[49px] w-[49px] rounded-full overflow-hidden flex items-center justify-center bg-muted shadow-md flex-shrink-0">
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
                          {album.catalog_number && (
                            <div className="text-xs text-muted-foreground mb-1">
                              {album.catalog_number}
                            </div>
                          )}
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
                            onEdit={() => handleEdit(album)}
                            openPageHref={`/dev/albums/${album.slug}`}
                            statsHref={`/admin/albums/${album.slug}/stats`}
                            onDelete={handleDelete}
                            deleteLabel={`album "${album.title}"`}
                          />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Desktop Layout */}
                  <TableRow
                    key={`${album.id}-desktop`}
                    className="hidden md:table-row group cursor-pointer hover:bg-muted/50"
                    onClick={(e) => {
                      if (!(e.target as HTMLElement).closest("[data-action-menu]")) {
                        window.location.href = `/admin/albums/${album.slug}`;
                      }
                    }}
                    onMouseDown={(e) => {
                      if (e.button === 1) {
                        e.preventDefault();
                        window.open(`/admin/albums/${album.slug}`, "_blank");
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
                      description={album.catalog_number || undefined}
                      className="w-80 max-w-80"
                    />
                    <TableCell className="text-muted-foreground w-40 max-w-40">
                      <span className="block truncate" title={album.labels?.name || undefined}>
                        {album.labels?.name || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground w-36">
                      {album.release_date
                        ? format(new Date(album.release_date), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell className="w-20">
                      <StateBadge state={album.publish_status} />
                    </TableCell>
                    <TableCell className="text-right pr-4" data-action-menu>
                      <ActionMenu
                        itemId={album.id}
                        onEdit={() => handleEdit(album)}
                        openPageHref={`/dev/albums/${album.slug}`}
                        statsHref={`/admin/albums/${album.slug}/stats`}
                        onDelete={handleDelete}
                        deleteLabel={`album "${album.title}"`}
                      />
                    </TableCell>
                  </TableRow>
                  </motion.div>
                </React.Fragment>
              ))
            )}
          </TableBody>
        </AdminTable>
      </motion.div>

      {isEditModalOpen && (
        <EditAlbumDetailsModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          album={editingAlbum}
          onSuccess={handleEditSuccess}
        />
      )}
    </motion.div>
  );
}
