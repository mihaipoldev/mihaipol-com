"use client";

import { useState, useEffect } from "react";
import { ShadowButton } from "@/components/admin/forms/ShadowButton";
import { ExternalLink, Folder, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DriveFolderStatusProps = {
  albumId: string;
  onStatusChange?: () => void;
  refreshKey?: number;
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

export function DriveFolderStatus({ albumId, onStatusChange, refreshKey }: DriveFolderStatusProps) {
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

  if (loading) {
    return (
      <Card className="p-4">
        <div className="text-sm text-muted-foreground">Loading Drive status...</div>
      </Card>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4" />
          <span className="font-semibold">Google Drive</span>
        </div>
        {!status.authenticated && (
          <ShadowButton onClick={handleConnect} size="sm">
            Connect Google Drive
          </ShadowButton>
        )}
      </div>

      {status.authenticated ? (
        <div className="space-y-2">
          {status.hasFolder && status.folderInfo ? (
            <div className="flex items-center justify-between p-2 bg-muted rounded-md">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{status.folderInfo.folder_name}</span>
              </div>
              <a
                href={status.folderInfo.folder_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Open in Drive
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No folder linked. Create or link a folder below.
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>Not connected to Google Drive</span>
        </div>
      )}
    </Card>
  );
}
