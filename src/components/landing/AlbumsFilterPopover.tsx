"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type AlbumsFilterPopoverProps = {
  availableAlbumTypes: string[];
  availableFormatTypes: string[];
  selectedAlbumTypes: Set<string>;
  selectedFormatTypes: Set<string>;
  onAlbumTypeToggle: (type: string) => void;
  onFormatTypeToggle: (type: string) => void;
  onClearFilters: () => void;
};

export default function AlbumsFilterPopover({
  availableAlbumTypes,
  availableFormatTypes,
  selectedAlbumTypes,
  selectedFormatTypes,
  onAlbumTypeToggle,
  onFormatTypeToggle,
  onClearFilters,
}: AlbumsFilterPopoverProps) {
  const activeFilterCount = selectedAlbumTypes.size + selectedFormatTypes.size;
  const hasFilters = availableAlbumTypes.length > 0 || availableFormatTypes.length > 0;

  if (!hasFilters) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 text-muted-foreground hover:text-foreground/80 hover:bg-transparent transition-colors",
            activeFilterCount > 0 && "text-foreground"
          )}
          aria-label="Filter albums"
        >
          <div className="relative">
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {activeFilterCount}
              </Badge>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 bg-secondary border-none shadow-lg relative overflow-hidden p-0 text-card-foreground"
        align="end"
        sideOffset={8}
      >
        <div className="space-y-4 relative z-10 p-4">
          {/* Header */}
          <div className="flex items-center justify-between h-4 pb-0">
            <h3 className="font-semibold text-sm text-card-foreground">Filters</h3>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-transparent"
              >
                Clear all
              </Button>
            )}
          </div>

          {/* Album Type Filters */}
          {availableAlbumTypes.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Album Type
              </label>
              <div className="space-y-2.5">
                {availableAlbumTypes.map((type) => (
                  <div
                    key={type}
                    className="flex items-center space-x-3 group cursor-pointer relative z-10"
                    onClick={() => onAlbumTypeToggle(type)}
                  >
                    <Checkbox
                      id={`album-type-${type}`}
                      checked={selectedAlbumTypes.has(type)}
                      onCheckedChange={() => onAlbumTypeToggle(type)}
                      className="border-primary/30 group-hover:border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-colors relative z-10"
                    />
                    <label
                      htmlFor={`album-type-${type}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-medium text-card-foreground/70 cursor-pointer flex-1 group-hover:text-foreground transition-colors relative z-10"
                    >
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Format Type Filters */}
          {availableFormatTypes.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Format Type
              </label>
              <div className="space-y-2.5">
                {availableFormatTypes.map((type) => (
                  <div
                    key={type}
                    className="flex items-center space-x-3 group cursor-pointer relative z-10"
                    onClick={() => onFormatTypeToggle(type)}
                  >
                    <Checkbox
                      id={`format-type-${type}`}
                      checked={selectedFormatTypes.has(type)}
                      onCheckedChange={() => onFormatTypeToggle(type)}
                      className="border-primary/30 group-hover:border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-colors relative z-10"
                    />
                    <label
                      htmlFor={`format-type-${type}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-medium text-card-foreground/70 cursor-pointer flex-1 group-hover:text-foreground transition-colors relative z-10"
                    >
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
