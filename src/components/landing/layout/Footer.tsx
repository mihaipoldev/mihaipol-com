import Link from "next/link";
import { cn } from "@/lib/utils";

const socialLinks = [
  { name: "Instagram", url: "https://www.instagram.com/mihaipol/" },
  { name: "Facebook", url: "https://www.facebook.com/mihapolprod/" },
  {
    name: "Spotify",
    url: "https://open.spotify.com/artist/4D4Am4VJvV2a7gXkQXrSrU?si=HibPJYGTRZCSUbm6ApPhMA",
  },
  { name: "SoundCloud", url: "https://soundcloud.com/mihai-pol" },
  { name: "YouTube", url: "https://www.youtube.com/@mihaipolmusic" },
  { name: "Bandcamp", url: "https://mihaipol.bandcamp.com/" },
  { name: "LinkMe", url: "https://link.me/mihaipol" },
];

const sitemapLinks = [
  { name: "Home", href: "/" },
  { name: "Albums", href: "/albums" },
  { name: "Events", href: "/events" },
  { name: "Updates", href: "/updates" },
];

export default function Footer() {
  return (
    <footer id="contact" className="relative py-12 px-6 overflow-hidden">
      {/* Logo overlay - subtle texture */}
      <div className="absolute top-[-50px] left-[-40px] pointer-events-none z-0">
        <img
          src="/griffithblack.svg"
          alt="Griffith Logo"
          className="w-[200px] h-[200px] opacity-[0.06]"
          style={{
            filter: "invert(1) brightness(1.2)",
          }}
        />
      </div>
      {/* Logo overlay - subtle texture */}
      <div className="absolute bottom-[70px] right-[20px] pointer-events-none z-0">
        <img
          src="/griffithblack.svg"
          alt="Griffith Logo"
          className="w-[300px] h-[300px] opacity-[0.06]"
          style={{
            filter: "invert(1) brightness(1.2)",
          }}
        />
      </div>
      {/* Subtle top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/20 to-transparent" />
      <div className="container mx-auto relative">
        <div className="max-w-5xl mx-auto">
          {/* Centered circle */}
          <div className="flex justify-center mb-6">
            <div className="relative w-12 h-12">
              {/* Base circle - full primary color */}
              <div className="absolute inset-0 w-12 h-12 rounded-full bg-primary shadow-md" />
              {/* Gradient overlay - secondary at 50% opacity */}
              <div 
                className="absolute inset-0 w-12 h-12 rounded-full shadow-md"
                style={{
                  background: `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary) / 0.8) 50%, hsl(var(--accent)) 100%)`
                }}
              />
            </div>
          </div>

          <h3 className="font-bold text-lg text-center mb-8">Mihai Pol</h3>

          {/* Sitemap - Horizontal */}
          <div className="flex justify-center mb-8">
            <nav className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
              {sitemapLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-foreground/80 hover:text-foreground transition-colors duration-200 text-sm relative group"
                >
                  <span className="relative z-10">{link.name}</span>
                  <span className="absolute bottom-0 left-0 h-px bg-foreground/50 transition-[width] duration-300 ease-out w-0 group-hover:w-full" />
                </Link>
              ))}
            </nav>
          </div>

          {/* Bookings/Demos - Centered with divider */}
          <div className="flex justify-center mb-10">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1px_1fr] gap-5 md:gap-8 text-sm">
              <div className="flex flex-col items-center">
                <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Bookings
                </p>
                <Link href="mailto:ioana@griffith.ro" className="text-foreground no-underline hover:text-foreground/80 transition-colors">
                  ioana@griffith.ro
                </Link>
              </div>
              <div className="hidden md:block w-px bg-border/30" />
              <div className="flex flex-col items-center">
                <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Demos
                </p>
                <Link href="mailto:mihaipol@griffith.ro" className="text-foreground no-underline hover:text-foreground/80 transition-colors">
                  mihaipol@griffith.ro
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom: Social links */}
          <div className="grid grid-cols-3 md:flex md:flex-wrap gap-4 md:gap-8 justify-items-center md:justify-center mb-8">
            {socialLinks.map((social, index) => {
              const isLastItem = index === socialLinks.length - 1;
              const hasRemainder = socialLinks.length % 3 !== 0;
              const shouldCenter = isLastItem && hasRemainder;

              return (
                <div
                  key={social.name}
                  className={cn("md:contents", shouldCenter && "col-start-2 md:col-start-auto")}
                  style={shouldCenter ? { gridColumnStart: 2 } : undefined}
                >
                  <Link
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      "transition-colors duration-300 relative group py-2 text-sm font-normal text-foreground/70 hover:text-foreground",
                      "md:w-auto w-full justify-center flex items-center"
                    )}
                  >
                    <span className="relative z-10">{social.name}</span>
                    <span className="absolute bottom-0 left-0 h-px bg-foreground/50 transition-[width] duration-300 ease-out w-0 group-hover:w-full" />
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Copyright */}
          <div className="text-center text-sm text-muted-foreground border-t border-border/50 pt-6">
            © {new Date().getFullYear()} Mihai Pol · Griffith Records
          </div>
        </div>
      </div>
    </footer>
  );
}
