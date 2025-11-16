-- Development seed data for mihaipol.com
-- This script inserts mock data for development and testing
-- Run this after the initial schema migrations have been applied
-- 
-- Note: This script uses explicit UUIDs for consistency in relationships
-- In production, you would typically let PostgreSQL generate UUIDs

-- ========================================
-- 1. ARTISTS
-- ========================================

INSERT INTO public.artists (id, name, slug, bio, city, country) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Mihai Pol', 'mihai-pol', 
   'Electronic music producer and DJ known for deep techno and progressive house. Based in Romania.', 
   'Bucharest', 'Romania'),
  ('a0000000-0000-0000-0000-000000000002', 'Echo Valley', 'echo-valley', 
   'Techno duo pushing boundaries in underground electronic music.', 
   'Berlin', 'Germany');

-- ========================================
-- 2. LABELS
-- ========================================

INSERT INTO public.labels (id, name, slug, description, website_url) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Griffith Records', 'griffith-records', 
   'Independent electronic music label focusing on deep techno and progressive sounds.', 
   'https://griffithrecords.com'),
  ('b0000000-0000-0000-0000-000000000002', 'Deep Space Records', 'deep-space-records', 
   'Underground label dedicated to experimental techno and ambient electronic music.', 
   'https://deepspacerecords.com'),
  ('b0000000-0000-0000-0000-000000000003', 'Midnight Grooves', 'midnight-grooves', 
   'Record label specializing in deep house and minimal techno releases.', 
   'https://midnightgrooves.com');

-- ========================================
-- 3. PLATFORMS
-- ========================================

INSERT INTO public.platforms (id, name, display_name, base_url, sort_order) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'spotify', 'Spotify', 'https://open.spotify.com', 1),
  ('c0000000-0000-0000-0000-000000000002', 'beatport', 'Beatport', 'https://www.beatport.com', 2),
  ('c0000000-0000-0000-0000-000000000003', 'bandcamp', 'Bandcamp', 'https://bandcamp.com', 3),
  ('c0000000-0000-0000-0000-000000000004', 'soundcloud', 'SoundCloud', 'https://soundcloud.com', 4),
  ('c0000000-0000-0000-0000-000000000005', 'youtube', 'YouTube Music', 'https://music.youtube.com', 5),
  ('c0000000-0000-0000-0000-000000000006', 'apple', 'Apple Music', 'https://music.apple.com', 6);

-- ========================================
-- 4. ALBUMS
-- ========================================

INSERT INTO public.albums (id, title, slug, catalog_number, album_type, description, release_date, label_id, publish_status) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Midnight Sessions', 'midnight-sessions', 'GRF001', 'EP', 
   'A deep journey through the night with hypnotic techno rhythms and atmospheric soundscapes.', 
   '2024-03-15', 'b0000000-0000-0000-0000-000000000001', 'published'),
  ('d0000000-0000-0000-0000-000000000002', 'Echoes of Tomorrow', 'echoes-of-tomorrow', 'GRF002', 'LP', 
   'Full-length album exploring the intersection of progressive house and deep techno.', 
   '2024-06-20', 'b0000000-0000-0000-0000-000000000001', 'published'),
  ('d0000000-0000-0000-0000-000000000003', 'Urban Dreams', 'urban-dreams', 'DSR045', 'EP', 
   'Experimental techno EP featuring dark, industrial sounds and driving basslines.', 
   '2024-09-10', 'b0000000-0000-0000-0000-000000000002', 'published'),
  ('d0000000-0000-0000-0000-000000000004', 'Sunset Drive', 'sunset-drive', 'MGR012', 'Single', 
   'Uplifting progressive house single perfect for sunset moments and long drives.', 
   '2024-11-01', 'b0000000-0000-0000-0000-000000000003', 'published');

-- ========================================
-- 5. EVENTS
-- ========================================

-- Upcoming events
INSERT INTO public.events (id, title, slug, description, venue, city, country, date, tickets_url, ticket_label, event_status, publish_status) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'Techno Nights Festival', 'techno-nights-festival', 
   'Annual techno festival featuring the best underground artists from around Europe.', 
   'Warehouse District', 'Berlin', 'Germany', 
   '2025-06-15', 
   'https://tickets.example.com/techno-nights', 'Get Tickets', 'upcoming', 'published'),
  ('e0000000-0000-0000-0000-000000000002', 'Deep Space Sessions', 'deep-space-sessions', 
   'Monthly underground techno night showcasing deep and progressive sounds.', 
   'The Basement Club', 'Amsterdam', 'Netherlands', 
   '2025-02-10', 
   'https://tickets.example.com/deep-space', 'Buy Tickets', 'upcoming', 'published'),
  ('e0000000-0000-0000-0000-000000000003', 'Midnight Grooves Showcase', 'midnight-grooves-showcase', 
   'Exclusive showcase event featuring label artists and special guests.', 
   'Club Resonance', 'Bucharest', 'Romania', 
   '2025-03-20', 
   'https://tickets.example.com/midnight-grooves', 'Reserve', 'upcoming', 'published'),
  ('e0000000-0000-0000-0000-000000000004', 'Summer Festival 2025', 'summer-festival-2025', 
   'Outdoor electronic music festival with multiple stages and international DJs.', 
   'Parque Central', 'Lisbon', 'Portugal', 
   '2025-07-25', 
   'https://tickets.example.com/summer-fest', 'Early Bird Tickets', 'upcoming', 'published');

-- Past events
INSERT INTO public.events (id, title, slug, description, venue, city, country, date, event_status, publish_status) VALUES
  ('e0000000-0000-0000-0000-000000000005', 'New Year''s Eve Special', 'new-years-eve-special', 
   'Celebrating the new year with a special extended set and midnight countdown.', 
   'The Warehouse', 'Berlin', 'Germany', 
   '2024-12-31', 
   'past', 'published'),
  ('e0000000-0000-0000-0000-000000000006', 'Album Launch Party', 'album-launch-party', 
   'Launch party for "Echoes of Tomorrow" album with live performance and DJ sets.', 
   'Studio Club', 'Bucharest', 'Romania', 
   '2024-06-20', 
   'past', 'published');

-- ========================================
-- 6. UPDATES (News Posts)
-- ========================================

INSERT INTO public.updates (id, title, slug, subtitle, description, date, publish_status, read_more_url) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'New EP "Midnight Sessions" Out Now', 'new-ep-midnight-sessions-out-now', 
   'Available on all major platforms', 
   'We''re excited to announce the release of our new EP "Midnight Sessions" on Griffith Records. This 4-track journey takes you deep into the night with hypnotic techno rhythms and atmospheric soundscapes. Available now on Spotify, Beatport, Bandcamp, and all major streaming platforms.', 
   '2024-03-15 10:00:00+00', 'published', 'https://open.spotify.com/album/example'),
  ('f0000000-0000-0000-0000-000000000002', 'Upcoming European Tour Dates', 'upcoming-european-tour-dates', 
   'Berlin, Amsterdam, Lisbon and more', 
   'We''re hitting the road this summer with stops in Berlin, Amsterdam, Bucharest, and Lisbon. Join us for an unforgettable night of deep techno and progressive house. Tickets are now on sale for all dates.', 
   '2025-01-10 14:00:00+00', 'published', 'https://tickets.example.com'),
  ('f0000000-0000-0000-0000-000000000003', 'Album "Echoes of Tomorrow" Released', 'album-echoes-of-tomorrow-released', 
   'Full-length album now streaming', 
   'Our debut full-length album "Echoes of Tomorrow" is finally here! After months of production, we''re proud to share this 5-track journey that explores the intersection of progressive house and deep techno. Thank you to everyone who has supported us on this journey.', 
   '2024-06-20 12:00:00+00', 'published', 'https://open.spotify.com/album/example2'),
  ('f0000000-0000-0000-0000-000000000004', 'New Single "Sunset Drive" Coming Soon', 'new-single-sunset-drive-coming-soon', 
   'Release date: November 1st, 2024', 
   'Get ready for our latest single "Sunset Drive" releasing on November 1st via Midnight Grooves. This uplifting progressive house track is perfect for sunset moments and long drives. Pre-save it now on your favorite platform!', 
   '2024-10-15 09:00:00+00', 'published', 'https://presave.example.com/sunset-drive');

-- ========================================
-- 7. ALBUM_ARTISTS (linking albums to artists)
-- ========================================

INSERT INTO public.album_artists (album_id, artist_id, role, sort_order) VALUES
  -- Midnight Sessions - Mihai Pol (primary)
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'primary', 1),
  -- Echoes of Tomorrow - Mihai Pol (primary)
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'primary', 1),
  -- Urban Dreams - Mihai Pol (primary)
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'primary', 1),
  -- Urban Dreams - Echo Valley (featured)
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'featured', 2),
  -- Sunset Drive - Mihai Pol (primary)
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'primary', 1);

-- ========================================
-- 8. ALBUM_LINKS (external links for albums)
-- ========================================

-- Midnight Sessions links
INSERT INTO public.album_links (album_id, platform_id, url, cta_label, link_type, sort_order) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'https://open.spotify.com/album/midnight-sessions', 'Stream on Spotify', 'stream', 1),
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'https://www.beatport.com/release/midnight-sessions/1234567', 'Buy on Beatport', 'buy', 2),
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'https://mihai-pol.bandcamp.com/album/midnight-sessions', 'Buy on Bandcamp', 'buy', 3);

-- Echoes of Tomorrow links
INSERT INTO public.album_links (album_id, platform_id, url, cta_label, link_type, sort_order) VALUES
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'https://open.spotify.com/album/echoes-of-tomorrow', 'Stream on Spotify', 'stream', 1),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'https://www.beatport.com/release/echoes-of-tomorrow/2345678', 'Buy on Beatport', 'buy', 2),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000005', 'https://music.youtube.com/playlist?list=example', 'Stream on YouTube', 'stream', 3),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000006', 'https://music.apple.com/album/echoes-of-tomorrow/1234567890', 'Stream on Apple Music', 'stream', 4);

-- Urban Dreams links
INSERT INTO public.album_links (album_id, platform_id, url, cta_label, link_type, sort_order) VALUES
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'https://open.spotify.com/album/urban-dreams', 'Stream on Spotify', 'stream', 1),
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004', 'https://soundcloud.com/mihai-pol/sets/urban-dreams', 'Stream on SoundCloud', 'stream', 2),
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'https://www.beatport.com/release/urban-dreams/3456789', 'Buy on Beatport', 'buy', 3);

-- Sunset Drive links
INSERT INTO public.album_links (album_id, platform_id, url, cta_label, link_type, sort_order) VALUES
  ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'https://open.spotify.com/track/sunset-drive', 'Stream on Spotify', 'stream', 1),
  ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'https://www.beatport.com/track/sunset-drive/4567890', 'Buy on Beatport', 'buy', 2),
  ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003', 'https://mihai-pol.bandcamp.com/track/sunset-drive', 'Buy on Bandcamp', 'buy', 3);

-- ========================================
-- 9. EVENT_ARTISTS (lineups for events)
-- ========================================

-- Techno Nights Festival lineup
INSERT INTO public.event_artists (event_id, artist_id, role, set_time, sort_order) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'artist', '2025-06-16 00:00:00+00', 1),
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'artist', '2025-06-16 02:00:00+00', 2);

-- Deep Space Sessions lineup
INSERT INTO public.event_artists (event_id, artist_id, role, set_time, sort_order) VALUES
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'headliner', '2025-02-11 00:00:00+00', 1);

-- Midnight Grooves Showcase lineup
INSERT INTO public.event_artists (event_id, artist_id, role, set_time, sort_order) VALUES
  ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'headliner', '2025-03-20 22:00:00+00', 1);

-- Summer Festival 2025 lineup
INSERT INTO public.event_artists (event_id, artist_id, role, set_time, sort_order) VALUES
  ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'artist', '2025-07-25 21:00:00+00', 1),
  ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'artist', '2025-07-25 23:00:00+00', 2);

-- Past events
INSERT INTO public.event_artists (event_id, artist_id, role, set_time, sort_order) VALUES
  ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'headliner', '2025-01-01 00:00:00+00', 1),
  ('e0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'headliner', '2024-06-20 21:00:00+00', 1);

