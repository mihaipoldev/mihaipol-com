"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ShadowInput } from "@/components/admin/ShadowInput";

interface DatePickerProps {
  value?: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Convert YYYY-MM-DD string to Date object
  const date = value ? new Date(value + "T00:00:00") : undefined;

  // Handle date selection
  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Convert Date to YYYY-MM-DD format
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      onChange(`${year}-${month}-${day}`);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "relative w-full bg-transparent border-0 p-0 cursor-pointer overflow-hidden rounded-md",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <ShadowInput
            type="text"
            readOnly
            disabled={disabled}
            value={date ? format(date, "PPP") : ""}
            placeholder={placeholder}
            className={cn("cursor-pointer pr-10 w-full", className)}
          />
          <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-auto p-0 max-w-[calc(100vw-2rem)]",
          "!bg-background/50 backdrop-blur-md",
          "!shadow-[0px_1px_1px_0px_rgba(16,17,26,0.08)] dark:!shadow-[0px_1px_1px_0px_rgba(255,255,255,0.08)]"
        )}
        align="start"
        sideOffset={4}
        side="bottom"
        avoidCollisions={true}
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          defaultMonth={date}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
