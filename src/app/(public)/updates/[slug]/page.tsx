import { notFound } from "next/navigation";
import { Calendar, ExternalLink, Star } from "lucide-react";
import { getUpdateBySlug } from "@/features/updates/data";
import { formatUpdateDate } from "@/components/landing/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/ui/markdown";
import TrackView from "@/features/smart-links/analytics/components/TrackView";
import TrackedExternalLink from "@/components/features/TrackedExternalLink";
import { EmbedRenderer } from "@/components/features/EmbedRenderer";

export const dynamic = "force-dynamic";

interface UpdateDetailPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export default async function UpdateDetailPage({ params, searchParams }: UpdateDetailPageProps) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === process.env.PREVIEW_SECRET;
  const update = await getUpdateBySlug(slug, isPreview);

  if (!update) {
    notFound();
  }

  const resolvedImageUrl = update.image_media?.url;
  const hasImage = !!resolvedImageUrl;
  const showImage = hasImage && update.show_cover_image !== false;
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
        metadata={{ update_slug: update.slug, path: `/updates/${update.slug}` }}
      />
      <div className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="space-y-8">
            {/* Hero Section - Image on left, content on right */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12 items-start ">
              {/* Image - Left side, square (1/3 width) */}
              {showImage && (
                <div className="relative rounded-3xl overflow-hidden shadow-card-hover aspect-square lg:col-span-1">
                  <img
                    src={resolvedImageUrl!}
                    alt={update.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                </div>
              )}

              {/* Content - Right side (2/3 width) */}
              <div className="space-y-6 lg:col-span-3">
                {/* Title - Always first */}
                <h1 className="text-4xl lg:text-5xl font-bold text-gradient-sunset leading-tight">
                  {update.title}
                </h1>

                {/* Badges and Date - After title */}
                <div className="flex items-center gap-4 flex-wrap">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    Update
                  </Badge>
                  {update.is_featured && (
                    <Badge variant="default" className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {formattedDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <time>{formattedDate}</time>
                    </div>
                  )}
                </div>

                {/* Description/Body */}
                {update.description && (
                  <Markdown className="text-foreground leading-relaxed">
                    {update.description}
                  </Markdown>
                )}

                {/* Embeds Section */}
                {update.embeds && update.embeds.length > 0 && (
                  <div>
                    <EmbedRenderer embeds={update.embeds} />
                  </div>
                )}

                {/* External Links Section */}
                {update.external_links && update.external_links.length > 0 && (
                  <div className="space-y-3">
                    {update.external_links.map((link: { label: string; url: string }, index: number) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="lg"
                        className="group w-full sm:w-auto"
                        style={{ borderRadius: "1rem" }}
                        asChild
                      >
                        <TrackedExternalLink
                          href={link.url}
                          eventType="link_click"
                          entityType="update_link"
                          entityId={update.id}
                          metadata={{ url: link.url, label: link.label, update_slug: update.slug }}
                        >
                          {link.label}
                          <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </TrackedExternalLink>
                      </Button>
                    ))}
                  </div>
                )}

                {/* Optional External Link (legacy read_more_url) */}
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
        </div>
      </div>
    </>
  );
}
