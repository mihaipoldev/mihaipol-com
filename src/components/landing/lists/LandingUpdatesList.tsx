import LandingUpdateItem, { type UpdateCardVariant } from "../items/LandingUpdateItem";
import type { LandingUpdate } from "../types";
import { cn } from "@/lib/utils";

type LandingUpdatesListProps = {
  updates: LandingUpdate[];
  fallbackImage: string;
  variant?: UpdateCardVariant;
  columns?: 3 | 4 | 5;
};

export default function LandingUpdatesList({
  updates,
  fallbackImage,
  variant = "card-badge",
  columns = 3,
}: LandingUpdatesListProps) {
  const gridClasses =
    columns === 5
      ? "grid md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-[1200px] mx-auto"
      : columns === 4
        ? "grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1200px] mx-auto"
        : "grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1200px] mx-auto";

  return (
    <div className={cn(gridClasses)}>
      {updates.map((update) => (
        <LandingUpdateItem
          key={update.id}
          update={update}
          fallbackImage={fallbackImage}
          variant={variant}
        />
      ))}
    </div>
  );
}
