import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EditEntityTypePage({ params }: PageProps) {
  // Redirect to list page - editing is now done via modal
  redirect("/admin/entity-types");
}
