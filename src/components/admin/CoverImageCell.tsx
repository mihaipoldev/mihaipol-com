import * as React from "react";
import { TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type CoverImageCellProps = {
  imageUrl?: string | null;
  title: string;
  showInitials?: boolean;
  className?: string;
  horizontal?: boolean;
};

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0][0]?.toUpperCase() || "";
  return (words[0][0]?.toUpperCase() || "") + (words[words.length - 1][0]?.toUpperCase() || "");
}

export function CoverImageCell({
  imageUrl,
  title,
  showInitials = false,
  className,
  horizontal = false,
}: CoverImageCellProps) {
  const [imageError, setImageError] = React.useState(false);
  const initials = showInitials ? getInitials(title) : null;

  const showImage = imageUrl && !imageError;
  const showInitialsFallback = (!imageUrl || imageError) && showInitials;

  return (
    <TableCell className={cn(horizontal ? "py-4 px-2" : "w-24 py-4 px-2", className)}>
      <div
        className={cn(
          horizontal
            ? "h-8 flex items-center justify-start"
            : "h-12 w-12 rounded-full overflow-hidden flex items-center justify-center bg-muted shadow-md",
          showInitialsFallback && "bg-primary/10 text-xs font-semibold text-muted-foreground"
        )}
      >
        {showImage ? (
          <img
            src={imageUrl}
            alt={title}
            className={horizontal ? "h-full w-auto object-contain" : "h-full w-full object-cover"}
            onError={() => setImageError(true)}
          />
        ) : showInitialsFallback ? (
          initials
        ) : null}
      </div>
    </TableCell>
  );
}
