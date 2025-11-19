"use client";

import { MoreHorizontal, Pencil, Trash2, ExternalLink, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ActionMenuProps = {
  itemId: string;
  onEdit?: () => void;
  onDelete?: (id: string) => Promise<void>;
  editHref?: string;
  openPageHref?: string;
  statsHref?: string;
  deleteLabel?: string;
};

export function ActionMenu({
  itemId,
  onEdit,
  onDelete,
  editHref,
  openPageHref,
  statsHref,
  deleteLabel = "this item",
}: ActionMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenPage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (openPageHref) {
      window.open(openPageHref, "_blank", "noopener,noreferrer");
    }
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(itemId);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  return (
    <>
      <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="no-shadow !shadow-[0_0_0_0_transparent] hover:!shadow-[0_0_0_0_transparent] dark:!shadow-[0_0_0_0_transparent] dark:hover:!shadow-[0_0_0_0_transparent] h-10 w-10 focus-visible:ring-0 hover:bg-transparent dark:hover:bg-transparent [&:hover_svg]:text-primary"
              style={{ boxShadow: "none" }}
            >
              <MoreHorizontal className="h-5 w-5 transition-colors duration-150" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit ? (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            ) : editHref ? (
              <DropdownMenuItem asChild>
                <Link
                  href={editHref}
                  className="cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
            ) : null}
            {openPageHref && (
              <>
                <DropdownMenuItem onClick={handleOpenPage} className="cursor-pointer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Page
                </DropdownMenuItem>
              </>
            )}
            {statsHref && (
              <DropdownMenuItem asChild>
                <Link
                  href={statsHref}
                  className="cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Stats
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDeleteClick}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {deleteLabel}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
