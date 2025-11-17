-- Fix RLS recursion issues by updating is_admin() function and policies
-- This migration fixes the infinite recursion in RLS policies

-- Update is_admin() function to use security definer (bypasses RLS)
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

-- Fix user_settings admin policy to use is_admin() function
drop policy if exists "admin full access to user_settings" on public.user_settings;
create policy "admin full access to user_settings" on public.user_settings
  for all using (public.is_admin(auth.uid()));

-- Fix user_colors admin policy to use is_admin() function
drop policy if exists "admin full access to user_colors" on public.user_colors;
create policy "admin full access to user_colors" on public.user_colors
  for all using (public.is_admin(auth.uid()));

