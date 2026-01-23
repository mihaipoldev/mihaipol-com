"use client";

import { useAlbumColors } from "@/features/smart-links/layout/SmartLinksGradientBackground";

type SmartLinksAlbumHeaderProps = {
  title: string;
  artistName?: string | null;
  catalog_number?: string | null;
};

export default function SmartLinksAlbumHeader({ title, artistName, catalog_number }: SmartLinksAlbumHeaderProps) {
  const { textColor, mutedColor } = useAlbumColors();

  return (
    <div className="space-y-2 text-center">
      <h1 className="text-2xl font-bold sm:text-2xl" style={{ color: textColor }}>
        {artistName ? `${artistName} - ${title}` : title}
      </h1>
      {catalog_number ? (
        <p className="text-sm" style={{ color: mutedColor }}>
          {catalog_number}
        </p>
      ) : null}
    </div>
  );
}
