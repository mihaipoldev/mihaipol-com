"use client";

import { Loader2 } from "lucide-react";
import { ShadowInput } from "@/components/admin/forms/ShadowInput";
import { ShadowButton } from "@/components/admin/forms/ShadowButton";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ModalShell } from "@/components/ui/modal-shell";
import { DialogFooter } from "@/components/ui/dialog";
import { AudioUploadField } from "@/components/admin/forms/AudioUploadField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/forms/AdminSelect";
import type { AudioEditModalProps } from "./types";

export function AudioEditModal({
  open,
  onOpenChange,
  editingAudio,
  folderPath,
  editTitle,
  editAudioUrl,
  editSelectedFile,
  editDuration,
  editFileSize,
  editHighlightStartTime,
  editContentGroup,
  editIsPublic,
  isUploading,
  onTitleChange,
  onAudioUrlChange,
  onFileChange,
  onDurationChange,
  onFileSizeChange,
  onHighlightStartTimeChange,
  onContentGroupChange,
  onIsPublicChange,
  onSave,
  onCancel,
}: AudioEditModalProps) {
  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={editingAudio ? "Edit Audio" : "Add New Audio"}
      maxWidth="2xl"
      maxHeight="90vh"
      showScroll={true}
      footer={
        <DialogFooter>
          <ShadowButton type="button" variant="outline" onClick={onCancel}>
            Cancel
          </ShadowButton>
          <ShadowButton
            type="button"
            onClick={onSave}
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
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g., Track 1, Preview"
          />
        </div>

        <div className="space-y-2">
          <Label>Audio File</Label>
          <AudioUploadField
            value={editAudioUrl}
            onChange={(url) => onAudioUrlChange(url)}
            onFileChange={(file) => onFileChange(file)}
            onMetadataChange={(metadata) => {
              onDurationChange(metadata.duration);
              onFileSizeChange(metadata.fileSize);
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
            onChange={(e) => onHighlightStartTimeChange(e.target.value)}
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
            onValueChange={(value) => onContentGroupChange(value === "__none__" ? "" : value)}
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

        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor="is-public-toggle">Public Visibility</Label>
            <p className="text-xs text-muted-foreground">
              Make this audio publicly visible on the website
            </p>
          </div>
          <Switch
            id="is-public-toggle"
            checked={editIsPublic}
            onCheckedChange={onIsPublicChange}
          />
        </div>
      </div>
    </ModalShell>
  );
}
