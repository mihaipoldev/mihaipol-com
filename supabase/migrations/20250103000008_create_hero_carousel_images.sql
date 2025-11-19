-- Create hero_carousel_images table
create table if not exists public.hero_carousel_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for fast lookups
create index if not exists idx_hero_carousel_images_sort_order on public.hero_carousel_images(sort_order);
create index if not exists idx_hero_carousel_images_is_active on public.hero_carousel_images(is_active);

-- Trigger for updated_at
drop trigger if exists set_updated_at on public.hero_carousel_images;
create trigger set_updated_at
  before update on public.hero_carousel_images
  for each row execute procedure public.trigger_set_timestamp();

-- Enable RLS
alter table public.hero_carousel_images enable row level security;

-- Public read access (everyone can read active images)
drop policy if exists "public can read active hero_carousel_images" on public.hero_carousel_images;
create policy "public can read active hero_carousel_images" on public.hero_carousel_images
  for select using (is_active = true);

-- Admin-only write access (create, update, delete)
drop policy if exists "admin can manage hero_carousel_images" on public.hero_carousel_images;
create policy "admin can manage hero_carousel_images" on public.hero_carousel_images
  for all using (public.is_admin(auth.uid()));

-- Admin can read all images (including inactive)
drop policy if exists "admin can read all hero_carousel_images" on public.hero_carousel_images;
create policy "admin can read all hero_carousel_images" on public.hero_carousel_images
  for select using (public.is_admin(auth.uid()));

-- Seed with existing hero images
insert into public.hero_carousel_images (image_url, alt_text, sort_order, is_active) values
  ('/hero images/02__B_0116.jpg', 'Hero image 1', 0, true),
  ('/hero images/04__B_0242.jpg', 'Hero image 2', 1, true),
  ('/hero images/01_BB_9497.jpg', 'Hero image 3', 2, true)
on conflict do nothing;

