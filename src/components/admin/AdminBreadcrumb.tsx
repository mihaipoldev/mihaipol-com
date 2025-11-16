"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// Map route segments to display names
const pageNames: Record<string, string> = {
  albums: "Albums",
  artists: "Artists",
  events: "Events",
  labels: "Labels",
  platforms: "Platforms",
  updates: "Updates",
  settings: "Settings",
}

async function fetchItemName(resource: string, slug: string): Promise<string | null> {
  try {
    const response = await fetch(
      `/api/admin/item-name?resource=${encodeURIComponent(resource)}&slug=${encodeURIComponent(slug)}`
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.name || null
  } catch (error) {
    console.error(`Error fetching ${resource} name:`, error)
    return null
  }
}

export function AdminBreadcrumb() {
  const pathname = usePathname()
  const [itemName, setItemName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Parse the pathname
  const segments = pathname.split("/").filter(Boolean)
  
  // Remove "admin" from segments if present
  const adminIndex = segments.indexOf("admin")
  const relevantSegments = adminIndex >= 0 ? segments.slice(adminIndex + 1) : segments

  const isEditPage = relevantSegments.length >= 3 && relevantSegments[2] === "edit"
  const resource = relevantSegments[0] || null
  const itemSlug = isEditPage ? relevantSegments[1] : null

  // Fetch item name for edit pages
  useEffect(() => {
    if (isEditPage && resource && itemSlug) {
      setIsLoading(true)
      fetchItemName(resource, itemSlug)
        .then((name) => {
          setItemName(name)
          setIsLoading(false)
        })
        .catch(() => {
          setIsLoading(false)
        })
    } else {
      setItemName(null)
    }
  }, [isEditPage, resource, itemSlug])

  // Handle dashboard page
  if (!resource || resource === "") {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin">Menu</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  const pageName = pageNames[resource] || resource.charAt(0).toUpperCase() + resource.slice(1)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/admin">Menu</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          {isEditPage ? (
            <BreadcrumbLink asChild>
              <Link href={`/admin/${resource}`}>{pageName}</Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>{pageName}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {isEditPage && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {isLoading ? "Loading..." : itemName || "Edit"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

