"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Workflow } from "../types";
import { formatCurrency } from "../utils";
import { Clock, ArrowRight } from "lucide-react";

type WorkflowCardProps = {
  workflow: Workflow;
  onConfigure: () => void;
};

function WorkflowCardComponent({ workflow, onConfigure }: WorkflowCardProps) {
  return (
    <div
      className={cn(
        "relative p-5 rounded-xl bg-card/50 dark:bg-card/30 backdrop-blur-sm",
        "bg-gradient-to-br from-primary/[2%] via-primary/[1%] to-transparent",
        "shadow-lg overflow-hidden",
        "hover:shadow-xl transition-all duration-300",
        "group"
      )}
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />

      {/* Sparkle decorations */}
      <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-primary/30 rounded-full blur-sm animate-pulse" />
      <div
        className="absolute top-6 right-8 w-1 h-1 bg-primary/20 rounded-full blur-sm animate-pulse"
        style={{ animationDelay: "300ms" }}
      />

      {/* Top-left Icon */}
      {workflow.icon && (
        <div className="absolute top-4 left-4 w-8 h-8 rounded-lg bg-primary/10 backdrop-blur-sm flex items-center justify-center text-base z-10 group-hover:bg-primary/15 transition-colors duration-300">
          {workflow.icon}
        </div>
      )}

      {/* Top-right Price Tag */}
      {workflow.estimated_cost !== null && (
        <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-blue-500 text-white text-xs font-medium z-10 shadow-md">
          {formatCurrency(workflow.estimated_cost)}
        </div>
      )}

      {/* Content */}
      <div className={cn("space-y-2.5 relative z-10", workflow.icon ? "pt-10" : "pt-0")}>
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

// Optimized: Memoize component to prevent unnecessary re-renders
export const WorkflowCard = memo(WorkflowCardComponent);
