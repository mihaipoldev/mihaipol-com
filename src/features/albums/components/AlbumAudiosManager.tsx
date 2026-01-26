"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { AudioTrackItem } from "./audio-manager/AudioTrackItem";
import { AudioEditModal } from "./audio-manager/AudioEditModal";
import { AudioDeleteDialog } from "./audio-manager/AudioDeleteDialog";
import { AudioEmptyState } from "./audio-manager/AudioEmptyState";
import { useOptimisticAudios } from "./audio-manager/hooks/useOptimisticAudios";
import { useAudioFormState } from "./audio-manager/hooks/useAudioFormState";
import { useAudioCRUD } from "./audio-manager/hooks/useAudioCRUD";
import { useAudioDragAndDrop } from "./audio-manager/hooks/useAudioDragAndDrop";
import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import type { AlbumAudio } from "@/features/albums/types";

type AlbumAudiosManagerProps = {
  audios: AlbumAudio[];
  onChange: (audios: AlbumAudio[]) => void;
  folderPath: string;
};

export function AlbumAudiosManager({
  audios,
  onChange,
  folderPath,
}: AlbumAudiosManagerProps) {
  // Extract album ID from folderPath (format: "albums/{id}")
  const albumId = folderPath.startsWith("albums/")
    ? folderPath.replace("albums/", "")
    : null;

  // Use optimistic audios hook
  const { localAudios, setLocalAudios } = useOptimisticAudios({ audios });

  // Use form state hook
  const formState = useAudioFormState({});

  // Use CRUD hook
  const { audioToDelete, setAudioToDelete, isDeleting, handleDelete, confirmDelete, handleSave } = useAudioCRUD({
    localAudios,
    setLocalAudios,
    albumId,
    folderPath,
    onChange,
    formState,
  });

  // Use drag and drop hook
  const { sensors, handleDragEnd } = useAudioDragAndDrop({
    localAudios,
    setLocalAudios,
    albumId,
    onChange,
  });

  // Handle edit - initialize form with audio data
  const handleEdit = (audio: AlbumAudio) => {
    formState.initializeForm(audio);
    formState.openModal();
  };

  // Handle add new - reset form and open modal
  const handleAddNew = () => {
    formState.resetForm();
    formState.openModal();
  };

  // Handle title update
  const handleTitleUpdate = (id: string, title: string | null) => {
    const updatedAudios = localAudios.map((audio) =>
      audio.id === id ? { ...audio, title } : audio
    );
    setLocalAudios(updatedAudios);
    onChange(updatedAudios);
  };

  return (
    <div className="space-y-6">
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <span className="w-1.5 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></span>
            Audio Content
          </h2>
          <Button type="button" onClick={handleAddNew} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Audio
          </Button>
        </div>
        <p className="text-sm text-muted-foreground ml-5">
          Upload and manage audio tracks for your album
        </p>
      </div>

      {localAudios.length === 0 ? (
        <AudioEmptyState />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={localAudios.map((audio) => audio.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {localAudios.map((audio, index) => (
                <motion.div
                  key={audio.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.2 + index * 0.05,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                >
                  <AudioTrackItem
                    audio={audio}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onUpdate={(updatedAudio) => {
                      const updatedAudios = localAudios.map((a) =>
                        a.id === updatedAudio.id ? updatedAudio : a
                      );
                      setLocalAudios(updatedAudios);
                      onChange(updatedAudios);
                    }}
                    onTitleUpdate={handleTitleUpdate}
                    albumId={albumId}
                  />
                </motion.div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Edit/Add Modal */}
      <AudioEditModal
        open={formState.isEditModalOpen}
        onOpenChange={formState.setIsEditModalOpen}
        editingAudio={
          formState.editingAudio
            ? {
                id: formState.editingAudio.id,
                title: formState.editingAudio.title,
                audio_url: formState.editingAudio.audio_url,
                duration: formState.editingAudio.duration,
                file_size: formState.editingAudio.file_size,
                highlight_start_time: formState.editingAudio.highlight_start_time,
                content_group: formState.editingAudio.content_group || null,
                is_public: formState.editingAudio.is_public ?? false,
              }
            : null
        }
        folderPath={folderPath}
        editTitle={formState.editTitle}
        editAudioUrl={formState.editAudioUrl}
        editSelectedFile={formState.editSelectedFile}
        editDuration={formState.editDuration}
        editFileSize={formState.editFileSize}
        editHighlightStartTime={formState.editHighlightStartTime}
        editContentGroup={formState.editContentGroup}
        editIsPublic={formState.editIsPublic}
        isUploading={formState.isUploading}
        onTitleChange={formState.setEditTitle}
        onAudioUrlChange={formState.setEditAudioUrl}
        onFileChange={formState.setEditSelectedFile}
        onDurationChange={formState.setEditDuration}
        onFileSizeChange={formState.setEditFileSize}
        onHighlightStartTimeChange={formState.setEditHighlightStartTime}
        onContentGroupChange={formState.setEditContentGroup}
        onIsPublicChange={formState.setEditIsPublic}
        onSave={handleSave}
        onCancel={formState.closeModal}
      />

      {/* Delete Confirmation Dialog */}
      <AudioDeleteDialog
        audioToDelete={audioToDelete}
        onOpenChange={(open) => !open && setAudioToDelete(null)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
