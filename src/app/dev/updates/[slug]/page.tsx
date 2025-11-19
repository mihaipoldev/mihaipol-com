import { notFound } from "next/navigation";
import { Calendar, ExternalLink } from "lucide-react";
import { getUpdateBySlug } from "@/features/updates/data";
import { formatUpdateDate } from "@/components/landing/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import TrackView from "@/features/smart-links/analytics/components/TrackView";
import TrackedExternalLink from "@/components/features/TrackedExternalLink";

export const dynamic = "force-dynamic";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1000&q=80";

interface UpdateDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function UpdateDetailPage({ params }: UpdateDetailPageProps) {
  const { slug } = await params;
  const update = await getUpdateBySlug(slug);

  if (!update) {
    notFound();
  }

  const imageUrl = update.image_url ?? FALLBACK_IMAGE;
  const updateDate = update.date ? new Date(update.date) : null;
  const formattedDate = updateDate
    ? updateDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <>
      <TrackView
        eventType="page_view"
        entityType="update"
        entityId={update.id}
        metadata={{ update_slug: update.slug, path: `/dev/updates/${update.slug}` }}
      />
      <div className="py-24 px-6">
        <div className="container mx-auto px-0 md:px-8 max-w-4xl">
          <div className="space-y-8">
            {/* Hero Image */}
            <div className="relative rounded-3xl overflow-hidden shadow-card-hover">
              <img
                src={imageUrl}
                alt={update.title}
                className="w-full h-auto object-cover aspect-video"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
            </div>

            {/* Meta and Title Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 flex-wrap">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  Update
                </Badge>
                {updateDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <time>{formatUpdateDate(update.date)}</time>
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 className="text-5xl lg:text-6xl font-bold text-gradient-sunset leading-tight">
                {update.title}
              </h1>

              {/* Full Date */}
              {formattedDate && <p className="text-muted-foreground">{formattedDate}</p>}
            </div>

            {/* Description/Body */}
            {update.description && (
              <Card className="p-8 lg:p-12 bg-card/80 backdrop-blur border-border/50">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {update.description.split("\n\n").map((paragraph: string, index: number) => (
                      <p key={index} className="mb-6 last:mb-0 text-muted-foreground text-lg">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Optional External Link */}
            {update.read_more_url && (
              <div>
                <Button
                  variant="outline"
                  size="lg"
                  className="group"
                  style={{ borderRadius: "1rem" }}
                  asChild
                >
                  <TrackedExternalLink
                    href={update.read_more_url}
                    eventType="link_click"
                    entityType="update_link"
                    entityId={update.id}
                    metadata={{ url: update.read_more_url, update_slug: update.slug }}
                  >
                    Read more
                    <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </TrackedExternalLink>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
