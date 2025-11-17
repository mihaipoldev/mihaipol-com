import LandingUpdateItem from "../items/LandingUpdateItem";
import type { LandingUpdate } from "../types";

type LandingUpdatesListProps = {
  updates: LandingUpdate[];
  fallbackImage: string;
};

export default function LandingUpdatesList({ updates, fallbackImage }: LandingUpdatesListProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {updates.map((update) => (
        <LandingUpdateItem key={update.id} update={update} fallbackImage={fallbackImage} />
      ))}
    </div>
  );
}
