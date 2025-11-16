import { getAllReleases } from "@/features/releases/data"
import { ReleasesClient } from "./ReleasesClient"

export const dynamic = 'force-dynamic'

export default async function ReleasesPage() {
  const releases = await getAllReleases()
  
  return <ReleasesClient initialReleases={releases} />
}

