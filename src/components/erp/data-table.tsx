"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { EmptyState, LoadingState } from "./primitives";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  loading,
  emptyTitle = "No records found",
  emptyDescription,
  onRowClick,
  rightSlot,
}: {
  columns: Column<T>[];
  data: T[] | undefined | null;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  rightSlot?: React.ReactNode;
}) {
  if (loading) return <LoadingState />;
  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/60 sticky top-0 z-10">
          <TableRow className="hover:bg-transparent">
            {columns.map((c) => (
              <TableHead
                key={c.key}
                className={cn("text-xs uppercase tracking-wide", c.headerClassName)}
              >
                {c.header}
              </TableHead>
            ))}
            {rightSlot && <TableHead className="text-right">{rightSlot}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow
              key={(row as any).id || idx}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "text-sm",
                idx % 2 === 1 && "bg-muted/30",
                onRowClick && "cursor-pointer"
              )}
            >
              {columns.map((c) => (
                <TableCell key={c.key} className={c.className}>
                  {c.render
                    ? c.render(row)
                    : ((row as any)[c.key] ?? "—")}
                </TableCell>
              ))}
              {rightSlot && <TableCell className="text-right">{rightSlot}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
