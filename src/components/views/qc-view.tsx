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
import { ShieldCheck, ClipboardCheck, FileText, Printer } from "lucide-react";
import { formatDate, formatDateTime, parseJsonSafe } from "@/lib/format";
import { toast } from "sonner";
import { SlipDocument, SlipDialog } from "../slip-document";

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
                  {
                    key: "action",
                    header: "",
                    render: (r: any) => <QcReportPrintButton report={r} />,
                  },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QcReportPrintButton({ report }: { report: any }) {
  const [open, setOpen] = useState(false);
  const { data: r, isLoading } = useDetail<any>("qc-report", open ? report.id : null);
  const checklist: { item: string; status: string }[] = r
    ? parseJsonSafe<typeof checklist>(r.checklistJson, [])
    : [];
  const missing: { item: string; ordered: number; received: number; missing: number }[] = r
    ? parseJsonSafe<typeof missing>(r.missingItems, [])
    : [];
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Printer className="size-3.5" /> Print
      </Button>
      <SlipDialog open={open} onOpenChange={setOpen} title={`QC ${report.reportNo}`}>
        {isLoading || !r ? (
          <p className="p-4 text-sm text-muted-foreground">Loading...</p>
        ) : (
          <SlipDocument
            title="QC INSPECTION REPORT"
            documentNo={r.reportNo}
            date={formatDate(r.inspectionDate)}
            status={(r.status || "").replace(/_/g, " ")}
            fromName="Al Gurg Group"
            fromAddress="Quality Control Department, Al Quoz Industrial Area 3, Dubai, UAE"
            fromContact="qc@algurggroup.ae  |  +971 4 000 0000"
            toLabel="Inspection Subject"
            toName={
              r.type === "DELIVERY_INSPECTION"
                ? r.grn?.grnNo ?? "Delivery inspection"
                : r.type === "PRODUCTION_STAGE"
                  ? r.productionStages?.[0]?.stageName ?? "Production stage"
                  : "Installation inspection"
            }
            toAddress={
              r.productionStages?.[0]?.productionOrder?.orderNo
                ? `Order: ${r.productionStages[0].productionOrder.orderNo}`
                : ""
            }
            toContact=""
            infoRows={[
              { label: "Report no", value: r.reportNo },
              {
                label: "Inspection type",
                value: (r.type || "").replace(/_/g, " "),
              },
              { label: "Inspection date", value: formatDateTime(r.inspectionDate) },
              { label: "QC officer", value: r.qcUser?.name ?? "-" },
              { label: "Status", value: (r.status || "").replace(/_/g, " ") },
              { label: "Submitted at", value: formatDateTime(r.submittedAt) },
            ]}
            items={{
              headers: ["#", "Checklist item", "Status"],
              rows: checklist.map((c, idx) => [
                idx + 1,
                c.item,
                (c.status || "").toUpperCase(),
              ]),
            }}
            notes={
              [
                r.remarks ? `Remarks: ${r.remarks}` : null,
                missing.length > 0
                  ? `Missing items: ${missing
                      .map((m) => `${m.item} (ordered ${m.ordered}, received ${m.received}, missing ${m.missing})`)
                      .join("; ")}`
                  : null,
              ]
                .filter(Boolean)
                .join("\n") || undefined
            }
            signatures={["QC Officer"]}
          />
        )}
      </SlipDialog>
    </>
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
