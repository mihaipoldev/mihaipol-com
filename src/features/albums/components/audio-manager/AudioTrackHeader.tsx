"use client";

import { useState, useRef } from "react";
import { Play, Pause } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { formatRelativeTime } from "./utils/formatRelativeTime";
import type { AudioTrackHeaderProps } from "./types";

export function AudioTrackHeader({
  audio,
  isPlaying,
  isWaveformReady,
  onPlayPause,
  onTitleUpdate,
  albumId,
}: AudioTrackHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(audio.title || "");
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const handleTitleClick = () => {
    setIsEditingTitle(true);
    setEditingTitle(audio.title || "");
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const handleTitleSave = async () => {
    if (isSavingTitle) return;

    const newTitle = editingTitle.trim() || null;
    if (newTitle === (audio.title || null)) {
      setIsEditingTitle(false);
      return;
    }

    setIsSavingTitle(true);

    // Update local state immediately
    onTitleUpdate(audio.id, newTitle);

    // Save to database if album ID is available
    if (albumId && albumId !== "new" && albumId !== "temp" && !audio.id.startsWith("temp-")) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;

        const response = await fetch("/api/admin/albums/audios", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            id: audio.id,
            title: newTitle,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update title");
        }
      } catch (error: any) {
        console.error("Error updating title:", error);
        toast.error(error.message || "Failed to update title");
        // Revert on error
        setEditingTitle(audio.title || "");
      }
    }

    setIsSavingTitle(false);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === "Escape") {
      setEditingTitle(audio.title || "");
      setIsEditingTitle(false);
    }
  };

  return (
    <div className="flex items-center gap-3 pb-3 relative z-10">
      {/* Play/Pause Button - Smaller with bigger solid icon, foreground color */}
      {audio.audio_url && audio.audio_url !== "uploading" && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPlayPause(e);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          disabled={!isWaveformReady}
          className="h-10 w-10 flex-shrink-0 rounded-full bg-foreground hover:bg-foreground/90 active:bg-foreground/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-6 w-6 text-background fill-background" />
          ) : (
            <Play className="h-6 w-6 text-background fill-background ml-0.5" />
          )}
        </button>
      )}

      {/* Title - Editable */}
      <div className="flex-1 min-w-0">
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            className="w-full text-base font-medium bg-transparent border-b border-primary focus:outline-none focus:border-primary"
            placeholder="Track 1"
            disabled={isSavingTitle}
            aria-label="Edit track title"
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            onClick={handleTitleClick}
            onMouseDown={(e) => e.stopPropagation()}
            className={cn(
              "text-base font-medium cursor-text hover:text-primary transition-colors truncate",
              !audio.title && "text-muted-foreground italic"
            )}
            title="Click to edit title"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleTitleClick();
              }
            }}
            aria-label={`Edit title for ${audio.title || `Track ${(audio.sort_order || 0) + 1}`}`}
          >
            {audio.title || `Track ${(audio.sort_order || 0) + 1}`}
          </div>
        )}
      </div>

      {/* Right side: Upload date and Tag */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {/* Upload date - Top Right */}
        <div className="text-xs text-muted-foreground">
          {formatRelativeTime(audio.created_at)}
        </div>
        {/* Tags - Below upload date */}
        <div className="flex flex-col items-end gap-1">
          {audio.content_group && (
            <Badge variant="secondary" className="text-xs">
              # {audio.content_group}
            </Badge>
          )}
          <Badge variant={audio.is_public ? "default" : "outline"} className="text-xs">
            {audio.is_public ? "Public" : "Private"}
          </Badge>
        </div>
      </div>
    </div>
  );
}
