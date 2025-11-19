-- Add featured album ID preference
-- null means use default (latest album from Griffith label)
insert into public.site_preferences (key, value, description, category) values
  ('featured_album_id', null::jsonb, 'Featured album ID (leave empty to use default Griffith album)', 'feature')
on conflict (key) do nothing;

