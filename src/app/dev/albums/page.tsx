import { getAllAlbums } from "@/features/albums/data";
import { getLabelBySlug } from "@/features/labels/data";
import LandingAlbumsList from "@/components/landing/lists/LandingAlbumsList";

export const dynamic = "force-dynamic";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1000&q=80";

type AlbumsPageProps = {
  searchParams: Promise<{ label?: string }>;
};

export default async function AlbumsPage({ searchParams }: AlbumsPageProps) {
  const params = await searchParams;
  const labelSlug = params.label || undefined;
  
  // Fetch label info if filtering by label
  const label = labelSlug ? await getLabelBySlug(labelSlug) : null;
  const albums = await getAllAlbums(undefined, labelSlug);

  const pageTitle = label ? label.name : "Discography";
  const pageDescription = label 
    ? `Releases from ${label.name}.`
    : "All releases and collections.";

  return (
    <div className="min-h-screen">
      <div className="py-24 px-6">
        <div className="container mx-auto px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">{pageTitle}</h1>
            <p className="text-muted-foreground">{pageDescription}</p>
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
