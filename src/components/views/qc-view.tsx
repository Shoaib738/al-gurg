"use client";

import { useState } from "react";
import { useList, useDetail, useAction } from "@/lib/queries";
import type { SessionUser } from "@/lib/auth-shared";
import { PageHeader, EmptyState } from "../erp/primitives";
import { DataTable } from "../erp/data-table";
import { StatusBadge } from "../status-badge";
import { QcReportFormDialog } from "./qc-report-form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShieldCheck, ClipboardCheck, FileText } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/format";
import { toast } from "sonner";

export function QcView({ user, tab }: { user: SessionUser; tab: string }) {
  const initialTab =
    tab === "qc-pending" ? "pending" : tab === "qc-reports" ? "reports" : "pending";
  const [activeTab, setActiveTab] = useState(initialTab);
  const pending = useList<any>("dashboard-qc");
  const reports = useList<any>("qc-reports");

  return (
    <div className="space-y-4">
      <PageHeader title="Quality Control" description="Pending inspections & QC reports" />
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending"><ShieldCheck className="size-3.5" /> Pending</TabsTrigger>
          <TabsTrigger value="reports"><FileText className="size-3.5" /> Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Delivery inspections pending</CardTitle></CardHeader>
            <CardContent className="p-0">
              {(pending.data?.pendingDelivery ?? []).length === 0 ? (
                <EmptyState title="No pending delivery inspections" />
              ) : (
                <PendingDeliveryTable items={pending.data?.pendingDelivery ?? []} user={user} />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Production stage QC pending</CardTitle></CardHeader>
            <CardContent className="p-0">
              {(pending.data?.pendingStages ?? []).length === 0 ? (
                <EmptyState title="No pending stage QC" />
              ) : (
                <PendingStagesTable items={pending.data?.pendingStages ?? []} user={user} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">All QC reports</CardTitle></CardHeader>
            <CardContent className="p-0">
              <DataTable
                loading={reports.isLoading}
                data={reports.data}
                columns={[
                  { key: "reportNo", header: "Report" },
                  { key: "type", header: "Type", render: (r: any) => <StatusBadge status={r.type.replace(/_/g, " ")} /> },
                  { key: "qcUser", header: "Inspector", render: (r: any) => r.qcUser?.name },
                  { key: "status", header: "Result", render: (r: any) => <StatusBadge status={r.status} /> },
                  { key: "createdAt", header: "Created", render: (r: any) => formatDate(r.createdAt) },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PendingDeliveryTable({ items, user }: { items: any[]; user: SessionUser }) {
  const [target, setTarget] = useState<any | null>(null);
  const canInspect = user.role === "QC" || user.role === "ADMIN";
  return (
    <>
      <DataTable
        data={items}
        columns={[
          { key: "grnNo", header: "GRN" },
          { key: "lpo", header: "LPO", render: (g) => g.lpo?.lpoNo },
          { key: "supplier", header: "Supplier", render: (g) => g.lpo?.supplier?.name },
          { key: "project", header: "Project", render: (g) => g.project?.name },
          { key: "receivedAt", header: "Received", render: (g) => formatDate(g.receivedAt) },
        ]}
      />
      {canInspect && items.length > 0 && (
        <div className="p-3 flex flex-wrap gap-2 border-t">
          {items.map((g) => (
            <Button key={g.id} size="sm" variant="outline" onClick={() => setTarget(g)}>
              <ShieldCheck className="size-3.5" /> Inspect {g.grnNo}
            </Button>
          ))}
        </div>
      )}
      {target && (
        <QcReportFormDialog
          open={!!target}
          onOpenChange={(v) => !v && setTarget(null)}
          type="DELIVERY_INSPECTION"
          refType="LPO"
          refId={target.lpoId}
          title={`QC - ${target.grnNo}`}
        />
      )}
    </>
  );
}

function PendingStagesTable({ items, user }: { items: any[]; user: SessionUser }) {
  const [target, setTarget] = useState<any | null>(null);
  const canInspect = user.role === "QC" || user.role === "ADMIN";
  return (
    <>
      <DataTable
        data={items}
        columns={[
          { key: "stageName", header: "Stage" },
          { key: "productionOrder", header: "Order", render: (s) => s.productionOrder?.orderNo },
          { key: "project", header: "Project", render: (s) => s.productionOrder?.project?.name },
          { key: "completedAt", header: "Completed", render: (s) => formatDateTime(s.completedAt) },
        ]}
      />
      {canInspect && items.length > 0 && (
        <div className="p-3 flex flex-wrap gap-2 border-t">
          {items.map((s) => (
            <Button key={s.id} size="sm" variant="outline" onClick={() => setTarget(s)}>
              <ShieldCheck className="size-3.5" /> Inspect {s.stageName}
            </Button>
          ))}
        </div>
      )}
      {target && (
        <QcReportFormDialog
          open={!!target}
          onOpenChange={(v) => !v && setTarget(null)}
          type="PRODUCTION_STAGE"
          refType="ProductionStage"
          refId={target.id}
          productionStageId={target.id}
          title={`QC - ${target.stageName}`}
        />
      )}
    </>
  );
}
