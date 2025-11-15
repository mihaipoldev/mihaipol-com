import Link from 'next/link'
import { cn } from '@/lib/utils'

export type ShowMoreButtonProps = {
  href: string
  label?: string
  className?: string
}

export default function ShowMoreButton({
  href,
  label = 'Show all',
  className,
}: ShowMoreButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        'text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors',
        className
      )}
    >
      {label} →
    </Link>
  )
}

