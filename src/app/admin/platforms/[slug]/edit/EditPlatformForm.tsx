"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createPlatform, updatePlatform } from "@/features/platforms/mutations"
import { FormField } from "@/components/admin/forms/FormField"
import { ImageUploadField } from "@/components/admin/forms/ImageUploadField"
import { AdminPageTitle } from "@/components/admin/AdminPageTitle"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const platformSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  display_name: z.string().min(1, "Display name is required"),
  base_url: z.string().url().optional().or(z.literal("")),
  icon_url: z.string().url().optional().or(z.literal("")),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0),
})

type PlatformFormData = z.infer<typeof platformSchema>

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

type EditPlatformFormProps = {
  id: string
  isNew: boolean
  initialPlatform: Platform | null
}

export function EditPlatformForm({ id, isNew, initialPlatform }: EditPlatformFormProps) {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<PlatformFormData>({
    resolver: zodResolver(platformSchema),
    defaultValues: {
      is_active: true,
      sort_order: 0,
    },
  })

  useEffect(() => {
    if (initialPlatform && !isNew) {
      const formData: Partial<PlatformFormData> = {
        name: initialPlatform.name || "",
        slug: initialPlatform.slug || "",
        display_name: initialPlatform.display_name || "",
        base_url: initialPlatform.base_url || "",
        icon_url: initialPlatform.icon_url || "",
        is_active: initialPlatform.is_active ?? true,
        sort_order: initialPlatform.sort_order ?? 0,
      }
      reset(formData)
      setSelectedFile(null)
    }
  }, [initialPlatform, isNew, reset])

  const nameValue = watch("name")
  useEffect(() => {
    if (nameValue) {
      const slug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
      setValue("slug", slug)
    }
  }, [nameValue, setValue])

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

  const onSubmit = async (data: PlatformFormData) => {
    try {
      const newImageUrl = data.icon_url?.trim() || null
      const oldImageUrl = initialPlatform?.icon_url || null

      const normalizedNewUrl = newImageUrl || null
      const normalizedOldUrl = oldImageUrl || null
      const imageUrlChanged = normalizedNewUrl !== normalizedOldUrl

      let finalImageUrl = normalizedNewUrl

      if (imageUrlChanged) {
        if (selectedFile) {
          try {
            const formData = new FormData()
            formData.append("file", selectedFile)
            formData.append("folderPath", id === "new" ? "platforms/temp" : `platforms/${id}`)
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
            formData.append("folderPath", id === "new" ? "platforms/temp" : `platforms/${id}`)
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
        base_url: data.base_url || null,
        icon_url: finalImageUrl,
      }

      if (isNew) {
        const response = await fetch("/api/admin/platforms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        })
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to create platform")
        }
        const created = await response.json()
        if (finalImageUrl && finalImageUrl.includes("/platforms/temp/") && created?.id) {
          try {
            const moveResponse = await fetch("/api/admin/upload/move", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageUrl: finalImageUrl,
                newFolderPath: `platforms/${created.id}`,
              }),
            })
            if (moveResponse.ok) {
              const moveData = await moveResponse.json()
              await fetch("/api/admin/platforms", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: created.id, icon_url: moveData.url }),
              })
            }
          } catch (moveError) {
            console.error("Failed to move image from temp folder:", moveError)
          }
        }
        toast.success("Platform created successfully")
        router.push("/admin/platforms")
      } else {
        const response = await fetch("/api/admin/platforms", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...submitData }),
        })
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to update platform")
        }
        toast.success("Platform updated successfully")
        router.push("/admin/platforms")
      }
    } catch (error) {
      console.error("Error saving platform:", error)
      toast.error("Failed to save platform")
    }
  }

  const isActive = watch("is_active")
  const displayNameValue = watch("display_name")
  const displayName = isNew ? undefined : (initialPlatform?.display_name || displayNameValue)

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-6">
        <AdminPageTitle 
          title={isNew ? "Create Platform" : "Edit Platform"} 
          entityName={displayName}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormField label="Name" required error={errors.name?.message}>
          <Input {...register("name")} placeholder="Platform name (unique)" />
        </FormField>

        <FormField label="Slug" required error={errors.slug?.message}>
          <Input {...register("slug")} placeholder="platform-slug" />
        </FormField>

        <FormField
          label="Display Name"
          required
          error={errors.display_name?.message}
        >
          <Input
            {...register("display_name")}
            placeholder="Display name"
          />
        </FormField>

        <FormField label="Base URL" error={errors.base_url?.message}>
          <Input
            type="url"
            {...register("base_url")}
            placeholder="https://example.com"
          />
        </FormField>

        <FormField label="Icon Image" error={errors.icon_url?.message}>
          <ImageUploadField
            value={watch("icon_url") || null}
            onChange={(url) => setValue("icon_url", url || "")}
            onFileChange={(file) => setSelectedFile(file)}
            folderPath={id === "new" ? "platforms/temp" : `platforms/${id}`}
            error={errors.icon_url?.message}
            placeholder="https://example.com/icon.png"
          />
        </FormField>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_active"
            checked={isActive}
            onCheckedChange={(checked) =>
              setValue("is_active", checked === true)
            }
          />
          <Label
            htmlFor="is_active"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Is Active
          </Label>
        </div>

        <FormField label="Sort Order" required error={errors.sort_order?.message}>
          <Input
            type="number"
            {...register("sort_order", { valueAsNumber: true })}
            placeholder="0"
          />
        </FormField>

        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/platforms")}
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

