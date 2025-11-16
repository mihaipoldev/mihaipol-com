import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getEventBySlug } from '@/features/events/data'
import { formatDetailDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

interface EventPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params
  const event = await getEventBySlug(slug)

  if (!event) {
    notFound()
  }

  const location = event.city && event.venue
    ? `${event.city} – ${event.venue}`
    : event.city || event.venue || 'Location TBA'

  const fullLocation = [event.city, event.country].filter(Boolean).join(', ') || null

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-4xl px-10 md:px-16 lg:px-28 py-16">
        {/* Back Link */}
        <Link
          href="/dev/events"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </Link>

        {/* Meta Row (Status + Date) */}
        <div className="flex items-center gap-4 mb-6">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
            event.event_status === 'upcoming'
              ? 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400'
              : event.event_status === 'past'
              ? 'bg-gray-500/10 text-gray-600 border-gray-500/20 dark:text-gray-400'
              : 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400'
          }`}>
            {event.event_status === 'upcoming' ? 'Upcoming' : event.event_status === 'past' ? 'Past' : 'Cancelled'}
          </span>
          {event.date && (
            <time className="text-sm text-muted-foreground">
              {formatDetailDate(event.date)}
            </time>
          )}
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          {event.title}
        </h1>

        {/* Location */}
        <div className="mb-8">
          <p className="text-lg text-muted-foreground">
            {location}
          </p>
          {fullLocation && (
            <p className="text-sm text-muted-foreground mt-1">
              {fullLocation}
            </p>
          )}
        </div>

        {/* Date Details */}
        {event.date && (
          <div className="mb-8">
            <div>
              <span className="text-sm font-medium text-foreground">Date: </span>
              <span className="text-sm text-muted-foreground">
                {new Date(event.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            </div>
          )}

        {/* Description */}
        {event.description && (
          <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
            <div className="whitespace-pre-wrap text-foreground leading-relaxed">
              {event.description.split('\n\n').map((paragraph: string, index: number) => (
                <p key={index} className="mb-6 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Tickets Link */}
        {event.tickets_url && (
          <div className="pt-8 border-t border-border">
            <Button
              asChild
              size="lg"
            >
              <a
                href={event.tickets_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                {event.ticket_label || 'Get Tickets'}
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

