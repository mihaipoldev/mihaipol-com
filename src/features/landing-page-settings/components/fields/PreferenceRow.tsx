import { Label } from "@/components/ui/label";
import { ReactNode } from "react";

interface PreferenceRowProps {
  label: string;
  description?: string;
  keyName: string;
  children: ReactNode;
}

export function PreferenceRow({ label, description, keyName, children }: PreferenceRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
      <div className="flex-1">
        <Label htmlFor={keyName} className="text-sm font-medium">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{keyName}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {children}
      </div>
    </div>
  );
}
