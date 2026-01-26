import type { AlbumAudio } from "@/features/albums/types";
import type WaveSurfer from "wavesurfer.js";

/**
 * Options for the useWaveform hook
 */
export type UseWaveformOptions = {
  audioUrl: string | null;
  waveformPeaks: number[] | null | undefined;
  audioId: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isVisible: boolean;
  theme: string | undefined;
  resolvedTheme: string | undefined;
};

/**
 * Return type for the useWaveform hook
 */
export type UseWaveformReturn = {
  wavesurfer: WaveSurfer | null;
  isReady: boolean;
  isPlaying: boolean;
  duration: number | null;
};

/**
 * Props for the WaveformPlayer component
 */
export type WaveformPlayerProps = {
  audioUrl: string;
  waveformPeaks?: number[] | null;
  duration: number | null;
  audioId: string;
  isVisible: boolean;
  onReady?: (wavesurfer: WaveSurfer) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (progress: number) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  className?: string;
  showDuration?: boolean; // Default: true
};

/**
 * Options for the useWaveformMarker hook
 */
export type UseWaveformMarkerOptions = {
  highlightTime: number | null;
  waveformWidth: number;
  duration: number | null;
  isWaveformReady: boolean;
  audioId: string;
  onTimeChange: (time: number) => void;
  waveformContainerRef: React.RefObject<HTMLDivElement | null>;
};

/**
 * Return type for the useWaveformMarker hook
 */
export type UseWaveformMarkerReturn = {
  markerPosition: number | null;
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
};

/**
 * Props for the WaveformMarker component
 */
export type WaveformMarkerProps = {
  highlightTime: number | null;
  waveformWidth: number;
  duration: number | null;
  isWaveformReady: boolean;
  audioId: string;
  onTimeChange: (time: number) => void;
  onRemove: () => void;
  onEdit: () => void;
  waveformContainerRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
};

/**
 * Options for the useAudioPlayback hook
 */
export type UseAudioPlaybackOptions = {
  wavesurfer: WaveSurfer | null;
  isWaveformReady: boolean;
  audioId: string;
};

/**
 * Return type for the useAudioPlayback hook
 */
export type UseAudioPlaybackReturn = {
  isPlaying: boolean;
  handlePlay: () => void;
  handlePause: () => void;
  handlePlayPause: (e?: React.MouseEvent) => void;
};

/**
 * Props for the AudioTrackHeader component
 */
export type AudioTrackHeaderProps = {
  audio: {
    id: string;
    title: string | null;
    audio_url: string;
    content_group?: string | null;
    is_public?: boolean;
    sort_order: number;
    created_at?: string;
  };
  isPlaying: boolean;
  isWaveformReady: boolean;
  onPlayPause: (e?: React.MouseEvent) => void;
  onTitleUpdate: (id: string, title: string | null) => void;
  albumId: string | null;
};

/**
 * Props for the AudioTrackActions component
 */
export type AudioTrackActionsProps = {
  audio: {
    id: string;
    title: string | null;
    audio_url: string;
  };
  onEdit: (audio: { id: string; title: string | null; audio_url: string }) => void;
  onDelete: (id: string) => void;
};

/**
 * Options for the useLazyLoad hook
 */
export type UseLazyLoadOptions = {
  elementRef: React.RefObject<HTMLElement | null>;
  enabled?: boolean;
  rootMargin?: string;
};

/**
 * Return type for the useLazyLoad hook
 */
export type UseLazyLoadReturn = {
  isVisible: boolean;
};

/**
 * Props for the AudioTrackWaveform component
 */
export type AudioTrackWaveformProps = {
  audio: {
    id: string;
    audio_url: string;
    waveform_peaks?: number[] | null;
    duration: number | null;
    highlight_start_time: number | null;
  };
  isVisible: boolean;
  isWaveformReady: boolean;
  wavesurfer: WaveSurfer | null;
  waveformContainerRef: React.RefObject<HTMLDivElement | null>;
  onReady: (wavesurfer: WaveSurfer) => void;
  onPlay: () => void;
  onPause: () => void;
  onContextMenu: (e: React.MouseEvent & { calculatedTime?: number }) => void;
  onTimeChange: (time: number) => void;
  onRemove: () => void;
  onEdit: () => void;
  dragHandleProps: {
    attributes: any;
    listeners: any;
  };
};

/**
 * Props for the AudioEditModal component
 */
export type AudioEditModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAudio: {
    id: string;
    title: string | null;
    audio_url: string;
    duration: number | null;
    file_size: number | null;
    highlight_start_time: number | null;
    content_group: string | null;
    is_public: boolean;
  } | null;
  folderPath: string;
  editTitle: string;
  editAudioUrl: string | null;
  editSelectedFile: File | null;
  editDuration: number | null;
  editFileSize: number | null;
  editHighlightStartTime: string;
  editContentGroup: string;
  editIsPublic: boolean;
  isUploading: boolean;
  onTitleChange: (title: string) => void;
  onAudioUrlChange: (url: string | null) => void;
  onFileChange: (file: File | null) => void;
  onDurationChange: (duration: number | null) => void;
  onFileSizeChange: (fileSize: number | null) => void;
  onHighlightStartTimeChange: (time: string) => void;
  onContentGroupChange: (group: string) => void;
  onIsPublicChange: (isPublic: boolean) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
};

/**
 * Props for the AudioDeleteDialog component
 */
export type AudioDeleteDialogProps = {
  audioToDelete: {
    id: string;
    title: string | null;
  } | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
};

/**
 * Options for the useOptimisticAudios hook
 */
export type UseOptimisticAudiosOptions = {
  audios: AlbumAudio[];
};

/**
 * Return type for the useOptimisticAudios hook
 */
export type UseOptimisticAudiosReturn = {
  localAudios: AlbumAudio[];
  setLocalAudios: React.Dispatch<React.SetStateAction<AlbumAudio[]>>;
};

/**
 * Options for the useAudioFormState hook
 */
export type UseAudioFormStateOptions = Record<string, never>;

/**
 * Return type for the useAudioFormState hook
 */
export type UseAudioFormStateReturn = {
  // State
  isEditModalOpen: boolean;
  editingAudio: AlbumAudio | null;
  editTitle: string;
  editAudioUrl: string | null;
  editSelectedFile: File | null;
  editDuration: number | null;
  editFileSize: number | null;
  editHighlightStartTime: string;
  editContentGroup: string;
  editIsPublic: boolean;
  isUploading: boolean;
  // Setters
  setIsEditModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingAudio: React.Dispatch<React.SetStateAction<AlbumAudio | null>>;
  setEditTitle: React.Dispatch<React.SetStateAction<string>>;
  setEditAudioUrl: React.Dispatch<React.SetStateAction<string | null>>;
  setEditSelectedFile: React.Dispatch<React.SetStateAction<File | null>>;
  setEditDuration: React.Dispatch<React.SetStateAction<number | null>>;
  setEditFileSize: React.Dispatch<React.SetStateAction<number | null>>;
  setEditHighlightStartTime: React.Dispatch<React.SetStateAction<string>>;
  setEditContentGroup: React.Dispatch<React.SetStateAction<string>>;
  setEditIsPublic: React.Dispatch<React.SetStateAction<boolean>>;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
  // Helpers
  resetForm: () => void;
  initializeForm: (audio: AlbumAudio) => void;
  openModal: () => void;
  closeModal: () => void;
};

/**
 * Options for the useAudioCRUD hook
 */
export type UseAudioCRUDOptions = {
  localAudios: AlbumAudio[];
  setLocalAudios: React.Dispatch<React.SetStateAction<AlbumAudio[]>>;
  albumId: string | null;
  folderPath: string;
  onChange: (audios: AlbumAudio[]) => void;
  formState: UseAudioFormStateReturn;
};

/**
 * Return type for the useAudioCRUD hook
 */
export type UseAudioCRUDReturn = {
  audioToDelete: AlbumAudio | null;
  setAudioToDelete: React.Dispatch<React.SetStateAction<AlbumAudio | null>>;
  isDeleting: boolean;
  handleDelete: (id: string) => void;
  confirmDelete: () => Promise<void>;
  handleSave: () => Promise<void>;
};

/**
 * Options for the useAudioDragAndDrop hook
 */
export type UseAudioDragAndDropOptions = {
  localAudios: AlbumAudio[];
  setLocalAudios: React.Dispatch<React.SetStateAction<AlbumAudio[]>>;
  albumId: string | null;
  onChange: (audios: AlbumAudio[]) => void;
};

/**
 * Return type for the useAudioDragAndDrop hook
 */
export type UseAudioDragAndDropReturn = {
  sensors: ReturnType<typeof import("@dnd-kit/core").useSensors>;
  handleDragEnd: (event: import("@dnd-kit/core").DragEndEvent) => Promise<void>;
};

/**
 * Props for the AudioTrackItem component
 */
export type AudioTrackItemProps = {
  audio: AlbumAudio;
  onEdit: (audio: AlbumAudio) => void;
  onDelete: (id: string) => void;
  onUpdate: (audio: AlbumAudio) => void;
  onTitleUpdate: (id: string, title: string | null) => void;
  albumId: string | null;
};
