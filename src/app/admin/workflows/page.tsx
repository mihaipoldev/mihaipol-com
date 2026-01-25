import { Suspense } from "react";
import { getAllWorkflowsIncludingDisabled } from "@/features/workflows/data";
import { WorkflowsList } from "@/features/workflows/components/WorkflowsList";
import { AdminPageLoading } from "@/components/admin/ui/AdminPageLoading";

export const dynamic = "force-dynamic";

async function WorkflowsContent() {
  const workflows = await getAllWorkflowsIncludingDisabled();
  return <WorkflowsList initialWorkflows={workflows} />;
}

export default function WorkflowsPage() {
  return (
    <Suspense fallback={<AdminPageLoading />}>
      <WorkflowsContent />
    </Suspense>
  );
}
