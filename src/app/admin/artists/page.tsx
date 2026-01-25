import { Suspense } from "react";
import { getAllArtists } from "@/features/artists/data";
import { ArtistsList } from "@/features/artists/components/ArtistsList";
import { AdminPageLoading } from "@/components/admin/ui/AdminPageLoading";

export const dynamic = "force-dynamic";

async function ArtistsContent() {
  const artists = await getAllArtists();
  return <ArtistsList initialArtists={artists} />;
}

export default function ArtistsPage() {
  return (
    <Suspense fallback={<AdminPageLoading />}>
      <ArtistsContent />
    </Suspense>
  );
}
