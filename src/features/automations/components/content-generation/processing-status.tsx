"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProcessingState, ProcessingStep } from "../../types";

type ProcessingStatusProps = {
  state: ProcessingState;
  steps?: ProcessingStep[];
  progress?: number;
  error?: string;
};

const DEFAULT_STEPS: ProcessingStep[] = [
  { id: "trim", label: "Trimming black background", status: "pending" },
  { id: "resize", label: "Resizing to 1000px height", status: "pending" },
  { id: "composite", label: "Centering on 1920x1080 canvas", status: "pending" },
];

export function ProcessingStatus({
  state,
  steps = DEFAULT_STEPS,
  progress,
  error,
}: ProcessingStatusProps) {
  if (state === "idle") {
    return null;
  }

  const getStepStatus = (stepId: string): ProcessingStep["status"] => {
    const step = steps.find((s) => s.id === stepId);
    return step?.status || "pending";
  };

  const activeStepIndex = steps.findIndex((s) => s.status === "processing");
  const completedSteps = steps.filter((s) => s.status === "completed").length;

  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-4">
        {state === "processing" && (
          <>
            <div className="space-y-2">
              {steps.map((step, index) => {
                const stepStatus = getStepStatus(step.id);
                const isActive = stepStatus === "processing";
                const isCompleted = stepStatus === "completed";
                const isPending = stepStatus === "pending";

                return (
                  <div
                    key={step.id}
                    className={cn(
                      "flex items-center gap-3 text-sm",
                      isActive && "text-foreground font-medium",
                      isCompleted && "text-muted-foreground",
                      isPending && "text-muted-foreground/50"
                    )}
                  >
                    {isActive && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                    {isCompleted && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                    {isPending && (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    <span>{step.label}</span>
                  </div>
                );
              })}
            </div>
            {progress !== undefined ? (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {progress}% complete
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Progress value={undefined} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  Processing...
                </p>
              </div>
            )}
          </>
        )}

        {state === "success" && (
          <div className="flex items-center gap-3 text-sm text-primary">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Processing completed successfully!</span>
          </div>
        )}

        {state === "error" && error && (
          <div className="flex items-start gap-3 text-sm text-destructive">
            <XCircle className="h-5 w-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium mb-1">Processing failed</p>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
