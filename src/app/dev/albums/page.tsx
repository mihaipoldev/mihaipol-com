import { getAllAlbums } from "@/features/albums/data";
import LandingAlbumsList from "@/components/landing/lists/LandingAlbumsList";

export const dynamic = "force-dynamic";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1000&q=80";

export default async function AlbumsPage() {
  const albums = await getAllAlbums();

  return (
    <div className="min-h-screen">
      <div className="py-24 px-6">
        <div className="container mx-auto px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Albums &amp; Singles</h1>
            <p className="text-muted-foreground">All releases and collections.</p>
          </div>

          {albums.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No albums yet. Check back soon.</p>
            </div>
          ) : (
            <LandingAlbumsList albums={albums} fallbackImage={FALLBACK_IMAGE} />
          )}
        </div>
      </div>
    </div>
  );
}
