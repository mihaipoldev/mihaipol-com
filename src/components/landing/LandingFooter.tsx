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
    <footer className="relative py-16 px-6 mt-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-accent/10" />
      <div className="container mx-auto relative">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-sunset shadow-card" />
                <div>
                  <h3 className="font-bold text-xl">Mihai Pol</h3>
                  <p className="text-sm text-muted-foreground">Electronic Music Producer</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                Creating atmospheric electronic music from Los Angeles. Available for bookings and
                collaborations.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Connect
              </h4>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                style={{ borderRadius: "0.75rem" }}
              >
                Contact
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 justify-center mb-12">
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
          <div className="text-center text-sm text-muted-foreground border-t border-border/50 pt-8">
            © {new Date().getFullYear()} Mihai Pol · Griffith Records
          </div>
        </div>
      </div>
    </footer>
  );
}
