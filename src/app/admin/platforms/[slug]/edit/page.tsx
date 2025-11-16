import { redirect } from "next/navigation"
import { getPlatformBySlug } from "@/features/platforms/data"
import { EditPlatformForm } from "./EditPlatformForm"

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function EditPlatformPage({ params }: PageProps) {
  const { slug } = await params
  const isNew = slug === "new"

  const platform = isNew ? null : await getPlatformBySlug(slug)

  if (!isNew && !platform) {
    redirect("/admin/platforms")
  }

  return (
    <EditPlatformForm
      id={platform?.id || "new"}
      isNew={isNew}
      initialPlatform={platform}
    />
  )
}

