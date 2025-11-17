import { redirect } from "next/navigation"
import { getEventBySlugAdmin } from "@/features/events/data"
import { EditEventForm } from "@/features/events/components/EditEventForm"

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function EditEventPage({ params }: PageProps) {
  const { slug } = await params
  const isNew = slug === "new"

  const event = isNew ? null : await getEventBySlugAdmin(slug)

  // If editing and event not found, redirect
  if (!isNew && !event) {
    redirect("/admin/events")
  }

  return (
    <EditEventForm
      id={event?.id || "new"}
      isNew={isNew}
      initialEvent={event}
    />
  )
}

