import { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCardGradient } from "@/lib/gradient-presets";
import { cn } from "@/lib/utils";

type AdminTableProps = {
  children: ReactNode;
  className?: string;
};

export function AdminTable({ children, className }: AdminTableProps) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-xl bg-card/50 text-card-foreground dark:bg-card/30 shadow-lg transition-all duration-300 hover:shadow-xl",
        getCardGradient()
      )}
    >
      <Table className={className}>{children}</Table>
    </div>
  );
}

export { TableHeader, TableBody, TableRow, TableHead, TableCell };
