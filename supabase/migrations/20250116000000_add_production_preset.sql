-- Add production preset preference (copy from dev)
INSERT INTO public.site_preferences (key, value, description, category) 
SELECT 
  'landing_page_preset_prod',
  value,
  'Landing page preset for production environment',
  'general'
FROM public.site_preferences
WHERE key = 'landing_page_preset_number'
ON CONFLICT (key) DO NOTHING;

-- Update dev preset description
UPDATE public.site_preferences
SET description = 'Landing page preset for dev environment'
WHERE key = 'landing_page_preset_number';
