import { redirect } from "next/navigation";
import { getArtistBySlug } from "@/features/artists/data";
import { EditArtistForm } from "@/features/artists/components/EditArtistForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EditArtistPage({ params }: PageProps) {
  const { slug } = await params;
  const isNew = slug === "new";

  const artist = isNew ? null : await getArtistBySlug(slug);

  if (!isNew && !artist) {
    redirect("/admin/artists");
  }

  return <EditArtistForm id={artist?.id || "new"} isNew={isNew} initialArtist={artist} />;
}
