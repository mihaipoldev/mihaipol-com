import { getAllPlatforms } from "@/features/platforms/data"
import { PlatformsClient } from "./PlatformsClient"

export const dynamic = 'force-dynamic'

export default async function PlatformsPage() {
  const platforms = await getAllPlatforms()
  
  return <PlatformsClient initialPlatforms={platforms} />
}

