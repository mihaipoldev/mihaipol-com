"use client";

import { Controller, Control } from "react-hook-form";
import { PublishStateSwitch } from "@/components/admin/PublishStateSwitch";
import { cn } from "@/lib/utils";

type PublishStatusControlProps = {
  control: Control<any>;
  defaultValue?: string;
  className?: string;
  onStatusChange?: (status: "draft" | "published") => void;
};

/**
 * A reusable component for controlling publish status with a switch.
 * Includes the Controller wrapper and styling, making it easy to move around.
 */
export function PublishStatusControl({
  control,
  defaultValue = "draft",
  className,
  onStatusChange,
}: PublishStatusControlProps) {
  return (
    <div className={cn("flex items-center pt-2 shrink-0", className)}>
      <Controller
        name="publish_status"
        control={control}
        defaultValue={defaultValue}
        render={({ field }) => {
          const isPublished =
            (field.value as any)?.toString?.().trim?.().toLowerCase?.() === "published";
          return (
            <PublishStateSwitch
              checked={isPublished}
              onCheckedChange={(checked) => {
                const newStatus = checked ? "published" : "draft";
                field.onChange(newStatus);
                onStatusChange?.(newStatus);
              }}
            />
          );
        }}
      />
    </div>
  );
}
