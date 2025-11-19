-- Add column preferences for albums and updates
insert into public.site_preferences (key, value, description, category) values
  ('albums_homepage_columns', '3'::jsonb, 'Number of columns for albums on homepage', 'albums'),
  ('albums_page_columns', '4'::jsonb, 'Number of columns for albums on albums page', 'albums'),
  ('updates_homepage_columns', '3'::jsonb, 'Number of columns for updates on homepage', 'updates'),
  ('updates_page_columns', '3'::jsonb, 'Number of columns for updates on updates page', 'updates')
on conflict (key) do nothing;

