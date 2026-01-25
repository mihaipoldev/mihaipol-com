"use client";

import { useState, useEffect, useRef } from "react";
import { Folder, Pencil, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ShadowButton } from "@/components/admin/forms/ShadowButton";
import { cn } from "@/lib/utils";

type DriveFolderBadgeProps = {
  albumId: string;
  refreshKey?: number;
  onEditClick: () => void;
  // Initial data from server to avoid blocking render
  initialHasFolder?: boolean;
  initialFolderUrl?: string | null;
  initialFolderId?: string | null;
};

type StatusData = {
  authenticated: boolean;
  hasFolder: boolean;
  folderInfo?: {
    folder_id: string;
    folder_url: string;
    folder_name: string;
  } | null;
};

export function DriveFolderBadge({ 
  albumId, 
  refreshKey, 
  onEditClick,
  initialHasFolder = false,
  initialFolderUrl = null,
  initialFolderId = null,
}: DriveFolderBadgeProps) {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [folderNameLoading, setFolderNameLoading] = useState(false);
  const hasInitializedRef = useRef(false);

  // Initialize with server data immediately if available
  useEffect(() => {
    if (hasInitializedRef.current) return;
    
    if (initialHasFolder && initialFolderId && initialFolderUrl) {
      // We have folder data from server - show badge immediately
      setStatus({
        authenticated: true, // Assume authenticated if we have folder data
        hasFolder: true,
        folderInfo: {
          folder_id: initialFolderId,
          folder_url: initialFolderUrl,
          folder_name: "", // Will be fetched lazily
        },
      });
      setLoading(false);
      hasInitializedRef.current = true;
      
      // Fetch folder name in the background (non-blocking)
      async function fetchFolderName() {
        if (!initialFolderId) return;
        
        try {
          setFolderNameLoading(true);
          const response = await fetch(`/api/albums/${albumId}/drive-folder`);
          if (response.ok) {
            const data = await response.json();
            if (data.folderInfo?.folder_name) {
              setStatus((prev) => {
                if (!prev || !prev.folderInfo) return prev;
                return {
                  ...prev,
                  folderInfo: {
                    ...prev.folderInfo,
                    folder_name: data.folderInfo.folder_name,
                  },
                };
              });
            }
          }
        } catch (error) {
          console.error("Error fetching folder name:", error);
        } finally {
          setFolderNameLoading(false);
        }
      }
      
      fetchFolderName();
    } else {
      // No initial folder data - need to check auth and folder status
      async function fetchStatus() {
        try {
          setLoading(true);
          const [authResponse, folderResponse] = await Promise.all([
            fetch("/api/auth/google/status"),
            fetch(`/api/albums/${albumId}/drive-folder`),
          ]);

          if (!authResponse.ok || !folderResponse.ok) {
            console.error("Error fetching status:", { auth: authResponse.status, folder: folderResponse.status });
            return;
          }

          const authData = await authResponse.json();
          const folderData = await folderResponse.json();

          setStatus({
            authenticated: authData.authenticated || false,
            hasFolder: folderData.hasFolder || false,
            folderInfo: folderData.folderInfo || null,
          });
        } catch (error) {
          console.error("Error fetching Drive status:", error);
        } finally {
          setLoading(false);
        }
      }
      
      fetchStatus();
      hasInitializedRef.current = true;
    }
  }, [albumId, initialHasFolder, initialFolderId, initialFolderUrl]);

  // Handle refresh key changes (e.g., after folder is linked/unlinked)
  useEffect(() => {
    if (!hasInitializedRef.current) return;
    
    async function fetchStatus() {
      try {
        setLoading(true);
        const [authResponse, folderResponse] = await Promise.all([
          fetch("/api/auth/google/status"),
          fetch(`/api/albums/${albumId}/drive-folder`),
        ]);

        if (!authResponse.ok || !folderResponse.ok) {
          console.error("Error fetching status:", { auth: authResponse.status, folder: folderResponse.status });
          return;
        }

        const authData = await authResponse.json();
        const folderData = await folderResponse.json();

        setStatus({
          authenticated: authData.authenticated || false,
          hasFolder: folderData.hasFolder || false,
          folderInfo: folderData.folderInfo || null,
        });
      } catch (error) {
        console.error("Error fetching Drive status:", error);
      } finally {
        setLoading(false);
      }
    }
    
    if (refreshKey !== undefined) {
      fetchStatus();
    }
  }, [refreshKey, albumId]);

  function handleConnect() {
    window.location.href = "/api/auth/google/login";
  }

  function handleFolderClick() {
    if (status?.folderInfo?.folder_url) {
      window.open(status.folderInfo.folder_url, "_blank", "noopener,noreferrer");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading Drive status...</span>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <div>
      {!status.authenticated ? (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Not connected to Google Drive</span>
          <ShadowButton onClick={handleConnect} size="sm" className="ml-auto">
            Connect Google Drive
          </ShadowButton>
        </div>
      ) : status.hasFolder && status.folderInfo ? (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "group -ml-2 relative flex items-center gap-2 py-1 px-2 cursor-pointer hover:bg-muted transition-colors",
              "border-none"
            )}
            onClick={handleFolderClick}
          >
            <Folder className="h-4 w-4" />
            {folderNameLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <span className="text-sm font-medium">
                {status.folderInfo.folder_name || "Drive Folder"}
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEditClick();
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded ml-1"
              aria-label="Edit folder"
            >
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </button>
          </Badge>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">No folder linked</span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEditClick();
            }}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label="Edit folder"
          >
            <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}
