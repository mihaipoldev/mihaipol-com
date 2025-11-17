"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { AdminPageTitle } from "@/components/admin/AdminPageTitle";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

type Label = {
  id: string;
  name: string;
  slug: string;
  logo_image_url: string | null;
  website_url: string | null;
};

type LabelsListProps = {
  initialLabels: Label[];
};

export function LabelsList({ initialLabels }: LabelsListProps) {
  const router = useRouter();
  const [labels, setLabels] = useState<Label[]>(initialLabels);
  const [searchQuery, setSearchQuery] = useState("");

  const handleDelete = async (id: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await fetch(`/api/admin/labels?id=${id}`, {
        method: "DELETE",
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete label");
      }

      toast.success("Label deleted successfully");
      setLabels(labels.filter((l) => l.id !== id));
    } catch (error: any) {
      console.error("Error deleting label:", error);
      toast.error(error.message || "Failed to delete label");
      throw error;
    }
  };

  const filteredLabels = labels.filter((label) => {
    const query = searchQuery.toLowerCase();
    return (
      label.name.toLowerCase().includes(query) || label.website_url?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-full">
      <div className="mb-6 relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />
        <AdminPageTitle
          title="Labels"
          description="Manage record labels and distributors associated with your music releases."
        />
      </div>
      <div className="space-y-4">
        <AdminToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search labels..."
        >
          <Button
            onClick={() => router.push("/admin/labels/new/edit")}
            className="rounded-full w-10 h-10 p-0 bg-transparent text-muted-foreground hover:text-primary hover:bg-transparent border-0 shadow-none transition-colors"
            title="New Label"
            variant="ghost"
          >
            <FontAwesomeIcon icon={faPlus} className="h-5 w-5" />
          </Button>
        </AdminToolbar>

        <AdminTable>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4 w-24">Cover</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLabels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  {searchQuery ? "No labels found matching your search" : "No labels found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredLabels.map((label) => (
                <TableRow
                  key={label.id}
                  onClick={() => router.push(`/admin/labels/${label.slug}/edit`)}
                  className="group cursor-pointer hover:bg-muted/50"
                >
                  <CoverImageCell
                    imageUrl={label.logo_image_url}
                    title={label.name}
                    showInitials={true}
                    className="pl-4"
                  />
                  <TableTitleCell title={label.name} imageUrl={undefined} showInitials={false} />
                  <TableCell className="text-right pr-4">
                    <ActionMenu
                      itemId={label.id}
                      editHref={`/admin/labels/${label.slug}/edit`}
                      onDelete={handleDelete}
                      deleteLabel={`label "${label.name}"`}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </AdminTable>
      </div>
    </div>
  );
}
