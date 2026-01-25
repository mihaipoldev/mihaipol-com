import { Suspense } from "react";
import { getAllPlatforms } from "@/features/smart-links/platforms/data";
import { PlatformsList } from "@/features/smart-links/platforms/components/PlatformsList";
import { AdminPageLoading } from "@/components/admin/ui/AdminPageLoading";

export const dynamic = "force-dynamic";

async function PlatformsContent() {
  const platforms = await getAllPlatforms();
  return <PlatformsList initialPlatforms={platforms} />;
}

export default function PlatformsPage() {
  return (
    <Suspense fallback={<AdminPageLoading />}>
      <PlatformsContent />
    </Suspense>
  );
}
