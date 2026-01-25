"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StateBadge } from "@/components/admin/StateBadge";
import { DriveFolderBadge } from "@/features/google-drive/components/DriveFolderBadge";
import { DriveFolderModal } from "@/features/google-drive/components/DriveFolderModal";
import { EditAlbumDetailsModal } from "./EditAlbumDetailsModal";
import { Edit, ExternalLink, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { Album } from "@/features/albums/types";
import { useRouter } from "next/navigation";
import { useAlbumAnalytics } from "../hooks/useAlbumAnalytics";
import AlbumBackgroundGradient from "@/components/landing/AlbumBackgroundGradient";

type AlbumHeroSectionProps = {
  albumId: string;
  isNew: boolean;
  initialAlbum: Album | null;
};

export function AlbumHeroSection({
  albumId,
  isNew,
  initialAlbum,
}: AlbumHeroSectionProps) {
  const router = useRouter();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Drive folder state
  const [driveRefreshKey, setDriveRefreshKey] = useState(0);
  const [driveHasFolder, setDriveHasFolder] = useState(!!initialAlbum?.drive_folder_id);
  const [driveCurrentFolderUrl, setDriveCurrentFolderUrl] = useState<string | null>(
    initialAlbum?.drive_folder_url || null
  );
  const [driveModalOpen, setDriveModalOpen] = useState(false);

  // Fetch analytics data using shared hook (prevents duplicate requests)
  const { data: analyticsData, loading: quickStatsLoading } = useAlbumAnalytics(
    albumId,
    "30",
    !isNew && !!initialAlbum
  );

  // Extract quick stats from analytics data
  const quickStats = analyticsData
    ? {
        visits: analyticsData.totalPageViews || 0,
        clicks: analyticsData.totalServiceClicks || 0,
      }
    : null;

  if (isNew || !initialAlbum) {
    return (
      <motion.div
        className="mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header for New Album */}
        <motion.div
          className="mb-6 md:mb-8 relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />
          <h1 className="text-4xl font-bold text-foreground">
            Create Album
          </h1>
        </motion.div>
      </motion.div>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const formatReleaseDate = (date: string | null) => {
    if (!date) return null;
    try {
      return format(new Date(date), "MMMM d, yyyy");
    } catch {
      return date;
    }
  };

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

  const handleDeleteAlbum = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/albums?id=${albumId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete album");
      }

      // Redirect to albums list after successful deletion
      router.push("/admin/albums");
    } catch (error) {
      console.error("Error deleting album:", error);
      alert("Failed to delete album. Please try again.");
      setIsDeleting(false);
    }
  };

  const getStatusState = (): "published" | "draft" | "scheduled" | "archived" => {
    return initialAlbum.publish_status as "published" | "draft" | "scheduled" | "archived";
  };

  const publicUrl = `/dev/albums/${initialAlbum.slug}`;

  return (
    <AlbumBackgroundGradient coverImageUrl={initialAlbum.cover_image_url} className="-mx-16 px-16 -mt-4 py-6 mb-0 rounded-lg">
      <>
        <motion.div
          className="0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {/* Hero Content */}
          <div className="flex flex-col md:flex-row gap-5 items-start">
            {/* Album Cover */}
            {initialAlbum.cover_image_url && (
              <motion.div
                className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-lg overflow-hidden mt-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.05 }}
              >
                <Image
                  src={initialAlbum.cover_image_url}
                  alt={initialAlbum.title}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              </motion.div>
            )}

            {/* Album Info */}
            <motion.div
              className="flex-1 space-y-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="flex items-baseline justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-2xl font-[1000] text-foreground">
                    {initialAlbum.title}
                  </h1>
                  {initialAlbum.release_date && (
                    <p className="text-muted-foreground text-sm md:text-md mt-1">
                      {formatReleaseDate(initialAlbum.release_date)}
                    </p>
                  )}
                </div>
                {/* Action Buttons - Next to title */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditModalOpen(true)}
                    title="Edit Album"
                    className="h-8 w-8 p-0 hover:bg-transparent"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    title="View Live Page"
                    className="h-8 w-8 p-0 hover:bg-transparent"
                  >
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteDialogOpen(true)}
                    title="Delete Album"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-transparent"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Quick Stats - Always reserve space */}
              <div className="h-5 flex items-center">
                {quickStatsLoading ? (
                  <div className="flex items-center gap-4 w-full">
                    <Skeleton className="h-5 w-20" />
                    <span className="text-muted-foreground">•</span>
                    <Skeleton className="h-5 w-20" />
                  </div>
                ) : quickStats ? (
                  <motion.div
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.15 }}
                  >
                    <span>
                      {formatNumber(quickStats.visits)} visits
                    </span>
                    <span>•</span>
                    <span>
                      {formatNumber(quickStats.clicks)} clicks
                    </span>
                  </motion.div>
                ) : (
                  <div className="h-5" aria-hidden="true" />
                )}
              </div>

              {/* Status Badge and Drive Badge */}
              <motion.div
                className="flex items-center gap-3 flex-wrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.2 }}
              >
                <StateBadge state={getStatusState()} />
                {/* Drive badge - shows immediately with initial data, loads folder name in background */}
                <div className="h-7 min-w-[120px] flex items-center">
                  <DriveFolderBadge
                    albumId={albumId}
                    refreshKey={driveRefreshKey}
                    onEditClick={() => setDriveModalOpen(true)}
                    initialHasFolder={!!initialAlbum?.drive_folder_id}
                    initialFolderUrl={initialAlbum?.drive_folder_url || null}
                    initialFolderId={initialAlbum?.drive_folder_id || null}
                  />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Edit Album Modal */}
        <EditAlbumDetailsModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          album={initialAlbum}
          onSuccess={() => {
            // Refresh the page to get updated data
            router.refresh();
          }}
        />

        {/* Drive Folder Modal */}
        <DriveFolderModal
          open={driveModalOpen}
          onOpenChange={setDriveModalOpen}
          albumId={albumId}
          currentFolderUrl={driveCurrentFolderUrl}
          hasFolder={driveHasFolder}
          onSuccess={handleDriveModalSuccess}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{initialAlbum.title}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAlbum}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete Album"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    </AlbumBackgroundGradient>
  );
}
