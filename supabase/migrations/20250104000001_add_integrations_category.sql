-- Add 'integrations' category to site_preferences
-- First, drop the existing check constraint
alter table public.site_preferences drop constraint if exists site_preferences_category_check;

-- Add new check constraint with additional category
alter table public.site_preferences add constraint site_preferences_category_check 
  check (category in ('events', 'albums', 'updates', 'general', 'griffith', 'feature', 'integrations'));

-- Insert initial preference for Google Drive releases folder (if it doesn't exist)
insert into public.site_preferences (key, value, description, category) 
values (
  'drive_releases_folder_id',
  '{}'::jsonb,
  'Root Google Drive folder ID for all releases. Get this from your Drive folder URL: drive.google.com/drive/folders/[FOLDER_ID]',
  'integrations'
)
on conflict (key) do nothing;
