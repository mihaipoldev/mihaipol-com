"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  AdminTable,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/admin/table/AdminTable";
import { cn } from "@/lib/utils";
import { getInteractiveGradient } from "@/lib/gradient-presets";
import { TableTitleCell } from "@/components/admin/table/TableTitleCell";
import { ActionMenu } from "@/components/admin/ui/ActionMenu";
import { StateBadge } from "@/components/admin/StateBadge";
import { AdminPageTitle } from "@/components/admin/ui/AdminPageTitle";
import { AdminToolbar } from "@/components/admin/table/AdminToolbar";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faDollarSign, faClock } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Workflow } from "@/features/workflows/types";
import { EditWorkflowModal } from "./EditWorkflowModal";

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0][0]?.toUpperCase() || "";
  return (words[0][0]?.toUpperCase() || "") + (words[words.length - 1][0]?.toUpperCase() || "");
}

// Motion version of TableRow to avoid hydration errors
const MotionTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & {
    initial?: any;
    animate?: any;
    transition?: any;
  }
>(({ className, initial, animate, transition, ...props }, ref) => {
  const interactiveGradient = getInteractiveGradient();
  const hoverClasses = interactiveGradient
    .split(" ")
    .map((cls) => `hover:${cls}`)
    .join(" ");
  return (
    <motion.tr
      ref={ref}
      className={cn(
        `border-b transition-colors ${hoverClasses} data-[state=selected]:bg-muted`,
        className
      )}
      initial={initial}
      animate={animate}
      transition={transition}
      {...(props as any)}
    />
  );
});
MotionTableRow.displayName = "MotionTableRow";

type WorkflowsListProps = {
  initialWorkflows: Workflow[];
};

export function WorkflowsList({ initialWorkflows }: WorkflowsListProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEdit = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setIsEditModalOpen(true);
  };

  const handleCreate = () => {
    setEditingWorkflow(null);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    // Refresh the workflows list
    window.location.reload();
  };

  const handleDelete = async (id: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await fetch(`/api/admin/workflows?id=${id}`, {
        method: "DELETE",
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete workflow");
      }

      toast.success("Workflow deleted successfully");
      setWorkflows(workflows.filter((w) => w.id !== id));
    } catch (error: any) {
      console.error("Error deleting workflow:", error);
      toast.error(error.message || "Failed to delete workflow");
      throw error;
    }
  };

  const filteredWorkflows = workflows.filter((workflow) => {
    const query = searchQuery.toLowerCase();
    return (
      workflow.name.toLowerCase().includes(query) ||
      workflow.slug.toLowerCase().includes(query) ||
      (workflow.description?.toLowerCase().includes(query) ?? false)
    );
  });

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="mb-4 md:mb-6 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3 mb-2">
            <h1 className="text-4xl font-bold text-foreground leading-none">Workflows</h1>
            <span className="inline-flex items-center justify-center h-5 px-2.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 leading-none">
              ({filteredWorkflows.length} {filteredWorkflows.length === 1 ? "workflow" : "workflows"})
            </span>
          </div>
          <p className="text-base text-muted-foreground">
            Manage automation workflows, including configuration and secrets.
          </p>
        </div>
      </motion.div>
      <motion.div
        className="space-y-3 md:space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <AdminToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search workflows..."
        >
          <Button
            variant="ghost"
            className="rounded-full w-10 h-10 p-0 bg-transparent text-muted-foreground hover:text-primary hover:bg-transparent border-0 shadow-none transition-colors"
            title="New Workflow"
            onClick={handleCreate}
          >
            <FontAwesomeIcon icon={faPlus} className="h-5 w-5" />
          </Button>
        </AdminToolbar>

        <AdminTable>
          <TableHeader className="hidden md:table-header-group">
            <TableRow>
              <TableHead className="pl-4 w-[81px]">Icon</TableHead>
              <TableHead className="w-80 max-w-80">Name</TableHead>
              <TableHead className="w-24 shrink-0">Status</TableHead>
              <TableHead className="w-20 shrink-0">Cost</TableHead>
              <TableHead className="w-24 shrink-0">Time</TableHead>
              <TableHead className="w-28 shrink-0">Updated</TableHead>
              <TableHead className="w-20 shrink-0 text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWorkflows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {searchQuery ? "No workflows found matching your search" : "No workflows found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredWorkflows.map((workflow, index) => (
                <React.Fragment key={workflow.id}>
                  {/* Mobile Layout */}
                  <MotionTableRow
                    key={`${workflow.id}-mobile`}
                    className="md:hidden group hover:bg-muted/50 border-b border-border/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02, duration: 0.2 }}
                  >
                    <TableCell className="px-3 md:pl-4 md:pr-4 py-4" colSpan={7}>
                      <div className="flex items-start gap-3 md:gap-4">
                        <div className="h-[49px] w-[49px] rounded-full overflow-hidden flex items-center justify-center bg-muted shadow-md flex-shrink-0">
                          {workflow.icon ? (
                            <span className="text-2xl leading-none flex items-center justify-center">{workflow.icon}</span>
                          ) : (
                            <span className="text-xs font-semibold text-muted-foreground">
                              {getInitials(workflow.name)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-base mb-1.5 break-words">
                            {workflow.name}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono break-words mb-1">
                            {workflow.slug}
                          </div>
                          {workflow.description && (
                            <div className="text-sm text-muted-foreground break-words mb-2">
                              {workflow.description}
                            </div>
                          )}
                          <div className="text-sm text-muted-foreground space-y-0.5">
                            <div>
                              <StateBadge state={workflow.enabled ? "active" : "disabled"} />
                            </div>
                            {workflow.estimated_cost !== null && (
                              <div className="flex items-center gap-1.5">
                                <FontAwesomeIcon icon={faDollarSign} className="h-3.5 w-3.5" />
                                <span>${workflow.estimated_cost}</span>
                              </div>
                            )}
                            {workflow.estimated_time_minutes !== null && (
                              <div className="flex items-center gap-1.5">
                                <FontAwesomeIcon icon={faClock} className="h-3.5 w-3.5" />
                                <span>{workflow.estimated_time_minutes} min</span>
                              </div>
                            )}
                            <div>{format(new Date(workflow.updated_at), "MMM d, yyyy")}</div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-2" data-action-menu>
                          <ActionMenu
                            itemId={workflow.id}
                            onEdit={() => handleEdit(workflow)}
                            onDelete={handleDelete}
                            deleteLabel={`workflow "${workflow.name}"`}
                          />
                        </div>
                      </div>
                    </TableCell>
                  </MotionTableRow>

                  {/* Desktop Layout */}
                  <MotionTableRow
                    key={`${workflow.id}-desktop`}
                    className="hidden md:table-row group hover:bg-muted/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02, duration: 0.2 }}
                  >
                    <TableCell className="p-4">
                      <div className="h-[49px] w-[49px] rounded-full overflow-hidden flex items-center justify-center bg-muted shadow-md">
                        {workflow.icon ? (
                          <span className="text-2xl leading-none flex items-center justify-center">{workflow.icon}</span>
                        ) : (
                          <span className="text-xs font-semibold text-muted-foreground">
                            {getInitials(workflow.name)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableTitleCell
                      title={workflow.name}
                      imageUrl={undefined}
                      showInitials={false}
                      description={workflow.description || undefined}
                      className="w-80 max-w-80"
                    />
                    <TableCell className="w-24 shrink-0">
                      <StateBadge state={workflow.enabled ? "active" : "disabled"} />
                    </TableCell>
                    <TableCell className="w-20 shrink-0">
                      {workflow.estimated_cost !== null ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <FontAwesomeIcon icon={faDollarSign} className="h-3.5 w-3.5" />
                          <span>${workflow.estimated_cost}</span>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">—</p>
                      )}
                    </TableCell>
                    <TableCell className="w-24 shrink-0">
                      {workflow.estimated_time_minutes !== null ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <FontAwesomeIcon icon={faClock} className="h-3.5 w-3.5" />
                          <span>{workflow.estimated_time_minutes} min</span>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">—</p>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground w-28 shrink-0">
                      {format(new Date(workflow.updated_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right pr-4" data-action-menu>
                      <ActionMenu
                        itemId={workflow.id}
                        onEdit={() => handleEdit(workflow)}
                        onDelete={handleDelete}
                        deleteLabel={`workflow "${workflow.name}"`}
                      />
                      </TableCell>
                    </MotionTableRow>
                  </React.Fragment>
                ))
            )}
          </TableBody>
        </AdminTable>
      </motion.div>

      {isEditModalOpen && (
        <EditWorkflowModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          workflow={editingWorkflow}
          onSuccess={handleEditSuccess}
        />
      )}
    </motion.div>
  );
}
