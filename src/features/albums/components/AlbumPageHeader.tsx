"use client";

import { useState } from "react";
import { DriveFolderBadge } from "@/features/google-drive/components/DriveFolderBadge";
import { DriveFolderModal } from "@/features/google-drive/components/DriveFolderModal";
import type { Album } from "@/features/albums/types";

type AlbumPageHeaderProps = {
  albumId: string;
  isNew: boolean;
  albumTitle?: string | null;
  initialAlbum: Album | null;
};

export function AlbumPageHeader({
  albumId,
  isNew,
  albumTitle,
  initialAlbum,
}: AlbumPageHeaderProps) {
  // Drive folder state for header badge
  const [driveRefreshKey, setDriveRefreshKey] = useState(0);
  const [driveHasFolder, setDriveHasFolder] = useState(!!initialAlbum?.drive_folder_id);
  const [driveCurrentFolderUrl, setDriveCurrentFolderUrl] = useState<string | null>(
    initialAlbum?.drive_folder_url || null
  );
  const [driveModalOpen, setDriveModalOpen] = useState(false);

  const handleDriveRefresh = async () => {
    try {
      const response = await fetch(`/api/albums/${albumId}/drive-folder`);
      if (response.ok) {
        const data = await response.json();
        setDriveHasFolder(data.hasFolder || false);
        setDriveCurrentFolderUrl(data.folderInfo?.folder_url || null);
      }
    } catch (error) {
      console.error("Error refreshing folder status:", error);
    }
    setDriveRefreshKey((prev) => prev + 1);
  };

  const handleDriveModalSuccess = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await handleDriveRefresh();
  };

  const displayName = albumTitle || (isNew ? undefined : initialAlbum?.title);

  return (
    <>
      <div className="mb-6 md:mb-8 relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-foreground">
              {displayName || (isNew ? "Create Album" : "Edit Album")}
            </h1>
            {!isNew && (
              <div className="mt-1">
                <DriveFolderBadge
                  albumId={albumId}
                  refreshKey={driveRefreshKey}
                  onEditClick={() => setDriveModalOpen(true)}
                  initialHasFolder={!!initialAlbum?.drive_folder_id}
                  initialFolderUrl={initialAlbum?.drive_folder_url || null}
                  initialFolderId={initialAlbum?.drive_folder_id || null}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drive Folder Modal - accessible from header badge */}
      {!isNew && (
        <DriveFolderModal
          open={driveModalOpen}
          onOpenChange={setDriveModalOpen}
          albumId={albumId}
          currentFolderUrl={driveCurrentFolderUrl}
          hasFolder={driveHasFolder}
          onSuccess={handleDriveModalSuccess}
        />
      )}
    </>
  );
}
