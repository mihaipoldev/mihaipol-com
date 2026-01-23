-- Migrate landing_page_preset_number from number to full preset object
-- This migration converts existing number values to full preset objects

-- First, update the description
update public.site_preferences
set description = 'Landing page preset (full object with id, name, primary, secondary, accent)'
where key = 'landing_page_preset_number';

-- Migrate existing number values to full preset objects
-- Map of preset IDs to their full objects
update public.site_preferences
set value = case
  when (value::text)::integer = 1 then '{"id": 1, "name": "Warm Sunset", "primary": "25 95% 58%", "secondary": "340 85% 65%", "accent": "280 70% 60%"}'::jsonb
  when (value::text)::integer = 2 then '{"id": 2, "name": "Cool Minimal (Slate + Blue)", "primary": "210 90% 55%", "secondary": "200 75% 50%", "accent": "260 65% 60%"}'::jsonb
  when (value::text)::integer = 3 then '{"id": 3, "name": "Warm Neutral (Sand + Soft Amber)", "primary": "28 80% 52%", "secondary": "18 35% 40%", "accent": "340 30% 40%"}'::jsonb
  when (value::text)::integer = 4 then '{"id": 4, "name": "Soft Tech (Mint + Teal)", "primary": "165 65% 40%", "secondary": "150 25% 35%", "accent": "200 40% 45%"}'::jsonb
  when (value::text)::integer = 5 then '{"id": 5, "name": "Monochrome Minimal", "primary": "220 15% 20%", "secondary": "220 8% 40%", "accent": "210 20% 30%"}'::jsonb
  when (value::text)::integer = 6 then '{"id": 6, "name": "Desert Noir", "primary": "28 55% 40%", "secondary": "20 25% 35%", "accent": "10 60% 50%"}'::jsonb
  when (value::text)::integer = 7 then '{"id": 7, "name": "Midnight Violet", "primary": "268 55% 48%", "secondary": "260 25% 40%", "accent": "200 50% 52%"}'::jsonb
  when (value::text)::integer = 8 then '{"id": 8, "name": "Concrete & Lime", "primary": "85 80% 50%", "secondary": "210 5% 30%", "accent": "155 55% 45%"}'::jsonb
  when (value::text)::integer = 9 then '{"id": 9, "name": "Cyberpunk Pulse", "primary": "305 80% 58%", "secondary": "190 80% 55%", "accent": "55 90% 58%"}'::jsonb
  when (value::text)::integer = 10 then '{"id": 10, "name": "Deep Navy & Gold", "primary": "45 85% 56%", "secondary": "215 25% 32%", "accent": "200 55% 50%"}'::jsonb
  when (value::text)::integer = 11 then '{"id": 11, "name": "Smoke & Coral", "primary": "12 70% 54%", "secondary": "210 8% 40%", "accent": "350 30% 40%"}'::jsonb
  when (value::text)::integer = 12 then '{"id": 12, "name": "Forest Signal", "primary": "140 40% 35%", "secondary": "90 70% 55%", "accent": "200 40% 45%"}'::jsonb
  when (value::text)::integer = 13 then '{"id": 13, "name": "Glacier", "primary": "195 65% 50%", "secondary": "210 14% 40%", "accent": "220 40% 55%"}'::jsonb
  when (value::text)::integer = 14 then '{"id": 14, "name": "Infrared", "primary": "10 85% 58%", "secondary": "35 90% 55%", "accent": "200 75% 55%"}'::jsonb
  when (value::text)::integer = 15 then '{"id": 15, "name": "Neon Matrix", "primary": "120 90% 55%", "secondary": "190 90% 55%", "accent": "50 95% 60%"}'::jsonb
  when (value::text)::integer = 16 then '{"id": 16, "name": "Teal & Sand Luxe", "primary": "185 65% 45%", "secondary": "35 35% 55%", "accent": "15 70% 55%"}'::jsonb
  when (value::text)::integer = 17 then '{"id": 17, "name": "Mono Ice Minimal", "primary": "210 40% 35%", "secondary": "210 16% 55%", "accent": "200 30% 45%"}'::jsonb
  when (value::text)::integer = 18 then '{"id": 18, "name": "Soft Sunrise Minimal", "primary": "30 80% 55%", "secondary": "15 60% 52%", "accent": "195 50% 52%"}'::jsonb
  when (value::text)::integer = 19 then '{"id": 19, "name": "Deep Teal Studio", "primary": "180 55% 38%", "secondary": "200 18% 40%", "accent": "160 40% 45%"}'::jsonb
  when (value::text)::integer = 20 then '{"id": 20, "name": "Airy Mint Mono", "primary": "160 45% 38%", "secondary": "150 20% 55%", "accent": "200 22% 45%"}'::jsonb
  when (value::text)::integer = 21 then '{"id": 21, "name": "Griffith Orange", "primary": "20 85% 56%", "secondary": "220 10% 32%", "accent": "18 40% 50%"}'::jsonb
  when (value::text)::integer = 22 then '{"id": 22, "name": "Griffith Lime", "primary": "90 80% 56%", "secondary": "210 10% 32%", "accent": "200 45% 50%"}'::jsonb
  else '{"id": 19, "name": "Deep Teal Studio", "primary": "180 55% 38%", "secondary": "200 18% 40%", "accent": "160 40% 45%"}'::jsonb
end
where key = 'landing_page_preset_number'
  and jsonb_typeof(value) = 'number';
