import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Music } from "lucide-react";
import type { Album } from "../../api/landing-page-preferences-api";

interface FeaturedAlbumSelectProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  albums: Album[] | undefined;
  isLoading?: boolean;
}

export function FeaturedAlbumSelect({ value, onChange, disabled, albums, isLoading }: FeaturedAlbumSelectProps) {
  return (
    <Select
      value={
        value && value !== "null" && value !== null
          ? String(value)
          : "__default__"
      }
      onValueChange={(newValue) => {
        onChange(newValue === "__default__" ? null : newValue);
      }}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className="w-[300px]">
        <SelectValue placeholder="Use default (Griffith album)" />
      </SelectTrigger>
      <SelectContent align="end" className="w-[300px]">
        <SelectItem value="__default__" className="overflow-hidden min-w-0">
          <div className="flex items-center gap-2 min-w-0 max-w-full overflow-hidden">
            <Music className="h-4 w-4 shrink-0" />
            <span className="truncate min-w-0" style={{ maxWidth: "calc(300px - 3rem)" }}>
              Use default (Griffith album)
            </span>
          </div>
        </SelectItem>
        {albums
          ?.sort((a, b) => {
            // Albums without dates come first, sorted by name
            if (!a.release_date && !b.release_date) {
              return a.title.localeCompare(b.title);
            }
            if (!a.release_date) return -1;
            if (!b.release_date) return 1;
            // Albums with dates sorted by date descending
            return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
          })
          .map((album) => (
            <SelectItem key={album.id} value={album.id} className="overflow-hidden min-w-0">
              <div className="flex items-center gap-2 min-w-0 max-w-full overflow-hidden">
                {album.cover_image_url ? (
                  <img
                    src={album.cover_image_url}
                    alt={album.title}
                    className="h-4 w-4 shrink-0 rounded object-cover"
                  />
                ) : (
                  <Music className="h-4 w-4 shrink-0" />
                )}
                <span className="truncate min-w-0" style={{ maxWidth: "calc(300px - 3rem)" }}>
                  {album.title}
                  {album.labelName && ` (${album.labelName})`}
                  {album.publish_status !== "published" && ` [${album.publish_status}]`}
                </span>
              </div>
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
