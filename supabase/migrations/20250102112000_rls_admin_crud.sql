-- Helper function to check admin role
-- Uses security definer to bypass RLS and avoid infinite recursion
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_settings s
    where s.user_id = uid and s.role = 'admin'
  );
$$;

-- Give admins full CRUD via RLS policies

-- Albums
drop policy if exists "admin full albums" on public.albums;
create policy "admin full albums" on public.albums
  for all using (public.is_admin(auth.uid()));

-- Artists
drop policy if exists "admin full artists" on public.artists;
create policy "admin full artists" on public.artists
  for all using (public.is_admin(auth.uid()));

-- Events
drop policy if exists "admin full events" on public.events;
create policy "admin full events" on public.events
  for all using (public.is_admin(auth.uid()));

-- Labels
drop policy if exists "admin full labels" on public.labels;
create policy "admin full labels" on public.labels
  for all using (public.is_admin(auth.uid()));

-- Platforms
drop policy if exists "admin full platforms" on public.platforms;
create policy "admin full platforms" on public.platforms
  for all using (public.is_admin(auth.uid()));

-- Updates
drop policy if exists "admin full updates" on public.updates;
create policy "admin full updates" on public.updates
  for all using (public.is_admin(auth.uid()));


