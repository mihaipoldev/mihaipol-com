"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ModalShell } from "@/components/ui/modal-shell";
import { DialogFooter } from "@/components/ui/dialog";
import { FormField } from "@/components/admin/forms/FormField";
import { ImageUploadField } from "@/components/admin/forms/ImageUploadField";
import { ShadowInput } from "@/components/admin/forms/ShadowInput";
import { ShadowButton } from "@/components/admin/forms/ShadowButton";
import { DatePicker } from "@/components/admin/forms/DatePicker";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/forms/AdminSelect";
import { Loader2 } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

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

type EditEventModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null; // null for creating new event
  onSuccess?: () => void;
};

export function EditEventModal({
  open,
  onOpenChange,
  event: initialEvent,
  onSuccess,
}: EditEventModalProps) {
  const isNew = !initialEvent;
  const [isLoading, setIsLoading] = useState(false);
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
      event_status: "upcoming",
      publish_status: "draft",
      ticket_label: "Tickets",
    },
  });

  // Initialize form when modal opens
  useEffect(() => {
    if (open) {
      if (initialEvent) {
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
          const date = new Date(initialEvent.date);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          formData.date = `${year}-${month}-${day}`;
        }

        reset(formData, { keepDefaultValues: false });
      } else {
        reset({
          title: "",
          slug: "",
          description: "",
          venue: "",
          city: "",
          country: "",
          date: "",
          tickets_url: "",
          ticket_label: "Tickets",
          flyer_image_url: "",
          event_status: "upcoming",
          publish_status: "draft",
        });
      }
    }
  }, [open, initialEvent, reset]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset();
      setSelectedFile(null);
    }
  }, [open, reset]);

  // Auto-generate slug from title
  const titleValue = watch("title");
  const slugValue = watch("slug");
  useEffect(() => {
    if (open && titleValue && (isNew || !slugValue || slugValue === "")) {
      const autoSlug = titleValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      if (autoSlug !== slugValue) {
        setValue("slug", autoSlug, { shouldValidate: false });
      }
    }
  }, [titleValue, setValue, isNew, slugValue, open]);

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

      const normalizedNewUrl = newImageUrl || null;
      const normalizedOldUrl = oldImageUrl || null;
      const imageUrlChanged = normalizedNewUrl !== normalizedOldUrl;

      let finalImageUrl = normalizedNewUrl;

      if (imageUrlChanged) {
        if (selectedFile) {
          try {
            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("folderPath", isNew ? "events/temp" : `events/${initialEvent.id}`);
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
            formData.append("folderPath", isNew ? "events/temp" : `events/${initialEvent.id}`);
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

      let result;
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
        result = await response.json();

        // If image is in temp folder, move it to the actual event folder
        if (finalImageUrl && finalImageUrl.includes("/events/temp/") && result?.id) {
          try {
            const moveResponse = await fetch("/api/admin/upload/move", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageUrl: finalImageUrl,
                newFolderPath: `events/${result.id}`,
              }),
            });
            if (moveResponse.ok) {
              const moveData = await moveResponse.json();
              await fetch("/api/admin/events", {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({ id: result.id, flyer_image_url: moveData.url }),
              });
            }
          } catch (moveError) {
            console.error("Failed to move image from temp folder:", moveError);
          }
        }

        toast.success("Event created successfully");
      } else {
        const response = await fetch("/api/admin/events", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ id: initialEvent.id, ...submitData }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update event");
        }

        result = await response.json();
        toast.success("Event updated successfully");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error(`Error ${isNew ? "creating" : "updating"} event:`, error);
      toast.error(error.message || `Failed to ${isNew ? "create" : "update"} event`);
    }
  };

  if (isLoading) {
    return (
      <ModalShell
        open={open}
        onOpenChange={onOpenChange}
        title={initialEvent?.title || "Edit Event"}
        maxWidth="4xl"
        maxHeight="90vh"
        showScroll={true}
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={watch("title") || initialEvent?.title || (isNew ? "Create New Event" : "Edit Event")}
      titleIcon={(watch("flyer_image_url") || initialEvent?.flyer_image_url) || <FontAwesomeIcon icon={faCalendar} className="w-5 h-5 md:w-6 md:h-6" />}
      footer={
        <DialogFooter>
          <ShadowButton type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </ShadowButton>
          <ShadowButton type="submit" form="event-form" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              isNew ? "Create Event" : "Save Changes"
            )}
          </ShadowButton>
        </DialogFooter>
      }
      maxWidth="4xl"
      maxHeight="90vh"
      showScroll={true}
    >
      <form id="event-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <FormField label="Title" required error={errors.title?.message}>
            <ShadowInput {...register("title")} placeholder="Event title" />
          </FormField>

          <FormField label="Slug" required error={errors.slug?.message}>
            <ShadowInput {...register("slug")} placeholder="event-slug" />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <FormField label="Date" required error={errors.date?.message}>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select event date"
                />
              )}
            />
          </FormField>

          <FormField label="Event Status" required error={errors.event_status?.message}>
            <Select
              value={watch("event_status") || "upcoming"}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
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
            folderPath={isNew ? "events/temp" : `events/${initialEvent.id}`}
            error={errors.flyer_image_url?.message}
            placeholder="https://example.com/flyer.jpg"
          />
        </FormField>

        <FormField label="Publish Status" required error={errors.publish_status?.message}>
          <Select
            value={watch("publish_status") || "draft"}
            onValueChange={(value) =>
              setValue("publish_status", value as "draft" | "scheduled" | "published" | "archived")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select publish status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

      </form>
    </ModalShell>
  );
}
