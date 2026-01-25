-- Add waveform_peaks column to album_audios table
-- This stores pre-computed waveform data for faster visualization

ALTER TABLE album_audios 
ADD COLUMN IF NOT EXISTS waveform_peaks JSONB;

COMMENT ON COLUMN album_audios.waveform_peaks IS 'Pre-computed waveform peaks data for fast visualization (array of numbers)';
