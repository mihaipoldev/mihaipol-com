import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getUpdateBySlug } from '@/features/updates/data'
import { formatDetailDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

interface UpdateDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function UpdateDetailPage({ params }: UpdateDetailPageProps) {
  const { slug } = await params
  const update = await getUpdateBySlug(slug)

  if (!update) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-4xl py-16">
        {/* Back Link */}
        <Link
          href="/dev/updates"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to updates
        </Link>

        {/* Hero Image */}
        {update.image_url ? (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={update.image_url}
              alt={update.title}
              className="w-full h-auto object-cover aspect-video"
            />
          </div>
        ) : (
          <div className="mb-8 rounded-lg overflow-hidden bg-gradient-to-br from-muted to-muted/50 aspect-video flex items-center justify-center">
            <div className="text-muted-foreground/50 text-sm">No image</div>
          </div>
        )}

        {/* Meta Row (Category + Date) */}
        <div className="flex items-center gap-4 mb-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            Update
          </span>
          {update.date && (
            <time className="text-sm text-muted-foreground">
              {formatDetailDate(update.date)}
            </time>
          )}
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight">
          {update.title}
        </h1>

        {/* Description/Body */}
        {update.description && (
          <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
            <div className="whitespace-pre-wrap text-foreground leading-relaxed">
              {update.description.split('\n\n').map((paragraph: string, index: number) => (
                <p key={index} className="mb-6 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Optional External Link */}
        {update.read_more_url && (
          <div className="pt-8 border-t border-border">
            <Button
              asChild
              size="lg"
              variant="outline"
            >
              <a
                href={update.read_more_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                Read more
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

