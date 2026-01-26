"use client";

import { Play, Pencil, Download, Copy, Trash2 } from "lucide-react";
import { ActionMenu } from "@/components/admin/ui/ActionMenu";
import { toast } from "sonner";
import type { AudioTrackActionsProps } from "./types";

export function AudioTrackActions({ audio, onEdit, onDelete }: AudioTrackActionsProps) {
  const handleEdit = () => {
    onEdit(audio);
  };
  return (
    <div className="px-0 pb-3 relative z-10 flex items-center gap-4" onMouseDown={(e) => e.stopPropagation()}>
      {/* Stats on the left - placeholder for now */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Play className="h-3 w-3" />
          <span>0</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex-1 flex justify-end">
        <ActionMenu
          itemId={audio.id}
          customItems={[
            {
              label: "Edit",
              icon: <Pencil className="h-4 w-4" />,
              onClick: handleEdit,
              disabled: audio.audio_url === "uploading",
            },
            {
              label: "Download",
              icon: <Download className="h-4 w-4" />,
              onClick: () => {
                if (audio.audio_url && audio.audio_url !== "uploading") {
                  try {
                    // Create a temporary anchor element to trigger download
                    const link = document.createElement("a");
                    link.href = audio.audio_url;
                    link.download = audio.title || `track-${audio.id}`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  } catch (error) {
                    console.error("Error downloading audio:", error);
                    toast.error("Failed to download audio");
                  }
                }
              },
              disabled: audio.audio_url === "uploading" || !audio.audio_url,
            },
            {
              label: "Copy URL",
              icon: <Copy className="h-4 w-4" />,
              onClick: async () => {
                if (audio.audio_url && audio.audio_url !== "uploading") {
                  try {
                    await navigator.clipboard.writeText(audio.audio_url);
                    toast.success("URL copied to clipboard");
                  } catch (error) {
                    console.error("Error copying URL to clipboard:", error);
                    // Fallback for older browsers
                    try {
                      const textArea = document.createElement("textarea");
                      textArea.value = audio.audio_url;
                      textArea.style.position = "fixed";
                      textArea.style.opacity = "0";
                      document.body.appendChild(textArea);
                      textArea.select();
                      document.execCommand("copy");
                      document.body.removeChild(textArea);
                      toast.success("URL copied to clipboard");
                    } catch (fallbackError) {
                      console.error("Fallback copy failed:", fallbackError);
                      toast.error("Failed to copy URL");
                    }
                  }
                }
              },
              disabled: audio.audio_url === "uploading" || !audio.audio_url,
            },
            {
              separator: true,
              label: "",
              onClick: () => {},
            },
            {
              label: "Delete",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => onDelete(audio.id),
              destructive: true,
              disabled: audio.audio_url === "uploading",
            },
          ]}
          showDelete={false}
          disabled={audio.audio_url === "uploading"}
        />
      </div>
    </div>
  );
}
