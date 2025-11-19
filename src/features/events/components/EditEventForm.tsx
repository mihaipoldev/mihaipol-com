"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormField } from "@/components/admin/forms/FormField";
import { ImageUploadField } from "@/components/admin/forms/ImageUploadField";
import { AdminPageTitle } from "@/components/admin/AdminPageTitle";
import { ShadowInput } from "@/components/admin/ShadowInput";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ShadowSelect";
import { ShadowButton } from "@/components/admin/ShadowButton";
import { PublishStateSwitch } from "@/components/admin/PublishStateSwitch";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  venue: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  tickets_url: z.string().url().optional().or(z.literal("")),
  ticket_label: z.string().optional(),
  flyer_image_url: z.string().url().optional().or(z.literal("")),
  event_status: z.enum(["upcoming", "past", "cancelled"]),
  publish_status: z.enum(["draft", "scheduled", "published", "archived"]),
});

type EventFormData = z.infer<typeof eventSchema>;

type Event = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  venue: string | null;
  city: string | null;
  country: string | null;
  date: string;
  tickets_url: string | null;
  ticket_label: string | null;
  flyer_image_url: string | null;
  event_status: "upcoming" | "past" | "cancelled";
  publish_status: "draft" | "scheduled" | "published" | "archived";
};

type EditEventFormProps = {
  id: string;
  isNew: boolean;
  initialEvent: Event | null;
};

export function EditEventForm({ id, isNew, initialEvent }: EditEventFormProps) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
    control,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      slug: "",
      event_status: initialEvent?.event_status || "upcoming",
      publish_status: initialEvent?.publish_status || "draft",
      ticket_label: initialEvent?.ticket_label || "Tickets",
    },
  });

  // Populate form when initialEvent changes
  useEffect(() => {
    if (initialEvent && !isNew) {
      const formData: Partial<EventFormData> = {
        title: initialEvent.title || "",
        slug: initialEvent.slug || "",
        description: initialEvent.description || "",
        venue: initialEvent.venue || "",
        city: initialEvent.city || "",
        country: initialEvent.country || "",
        tickets_url: initialEvent.tickets_url || "",
        ticket_label: initialEvent.ticket_label || "Tickets",
        flyer_image_url: initialEvent.flyer_image_url || "",
        event_status: initialEvent.event_status || "upcoming",
        publish_status: initialEvent.publish_status || "draft",
      };

      if (initialEvent.date) {
        // Convert date string to YYYY-MM-DD format for date input
        const date = new Date(initialEvent.date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        formData.date = `${year}-${month}-${day}`;
      }

      reset(formData);
    }
  }, [initialEvent, isNew, reset]);

  const titleValue = watch("title");
  const slugValue = watch("slug");

  useEffect(() => {
    if (!titleValue) return;

    const autoSlug = titleValue
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const initialAutoSlug = initialEvent?.title
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (isNew || !slugValue || slugValue === initialAutoSlug) {
      setValue("slug", autoSlug, { shouldValidate: false });
    }
  }, [initialEvent?.title, isNew, setValue, slugValue, titleValue]);

  const validateImageUrl = async (url: string): Promise<{ valid: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/admin/upload/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });
      const data = await response.json();
      return { valid: data.valid || false, error: data.error };
    } catch (error: any) {
      return { valid: false, error: error.message || "Failed to validate image" };
    }
  };

  const onSubmit = async (data: EventFormData) => {
    try {
      const newImageUrl = data.flyer_image_url?.trim() || null;
      const oldImageUrl = initialEvent?.flyer_image_url || null;

      // Normalize both to null if empty for comparison
      const normalizedNewUrl = newImageUrl || null;
      const normalizedOldUrl = oldImageUrl || null;

      // Check if image URL has changed
      const imageUrlChanged = normalizedNewUrl !== normalizedOldUrl;

      let finalImageUrl = normalizedNewUrl;

      if (imageUrlChanged) {
        if (selectedFile) {
          try {
            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("folderPath", id === "new" ? "events/temp" : `events/${id}`);
            const uploadResponse = await fetch("/api/admin/upload", {
              method: "POST",
              body: formData,
            });
            if (!uploadResponse.ok) {
              const error = await uploadResponse.json();
              throw new Error(error.error || "Failed to upload image");
            }
            const uploadData = await uploadResponse.json();
            finalImageUrl = uploadData.url;
          } catch (uploadError: any) {
            console.error("Error uploading image:", uploadError);
            toast.error(uploadError.message || "Failed to upload image");
            return;
          }
        } else if (normalizedNewUrl && !normalizedNewUrl.includes("mihaipol-com.b-cdn.net")) {
          const validation = await validateImageUrl(normalizedNewUrl);
          if (!validation.valid) {
            toast.error(
              validation.error ||
                "Image not supported or not accessible. Please check the URL or upload a file."
            );
            return;
          }
          try {
            const formData = new FormData();
            formData.append("imageUrl", normalizedNewUrl);
            formData.append("folderPath", id === "new" ? "events/temp" : `events/${id}`);
            const uploadResponse = await fetch("/api/admin/upload", {
              method: "POST",
              body: formData,
            });
            if (!uploadResponse.ok) {
              const error = await uploadResponse.json();
              throw new Error(error.error || "Failed to upload image from URL");
            }
            const uploadData = await uploadResponse.json();
            finalImageUrl = uploadData.url;
          } catch (uploadError: any) {
            console.error("Error uploading image from URL:", uploadError);
            toast.error(uploadError.message || "Failed to upload image from URL");
            return;
          }
        } else if (normalizedNewUrl && normalizedNewUrl.includes("mihaipol-com.b-cdn.net")) {
          const validation = await validateImageUrl(normalizedNewUrl);
          if (!validation.valid) {
            toast.error(
              validation.error ||
                "Image not supported or not accessible. Please check the URL or upload a file."
            );
            return;
          }
        }

        // If URL changed and old image is from our CDN, move it to trash
        if (!isNew && normalizedOldUrl && normalizedOldUrl.includes("mihaipol-com.b-cdn.net")) {
          try {
            await fetch("/api/admin/upload/trash", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageUrl: normalizedOldUrl }),
            });
          } catch (trashError) {
            console.error("Failed to move old image to trash:", trashError);
          }
        }
      }

      const submitData = {
        ...data,
        date: data.date || null,
        tickets_url: data.tickets_url || null,
        flyer_image_url: finalImageUrl,
      };

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (isNew) {
        const response = await fetch("/api/admin/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(submitData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create event");
        }
        const created = await response.json();
        // If image is in temp folder, move it to the actual event folder
        if (finalImageUrl && finalImageUrl.includes("/events/temp/") && created?.id) {
          try {
            const moveResponse = await fetch("/api/admin/upload/move", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageUrl: finalImageUrl,
                newFolderPath: `events/${created.id}`,
              }),
            });
            if (moveResponse.ok) {
              const moveData = await moveResponse.json();
              await fetch("/api/admin/events", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: created.id, flyer_image_url: moveData.url }),
              });
            }
          } catch (moveError) {
            console.error("Failed to move image from temp folder:", moveError);
          }
        }
        toast.success("Event created successfully");
        router.push("/admin/events");
      } else {
        const response = await fetch("/api/admin/events", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ id, ...submitData }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update event");
        }

        toast.success("Event updated successfully");
        router.push("/admin/events");
      }
    } catch (error: any) {
      console.error("Error saving event:", error);
      toast.error(error.message || "Failed to save event");
    }
  };

  const displayName = isNew ? undefined : initialEvent?.title || titleValue;
  const normalizedInitialStatus = (() => {
    const s = (initialEvent?.publish_status as any)?.toString?.().trim?.().toLowerCase?.();
    return s === "scheduled" || s === "published" || s === "archived" ? s : "draft";
  })();

  return (
    <div className="w-full max-w-7xl relative">
      <div className="mb-10 relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />
        <div className="flex items-start justify-between gap-4">
          <AdminPageTitle
            title={isNew ? "Create Event" : "Edit Event"}
            entityName={displayName}
            description={
              isNew
                ? "Add a new event with venue, date, and ticket information."
                : "Update event details, venue information, and ticket links."
            }
          />
          {!isNew && (
            <div className="flex items-center pt-2 shrink-0">
              <Controller
                name="publish_status"
                control={control}
                defaultValue={normalizedInitialStatus as any}
                render={({ field }) => {
                  const isPublished =
                    (field.value as any)?.toString?.().trim?.().toLowerCase?.() === "published";
                  return (
                    <PublishStateSwitch
                      checked={isPublished}
                      onCheckedChange={(checked) => {
                        const newStatus = checked ? "published" : "draft";
                        field.onChange(newStatus);
                      }}
                    />
                  );
                }}
              />
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 relative">
        <Card className={cn("relative overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl group")}>
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />
          
          {/* Sparkle decorations */}
          <div className="absolute top-4 right-4 w-2 h-2 bg-primary/20 rounded-full blur-sm animate-pulse" />
          <div
            className="absolute top-12 right-12 w-1.5 h-1.5 bg-primary/30 rounded-full blur-sm animate-pulse"
            style={{ animationDelay: "300ms" }}
          />
          
          <div className="p-6 space-y-6 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Title" required error={errors.title?.message}>
                <ShadowInput {...register("title")} placeholder="Event title" />
              </FormField>

              <FormField label="Slug" required error={errors.slug?.message}>
                <ShadowInput {...register("slug")} placeholder="event-slug" />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField label="Venue" error={errors.venue?.message}>
                <ShadowInput {...register("venue")} placeholder="Venue name" />
              </FormField>

              <FormField label="City" error={errors.city?.message}>
                <ShadowInput {...register("city")} placeholder="City" />
              </FormField>

              <FormField label="Country" error={errors.country?.message}>
                <ShadowInput {...register("country")} placeholder="Country" />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Date" required error={errors.date?.message}>
                <ShadowInput type="date" {...register("date")} />
              </FormField>

              <FormField label="Event Status" required error={errors.event_status?.message}>
                <Select
                  value={watch("event_status") || initialEvent?.event_status || "upcoming"}
                  onValueChange={(value) =>
                    setValue("event_status", value as "upcoming" | "past" | "cancelled")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="past">Past</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Tickets URL" error={errors.tickets_url?.message}>
                <ShadowInput
                  type="url"
                  {...register("tickets_url")}
                  placeholder="https://example.com/tickets"
                />
              </FormField>

              <FormField label="Ticket Label" error={errors.ticket_label?.message}>
                <ShadowInput {...register("ticket_label")} placeholder="Tickets" />
              </FormField>
            </div>

            <FormField label="Description" error={errors.description?.message}>
              <Textarea {...register("description")} placeholder="Event description" rows={4} />
            </FormField>

            <FormField label="Flyer Image" error={errors.flyer_image_url?.message}>
              <ImageUploadField
                value={watch("flyer_image_url") || null}
                onChange={(url) => setValue("flyer_image_url", url || "")}
                onFileChange={(file) => setSelectedFile(file)}
                folderPath={id === "new" ? "events/temp" : `events/${id}`}
                error={errors.flyer_image_url?.message}
                placeholder="https://example.com/flyer.jpg"
              />
            </FormField>
          </div>
        </Card>

        <div className="flex gap-4 justify-end">
          <ShadowButton
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/events")}
          >
            Cancel
          </ShadowButton>
          <ShadowButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isNew ? "Create" : "Save"}
          </ShadowButton>
        </div>
      </form>
    </div>
  );
}
