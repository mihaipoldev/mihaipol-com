import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselDots,
} from '@/components/ui/carousel'
import { getHomepageEvents } from '@/features/events/data'
import { getHomepageAlbums } from '@/features/albums/data'
import { getHomepageUpdates } from '@/features/updates/data'
import EventCard from '@/components/features/EventCard'
import AlbumCard from '@/components/features/AlbumCard'
import UpdatesCarousel from '@/components/features/UpdatesCarousel'
import ShowMoreButton from '@/components/features/ShowMoreButton'

export const dynamic = 'force-dynamic'

// Mock hero slides data
const heroSlides = [
  {
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1600&h=900&fit=crop',
    title: 'Midnight Sessions',
    subtitle: 'New EP Out Now'
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&h=900&fit=crop',
    title: 'Live Performances',
    subtitle: 'Upcoming Events'
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&h=900&fit=crop',
    title: 'Deep Techno',
    subtitle: 'Underground Sounds'
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f63ba3f4fe?w=1600&h=900&fit=crop',
    title: 'Electronic Journey',
    subtitle: 'Explore the Collection'
  }
]



export default async function DevHomePage() {
  const events = await getHomepageEvents()
  const albums = await getHomepageAlbums()
  const updates = await getHomepageUpdates()

  return (
    <>
      {/* Hero Section - Full width, breaks out of container */}
      <section className="w-screen relative left-1/2 -translate-x-1/2 -mt-16 mb-12">
        <Carousel 
          className="w-full" 
          opts={{ loop: true, duration: 30 }}
          autoPlay={30000}
        >
          <CarouselContent className="h-screen">
            {heroSlides.map((slide, index) => (
              <CarouselItem key={index} className="pl-0">
                <div
                  className="relative h-screen w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${slide.imageUrl})` }}
                >
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white px-4">
                      <h1 className="text-5xl md:text-7xl font-bold mb-4">
                        {slide.title}
                      </h1>
                      <p className="text-xl md:text-2xl">
                        {slide.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
            <CarouselDots />
          </div>
        </Carousel>
      </section>

      {/* Events Section */}
      <section className="w-screen relative left-1/2 -translate-x-1/2 bg-background mb-16 py-12">
        <div className="mx-auto w-full max-w-[1400px] px-10 md:px-16 lg:px-28">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Events</h2>
            <ShowMoreButton href="/dev/events" label="Show all events" />
          </div>

          {events.length === 0 ? (
            <p className="text-muted-foreground">No events yet.</p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  slug={event.slug}
                  title={event.title}
                  city={event.city}
                  venue={event.venue}
                  starts_at={event.starts_at}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Albums Section */}
      <section className="w-screen relative left-1/2 -translate-x-1/2 bg-muted/30 mb-16 py-12">
        <div className="mx-auto w-full max-w-[1400px] px-10 md:px-16 lg:px-28">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Albums</h2>
            <ShowMoreButton href="/dev/albums" label="Show all albums" />
          </div>

          {albums.length === 0 ? (
            <p className="text-muted-foreground">No albums yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {albums.map((album) => (
                <AlbumCard
                  key={album.id}
                  id={album.id}
                  slug={album.slug}
                  title={album.title}
                  cover_image_url={album.cover_image_url}
                  labelName={album.labelName}
                  release_date={album.release_date}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Updates Section */}
      <section className="w-screen relative left-1/2 -translate-x-1/2 bg-background mb-16 py-12">
        <div className="mx-auto w-full max-w-[1400px] px-10 md:px-16 lg:px-28">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Updates</h2>
            <ShowMoreButton href="/dev/updates" label="Show all updates" />
          </div>

          <UpdatesCarousel updates={updates} />
        </div>
      </section>
    </>
  )
}
