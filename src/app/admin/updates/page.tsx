import { Suspense } from "react";
import { getAllUpdatesUnfiltered } from "@/features/updates/data";
import { UpdatesList } from "@/features/updates/components/UpdatesList";
import { AdminPageLoading } from "@/components/admin/ui/AdminPageLoading";

export const dynamic = "force-dynamic";

async function UpdatesContent() {
  const updates = await getAllUpdatesUnfiltered();
  return <UpdatesList initialUpdates={updates || []} />;
}

export default function UpdatesPage() {
  return (
    <Suspense fallback={<AdminPageLoading />}>
      <UpdatesContent />
    </Suspense>
  );
}
