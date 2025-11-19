import { getAllUpdates } from "@/features/updates/data";
import { getSitePreferenceNumber } from "@/features/settings/data";
import LandingUpdatesList from "@/components/landing/lists/LandingUpdatesList";
import TrackView from "@/features/smart-links/analytics/components/TrackView";

export const dynamic = "force-dynamic";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1000&q=80";

export default async function UpdatesPage() {
  const [updates, updatesPageColumns] = await Promise.all([
    getAllUpdates(),
    getSitePreferenceNumber("updates_page_columns", 3),
  ]);

  return (
    <>
      <TrackView eventType="section_view" entityType="site_section" entityId="updates" />
      <div className="py-24 px-6">
        <div className="container mx-auto px-0 md:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Updates</h1>
            <p className="text-muted-foreground">Latest news and announcements.</p>
          </div>

          {updates.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No updates yet. Check back soon.</p>
            </div>
          ) : (
            <LandingUpdatesList
              updates={updates}
              fallbackImage={FALLBACK_IMAGE}
              variant="compact-square"
              columns={updatesPageColumns as 3 | 4 | 5}
            />
          )}
        </div>
      </div>
    </>
  );
}

/* 

card-badge - Original
default - Clean vertical
horizontal - Side-by-side
overlay - Text on image
compact - Smaller cards (horizontal/rectangular)
compact-square - Smaller cards (square image)
featured - Larger, prominent
minimal - Minimal design

*/
