"use client";

import { useAlbumColors } from "@/components/landing/AlbumGradientBackground";
import Link from "next/link";

export default function AlbumFooterWithColors() {
  const { textColor } = useAlbumColors();

  return (
    <div className="w-full flex-shrink-0 relative z-10 pt-4 pb-6">
      <div className="flex justify-center items-center w-full">
        <div className="w-full max-w-sm mx-auto px-4">
          <div style={{ color: textColor }} className="text-center text-sm">
            © {new Date().getFullYear()} Mihai Pol · Griffith Records ·{" "}
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
      </div>
    </div>
  );
}
