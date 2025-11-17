import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Music, Instagram, ExternalLink } from "lucide-react";
import heroPortrait from "@/assets/hero-portrait.jpg";
import album1 from "@/assets/album-1.jpg";
import album2 from "@/assets/album-2.jpg";
import album3 from "@/assets/album-3.jpg";
import griffithRelease from "@/assets/griffith-release.jpg";

const Index = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-40 right-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-blob" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-blob" style={{ animationDelay: "4s" }} />
      </div>

      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-background/80 backdrop-blur-lg border-b border-border shadow-lg" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-bold tracking-tight">Mihai Pol</div>
          <nav className="flex items-center gap-8">
            <button onClick={() => scrollToSection("events")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Events
            </button>
            <button onClick={() => scrollToSection("albums")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Albums
            </button>
            <button onClick={() => scrollToSection("griffith")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Griffith
            </button>
            <button onClick={() => scrollToSection("updates")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Updates
            </button>
            <Badge variant="secondary" className="bg-secondary/50 backdrop-blur-sm">
              Barcelona / Worldwide
            </Badge>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="min-h-screen flex items-center pt-16 gradient-hero">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-6xl lg:text-7xl font-bold tracking-tight">
                Mihai Pol
              </h1>
              <p className="text-xl text-muted-foreground">
                Minimal, house & progressive from late-night dance floors.
              </p>
              <p className="text-base text-muted-foreground max-w-lg leading-relaxed">
                Based in Barcelona, Mihai Pol crafts hypnotic journeys through minimal house and progressive soundscapes. 
                A resident at underground venues and founder of Griffith Records, bringing deep grooves to dance floors worldwide.
              </p>
              <div className="flex gap-4 pt-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary">
                  <Music className="mr-2 h-4 w-4" />
                  Listen to latest release
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-border hover:bg-secondary/50"
                  onClick={() => scrollToSection("events")}
                >
                  Upcoming shows
                </Button>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <img
                  src={heroPortrait}
                  alt="Mihai Pol"
                  className="rounded-2xl max-w-md w-full animate-float shadow-2xl"
                />
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-accent/20 rounded-full blur-2xl -z-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Events */}
      <section id="events" className="py-24 bg-card/30">
        <div className="container mx-auto px-6">
          <div className="mb-12">
            <h2 className="text-4xl font-bold mb-2">Upcoming Events</h2>
            <p className="text-muted-foreground">Next stops on the road.</p>
          </div>
          <div className="space-y-0">
            <EventRow date="15 DEC" city="Barcelona" venue="Razzmatazz" country="Spain" />
            <EventRow date="22 DEC" city="Berlin" venue="Watergate" country="Germany" />
            <EventRow date="31 DEC" city="Amsterdam" venue="De School" country="Netherlands" />
            <EventRow date="12 JAN" city="Bucharest" venue="Guesthouse" country="Romania" />
            <EventRow date="20 JAN" city="Paris" venue="Rex Club" country="France" />
          </div>
          <div className="mt-8">
            <Button variant="link" className="text-primary hover:text-primary/80">
              See full calendar
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Albums */}
      <section id="albums" className="py-24">
        <div className="container mx-auto px-6">
          <div className="mb-12">
            <h2 className="text-4xl font-bold mb-2">Albums & Singles</h2>
            <p className="text-muted-foreground">Selected discography.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AlbumCard
              image={album1}
              title="Nocturnal Frequencies"
              label="Griffith Records"
              year="2024"
            />
            <AlbumCard
              image={album2}
              title="Deep Circles EP"
              label="Minimal Soul"
              year="2023"
            />
            <AlbumCard
              image={album3}
              title="Progressive Waves"
              label="Griffith Records"
              year="2023"
            />
          </div>
          <div className="mt-8">
            <Button variant="link" className="text-primary hover:text-primary/80">
              View all releases
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Griffith Records */}
      <section id="griffith" className="py-24 gradient-accent">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src={griffithRelease}
                alt="Griffith Records Release"
                className="rounded-2xl shadow-2xl glow-accent"
              />
            </div>
            <div className="space-y-6">
              <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">
                Featured Release
              </Badge>
              <h2 className="text-4xl font-bold">Griffith Records</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                An independent label dedicated to showcasing deep, minimal, and progressive sounds 
                from the underground. Curated releases that prioritize quality over quantity, 
                each track carefully selected to represent the essence of late-night groove.
              </p>
              <div className="flex gap-4">
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground glow-accent">
                  <Music className="mr-2 h-4 w-4" />
                  Play release
                </Button>
                <Button variant="outline" className="border-border hover:bg-secondary/50">
                  More from Griffith
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Updates */}
      <section id="updates" className="py-24">
        <div className="container mx-auto px-6">
          <div className="mb-12">
            <h2 className="text-4xl font-bold">Updates</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <UpdateCard
              tag="Release"
              title="New EP 'Nocturnal Frequencies' out now"
              date="Nov 28, 2024"
              description="Four tracks of deep minimal house, exploring the darker edges of the dance floor."
            />
            <UpdateCard
              tag="Event"
              title="Razzmatazz residency announced"
              date="Nov 15, 2024"
              description="Monthly residency starting December at Barcelona's iconic venue."
            />
            <UpdateCard
              tag="News"
              title="Griffith Records year in review"
              date="Nov 1, 2024"
              description="Looking back at an incredible year of releases and events from the label."
            />
          </div>
        </div>
      </section>

      {/* Contact & Footer */}
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-4">Contact & Booking</h3>
              <p className="text-muted-foreground mb-4">
                Booking worldwide: <a href="mailto:iwana@rondgriffith.ro" className="text-primary hover:underline">iwana@rondgriffith.ro</a>
              </p>
              <div className="flex gap-4">
                <Button variant="outline" size="icon" className="hover:bg-secondary/50">
                  <Instagram className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" className="hover:bg-secondary/50">
                  <Music className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" className="hover:bg-secondary/50">
                  <ExternalLink className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="flex items-end justify-end">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Mihai Pol · Griffith Records
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Event Row Component
const EventRow = ({ date, city, venue, country }: { date: string; city: string; venue: string; country: string }) => (
  <div className="group border-b border-border/50 hover:bg-secondary/30 transition-colors">
    <div className="grid grid-cols-12 gap-4 py-4 px-4 items-center">
      <div className="col-span-2 text-sm font-semibold text-primary">{date}</div>
      <div className="col-span-3 text-sm font-medium">{city}</div>
      <div className="col-span-4 text-sm text-muted-foreground">{venue}</div>
      <div className="col-span-2 text-sm text-muted-foreground">{country}</div>
      <div className="col-span-1 text-right">
        <a href="#" className="text-xs text-primary hover:underline">
          Tickets
        </a>
      </div>
    </div>
  </div>
);

// Album Card Component
const AlbumCard = ({ image, title, label, year }: { image: string; title: string; label: string; year: string }) => (
  <Card className="group overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
    <div className="aspect-square overflow-hidden">
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
    </div>
    <div className="p-5 space-y-3">
      <h3 className="font-semibold text-lg">{title}</h3>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{label}</span>
        <span>{year}</span>
      </div>
      <Button variant="outline" size="sm" className="w-full hover:bg-primary hover:text-primary-foreground hover:border-primary">
        <Music className="mr-2 h-3 w-3" />
        Listen
      </Button>
    </div>
  </Card>
);

// Update Card Component
const UpdateCard = ({ tag, title, date, description }: { tag: string; title: string; date: string; description: string }) => (
  <Card className="group overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
    <div className="p-6 space-y-4">
      <Badge variant="secondary" className="bg-primary/10 text-primary">
        {tag}
      </Badge>
      <h3 className="font-semibold text-lg leading-tight">{title}</h3>
      <p className="text-sm text-muted-foreground">{date}</p>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      <a href="#" className="text-sm text-primary hover:underline inline-flex items-center">
        Read more
        <ExternalLink className="ml-1 h-3 w-3" />
      </a>
    </div>
  </Card>
);

export default Index;
