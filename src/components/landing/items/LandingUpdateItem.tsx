import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatUpdateDate } from "../utils";
import type { LandingUpdate } from "../types";

type LandingUpdateItemProps = {
  update: LandingUpdate;
  fallbackImage: string;
};

export default function LandingUpdateItem({ update, fallbackImage }: LandingUpdateItemProps) {
  const imageUrl = update.image_url ?? fallbackImage;

  return (
    <Card className="overflow-hidden group hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 bg-card/80 backdrop-blur">
      <Link href={`/dev/updates/${update.slug}`}>
        <div className="aspect-video overflow-hidden">
          <img
            src={imageUrl}
            alt={update.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
      </Link>
      <div className="p-6 space-y-4">
        <Badge variant="secondary">Update</Badge>
        <div>
          <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
            {update.title}
          </h3>
          {update.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{update.description}</p>
          )}
          <p className="text-xs text-muted-foreground">{formatUpdateDate(update.date)}</p>
        </div>
      </div>
    </Card>
  );
}
