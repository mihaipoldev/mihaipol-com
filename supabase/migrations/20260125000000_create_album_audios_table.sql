-- Create album_audios table for storing multiple audio files per album

CREATE TABLE IF NOT EXISTS album_audios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  title TEXT,  -- e.g., "Track 1", "Preview"
  audio_url TEXT NOT NULL,
  duration INTEGER,  -- Duration in seconds
  file_size BIGINT,  -- File size in bytes
  highlight_start_time NUMERIC,  -- Start time for highlight/preview in seconds (can be decimal)
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fetching audios by album
CREATE INDEX IF NOT EXISTS idx_album_audios_album_id_sort ON album_audios(album_id, sort_order);

-- RLS policies
ALTER TABLE album_audios ENABLE ROW LEVEL SECURITY;

-- Public read for published albums
CREATE POLICY "Public can view audios for published albums"
  ON album_audios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM albums 
      WHERE albums.id = album_audios.album_id 
      AND albums.publish_status = 'published'
    )
  );

-- Admin full access
CREATE POLICY "Admins can manage all album audios"
  ON album_audios FOR ALL
  USING (auth.role() = 'authenticated');

COMMENT ON TABLE album_audios IS 'Stores multiple audio files per album with metadata including duration, file size, and highlight start time';
COMMENT ON COLUMN album_audios.duration IS 'Duration of the audio file in seconds';
COMMENT ON COLUMN album_audios.file_size IS 'File size in bytes';
COMMENT ON COLUMN album_audios.highlight_start_time IS 'Start time for highlight/preview playback in seconds (supports decimals for sub-second precision)';
COMMENT ON COLUMN album_audios.sort_order IS 'Order for displaying multiple audio files';
