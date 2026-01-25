import { Suspense } from "react";
import { getAllEntityTypesIncludingDisabled } from "@/features/entity-types/data";
import { EntityTypesList } from "@/features/entity-types/components/EntityTypesList";
import { AdminPageLoading } from "@/components/admin/ui/AdminPageLoading";

export const dynamic = "force-dynamic";

async function EntityTypesContent() {
  const entityTypes = await getAllEntityTypesIncludingDisabled();
  return <EntityTypesList initialEntityTypes={entityTypes} />;
}

export default function EntityTypesPage() {
  return (
    <Suspense fallback={<AdminPageLoading />}>
      <EntityTypesContent />
    </Suspense>
  );
}
