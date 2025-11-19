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

type Artist = {
  id: string;
  name: string;
  slug: string;
  profile_image_url: string | null;
  city: string | null;
  country: string | null;
};

type ArtistsListProps = {
  initialArtists: Artist[];
};

export function ArtistsList({ initialArtists }: ArtistsListProps) {
  const [artists, setArtists] = useState<Artist[]>(initialArtists);
  const [searchQuery, setSearchQuery] = useState("");

  const handleDelete = async (id: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await fetch(`/api/admin/artists?id=${id}`, {
        method: "DELETE",
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete artist");
      }

      toast.success("Artist deleted successfully");
      setArtists(artists.filter((a) => a.id !== id));
    } catch (error: any) {
      console.error("Error deleting artist:", error);
      toast.error(error.message || "Failed to delete artist");
      throw error;
    }
  };

  const filteredArtists = artists.filter((artist) => {
    const query = searchQuery.toLowerCase();
    return (
      artist.name.toLowerCase().includes(query) ||
      artist.city?.toLowerCase().includes(query) ||
      artist.country?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-full">
      <div className="mb-6 md:mb-8 relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />
        <AdminPageTitle
          title="Artists"
          description="Manage artist profiles, including collaborators and featured artists on your releases."
        />
      </div>
      <div className="space-y-3 md:space-y-4">
        <AdminToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search artists..."
        >
          <Button
            asChild
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-colors"
          >
            <Link href="/admin/artists/new/edit">
              <FontAwesomeIcon icon={faPlus} className="mr-2 h-4 w-4" />
              New Artist
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
            {filteredArtists.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  {searchQuery ? "No artists found matching your search" : "No artists found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredArtists.map((artist) => {
                const location = [artist.city, artist.country].filter(Boolean).join(", ") || null;
                return (
                  <>
                    {/* Mobile Layout */}
                    <TableRow
                      key={`${artist.id}-mobile`}
                      className="md:hidden group cursor-pointer hover:bg-muted/50 border-b border-border/50"
                      onMouseDown={(e) => {
                        if (e.button === 1) {
                          e.preventDefault();
                          window.open(`/admin/artists/${artist.slug}/edit`, "_blank");
                        }
                      }}
                    >
                      <Link
                        href={`/admin/artists/${artist.slug}/edit`}
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
                              {artist.profile_image_url ? (
                                <img
                                  src={artist.profile_image_url}
                                  alt={artist.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-semibold text-muted-foreground">
                                  {artist.name
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
                                {artist.name}
                              </div>
                              {location && (
                                <div className="text-sm text-muted-foreground truncate">
                                  {location}
                                </div>
                              )}
                            </div>
                            <div className="flex-shrink-0 ml-2" data-action-menu>
                              <ActionMenu
                                itemId={artist.id}
                                editHref={`/admin/artists/${artist.slug}/edit`}
                                onDelete={handleDelete}
                                deleteLabel={`artist "${artist.name}"`}
                              />
                            </div>
                          </div>
                        </TableCell>
                      </Link>
                    </TableRow>

                    {/* Desktop Layout */}
                    <TableRow
                      key={`${artist.id}-desktop`}
                      className="hidden md:table-row group cursor-pointer hover:bg-muted/50"
                      onMouseDown={(e) => {
                        if (e.button === 1) {
                          e.preventDefault();
                          window.open(`/admin/artists/${artist.slug}/edit`, "_blank");
                        }
                      }}
                    >
                      <Link
                        href={`/admin/artists/${artist.slug}/edit`}
                        className="contents"
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest("[data-action-menu]")) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <CoverImageCell
                          imageUrl={artist.profile_image_url}
                          title={artist.name}
                          showInitials={true}
                          className="pl-4"
                        />
                        <TableTitleCell
                          title={artist.name}
                          imageUrl={undefined}
                          showInitials={false}
                        />
                        <TableCell className="text-right pr-4" data-action-menu>
                          <ActionMenu
                            itemId={artist.id}
                            editHref={`/admin/artists/${artist.slug}/edit`}
                            onDelete={handleDelete}
                            deleteLabel={`artist "${artist.name}"`}
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
