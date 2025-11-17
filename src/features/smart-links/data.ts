import { getAlbumWithLinksBySlug } from "@/features/albums/data";

export type AlbumSummary = {
  id: string;
  slug: string;
  title: string;
  artistName?: string | null;
  catalog_number?: string | null;
  coverImageUrl?: string | null;
};

export type SmartLink = {
  id: string;
  url: string;
  platformName: string;
  platformIconUrl?: string | null;
  ctaLabel?: string | null;
};

export type SmartLinksPayload = {
  album: AlbumSummary;
  links: SmartLink[];
} | null;

export async function getAlbumSmartLinksBySlug(slug: string): Promise<SmartLinksPayload> {
  return getAlbumWithLinksBySlug(slug) as Promise<SmartLinksPayload>;
}
