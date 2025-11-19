-- Add section visibility and order preferences
insert into public.site_preferences (key, value, description, category) values
  -- Visibility preferences (boolean)
  ('events_section_show', 'true'::jsonb, 'Show/hide events section on homepage', 'events'),
  ('albums_section_show', 'true'::jsonb, 'Show/hide albums section on homepage', 'albums'),
  ('griffith_section_show', 'true'::jsonb, 'Show/hide griffith section on homepage', 'griffith'),
  ('feature_section_show', 'true'::jsonb, 'Show/hide feature section on homepage', 'feature'),
  ('updates_section_show', 'true'::jsonb, 'Show/hide updates section on homepage', 'updates'),
  -- Order preferences (number)
  ('events_section_order', '1'::jsonb, 'Display order for events section (lower numbers appear first)', 'events'),
  ('albums_section_order', '2'::jsonb, 'Display order for albums section (lower numbers appear first)', 'albums'),
  ('griffith_section_order', '3'::jsonb, 'Display order for griffith section (lower numbers appear first)', 'griffith'),
  ('feature_section_order', '4'::jsonb, 'Display order for feature section (lower numbers appear first)', 'feature'),
  ('updates_section_order', '5'::jsonb, 'Display order for updates section (lower numbers appear first)', 'updates')
on conflict (key) do nothing;

