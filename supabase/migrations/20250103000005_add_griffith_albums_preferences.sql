-- Add Griffith albums homepage preferences
-- Note: Category will be updated to 'griffith' by migration 20250103000006
insert into public.site_preferences (key, value, description, category) values
  ('griffith_albums_homepage_limit', '6'::jsonb, 'Maximum number of Griffith albums to show on homepage', 'griffith'),
  ('griffith_albums_homepage_columns', '3'::jsonb, 'Number of columns for Griffith albums on homepage', 'griffith')
on conflict (key) do nothing;

