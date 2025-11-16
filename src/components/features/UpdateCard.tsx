import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

export type UpdateCardProps = {
  id: string
  slug: string
  title: string
  image_url?: string | null
  date?: string | null
  description?: string | null
  className?: string
}

export default function UpdateCard({
  id,
  slug,
  title,
  image_url,
  date,
  description,
  className,
}: UpdateCardProps) {
  return (
    <Link
      href={`/dev/updates/${slug}`}
      className={cn('flex-shrink-0 w-80 group', className)}
    >
      <div className="rounded-lg overflow-hidden transition-all duration-200 h-full flex flex-col">
        {image_url && (
          <div className="aspect-video bg-muted overflow-hidden rounded-lg">
            <img
              src={image_url}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-lg"
            />
          </div>
        )}
        <div className="py-4 flex-1 flex flex-col bg-transparent px-3">
          <h3 className="font-semibold text-lg mb-2 relative inline-block">
            <span className="relative z-10">{title}</span>
            <span className="absolute bottom-0 left-0 w-0 h-px bg-foreground group-hover:w-full transition-all duration-300 ease-out"></span>
          </h3>
          {date && (
            <p className="text-sm text-muted-foreground mb-2">
              {formatDate(date)}
            </p>
          )}
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {description}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

