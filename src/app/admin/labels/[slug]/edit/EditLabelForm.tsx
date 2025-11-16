"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createLabel, updateLabel } from "@/features/labels/mutations"
import { FormField } from "@/components/admin/forms/FormField"
import { ImageUploadField } from "@/components/admin/forms/ImageUploadField"
import { AdminPageTitle } from "@/components/admin/AdminPageTitle"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const labelSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  website_url: z.string().url().optional().or(z.literal("")),
  logo_image_url: z.string().url().optional().or(z.literal("")),
})

type LabelFormData = z.infer<typeof labelSchema>

type Label = {
  id: string
  name: string
  slug: string
  description: string | null
  website_url: string | null
  logo_image_url: string | null
}

type EditLabelFormProps = {
  id: string
  isNew: boolean
  initialLabel: Label | null
}

export function EditLabelForm({ id, isNew, initialLabel }: EditLabelFormProps) {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<LabelFormData>({
    resolver: zodResolver(labelSchema),
  })

  useEffect(() => {
    if (initialLabel && !isNew) {
      const formData: Partial<LabelFormData> = {
        name: initialLabel.name || "",
        slug: initialLabel.slug || "",
        description: initialLabel.description || "",
        website_url: initialLabel.website_url || "",
        logo_image_url: initialLabel.logo_image_url || "",
      }
      reset(formData)
      setSelectedFile(null)
    }
  }, [initialLabel, isNew, reset])

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

  const onSubmit = async (data: LabelFormData) => {
    try {
      const newImageUrl = data.logo_image_url?.trim() || null
      const oldImageUrl = initialLabel?.logo_image_url || null

      const normalizedNewUrl = newImageUrl || null
      const normalizedOldUrl = oldImageUrl || null
      const imageUrlChanged = normalizedNewUrl !== normalizedOldUrl

      let finalImageUrl = normalizedNewUrl

      if (imageUrlChanged) {
        if (selectedFile) {
          try {
            const formData = new FormData()
            formData.append("file", selectedFile)
            formData.append("folderPath", id === "new" ? "labels/temp" : `labels/${id}`)

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
            formData.append("folderPath", id === "new" ? "labels/temp" : `labels/${id}`)
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
        website_url: data.website_url || null,
        logo_image_url: finalImageUrl,
        description: data.description || null,
      }

      if (isNew) {
        const response = await fetch("/api/admin/labels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        })
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to create label")
        }
        const created = await response.json()
        // Move from temp to permanent if needed
        if (finalImageUrl && finalImageUrl.includes("/labels/temp/") && created?.id) {
          try {
            const moveResponse = await fetch("/api/admin/upload/move", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageUrl: finalImageUrl,
                newFolderPath: `labels/${created.id}`,
              }),
            })
            if (moveResponse.ok) {
              const moveData = await moveResponse.json()
              await fetch("/api/admin/labels", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: created.id, logo_image_url: moveData.url }),
              })
            }
          } catch (moveError) {
            console.error("Failed to move image from temp folder:", moveError)
          }
        }
        toast.success("Label created successfully")
        router.push("/admin/labels")
      } else {
        const response = await fetch("/api/admin/labels", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...submitData }),
        })
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to update label")
        }
        toast.success("Label updated successfully")
        router.push("/admin/labels")
      }
    } catch (error) {
      console.error("Error saving label:", error)
      toast.error("Failed to save label")
    }
  }

  const nameValue = watch("name")
  useEffect(() => {
    if (nameValue && !isNew) {
      const slug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
      setValue("slug", slug)
    }
  }, [nameValue, setValue, isNew])

  const displayName = isNew ? undefined : (initialLabel?.name || nameValue)

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-6">
        <AdminPageTitle 
          title={isNew ? "Create Label" : "Edit Label"} 
          entityName={displayName}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormField label="Name" required error={errors.name?.message}>
          <Input {...register("name")} placeholder="Label name" />
        </FormField>

        <FormField label="Slug" required error={errors.slug?.message}>
          <Input {...register("slug")} placeholder="label-slug" />
        </FormField>

        <FormField label="Description" error={errors.description?.message}>
          <Textarea
            {...register("description")}
            placeholder="Label description"
            rows={4}
          />
        </FormField>

        <FormField label="Website URL" error={errors.website_url?.message}>
          <Input
            type="url"
            {...register("website_url")}
            placeholder="https://example.com"
          />
        </FormField>

        <FormField
          label="Logo Image"
          error={errors.logo_image_url?.message}
        >
          <ImageUploadField
            value={watch("logo_image_url") || null}
            onChange={(url) => setValue("logo_image_url", url || "")}
            onFileChange={(file) => setSelectedFile(file)}
            folderPath={id === "new" ? "labels/temp" : `labels/${id}`}
            error={errors.logo_image_url?.message}
            placeholder="https://example.com/logo.jpg"
          />
        </FormField>

        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/labels")}
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

