-- Add 'griffith' and 'feature' categories to site_preferences
-- First, drop the existing check constraint
alter table public.site_preferences drop constraint if exists site_preferences_category_check;

-- Add new check constraint with additional categories
alter table public.site_preferences add constraint site_preferences_category_check 
  check (category in ('events', 'albums', 'updates', 'general', 'griffith', 'feature'));

-- Update existing preferences to use new categories
update public.site_preferences 
set category = 'griffith' 
where key in ('griffith_albums_homepage_limit', 'griffith_albums_homepage_columns');

update public.site_preferences 
set category = 'feature' 
where key = 'featured_album_id';

