-- Initial schema migration for mihaipol.com artist website
-- Creates all enum types, tables, constraints, and indexes from scratch
-- 
-- To generate TypeScript types after running this migration:
-- npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
-- OR if using Supabase CLI locally:
-- supabase gen types typescript --local > src/types/database.types.ts

-- ========================================
-- ENUM TYPES
-- ========================================

-- Publish status for albums, events, and news posts
CREATE TYPE public.publish_status AS ENUM (
  'draft',
  'scheduled',
  'published',
  'archived'
);

-- Event status for gigs/tours
CREATE TYPE public.event_status AS ENUM (
  'upcoming',
  'past',
  'cancelled'
);

-- Artist role in albums
CREATE TYPE public.artist_role AS ENUM (
  'primary',
  'featured',
  'remixer'
);

-- ========================================
-- TABLE: public.artists
-- ========================================

CREATE TABLE public.artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  bio text,
  profile_image_url text,
  city text,
  country text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_artists_name ON public.artists(name);

-- ========================================
-- TABLE: public.labels
-- ========================================

CREATE TABLE public.labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  website_url text,
  logo_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_labels_name ON public.labels(name);

-- ========================================
-- TABLE: public.platforms
-- ========================================

CREATE TABLE public.platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  base_url text,
  icon_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ========================================
-- TABLE: public.albums
-- ========================================

CREATE TABLE public.albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  catalog_number text,
  album_type text,
  description text,
  cover_image_url text,
  release_date date,
  label_id uuid REFERENCES public.labels(id) ON DELETE SET NULL,
  publish_status public.publish_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_albums_release_date ON public.albums(release_date);
CREATE INDEX idx_albums_label_id ON public.albums(label_id);

-- ========================================
-- TABLE: public.tracks
-- ========================================

CREATE TABLE public.tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  position integer,
  title text NOT NULL,
  mix_name text,
  duration_seconds integer,
  is_bonus boolean NOT NULL DEFAULT false,
  preview_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tracks_album_id ON public.tracks(album_id);

-- ========================================
-- TABLE: public.events
-- ========================================

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  venue text,
  city text,
  country text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  tickets_url text,
  ticket_label text DEFAULT 'Tickets',
  event_status public.event_status NOT NULL DEFAULT 'upcoming',
  publish_status public.publish_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_starts_at ON public.events(starts_at);
CREATE INDEX idx_events_event_status ON public.events(event_status);

-- ========================================
-- TABLE: public.news_posts
-- ========================================

CREATE TABLE public.news_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  subtitle text,
  content text,
  image_url text,
  publish_date timestamptz,
  publish_status public.publish_status NOT NULL DEFAULT 'draft',
  read_more_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_news_posts_publish_date ON public.news_posts(publish_date);
CREATE INDEX idx_news_posts_publish_status ON public.news_posts(publish_status);

-- ========================================
-- TABLE: public.album_artists
-- ========================================

CREATE TABLE public.album_artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  artist_id uuid NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  role public.artist_role NOT NULL DEFAULT 'primary',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (album_id, artist_id, role)
);

CREATE INDEX idx_album_artists_album_id ON public.album_artists(album_id);
CREATE INDEX idx_album_artists_artist_id ON public.album_artists(artist_id);

-- ========================================
-- TABLE: public.album_links
-- ========================================

CREATE TABLE public.album_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  platform_id uuid REFERENCES public.platforms(id) ON DELETE SET NULL,
  url text NOT NULL,
  cta_label text NOT NULL,
  link_type text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (album_id, platform_id, url)
);

CREATE INDEX idx_album_links_album_id ON public.album_links(album_id);
CREATE INDEX idx_album_links_platform_id ON public.album_links(platform_id);

-- ========================================
-- TABLE: public.artist_links
-- ========================================

CREATE TABLE public.artist_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  platform_id uuid REFERENCES public.platforms(id) ON DELETE SET NULL,
  url text NOT NULL,
  link_type text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (artist_id, platform_id, url)
);

CREATE INDEX idx_artist_links_artist_id ON public.artist_links(artist_id);
CREATE INDEX idx_artist_links_platform_id ON public.artist_links(platform_id);

-- ========================================
-- TABLE: public.event_artists
-- ========================================

CREATE TABLE public.event_artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  artist_id uuid NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  role text DEFAULT 'artist',
  set_time timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, artist_id, role)
);

CREATE INDEX idx_event_artists_event_id ON public.event_artists(event_id);
CREATE INDEX idx_event_artists_artist_id ON public.event_artists(artist_id);

