"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsis,
  faPencil,
  faTrash,
  faExternalLink,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useEffect } from "react";
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

export type CustomMenuItem = {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
  separator?: boolean;
};

type ActionMenuProps = {
  itemId: string;
  onEdit?: () => void;
  onDelete?: (id: string) => Promise<void>;
  editHref?: string;
  openPageHref?: string;
  statsHref?: string;
  deleteLabel?: string;
  customItems?: CustomMenuItem[];
  showDelete?: boolean;
  disabled?: boolean;
};

export function ActionMenu({
  itemId,
  onEdit,
  onDelete,
  editHref,
  openPageHref,
  statsHref,
  deleteLabel = "this item",
  customItems,
  showDelete = true,
  disabled = false,
}: ActionMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    
    return () => observer.disconnect();
  }, []);

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
              disabled={disabled}
            >
              <FontAwesomeIcon icon={faEllipsis} className="h-5 w-5 transition-colors duration-150" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end"
            sideOffset={0}
            className="px-0 py-2 border-0 w-48 bg-popover"
            style={{
              boxShadow: isDarkMode ? 'none' : 'rgba(0, 0, 0, 0.2) 0px 2px 4px -1px, rgba(0, 0, 0, 0.14) 0px 4px 5px 0px, rgba(0, 0, 0, 0.12) 0px 1px 10px 0px;'
            }}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            {onEdit ? (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="cursor-pointer !rounded-none px-4 py-2 focus:!bg-accent focus:!text-accent-foreground data-[highlighted]:!bg-accent data-[highlighted]:!text-accent-foreground"
              >
                <FontAwesomeIcon icon={faPencil} className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            ) : editHref ? (
              <DropdownMenuItem asChild>
                <Link
                  href={editHref}
                  className="cursor-pointer !rounded-none px-4 py-2 focus:!bg-accent focus:!text-accent-foreground data-[highlighted]:!bg-accent data-[highlighted]:!text-accent-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FontAwesomeIcon icon={faPencil} className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
            ) : null}
            {openPageHref && (
              <>
                <DropdownMenuItem onClick={handleOpenPage} className="cursor-pointer !rounded-none px-4 py-2 focus:!bg-accent focus:!text-accent-foreground data-[highlighted]:!bg-accent data-[highlighted]:!text-accent-foreground">
                  <FontAwesomeIcon icon={faExternalLink} className="mr-2 h-4 w-4" />
                  Open Page
                </DropdownMenuItem>
              </>
            )}
            {statsHref && (
              <DropdownMenuItem asChild>
                <Link
                  href={statsHref}
                  className="cursor-pointer !rounded-none px-4 py-2 focus:!bg-accent focus:!text-accent-foreground data-[highlighted]:!bg-accent data-[highlighted]:!text-accent-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FontAwesomeIcon icon={faChartLine} className="mr-2 h-4 w-4" />
                  Stats
                </Link>
              </DropdownMenuItem>
            )}
            {customItems && customItems.length > 0 && (
              <>
                {(onEdit || editHref || openPageHref || statsHref) && <DropdownMenuSeparator />}
                {customItems.map((item, index) => {
                  if (item.separator) {
                    return <DropdownMenuSeparator key={`custom-separator-${index}`} />;
                  }
                  return (
                    <DropdownMenuItem
                      key={`custom-${index}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        item.onClick();
                      }}
                      disabled={item.disabled}
                      className={cn(
                        "cursor-pointer !rounded-none px-4 py-2 focus:!bg-accent focus:!text-accent-foreground data-[highlighted]:!bg-accent data-[highlighted]:!text-accent-foreground",
                        item.destructive && "text-destructive focus:text-destructive"
                      )}
                    >
                      {item.icon && <span className="mr-2">{item.icon}</span>}
                      {item.label}
                    </DropdownMenuItem>
                  );
                })}
              </>
            )}
            {showDelete && onDelete && (
              <>
                {(onEdit || editHref || openPageHref || statsHref || (customItems && customItems.length > 0)) && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  onClick={handleDeleteClick}
                  className="text-destructive focus:text-destructive cursor-pointer !rounded-none px-4 py-2 focus:!bg-accent focus:!text-accent-foreground data-[highlighted]:!bg-accent data-[highlighted]:!text-accent-foreground"
                >
                  <FontAwesomeIcon icon={faTrash} className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
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
