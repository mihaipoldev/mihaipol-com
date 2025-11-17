import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Calendar, MapPin, ExternalLink, Disc3, Sparkles } from "lucide-react";
import heroArtwork from "@/assets/hero-artwork.jpg";
import album1 from "@/assets/album-1.jpg";
import album2 from "@/assets/album-2.jpg";
import album3 from "@/assets/album-3.jpg";
import griffithFeatured from "@/assets/griffith-featured.jpg";

const Index = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const events = [
    { date: "Mar 15", city: "Los Angeles", venue: "The Roxy Theatre" },
    { date: "Mar 22", city: "San Francisco", venue: "The Fillmore" },
    { date: "Apr 5", city: "New York", venue: "Brooklyn Steel" },
    { date: "Apr 12", city: "Chicago", venue: "Metro Chicago" },
  ];

  const albums = [
    { title: "Sunset Memories", label: "Griffith Records", year: "2024", cover: album1 },
    { title: "Night Drive", label: "Independent", year: "2023", cover: album2 },
    { title: "Golden Hour", label: "Griffith Records", year: "2022", cover: album3 },
  ];

  const updates = [
    { title: "New single 'Horizon' out now", date: "Feb 28, 2024", tag: "Release", snippet: "Available on all streaming platforms" },
    { title: "Spring tour dates announced", date: "Feb 20, 2024", tag: "Tour update", snippet: "Tickets on sale Friday" },
    { title: "In the studio working on EP", date: "Feb 10, 2024", tag: "Studio", snippet: "Exciting new sounds coming soon" },
  ];

  return (
    <div className="min-h-screen">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-sunset opacity-10 animate-gradient-shift" style={{ backgroundSize: "200% 200%" }} />
      
      {/* Floating Background Shapes */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-glow-pulse" />
      </div>

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/80 backdrop-blur-lg border-b border-border/50" : "bg-transparent"}`}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-gradient-sunset">Mihai Pol</div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#events" className="text-sm font-medium hover:text-primary transition-colors">Events</a>
            <a href="#albums" className="text-sm font-medium hover:text-primary transition-colors">Albums</a>
            <a href="#griffith" className="text-sm font-medium hover:text-primary transition-colors">Griffith</a>
            <a href="#updates" className="text-sm font-medium hover:text-primary transition-colors">Updates</a>
          </nav>

          <Badge variant="secondary" className="hidden lg:flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            Based in Los Angeles · On tour
          </Badge>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center pt-20 px-6">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-6xl lg:text-7xl font-bold text-gradient-sunset leading-tight">
                  Mihai Pol
                </h1>
                <p className="text-xl text-muted-foreground">
                  Music for long drives and late sunsets.
                </p>
                <p className="text-base text-muted-foreground max-w-lg">
                  Electronic music producer crafting atmospheric soundscapes that blend melodic house with ambient textures. 
                  Based in Los Angeles, touring worldwide.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button variant="hero" size="lg" className="group">
                  <Music className="w-4 h-4" />
                  Listen to latest release
                </Button>
                <Button variant="ghost" size="lg" onClick={() => document.getElementById('albums')?.scrollIntoView({ behavior: 'smooth' })}>
                  Explore discography
                </Button>
              </div>
            </div>

            {/* Right Column - Hero Artwork */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-card-hover animate-float">
                <img 
                  src={heroArtwork} 
                  alt="Mihai Pol Artwork" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/30 rounded-full blur-2xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Upcoming Events</h2>
            <p className="text-muted-foreground">Catch Mihai on tour.</p>
            <div className="w-24 h-1 bg-gradient-sunset mx-auto mt-6 rounded-full" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {events.map((event, index) => (
              <Card key={index} className="p-6 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 bg-card/50 backdrop-blur">
                <div className="space-y-4">
                  <div className="text-3xl font-bold text-primary">{event.date}</div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{event.city}</h3>
                    <p className="text-sm text-muted-foreground">{event.venue}</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Get tickets
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="ghost" className="group">
              See full calendar
              <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Albums Section */}
      <section id="albums" className="py-24 px-6 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Albums & Singles</h2>
            <p className="text-muted-foreground">Selected releases and fan favorites.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {albums.map((album, index) => (
              <Card key={index} className="overflow-hidden group hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2">
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={album.cover} 
                    alt={album.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-xl mb-2">{album.title}</h3>
                    <p className="text-sm text-muted-foreground">{album.label} · {album.year}</p>
                  </div>
                  <Button variant="default" size="sm" className="w-full">
                    <Music className="w-4 h-4" />
                    Listen
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="ghost" className="group">
              View all releases
              <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Griffith Records Featured */}
      <section id="griffith" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-background to-primary/10" />
        
        <div className="container mx-auto relative">
          <div className="max-w-6xl mx-auto">
            <Card className="overflow-hidden shadow-card-hover border-2 border-primary/20 bg-card/80 backdrop-blur">
              <div className="grid lg:grid-cols-2 gap-0">
                {/* Left - Cover Art */}
                <div className="relative aspect-square lg:aspect-auto">
                  <img 
                    src={griffithFeatured} 
                    alt="Griffith Records Featured Release" 
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-4 left-4 bg-gradient-sunset text-white border-0">
                    <Sparkles className="w-3 h-3" />
                    Featured Release
                  </Badge>
                </div>

                {/* Right - Details */}
                <div className="p-8 lg:p-12 flex flex-col justify-center space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Disc3 className="w-5 h-5 text-primary" />
                      <span className="text-sm font-semibold text-primary">Griffith Records</span>
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-bold mb-4">Horizon EP</h2>
                    <p className="text-muted-foreground">
                      A journey through sound and emotion. Four tracks exploring the space between day and night, 
                      featuring collaborations with talented artists from around the world.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <Button variant="hero" size="lg">
                      <Music className="w-4 h-4" />
                      Listen on Spotify
                    </Button>
                    <Button variant="outline" size="lg" className="group">
                      More from Griffith
                      <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Updates Section */}
      <section id="updates" className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Updates</h2>
            <p className="text-muted-foreground">Latest news and announcements.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {updates.map((update, index) => (
              <Card key={index} className="p-6 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group cursor-pointer">
                <div className="space-y-4">
                  <Badge variant="secondary">{update.tag}</Badge>
                  <div>
                    <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{update.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{update.snippet}</p>
                    <p className="text-xs text-muted-foreground">{update.date}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="ghost" className="group">
              View all updates
              <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-6 mt-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-accent/10" />
        
        <div className="container mx-auto relative">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-12 mb-12">
              {/* Bio */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-sunset shadow-card" />
                  <div>
                    <h3 className="font-bold text-xl">Mihai Pol</h3>
                    <p className="text-sm text-muted-foreground">Electronic Music Producer</p>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  Creating atmospheric electronic music from Los Angeles. 
                  Available for bookings and collaborations.
                </p>
              </div>

              {/* Contact */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Connect</h4>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Contact
                </Button>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex flex-wrap gap-4 justify-center mb-12">
              {["Spotify", "SoundCloud", "Bandcamp", "Instagram", "YouTube"].map((platform) => (
                <Button key={platform} variant="ghost" size="sm">
                  {platform}
                </Button>
              ))}
            </div>

            {/* Copyright */}
            <div className="text-center text-sm text-muted-foreground border-t border-border/50 pt-8">
              © {new Date().getFullYear()} Mihai Pol · Griffith Records
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
