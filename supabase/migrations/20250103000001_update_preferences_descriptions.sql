-- Update preference descriptions to remove example text
update public.site_preferences
set description = 'Number of days back to show events on homepage'
where key = 'events_homepage_days_back';

