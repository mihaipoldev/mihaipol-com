"use client";

import { useState, useEffect } from "react";
import { ModalShell } from "@/components/ui/modal-shell";
import { DialogFooter } from "@/components/ui/dialog";
import { FormField } from "@/components/admin/forms/FormField";
import { ShadowButton } from "@/components/admin/forms/ShadowButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/forms/AdminSelect";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import type { WorkflowPreset } from "../presets/types";
import { Card } from "@/components/ui/card";

type PresetTestModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preset: WorkflowPreset;
};

type Album = {
  id: string;
  title: string;
  slug: string;
  release_date?: string | null;
  publish_status: string;
  labelName?: string | null;
  cover_image_url?: string | null;
};

type TestResult = {
  matched_videos: Array<{
    image_id: string;
    image_name: string;
    track_ids: string[];
    track_names: string[];
    group?: string;
  }>;
  total_videos: number;
  video_settings: {
    quality: string;
    aspect_ratio: string;
    format: string;
    background_color: string;
    video_type: string;
  };
  message: string;
};

export function PresetTestModal({ open, onOpenChange, preset }: PresetTestModalProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoadingAlbums, setIsLoadingAlbums] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>("");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  useEffect(() => {
    if (open) {
      fetchAlbums();
      setSelectedAlbumId("");
      setTestResult(null);
    }
  }, [open]);

  const fetchAlbums = async () => {
    setIsLoadingAlbums(true);
    try {
      const response = await fetch("/api/admin/albums");
      if (!response.ok) {
        throw new Error("Failed to fetch albums");
      }
      const data = await response.json();
      setAlbums(data || []);
    } catch (err: any) {
      console.error("Error fetching albums:", err);
      toast.error("Failed to load albums");
    } finally {
      setIsLoadingAlbums(false);
    }
  };

  const handleTest = async () => {
    if (!selectedAlbumId) {
      toast.error("Please select an album");
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      const response = await fetch(`/api/workflows/presets/${preset.id}/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ album_id: selectedAlbumId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to test preset");
      }

      const data = await response.json();
      setTestResult(data);
      toast.success(data.message || "Test completed successfully");
    } catch (err: any) {
      console.error("Error testing preset:", err);
      toast.error(err.message || "Failed to test preset");
    } finally {
      setIsTesting(false);
    }
  };

  const selectedAlbum = albums.find((a) => a.id === selectedAlbumId);

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={`Test Preset: ${preset.name}`}
      maxWidth="2xl"
      maxHeight="90vh"
      showScroll={true}
      footer={
        <DialogFooter>
          <ShadowButton type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </ShadowButton>
          <ShadowButton
            type="button"
            onClick={handleTest}
            disabled={!selectedAlbumId || isTesting}
          >
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Preset"
            )}
          </ShadowButton>
        </DialogFooter>
      }
    >
      <div className="space-y-6">
        {!testResult ? (
          <>
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Select an album to test this preset and see what videos would be generated.
              </p>

              <FormField label="Select Album" required>
                {isLoadingAlbums ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <Select value={selectedAlbumId} onValueChange={setSelectedAlbumId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Search albums..." />
                    </SelectTrigger>
                    <SelectContent>
                      {albums.map((album) => (
                        <SelectItem key={album.id} value={album.id}>
                          {album.title}
                          {album.release_date && ` (${new Date(album.release_date).getFullYear()})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormField>

              {selectedAlbum && (
                <Card className="p-4 bg-muted/30">
                  <div className="flex items-start gap-3">
                    {selectedAlbum.cover_image_url && (
                      <img
                        src={selectedAlbum.cover_image_url}
                        alt={selectedAlbum.title}
                        className="w-16 h-16 rounded object-cover"
                      />
                    )}
                    <div>
                      <h4 className="font-semibold">{selectedAlbum.title}</h4>
                      {selectedAlbum.labelName && (
                        <p className="text-sm text-muted-foreground">{selectedAlbum.labelName}</p>
                      )}
                      {selectedAlbum.release_date && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(selectedAlbum.release_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-6">
            {/* Success Message */}
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-300">
                  {testResult.message}
                </p>
              </div>
            </div>

            {/* Matched Videos */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Matched Videos</h3>
              <div className="space-y-3">
                {testResult.matched_videos.map((video, idx) => (
                  <Card key={idx} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          {idx + 1}. {video.image_name} + {video.track_names.length} track(s)
                        </h4>
                        {video.group && (
                          <span className="text-xs px-2 py-1 rounded-full bg-muted">
                            {video.group}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div>
                          <strong>Image:</strong> {video.image_name}
                        </div>
                        <div>
                          <strong>Tracks:</strong> {video.track_names.join(", ")}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Video Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Video Settings</h3>
              <Card className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Quality:</strong> {testResult.video_settings.quality}
                  </div>
                  <div>
                    <strong>Aspect Ratio:</strong> {testResult.video_settings.aspect_ratio}
                  </div>
                  <div>
                    <strong>Format:</strong> {testResult.video_settings.format}
                  </div>
                  <div>
                    <strong>Background:</strong> {testResult.video_settings.background_color}
                  </div>
                  <div>
                    <strong>Type:</strong> {testResult.video_settings.video_type}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
