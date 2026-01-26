import { redirect } from "next/navigation";
import { getAlbumBySlugAdmin, getAlbumLinks, getAlbumArtists } from "@/features/albums/data";
import { getAllLabels } from "@/features/labels/data";
import { getAllPlatforms } from "@/features/smart-links/platforms/data";
import { getAllArtists } from "@/features/artists/data";
import { getEntityWorkflowDataServer } from "@/features/workflows/data-server";
import { getEntityAnalyticsData } from "@/features/smart-links/analytics/data";
import { AlbumPage } from "@/features/albums/components/AlbumPage";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EditAlbumPage({ params }: PageProps) {
  const { slug } = await params;
  const isNew = slug === "new";

  // Fetch album first, then fetch related data
  const album = isNew ? null : await getAlbumBySlugAdmin(slug);

  // Fetch all other data in parallel (including workflow and analytics data for instant tab loading)
  const [links, albumArtists, labels, platforms, artists, workflowData, defaultAnalytics] = await Promise.all([
    isNew || !album ? Promise.resolve([]) : getAlbumLinks(album.id),
    isNew || !album ? Promise.resolve([]) : getAlbumArtists(album.id),
    getAllLabels(),
    getAllPlatforms(),
    getAllArtists(),
    // Pre-fetch workflow data server-side for instant automations tab loading
    isNew || !album
      ? Promise.resolve({ workflows: [], presets: [], runs: [] })
      : getEntityWorkflowDataServer("albums", album.id, 10),
    // Pre-fetch analytics data for default scope (30 days) for instant analytics tab loading
    isNew || !album
      ? Promise.resolve(null)
      : getEntityAnalyticsData("album", album.id, "30").catch((error) => {
          console.error("Error pre-fetching analytics:", error);
          return null; // Don't fail page load if analytics fails
        }),
  ]);

  // If editing and album not found, redirect
  if (!isNew && !album) {
    redirect("/admin/albums");
  }

  return (
    <AlbumPage
      id={album?.id || "new"}
      isNew={isNew}
      initialAlbum={album}
      initialLinks={links}
      initialAlbumArtists={albumArtists}
      labels={labels}
      platforms={platforms}
      artists={artists}
      initialWorkflowData={workflowData}
      initialAnalytics={defaultAnalytics || undefined}
    />
  );
}
