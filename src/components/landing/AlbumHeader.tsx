"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useAlbumColors } from "./AlbumGradientBackground";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AlbumHeader() {
  const [scrolled, setScrolled] = useState(false);
  const { textColor } = useAlbumColors();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-[150] transition-all duration-300",
        scrolled ? "bg-background/80 backdrop-blur-lg border-b border-border/50" : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/dev"
          className="text-2xl font-bold hover:opacity-80 transition-opacity relative z-10"
          style={{ color: textColor }}
        >
          Mihai Pol
        </Link>
        <div className="relative z-10">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="transition-all duration-300 hover:bg-accent/50"
            style={{ color: textColor }}
          >
            {mounted ? (
              isDark ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )
            ) : (
              <Moon className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
