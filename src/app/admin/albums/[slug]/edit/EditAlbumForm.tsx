"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  createAlbum,
  updateAlbum,
  createAlbumLink,
  updateAlbumLink,
  deleteAlbumLink,
} from "@/features/albums/mutations"
import { FormField } from "@/components/admin/forms/FormField"
import { ImageUploadField } from "@/components/admin/forms/ImageUploadField"
import { AlbumLinksManager } from "@/components/admin/forms/AlbumLinksManager"
import { AdminPageTitle } from "@/components/admin/AdminPageTitle"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

const albumSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  catalog_number: z.string().optional(),
  album_type: z.string().optional(),
  description: z.string().optional(),
  cover_image_url: z.string().url().optional().or(z.literal("")),
  release_date: z.string().optional(),
  // Accept any string or empty; we validate/coerce to UUID/null at submit
  label_id: z.string().optional().or(z.literal("")),
  publish_status: z.enum(["draft", "scheduled", "published", "archived"]),
})

type AlbumFormData = z.infer<typeof albumSchema>

type Label = {
  id: string
  name: string
}

type Platform = {
  id: string
  name: string
  display_name: string
}

type AlbumLink = {
  id: string
  platform_id: string | null
  url: string
  cta_label: string
  link_type: string | null
  sort_order: number
  platforms: Platform | null
}

type Album = {
  id: string
  title: string
  slug: string
  catalog_number: string | null
  album_type: string | null
  description: string | null
  cover_image_url: string | null
  release_date: string | null
  label_id: string | null
  publish_status: "draft" | "scheduled" | "published" | "archived"
}

type EditAlbumFormProps = {
  id: string
  isNew: boolean
  initialAlbum: Album | null
  initialLinks: AlbumLink[]
  labels: Label[]
  platforms: Platform[]
}

export function EditAlbumForm({
  id,
  isNew,
  initialAlbum,
  initialLinks,
  labels,
  platforms,
}: EditAlbumFormProps) {
  const router = useRouter()
  const [links, setLinks] = useState<AlbumLink[]>(initialLinks)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const normalizedInitialStatus = (() => {
    const s = (initialAlbum?.publish_status as any)?.toString?.().trim?.().toLowerCase?.()
    return s === "scheduled" || s === "published" || s === "archived" ? s : "draft"
  })()
  const normalizedInitialLabelId = (initialAlbum?.label_id as any)?.toString?.().trim?.() || ""

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    setValue,
    watch,
    reset,
  } = useForm<AlbumFormData>({
    resolver: zodResolver(albumSchema),
    defaultValues: {
      title: "",
      slug: "",
      catalog_number: "",
      album_type: "",
      description: "",
      cover_image_url: "",
      release_date: "",
      label_id: "",
      publish_status: "draft",
    },
  })

  // Log validation errors whenever they change
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.error("[AlbumForm] validation errors:", errors)
      // Log detailed error messages
      Object.entries(errors).forEach(([field, error]) => {
        console.error(`  - ${field}:`, error?.message || error)
      })
    }
  }, [errors])

  // Populate form when initialAlbum changes
  useEffect(() => {
    if (initialAlbum && !isNew) {
      const normalizeStatus = (v: unknown) => {
        const s = (v as any)?.toString?.().trim().toLowerCase?.()
        return s === "scheduled" || s === "published" || s === "archived" ? s : "draft"
      }
      const formData: Partial<AlbumFormData> = {
        title: initialAlbum.title || "",
        slug: initialAlbum.slug || "",
        catalog_number: initialAlbum.catalog_number || "",
        album_type: initialAlbum.album_type || "",
        description: initialAlbum.description || "",
        cover_image_url: initialAlbum.cover_image_url || "",
        label_id: initialAlbum.label_id || "",
        publish_status: normalizeStatus(initialAlbum.publish_status),
      }

      // eslint-disable-next-line no-console
      console.log("[AlbumForm] reset with initial publish_status:", formData.publish_status)
      // eslint-disable-next-line no-console
      console.log("[AlbumForm] reset with initial label_id:", formData.label_id)

      if (initialAlbum.release_date) {
        const date = new Date(initialAlbum.release_date)
        const localDate = new Date(
          date.getTime() - date.getTimezoneOffset() * 60000
        )
          .toISOString()
          .slice(0, 10)
        formData.release_date = localDate
      }

      reset(formData)
      // Ensure controller values are aligned immediately after reset
      setValue("publish_status", formData.publish_status as any, { shouldValidate: true })
      setValue("label_id", formData.label_id || "", { shouldValidate: true })
    }
  }, [initialAlbum, isNew, reset])

  // Links are managed in state, updated from props when they change
  useEffect(() => {
    setLinks(initialLinks)
  }, [initialLinks])

  // Ensure publish_status stays within allowed values
  useEffect(() => {
    const allowed = ["draft", "scheduled", "published", "archived"] as const
    const currentRaw = watch("publish_status") as AlbumFormData["publish_status"] | undefined
    const current = (currentRaw as any)?.toString?.().trim().toLowerCase?.()
    // eslint-disable-next-line no-console
    console.log("[AlbumForm] effect - current publish_status:", current)
    if (!current || !allowed.includes(current as any)) {
      setValue("publish_status", "draft", { shouldValidate: true })
    }
  }, [watch, setValue])

  // Note: Do NOT coerce label_id in an effect; it can fight with the Controller.
  // We normalize label_id at reset, on change, and just before submit.

  const loadLinks = async () => {
    // Refresh the page to refetch links from server
    router.refresh()
  }

  const validateImageUrl = async (url: string): Promise<{ valid: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/admin/upload/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      })
      const data = await response.json()
      return { valid: data.valid || false, error: data.error }
    } catch (error: any) {
      return { valid: false, error: error.message || "Failed to validate image" }
    }
  }

  // Note: We deliberately avoid strict UUID version checks here because our seed/test IDs
  // may not conform to RFC variants. Trust any non-empty string from the Select and coerce
  // empty string to null on submit.

  const onSubmit = async (data: AlbumFormData) => {
    try {
      // Debug logging for all fields
      // eslint-disable-next-line no-console
      console.log("[AlbumForm] submit - raw form data:", data)
      console.log("[AlbumForm] submit - publish_status:", data.publish_status, typeof data.publish_status)
      console.log("[AlbumForm] submit - label_id:", data.label_id)
      console.log("[AlbumForm] submit - catalog_number:", data.catalog_number)
      console.log("[AlbumForm] submit - album_type:", data.album_type)
      console.log("[AlbumForm] submit - cover_image_url:", data.cover_image_url)

      const newImageUrl = data.cover_image_url?.trim() || null
      const oldImageUrl = initialAlbum?.cover_image_url || null

      const normalizedNewUrl = newImageUrl || null
      const normalizedOldUrl = oldImageUrl || null
      const imageUrlChanged = normalizedNewUrl !== normalizedOldUrl

      let finalImageUrl = normalizedNewUrl

      if (imageUrlChanged) {
        if (selectedFile) {
          try {
            const formData = new FormData()
            formData.append("file", selectedFile)
            formData.append("folderPath", id === "new" ? "albums/temp" : `albums/${id}`)
            const uploadResponse = await fetch("/api/admin/upload", {
              method: "POST",
              body: formData,
            })
            if (!uploadResponse.ok) {
              const error = await uploadResponse.json()
              throw new Error(error.error || "Failed to upload image")
            }
            const uploadData = await uploadResponse.json()
            finalImageUrl = uploadData.url
          } catch (uploadError: any) {
            console.error("Error uploading image:", uploadError)
            toast.error(uploadError.message || "Failed to upload image")
            return
          }
        } else if (normalizedNewUrl && !normalizedNewUrl.includes("mihaipol-com.b-cdn.net")) {
          const validation = await validateImageUrl(normalizedNewUrl)
          if (!validation.valid) {
            toast.error(validation.error || "Image not supported or not accessible. Please check the URL or upload a file.")
            return
          }
          try {
            const formData = new FormData()
            formData.append("imageUrl", normalizedNewUrl)
            formData.append("folderPath", id === "new" ? "albums/temp" : `albums/${id}`)
            const uploadResponse = await fetch("/api/admin/upload", {
              method: "POST",
              body: formData,
            })
            if (!uploadResponse.ok) {
              const error = await uploadResponse.json()
              throw new Error(error.error || "Failed to upload image from URL")
            }
            const uploadData = await uploadResponse.json()
            finalImageUrl = uploadData.url
          } catch (uploadError: any) {
            console.error("Error uploading image from URL:", uploadError)
            toast.error(uploadError.message || "Failed to upload image from URL")
            return
          }
        } else if (normalizedNewUrl && normalizedNewUrl.includes("mihaipol-com.b-cdn.net")) {
          const validation = await validateImageUrl(normalizedNewUrl)
          if (!validation.valid) {
            toast.error(validation.error || "Image not supported or not accessible. Please check the URL or upload a file.")
            return
          }
        }

        if (!isNew && normalizedOldUrl && normalizedOldUrl.includes("mihaipol-com.b-cdn.net")) {
          try {
            await fetch("/api/admin/upload/trash", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageUrl: normalizedOldUrl }),
            })
          } catch (trashError) {
            console.error("Failed to move old image to trash:", trashError)
          }
        }
      }

      const labelIdRaw = (data.label_id || "").trim()
      const normalizedLabelId = labelIdRaw.length > 0 ? labelIdRaw : null

      const submitData = {
        ...data,
        release_date: data.release_date ? new Date(data.release_date).toISOString().split("T")[0] : null,
        // Normalize label_id: only send valid UUIDs, else null
        label_id: normalizedLabelId,
        cover_image_url: finalImageUrl,
        catalog_number: data.catalog_number || null,
        album_type: data.album_type || null,
        description: data.description || null,
      }
      // eslint-disable-next-line no-console
      console.log("[AlbumForm] submit - normalized payload:", submitData)

      if (isNew) {
        const response = await fetch("/api/admin/albums", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        })
        if (!response.ok) {
          let error
          try {
            error = await response.json()
          } catch {
            error = { error: "Unknown error", status: response.status }
          }
          // eslint-disable-next-line no-console
          console.error("[AlbumForm] create response not ok:", response.status, error)
          throw new Error(error.error || "Failed to create album")
        }
        const created = await response.json()
        // eslint-disable-next-line no-console
        console.log("[AlbumForm] created album:", created)
        if (finalImageUrl && finalImageUrl.includes("/albums/temp/") && created?.id) {
          try {
            const moveResponse = await fetch("/api/admin/upload/move", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageUrl: finalImageUrl,
                newFolderPath: `albums/${created.id}`,
              }),
            })
            // eslint-disable-next-line no-console
            console.log("[AlbumForm] move image response ok?:", moveResponse.ok, moveResponse.status)
            if (moveResponse.ok) {
              const moveData = await moveResponse.json()
              // eslint-disable-next-line no-console
              console.log("[AlbumForm] moved image data:", moveData)
              await fetch("/api/admin/albums", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: created.id, cover_image_url: moveData.url }),
              })
            }
          } catch (moveError) {
            console.error("Failed to move image from temp folder:", moveError)
          }
        }
        toast.success("Album created successfully")
        router.push("/admin/albums")
      } else {
        const response = await fetch("/api/admin/albums", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...submitData }),
        })
        if (!response.ok) {
          let error
          try {
            error = await response.json()
          } catch {
            error = { error: "Unknown error", status: response.status }
          }
          // eslint-disable-next-line no-console
          console.error("[AlbumForm] update response not ok:", response.status, error)
          throw new Error(error.error || "Failed to update album")
        }
        // eslint-disable-next-line no-console
        console.log("[AlbumForm] update success")
        toast.success("Album updated successfully")
        router.push("/admin/albums")
      }
    } catch (error) {
      console.error("Error saving album:", error)
      toast.error("Failed to save album")
    }
  }

  const handleAddLink = async (linkData: Omit<AlbumLink, "id" | "platforms">) => {
    try {
      await createAlbumLink({
        ...linkData,
        album_id: id,
      })
      toast.success("Link added successfully")
      loadLinks()
    } catch (error) {
      console.error("Error adding link:", error)
      toast.error("Failed to add link")
      throw error
    }
  }

  const handleUpdateLink = async (linkId: string, linkData: Partial<AlbumLink>) => {
    try {
      await updateAlbumLink(linkId, linkData)
      toast.success("Link updated successfully")
      loadLinks()
    } catch (error) {
      console.error("Error updating link:", error)
      toast.error("Failed to update link")
      throw error
    }
  }

  const handleDeleteLink = async (linkId: string) => {
    try {
      await deleteAlbumLink(linkId)
      toast.success("Link deleted successfully")
      loadLinks()
    } catch (error) {
      console.error("Error deleting link:", error)
      toast.error("Failed to delete link")
      throw error
    }
  }

  const titleValue = watch("title")
  useEffect(() => {
    if (titleValue && !isNew) {
      const slug = titleValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
      setValue("slug", slug)
    }
  }, [titleValue, setValue, isNew])

  const displayName = isNew ? undefined : (initialAlbum?.title || titleValue)

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-6">
        <AdminPageTitle 
          title={isNew ? "Create Album" : "Edit Album"} 
          entityName={displayName}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormField label="Title" required error={errors.title?.message}>
          <Input {...register("title")} placeholder="Album title" />
        </FormField>

        <FormField label="Slug" required error={errors.slug?.message}>
          <Input {...register("slug")} placeholder="album-slug" />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Catalog Number"
            error={errors.catalog_number?.message}
          >
            <Input
              {...register("catalog_number")}
              placeholder="Catalog number"
            />
          </FormField>

          <FormField label="Album Type" error={errors.album_type?.message}>
            <Input {...register("album_type")} placeholder="EP, LP, Single, etc." />
          </FormField>
        </div>

        <FormField label="Description" error={errors.description?.message}>
          <Textarea
            {...register("description")}
            placeholder="Album description"
            rows={4}
          />
        </FormField>

        <FormField
          label="Cover Image"
          error={errors.cover_image_url?.message}
        >
          <ImageUploadField
            value={watch("cover_image_url") || null}
            onChange={(url) => setValue("cover_image_url", url || "")}
            onFileChange={(file) => setSelectedFile(file)}
            folderPath={id === "new" ? "albums/temp" : `albums/${id}`}
            error={errors.cover_image_url?.message}
            placeholder="https://example.com/cover.jpg"
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Release Date"
            error={errors.release_date?.message}
          >
            <Input type="date" {...register("release_date")} />
          </FormField>

          <FormField label="Label" error={errors.label_id?.message}>
            {/* Controller-backed Select:
               - UI uses "none" sentinel; form state uses "" for none
               - We convert "" -> null right before submit
               - Avoid effects that override Controller state */}
            <Controller
              name="label_id"
              control={control}
              defaultValue={normalizedInitialLabelId}
              render={({ field }) => (
                <>
                  {(() => {
                    const currentId = (field.value as any)?.toString?.().trim?.() || ""
                    const hasCurrentInList =
                      !!currentId && labels.some((l) => l.id === currentId)
                    return (
            <Select
                        value={currentId || "none"}
                        onValueChange={(value) => {
                          const next = value === "none" ? "" : value
                          // eslint-disable-next-line no-console
                          console.log("[AlbumForm] onValueChange label_id:", next)
                          field.onChange(next)
                        }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select label (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {labels.map((label) => (
                  <SelectItem key={label.id} value={label.id}>
                    {label.name}
                  </SelectItem>
                ))}
                          {!hasCurrentInList && currentId && (
                            <SelectItem value={currentId}>
                              Unknown label
                            </SelectItem>
                          )}
              </SelectContent>
            </Select>
                    )
                  })()}
                </>
              )}
            />
          </FormField>
        </div>

        <FormField
          label="Publish Status"
          required
          error={errors.publish_status?.message}
        >
          {/* Controller-backed Select:
             - Always lowercases and validates allowed values
             - Initialized from server data via normalizedInitialStatus
             - No side effects that force "draft" after reset */}
          <Controller
            name="publish_status"
            control={control}
            defaultValue={normalizedInitialStatus as any}
            render={({ field }) => (
          <Select
                value={
                  (field.value as any)?.toString?.().trim?.().toLowerCase?.() ||
                  "draft"
                }
            onValueChange={(value) => {
              // eslint-disable-next-line no-console
              console.log("[AlbumForm] onValueChange publish_status:", value)
                  const v = (value as any)?.toString?.().trim?.().toLowerCase?.()
                  if (v && ["draft", "scheduled", "published", "archived"].includes(v)) {
                    field.onChange(v as "draft" | "scheduled" | "published" | "archived")
                  }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
            )}
          />
        </FormField>

        {!isNew && (
          <>
            <Separator />
            <AlbumLinksManager
              links={links}
              platforms={platforms}
              onAdd={handleAddLink}
              onUpdate={handleUpdateLink}
              onDelete={handleDeleteLink}
            />
          </>
        )}

        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/albums")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isNew ? "Create" : "Save"}
          </Button>
        </div>
      </form>
    </div>
  )
}

