"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { deleteLabel } from "@/features/labels/mutations"
import { AdminTable, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/admin/AdminTable"
import { TableTitleCell } from "@/components/admin/TableTitleCell"
import { ActionMenu } from "@/components/admin/ActionMenu"
import { AdminPageTitle } from "@/components/admin/AdminPageTitle"
import { AdminToolbar } from "@/components/admin/AdminToolbar"
import { AdminButton } from "@/components/admin/AdminButton"
import { faPlus } from "@fortawesome/free-solid-svg-icons"
import { toast } from "sonner"

type Label = {
  id: string
  name: string
  slug: string
  logo_image_url: string | null
  website_url: string | null
  created_at: string
}

type LabelsClientProps = {
  initialLabels: Label[]
}

export function LabelsClient({ initialLabels }: LabelsClientProps) {
  const router = useRouter()
  const [labels, setLabels] = useState<Label[]>(initialLabels)
  const [searchQuery, setSearchQuery] = useState("")

  const handleDelete = async (id: string) => {
    try {
      await deleteLabel(id)
      toast.success("Label deleted successfully")
      setLabels(labels.filter(l => l.id !== id))
    } catch (error) {
      console.error("Error deleting label:", error)
      toast.error("Failed to delete label")
      throw error
    }
  }

  const filteredLabels = labels.filter((label) => {
    const query = searchQuery.toLowerCase()
    return (
      label.name.toLowerCase().includes(query) ||
      label.website_url?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="w-full">
      <AdminPageTitle title="Labels" />
      <div className="space-y-4 mt-6">
        <AdminToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search labels..."
        >
          <AdminButton icon={faPlus} onClick={() => router.push("/admin/labels/new/edit")}>
            New Label
          </AdminButton>
        </AdminToolbar>

        <AdminTable>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Name</TableHead>
            <TableHead className="text-right pr-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLabels.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-muted-foreground">
                {searchQuery ? "No labels found matching your search" : "No labels found"}
              </TableCell>
            </TableRow>
          ) : (
            filteredLabels.map((label) => (
              <TableRow key={label.id}>
                <TableTitleCell 
                  title={label.name}
                  imageUrl={label.logo_image_url}
                  showInitials={true}
                  className="pl-4"
                />
                <TableCell className="text-right pr-4">
                  <ActionMenu
                    itemId={label.id}
                    editHref={`/admin/labels/${label.slug}/edit`}
                    onDelete={handleDelete}
                    deleteLabel={`label "${label.name}"`}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </AdminTable>
      </div>
    </div>
  )
}

