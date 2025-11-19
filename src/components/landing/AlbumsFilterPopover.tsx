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
            "h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors",
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
        className="w-72 bg-black/30 backdrop-blur-lg border-0 shadow-lg relative overflow-hidden p-0 text-card-foreground"
        align="end"
        sideOffset={8}
      >
        {/* Background with gradient using theme colors */}
        <div
          className="absolute inset-0 rounded-md"
          style={{
            background: `linear-gradient(135deg, 
              hsl(var(--primary) / 0.1) 0%, 
              hsl(var(--accent) / 0.5) 50%, 
              hsl(var(--primary) / 0.1) 100%
            )`,
          }}
        />
        {/* Additional gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[4%] via-accent/[2%] to-primary/[3%] pointer-events-none rounded-md" />
        <div className="space-y-4 relative z-10 p-4">
          {/* Header */}
          <div className="flex items-center justify-between h-8 pb-2">
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
                    className="flex items-center space-x-3 group cursor-pointer"
                    onClick={() => onAlbumTypeToggle(type)}
                  >
                    <Checkbox
                      id={`album-type-${type}`}
                      checked={selectedAlbumTypes.has(type)}
                      onCheckedChange={() => onAlbumTypeToggle(type)}
                      className="border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label
                      htmlFor={`album-type-${type}`}
                      className="text-sm font-medium text-card-foreground cursor-pointer flex-1 group-hover:text-foreground transition-colors"
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
                    className="flex items-center space-x-3 group cursor-pointer"
                    onClick={() => onFormatTypeToggle(type)}
                  >
                    <Checkbox
                      id={`format-type-${type}`}
                      checked={selectedFormatTypes.has(type)}
                      onCheckedChange={() => onFormatTypeToggle(type)}
                      className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label
                      htmlFor={`format-type-${type}`}
                      className="text-sm font-medium text-card-foreground cursor-pointer flex-1 group-hover:text-foreground transition-colors"
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
