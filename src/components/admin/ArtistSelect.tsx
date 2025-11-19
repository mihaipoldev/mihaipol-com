"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Plus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  rectIntersection,
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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ShadowSelect";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CreateArtistModal } from "@/components/admin/CreateArtistModal";

export type Artist = {
  id: string;
  name: string;
  profile_image_url: string | null;
};

export type AlbumArtist = {
  id: string;
  artist_id: string;
  role: "primary" | "featured" | "remixer";
  sort_order: number;
  artist: Artist;
};

type ArtistSelectProps = {
  artists: Artist[];
  selectedArtists: AlbumArtist[];
  onChange: (artists: AlbumArtist[]) => void;
  onArtistsChange?: (artists: Artist[]) => void;
  disabled?: boolean;
};

type SortableArtistTagProps = {
  albumArtist: AlbumArtist;
  onRoleChange: (id: string, role: "primary" | "featured" | "remixer") => void;
  onRemove: (id: string) => void;
};

function SortableArtistTag({ albumArtist, onRoleChange, onRemove }: SortableArtistTagProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: albumArtist.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [isRolePopoverOpen, setIsRolePopoverOpen] = useState(false);

  const roleLabels: Record<"primary" | "featured" | "remixer", string> = {
    primary: "Primary",
    featured: "Featured",
    remixer: "Remixer",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-1.5 px-1 py-1 rounded-sm border bg-muted/20 dark:bg-muted/10 backdrop-blur-sm",
        isDragging ? "shadow-lg z-50" : "shadow-sm"
      )}
    >
      {/* Draggable Area - Icon and Name */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing flex-1 min-w-0 touch-none"
        style={{ touchAction: "none" }}
      >
        {/* Artist Image */}
        {albumArtist.artist.profile_image_url ? (
          <img
            src={albumArtist.artist.profile_image_url}
            alt={albumArtist.artist.name}
            className="w-5 h-5 rounded-[8px] object-cover shrink-0"
          />
        ) : (
          <div className="w-5 h-5 rounded bg-muted flex items-center justify-center text-[10px] shrink-0">
            {albumArtist.artist.name?.[0] || "?"}
          </div>
        )}

        {/* Artist Name */}
        <span className="text-xs font-medium truncate">{albumArtist.artist.name}</span>
      </div>

      {/* Role Label - Clickable */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0"
      >
        <Popover open={isRolePopoverOpen} onOpenChange={setIsRolePopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="text-xs px-1.5 py-0.5 rounded bg-muted/50 hover:bg-muted/70 transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {roleLabels[albumArtist.role]}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[120px] p-1 bg-background/50 backdrop-blur-md border !shadow-[0px_1px_1px_0px_rgba(16,17,26,0.08)] dark:!shadow-[0px_1px_1px_0px_rgba(255,255,255,0.08)]"
            align="start"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="space-y-0.5">
              {(["primary", "featured", "remixer"] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    onRoleChange(albumArtist.id, role);
                    setIsRolePopoverOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-2 py-1.5 text-xs rounded hover:bg-background/80 transition-colors focus:outline-none focus:bg-transparent",
                    albumArtist.role === role && "bg-background/80 font-medium"
                  )}
                >
                  {roleLabels[role]}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Remove Button */}
      <div className="mr-0.5 flex items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(albumArtist.id)}
          className="h-5 w-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
          title="Remove artist"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function ArtistSelect({
  artists: initialArtists,
  selectedArtists,
  onChange,
  onArtistsChange,
  disabled = false,
}: ArtistSelectProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isCreateArtistModalOpen, setIsCreateArtistModalOpen] = useState(false);
  // Manage artists list locally to avoid triggering parent updates
  const [localArtists, setLocalArtists] = useState<Artist[]>(initialArtists);

  // Sync with prop changes
  useEffect(() => {
    setLocalArtists(initialArtists);
  }, [initialArtists]);

  // Get available artists (not already selected)
  const selectedArtistIds = new Set(selectedArtists.map((aa) => aa.artist_id));
  const availableArtists = useMemo(() => {
    return localArtists
      .filter((artist) => !selectedArtistIds.has(artist.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [localArtists, selectedArtistIds]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = selectedArtists.findIndex((aa) => aa.id === active.id);
      const newIndex = selectedArtists.findIndex((aa) => aa.id === over.id);

      const reorderedArtists = arrayMove(selectedArtists, oldIndex, newIndex);
      // Update sort_order for all artists
      const updatedArtists = reorderedArtists.map((aa, index) => ({
        ...aa,
        sort_order: index,
      }));

      onChange(updatedArtists);
    }
  };

  const handleArtistSelect = (artistId: string) => {
    const artist = localArtists.find((a) => a.id === artistId);
    if (!artist) return;

    const newAlbumArtist: AlbumArtist = {
      id: `temp-${Date.now()}-${artistId}`,
      artist_id: artistId,
      role: "primary",
      sort_order: selectedArtists.length,
      artist,
    };

    const updatedArtists = [...selectedArtists, newAlbumArtist];
    onChange(updatedArtists);
    setIsPopoverOpen(false);
  };

  const handleRoleChange = (id: string, role: "primary" | "featured" | "remixer") => {
    const updatedArtists = selectedArtists.map((aa) => (aa.id === id ? { ...aa, role } : aa));
    onChange(updatedArtists);
  };

  const handleRemove = (id: string) => {
    const updatedArtists = selectedArtists
      .filter((aa) => aa.id !== id)
      .map((aa, index) => ({ ...aa, sort_order: index }));
    onChange(updatedArtists);
  };

  const handleArtistCreated = (newArtist: {
    id: string;
    name: string;
    profile_image_url: string | null;
  }) => {
    // Add new artist to the local list only
    const updatedArtists = [...localArtists, newArtist as Artist].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    setLocalArtists(updatedArtists);

    // Update parent asynchronously to prevent form submission
    // Use requestAnimationFrame to defer until after any pending form submissions
    if (onArtistsChange) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          onArtistsChange(updatedArtists);
        });
      });
    }

    // Automatically add the newly created artist to selected artists
    const newAlbumArtist: AlbumArtist = {
      id: `temp-${Date.now()}-${newArtist.id}`,
      artist_id: newArtist.id,
      role: "primary",
      sort_order: selectedArtists.length,
      artist: newArtist as Artist,
    };
    const updatedSelectedArtists = [...selectedArtists, newAlbumArtist];
    onChange(updatedSelectedArtists);

    // Close the create artist modal but keep the artist selection popover open
    setIsCreateArtistModalOpen(false);
  };

  return (
    <>
      {/* Selected Artists Tags with Add Button */}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <div className="relative">
          <PopoverTrigger asChild>
            <div className="relative">
              {selectedArtists.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={rectIntersection}
                  onDragStart={() => {
                    // Prevent body scroll during drag
                    document.body.style.overflow = "hidden";
                  }}
                  onDragEnd={(event) => {
                    // Restore body scroll after drag
                    document.body.style.overflow = "";
                    handleDragEnd(event);
                  }}
                  onDragCancel={() => {
                    // Restore body scroll if drag is cancelled
                    document.body.style.overflow = "";
                  }}
                >
                  <SortableContext
                    items={selectedArtists.map((aa) => aa.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div
                      className="flex flex-wrap gap-1.5 p-[6px] md:p-[6px] pr-10 min-h-[44px] rounded-md border border-input bg-transparent text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 !shadow-[0px_1px_1px_0px_rgba(16,17,26,0.08)] dark:!shadow-[0px_1px_1px_0px_rgba(255,255,255,0.08)] hover:!shadow-[0px_1px_1px_0px_rgba(16,17,26,0.16)] dark:hover:!shadow-[0px_1px_1px_0px_rgba(255,255,255,0.12)] cursor-pointer"
                      onClick={(e) => {
                        // Only open if clicking on the container itself or empty space, not on tags
                        const target = e.target as HTMLElement;
                        const isTag = target.closest("[data-artist-tag]");
                        if (isTag) {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                    >
                      {selectedArtists.map((albumArtist) => (
                        <div
                          key={albumArtist.id}
                          data-artist-tag
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SortableArtistTag
                            albumArtist={albumArtist}
                            onRoleChange={handleRoleChange}
                            onRemove={handleRemove}
                          />
                        </div>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="p-[6px] md:p-[6px] pr-10 min-h-[44px] flex items-center rounded-md border border-input bg-transparent text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 !shadow-[0px_1px_1px_0px_rgba(16,17,26,0.08)] dark:!shadow-[0px_1px_1px_0px_rgba(255,255,255,0.08)] hover:!shadow-[0px_1px_1px_0px_rgba(16,17,26,0.16)] dark:hover:!shadow-[0px_1px_1px_0px_rgba(255,255,255,0.12)] cursor-pointer">
                  <span className="text-xs text-muted-foreground">No artists selected</span>
                </div>
              )}
              {/* Add Artist Button - Positioned at the right */}
              <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPopoverOpen(true);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Add artist"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </PopoverTrigger>
        </div>
        <PopoverContent
          className="w-[300px] p-1 bg-background/50 backdrop-blur-md border !shadow-[0px_1px_1px_0px_rgba(16,17,26,0.08)] dark:!shadow-[0px_1px_1px_0px_rgba(255,255,255,0.08)]"
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <div className="max-h-[300px] overflow-y-auto">
            {availableArtists.length === 0 ? (
              <div className="p-2 text-center text-xs text-muted-foreground">
                No artists available
              </div>
            ) : (
              <div className="p-1">
                {availableArtists.map((artist) => (
                  <button
                    key={artist.id}
                    type="button"
                    onClick={() => handleArtistSelect(artist.id)}
                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-xs outline-none hover:bg-background/80 focus:bg-background/80 data-[highlighted]:bg-background/80 transition-colors"
                  >
                    {artist.profile_image_url ? (
                      <img
                        src={artist.profile_image_url}
                        alt={artist.name}
                        className="w-5 h-5 rounded object-cover shrink-0 mr-2"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded bg-muted flex items-center justify-center text-[10px] shrink-0 mr-2">
                        {artist.name?.[0] || "?"}
                      </div>
                    )}
                    <span className="text-xs">{artist.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="p-1 border-t border-border/50">
            <button
              type="button"
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-primary/10 text-primary text-xs font-medium transition-colors text-left"
              onClick={() => {
                setIsPopoverOpen(false);
                setIsCreateArtistModalOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Create New Artist
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <CreateArtistModal
        open={isCreateArtistModalOpen}
        onOpenChange={setIsCreateArtistModalOpen}
        onSuccess={handleArtistCreated}
      />
    </>
  );
}
