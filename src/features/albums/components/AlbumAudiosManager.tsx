"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { X, Plus, GripVertical, Pencil, Trash2, Music, Play, Pause, Loader2, Star, ExternalLink, Download, Copy } from "lucide-react";
import WaveSurfer from "wavesurfer.js";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShadowInput } from "@/components/admin/forms/ShadowInput";
import { ShadowButton } from "@/components/admin/forms/ShadowButton";
import { Label } from "@/components/ui/label";
import { ModalShell } from "@/components/ui/modal-shell";
import { DialogFooter } from "@/components/ui/dialog";
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
import { AudioUploadField } from "@/components/admin/forms/AudioUploadField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/forms/AdminSelect";
import { ActionMenu, type CustomMenuItem } from "@/components/admin/ui/ActionMenu";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import type { AlbumAudio } from "@/features/albums/types";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type AlbumAudiosManagerProps = {
  audios: AlbumAudio[];
  onChange: (audios: AlbumAudio[]) => void;
  folderPath: string;
};

type SortableAudioItemProps = {
  audio: AlbumAudio;
  onEdit: (audio: AlbumAudio) => void;
  onDelete: (id: string) => void;
  onUpdate: (audio: AlbumAudio) => void;
  onTitleUpdate: (id: string, title: string | null) => void;
  albumId: string | null;
};

function SortableAudioItem({
  audio,
  onEdit,
  onDelete,
  onUpdate,
  onTitleUpdate,
  albumId,
}: SortableAudioItemProps) {
  const { theme, resolvedTheme } = useTheme();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: audio.id,
    disabled: audio.audio_url === "uploading",
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isWaveformReady, setIsWaveformReady] = useState(false);
  const [containerReady, setContainerReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDraggingMarker, setIsDraggingMarker] = useState(false);
  const [markerDragPosition, setMarkerDragPosition] = useState<number | null>(null);
  const [savedHighlightTime, setSavedHighlightTime] = useState<number | null>(audio.highlight_start_time ?? null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(audio.title || "");
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const lastContextMenuEventRef = useRef<React.MouseEvent<HTMLDivElement> | null>(null);
  const markerContextMenuEventRef = useRef<React.MouseEvent<HTMLDivElement> | null>(null);

  // Update savedHighlightTime when audio prop changes (but only if not dragging)
  useEffect(() => {
    if (!isDraggingMarker && audio.highlight_start_time !== savedHighlightTime) {
      setSavedHighlightTime(audio.highlight_start_time ?? null);
    }
  }, [audio.highlight_start_time, isDraggingMarker, savedHighlightTime]);

  // Callback ref to know when container is mounted
  const setWaveformRef = (node: HTMLDivElement | null) => {
    waveformRef.current = node;
    setContainerReady(!!node);
  };

  // Lazy load waveform when card becomes visible
  useEffect(() => {
    if (!cardRef.current || !audio.audio_url || audio.audio_url === "uploading") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // Start loading 200px before visible
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [audio.audio_url]);

  // Handle waveform resize to recalculate marker position
  useEffect(() => {
    if (!waveformRef.current || !isWaveformReady) return;

    const resizeObserver = new ResizeObserver(() => {
      // Force re-render to recalculate marker position
      // This is handled by getMarkerPosition() which reads current dimensions
    });

    resizeObserver.observe(waveformRef.current);
    return () => resizeObserver.disconnect();
  }, [isWaveformReady]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

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

  // Initialize WaveSurfer (only when visible)
  useEffect(() => {
    if (!audio.audio_url || audio.audio_url === "uploading" || !containerReady || !waveformRef.current || !isVisible) {
      return;
    }

    const container = waveformRef.current;
    
    // Ensure container has dimensions - wait for next frame if needed
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      const timeoutId = setTimeout(() => {
        // This will cause the effect to re-run if container gets dimensions
      }, 200);
      return () => clearTimeout(timeoutId);
    }

    // Destroy existing instance if URL changed
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }

    setIsWaveformReady(false);

    // Determine if dark mode is active
    // Use resolvedTheme if available (handles system theme), otherwise check theme directly
    const isDark = resolvedTheme === "dark" || 
      (resolvedTheme === undefined && theme === "dark") ||
      (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    // Set colors based on theme
    // In dark mode: use bright light color for visibility on dark background
    // In light mode: use darker color for visibility on light background
    const waveColor = isDark 
      ? "#ffffff" // Pure white in dark mode for maximum visibility
      : "hsl(var(--muted-foreground) / 0.8)"; // Darker color in light mode
    
    // Progress color - the part that shows where music has already played
    // Get the computed primary color value from document root to ensure it's applied correctly
    let progressColor = "hsl(var(--primary))";
    let cursorColor = "hsl(var(--primary))";
    
    // Try to get the actual computed primary color value
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      try {
        const rootStyle = window.getComputedStyle(document.documentElement);
        const primaryValue = rootStyle.getPropertyValue("--primary").trim();
        if (primaryValue) {
          // Use the actual HSL value
          progressColor = `hsl(${primaryValue})`;
          cursorColor = `hsl(${primaryValue})`;
        }
      } catch (e) {
        // Could not get computed primary color
      }
    }

    // Create WaveSurfer instance
    const wavesurfer = WaveSurfer.create({
      container: container,
      waveColor: waveColor,
      progressColor: progressColor,
      cursorColor: cursorColor,
      barWidth: 3,
      barRadius: 3,
      height: 60,
      normalize: true,
      interact: true,
      cursorWidth: 2,
      barGap: 2, // Increased gap = fewer bars = faster rendering
      sampleRate: 8000, // Lower sample rate = faster decoding
    });

    wavesurferRef.current = wavesurfer;

    // Event handlers
    wavesurfer.on("ready", () => {
      setIsWaveformReady(true);
    });

    wavesurfer.on("play", () => {
      setIsPlaying(true);
    });

    wavesurfer.on("pause", () => {
      setIsPlaying(false);
    });

    wavesurfer.on("finish", () => {
      setIsPlaying(false);
    });

    wavesurfer.on("error", (error) => {
      console.error("WaveSurfer error:", error);
      setIsWaveformReady(false);
    });

    wavesurfer.on("loading", (progress) => {
      // Loading progress
    });

    wavesurfer.on("decode", async () => {
      // If peaks don't exist in DB, generate and save them
      if (!audio.waveform_peaks && wavesurferRef.current) {
        try {
          const peaks = (wavesurferRef.current as any).exportPCM(1024, 0, true); // Export peaks
          
          // Save peaks to database
          const response = await fetch(`/api/admin/albums/audios/${audio.id}/peaks`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ peaks }),
          });
          
          if (!response.ok) {
            // Failed to save peaks
          }
        } catch (error) {
          // Error saving peaks
        }
      }
    });

    // Use proxy URL to bypass CORS
    const proxyUrl = `/api/proxy/audio?url=${encodeURIComponent(audio.audio_url)}`;

    // Load audio with pre-computed peaks if available (much faster!)
    try {
      if (audio.waveform_peaks && audio.waveform_peaks.length > 0) {
        wavesurfer.load(proxyUrl, audio.waveform_peaks as any);
      } else {
        wavesurfer.load(proxyUrl);
      }
    } catch (error) {
      console.error("Error loading audio:", error, { proxyUrl, audioUrl: audio.audio_url });
      setIsWaveformReady(false);
    }

    // Cleanup
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
      setIsWaveformReady(false);
      setIsPlaying(false);
    };
  }, [audio.audio_url, containerReady, isVisible, theme, resolvedTheme]);

  const handlePlayPause = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (!wavesurferRef.current || !isWaveformReady) {
      console.warn("WaveSurfer not ready:", { 
        hasInstance: !!wavesurferRef.current, 
        isReady: isWaveformReady,
        audioUrl: audio.audio_url 
      });
      return;
    }
    try {
      wavesurferRef.current.playPause();
    } catch (error) {
      console.error("Error playing/pausing audio:", error);
    }
  };

  const handleContextMenuOpenChange = (open: boolean) => {
    // When menu closes without selection, clear the stored event
    if (!open) {
      lastContextMenuEventRef.current = null;
    }
  };

  const handleSetHighlight = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!wavesurferRef.current || !isWaveformReady || !waveformRef.current || !lastContextMenuEventRef.current) return;
    
    // Calculate time from the stored right-click event
    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = lastContextMenuEventRef.current.clientX - rect.left;
    
    const duration = wavesurferRef.current.getDuration();
    if (!duration) return;
    
    const clickTime = Math.max(0, Math.min(duration, (clickX / rect.width) * duration));
    
    const updatedAudio: AlbumAudio = {
      ...audio,
      highlight_start_time: clickTime,
    };
    onUpdate(updatedAudio);
    
    // Clear the stored event
    lastContextMenuEventRef.current = null;
  };

  const handleContextMenuTrigger = (e: React.MouseEvent<HTMLDivElement>) => {
    // Store the event so we can calculate the time when the menu item is clicked
    lastContextMenuEventRef.current = e;
  };

  // Calculate marker position based on highlight_start_time
  const getMarkerPosition = (): number | null => {
    // Use savedHighlightTime instead of audio.highlight_start_time to prevent jumping
    const highlightTime = isDraggingMarker && markerDragPosition !== null 
      ? markerDragPosition 
      : savedHighlightTime;
      
    if (!highlightTime || !isWaveformReady || !wavesurferRef.current || !waveformRef.current) {
      return null;
    }

    const duration = wavesurferRef.current.getDuration();
    if (!duration || duration === 0) return null;

    const waveformWidth = waveformRef.current.offsetWidth;
    if (!waveformWidth || waveformWidth === 0) return null;

    return (highlightTime / duration) * waveformWidth;
  };

  // Handle marker drag start
  const handleMarkerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!wavesurferRef.current || !isWaveformReady || !waveformRef.current) return;
    
    setIsDraggingMarker(true);
    const duration = wavesurferRef.current.getDuration();
    if (duration && savedHighlightTime !== null) {
      setMarkerDragPosition(savedHighlightTime);
    }
  };

  // Handle marker drag move
  useEffect(() => {
    if (!isDraggingMarker) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!wavesurferRef.current || !waveformRef.current) return;

      const rect = waveformRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const waveformWidth = rect.width;
      const duration = wavesurferRef.current.getDuration();

      if (!duration || waveformWidth === 0) return;

      // Clamp to waveform bounds
      const clampedX = Math.max(0, Math.min(waveformWidth, mouseX));
      const newTime = (clampedX / waveformWidth) * duration;
      
      setMarkerDragPosition(newTime);
    };

    const handleMouseUp = async () => {
      const currentPosition = markerDragPosition;
      setIsDraggingMarker(false);
      
      // Update highlight_start_time on release
      if (wavesurferRef.current && isWaveformReady && currentPosition !== null) {
        // Update local saved state immediately to prevent jumping
        setSavedHighlightTime(currentPosition);
        setMarkerDragPosition(null);
        
        const updatedAudio: AlbumAudio = {
          ...audio,
          highlight_start_time: currentPosition,
        };
        
        // Update parent state
        onUpdate(updatedAudio);
        
        // Save to Supabase if audio has a real ID (not temp)
        if (audio.id && !audio.id.startsWith("temp-")) {
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
                highlight_start_time: currentPosition,
              }),
            });
              
            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || "Failed to save highlight start time");
            }
            
            // After successful save, update savedHighlightTime to match database
            setSavedHighlightTime(currentPosition);
          } catch (error: any) {
            console.error("Error saving highlight start time:", error);
            toast.error(error.message || "Failed to save highlight start time");
            // Revert to previous value on error
            setSavedHighlightTime(audio.highlight_start_time ?? null);
          }
        } else {
          // For temp items, just clear drag position
          setMarkerDragPosition(null);
        }
      } else {
        setMarkerDragPosition(null);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingMarker, markerDragPosition, isWaveformReady, audio.id, savedHighlightTime, onUpdate]);

  // Handle marker context menu
  const handleMarkerContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    markerContextMenuEventRef.current = e;
  };

  const handleMarkerContextMenuOpenChange = (open: boolean) => {
    if (!open) {
      markerContextMenuEventRef.current = null;
    }
  };

  const handleMarkerEdit = () => {
    onEdit(audio);
  };

  const handleMarkerRemove = () => {
    const updatedAudio: AlbumAudio = {
      ...audio,
      highlight_start_time: null,
    };
    onUpdate(updatedAudio);
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        cardRef.current = node;
      }}
      style={style}
      className={cn(
        "relative flex items-center gap-4 p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow",
        isDragging && "shadow-lg opacity-50",
        audio.audio_url === "uploading" && "cursor-not-allowed"
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-5 w-5" />
      </div>
      {/* Play/Pause Button - Left */}
      {audio.audio_url && audio.audio_url !== "uploading" && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            handlePlayPause(e);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          disabled={!isWaveformReady}
          className="h-12 w-12 flex-shrink-0 relative z-10"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>
      )}

      {/* Middle Section - Content */}
      <div className="flex-1 min-w-0 space-y-2 relative z-10">
        {/* Title - Editable */}
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
              "text-base font-medium cursor-text hover:text-primary transition-colors",
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

        {/* Metadata Line */}
        <div className="text-sm text-muted-foreground">
          {[
            audio.duration !== null && `Duration: ${formatDuration(audio.duration)}`,
            audio.file_size !== null && formatFileSize(audio.file_size) && `Size: ${formatFileSize(audio.file_size)}`,
            audio.highlight_start_time !== null && `Highlight: ${formatDuration(audio.highlight_start_time)}`,
          ]
            .filter(Boolean)
            .join(" · ")}
          {audio.audio_url === "uploading" && (
            <Badge variant="outline" className="text-xs ml-2">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Uploading...
            </Badge>
          )}
          {audio.content_group && (
            <Badge variant="secondary" className="text-xs ml-2">
              {audio.content_group}
            </Badge>
          )}
        </div>

        {/* Waveform */}
        {audio.audio_url && audio.audio_url !== "uploading" && (
          <div className="relative">
            <ContextMenu onOpenChange={handleContextMenuOpenChange}>
              <ContextMenuTrigger asChild>
                <div 
                  ref={setWaveformRef} 
                  className="w-full rounded overflow-hidden cursor-pointer"
                  style={{ minHeight: "60px" }}
                  onContextMenu={handleContextMenuTrigger}
                />
              </ContextMenuTrigger>
              <ContextMenuContent
                className="px-0 py-2 border-0 w-48 bg-foreground"
                style={{
                  boxShadow: 'rgba(0, 0, 0, 0.2) 0px 2px 4px -1px, rgba(0, 0, 0, 0.14) 0px 4px 5px 0px, rgba(0, 0, 0, 0.12) 0px 1px 10px 0px'
                }}
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <ContextMenuItem
                  onClick={handleSetHighlight}
                  className="cursor-pointer !rounded-none px-4 py-2"
                >
                  <Star className="mr-2 h-4 w-4" />
                  Set to highlight
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
            {!isWaveformReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded pointer-events-none">
                <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
              </div>
            )}
            {/* Highlight Marker */}
            {(() => {
              const markerPos = getMarkerPosition();
              if (markerPos === null) return null;

              return (
                <ContextMenu onOpenChange={handleMarkerContextMenuOpenChange}>
                  <ContextMenuTrigger asChild>
                    <div
                      onMouseDown={handleMarkerMouseDown}
                      onContextMenu={handleMarkerContextMenu}
                      className={cn(
                        "absolute z-10 transition-all duration-200",
                        "cursor-grab active:cursor-grabbing",
                        "hover:scale-110",
                        isDraggingMarker && "scale-110 opacity-100 cursor-grabbing"
                      )}
                      style={{
                        left: `${markerPos}px`,
                        bottom: "-12px",
                        transform: `translateX(-50%)`,
                      }}
                    >
                      <div className="flex flex-col-reverse items-center">
                        {/* Triangle pointing up (corner at top, base at bottom) */}
                        <div
                          className={cn(
                            "w-0 h-0 transition-all duration-200",
                            "border-l-[7px] border-r-[7px] border-b-[10px]",
                            "border-l-transparent border-r-transparent",
                            "border-b-slate-300 dark:border-b-primary/80",
                            "hover:border-b-primary dark:hover:border-b-primary",
                            isDraggingMarker && "border-b-primary dark:border-b-primary"
                          )}
                          style={{
                            filter: isDraggingMarker 
                              ? "drop-shadow(0 3px 6px rgba(0, 0, 0, 0.25))" 
                              : "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))"
                          }}
                        />
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent
                    className="px-0 py-2 border-0 w-48 bg-foreground"
                    style={{
                      boxShadow: 'rgba(0, 0, 0, 0.2) 0px 2px 4px -1px, rgba(0, 0, 0, 0.14) 0px 4px 5px 0px, rgba(0, 0, 0, 0.12) 0px 1px 10px 0px'
                    }}
                    onCloseAutoFocus={(e) => e.preventDefault()}
                  >
                    <ContextMenuItem
                      onClick={handleMarkerEdit}
                      className="cursor-pointer !rounded-none px-4 py-2"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={handleMarkerRemove}
                      className="cursor-pointer !rounded-none px-4 py-2 text-destructive focus:text-destructive"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Remove highlight
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })()}
          </div>
        )}
      </div>

      {/* Actions - Right */}
      <div className="flex items-center flex-shrink-0 relative z-10" onMouseDown={(e) => e.stopPropagation()}>
        <ActionMenu
          itemId={audio.id}
          customItems={[
            {
              label: "Edit",
              icon: <Pencil className="h-4 w-4" />,
              onClick: () => onEdit(audio),
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

export function AlbumAudiosManager({
  audios,
  onChange,
  folderPath,
}: AlbumAudiosManagerProps) {
  // Extract album ID from folderPath (format: "albums/{id}")
  const albumId = folderPath.startsWith("albums/") 
    ? folderPath.replace("albums/", "") 
    : null;

  const [localAudios, setLocalAudios] = useState<AlbumAudio[]>(
    [...audios].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAudio, setEditingAudio] = useState<AlbumAudio | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAudioUrl, setEditAudioUrl] = useState<string | null>(null);
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const [editDuration, setEditDuration] = useState<number | null>(null);
  const [editFileSize, setEditFileSize] = useState<number | null>(null);
  const [editHighlightStartTime, setEditHighlightStartTime] = useState<string>("");
  const [editContentGroup, setEditContentGroup] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [audioToDelete, setAudioToDelete] = useState<AlbumAudio | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync local audios when prop changes (but don't overwrite optimistic updates)
  useEffect(() => {
    setLocalAudios((current) => {
      // If we have optimistic updates (items with audio_url === "uploading"), preserve them
      const optimisticItems = current.filter((audio) => audio.audio_url === "uploading");
      const propItems = [...audios].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      
      // Merge: keep optimistic items, add/update prop items
      const merged = [...propItems];
      optimisticItems.forEach((optimistic) => {
        const existingIndex = merged.findIndex((a) => a.id === optimistic.id);
        if (existingIndex >= 0) {
          merged[existingIndex] = optimistic; // Keep optimistic version
        } else {
          merged.push(optimistic); // Add optimistic item
        }
      });
      
      return merged.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    });
  }, [audios]);

  // Notify parent of changes
  const updateAudios = (updatedAudios: AlbumAudio[]) => {
    setLocalAudios(updatedAudios);
    onChange(updatedAudios);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localAudios.findIndex((audio) => audio.id === active.id);
      const newIndex = localAudios.findIndex((audio) => audio.id === over.id);

      const reorderedAudios = arrayMove(localAudios, oldIndex, newIndex);
      // Update sort_order for all audios
      const updatedAudios = reorderedAudios.map((audio, index) => ({
        ...audio,
        sort_order: index,
      }));

      // Update local state immediately for responsive UI
      updateAudios(updatedAudios);

      // Save to database immediately if album ID is available
      if (albumId && albumId !== "new" && albumId !== "temp") {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData?.session?.access_token;

          const response = await fetch("/api/admin/albums/audios", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({
              albumId: albumId,
              audios: updatedAudios
                .filter((audio) => !audio.id.startsWith("temp-")) // Only save real audios
                .map((audio) => ({
                  id: audio.id,
                  title: audio.title || null,
                  audio_url: audio.audio_url,
                  duration: audio.duration ?? null,
                  file_size: audio.file_size ?? null,
                  highlight_start_time: audio.highlight_start_time ?? null,
                  content_group: audio.content_group || null,
                  sort_order: audio.sort_order,
                })),
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            console.error("Error saving audio order:", error);
            toast.error("Failed to save audio order");
          }
        } catch (error: any) {
          console.error("Error saving audio order:", error);
          toast.error("Failed to save audio order");
        }
      }
    }
  };

  const handleDelete = (id: string) => {
    const audio = localAudios.find((a) => a.id === id);
    if (audio) {
      setAudioToDelete(audio);
    }
  };

  const confirmDelete = async () => {
    if (!audioToDelete) return;
    
    // Skip API call for temporary/optimistic items (they're not in the database yet)
    if (audioToDelete.id.startsWith("temp-")) {
      const updatedAudios = localAudios.filter((audio) => audio.id !== audioToDelete.id);
      const reorderedAudios = updatedAudios.map((audio, index) => ({
        ...audio,
        sort_order: index,
      }));
      updateAudios(reorderedAudios);
      setAudioToDelete(null);
      return;
    }

    setIsDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await fetch(`/api/admin/albums/audios?id=${audioToDelete.id}`, {
        method: "DELETE",
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete audio");
      }

      // Remove from local state after successful deletion
      const updatedAudios = localAudios.filter((audio) => audio.id !== audioToDelete.id);
      // Recalculate sort_order after deletion
      const reorderedAudios = updatedAudios.map((audio, index) => ({
        ...audio,
        sort_order: index,
      }));
      updateAudios(reorderedAudios);
      
      toast.success("Audio deleted successfully");
      setAudioToDelete(null);
    } catch (error: any) {
      console.error("Error deleting audio:", error);
      toast.error(error.message || "Failed to delete audio");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (audio: AlbumAudio) => {
    setEditingAudio(audio);
    setEditTitle(audio.title || "");
    setEditAudioUrl(audio.audio_url);
    setEditDuration(audio.duration);
    setEditFileSize(audio.file_size);
    setEditHighlightStartTime(audio.highlight_start_time?.toString() || "");
    setEditContentGroup(audio.content_group || "");
    setEditSelectedFile(null);
    setIsEditModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingAudio(null);
    setEditTitle("");
    setEditAudioUrl(null);
    setEditDuration(null);
    setEditFileSize(null);
    setEditHighlightStartTime("");
    setEditContentGroup("");
    setEditSelectedFile(null);
    setIsEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!editAudioUrl && !editSelectedFile) {
      alert("Please select an audio file");
      return; // Need either URL or file
    }

    // Parse highlight start time
    const highlightStartTime = editHighlightStartTime.trim()
      ? parseFloat(editHighlightStartTime)
      : null;

    let tempAudioId: string | null = null;

    // If uploading a new file, do optimistic update
    if (editSelectedFile && !editingAudio) {
      setIsUploading(true);
      // Create temporary audio item immediately
      tempAudioId = `temp-${Date.now()}`;
      setLocalAudios((current) => {
        const optimisticAudio: AlbumAudio = {
          id: tempAudioId!,
          album_id: "", // Will be set by parent
          title: editTitle || null,
          audio_url: "uploading", // Special marker for uploading state
          duration: editDuration,
          file_size: editFileSize || editSelectedFile.size,
          highlight_start_time: highlightStartTime,
          content_group: editContentGroup.trim() || null,
          sort_order: current.length,
        };
        const updatedAudios = [...current, optimisticAudio];
        onChange(updatedAudios);
        return updatedAudios;
      });
      // Close modal immediately for better UX
      setIsEditModalOpen(false);
    }

    let finalAudioUrl = editAudioUrl;
    let finalDuration = editDuration;
    let finalFileSize = editFileSize;

    // Upload file if selected
    if (editSelectedFile) {
      try {
        const formData = new FormData();
        formData.append("file", editSelectedFile);
        formData.append("folderPath", folderPath);
        const uploadResponse = await fetch("/api/admin/upload/audio", {
          method: "POST",
          body: formData,
        });
        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.error || "Failed to upload audio");
        }
        const uploadData = await uploadResponse.json();
        finalAudioUrl = uploadData.url;
        // Use metadata from upload response if available, otherwise keep client-side extracted values
        if (uploadData.duration !== undefined && uploadData.duration !== null) {
          finalDuration = uploadData.duration;
        }
        if (uploadData.fileSize !== undefined && uploadData.fileSize !== null) {
          finalFileSize = uploadData.fileSize;
        }
        // Always ensure we have file size from the file itself as fallback
        if (finalFileSize === null || finalFileSize === undefined) {
          finalFileSize = editSelectedFile.size;
        }
      } catch (uploadError: any) {
        console.error("Error uploading audio:", uploadError);
        // Remove optimistic update on error using functional update
        if (tempAudioId) {
          setLocalAudios((current) => {
            const updatedAudios = current.filter((audio) => audio.id !== tempAudioId);
            onChange(updatedAudios);
            return updatedAudios;
          });
        }
        setIsUploading(false);
        alert(uploadError.message || "Failed to upload audio");
        setIsEditModalOpen(true); // Reopen modal on error
        return;
      }
    }

    if (!finalAudioUrl) {
      // Remove optimistic update on error using functional update
      if (tempAudioId) {
        setLocalAudios((current) => {
          const updatedAudios = current.filter((audio) => audio.id !== tempAudioId);
          onChange(updatedAudios);
          return updatedAudios;
        });
      }
      setIsUploading(false);
      alert("Failed to get audio URL");
      setIsEditModalOpen(true); // Reopen modal on error
      return;
    }

    if (editingAudio) {
      // Update existing audio - save to database immediately if it has a real ID
      if (editingAudio.id && !editingAudio.id.startsWith("temp-")) {
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
              id: editingAudio.id,
              title: editTitle || null,
              audio_url: finalAudioUrl!,
              duration: finalDuration,
              file_size: finalFileSize,
              highlight_start_time: highlightStartTime,
              content_group: editContentGroup.trim() || null,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to update audio");
          }

          const updatedAudioData = await response.json();

          // Update local state with response data
          const updatedAudios = localAudios.map((audio) =>
            audio.id === editingAudio.id
              ? {
                  ...updatedAudioData,
                  // Preserve any local state
                  title: editTitle || null,
                  audio_url: finalAudioUrl!,
                  duration: finalDuration,
                  file_size: finalFileSize,
                  highlight_start_time: highlightStartTime,
                  content_group: editContentGroup.trim() || null,
                }
              : audio
          );
          updateAudios(updatedAudios);
          toast.success("Audio updated successfully");
        } catch (updateError: any) {
          console.error("Error updating audio:", updateError);
          toast.error(updateError.message || "Failed to update audio");
          setIsEditModalOpen(true); // Keep modal open on error
          return;
        }
      } else {
        // Temporary audio - just update local state
        const updatedAudios = localAudios.map((audio) =>
          audio.id === editingAudio.id
            ? {
                ...audio,
                title: editTitle || null,
                audio_url: finalAudioUrl!,
                duration: finalDuration,
                file_size: finalFileSize,
                highlight_start_time: highlightStartTime,
                content_group: editContentGroup.trim() || null,
              }
            : audio
        );
        updateAudios(updatedAudios);
      }
      // Reset and close
      setIsEditModalOpen(false);
      setEditingAudio(null);
      setEditTitle("");
      setEditAudioUrl(null);
      setEditDuration(null);
      setEditFileSize(null);
      setEditHighlightStartTime("");
      setEditContentGroup("");
      setEditSelectedFile(null);
    } else {
      // Create new audio - save to database immediately if album ID is available
      if (albumId && albumId !== "new" && albumId !== "temp") {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData?.session?.access_token;

          const response = await fetch("/api/admin/albums/audios", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({
              album_id: albumId,
              title: editTitle || null,
              audio_url: finalAudioUrl!,
              duration: finalDuration,
              file_size: finalFileSize,
              highlight_start_time: highlightStartTime,
              content_group: editContentGroup.trim() || null,
              sort_order: localAudios.length,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to create audio");
          }

          const createdAudio = await response.json();

          // Update the optimistic audio with real database data
          setLocalAudios((current) => {
            const updatedAudios = current.map((audio) =>
              audio.id === tempAudioId
                ? {
                    ...createdAudio,
                    // Preserve any local state that might not be in the response
                    title: editTitle || null,
                    audio_url: finalAudioUrl!,
                    duration: finalDuration,
                    file_size: finalFileSize,
                    highlight_start_time: highlightStartTime,
                    content_group: editContentGroup.trim() || null,
                  }
                : audio
            );
            // Notify parent of the update
            onChange(updatedAudios);
            return updatedAudios;
          });

          toast.success("Audio added successfully");
        } catch (createError: any) {
          console.error("Error creating audio:", createError);
          // Remove optimistic update on error
          if (tempAudioId) {
            setLocalAudios((current) => {
              const updatedAudios = current.filter((audio) => audio.id !== tempAudioId);
              onChange(updatedAudios);
              return updatedAudios;
            });
          }
          setIsUploading(false);
          toast.error(createError.message || "Failed to create audio");
          setIsEditModalOpen(true); // Reopen modal on error
          return;
        }
      } else {
        // No album ID yet (new album) - just update local state
        setLocalAudios((current) => {
          const updatedAudios = current.map((audio) =>
            audio.id === tempAudioId
              ? {
                  ...audio,
                  title: editTitle || null,
                  audio_url: finalAudioUrl!,
                  duration: finalDuration,
                  file_size: finalFileSize,
                  highlight_start_time: highlightStartTime,
                  content_group: editContentGroup.trim() || null,
                }
              : audio
          );
          // Notify parent of the update
          onChange(updatedAudios);
          return updatedAudios;
        });
      }
      setIsUploading(false);
      // Reset form state
      setEditTitle("");
      setEditAudioUrl(null);
      setEditDuration(null);
      setEditFileSize(null);
      setEditHighlightStartTime("");
      setEditContentGroup("");
      setEditSelectedFile(null);
    }
  };

  const handleCancel = () => {
    setIsEditModalOpen(false);
    setEditingAudio(null);
    setEditTitle("");
    setEditAudioUrl(null);
    setEditDuration(null);
    setEditFileSize(null);
    setEditHighlightStartTime("");
    setEditSelectedFile(null);
  };

  const handleTitleUpdate = (id: string, title: string | null) => {
    const updatedAudios = localAudios.map((audio) =>
      audio.id === id ? { ...audio, title } : audio
    );
    updateAudios(updatedAudios);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <Label className="text-base font-semibold">Audio Content</Label>
        <Button type="button" onClick={handleAddNew} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Audio
        </Button>
      </div>

      {localAudios.length === 0 ? (
        <div
          className={cn(
            "text-sm text-muted-foreground py-12 border-2 border-dashed rounded-lg text-center bg-muted/20 dark:bg-muted/10 backdrop-blur-sm flex flex-col items-center justify-center gap-3"
          )}
        >
          <Music className="h-8 w-8 text-muted-foreground" />
          <span>Click to add audio tracks</span>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={localAudios.map((audio) => audio.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {localAudios.map((audio) => (
                <SortableAudioItem
                  key={audio.id}
                  audio={audio}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onUpdate={(updatedAudio) => {
                    const updatedAudios = localAudios.map((a) =>
                      a.id === updatedAudio.id ? updatedAudio : a
                    );
                    updateAudios(updatedAudios);
                  }}
                  onTitleUpdate={handleTitleUpdate}
                  albumId={albumId}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Edit/Add Modal */}
      <ModalShell
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title={editingAudio ? "Edit Audio" : "Add New Audio"}
        maxWidth="2xl"
        maxHeight="90vh"
        showScroll={true}
        footer={
          <DialogFooter>
            <ShadowButton type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </ShadowButton>
            <ShadowButton
              type="button"
              onClick={handleSave}
              disabled={(!editAudioUrl && !editSelectedFile) || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : editingAudio ? (
                "Update"
              ) : (
                "Add"
              )}
            </ShadowButton>
          </DialogFooter>
        }
      >
        <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title (optional)</Label>
              <ShadowInput
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="e.g., Track 1, Preview"
              />
            </div>

            <div className="space-y-2">
              <Label>Audio File</Label>
              <AudioUploadField
                value={editAudioUrl}
                onChange={(url) => setEditAudioUrl(url)}
                onFileChange={(file) => setEditSelectedFile(file)}
                onMetadataChange={(metadata) => {
                  setEditDuration(metadata.duration);
                  setEditFileSize(metadata.fileSize);
                }}
                folderPath={folderPath}
                placeholder="Upload audio file"
              />
            </div>

            <div className="space-y-2">
              <Label>Highlight Start Time (optional)</Label>
              <ShadowInput
                type="number"
                step="0.1"
                min="0"
                value={editHighlightStartTime}
                onChange={(e) => setEditHighlightStartTime(e.target.value)}
                placeholder="e.g., 15.5 (seconds)"
              />
              <p className="text-xs text-muted-foreground">
                Start time for highlight/preview playback in seconds (supports decimals)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Content Group (optional)</Label>
              <Select
                value={editContentGroup || "__none__"}
                onValueChange={(value) => setEditContentGroup(value === "__none__" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select content group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  <SelectItem value="side_a">Side A</SelectItem>
                  <SelectItem value="side_b">Side B</SelectItem>
                  <SelectItem value="side_c">Side C</SelectItem>
                  <SelectItem value="side_d">Side D</SelectItem>
                  <SelectItem value="main">Main</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
      </ModalShell>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!audioToDelete} onOpenChange={(open) => !open && setAudioToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Audio</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{audioToDelete?.title || "Untitled"}"? This action cannot be undone and the audio file will be moved to trash.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
