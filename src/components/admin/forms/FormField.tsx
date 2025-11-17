"use client";

import { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  label?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
};

export function FormField({ label, required, error, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
