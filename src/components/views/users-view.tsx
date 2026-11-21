"use client";

import { useList } from "@/lib/queries";
import { PageHeader } from "../erp/primitives";
import { DataTable } from "../erp/data-table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/auth-shared";

export function UsersView() {
  const { data, isLoading } = useList<any>("users");
  return (
    <div className="space-y-4">
      <PageHeader
        title="Users"
        description="All ERP users across departments"
      />
      <DataTable
        loading={isLoading}
        data={data}
        columns={[
          { key: "name", header: "Name", render: (u) => <span className="font-medium">{u.name}</span> },
          { key: "email", header: "Email", render: (u) => <span className="font-mono text-xs">{u.email}</span> },
          {
            key: "role",
            header: "Role",
            render: (u) => (
              <Badge variant="outline" className="text-[10px] bg-amber-50/60 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300">
                {(ROLE_LABELS as any)[u.role] || u.role}
              </Badge>
            ),
          },
          { key: "phone", header: "Phone", render: (u) => u.phone || "-" },
          {
            key: "isActive",
            header: "Status",
            render: (u) =>
              u.isActive ? (
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">Inactive</Badge>
              ),
          },
          { key: "createdAt", header: "Joined", render: (u) => formatDate(u.createdAt) },
        ]}
      />
    </div>
  );
}
