"use client";

import { useState, useEffect } from "react";
import { Folder, Pencil, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ShadowButton } from "@/components/admin/forms/ShadowButton";
import { cn } from "@/lib/utils";

type DriveFolderBadgeProps = {
  albumId: string;
  refreshKey?: number;
  onEditClick: () => void;
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

export function DriveFolderBadge({ albumId, refreshKey, onEditClick }: DriveFolderBadgeProps) {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, [albumId, refreshKey]);

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
              "group relative flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-muted transition-colors",
              "border-primary/20 hover:border-primary/40"
            )}
            onClick={handleFolderClick}
          >
            <Folder className="h-4 w-4" />
            <span className="text-sm font-medium">{status.folderInfo.folder_name}</span>
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
