-- Create site_preferences table for configurable content filters
create table if not exists public.site_preferences (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  description text,
  category text not null check (category in ('events', 'albums', 'updates', 'general')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for fast lookups
create index if not exists idx_site_preferences_key on public.site_preferences(key);
create index if not exists idx_site_preferences_category on public.site_preferences(category);

-- Trigger for updated_at
drop trigger if exists set_updated_at on public.site_preferences;
create trigger set_updated_at
  before update on public.site_preferences
  for each row execute procedure public.trigger_set_timestamp();

-- Enable RLS
alter table public.site_preferences enable row level security;

-- Public read access (everyone can read)
drop policy if exists "public can read site_preferences" on public.site_preferences;
create policy "public can read site_preferences" on public.site_preferences
  for select using (true);

-- Admin-only write access (create, update, delete)
drop policy if exists "admin can manage site_preferences" on public.site_preferences;
create policy "admin can manage site_preferences" on public.site_preferences
  for all using (public.is_admin(auth.uid()));

-- Seed initial preferences
insert into public.site_preferences (key, value, description, category) values
  ('events_homepage_days_back', '14'::jsonb, 'Number of days back to show events on homepage', 'events'),
  ('events_homepage_limit', '4'::jsonb, 'Maximum number of events to show on homepage', 'events'),
  ('events_show_past_strikethrough', 'true'::jsonb, 'Show strikethrough on events past yesterday', 'events'),
  ('albums_homepage_limit', '6'::jsonb, 'Maximum number of albums to show on homepage', 'albums'),
  ('updates_homepage_limit', '3'::jsonb, 'Maximum number of updates to show on homepage', 'updates')
on conflict (key) do nothing;

