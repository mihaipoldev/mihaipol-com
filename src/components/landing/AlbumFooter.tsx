"use client";

import { useAlbumColors } from "./AlbumGradientBackground";

export default function AlbumFooter() {
  const { textColor } = useAlbumColors();

  return (
    <div
      className="flex-shrink-0 text-center text-sm py-6 pb-8 px-6 relative z-10"
      style={{ color: textColor }}
    >
      © {new Date().getFullYear()} Mihai Pol · Griffith Records
    </div>
  );
}
