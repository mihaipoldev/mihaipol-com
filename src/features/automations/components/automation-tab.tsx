"use client";

import { ArtworkProcessor } from "./content-generation/artwork-processor";

type AutomationTabProps = {
  albumId: string;
};

export function AutomationTab({ albumId }: AutomationTabProps) {
  return (
    <div className="w-full">
      <ArtworkProcessor albumId={albumId} />
    </div>
  );
}
