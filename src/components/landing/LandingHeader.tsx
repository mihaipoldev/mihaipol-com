"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/theme/ThemeToggle";

const navLinks = [
  { label: "Events", target: "events" },
  { label: "Albums", target: "albums" },
  { label: "Griffith", target: "griffith" },
  { label: "Updates", target: "updates" },
];

export default function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSmoothScroll = (target: string) => {
    const el = document.getElementById(target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bg-background/80 backdrop-blur-lg border-b border-border/50" : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/dev"
          className="text-2xl font-bold text-gradient-sunset hover:opacity-80 transition-opacity"
        >
          Mihai Pol
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Button
              key={link.target}
              variant="ghost"
              size="sm"
              className="text-sm font-medium hover:text-primary transition-colors bg-transparent shadow-none hover:bg-transparent px-0"
              onClick={() => handleSmoothScroll(link.target)}
            >
              {link.label}
            </Button>
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
