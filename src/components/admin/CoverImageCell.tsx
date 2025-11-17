import * as React from "react"
import { TableCell } from "@/components/ui/table"
import { cn } from "@/lib/utils"

type CoverImageCellProps = {
  imageUrl?: string | null
  title: string
  showInitials?: boolean
  className?: string
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 0) return ""
  if (words.length === 1) return words[0][0]?.toUpperCase() || ""
  return (words[0][0]?.toUpperCase() || "") + (words[words.length - 1][0]?.toUpperCase() || "")
}

export function CoverImageCell({
  imageUrl,
  title,
  showInitials = false,
  className,
}: CoverImageCellProps) {
  const [imageError, setImageError] = React.useState(false)
  const initials = showInitials ? getInitials(title) : null
  
  const showImage = imageUrl && !imageError
  const showInitialsFallback = (!imageUrl || imageError) && showInitials
  
  return (
    <TableCell className={cn("w-24 py-4 px-2", className)}>
      {showImage ? (
        <img
          src={imageUrl}
          alt={title}
          className="max-h-12 max-w-12 h-auto w-auto rounded-md object-cover"
          onError={() => setImageError(true)}
        />
      ) : showInitialsFallback ? (
        <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center text-xs font-semibold text-muted-foreground">
          {initials}
        </div>
      ) : (
        <div className="h-12 w-12 rounded-md bg-muted" />
      )}
    </TableCell>
  )
}

