import { Suspense } from "react";
import { getAllLabels } from "@/features/labels/data";
import { LabelsList } from "@/features/labels/components/LabelsList";
import { AdminPageLoading } from "@/components/admin/ui/AdminPageLoading";

export const dynamic = "force-dynamic";

async function LabelsContent() {
  const labels = await getAllLabels();
  return <LabelsList initialLabels={labels} />;
}

export default function LabelsPage() {
  return (
    <Suspense fallback={<AdminPageLoading />}>
      <LabelsContent />
    </Suspense>
  );
}
