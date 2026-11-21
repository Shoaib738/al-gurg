"use client";

import { useList } from "@/lib/queries";
import type { SessionUser } from "@/lib/auth-shared";
import { PageHeader } from "../erp/primitives";
import { DataTable } from "../erp/data-table";
import { StatusBadge } from "../status-badge";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

export function ProjectList({
  user,
  onSelect,
}: {
  user: SessionUser;
  onSelect: (id: string) => void;
}) {
  const { data, isLoading } = useList<any>("projects");
  return (
    <div className="space-y-4">
      <PageHeader
        title="Projects"
        description="All projects released from quotations, across the full lifecycle"
      />
      <DataTable
        loading={isLoading}
        data={data}
        onRowClick={(p) => onSelect(p.id)}
        columns={[
          { key: "projectNo", header: "Project No", render: (p) => <span className="font-medium">{p.projectNo}</span> },
          { key: "name", header: "Name" },
          { key: "client", header: "Client", render: (p) => p.client?.name },
          { key: "quotation", header: "Quotation", render: (p) => p.quotation?.quotationNo ?? "—" },
          { key: "startDate", header: "Start", render: (p) => formatDate(p.startDate) },
          { key: "dueDate", header: "Due", render: (p) => formatDate(p.dueDate) },
          { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
        ]}
      />
    </div>
  );
}
