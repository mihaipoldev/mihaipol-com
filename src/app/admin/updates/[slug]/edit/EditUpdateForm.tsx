"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createUpdate, updateUpdate } from "@/features/updates/mutations"
import { FormField } from "@/components/admin/forms/FormField"
import { ImageUploadField } from "@/components/admin/forms/ImageUploadField"
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
import { toast } from "sonner"

const updateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal("")),
  date: z.string().optional(),
  publish_status: z.enum(["draft", "scheduled", "published", "archived"]),
  read_more_url: z.string().url().optional().or(z.literal("")),
})

type UpdateFormData = z.infer<typeof updateSchema>

type Update = {
  id: string
  title: string
  slug: string
  subtitle: string | null
  description: string | null
  image_url: string | null
  date: string | null
  publish_status: "draft" | "scheduled" | "published" | "archived"
  read_more_url: string | null
}

type EditUpdateFormProps = {
  id: string
  isNew: boolean
  initialUpdate: Update | null
}

export function EditUpdateForm({ id, isNew, initialUpdate }: EditUpdateFormProps) {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const normalizedInitialStatus = (() => {
    const s = (initialUpdate?.publish_status as any)?.toString?.().trim?.().toLowerCase?.()
    return s === "scheduled" || s === "published" || s === "archived" ? s : "draft"
  })()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
    control,
  } = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      title: "",
      slug: "",
      subtitle: "",
      description: "",
      image_url: "",
      date: "",
      publish_status: "draft",
      read_more_url: "",
    },
  })

  useEffect(() => {
    if (initialUpdate && !isNew) {
      const normalizeStatus = (v: unknown) => {
        const s = (v as any)?.toString?.().trim?.().toLowerCase?.()
        return s === "scheduled" || s === "published" || s === "archived" ? s : "draft"
      }
      const formData: Partial<UpdateFormData> = {
        title: initialUpdate.title || "",
        slug: initialUpdate.slug || "",
        subtitle: initialUpdate.subtitle || "",
        description: initialUpdate.description || "",
        image_url: initialUpdate.image_url || "",
        read_more_url: initialUpdate.read_more_url || "",
        publish_status: normalizeStatus(initialUpdate.publish_status),
      }

      if (initialUpdate.date) {
        const date = new Date(initialUpdate.date)
        const localDateTime = new Date(
          date.getTime() - date.getTimezoneOffset() * 60000
        )
          .toISOString()
          .slice(0, 16)
        formData.date = localDateTime
      }

      // eslint-disable-next-line no-console
      console.log("[UpdateForm] reset with initial publish_status:", formData.publish_status)

      reset(formData)
      // Align controller-backed select immediately after reset to avoid transient empty value
      setValue("publish_status", formData.publish_status as any, { shouldValidate: true })
      setSelectedFile(null)
    }
  }, [initialUpdate, isNew, reset])

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

  const onSubmit = async (data: UpdateFormData) => {
    try {
      const newImageUrl = data.image_url?.trim() || null
      const oldImageUrl = initialUpdate?.image_url || null

      const normalizedNewUrl = newImageUrl || null
      const normalizedOldUrl = oldImageUrl || null
      const imageUrlChanged = normalizedNewUrl !== normalizedOldUrl

      let finalImageUrl = normalizedNewUrl

      if (imageUrlChanged) {
        if (selectedFile) {
          try {
            const formData = new FormData()
            formData.append("file", selectedFile)
            formData.append("folderPath", id === "new" ? "updates/temp" : `updates/${id}`)
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
            formData.append("folderPath", id === "new" ? "updates/temp" : `updates/${id}`)
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

      const submitData = {
        ...data,
        date: data.date ? new Date(data.date).toISOString() : null,
        image_url: finalImageUrl,
        read_more_url: data.read_more_url || null,
        subtitle: data.subtitle || null,
        description: data.description || null,
      }

      if (isNew) {
        const response = await fetch("/api/admin/updates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        })
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to create update")
        }
        const created = await response.json()
        if (finalImageUrl && finalImageUrl.includes("/updates/temp/") && created?.id) {
          try {
            const moveResponse = await fetch("/api/admin/upload/move", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageUrl: finalImageUrl,
                newFolderPath: `updates/${created.id}`,
              }),
            })
            if (moveResponse.ok) {
              const moveData = await moveResponse.json()
              await fetch("/api/admin/updates", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: created.id, image_url: moveData.url }),
              })
            }
          } catch (moveError) {
            console.error("Failed to move image from temp folder:", moveError)
          }
        }
        toast.success("Update created successfully")
        router.push("/admin/updates")
      } else {
        const response = await fetch("/api/admin/updates", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...submitData }),
        })
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to update update")
        }
        toast.success("Update updated successfully")
        router.push("/admin/updates")
      }
    } catch (error) {
      console.error("Error saving update:", error)
      toast.error("Failed to save update")
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

  const displayName = isNew ? undefined : (initialUpdate?.title || titleValue)

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-6">
        <AdminPageTitle 
          title={isNew ? "Create Update" : "Edit Update"} 
          entityName={displayName}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormField label="Title" required error={errors.title?.message}>
          <Input {...register("title")} placeholder="Update title" />
        </FormField>

        <FormField label="Slug" required error={errors.slug?.message}>
          <Input {...register("slug")} placeholder="update-slug" />
        </FormField>

        <FormField label="Subtitle" error={errors.subtitle?.message}>
          <Input {...register("subtitle")} placeholder="Update subtitle" />
        </FormField>

        <FormField label="Description" error={errors.description?.message}>
          <Textarea
            {...register("description")}
            placeholder="Update description"
            rows={6}
          />
        </FormField>

        <FormField label="Image" error={errors.image_url?.message}>
          <ImageUploadField
            value={watch("image_url") || null}
            onChange={(url) => setValue("image_url", url || "")}
            onFileChange={(file) => setSelectedFile(file)}
            folderPath={id === "new" ? "updates/temp" : `updates/${id}`}
            error={errors.image_url?.message}
            placeholder="https://example.com/image.jpg"
          />
        </FormField>

        <FormField label="Date" error={errors.date?.message}>
          <Input
            type="datetime-local"
            {...register("date")}
          />
        </FormField>

        <FormField label="Read More URL" error={errors.read_more_url?.message}>
          <Input
            type="url"
            {...register("read_more_url")}
            placeholder="https://example.com/read-more"
          />
        </FormField>

        <FormField
          label="Publish Status"
          required
          error={errors.publish_status?.message}
        >
          {/* Controller syncs RHF state with Radix Select; reset() sets initial value */}
          <Controller
            name="publish_status"
            control={control}
            defaultValue={normalizedInitialStatus as any}
            render={({ field }) => {
              const normalizedValue = (field.value as any)?.toString?.().trim?.().toLowerCase?.() || "draft"
              // eslint-disable-next-line no-console
              console.log("[UpdateForm] Controller render - field.value:", field.value, "normalized:", normalizedValue)
              return (
                <Select
                  value={normalizedValue}
                  onValueChange={(value) => {
                    // eslint-disable-next-line no-console
                    console.log("[UpdateForm] onValueChange publish_status:", value)
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
              )
            }}
          />
        </FormField>

        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/updates")}
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

