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
import { TableTitleCell } from "@/components/admin/table/TableTitleCell";
import { ActionMenu } from "@/components/admin/ui/ActionMenu";
import { StateBadge } from "@/components/admin/StateBadge";
import { AdminPageTitle } from "@/components/admin/ui/AdminPageTitle";
import { AdminToolbar } from "@/components/admin/table/AdminToolbar";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { EntityType } from "@/features/entity-types/types";
import { EditEntityTypeModal } from "./EditEntityTypeModal";
import { cn } from "@/lib/utils";
import { getInteractiveGradient } from "@/lib/gradient-presets";

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0][0]?.toUpperCase() || "";
  return (words[0][0]?.toUpperCase() || "") + (words[words.length - 1][0]?.toUpperCase() || "");
}

// Motion version of TableRow to avoid hydration errors
const MotionTableRow = React.forwardRef<
  HTMLTableRowElement,
  Omit<React.HTMLAttributes<HTMLTableRowElement>, "onDrag" | "onDragEnd" | "onDragStart" | "onDragEnter" | "onDragExit" | "onDragLeave" | "onDragOver"> & {
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

type EntityTypesListProps = {
  initialEntityTypes: EntityType[];
};

export function EntityTypesList({ initialEntityTypes }: EntityTypesListProps) {
  const [entityTypes, setEntityTypes] = useState<EntityType[]>(initialEntityTypes);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingEntityType, setEditingEntityType] = useState<EntityType | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEdit = (entityType: EntityType) => {
    setEditingEntityType(entityType);
    setIsEditModalOpen(true);
  };

  const handleCreate = () => {
    setEditingEntityType(null);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    // Refresh the entity types list
    window.location.reload();
  };

  const handleDelete = async (id: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await fetch(`/api/admin/entity-types?id=${id}`, {
        method: "DELETE",
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete entity type");
      }

      toast.success("Entity type deleted successfully");
      setEntityTypes(entityTypes.filter((et) => et.id !== id));
    } catch (error: any) {
      console.error("Error deleting entity type:", error);
      toast.error(error.message || "Failed to delete entity type");
      throw error;
    }
  };

  const filteredEntityTypes = entityTypes.filter((entityType) => {
    const query = searchQuery.toLowerCase();
    return (
      entityType.name.toLowerCase().includes(query) ||
      entityType.slug.toLowerCase().includes(query) ||
      (entityType.description?.toLowerCase().includes(query) ?? false)
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
            <h1 className="text-4xl font-bold text-foreground leading-none">Entity Types</h1>
            <span className="inline-flex items-center justify-center h-5 px-2.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 leading-none">
              ({filteredEntityTypes.length} {filteredEntityTypes.length === 1 ? "type" : "types"})
            </span>
          </div>
          <p className="text-base text-muted-foreground">
            Manage entity types for automation tracking and workflow organization.
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
          searchPlaceholder="Search entity types..."
        >
          <Button
            variant="ghost"
            className="rounded-full w-10 h-10 p-0 bg-transparent text-muted-foreground hover:text-primary hover:bg-transparent border-0 shadow-none transition-colors"
            title="New Entity Type"
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
              <TableHead className="w-28 shrink-0">Updated</TableHead>
              <TableHead className="w-20 shrink-0 text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntityTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {searchQuery ? "No entity types found matching your search" : "No entity types found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredEntityTypes.map((entityType, index) => (
                <React.Fragment key={entityType.id}>
                  {/* Mobile Layout */}
                  <MotionTableRow
                    key={`${entityType.id}-mobile`}
                    className="md:hidden group hover:bg-muted/50 border-b border-border/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02, duration: 0.2 }}
                  >
                    <TableCell className="px-3 md:pl-4 md:pr-4 py-4" colSpan={5}>
                      <div className="flex items-start gap-3 md:gap-4">
                        <div className="h-[49px] w-[49px] rounded-full overflow-hidden flex items-center justify-center bg-muted shadow-md flex-shrink-0">
                          {entityType.icon ? (
                            <span className="text-2xl leading-none flex items-center justify-center">{entityType.icon}</span>
                          ) : (
                            <span className="text-xs font-semibold text-muted-foreground">
                              {getInitials(entityType.name)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-base mb-1.5 break-words">
                            {entityType.name}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono break-words mb-1">
                            {entityType.slug}
                          </div>
                          {entityType.description && (
                            <div className="text-sm text-muted-foreground break-words mb-2">
                              {entityType.description}
                            </div>
                          )}
                          <div className="text-sm text-muted-foreground space-y-0.5">
                            <div>
                              <StateBadge state={entityType.enabled ? "active" : "disabled"} />
                            </div>
                            <div>{format(new Date(entityType.updated_at), "MMM d, yyyy")}</div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-2" data-action-menu>
                          <ActionMenu
                            itemId={entityType.id}
                            onEdit={() => handleEdit(entityType)}
                            onDelete={handleDelete}
                            deleteLabel={`entity type "${entityType.name}"`}
                          />
                        </div>
                      </div>
                    </TableCell>
                  </MotionTableRow>

                  {/* Desktop Layout */}
                  <MotionTableRow
                    key={`${entityType.id}-desktop`}
                    className="hidden md:table-row group hover:bg-muted/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02, duration: 0.2 }}
                  >
                    <TableCell className="p-4">
                      <div className="h-[49px] w-[49px] rounded-full overflow-hidden flex items-center justify-center bg-muted shadow-md">
                        {entityType.icon ? (
                          <span className="text-2xl leading-none flex items-center justify-center">{entityType.icon}</span>
                        ) : (
                          <span className="text-xs font-semibold text-muted-foreground">
                            {getInitials(entityType.name)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableTitleCell
                      title={entityType.name}
                      imageUrl={undefined}
                      showInitials={false}
                      description={entityType.slug}
                      metadata={entityType.description ? undefined : undefined}
                      className="w-80 max-w-80"
                    />
                    <TableCell className="w-24 shrink-0">
                      <StateBadge state={entityType.enabled ? "active" : "disabled"} />
                    </TableCell>
                    <TableCell className="text-muted-foreground w-28 shrink-0">
                      {format(new Date(entityType.updated_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right pr-4" data-action-menu>
                      <ActionMenu
                        itemId={entityType.id}
                        onEdit={() => handleEdit(entityType)}
                        onDelete={handleDelete}
                        deleteLabel={`entity type "${entityType.name}"`}
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
        <EditEntityTypeModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          entityType={editingEntityType}
          onSuccess={handleEditSuccess}
        />
      )}
    </motion.div>
  );
}
