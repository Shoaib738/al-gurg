"use client";

import { useList } from "@/lib/queries";
import type { SessionUser } from "@/lib/auth-shared";
import { PageHeader } from "../erp/primitives";
import { DataTable } from "../erp/data-table";
import { StatusBadge } from "../status-badge";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime } from "@/lib/format";

export function ProjectDeptView({
  user,
  tab,
  setSelectedId,
  navigate,
}: {
  user: SessionUser;
  tab: string;
  setSelectedId: (id: string | null) => void;
  navigate: (v: string) => void;
}) {
  // Reuse dashboard-project data
  const { data, isLoading } = useList<any>("dashboard-project");
  const projects = data?.projects ?? [];
  return (
    <div className="space-y-4">
      <PageHeader
        title="Project Department"
        description="Projects in delivery, installation & feedback phases"
      />
      <DataTable
        loading={isLoading}
        data={projects}
        onRowClick={(p) => {
          setSelectedId(p.id);
          navigate("projects");
        }}
        columns={[
          { key: "projectNo", header: "Project" },
          { key: "name", header: "Name" },
          { key: "client", header: "Client", render: (p) => p.client?.name },
          { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
          {
            key: "ack",
            header: "Delivery",
            render: (p) => (p.deliveryAck ? <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Signed</Badge> : "-"),
          },
          {
            key: "inst",
            header: "Installation",
            render: (p) => (p.installation ? <StatusBadge status={p.installation.status} /> : "-"),
          },
          {
            key: "fb",
            header: "Feedback",
            render: (p) => (p.feedback ? <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Submitted</Badge> : "-"),
          },
        ]}
      />
    </div>
  );
}
