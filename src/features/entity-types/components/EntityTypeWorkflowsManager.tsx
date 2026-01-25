"use client";

import { useState, useEffect, useMemo, useCallback, useImperativeHandle, forwardRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faX,
  faPlus,
  faSitemap,
  faArrowUp,
  faArrowDown,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Workflow } from "@/features/workflows/types";

type SelectedWorkflow = {
  id: string;
  workflow_id: string;
  display_order: number;
  workflow: Workflow;
};

type EntityTypeWorkflowsManagerProps = {
  entityTypeId: string;
  initialWorkflows: Workflow[];
  isLoading: boolean;
};

export type EntityTypeWorkflowsManagerRef = {
  saveWorkflows: () => Promise<void>;
};

export const EntityTypeWorkflowsManager = forwardRef<EntityTypeWorkflowsManagerRef, EntityTypeWorkflowsManagerProps>(
  function EntityTypeWorkflowsManager({
    entityTypeId,
    initialWorkflows,
    isLoading,
  }, ref) {
  const [selectedWorkflows, setSelectedWorkflows] = useState<SelectedWorkflow[]>([]);
  const [availableWorkflows, setAvailableWorkflows] = useState<Workflow[]>([]);
  const [isLoadingAvailableWorkflows, setIsLoadingAvailableWorkflows] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Initialize selected workflows from initialWorkflows
  useEffect(() => {
    console.log("EntityTypeWorkflowsManager: initialWorkflows changed", {
      entityTypeId,
      initialWorkflowsCount: initialWorkflows?.length,
      initialWorkflows
    });
    
    // Reset when entityTypeId changes
    if (entityTypeId) {
      // Initialize from initialWorkflows whenever they change
      if (initialWorkflows && initialWorkflows.length > 0) {
        const workflows: SelectedWorkflow[] = initialWorkflows.map((wf, index) => ({
          id: wf.id,
          workflow_id: wf.id,
          display_order: (wf as any).display_order ?? index,
          workflow: wf,
        }));
        console.log("Setting selected workflows:", workflows);
        setSelectedWorkflows(workflows);
      } else if (initialWorkflows && initialWorkflows.length === 0) {
        // Explicitly set to empty array if initialWorkflows is empty
        console.log("Setting selected workflows to empty array");
        setSelectedWorkflows([]);
      }
    }
  }, [initialWorkflows, entityTypeId]);

  // Fetch available workflows
  useEffect(() => {
    const fetchAvailableWorkflows = async () => {
      setIsLoadingAvailableWorkflows(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;

        // Fetch all workflows (including disabled) so admins can connect any workflow
        const response = await fetch("/api/admin/workflows", {
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAvailableWorkflows(data || []);
        } else {
          console.error("Failed to fetch workflows:", response.status, response.statusText);
          const errorText = await response.text();
          console.error("Error response:", errorText);
        }
      } catch (error) {
        console.error("Error fetching available workflows:", error);
      } finally {
        setIsLoadingAvailableWorkflows(false);
      }
    };

    fetchAvailableWorkflows();
  }, []);

  // Get available workflows (not already selected)
  const availableWorkflowsForSelection = useMemo(() => {
    const selectedIds = new Set(selectedWorkflows.map((sw) => sw.workflow_id));
    return availableWorkflows.filter((w) => !selectedIds.has(w.id));
  }, [availableWorkflows, selectedWorkflows]);

  // Save workflow associations
  const saveWorkflowAssociations = useCallback(async (showToast = true) => {
    try {
      console.log("Saving workflow associations:", {
        entityTypeId,
        workflowsCount: selectedWorkflows.length,
        workflows: selectedWorkflows.map(sw => ({ workflow_id: sw.workflow_id, display_order: sw.display_order }))
      });

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const workflowsPayload = selectedWorkflows.map((sw, index) => ({
        workflow_id: sw.workflow_id,
        display_order: index,
      }));

      const response = await fetch(`/api/admin/entity-types/${entityTypeId}/workflows`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          workflows: workflowsPayload,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("API error response:", error);
        throw new Error(error.error || "Failed to update workflow associations");
      }

      const result = await response.json();
      console.log("Workflow associations saved successfully:", result);

      if (showToast) {
        toast.success("Workflow associations updated successfully");
      }
    } catch (error: any) {
      console.error("Error saving workflow associations:", error);
      if (showToast) {
        toast.error(error.message || "Failed to update workflow associations");
      }
      throw error; // Re-throw so parent can handle it
    }
  }, [selectedWorkflows, entityTypeId]);

  // Expose save method to parent via ref
  useImperativeHandle(ref, () => ({
    saveWorkflows: () => saveWorkflowAssociations(false),
  }), [saveWorkflowAssociations]);

  const handleAddWorkflow = (workflowId: string) => {
    const workflow = availableWorkflows.find((w) => w.id === workflowId);
    if (!workflow) return;

    const newWorkflow: SelectedWorkflow = {
      id: workflowId,
      workflow_id: workflowId,
      display_order: selectedWorkflows.length,
      workflow,
    };

    const updatedWorkflows = [...selectedWorkflows, newWorkflow];
    setSelectedWorkflows(updatedWorkflows);
    setPopoverOpen(false);
  };

  const handleRemoveWorkflow = (workflowId: string) => {
    const updatedWorkflows = selectedWorkflows
      .filter((sw) => sw.workflow_id !== workflowId)
      .map((sw, index) => ({
        ...sw,
        display_order: index,
      }));
    setSelectedWorkflows(updatedWorkflows);
  };

  const handleMoveWorkflow = (workflowId: string, direction: "up" | "down") => {
    setSelectedWorkflows((prev) => {
      const index = prev.findIndex((sw) => sw.workflow_id === workflowId);
      if (index === -1) return prev;

      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      const newWorkflows = [...prev];
      [newWorkflows[index], newWorkflows[newIndex]] = [newWorkflows[newIndex], newWorkflows[index]];

      const reordered = newWorkflows.map((sw, idx) => ({
        ...sw,
        display_order: idx,
      }));

      return reordered;
    });
  };

  const renderWorkflowContent = useCallback((item: SelectedWorkflow) => {
    const wf = item.workflow;
    return (
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          {wf.icon ? (
            <span className="text-lg">{wf.icon}</span>
          ) : (
            <FontAwesomeIcon
              icon={faSitemap}
              className="h-4 w-4 text-primary"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-foreground truncate">{wf.name}</div>
          {wf.description && (
            <div className="text-sm text-muted-foreground truncate">
              {wf.description}
            </div>
          )}
        </div>
      </div>
    );
  }, []);

  const renderWorkflowActions = useCallback(
    (item: SelectedWorkflow, index: number) => {
      return (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              handleMoveWorkflow(item.workflow_id, "up");
            }}
            disabled={index === 0}
          >
            <FontAwesomeIcon icon={faArrowUp} className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              handleMoveWorkflow(item.workflow_id, "down");
            }}
            disabled={index === selectedWorkflows.length - 1}
          >
            <FontAwesomeIcon icon={faArrowDown} className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveWorkflow(item.workflow_id);
            }}
          >
            <FontAwesomeIcon icon={faX} className="h-4 w-4" />
          </Button>
        </div>
      );
    },
    [selectedWorkflows.length]
  );

  return (
    <div className="space-y-3">
      <Label>Linked Workflows</Label>

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-4 text-center">
          Loading workflows...
        </div>
      ) : selectedWorkflows.length > 0 ? (
        <div className="space-y-2">
          {selectedWorkflows.map((workflow, index) => (
            <div
              key={workflow.workflow_id}
              className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4"
            >
              <div className="flex-1 min-w-0">
                {renderWorkflowContent(workflow)}
              </div>
              <div className="shrink-0">
                {renderWorkflowActions(workflow, index)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
          No workflows linked yet
        </div>
      )}

      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isLoadingAvailableWorkflows || availableWorkflowsForSelection.length === 0}
          >
            <FontAwesomeIcon icon={faPlus} className="h-4 w-4 mr-2" />
            Connect Workflow
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-1 z-[110]" align="start">
          {isLoadingAvailableWorkflows ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Loading workflows...
            </div>
          ) : availableWorkflowsForSelection.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No available workflows
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto">
              {availableWorkflowsForSelection.map((workflow) => (
                <button
                  key={workflow.id}
                  type="button"
                  onClick={() => handleAddWorkflow(workflow.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                >
                  {workflow.icon && (
                    <span className="text-base shrink-0">{workflow.icon}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{workflow.name}</div>
                    {workflow.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {workflow.description}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
});
