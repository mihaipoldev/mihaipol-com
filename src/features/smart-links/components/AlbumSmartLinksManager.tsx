"use client"

import { useState, useEffect } from "react"
import { X, Plus, GripVertical } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ShadowButton } from "@/components/admin/ShadowButton"
import { Button } from "@/components/ui/button"
import { ShadowInput } from "@/components/admin/ShadowInput"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ShadowSelect"
import { Label } from "@/components/ui/label"
import type { AlbumLink, Platform } from "@/features/albums/types"

type AlbumSmartLinksManagerProps = {
  links: AlbumLink[]
  platforms: Platform[]
  onChange: (links: AlbumLink[]) => void
  validationErrors?: Record<string, { platform?: string; url?: string }>
}

type SortableLinkItemProps = {
  link: AlbumLink
  platforms: Platform[]
  onUpdate: (id: string, updates: Partial<AlbumLink>) => void
  onDelete: (id: string) => void
  validationErrors?: { platform?: string; url?: string }
}

function SortableLinkItem({
  link,
  platforms,
  onUpdate,
  onDelete,
  validationErrors,
}: SortableLinkItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const platform = link.platforms
  const [url, setUrl] = useState(link.url)
  const [ctaLabel, setCtaLabel] = useState(link.cta_label || "Play")
  const [selectedPlatformId, setSelectedPlatformId] = useState(link.platform_id || "")

  // Sync with prop changes
  useEffect(() => {
    setUrl(link.url)
    setCtaLabel(link.cta_label || "Play")
    setSelectedPlatformId(link.platform_id || "")
  }, [link.url, link.cta_label, link.platform_id])

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl)
    onUpdate(link.id, { url: newUrl })
  }

  const handleCtaChange = (newCta: string) => {
    setCtaLabel(newCta)
    onUpdate(link.id, { cta_label: newCta })
  }

  const handlePlatformChange = (platformId: string) => {
    if (platformId === "__none__") {
      setSelectedPlatformId("")
      onUpdate(link.id, { 
        platform_id: null,
        platforms: null
      })
    } else {
      setSelectedPlatformId(platformId)
      const selectedPlatform = platforms.find((p) => p.id === platformId)
      onUpdate(link.id, { 
        platform_id: platformId,
        platforms: selectedPlatform || null
      })
    }
  }

  const selectedPlatform = platforms.find((p) => p.id === selectedPlatformId)
  const sortedPlatforms = [...platforms].sort((a, b) => {
    const nameA = (a.display_name || a.name).toLowerCase()
    const nameB = (b.display_name || b.name).toLowerCase()
    return nameA.localeCompare(nameB)
  })

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex gap-3 p-4 pr-10 border rounded-lg bg-card ${
        isDragging ? "shadow-lg" : ""
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-3">
        {/* Platform Select */}
        <div className="space-y-1">
          <Select
            value={selectedPlatformId || "__none__"}
            onValueChange={handlePlatformChange}
          >
            <SelectTrigger className={`w-full ${validationErrors?.platform ? 'border-destructive' : ''}`}>
              {selectedPlatform ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {selectedPlatform.icon_url ? (
                    <img
                      src={selectedPlatform.icon_url}
                      alt={selectedPlatform.display_name || selectedPlatform.name}
                      className="w-4 h-4 object-contain shrink-0"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded bg-muted flex items-center justify-center text-xs shrink-0">
                      {(selectedPlatform.display_name || selectedPlatform.name)?.[0] || "?"}
                    </div>
                  )}
                  <span className="truncate">{selectedPlatform.display_name || selectedPlatform.name}</span>
                </div>
              ) : (
                <SelectValue placeholder="Select platform" />
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {sortedPlatforms.map((platform) => (
                <SelectItem key={platform.id} value={platform.id}>
                  <div className="flex items-center gap-2">
                    {platform.icon_url ? (
                      <img
                        src={platform.icon_url}
                        alt={platform.display_name || platform.name}
                        className="w-4 h-4 object-contain shrink-0"
                      />
                    ) : (
                      <div className="w-4 h-4 rounded bg-muted flex items-center justify-center text-xs shrink-0">
                        {(platform.display_name || platform.name)?.[0] || "?"}
                      </div>
                    )}
                    <span>{platform.display_name || platform.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {validationErrors?.platform && (
            <p className="text-xs text-destructive">{validationErrors.platform}</p>
          )}
        </div>

        {/* URL and Action Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* URL Input */}
          <div className="space-y-1">
            <ShadowInput
              type="url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com"
              className={validationErrors?.url ? 'border-destructive' : ''}
            />
            {validationErrors?.url && (
              <p className="text-xs text-destructive">{validationErrors.url}</p>
            )}
          </div>

          {/* Action/CTA Input */}
          <ShadowInput
            value={ctaLabel}
            onChange={(e) => handleCtaChange(e.target.value)}
            placeholder="Play"
          />
        </div>
      </div>

      {/* Delete Button - Positioned absolutely at top right */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onDelete(link.id)}
        className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        title="Delete link"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function AlbumSmartLinksManager({
  links,
  platforms,
  onChange,
  validationErrors,
}: AlbumSmartLinksManagerProps) {
  const [localLinks, setLocalLinks] = useState<AlbumLink[]>(
    [...links].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  )

  // Sync local links when prop changes
  useEffect(() => {
    setLocalLinks([...links].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)))
  }, [links])

  // Notify parent of changes
  const updateLinks = (updatedLinks: AlbumLink[]) => {
    setLocalLinks(updatedLinks)
    onChange(updatedLinks)
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
  })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = localLinks.findIndex((link) => link.id === active.id)
      const newIndex = localLinks.findIndex((link) => link.id === over.id)

      const reorderedLinks = arrayMove(localLinks, oldIndex, newIndex)
      // Update sort_order for all links
      const updatedLinks = reorderedLinks.map((link, index) => ({
        ...link,
        sort_order: index,
      }))

      updateLinks(updatedLinks)
    }
  }

  const handleUpdate = (id: string, updates: Partial<AlbumLink>) => {
    const updatedLinks = localLinks.map((link) =>
      link.id === id ? { ...link, ...updates } : link
    )
    updateLinks(updatedLinks)
  }

  const handleDelete = (id: string) => {
    const updatedLinks = localLinks.filter((link) => link.id !== id)
    // Recalculate sort_order after deletion
    const reorderedLinks = updatedLinks.map((link, index) => ({
      ...link,
      sort_order: index,
    }))
    updateLinks(reorderedLinks)
  }

  const handleAdd = () => {
    const newLinkItem: AlbumLink = {
      id: `temp-${Date.now()}`, // Temporary ID for new links
      platform_id: null,
      url: "",
      cta_label: "Play",
      link_type: null,
      sort_order: localLinks.length,
      platforms: null,
    }

    const updatedLinks = [...localLinks, newLinkItem]
    updateLinks(updatedLinks)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Label className="text-base font-semibold">Links</Label>
      </div>

      {localLinks.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 border rounded-lg text-center">
          No links added yet
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localLinks.map((link) => link.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {localLinks.map((link) => (
                <SortableLinkItem
                  key={link.id}
                  link={link}
                  platforms={platforms}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  validationErrors={validationErrors?.[link.id]}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="pt-2">
        <ShadowButton
          type="button"
          variant="outline"
          className="w-full justify-center border-dashed hover:border-solid transition-all"
          onClick={handleAdd}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Link
        </ShadowButton>
      </div>
    </div>
  )
}
