import Link from "next/link";
import { Button } from "@/components/ui/button";

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

export default function LandingFooter() {
  return (
    <footer className="relative py-12 px-6 overflow-hidden">
        {/* Logo overlay - subtle texture */}
        <div className="absolute top-[-50px] left-[-40px] pointer-events-none z-0">
        <img
          src="/griffithblack.svg"
          alt="Griffith Logo"
          className="w-[200px] h-[200px] opacity-[0.06] mix-blend-overlay"
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
          className="w-[300px] h-[300px] opacity-[0.06] mix-blend-overlay"
          style={{
            filter: "invert(1) brightness(1.2)",
          }}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-accent/10" />
      <div className="container mx-auto relative">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center space-y-5 mb-8">
            {/* Centered dot */}
            <div className="w-12 h-12 rounded-full bg-gradient-sunset shadow-card mb-4" />
            
            {/* Name */}
            <h3 className="font-bold text-lg">Mihai Pol</h3>
            
            {/* Contact section */}
            <div className="grid grid-cols-3 items-center gap-8 text-sm text-muted-foreground max-w-xs mx-auto pt-">
              <div className="flex flex-col items-center">
                <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Bookings
                </p>
                <Link
                  href="mailto:ioana@griffith.ro"
                  className="text-foreground no-underline"
                >
                  ioana@griffith.ro
                </Link>
              </div>
              <div className="h-8 w-px bg-border/30 mx-auto" />
              <div className="flex flex-col items-center">
                <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Demos
                </p>
                <Link
                  href="mailto:mihaipol@griffith.ro"
                  className="text-foreground no-underline"
                >
                  mihaipol@griffith.ro
                </Link>
              </div>
            </div>
          </div>
          
          {/* Divider */}
          <div className="w-16 h-px bg-border/30 mx-auto mb-6" />
          
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            {socialLinks.map((social) => (
              <Button
                key={social.name}
                variant="ghost"
                size="sm"
                style={{ borderRadius: "0.75rem" }}
                asChild
              >
                <Link href={social.url} target="_blank" rel="noreferrer">
                  {social.name}
                </Link>
              </Button>
            ))}
          </div>
          <div className="text-center text-sm text-muted-foreground border-t border-border/50 pt-6">
            © {new Date().getFullYear()} Mihai Pol · Griffith Records
          </div>
        </div>
      </div>
    </footer>
  );
}
