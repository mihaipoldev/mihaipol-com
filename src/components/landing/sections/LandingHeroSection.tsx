"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LandingAlbum, LandingEvent } from "../types";

type LandingHeroSectionProps = {
  heroImage: string;
  featuredAlbum: LandingAlbum | null;
  events: LandingEvent[];
  albums: LandingAlbum[];
};

const HERO_IMAGES = [
  "/hero images/02__B_0116.jpg",
  "/hero images/04__B_0242.jpg",
  "/hero images/01_BB_9497.jpg",
];

export default function LandingHeroSection({
  heroImage,
  featuredAlbum,
  events,
  albums,
}: LandingHeroSectionProps) {
  const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1000&q=80";

  // Find initial index by matching filename
  const getInitialIndex = () => {
    const heroFilename = heroImage.split('/').pop() || '';
    const foundIndex = HERO_IMAGES.findIndex((img) => img.includes(heroFilename));
    return foundIndex >= 0 ? foundIndex : 0;
  };
  
  const [currentImageIndex, setCurrentImageIndex] = useState(() => getInitialIndex());
  const [nextImageIndex, setNextImageIndex] = useState<number | null>(null);
  const [buttonsOpacity, setButtonsOpacity] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const autoAdvanceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentImageIndexRef = useRef(currentImageIndex);
  const isTransitioningRef = useRef(isTransitioning);
  const currentImage = HERO_IMAGES[currentImageIndex] || FALLBACK_IMAGE;
  const nextImage = nextImageIndex !== null ? (HERO_IMAGES[nextImageIndex] || FALLBACK_IMAGE) : null;

  // Keep refs in sync with state
  useEffect(() => {
    currentImageIndexRef.current = currentImageIndex;
  }, [currentImageIndex]);

  useEffect(() => {
    isTransitioningRef.current = isTransitioning;
  }, [isTransitioning]);

  // Trigger fade transition after next image is mounted
  useEffect(() => {
    if (nextImageIndex !== null) {
      // Small delay to ensure the next image is in the DOM
      const timer = setTimeout(() => {
        setIsTransitioning(true);
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [nextImageIndex]);

  // Load saved index from localStorage on mount
  useEffect(() => {
    const savedIndex = localStorage.getItem('hero-carousel-index');
    if (savedIndex !== null) {
      const parsedIndex = parseInt(savedIndex, 10);
      if (!isNaN(parsedIndex) && parsedIndex >= 0 && parsedIndex < HERO_IMAGES.length) {
        setCurrentImageIndex(parsedIndex);
      }
    }
  }, []);

  const handlePrevious = () => {
    if (isTransitioningRef.current) return;
    const currentIdx = currentImageIndexRef.current;
    const newIndex = currentIdx === 0 ? HERO_IMAGES.length - 1 : currentIdx - 1;
    setNextImageIndex(newIndex);
    setIsTransitioning(false); // Start with transition false, useEffect will trigger it
    
    // Reset auto-advance timer after manual navigation
    if (autoAdvanceIntervalRef.current) {
      clearInterval(autoAdvanceIntervalRef.current);
    }
    autoAdvanceIntervalRef.current = setInterval(() => {
      handleNext();
    }, 10000);
    
    // After transition completes, update current and clean up
    setTimeout(() => {
      setCurrentImageIndex(newIndex);
      setNextImageIndex(null);
      setIsTransitioning(false);
    }, 610); // Slightly longer than transition duration
  };

  const handleNext = () => {
    if (isTransitioningRef.current) return;
    const currentIdx = currentImageIndexRef.current;
    const newIndex = currentIdx === HERO_IMAGES.length - 1 ? 0 : currentIdx + 1;
    setNextImageIndex(newIndex);
    setIsTransitioning(false); // Start with transition false, useEffect will trigger it
    
    // Reset auto-advance timer after manual navigation
    if (autoAdvanceIntervalRef.current) {
      clearInterval(autoAdvanceIntervalRef.current);
    }
    autoAdvanceIntervalRef.current = setInterval(() => {
      handleNext();
    }, 10000);
    
    // After transition completes, update current and clean up
    setTimeout(() => {
      setCurrentImageIndex(newIndex);
      setNextImageIndex(null);
      setIsTransitioning(false);
    }, 610); // Slightly longer than transition duration
  };

  // Save current image index to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('hero-carousel-index', currentImageIndex.toString());
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
        opacity = Math.max(0, 1 - (scrolledPast / fadeRange));
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
  const releaseMeta =
    featuredAlbum?.release_date ??
    events[0]?.date ??
    new Date().toISOString();
  const formattedMeta = new Date(releaseMeta).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <section 
      ref={sectionRef} 
      className="relative min-h-screen w-full overflow-hidden"
    >
      {/* Full width image - glued to top with fade at bottom */}
      <div className="absolute inset-0 w-full h-full">
        {/* Current image - fades out during transition */}
        <img
          key={`current-${currentImageIndex}`}
          src={currentImage}
          alt={releaseTitle}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity ease-in-out ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
          style={{
            transitionDuration: '600ms',
            maskImage: "linear-gradient(to bottom, black 0%, black 30%, rgba(0,0,0,0.9) 40%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.15) 80%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 30%, rgba(0,0,0,0.9) 40%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.15) 80%, transparent 100%)",
          }}
        />
        {/* Next image - fades in during transition */}
        {nextImage && (
          <img
            key={`next-${nextImageIndex}`}
            src={nextImage}
            alt={releaseTitle}
            className="absolute inset-0 w-full h-full object-cover transition-opacity ease-in-out opacity-0"
            style={{
              transitionDuration: '600ms',
              opacity: isTransitioning ? 1 : 0,
              maskImage: "linear-gradient(to bottom, black 0%, black 30%, rgba(0,0,0,0.9) 40%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.15) 80%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 30%, rgba(0,0,0,0.9) 40%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.15) 80%, transparent 100%)",
            }}
          />
        )}
        {/* Logo overlay - blended as texture/shadow */}
        <div className="absolute bottom-[205px] left-[100px] pointer-events-none hidden md:block">
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
        <div className="relative flex-1 w-full max-w-[1536px] mx-auto px-6 md:px-6 lg:px-6 h-full">
          {/* Vertical text on the right side - centered vertically */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center pr-6 md:pr-6 lg:pr-6">
            <div className="text-[0.6rem] uppercase tracking-[0.6em] text-white/70 rotate-180 whitespace-nowrap" style={{ writingMode: "vertical-rl" }}>
              Mihai Pol — live edits in motion
            </div>
          </div>

          {/* Text content overlay - positioned at bottom, aligned with container padding */}
          <div className="absolute bottom-12 left-0 right-0 flex items-end px-6 md:px-6 lg:px-6">
            {/* Release metadata */}
            <div className="space-y-3 text-white max-w-xl">
              <p className="text-xs uppercase tracking-[0.4em] text-white/80">
                {releaseLabel}
              </p>
              <h2 className="text-3xl md:text-4xl font-semibold text-white">{releaseTitle}</h2>
              <p className="text-sm tracking-[0.2em] uppercase text-white/70">
                {formattedMeta}
              </p>
            </div>
          </div>

          {/* Carousel navigation buttons - bottom right, aligned with container padding */}
          <div 
            className="absolute bottom-12 right-0 flex items-center gap-4 z-20 transition-opacity duration-500 pr-6 md:pr-6 lg:pr-6"
            style={{ opacity: buttonsOpacity, pointerEvents: buttonsOpacity > 0 ? 'auto' : 'none' }}
          >
          <button
            onClick={handlePrevious}
            className="text-white/80 hover:text-white transition-colors flex items-center gap-1.5 text-sm font-medium bg-transparent border-none cursor-pointer"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">PREV</span>
          </button>
          <button
            onClick={handleNext}
            className="text-white/80 hover:text-white transition-colors flex items-center gap-1.5 text-sm font-medium bg-transparent border-none cursor-pointer"
            aria-label="Next image"
          >
            <span className="hidden md:inline">NEXT</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          </div>
        </div>
      </div>
      
    </section>
  );
}
