import { getAllLabels } from "@/features/labels/data"
import { LabelsClient } from "./LabelsClient"

export const dynamic = 'force-dynamic'

export default async function LabelsPage() {
  const labels = await getAllLabels()
  
  return <LabelsClient initialLabels={labels} />
}

