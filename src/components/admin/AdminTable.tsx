import { ReactNode } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type AdminTableProps = {
  children: ReactNode
  className?: string
}

export function AdminTable({ children, className }: AdminTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-md">
      <Table className={className}>{children}</Table>
    </div>
  )
}

export { TableHeader, TableBody, TableRow, TableHead, TableCell }

