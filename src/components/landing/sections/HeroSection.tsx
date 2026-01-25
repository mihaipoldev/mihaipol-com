"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { LandingAlbum, LandingEvent } from "../types";

type HeroSectionProps = {
  heroImage: string;
  heroImages: string[];
  featuredAlbum: LandingAlbum | null;
  events: LandingEvent[];
  albums: LandingAlbum[];
};

export default function HeroSection({
  heroImage,
  heroImages,
  featuredAlbum,
  events,
  albums,
}: HeroSectionProps) {
  const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1000&q=80";

  // Use heroImages prop, fallback to empty array
  const HERO_IMAGES = heroImages.length > 0 ? heroImages : [heroImage];

  // Find initial index by matching filename
  const getInitialIndex = () => {
    const heroFilename = heroImage.split("/").pop() || "";
    const foundIndex = HERO_IMAGES.findIndex((img) => img.includes(heroFilename));
    return foundIndex >= 0 ? foundIndex : 0;
  };

  const [currentImageIndex, setCurrentImageIndex] = useState(() => getInitialIndex());
  const [buttonsOpacity, setButtonsOpacity] = useState(1);
  const sectionRef = useRef<HTMLElement>(null);
  const autoAdvanceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentImageIndexRef = useRef(currentImageIndex);
  const currentImage = HERO_IMAGES[currentImageIndex] || FALLBACK_IMAGE;

  // Keep refs in sync with state
  useEffect(() => {
    currentImageIndexRef.current = currentImageIndex;
  }, [currentImageIndex]);

  // Load saved index from localStorage on mount
  useEffect(() => {
    const savedIndex = localStorage.getItem("hero-carousel-index");
    if (savedIndex !== null) {
      const parsedIndex = parseInt(savedIndex, 10);
      if (!isNaN(parsedIndex) && parsedIndex >= 0 && parsedIndex < HERO_IMAGES.length) {
        setCurrentImageIndex(parsedIndex);
      }
    }
  }, []);

  const handlePrevious = () => {
    const currentIdx = currentImageIndexRef.current;
    const newIndex = currentIdx === 0 ? HERO_IMAGES.length - 1 : currentIdx - 1;
    setCurrentImageIndex(newIndex);

    // Reset auto-advance timer after manual navigation
    if (autoAdvanceIntervalRef.current) {
      clearInterval(autoAdvanceIntervalRef.current);
    }
    autoAdvanceIntervalRef.current = setInterval(() => {
      handleNext();
    }, 10000);
  };

  const handleNext = () => {
    const currentIdx = currentImageIndexRef.current;
    const newIndex = currentIdx === HERO_IMAGES.length - 1 ? 0 : currentIdx + 1;
    setCurrentImageIndex(newIndex);

    // Reset auto-advance timer after manual navigation
    if (autoAdvanceIntervalRef.current) {
      clearInterval(autoAdvanceIntervalRef.current);
    }
    autoAdvanceIntervalRef.current = setInterval(() => {
      handleNext();
    }, 10000);
  };

  // Save current image index to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("hero-carousel-index", currentImageIndex.toString());
  }, [currentImageIndex]);

  // Set up auto-advance carousel
  useEffect(() => {
    // Start auto-advance
    autoAdvanceIntervalRef.current = setInterval(() => {
      handleNext();
    }, 10000); // 10 seconds

    // Cleanup on unmount
    return () => {
      if (autoAdvanceIntervalRef.current) {
        clearInterval(autoAdvanceIntervalRef.current);
      }
    };
  }, []); // Only run on mount

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Calculate opacity based on how much of the hero section is still visible
      // Start fading earlier and complete faster
      const heroBottom = rect.bottom;
      const fadeStart = viewportHeight * 1.1; // Start fading when hero bottom is at 110% of viewport (slightly above)
      const fadeEnd = viewportHeight * 0.7; // Fully faded when hero bottom is at 70% of viewport (smaller range = faster fade)

      let opacity = 1;

      if (heroBottom < fadeStart) {
        // Calculate opacity: 1 at fadeStart, 0 when heroBottom reaches fadeEnd
        const fadeRange = fadeStart - fadeEnd;
        const scrolledPast = fadeStart - heroBottom;
        opacity = Math.max(0, 1 - scrolledPast / fadeRange);
      }

      setButtonsOpacity(opacity);
    };

    handleScroll(); // Initial check
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  const releaseTitle = featuredAlbum?.title ?? albums[0]?.title ?? "New Horizons";
  const releaseLabel = featuredAlbum?.labelName ?? "Independent Release";
  const releaseMeta = featuredAlbum?.release_date ?? events[0]?.date ?? new Date().toISOString();
  const formattedMeta = new Date(releaseMeta).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <section ref={sectionRef} className="relative min-h-screen w-full overflow-hidden">
      {/* Full width image - glued to top with fade at bottom */}
      <div className="absolute inset-0 w-full h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 w-full h-full"
            style={{
              maskImage:
                "linear-gradient(to bottom, black 0%, black 30%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0.5) 65%, rgba(0,0,0,0.2) 80%, transparent 95%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black 0%, black 30%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0.5) 65%, rgba(0,0,0,0.2) 80%, transparent 95%)",
            }}
          >
            <Image
              src={currentImage}
              alt={releaseTitle}
              fill
              priority={currentImageIndex === 0}
              quality={90}
              sizes="100vw"
              className="object-cover"
              unoptimized={currentImage.startsWith("http")}
            />
          </motion.div>
        </AnimatePresence>
        {/* Logo overlay - blended as texture/shadow */}
        <div className="absolute bottom-[30%] left-[10%] pointer-events-none hidden md:block">
          <img
            src="/griffithblack.svg"
            alt="Griffith Logo"
            className="w-[400px] h-[400px] opacity-[0.08] mix-blend-overlay"
            style={{
              filter: "invert(1) brightness(1.2)",
            }}
          />
        </div>
      </div>

      {/* Overlay content on top of image */}
      <div className="relative z-10 w-full h-full min-h-screen flex flex-col">
        {/* Container matching Navbar constraints - full height */}
        <div className="relative flex-1 w-full max-w-[1200px] mx-auto px-6 md:px-6 lg:px-6 h-full">
          {/* Text content overlay - positioned at bottom, aligned with container padding */}
          <div className="absolute bottom-12 left-0 right-0 flex items-end px-6 md:px-6 lg:px-6">
            {/* Release metadata */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="space-y-3 text-white max-w-xl"
              style={{ fontFamily: "var(--font-roboto, var(--font-family-heading, var(--font-geist-sans)))" }}
            >
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="text-xs uppercase tracking-[0.4em] text-white/80"
              >
                {releaseLabel}
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="text-3xl md:text-4xl font-semibold text-white"
              >
                {releaseTitle}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className="text-sm tracking-[0.2em] uppercase text-white/70"
              >
                {formattedMeta}
              </motion.p>
            </motion.div>
          </div>

          {/* Carousel navigation buttons - bottom right, aligned with container padding */}
          <motion.div
            className="absolute bottom-12 right-0 flex items-center gap-4 z-20 pr-6 md:pr-6 lg:pr-6"
            animate={{ opacity: buttonsOpacity }}
            transition={{ duration: 0.5 }}
            style={{ pointerEvents: buttonsOpacity > 0 ? "auto" : "none" }}
          >
            <button
              onClick={handlePrevious}
              className="text-white/80 hover:text-white transition-colors flex items-center gap-1.5 text-sm font-medium bg-transparent border-none cursor-pointer"
              style={{ fontFamily: "var(--font-roboto, var(--font-family-heading, var(--font-geist-sans)))" }}
              aria-label="Previous image"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden md:inline">PREV</span>
            </button>
            <button
              onClick={handleNext}
              className="text-white/80 hover:text-white transition-colors flex items-center gap-1.5 text-sm font-medium bg-transparent border-none cursor-pointer"
              style={{ fontFamily: "var(--font-roboto, var(--font-family-heading, var(--font-geist-sans)))" }}
              aria-label="Next image"
            >
              <span className="hidden md:inline">NEXT</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
