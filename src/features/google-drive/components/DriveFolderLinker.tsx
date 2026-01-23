"use client";

import { useState } from "react";
import { ShadowButton } from "@/components/admin/forms/ShadowButton";
import { ShadowInput } from "@/components/admin/forms/ShadowInput";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link2, Unlink, Loader2, FolderPlus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type DriveFolderLinkerProps = {
  albumId: string;
  hasFolder: boolean;
  folderUrl?: string | null;
  onLinkSuccess?: () => void;
  onRefresh?: () => void;
};

export function DriveFolderLinker({
  albumId,
  hasFolder,
  folderUrl,
  onLinkSuccess,
  onRefresh,
}: DriveFolderLinkerProps) {
  const [folderUrlInput, setFolderUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);

  async function handleLinkFolder() {
    if (!folderUrlInput.trim()) {
      toast.error("Please enter a Google Drive folder URL");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/albums/${albumId}/drive-folder`, {
        method: hasFolder ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folder_url: folderUrlInput.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to link folder");
      }

      toast.success(data.message || "Folder linked successfully");
      setFolderUrlInput("");
      // Wait a moment for database to update, then refresh
      setTimeout(() => {
        onLinkSuccess?.();
        onRefresh?.();
      }, 300);
    } catch (error: any) {
      console.error("Error linking folder:", error);
      toast.error(error.message || "Failed to link folder");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateFolder() {
    try {
      setLoading(true);
      const response = await fetch(`/api/albums/${albumId}/drive-folder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create folder");
      }

      toast.success(data.message || "Folder created successfully");
      // Wait a moment for database to update, then refresh
      setTimeout(() => {
        onLinkSuccess?.();
        onRefresh?.();
      }, 300);
    } catch (error: any) {
      console.error("Error creating folder:", error);
      toast.error(error.message || "Failed to create folder");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlink() {
    try {
      setLoading(true);
      const response = await fetch(`/api/albums/${albumId}/drive-folder`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to unlink folder");
      }

      toast.success(data.message || "Folder unlinked successfully");
      setShowUnlinkDialog(false);
      onRefresh?.();
      onLinkSuccess?.();
    } catch (error: any) {
      console.error("Error unlinking folder:", error);
      toast.error(error.message || "Failed to unlink folder");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="drive-folder-url">Google Drive Folder URL</Label>
        <div className="flex gap-2">
          <ShadowInput
            id="drive-folder-url"
            type="url"
            placeholder="https://drive.google.com/drive/folders/..."
            value={folderUrlInput}
            onChange={(e) => setFolderUrlInput(e.target.value)}
            disabled={loading}
            className="flex-1"
          />
          {hasFolder ? (
            <ShadowButton
              onClick={handleLinkFolder}
              disabled={loading || !folderUrlInput.trim()}
              size="default"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Update Link
                </>
              )}
            </ShadowButton>
          ) : (
            <ShadowButton
              onClick={handleLinkFolder}
              disabled={loading || !folderUrlInput.trim()}
              size="default"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Link Folder
                </>
              )}
            </ShadowButton>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Paste a Google Drive folder URL to link an existing folder
        </p>
      </div>

      {!hasFolder && (
        <div className="pt-2 border-t">
          <ShadowButton
            onClick={handleCreateFolder}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <FolderPlus className="h-4 w-4 mr-2" />
            )}
            Create New Folder
          </ShadowButton>
          <p className="text-xs text-muted-foreground mt-2">
            Creates a new folder in format: [Year]/MM.YY Album Title
          </p>
        </div>
      )}

      {hasFolder && (
        <div className="pt-2 border-t">
          <AlertDialog open={showUnlinkDialog} onOpenChange={setShowUnlinkDialog}>
            <AlertDialogTrigger asChild>
              <ShadowButton variant="outline" disabled={loading} className="w-full">
                <Unlink className="h-4 w-4 mr-2" />
                Unlink Folder
              </ShadowButton>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Unlink Google Drive Folder?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will unlink the folder from this album but will NOT delete files in Google
                  Drive. The folder and all its contents will remain in your Google Drive. You can
                  link it again later if needed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleUnlink} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    "Unlink"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </Card>
  );
}
