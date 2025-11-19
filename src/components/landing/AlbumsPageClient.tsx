"use client";

import { useState, useMemo } from "react";
import LandingAlbumsList from "./lists/LandingAlbumsList";
import AlbumsFilterPopover from "./AlbumsFilterPopover";
import type { LandingAlbum } from "./types";

type AlbumsPageClientProps = {
  albums: LandingAlbum[];
  fallbackImage: string;
  pageTitle: string;
  pageDescription: string;
  columns?: 3 | 4 | 5;
};

export default function AlbumsPageClient({
  albums,
  fallbackImage,
  pageTitle,
  pageDescription,
  columns = 4,
}: AlbumsPageClientProps) {
  const [selectedAlbumTypes, setSelectedAlbumTypes] = useState<Set<string>>(new Set());
  const [selectedFormatTypes, setSelectedFormatTypes] = useState<Set<string>>(new Set());

  // Extract unique values from albums
  const availableAlbumTypes = useMemo(() => {
    const types = new Set<string>();
    albums.forEach((album) => {
      if (album.album_type) {
        types.add(album.album_type);
      }
    });
    return Array.from(types).sort();
  }, [albums]);

  const availableFormatTypes = useMemo(() => {
    const types = new Set<string>();
    albums.forEach((album) => {
      if (album.format_type) {
        types.add(album.format_type);
      }
    });
    return Array.from(types).sort();
  }, [albums]);

  // Filter albums based on selected filters
  const filteredAlbums = useMemo(() => {
    return albums.filter((album) => {
      // If no filters are selected, show all albums
      if (selectedAlbumTypes.size === 0 && selectedFormatTypes.size === 0) {
        return true;
      }

      // Check album_type filter
      const albumTypeMatch =
        selectedAlbumTypes.size === 0 ||
        (album.album_type && selectedAlbumTypes.has(album.album_type));

      // Check format_type filter
      const formatTypeMatch =
        selectedFormatTypes.size === 0 ||
        (album.format_type && selectedFormatTypes.has(album.format_type));

      // Album must match both filters (AND logic)
      return albumTypeMatch && formatTypeMatch;
    });
  }, [albums, selectedAlbumTypes, selectedFormatTypes]);

  const activeFilterCount = selectedAlbumTypes.size + selectedFormatTypes.size;

  const toggleAlbumType = (type: string) => {
    const newSet = new Set(selectedAlbumTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setSelectedAlbumTypes(newSet);
  };

  const toggleFormatType = (type: string) => {
    const newSet = new Set(selectedFormatTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setSelectedFormatTypes(newSet);
  };

  const clearFilters = () => {
    setSelectedAlbumTypes(new Set());
    setSelectedFormatTypes(new Set());
  };

  return (
    <div className="py-24 px-6">
      <div className="container mx-auto px-0 md:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl font-bold">{pageTitle}</h1>
            <AlbumsFilterPopover
              availableAlbumTypes={availableAlbumTypes}
              availableFormatTypes={availableFormatTypes}
              selectedAlbumTypes={selectedAlbumTypes}
              selectedFormatTypes={selectedFormatTypes}
              onAlbumTypeToggle={toggleAlbumType}
              onFormatTypeToggle={toggleFormatType}
              onClearFilters={clearFilters}
            />
          </div>
          <p className="text-muted-foreground">{pageDescription}</p>
        </div>

        {filteredAlbums.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              {activeFilterCount > 0
                ? "No albums match the selected filters."
                : "No albums yet. Check back soon."}
            </p>
          </div>
        ) : (
          <LandingAlbumsList
            albums={filteredAlbums}
            fallbackImage={fallbackImage}
            columns={columns}
          />
        )}
      </div>
    </div>
  );
}
