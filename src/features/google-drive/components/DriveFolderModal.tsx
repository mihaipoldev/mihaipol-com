"use client";

import { useState, useEffect } from "react";
import { ShadowButton } from "@/components/admin/forms/ShadowButton";
import { ShadowInput } from "@/components/admin/forms/ShadowInput";
import { FormField } from "@/components/admin/forms/FormField";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link2, Unlink, Loader2, FolderPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type DriveFolderModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  albumId: string;
  currentFolderUrl?: string | null;
  hasFolder: boolean;
  onSuccess?: () => void;
};

export function DriveFolderModal({
  open,
  onOpenChange,
  albumId,
  currentFolderUrl,
  hasFolder,
  onSuccess,
}: DriveFolderModalProps) {
  const [folderUrlInput, setFolderUrlInput] = useState("");
  const [originalFolderUrl, setOriginalFolderUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);

  // Fetch latest folder URL when modal opens
  useEffect(() => {
    if (open) {
      // Fetch the latest folder info to ensure we have the most up-to-date URL
      fetch(`/api/albums/${albumId}/drive-folder`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch folder info");
          return res.json();
        })
        .then((data) => {
          const url = data.folderInfo?.folder_url || currentFolderUrl || "";
          setFolderUrlInput(url);
          setOriginalFolderUrl(url);
        })
        .catch((error) => {
          console.error("Error fetching folder URL:", error);
          // Fallback to prop value
          const url = currentFolderUrl || "";
          setFolderUrlInput(url);
          setOriginalFolderUrl(url);
        });
    }
  }, [open, albumId, currentFolderUrl]);

  const hasUrlChanged = folderUrlInput.trim() !== (originalFolderUrl || "");
  const isInputEmpty = !folderUrlInput.trim();

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
      setOriginalFolderUrl(folderUrlInput.trim());
      onOpenChange(false);
      setTimeout(() => {
        onSuccess?.();
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
      onOpenChange(false);
      setTimeout(() => {
        onSuccess?.();
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
      setFolderUrlInput("");
      setOriginalFolderUrl(null);
      onOpenChange(false);
      setTimeout(() => {
        onSuccess?.();
      }, 300);
    } catch (error: any) {
      console.error("Error unlinking folder:", error);
      toast.error(error.message || "Failed to unlink folder");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Google Drive Folder</DialogTitle>
            <DialogDescription>
              Link an existing folder or create a new one for this album.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <FormField label="Google Drive Folder URL">
              <ShadowInput
                type="url"
                placeholder="https://drive.google.com/drive/folders/..."
                value={folderUrlInput}
                onChange={(e) => setFolderUrlInput(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Paste a Google Drive folder URL to link an existing folder
              </p>
            </FormField>

            <div className="flex flex-col gap-2">
              <ShadowButton
                type="button"
                onClick={handleLinkFolder}
                disabled={loading || !hasUrlChanged || isInputEmpty}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Link2 className="h-4 w-4 mr-2" />
                )}
                Link Folder
              </ShadowButton>

              <ShadowButton
                type="button"
                onClick={handleCreateFolder}
                disabled={loading || !isInputEmpty}
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
              <p className="text-xs text-muted-foreground">
                Creates a new folder in format: [Year]/MM.YY Album Title
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 w-full sm:w-auto">
              {hasFolder && (
                <AlertDialog open={showUnlinkDialog} onOpenChange={setShowUnlinkDialog}>
                  <AlertDialogTrigger asChild>
                    <ShadowButton type="button" variant="outline" disabled={loading} className="flex-1 sm:flex-initial">
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
              )}
            <ShadowButton
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 sm:flex-initial"
            >
              Cancel
            </ShadowButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
