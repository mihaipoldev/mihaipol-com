import { getAllUpdatesUnfiltered } from "@/features/updates/data";
import { UpdatesList } from "@/features/updates/components/UpdatesList";

export const dynamic = "force-dynamic";

export default async function UpdatesPage() {
  const updates = await getAllUpdatesUnfiltered();

  return <UpdatesList initialUpdates={updates || []} />;
}
