import { getAllLabels } from "@/features/labels/data";
import { LabelsList } from "@/features/labels/components/LabelsList";

export const dynamic = "force-dynamic";

export default async function LabelsPage() {
  const labels = await getAllLabels();

  return <LabelsList initialLabels={labels} />;
}
