"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

type Embed = {
  type: "youtube" | "spotify" | "bandcamp" | "soundcloud" | "instagram";
  url?: string;
  embed_code?: string;
};

type EmbedRendererProps = {
  embeds: Embed[];
  className?: string;
};

// Extract YouTube video ID from various URL formats
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Extract Spotify track/album/playlist ID from URL
function extractSpotifyId(url: string): { type: string; id: string } | null {
  const patterns = [
    /spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1] && match[2]) {
      return { type: match[1], id: match[2] };
    }
  }

  return null;
}

// Extract Bandcamp album/track ID from URL
function extractBandcampId(url: string): string | null {
  const match = url.match(/bandcamp\.com\/(?:track|album)=([^&\n?#]+)/);
  return match ? match[1] : null;
}

// Extract SoundCloud track ID from URL
function extractSoundCloudId(url: string): string | null {
  const match = url.match(/soundcloud\.com\/[^/]+\/([^/?]+)/);
  return match ? match[1] : null;
}

function YouTubeEmbed({ url }: { url: string }) {
  const videoId = useMemo(() => extractYouTubeId(url), [url]);

  if (!videoId) {
    return (
      <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive text-sm">
        Invalid YouTube URL: {url}
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
      <iframe
        className="absolute top-0 left-0 w-full h-full rounded-lg"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function SpotifyEmbed({ url, embedCode }: { url?: string; embedCode?: string }) {
  if (embedCode) {
    // If embed code is provided, use it directly (sanitized)
    return (
      <div
        className="w-full"
        dangerouslySetInnerHTML={{
          __html: embedCode.replace(/<script[^>]*>.*?<\/script>/gi, ""), // Remove scripts for safety
        }}
      />
    );
  }

  if (!url) {
    return (
      <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive text-sm">
        Spotify embed requires either a URL or embed code
      </div>
    );
  }

  const spotifyData = extractSpotifyId(url);
  if (!spotifyData) {
    return (
      <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive text-sm">
        Invalid Spotify URL: {url}
      </div>
    );
  }

  return (
    <div className="w-full">
      <iframe
        className="w-full rounded-lg"
        style={{ height: spotifyData.type === "track" ? "152px" : "352px" }}
        src={`https://open.spotify.com/embed/${spotifyData.type}/${spotifyData.id}?utm_source=generator`}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </div>
  );
}

function BandcampEmbed({ url }: { url: string }) {
  const albumId = extractBandcampId(url);

  if (!albumId) {
    return (
      <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive text-sm">
        Invalid Bandcamp URL: {url}
      </div>
    );
  }

  return (
    <div className="w-full">
      <iframe
        className="w-full border-0 rounded-lg"
        style={{ height: "120px" }}
        src={`https://bandcamp.com/EmbeddedPlayer/${albumId}/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/artwork=small/transparent=true/`}
        seamless
      />
    </div>
  );
}

function SoundCloudEmbed({ url }: { url: string }) {
  const trackId = extractSoundCloudId(url);

  if (!trackId) {
    return (
      <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive text-sm">
        Invalid SoundCloud URL: {url}
      </div>
    );
  }

  return (
    <div className="w-full">
      <iframe
        className="w-full rounded-lg"
        style={{ height: "166px" }}
        src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`}
        frameBorder="no"
        scrolling="no"
        allow="autoplay"
      />
    </div>
  );
}

function InstagramEmbed({ url }: { url: string }) {
  // Instagram embeds are complex and require server-side processing
  // For now, we'll show a link to the Instagram post
  return (
    <div className="p-4 border border-border rounded-lg bg-muted/50">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        View on Instagram: {url}
      </a>
    </div>
  );
}

export function EmbedRenderer({ embeds, className }: EmbedRendererProps) {
  if (!embeds || embeds.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-6", className)}>
      {embeds.map((embed, index) => {
        const key = `${embed.type}-${index}`;

        switch (embed.type) {
          case "youtube":
            if (!embed.url) {
              return (
                <div
                  key={key}
                  className="p-4 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive text-sm"
                >
                  YouTube embed requires a URL
                </div>
              );
            }
            return <YouTubeEmbed key={key} url={embed.url} />;

          case "spotify":
            return <SpotifyEmbed key={key} url={embed.url} embedCode={embed.embed_code} />;

          case "bandcamp":
            if (!embed.url) {
              return (
                <div
                  key={key}
                  className="p-4 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive text-sm"
                >
                  Bandcamp embed requires a URL
                </div>
              );
            }
            return <BandcampEmbed key={key} url={embed.url} />;

          case "soundcloud":
            if (!embed.url) {
              return (
                <div
                  key={key}
                  className="p-4 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive text-sm"
                >
                  SoundCloud embed requires a URL
                </div>
              );
            }
            return <SoundCloudEmbed key={key} url={embed.url} />;

          case "instagram":
            if (!embed.url) {
              return (
                <div
                  key={key}
                  className="p-4 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive text-sm"
                >
                  Instagram embed requires a URL
                </div>
              );
            }
            return <InstagramEmbed key={key} url={embed.url} />;

          default:
            return (
              <div
                key={key}
                className="p-4 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive text-sm"
              >
                Unknown embed type: {(embed as any).type}
              </div>
            );
        }
      })}
    </div>
  );
}
