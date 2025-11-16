import { getAllUpdatesUnfiltered } from "@/features/updates/data"
import { UpdatesClient } from "./UpdatesClient"

export const dynamic = 'force-dynamic'

export default async function UpdatesPage() {
  const updates = await getAllUpdatesUnfiltered()
  
  return <UpdatesClient initialUpdates={updates} />
}

