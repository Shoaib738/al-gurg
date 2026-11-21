"use client";

import { useDetail, useAction } from "@/lib/queries";
import type { SessionUser } from "@/lib/auth-shared";
import { PageHeader, EmptyState } from "../erp/primitives";
import { StatusBadge } from "../status-badge";
import { TimelineStrip } from "../erp/timeline";
import { ProductionStageStepper } from "./production-stage-stepper";
import { QcReportFormDialog } from "./qc-report-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "../erp/data-table";
import {
  ArrowLeft,
  Factory,
  Flag,
  Truck,
  Wallet,
  ClipboardCheck,
  PencilRuler,
  ShoppingCart,
  FileText,
  Star,
  Plus,
} from "lucide-react";
import { formatCurrency, formatDate, formatDateTime, parseJsonSafe } from "@/lib/format";
import { toast } from "sonner";
import { useState } from "react";

export function ProjectDetail({
  id,
  user,
  onBack,
  navigate,
}: {
  id: string;
  user: SessionUser;
  onBack: () => void;
  navigate: (v: string) => void;
}) {
  const { data: p, isLoading } = useDetail<any>("project", id);

  if (isLoading || !p) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        <div className="h-48 rounded-md bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="size-4" /> Back to projects
      </Button>
      <PageHeader
        title={p.name}
        description={`${p.projectNo} · ${p.client?.name}`}
        actions={<StatusBadge status={p.status} />}
      />

      <Tabs defaultValue="overview">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-max">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quotation">Quotation</TabsTrigger>
            <TabsTrigger value="boq">BOQ</TabsTrigger>
            <TabsTrigger value="procurement">Procurement</TabsTrigger>
            <TabsTrigger value="store">Store</TabsTrigger>
            <TabsTrigger value="production">Production</TabsTrigger>
            <TabsTrigger value="engineering">Engineering</TabsTrigger>
            <TabsTrigger value="delivery">Delivery/Install</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="flags">Flags &amp; Delays</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
        </ScrollArea>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab p={p} />
        </TabsContent>
        <TabsContent value="quotation" className="mt-4">
          <QuotationTab p={p} />
        </TabsContent>
        <TabsContent value="boq" className="mt-4">
          <BoqTab p={p} user={user} />
        </TabsContent>
        <TabsContent value="procurement" className="mt-4">
          <ProcurementTab p={p} user={user} navigate={navigate} />
        </TabsContent>
        <TabsContent value="store" className="mt-4">
          <StoreTab p={p} />
        </TabsContent>
        <TabsContent value="production" className="mt-4">
          <ProductionTab p={p} user={user} />
        </TabsContent>
        <TabsContent value="engineering" className="mt-4">
          <EngineeringTab p={p} user={user} />
        </TabsContent>
        <TabsContent value="delivery" className="mt-4">
          <DeliveryTab p={p} user={user} />
        </TabsContent>
        <TabsContent value="feedback" className="mt-4">
          <FeedbackTab p={p} user={user} />
        </TabsContent>
        <TabsContent value="flags" className="mt-4">
          <FlagsTab p={p} user={user} />
        </TabsContent>
        <TabsContent value="timeline" className="mt-4">
          <TimelineStrip events={p.timeline} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTab({ p }: { p: any }) {
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 space-y-1 text-sm">
            <p className="text-xs text-muted-foreground">Client</p>
            <p className="font-medium">{p.client?.name}</p>
            <p className="text-xs text-muted-foreground">{p.client?.email || "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1 text-sm">
            <p className="text-xs text-muted-foreground">Dates</p>
            <p>Start: <span className="font-medium">{formatDate(p.startDate)}</span></p>
            <p>Due: <span className="font-medium">{formatDate(p.dueDate)}</span></p>
            <p>Delivery: <span className="font-medium">{formatDate(p.deliveryDate)}</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1 text-sm">
            <p className="text-xs text-muted-foreground">Status</p>
            <StatusBadge status={p.status} />
            <p className="text-xs text-muted-foreground mt-1">Type: {p.type}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1 text-sm">
            <p className="text-xs text-muted-foreground">Value</p>
            <p className="text-lg font-bold text-amber-700">{formatCurrency(p.quotation?.total ?? 0)}</p>
            <p className="text-xs text-muted-foreground">{p.quotation?.quotationNo ?? "—"}</p>
          </CardContent>
        </Card>
      </div>
      <TimelineStrip events={p.timeline} />
    </div>
  );
}

function QuotationTab({ p }: { p: any }) {
  const q = p.quotation;
  if (!q) return <EmptyState title="No quotation linked" />;
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">{q.quotationNo} · <StatusBadge status={q.status} /></CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold text-amber-700">{formatCurrency(q.total)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Payment terms</span><span>{q.paymentTerms}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{q.deliveryWeeks} weeks</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Warranty</span><span>{q.warranty}</span></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">Items</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={q.items}
            columns={[
              { key: "lineNumber", header: "#" },
              { key: "description", header: "Description" },
              { key: "qty", header: "Qty", render: (i: any) => `${i.qty} ${i.unit}` },
              { key: "unitPrice", header: "Unit", render: (i: any) => formatCurrency(i.unitPrice) },
              { key: "total", header: "Total", render: (i: any) => formatCurrency(i.total) },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function BoqTab({ p, user }: { p: any; user: SessionUser }) {
  const canIssue = user.role === "ESTIMATION" || user.role === "ADMIN";
  const canCreate = canIssue;
  return (
    <div className="space-y-4">
      {(p.boqs ?? []).length === 0 ? (
        <EmptyState
          title="No BOQ yet"
          description="Estimation can generate a BOQ-M from the approved quotation."
        />
      ) : (
        p.boqs.map((b: any) => (
          <Card key={b.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{b.boqNo}</CardTitle>
                <div className="flex items-center gap-2">
                  <StatusBadge status={b.status} />
                  {canIssue && b.status === "DRAFT" && (
                    <IssueBoqButton boqId={b.id} />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                data={b.items}
                columns={[
                  { key: "description", header: "Description" },
                  { key: "spec", header: "Spec", render: (i: any) => i.spec || "—" },
                  { key: "qty", header: "Qty", render: (i: any) => `${i.qty} ${i.unit}` },
                  {
                    key: "available",
                    header: "Stock",
                    render: (i: any) =>
                      i.available ? (
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Available</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">To procure</Badge>
                      ),
                  },
                ]}
              />
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function IssueBoqButton({ boqId }: { boqId: string }) {
  const mutation = useAction();
  return (
    <Button
      size="sm"
      disabled={mutation.isPending}
      onClick={() =>
        mutation.mutate(
          { action: "issue-boq", boqId },
          {
            onSuccess: () => toast.success("BOQ issued to procurement"),
            onError: (e: any) => toast.error(e.message),
          }
        )
      }
    >
      Issue to procurement
    </Button>
  );
}

function ProcurementTab({ p, user, navigate }: { p: any; user: SessionUser; navigate: (v: string) => void }) {
  const allSupplierQuotes = (p.mrqs ?? []).flatMap((m: any) => m.supplierQuotes ?? []);
  return (
    <div className="space-y-4">
      <Section
        title="MRQs"
        icon={ClipboardCheck}
        count={p.mrqs?.length}
        action={
          <Button size="sm" variant="outline" onClick={() => navigate("mrqs")}>
            Open MRQ list
          </Button>
        }
      >
        <DataTable
          data={p.mrqs}
          onRowClick={() => navigate("mrqs")}
          columns={[
            { key: "mrqNo", header: "MRQ" },
            { key: "status", header: "Status", render: (m: any) => <StatusBadge status={m.status} /> },
            { key: "items", header: "Items", render: (m: any) => m.items?.length ?? 0 },
          ]}
        />
      </Section>
      <Section title="Supplier quotes" icon={FileText} count={allSupplierQuotes.length}>
        <DataTable
          data={allSupplierQuotes}
          columns={[
            { key: "supplier", header: "Supplier", render: (s: any) => s.supplier?.name },
            { key: "totalAmount", header: "Amount", render: (s: any) => formatCurrency(s.totalAmount) },
            { key: "deliveryDays", header: "Delivery", render: (s: any) => `${s.deliveryDays}d` },
            { key: "status", header: "Status", render: (s: any) => <StatusBadge status={s.status} /> },
          ]}
        />
      </Section>
      <Section title="Purchase requests" icon={ShoppingCart} count={p.prs?.length}>
        <DataTable
          data={p.prs}
          columns={[
            { key: "prNo", header: "PR" },
            { key: "supplier", header: "Supplier", render: (r: any) => r.supplier?.name },
            { key: "totalAmount", header: "Amount", render: (r: any) => formatCurrency(r.totalAmount) },
            { key: "status", header: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
          ]}
        />
      </Section>
      <Section title="LPOs" icon={ShoppingCart} count={p.lpos?.length}>
        <DataTable
          data={p.lpos}
          columns={[
            { key: "lpoNo", header: "LPO" },
            { key: "supplier", header: "Supplier", render: (l: any) => l.supplier?.name },
            { key: "totalAmount", header: "Amount", render: (l: any) => formatCurrency(l.totalAmount) },
            { key: "status", header: "Status", render: (l: any) => <StatusBadge status={l.status} /> },
            { key: "expectedDelivery", header: "Expected", render: (l: any) => formatDate(l.expectedDelivery) },
          ]}
        />
      </Section>
    </div>
  );
}

function StoreTab({ p }: { p: any }) {
  return (
    <div className="space-y-4">
      <Section title="GRNs" icon={ClipboardCheck} count={p.grns?.length}>
        <DataTable
          data={p.grns}
          columns={[
            { key: "grnNo", header: "GRN" },
            { key: "lpo", header: "LPO", render: (g: any) => g.lpo?.lpoNo },
            { key: "supplier", header: "Supplier", render: (g: any) => g.lpo?.supplier?.name },
            { key: "status", header: "Status", render: (g: any) => <StatusBadge status={g.status} /> },
            {
              key: "docs",
              header: "Docs",
              render: (g: any) => {
                const docs = parseJsonSafe<string[]>(g.documentsReceived, []);
                return (
                  <div className="flex gap-1">
                    {["deliveryNote", "taxInvoice", "lpo"].map((d) => (
                      <Badge
                        key={d}
                        variant="outline"
                        className={`text-[9px] ${
                          docs.includes(d)
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {d === "deliveryNote" ? "DN" : d === "taxInvoice" ? "TI" : "LPO"}
                      </Badge>
                    ))}
                  </div>
                );
              },
            },
          ]}
        />
      </Section>
      <Section title="QC reports (delivery)" icon={ClipboardCheck} count={p.grns?.filter((g: any) => g.qcReport).length}>
        <DataTable
          data={p.grns?.filter((g: any) => g.qcReport).map((g: any) => ({ ...g.qcReport, grnNo: g.grnNo }))}
          columns={[
            { key: "reportNo", header: "Report" },
            { key: "grnNo", header: "GRN" },
            { key: "status", header: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
            { key: "remarks", header: "Remarks", render: (r: any) => r.remarks || "—" },
          ]}
        />
      </Section>
    </div>
  );
}

function ProductionTab({ p, user }: { p: any; user: SessionUser }) {
  const [qcTarget, setQcTarget] = useState<{ stageId: string; stageName: string } | null>(null);
  return (
    <div className="space-y-4">
      {(p.productionOrders ?? []).length === 0 ? (
        <EmptyState
          title="No production orders"
          description="Production or estimation can release joinery/metal production orders."
        />
      ) : (
        p.productionOrders.map((o: any) => (
          <ProductionStageStepper
            key={o.id}
            order={o}
            user={user}
            onQcOpen={(stageId, stageName) => setQcTarget({ stageId, stageName })}
          />
        ))
      )}
      {qcTarget && (
        <QcReportFormDialog
          open={!!qcTarget}
          onOpenChange={(v) => !v && setQcTarget(null)}
          type="PRODUCTION_STAGE"
          refType="ProductionStage"
          refId={qcTarget.stageId}
          productionStageId={qcTarget.stageId}
          title={`QC — ${qcTarget.stageName}`}
        />
      )}
    </div>
  );
}

function EngineeringTab({ p, user }: { p: any; user: SessionUser }) {
  return (
    <div className="space-y-4">
      <Section title="Drawings" icon={PencilRuler} count={p.drawings?.length}>
        <DataTable
          data={p.drawings}
          columns={[
            { key: "drawingNo", header: "Drawing" },
            { key: "drawingType", header: "Type" },
            { key: "status", header: "Status", render: (d: any) => <StatusBadge status={d.status} /> },
            { key: "drawnBy", header: "Drawn by", render: (d: any) => d.drawnBy?.name },
            { key: "createdAt", header: "Created", render: (d: any) => formatDate(d.createdAt) },
          ]}
        />
      </Section>
    </div>
  );
}

function DeliveryTab({ p, user }: { p: any; user: SessionUser }) {
  const canAct = user.role === "PROJECT" || user.role === "ADMIN";
  const ack = p.deliveryAck;
  const inst = p.installation;
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Truck className="size-4" /> Delivery acknowledgement</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          {ack ? (
            <>
              <Row label="Delivered by" value={ack.deliverer?.name} />
              <Row label="Delivered at" value={formatDateTime(ack.deliveredAt)} />
              <Row label="Client signed" value={ack.clientSigned ? "Yes" : "No"} />
              <Row label="Remarks" value={ack.remarks || "—"} />
            </>
          ) : (
            <p className="text-muted-foreground">No delivery acknowledgement yet.</p>
          )}
          {canAct && !ack && (
            <SimpleActionButton
              label="Acknowledge delivery"
              action="create-delivery-ack"
              payload={{ projectId: p.id, clientSigned: true }}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Factory className="size-4" /> Installation</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          {inst ? (
            <>
              <Row label="Team lead" value={inst.teamLead?.name} />
              <Row label="Started" value={formatDateTime(inst.startedAt)} />
              <Row label="Completed" value={formatDateTime(inst.completedAt)} />
              <div className="pt-1"><StatusBadge status={inst.status} /></div>
            </>
          ) : (
            <p className="text-muted-foreground">No installation record yet.</p>
          )}
          {canAct && !inst && (
            <SimpleActionButton
              label="Start installation"
              action="create-installation"
              payload={{ projectId: p.id }}
            />
          )}
          {canAct && inst && inst.status !== "COMPLETED" && (
            <SimpleActionButton
              label="Complete installation"
              action="complete-installation"
              payload={{ id: inst.id }}
              className="bg-emerald-700 hover:bg-emerald-800"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FeedbackTab({ p, user }: { p: any; user: SessionUser }) {
  const fb = p.feedback;
  const canSubmit = user.role === "PROJECT" || user.role === "ADMIN";
  const ratings = fb ? parseJsonSafe<Record<string, number>>(fb.ratingsJson, {}) : {};
  return (
    <div className="space-y-4">
      {fb ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Customer feedback</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(["quality", "timeliness", "installation", "communication", "overall"] as const).map((k) => (
              <div key={k} className="flex items-center gap-2">
                <span className="w-28 capitalize text-muted-foreground">{k}</span>
                <Stars value={ratings[k] ?? 0} />
              </div>
            ))}
            {fb.comments && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">Comments</p>
                <p>{fb.comments}</p>
              </div>
            )}
            {fb.recommendation && (
              <div>
                <p className="text-xs text-muted-foreground">Recommendation</p>
                <p>{fb.recommendation}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : canSubmit ? (
        <FeedbackForm projectId={p.id} />
      ) : (
        <EmptyState title="No feedback yet" />
      )}
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-4 ${i < value ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function FeedbackForm({ projectId }: { projectId: string }) {
  const [ratings, setRatings] = useState<Record<string, number>>({
    quality: 5, timeliness: 5, installation: 5, communication: 5, overall: 5,
  });
  const [comments, setComments] = useState("");
  const mutation = useAction();
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Submit customer feedback</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        {(["quality", "timeliness", "installation", "communication", "overall"] as const).map((k) => (
          <div key={k} className="flex items-center gap-2">
            <span className="w-28 capitalize">{k}</span>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRatings({ ...ratings, [k]: i + 1 })}
                >
                  <Star className={`size-5 ${i < ratings[k] ? "fill-amber-500 text-amber-500" : "text-muted-foreground/40"}`} />
                </button>
              ))}
            </div>
          </div>
        ))}
        <Textarea
          rows={3}
          placeholder="Comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />
        <Button
          disabled={mutation.isPending}
          onClick={() =>
            mutation.mutate(
              { action: "create-feedback", projectId, ratings, comments },
              {
                onSuccess: () => toast.success("Feedback submitted"),
                onError: (e: any) => toast.error(e.message),
              }
            )
          }
        >
          Submit feedback
        </Button>
      </CardContent>
    </Card>
  );
}

function FlagsTab({ p, user }: { p: any; user: SessionUser }) {
  const canRaise = true; // any department
  return (
    <div className="space-y-4">
      <Section title="Red flags" icon={Flag} count={p.redFlags?.length}>
        <DataTable
          data={p.redFlags}
          columns={[
            { key: "department", header: "Dept" },
            { key: "reason", header: "Reason" },
            { key: "severity", header: "Severity", render: (r: any) => <StatusBadge status={r.severity} /> },
            { key: "daysDelayed", header: "Days", render: (r: any) => r.daysDelayed },
            {
              key: "resolved",
              header: "Resolved",
              render: (r: any) =>
                r.resolved ? (
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Yes</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Open</Badge>
                ),
            },
          ]}
        />
      </Section>
      <Section title="Delays" icon={Flag} count={p.delays?.length}>
        <DataTable
          data={p.delays}
          columns={[
            { key: "department", header: "Dept" },
            { key: "reason", header: "Reason" },
            { key: "daysDelayed", header: "Days" },
            { key: "status", header: "Status", render: (d: any) => <StatusBadge status={d.status} /> },
          ]}
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  count,
  children,
  action,
}: {
  title: string;
  icon?: any;
  count?: number;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {Icon && <Icon className="size-4" />}
            {title}
            {count != null && (
              <Badge variant="secondary" className="text-[10px]">{count}</Badge>
            )}
          </CardTitle>
          {action}
        </div>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}

function SimpleActionButton({
  label,
  action,
  payload,
  className,
}: {
  label: string;
  action: string;
  payload: Record<string, any>;
  className?: string;
}) {
  const mutation = useAction();
  return (
    <Button
      size="sm"
      className={className}
      disabled={mutation.isPending}
      onClick={() =>
        mutation.mutate({ action, ...payload }, {
          onSuccess: () => toast.success("Done"),
          onError: (e: any) => toast.error(e.message),
        })
      }
    >
      {label}
    </Button>
  );
}
