"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import PageTransition from "./PageTransition";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import { PresetCSSInjector } from "@/components/landing/PresetCSSInjector";

type PageLayoutProps = {
  children: ReactNode;
  landingPagePreset?: number;
};

export function PageLayout({ children, landingPagePreset = 19 }: PageLayoutProps) {
  const gradientBgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simple solution: Just ensure the background covers extra scrollable space
    // Use a debounced update to avoid performance issues
    let timeoutId: NodeJS.Timeout;

    const updateBackgroundHeight = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
        const viewportHeight = window.innerHeight;

        // Only extend height if document is taller than viewport + extra space
        // This preserves the original appearance when not needed
        if (scrollHeight > viewportHeight + 100) {
          const extraSpace = 150; // Cover the ~80px extra scrollable space + buffer
          const totalHeight = scrollHeight + extraSpace;

          // Only set height on gradient background, NOT on shapes container
          // Shapes container should stay viewport-sized so shapes stay visible
          if (gradientBgRef.current) {
            gradientBgRef.current.style.height = `${totalHeight}px`;
          }
          // Don't set height on shapes container - keep it viewport-sized
        } else {
          // Reset to default (minHeight: 100vh handles it)
          if (gradientBgRef.current) {
            gradientBgRef.current.style.height = "";
          }
        }
      }, 100);
    };

    // Initial update
    updateBackgroundHeight();

    // Only update on resize, not on scroll (better performance)
    window.addEventListener("resize", updateBackgroundHeight);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updateBackgroundHeight);
    };
  }, []);

  useEffect(() => {
    // Apply preset class to body for CSS variables to be available globally
    const body = document.body;
    const presetClass = `preset-landing-page-${landingPagePreset}`;
    
    // Remove any existing preset classes
    body.className = body.className.replace(/\bpreset-landing-page-\d+\b/g, '');
    // Add the current preset class
    body.classList.add(presetClass);

    // Enable smooth scrolling and overscroll for landing page
    const html = document.documentElement;

    // Save original values
    const originalHtmlOverscroll = html.style.overscrollBehaviorY;
    const originalBodyOverscroll = body.style.overscrollBehaviorY;
    const originalHtmlOverscrollBehavior = html.style.overscrollBehavior;
    const originalBodyOverscrollBehavior = body.style.overscrollBehavior;

    // Enable smooth scrolling and bounce
    html.style.setProperty("overscroll-behavior-y", "auto", "important");
    html.style.setProperty("overscroll-behavior", "auto", "important");
    body.style.setProperty("overscroll-behavior-y", "auto", "important");
    body.style.setProperty("overscroll-behavior", "auto", "important");
    html.style.setProperty("-webkit-overflow-scrolling", "touch", "important");
    body.style.setProperty("-webkit-overflow-scrolling", "touch", "important");

    return () => {
      // Remove preset class on cleanup
      body.classList.remove(presetClass);
      
      // Restore original values
      if (originalHtmlOverscroll) html.style.overscrollBehaviorY = originalHtmlOverscroll;
      else html.style.removeProperty("overscroll-behavior-y");

      if (originalBodyOverscroll) body.style.overscrollBehaviorY = originalBodyOverscroll;
      else body.style.removeProperty("overscroll-behavior-y");

      if (originalHtmlOverscrollBehavior)
        html.style.overscrollBehavior = originalHtmlOverscrollBehavior;
      else html.style.removeProperty("overscroll-behavior");

      if (originalBodyOverscrollBehavior)
        body.style.overscrollBehavior = originalBodyOverscrollBehavior;
      else body.style.removeProperty("overscroll-behavior");

      html.style.removeProperty("-webkit-overflow-scrolling");
      body.style.removeProperty("-webkit-overflow-scrolling");
    };
  }, [landingPagePreset]);

  return (
    <>
      <PresetCSSInjector />
      <div
        className={cn(
          "flex min-h-dvh flex-col bg-background relative",
          `preset-landing-page-${landingPagePreset}`
        )}
        style={{
          scrollBehavior: "smooth",
        }}
      >
      {/* Animated Background */}
      <div
        ref={gradientBgRef}
        className="fixed inset-0 bg-gradient-sunset opacity-10 animate-gradient-shift"
        style={{ backgroundSize: "200% 200%", zIndex: 0 }}
      />

      {/* Floating Background Shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-glow-pulse" />
      </div>

      <Header />
      <PageTransition>
        <main className="flex-1 w-full relative" style={{ zIndex: 10 }}>
          {children}
        </main>
      </PageTransition>
      <Footer />
    </div>
    </>
  );
}
