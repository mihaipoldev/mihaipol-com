import * as React from "react";
import Link from "next/link";
import { TableCell } from "@/components/ui/table";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { cn } from "@/lib/utils";

type TableTitleCellProps = React.TdHTMLAttributes<HTMLTableCellElement> & {
  title: string;
  icon?: IconDefinition;
  imageUrl?: string | null;
  metadata?: string;
  description?: string;
  showInitials?: boolean;
  href?: string;
};

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0][0]?.toUpperCase() || "";
  return (words[0][0]?.toUpperCase() || "") + (words[words.length - 1][0]?.toUpperCase() || "");
}

export function TableTitleCell({
  title,
  icon,
  imageUrl,
  metadata,
  description,
  showInitials,
  href,
  className,
  ...props
}: TableTitleCellProps) {
  const [imageError, setImageError] = React.useState(false);
  const initials = showInitials ? getInitials(title) : null;
  const titleContent = href ? (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      {title}
    </Link>
  ) : (
    <span>{title}</span>
  );

  // Determine what to show: try image first, fallback to initials or icon
  const showImage = imageUrl && !imageError;
  const showInitialsFallback = (!imageUrl || imageError) && showInitials;
  const showIcon = (!imageUrl || imageError) && !showInitials && icon;

  return (
    <TableCell className={cn("font-medium", className)} {...props}>
      <div className="flex gap-2 items-center">
        {showImage ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-8 w-8 mr-1 rounded-full object-cover flex-shrink-0 shadow-md"
            onError={() => setImageError(true)}
          />
        ) : showIcon ? (
          <FontAwesomeIcon icon={icon} className="h-4 w-4 mr-1 flex-shrink-0" />
        ) : showInitialsFallback ? (
          <div className="h-8 w-8 mr-1 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0 shadow-md">
            {initials}
          </div>
        ) : null}
        <div className="flex flex-col gap-0 flex-1 min-w-0">
          <div className="flex items-center gap-2 font-bold min-w-0">
            <span className="truncate">{titleContent}</span>
            {metadata && (
              <span className="text-xs text-muted-foreground/70 flex-shrink-0">[{metadata}]</span>
            )}
          </div>
          {description && (
            <span className="text-xs text-muted-foreground truncate">{description}</span>
          )}
        </div>
      </div>
    </TableCell>
  );
}
