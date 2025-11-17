"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deletePlatform } from "@/features/platforms/mutations"
import { AdminTable, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/admin/AdminTable"
import { TableTitleCell } from "@/components/admin/TableTitleCell"
import { CoverImageCell } from "@/components/admin/CoverImageCell"
import { ActionMenu } from "@/components/admin/ActionMenu"
import { AdminPageTitle } from "@/components/admin/AdminPageTitle"
import { AdminToolbar } from "@/components/admin/AdminToolbar"
import { Button } from "@/components/ui/button"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Badge } from "@/components/ui/badge"
import { faPlus } from "@fortawesome/free-solid-svg-icons"
import { toast } from "sonner"

type Platform = {
  id: string
  name: string
  slug: string
  display_name: string
  base_url: string | null
  icon_url: string | null
  is_active: boolean
  sort_order: number
}

type PlatformsListProps = {
  initialPlatforms: Platform[]
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function PlatformsList({ initialPlatforms }: PlatformsListProps) {
  const router = useRouter()
  const [platforms, setPlatforms] = useState<Platform[]>(initialPlatforms)
  const [searchQuery, setSearchQuery] = useState("")

  const handleDelete = async (id: string) => {
    try {
      await deletePlatform(id)
      toast.success("Platform deleted successfully")
      setPlatforms(platforms.filter(p => p.id !== id))
    } catch (error) {
      console.error("Error deleting platform:", error)
      toast.error("Failed to delete platform")
      throw error
    }
  }

  const filteredPlatforms = platforms.filter((platform) => {
    const query = searchQuery.toLowerCase()
    return (
      platform.name.toLowerCase().includes(query) ||
      platform.display_name.toLowerCase().includes(query) ||
      platform.base_url?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="w-full">
      <div className="mb-6 relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />
      <AdminPageTitle 
        title="Platforms" 
        description="Manage music streaming platforms and distribution channels where your music is available."
      />
      </div>
      <div className="space-y-4">
        <AdminToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search platforms..."
        >
          <Button 
            onClick={() => router.push("/admin/platforms/new/edit")}
            className="rounded-full w-10 h-10 p-0 bg-transparent text-muted-foreground hover:text-primary hover:bg-transparent border-0 shadow-none transition-colors"
            title="New Platform"
            variant="ghost"
          >
            <FontAwesomeIcon icon={faPlus} className="h-5 w-5" />
          </Button>
        </AdminToolbar>

        <AdminTable>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4 w-24">Cover</TableHead>
            <TableHead className="w-[40%]">Name</TableHead>
            <TableHead>Base URL</TableHead>
            <TableHead>Is Active</TableHead>
            <TableHead className="w-24">Sort Order</TableHead>
            <TableHead className="text-right pr-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPlatforms.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                {searchQuery ? "No platforms found matching your search" : "No platforms found"}
              </TableCell>
            </TableRow>
          ) : (
            filteredPlatforms.map((platform) => {
              const platformSlug = platform.slug || generateSlug(platform.name)
              return (
              <TableRow 
                key={platform.id}
                onClick={() => router.push(`/admin/platforms/${platformSlug}/edit`)}
                className="group cursor-pointer hover:bg-muted/50"
              >
                <CoverImageCell
                  imageUrl={platform.icon_url}
                  title={platform.display_name}
                  showInitials={true}
                  className="pl-4"
                />
                <TableTitleCell 
                  title={platform.display_name}
                  imageUrl={undefined}
                  showInitials={false}
                  className="w-[40%]"
                />
                <TableCell>
                  {platform.base_url ? (
                    <a
                      href={platform.base_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {platform.base_url}
                    </a>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={platform.is_active ? "default" : "outline"}>
                    {platform.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="w-24">{platform.sort_order}</TableCell>
                <TableCell className="text-right pr-4">
                  <ActionMenu
                    itemId={platform.id}
                    editHref={`/admin/platforms/${platformSlug}/edit`}
                    onDelete={handleDelete}
                    deleteLabel={`platform "${platform.display_name}"`}
                  />
                </TableCell>
              </TableRow>
              )
            })
          )}
        </TableBody>
      </AdminTable>
      </div>
    </div>
  )
}


