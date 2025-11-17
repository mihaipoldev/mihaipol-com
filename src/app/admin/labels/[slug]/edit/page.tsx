import { redirect } from "next/navigation";
import { getLabelBySlug } from "@/features/labels/data";
import { EditLabelForm } from "@/features/labels/components/EditLabelForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EditLabelPage({ params }: PageProps) {
  const { slug } = await params;
  const isNew = slug === "new";

  const label = isNew ? null : await getLabelBySlug(slug);

  if (!isNew && !label) {
    redirect("/admin/labels");
  }

  return <EditLabelForm id={label?.id || "new"} isNew={isNew} initialLabel={label} />;
}
