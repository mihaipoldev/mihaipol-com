"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  AdminTable,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/admin/AdminTable";
import { TableTitleCell } from "@/components/admin/TableTitleCell";
import { CoverImageCell } from "@/components/admin/CoverImageCell";
import { ActionMenu } from "@/components/admin/ActionMenu";
import { StateBadge } from "@/components/admin/StateBadge";
import { AdminPageTitle } from "@/components/admin/AdminPageTitle";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

type Update = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  date: string | null;
  publish_status: "draft" | "scheduled" | "published" | "archived";
  image_url: string | null;
};

type UpdatesListProps = {
  initialUpdates: Update[];
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function UpdatesList({ initialUpdates }: UpdatesListProps) {
  const router = useRouter();
  const [updates, setUpdates] = useState<Update[]>(
    Array.isArray(initialUpdates) ? initialUpdates : []
  );
  const [searchQuery, setSearchQuery] = useState("");

  const handleDelete = async (id: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await fetch(`/api/admin/updates?id=${id}`, {
        method: "DELETE",
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete update");
      }

      toast.success("Update deleted successfully");
      setUpdates(updates.filter((u) => u.id !== id));
    } catch (error: any) {
      console.error("Error deleting update:", error);
      toast.error(error.message || "Failed to delete update");
      throw error;
    }
  };

  const filteredUpdates = updates.filter((update) => {
    const query = searchQuery.toLowerCase();
    return (
      update.title.toLowerCase().includes(query) || update.subtitle?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-full">
      <div className="mb-6 relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />
        <AdminPageTitle
          title="Updates"
          description="Create and manage news updates, announcements, and blog posts for your audience."
        />
      </div>
      <div className="space-y-4">
        <AdminToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search updates..."
        >
          <Button
            onClick={() => router.push("/admin/updates/new/edit")}
            className="rounded-full w-10 h-10 p-0 bg-transparent text-muted-foreground hover:text-primary hover:bg-transparent border-0 shadow-none transition-colors"
            title="New Update"
            variant="ghost"
          >
            <FontAwesomeIcon icon={faPlus} className="h-5 w-5" />
          </Button>
        </AdminToolbar>

        <AdminTable>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4 w-24">Cover</TableHead>
              <TableHead className="w-[40%]">Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUpdates.length === 0 ? (
              <TableRow className="cursor-default">
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {searchQuery ? "No updates found matching your search" : "No updates found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredUpdates.map((update) => {
                const updateSlug = update.slug || generateSlug(update.title);
                return (
                  <TableRow
                    key={update.id}
                    onClick={() => router.push(`/admin/updates/${updateSlug}/edit`)}
                    className="group cursor-pointer hover:bg-muted/50"
                  >
                    <CoverImageCell
                      imageUrl={update.image_url}
                      title={update.title}
                      showInitials={true}
                      className="pl-4"
                    />
                    <TableTitleCell
                      title={update.title}
                      imageUrl={undefined}
                      description={update.subtitle || undefined}
                      showInitials={false}
                      href={`/dev/updates/${updateSlug}`}
                      className="w-[40%]"
                    />
                    <TableCell>
                      {update.date ? format(new Date(update.date), "MMM d, yyyy") : "-"}
                    </TableCell>
                    <TableCell>
                      <StateBadge state={update.publish_status} />
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <ActionMenu
                        itemId={update.id}
                        editHref={`/admin/updates/${updateSlug}/edit`}
                        openPageHref={`/dev/updates/${updateSlug}`}
                        onDelete={handleDelete}
                        deleteLabel={`update "${update.title}"`}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </AdminTable>
      </div>
    </div>
  );
}
