import { redirect } from "next/navigation"
import { getUpdateBySlugAdmin } from "@/features/updates/data"
import { EditUpdateForm } from "@/features/updates/components/EditUpdateForm"

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function EditUpdatePage({ params }: PageProps) {
  const { slug } = await params
  const isNew = slug === "new"

  const update = isNew ? null : await getUpdateBySlugAdmin(slug)

  if (!isNew && !update) {
    redirect("/admin/updates")
  }

  return (
    <EditUpdateForm
      id={update?.id || "new"}
      isNew={isNew}
      initialUpdate={update}
    />
  )
}

