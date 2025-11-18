"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import PageTransition from "@/components/layout/PageTransition";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingHeader from "@/components/landing/LandingHeader";

type ConditionalDevLayoutProps = {
  children: ReactNode;
};

function SimpleHeader() {
  const [scrolled, setScrolled] = useState(false);

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
        scrolled ? "bg-background/80 backdrop-blur-lg border-b border-border/50" : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/dev"
          className="text-2xl font-bold text-foreground hover:opacity-80 transition-opacity relative z-10"
        >
          Mihai Pol
        </Link>
      </div>
    </header>
  );
}

export default function ConditionalDevLayout({ children }: ConditionalDevLayoutProps) {
  const pathname = usePathname();
  const isAlbumSlugPage = pathname?.includes("/dev/albums/") && pathname !== "/dev/albums";

  if (isAlbumSlugPage) {
    // Album pages use their own AlbumHeader component with album colors
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background preset-landing-page-22 relative">
      {/* Animated Background */}
      <div
        className="fixed inset-0 bg-gradient-sunset opacity-10 animate-gradient-shift"
        style={{ backgroundSize: "200% 200%", zIndex: 0 }}
      />

      {/* Floating Background Shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-glow-pulse" />
      </div>

      <LandingHeader />
      <PageTransition>
        <main className="flex-1 w-full relative" style={{ zIndex: 10 }}>
          {children}
        </main>
      </PageTransition>
      <LandingFooter />
    </div>
  );
}
