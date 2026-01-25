"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Workflow } from "../types";
import { formatCurrency } from "../utils";
import { Clock, ArrowRight } from "lucide-react";

type WorkflowCardProps = {
  workflow: Workflow;
  onConfigure: () => void;
};

export function WorkflowCard({ workflow, onConfigure }: WorkflowCardProps) {
  return (
    <div
      className={cn(
        "relative p-5 rounded-lg bg-muted/50 border border-border",
        "hover:bg-muted/70 hover:shadow-md transition-all duration-200"
      )}
    >
      {/* Top-left Icon */}
      {workflow.icon && (
        <div className="absolute top-4 left-4 w-7 h-7 rounded-md bg-background/60 flex items-center justify-center text-base">
          {workflow.icon}
        </div>
      )}

      {/* Top-right Price Tag */}
      {workflow.estimated_cost !== null && (
        <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-blue-500 text-white text-xs font-medium">
          {formatCurrency(workflow.estimated_cost)}
        </div>
      )}

      {/* Content */}
      <div className={cn("space-y-2.5", workflow.icon ? "pt-10" : "pt-0")}>
        {/* Title */}
        <h3 className={cn(
          "text-xl font-bold text-foreground",
          workflow.estimated_cost !== null && "pr-20"
        )}>
          {workflow.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground">
          {workflow.description || "No description available."}
        </p>

        {/* Duration */}
        {workflow.estimated_time_minutes !== null && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>~{workflow.estimated_time_minutes} minutes</span>
          </div>
        )}

        {/* Select Button */}
        <Button
          variant="secondary"
          size="sm"
          className="w-full mt-3 bg-muted/80 hover:bg-muted text-foreground border border-border/50"
          onClick={onConfigure}
        >
          Select
          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}
