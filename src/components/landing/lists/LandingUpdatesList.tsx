import LandingUpdateItem, { type UpdateCardVariant } from "../items/LandingUpdateItem";
import type { LandingUpdate } from "../types";

type LandingUpdatesListProps = {
  updates: LandingUpdate[];
  fallbackImage: string;
  variant?: UpdateCardVariant;
};

export default function LandingUpdatesList({ 
  updates, 
  fallbackImage,
  variant = "card-badge" 
}: LandingUpdatesListProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
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
