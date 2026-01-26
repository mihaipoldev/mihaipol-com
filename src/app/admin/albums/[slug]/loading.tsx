import { Loader2 } from "lucide-react";

export default function AlbumLoading() {
  return (
    <div className="w-full max-w-7xl relative">
      <div className="w-full flex items-center justify-center min-h-[600px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading album...</p>
        </div>
      </div>
    </div>
  );
}

