-- Create user_settings table with role metadata and RLS
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','user')) default 'user',
  avatar_url text,
  style_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- helper trigger to maintain updated_at
create or replace function public.trigger_set_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.user_settings;
create trigger set_updated_at
  before update on public.user_settings
  for each row execute procedure public.trigger_set_timestamp();

-- Enable RLS and policies
alter table public.user_settings enable row level security;

-- Users can read their own settings
drop policy if exists "user can read own settings" on public.user_settings;
create policy "user can read own settings" on public.user_settings
  for select using (auth.uid() = user_id);

-- Users can update their own settings
drop policy if exists "user can update own settings" on public.user_settings;
create policy "user can update own settings" on public.user_settings
  for update using (auth.uid() = user_id);

-- Admins have full access (note: this policy is created before is_admin function exists)
-- We'll update it in a later migration to use is_admin() to avoid recursion
drop policy if exists "admin full access to user_settings" on public.user_settings;
create policy "admin full access to user_settings" on public.user_settings
  for all using (
    exists (
      select 1
      from public.user_settings us
      where us.user_id = auth.uid()
        and us.role = 'admin'
    )
  );


