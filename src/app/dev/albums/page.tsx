import { getAllAlbums } from '@/features/albums/data'
import AlbumCard from '@/components/features/AlbumCard'
import TrackView from '@/components/analytics/TrackView'

export const dynamic = 'force-dynamic'

export default async function AlbumsPage() {
  const albums = await getAllAlbums()

  return (
    <div className="min-h-screen bg-background">
      <TrackView eventType="section_view" entityType="site_section" entityId="albums" />
      <div className="mx-auto w-full max-w-7xl py-16">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">All Albums</h1>
          <p className="text-lg text-muted-foreground">
            Explore all releases and collections.
          </p>
        </div>

        {/* Albums Grid */}
        {albums.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No albums yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album) => (
              <AlbumCard
                key={album.id}
                id={album.id}
                slug={album.slug}
                title={album.title}
                cover_image_url={album.cover_image_url}
                labelName={album.labelName}
                release_date={album.release_date}
                className="w-full"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

