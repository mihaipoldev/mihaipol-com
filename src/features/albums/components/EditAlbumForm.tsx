"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  createAlbum,
  updateAlbum,
  batchUpdateAlbumLinks,
} from "@/features/albums/mutations"
import { FormField } from "@/components/admin/forms/FormField"
import { ImageUploadField } from "@/components/admin/forms/ImageUploadField"
import { AdminPageTitle } from "@/components/admin/AdminPageTitle"
import { ShadowInput } from "@/components/admin/ShadowInput"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ShadowSelect"
import { ShadowButton } from "@/components/admin/ShadowButton"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { PublishStateSwitch } from "@/components/admin/PublishStateSwitch"
import { supabase } from "@/lib/supabase"
import { AlbumSmartLinksManager } from "@/features/smart-links/components/AlbumSmartLinksManager"
import { PhonePreview } from "@/components/admin/PhonePreview"
import type { Album, AlbumLink, Label, Platform } from "@/features/albums/types"

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
  const [linkValidationErrors, setLinkValidationErrors] = useState<Record<string, { platform?: string; url?: string }>>({})
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

  const validateLinks = (): boolean => {
    // If there are no links, validation passes
    if (links.length === 0) {
      setLinkValidationErrors({})
      return true
    }

    const errors: Record<string, { platform?: string; url?: string }> = {}
    let hasErrors = false

    links.forEach((link) => {
      const linkErrors: { platform?: string; url?: string } = {}
      
      if (!link.platform_id) {
        linkErrors.platform = "Platform is required"
        hasErrors = true
      }
      
      if (!link.url || link.url.trim() === "") {
        linkErrors.url = "URL is required"
        hasErrors = true
      }

      if (Object.keys(linkErrors).length > 0) {
        errors[link.id] = linkErrors
      }
    })

    setLinkValidationErrors(errors)
    return !hasErrors
  }

  const onSubmit = async (data: AlbumFormData) => {
    try {
      // Validate links before submitting
      if (!validateLinks()) {
        toast.error("Please fix the errors in the links section before saving")
        return
      }

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
      // eslint-disable-next-line no-console
      console.log("[AlbumForm] submit - id:", id, "isNew:", isNew, "initialAlbum?.id:", initialAlbum?.id)

      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token

      if (isNew) {
        const response = await fetch("/api/admin/albums", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
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
        
        // Save links for new album
        if (created?.id && links.length > 0) {
          try {
            await batchUpdateAlbumLinks(
              created.id,
              links.map((link) => ({
                id: link.id.startsWith("temp-") ? undefined : link.id,
                platform_id: link.platform_id,
                url: link.url,
                cta_label: link.cta_label,
                link_type: link.link_type,
                sort_order: link.sort_order,
              }))
            )
          } catch (linkError) {
            console.error("Error saving links:", linkError)
            toast.error("Album created but failed to save links")
          }
        }
        
        router.push("/admin/albums")
      } else {
        // Use initialAlbum.id if available, otherwise use id prop
        const albumId = initialAlbum?.id || id
        // eslint-disable-next-line no-console
        console.log("[AlbumForm] PUT request - using albumId:", albumId)
        
        const response = await fetch("/api/admin/albums", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ id: albumId, ...submitData }),
        })
        if (!response.ok) {
          let error
          try {
            error = await response.json()
            // eslint-disable-next-line no-console
            console.error("[AlbumForm] update response error details:", JSON.stringify(error.details, null, 2))
            // eslint-disable-next-line no-console
            console.error("[AlbumForm] field errors:", error.details?.fieldErrors)
          } catch {
            error = { error: "Unknown error", status: response.status }
          }
          // eslint-disable-next-line no-console
          console.error("[AlbumForm] update response not ok:", response.status, error)
          throw new Error(error.error || "Failed to update album")
        }
        // eslint-disable-next-line no-console
        console.log("[AlbumForm] update success")
        
        // Save links for existing album
        if (links.length > 0 || initialLinks.length > 0) {
          try {
            await batchUpdateAlbumLinks(
              albumId,
              links.map((link) => ({
                id: link.id.startsWith("temp-") ? undefined : link.id,
                platform_id: link.platform_id,
                url: link.url,
                cta_label: link.cta_label,
                link_type: link.link_type,
                sort_order: link.sort_order,
              }))
            )
          } catch (linkError) {
            console.error("Error saving links:", linkError)
            toast.error("Album updated but failed to save links")
          }
        }
        
        toast.success("Album updated successfully")
        router.push("/admin/albums")
      }
    } catch (error) {
      console.error("Error saving album:", error)
      toast.error("Failed to save album")
    }
  }

  const handleLinksChange = (updatedLinks: AlbumLink[]) => {
    setLinks(updatedLinks)
    // Clear validation errors when links change
    setLinkValidationErrors({})
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
    <div className="w-full max-w-7xl relative">
      <div className="mb-10 relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />
        <div className="flex items-start justify-between gap-4">
        <AdminPageTitle 
          title={isNew ? "Create Album" : "Edit Album"} 
          entityName={displayName}
          description={isNew ? "Add a new music album with tracks, metadata, and release information." : "Update album details, tracks, and release information."}
        />
          {!isNew && (
            <div className="flex items-center pt-2 shrink-0">
              <Controller
                name="publish_status"
                control={control}
                defaultValue={normalizedInitialStatus as any}
                render={({ field }) => {
                  const isPublished = (field.value as any)?.toString?.().trim?.().toLowerCase?.() === "published"
                  return (
                    <PublishStateSwitch
                      checked={isPublished}
                      onCheckedChange={(checked) => {
                        const newStatus = checked ? "published" : "draft"
              // eslint-disable-next-line no-console
                        console.log("[AlbumForm] switch publish_status:", newStatus)
                        field.onChange(newStatus)
                      }}
                    />
                  )
                }}
          />
            </div>
          )}
          </div>
        </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 relative">
        {/* Details & Links Section with Tabs */}
        <div className="relative rounded-xl border border-border/30 overflow-hidden bg-gradient-to-br from-card/30 to-transparent backdrop-blur-sm">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid grid-cols-2 w-full bg-transparent p-0 gap-0 h-auto border-b border-border/30 rounded-none">
              <TabsTrigger 
                value="details" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-12 font-medium"
              >
                Details
              </TabsTrigger>
              <TabsTrigger 
                value="links" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-12 font-medium"
                disabled={isNew}
              >
                Links
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-0 p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField label="Title" required error={errors.title?.message}>
                    <ShadowInput {...register("title")} placeholder="Album title" />
                  </FormField>

                  <FormField label="Slug" required error={errors.slug?.message}>
                    <ShadowInput {...register("slug")} placeholder="album-slug" />
                  </FormField>
                </div>

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    label="Catalog Number"
                    error={errors.catalog_number?.message}
                  >
                    <ShadowInput
                      {...register("catalog_number")}
                      placeholder="Catalog number"
                    />
                  </FormField>

                  <FormField label="Album Type" error={errors.album_type?.message}>
                    <ShadowInput {...register("album_type")} placeholder="EP, LP, Single, etc." />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    label="Release Date"
                    error={errors.release_date?.message}
                  >
                    <ShadowInput type="date" {...register("release_date")} />
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
                            const currentId = field.value || ""
                            const hasCurrentInList = labels.some((l) => l.id === currentId)
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

                <FormField label="Description" error={errors.description?.message}>
                  <Textarea
                    {...register("description")}
                    placeholder="Album description"
                    rows={4}
                  />
                </FormField>
              </div>
            </TabsContent>

            <TabsContent value="links" className="mt-0 p-6">
              {!isNew ? (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Left column: Links Manager */}
                  <div className="lg:col-span-3">
                <AlbumSmartLinksManager
                  links={links}
                  platforms={platforms}
                  onChange={handleLinksChange}
                  validationErrors={linkValidationErrors}
                />
                  </div>

                  {/* Right column: Mobile Preview */}
                  <PhonePreview album={initialAlbum} links={links} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Save the album first to add links.</p>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex gap-4 justify-end">
          <ShadowButton
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/albums")}
          >
            Cancel
          </ShadowButton>
          <ShadowButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isNew ? "Create" : "Save"}
          </ShadowButton>
        </div>
      </form>
    </div>
  )
}


