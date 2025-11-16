"use client"

import { useState } from "react"
import { Trash2, Plus, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FormField } from "./FormField"

type Platform = {
  id: string
  name: string
  display_name: string
}

type AlbumLink = {
  id: string
  platform_id: string | null
  url: string
  cta_label: string
  link_type: string | null
  sort_order: number
  platforms: Platform | null
}

type AlbumLinksManagerProps = {
  links: AlbumLink[]
  platforms: Platform[]
  onAdd: (link: Omit<AlbumLink, "id" | "platforms">) => Promise<void>
  onUpdate: (id: string, link: Partial<AlbumLink>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function AlbumLinksManager({
  links,
  platforms,
  onAdd,
  onUpdate,
  onDelete,
}: AlbumLinksManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newLink, setNewLink] = useState({
    platform_id: "",
    url: "",
    cta_label: "Play",
    link_type: "",
    sort_order: links.length,
  })

  const handleAdd = async () => {
    if (!newLink.url) {
      return
    }

    await onAdd({
      platform_id: newLink.platform_id || null,
      url: newLink.url,
      cta_label: newLink.cta_label || "Play",
      link_type: newLink.link_type || null,
      sort_order: newLink.sort_order,
    })

    setNewLink({
      platform_id: "",
      url: "",
      cta_label: "Play",
      link_type: "",
      sort_order: links.length + 1,
    })
    setShowAddDialog(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Links</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddDialog(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Link
        </Button>
      </div>

      {links.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 border rounded-md text-center">
          No links added yet
        </div>
      ) : (
        <div className="space-y-2">
          {links
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            .map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-4 p-3 border rounded-md"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {link.platforms?.display_name || link.platforms?.name || (
                      <span className="text-muted-foreground">No platform</span>
                    )}
                    {link.cta_label && (
                      <span className="text-sm text-muted-foreground">
                        ({link.cta_label})
                      </span>
                    )}
                  </div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    {link.url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {link.link_type && (
                    <div className="text-xs text-muted-foreground">
                      Type: {link.link_type}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(link.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
            <DialogDescription>
              Add a new link for this album
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <FormField label="Platform">
              <Select
                value={newLink.platform_id}
                onValueChange={(value) =>
                  setNewLink({ ...newLink, platform_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      {platform.display_name || platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="URL" required>
              <Input
                type="url"
                value={newLink.url}
                onChange={(e) =>
                  setNewLink({ ...newLink, url: e.target.value })
                }
                placeholder="https://example.com"
              />
            </FormField>

            <FormField label="CTA Label">
              <Input
                value={newLink.cta_label}
                onChange={(e) =>
                  setNewLink({ ...newLink, cta_label: e.target.value })
                }
                placeholder="Play"
              />
            </FormField>

            <FormField label="Link Type">
              <Input
                value={newLink.link_type}
                onChange={(e) =>
                  setNewLink({ ...newLink, link_type: e.target.value })
                }
                placeholder="streaming, purchase, etc."
              />
            </FormField>

            <FormField label="Sort Order">
              <Input
                type="number"
                value={newLink.sort_order}
                onChange={(e) =>
                  setNewLink({
                    ...newLink,
                    sort_order: parseInt(e.target.value) || 0,
                  })
                }
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddDialog(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleAdd}>
              Add Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

