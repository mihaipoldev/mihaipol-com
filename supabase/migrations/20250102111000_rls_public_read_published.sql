-- Enable RLS and allow anonymous/authenticated read of published rows
-- Only tables with publish_status columns are filtered by publish status
-- Reference tables (artists, labels, platforms) are always publicly readable

-- Albums: publish_status = 'published'
alter table if exists public.albums enable row level security;
drop policy if exists "anon can read published albums" on public.albums;
create policy "anon can read published albums" on public.albums
  for select to anon using (publish_status = 'published');
drop policy if exists "auth can read published albums" on public.albums;
create policy "auth can read published albums" on public.albums
  for select to authenticated using (publish_status = 'published');

-- Events: publish_status = 'published' (events has both event_status and publish_status)
alter table if exists public.events enable row level security;
drop policy if exists "anon can read published events" on public.events;
create policy "anon can read published events" on public.events
  for select to anon using (publish_status = 'published');
drop policy if exists "auth can read published events" on public.events;
create policy "auth can read published events" on public.events
  for select to authenticated using (publish_status = 'published');

-- Updates: publish_status = 'published' (renamed from news_posts)
alter table if exists public.updates enable row level security;
drop policy if exists "anon can read published updates" on public.updates;
create policy "anon can read published updates" on public.updates
  for select to anon using (publish_status = 'published');
drop policy if exists "auth can read published updates" on public.updates;
create policy "auth can read published updates" on public.updates
  for select to authenticated using (publish_status = 'published');

-- Artists: always publicly readable (no publish_status column)
alter table if exists public.artists enable row level security;
drop policy if exists "public can read artists" on public.artists;
create policy "public can read artists" on public.artists
  for select using (true);

-- Labels: always publicly readable (no publish_status column)
alter table if exists public.labels enable row level security;
drop policy if exists "public can read labels" on public.labels;
create policy "public can read labels" on public.labels
  for select using (true);

-- Platforms: always publicly readable (no publish_status column)
alter table if exists public.platforms enable row level security;
drop policy if exists "public can read platforms" on public.platforms;
create policy "public can read platforms" on public.platforms
  for select using (true);


