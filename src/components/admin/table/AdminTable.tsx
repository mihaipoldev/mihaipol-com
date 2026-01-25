import { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type AdminTableProps = {
  children: ReactNode;
  className?: string;
};

export function AdminTable({ children, className }: AdminTableProps) {
  return (
    <div className="relative overflow-hidden shadow-lg rounded-xl">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />

      {/* Sparkle decorations */}
      <div className="absolute top-4 right-4 w-2 h-2 bg-primary/20 rounded-full blur-sm animate-pulse" />
      <div
        className="absolute top-12 right-12 w-1.5 h-1.5 bg-primary/30 rounded-full blur-sm animate-pulse"
        style={{ animationDelay: "300ms" }}
      />

      <div className="relative w-full overflow-x-auto md:overflow-x-auto">
        <Table className={cn("min-w-0", className)}>{children}</Table>
      </div>
    </div>
  );
}

export { TableHeader, TableBody, TableRow, TableHead, TableCell };
