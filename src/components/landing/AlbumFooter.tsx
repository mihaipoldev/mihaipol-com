"use client";

import Link from "next/link";
import { useAlbumColors } from "./AlbumGradientBackground";

export default function AlbumFooter() {
  const { textColor } = useAlbumColors();

  return (
    <div
      className="flex-shrink-0 text-center text-sm pt-3 pb-4 px-6 relative z-10 space-y-2"
      style={{ color: textColor }}
    >
      <div>© {new Date().getFullYear()} Mihai Pol · Griffith Records</div>
      <div>
        <Link
          href="https://mihaipol.com"
          target="_blank"
          rel="noreferrer"
          className="hover:opacity-80 transition-opacity"
          style={{ color: textColor }}
        >
          mihaipol.com
        </Link>
      </div>
    </div>
  );
}
