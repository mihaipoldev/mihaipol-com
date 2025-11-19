"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAlbumColors } from "./AlbumGradientBackground";
import { cn } from "@/lib/utils";

export default function AlbumHeader() {
  const [scrolled, setScrolled] = useState(false);
  const { textColor } = useAlbumColors();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-[150] transition-all duration-300",
        scrolled ? "backdrop-blur-2xl border-b" : "bg-transparent backdrop-blur-none"
      )}
      style={
        scrolled
          ? {
              backdropFilter: "blur(40px)",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              borderColor: "rgba(0, 0, 0, 0.1)",
            }
          : undefined
      }
    >
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/dev"
          className="text-2xl font-bold hover:opacity-80 transition-opacity relative z-10"
          style={{ color: textColor }}
        >
          Mihai Pol
        </Link>
      </div>
    </header>
  );
}
