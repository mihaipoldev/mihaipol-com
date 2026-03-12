import { Suspense } from "react";
import { getAllAlbumsWithLabels } from "@/features/albums/data-admin-server";
import { AlbumsList } from "@/features/albums/components/AlbumsList";
import { AdminPageLoading } from "@/components/admin/ui/AdminPageLoading";

export const dynamic = "force-dynamic";

async function AlbumsContent() {
  const albums = await getAllAlbumsWithLabels();
  return <AlbumsList initialAlbums={albums} />;
}

export default function AlbumsPage() {
  return (
    <Suspense fallback={<AdminPageLoading />}>
      <AlbumsContent />
    </Suspense>
  );
}
