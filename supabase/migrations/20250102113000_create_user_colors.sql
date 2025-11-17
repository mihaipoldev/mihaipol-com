-- Create user_colors table for storing custom brand colors
create table if not exists public.user_colors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  hex_value text not null check (hex_value ~ '^#[0-9A-Fa-f]{6}$'),
  hsl_h integer not null check (hsl_h >= 0 and hsl_h <= 360),
  hsl_s integer not null check (hsl_s >= 0 and hsl_s <= 100),
  hsl_l integer not null check (hsl_l >= 0 and hsl_l <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create index for faster lookups by user
create index if not exists idx_user_colors_user_id on public.user_colors(user_id);

-- Create index for faster lookups by created_at (for ordering)
create index if not exists idx_user_colors_created_at on public.user_colors(created_at desc);

-- Create partial unique index for user color names (only when name is not null)
create unique index if not exists idx_user_colors_unique_name 
  on public.user_colors(user_id, name) 
  where name is not null;

-- Use existing trigger function for updated_at
drop trigger if exists set_updated_at on public.user_colors;
create trigger set_updated_at
  before update on public.user_colors
  for each row execute procedure public.trigger_set_timestamp();

-- Enable RLS
alter table public.user_colors enable row level security;

-- Users can read their own colors
drop policy if exists "user can read own colors" on public.user_colors;
create policy "user can read own colors" on public.user_colors
  for select using (auth.uid() = user_id);

-- Users can insert their own colors
drop policy if exists "user can insert own colors" on public.user_colors;
create policy "user can insert own colors" on public.user_colors
  for insert with check (auth.uid() = user_id);

-- Users can update their own colors
drop policy if exists "user can update own colors" on public.user_colors;
create policy "user can update own colors" on public.user_colors
  for update using (auth.uid() = user_id);

-- Users can delete their own colors
drop policy if exists "user can delete own colors" on public.user_colors;
create policy "user can delete own colors" on public.user_colors
  for delete using (auth.uid() = user_id);

-- Admins have full access (use is_admin function to avoid RLS recursion)
drop policy if exists "admin full access to user_colors" on public.user_colors;
create policy "admin full access to user_colors" on public.user_colors
  for all using (public.is_admin(auth.uid()));

