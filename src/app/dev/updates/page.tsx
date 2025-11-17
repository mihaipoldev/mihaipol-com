import { getAllUpdates } from '@/features/updates/data'
import UpdateCard from '@/components/features/UpdateCard'
import TrackView from '@/features/smart-links/analytics/components/TrackView'
import PageHeader from '@/components/layout/PageHeader'

export const dynamic = 'force-dynamic'

export default async function UpdatesPage() {
  const updates = await getAllUpdates()

  return (
    <div className="min-h-screen bg-background">
      <TrackView eventType="section_view" entityType="site_section" entityId="updates" />
      <div className="mx-auto w-full max-w-7xl py-16">
        <PageHeader
          className="mb-12"
          title="Updates"
          description="News, thoughts, and announcements."
        />

        {/* Updates Grid */}
        {updates.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No updates yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {updates.map((update) => (
              <UpdateCard
                key={update.id}
                id={update.id}
                slug={update.slug}
                title={update.title}
                image_url={update.image_url}
                date={update.date}
                description={update.description}
                className="w-full"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

