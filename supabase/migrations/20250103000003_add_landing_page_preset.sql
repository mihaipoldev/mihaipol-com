-- Add landing page preset preference
insert into public.site_preferences (key, value, description, category) values
  ('landing_page_preset_number', '19'::jsonb, 'Landing page preset number (1-22)', 'general')
on conflict (key) do nothing;

