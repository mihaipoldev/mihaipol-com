"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { FormField } from "@/components/admin/forms/FormField"
import { ImageUploadField } from "@/components/admin/forms/ImageUploadField"
import { AdminPageTitle } from "@/components/admin/AdminPageTitle"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const artistSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  bio: z.string().optional(),
  profile_image_url: z.string().url().optional().or(z.literal("")),
  city: z.string().optional(),
  country: z.string().optional(),
})

type ArtistFormData = z.infer<typeof artistSchema>

type Artist = {
  id: string
  name: string
  slug: string
  bio: string | null
  profile_image_url: string | null
  city: string | null
  country: string | null
}

type EditArtistFormProps = {
  id: string
  isNew: boolean
  initialArtist: Artist | null
}

export function EditArtistForm({ id, isNew, initialArtist }: EditArtistFormProps) {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<ArtistFormData>({
    resolver: zodResolver(artistSchema),
  })

  // Populate form when initialArtist changes
  useEffect(() => {
    if (initialArtist && !isNew) {
      const formData: Partial<ArtistFormData> = {
        name: initialArtist.name || "",
        slug: initialArtist.slug || "",
        bio: initialArtist.bio || "",
        profile_image_url: initialArtist.profile_image_url || "",
        city: initialArtist.city || "",
        country: initialArtist.country || "",
      }
      reset(formData)
      setSelectedFile(null) // Clear selected file when form is reset
    }
  }, [initialArtist, isNew, reset])

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

  const onSubmit = async (data: ArtistFormData) => {
    try {
      const newImageUrl = data.profile_image_url?.trim() || null
      const oldImageUrl = initialArtist?.profile_image_url || null

      // Normalize both to null if empty for comparison
      const normalizedNewUrl = newImageUrl || null
      const normalizedOldUrl = oldImageUrl || null

      // Check if image URL has changed
      const imageUrlChanged = normalizedNewUrl !== normalizedOldUrl

      let finalImageUrl = normalizedNewUrl

      // If URL changed, handle upload and trash
      if (imageUrlChanged) {
        // If there's a selected file, upload it to Bunny
        if (selectedFile) {
          try {
            const formData = new FormData()
            formData.append("file", selectedFile)
            formData.append("folderPath", id === "new" ? "artists/temp" : `artists/${id}`)

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
            return // Don't proceed with save if upload fails
          }
        }
        // If URL is provided and it's not from our CDN, validate and upload it to Bunny
        else if (normalizedNewUrl && !normalizedNewUrl.includes("mihaipol-com.b-cdn.net")) {
          // Validate that the image URL is accessible and is a valid image
          const validation = await validateImageUrl(normalizedNewUrl)
          if (!validation.valid) {
            toast.error(validation.error || "Image not supported or not accessible. Please check the URL or upload a file.")
            setValue("profile_image_url", oldImageUrl || "", { shouldValidate: false })
            return
          }

          try {
            const formData = new FormData()
            formData.append("imageUrl", normalizedNewUrl)
            formData.append("folderPath", id === "new" ? "artists/temp" : `artists/${id}`)

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
            return // Don't proceed with save if upload fails
          }
        }
        // If URL is from our CDN, validate it's accessible and is a valid image
        else if (normalizedNewUrl && normalizedNewUrl.includes("mihaipol-com.b-cdn.net")) {
          const validation = await validateImageUrl(normalizedNewUrl)
          if (!validation.valid) {
            toast.error(validation.error || "Image not supported or not accessible. Please check the URL or upload a file.")
            setValue("profile_image_url", oldImageUrl || "", { shouldValidate: false })
            return
          }
        }

        // Move old image to trash if it's from our CDN
        if (!isNew && normalizedOldUrl && normalizedOldUrl.includes("mihaipol-com.b-cdn.net")) {
          try {
            await fetch("/api/admin/upload/trash", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageUrl: normalizedOldUrl }),
            })
          } catch (trashError) {
            console.error("Failed to move old image to trash:", trashError)
            // Don't fail the save if trash fails
          }
        }
      }

      const submitData = {
        ...data,
        profile_image_url: finalImageUrl,
        bio: data.bio || null,
        city: data.city || null,
        country: data.country || null,
      }

      if (isNew) {
        const response = await fetch("/api/admin/artists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to create artist")
        }
        
        const createdArtist = await response.json()
        
        // If image is in temp folder, move it to the actual artist folder
        if (finalImageUrl && finalImageUrl.includes("/artists/temp/")) {
          try {
            const moveResponse = await fetch("/api/admin/upload/move", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageUrl: finalImageUrl,
                newFolderPath: `artists/${createdArtist.id}`,
              }),
            })
            
            if (moveResponse.ok) {
              const moveData = await moveResponse.json()
              // Update the artist with the new image URL
              await fetch("/api/admin/artists", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: createdArtist.id,
                  profile_image_url: moveData.url,
                }),
              })
            }
          } catch (moveError) {
            console.error("Failed to move image from temp folder:", moveError)
            // Don't fail the artist creation if image move fails
          }
        }
        
        toast.success("Artist created successfully")
        router.push("/admin/artists")
      } else {
        const response = await fetch("/api/admin/artists", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...submitData }),
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to update artist")
        }
        
        toast.success("Artist updated successfully")
        router.push("/admin/artists")
      }
    } catch (error: any) {
      console.error("Error saving artist:", error)
      toast.error(error.message || "Failed to save artist")
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

  const displayName = isNew ? undefined : (initialArtist?.name || nameValue)

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-6">
        <AdminPageTitle 
          title={isNew ? "Create Artist" : "Edit Artist"} 
          entityName={displayName}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormField label="Name" required error={errors.name?.message}>
          <Input {...register("name")} placeholder="Artist name" />
        </FormField>

        <FormField label="Slug" required error={errors.slug?.message}>
          <Input {...register("slug")} placeholder="artist-slug" />
        </FormField>

        <FormField label="Bio" error={errors.bio?.message}>
          <Textarea
            {...register("bio")}
            placeholder="Artist biography"
            rows={6}
          />
        </FormField>

        <FormField
          label="Profile Image"
          error={errors.profile_image_url?.message}
        >
          <ImageUploadField
            value={watch("profile_image_url") || null}
            onChange={(url) => setValue("profile_image_url", url || "")}
            onFileChange={(file) => setSelectedFile(file)}
            folderPath={id === "new" ? "artists/temp" : `artists/${id}`}
            error={errors.profile_image_url?.message}
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="City" error={errors.city?.message}>
            <Input {...register("city")} placeholder="City" />
          </FormField>

          <FormField label="Country" error={errors.country?.message}>
            <Input {...register("country")} placeholder="Country" />
          </FormField>
        </div>

        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/artists")}
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

