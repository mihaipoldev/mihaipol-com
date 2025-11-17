import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const shadowClasses =
  "!shadow-[0px_1px_1px_0px_rgba(16,17,26,0.08)] dark:!shadow-[0px_1px_1px_0px_rgba(255,255,255,0.08)] hover:!shadow-[0px_1px_1px_0px_rgba(16,17,26,0.16)] dark:hover:!shadow-[0px_1px_1px_0px_rgba(255,255,255,0.12)]";

export const ShadowTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return <Textarea ref={ref} className={cn(shadowClasses, className)} {...props} />;
});
ShadowTextarea.displayName = "ShadowTextarea";
