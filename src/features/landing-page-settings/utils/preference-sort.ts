export function getPreferenceSortOrder(key: string, category: string): number {
  const orderMaps: Record<string, Record<string, number>> = {
    events: {
      events_homepage_limit: 1,
      events_homepage_days_back: 2,
      events_show_past_strikethrough: 3,
    },
    albums: {
      albums_homepage_columns: 1,
      albums_homepage_limit: 2,
      albums_page_columns: 3,
    },
    updates: {
      updates_homepage_columns: 1,
      updates_homepage_limit: 2,
      updates_page_columns: 3,
    },
    general: {
      landing_page_preset_number: 1,
      landing_page_preset_prod: 2,
    },
    griffith: {
      griffith_albums_homepage_columns: 1,
      griffith_albums_homepage_limit: 2,
    },
    feature: {
      featured_album_id: 1,
    },
  };

  return orderMaps[category]?.[key] ?? 999; // Unknown preferences go to the end
}
