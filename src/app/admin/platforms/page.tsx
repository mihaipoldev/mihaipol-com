import { getAllPlatforms } from "@/features/smart-links/platforms/data"
import { PlatformsList } from "@/features/smart-links/platforms/components/PlatformsList"

export const dynamic = 'force-dynamic'

export default async function PlatformsPage() {
  const platforms = await getAllPlatforms()
  
  return <PlatformsList initialPlatforms={platforms} />
}

