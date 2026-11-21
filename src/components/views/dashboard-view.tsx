"use client";

import { useDashboard } from "@/lib/queries";
import type { SessionUser } from "@/lib/auth-shared";
import { PageHeader, StatCard, EmptyState, LoadingState } from "../erp/primitives";
import { DataTable } from "../erp/data-table";
import { StatusBadge } from "../status-badge";
import { TimelineStrip } from "../erp/timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  Building2,
  Package,
  Boxes,
  ClipboardList,
  FileText,
  FolderKanban,
  ShoppingCart,
  Warehouse,
  Factory,
  PencilRuler,
  Truck,
  Wallet,
  Flag,
  Clock,
  ShieldCheck,
  Receipt,
  ClipboardCheck,
  Hammer,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency, formatDate, formatRelativeTime, titleCase } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function DashboardView({
  role,
  view,
  user,
  navigate,
  setSelectedId,
}: {
  role: SessionUser["role"];
  view: string;
  user: SessionUser;
  navigate: (v: string) => void;
  setSelectedId: (id: string | null) => void;
}) {
  const { data, isLoading } = useDashboard<any>(`dashboard-${view}`);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingState rows={3} />
        <LoadingState rows={6} />
      </div>
    );
  }

  // Render tailored dashboard per view
  switch (view) {
    case "admin":
      return <AdminDashboard data={data} navigate={navigate} setSelectedId={setSelectedId} />;
    case "bm":
      return <BmDashboard data={data} setSelectedId={setSelectedId} navigate={navigate} />;
    case "estimation":
      return <EstimationDashboard data={data} setSelectedId={setSelectedId} navigate={navigate} />;
    case "sales":
      return <SalesDashboard data={data} setSelectedId={setSelectedId} navigate={navigate} />;
    case "procurement":
      return <ProcurementDashboard data={data} navigate={navigate} />;
    case "store":
      return <StoreDashboard data={data} />;
    case "qc":
      return <QcDashboard data={data} />;
    case "production":
      return <ProductionDashboard data={data} />;
    case "engineering":
      return <EngineeringDashboard data={data} />;
    case "project-dept":
      return <ProjectDeptDashboard data={data} />;
    case "finance":
      return <FinanceDashboard data={data} />;
    default:
      return <EmptyState title="Dashboard not configured" />;
  }
}

function AdminDashboard({
  data,
  navigate,
  setSelectedId,
}: {
  data: any;
  navigate: (v: string) => void;
  setSelectedId: (id: string | null) => void;
}) {
  const c = data?.counts ?? {};
  return (
    <div className="space-y-6">
      <PageHeader
        title="Administrator Dashboard"
        description="Cross-department operational overview"
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard label="Users" value={c.users} icon={Users} />
        <StatCard label="Clients" value={c.clients} icon={Building2} />
        <StatCard label="Suppliers" value={c.suppliers} icon={Package} />
        <StatCard label="Materials" value={c.materials} icon={Boxes} />
        <StatCard label="Enquiries" value={c.enquiries} icon={ClipboardList} />
        <StatCard label="Quotations" value={c.quotations} icon={FileText} />
        <StatCard
          label="Pending Approvals"
          value={c.pendingApprovals}
          icon={ShieldCheck}
          tone="amber"
        />
        <StatCard label="Projects" value={c.projects} icon={FolderKanban} tone="blue" />
        <StatCard label="BOQs" value={c.boqs} icon={ClipboardCheck} />
        <StatCard label="MRQs" value={c.mrqs} icon={ClipboardList} />
        <StatCard label="PRs" value={c.prs} icon={Receipt} />
        <StatCard label="LPOs" value={c.lpos} icon={ShoppingCart} />
        <StatCard label="GRNs" value={c.grns} icon={Warehouse} />
        <StatCard label="Production Orders" value={c.productionOrders} icon={Factory} />
        <StatCard label="Drawings" value={c.drawings} icon={PencilRuler} />
        <StatCard
          label="Open Red Flags"
          value={c.redFlags}
          icon={Flag}
          tone="red"
        />
        <StatCard
          label="Open Delays"
          value={c.delays}
          icon={Clock}
          tone="red"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Projects</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-96">
              <div className="divide-y">
                {(data?.recentProjects ?? []).map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedId(p.id);
                      navigate("projects");
                    }}
                    className="w-full text-left p-3 hover:bg-muted/40 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.projectNo}, {p.client?.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={p.status} />
                      <ArrowRight className="size-3.5 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-96">
              <div className="divide-y">
                {(data?.recentTimeline ?? []).map((e: any) => (
                  <div key={e.id} className="p-3">
                    <p className="text-sm">{e.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.project?.name ?? e.stage}, {formatRelativeTime(e.createdAt)}
                      {e.user?.name ? `, ${e.user.name}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BmDashboard({
  data,
  setSelectedId,
  navigate,
}: {
  data: any;
  setSelectedId: (id: string | null) => void;
  navigate: (v: string) => void;
}) {
  const projects = data?.projects ?? [];
  const pending = data?.pendingApprovals ?? [];
  const redFlags = data?.openRedFlags ?? [];
  const delays = data?.openDelays ?? [];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Manager Dashboard"
        description="Active projects, approvals & escalations"
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Active Projects" value={projects.length} icon={FolderKanban} tone="blue" />
        <StatCard label="Pending Approvals" value={pending.length} icon={ShieldCheck} tone="amber" />
        <StatCard label="Open Red Flags" value={redFlags.length} icon={Flag} tone="red" />
        <StatCard label="Open Delays" value={delays.length} icon={Clock} tone="red" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quotations awaiting your approval</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pending.length === 0 ? (
            <EmptyState title="No pending approvals" />
          ) : (
            <DataTable
              data={pending}
              columns={[
                {
                  key: "quotationNo",
                  header: "Quotation",
                  render: (q) => (
                    <button
                      className="font-medium text-amber-700 hover:underline"
                      onClick={() => {
                        setSelectedId(q.id);
                        navigate("quotations");
                      }}
                    >
                      {q.quotationNo}
                    </button>
                  ),
                },
                { key: "client", header: "Client", render: (q) => q.client?.name },
                { key: "total", header: "Total", render: (q) => formatCurrency(q.total) },
                {
                  key: "creator",
                  header: "Created by",
                  render: (q) => q.creator?.name,
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Flag className="size-4 text-red-600" /> Open Red Flags
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {redFlags.length === 0 ? (
              <EmptyState title="No red flags" />
            ) : (
              <ScrollArea className="max-h-80">
                <div className="divide-y">
                  {redFlags.map((r: any) => (
                    <div key={r.id} className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">
                          {r.project?.name}
                        </p>
                        <StatusBadge status={r.severity} />
                      </div>
                      <p className="text-xs text-muted-foreground">{r.reason}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="size-4 text-amber-600" /> Open Delays
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {delays.length === 0 ? (
              <EmptyState title="No delays" />
            ) : (
              <ScrollArea className="max-h-80">
                <div className="divide-y">
                  {delays.map((d: any) => (
                    <div key={d.id} className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">
                          {d.project?.name}
                        </p>
                        <Badge variant="outline" className="text-[10px]">
                          {d.daysDelayed}d
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{d.reason}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Projects</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={projects}
            onRowClick={(p) => {
              setSelectedId(p.id);
              navigate("projects");
            }}
            columns={[
              { key: "projectNo", header: "Project" },
              { key: "name", header: "Name" },
              { key: "client", header: "Client", render: (p) => p.client?.name },
              {
                key: "status",
                header: "Status",
                render: (p) => <StatusBadge status={p.status} />,
              },
              {
                key: "redFlags",
                header: "Flags",
                render: (p) =>
                  p.redFlags?.length ? (
                    <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">
                      {p.redFlags.length}
                    </Badge>
                  ) : (
                    "-"
                  ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function EstimationDashboard({
  data,
  setSelectedId,
  navigate,
}: {
  data: any;
  setSelectedId: (id: string | null) => void;
  navigate: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Estimation Dashboard"
        description="Enquiries pending quote, drafts, and approvals"
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Enquiries to quote" value={data?.enquiries?.length ?? 0} icon={ClipboardList} tone="amber" />
        <StatCard label="Draft quotations" value={data?.drafts?.length ?? 0} icon={FileText} />
        <StatCard label="Submitted for approval" value={data?.submittedForApproval?.length ?? 0} icon={ShieldCheck} tone="blue" />
        <StatCard label="Ready to release order" value={data?.orderReady?.length ?? 0} icon={ArrowRight} tone="green" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enquiries awaiting quotation</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={data?.enquiries}
            onRowClick={(e) => {
              setSelectedId(e.id);
              navigate("enquiries");
            }}
            columns={[
              { key: "enquiryNo", header: "Enquiry" },
              { key: "title", header: "Title" },
              { key: "client", header: "Client", render: (e) => e.client?.name },
              {
                key: "status",
                header: "Status",
                render: (e) => <StatusBadge status={e.status} />,
              },
              {
                key: "quotations",
                header: "Quoted?",
                render: (e) =>
                  e.quotations?.length ? `${e.quotations.length} draft` : "-",
              },
            ]}
          />
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Draft quotations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              data={data?.drafts}
              onRowClick={(q) => {
                setSelectedId(q.id);
                navigate("quotations");
              }}
              columns={[
                { key: "quotationNo", header: "Quotation" },
                { key: "client", header: "Client", render: (q) => q.client?.name },
                { key: "total", header: "Total", render: (q) => formatCurrency(q.total) },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ready to release order</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              data={data?.orderReady}
              onRowClick={(q) => {
                setSelectedId(q.id);
                navigate("quotations");
              }}
              columns={[
                { key: "quotationNo", header: "Quotation" },
                { key: "client", header: "Client", render: (q) => q.client?.name },
                { key: "status", header: "Status", render: (q) => <StatusBadge status={q.status} /> },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SalesDashboard({
  data,
  setSelectedId,
  navigate,
}: {
  data: any;
  setSelectedId: (id: string | null) => void;
  navigate: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title="Sales Dashboard" description="Your enquiries, sent quotations & signatures" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Enquiries" value={data?.enquiries?.length ?? 0} icon={ClipboardList} tone="blue" />
        <StatCard label="Sent to clients" value={data?.sent?.length ?? 0} icon={FileText} tone="amber" />
        <StatCard label="Awaiting signature" value={data?.sent?.length ?? 0} icon={Clock} tone="amber" />
        <StatCard label="Signed (ready to pay)" value={data?.signed?.length ?? 0} icon={Wallet} tone="green" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Quotations sent to clients</CardTitle></CardHeader>
          <CardContent className="p-0">
            <DataTable
              data={data?.sent}
              onRowClick={(q) => { setSelectedId(q.id); navigate("quotations"); }}
              columns={[
                { key: "quotationNo", header: "Quotation" },
                { key: "client", header: "Client", render: (q) => q.client?.name },
                { key: "total", header: "Total", render: (q) => formatCurrency(q.total) },
                { key: "sentAt", header: "Sent", render: (q) => formatDate(q.sentAt) },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Signed quotations</CardTitle></CardHeader>
          <CardContent className="p-0">
            <DataTable
              data={data?.signed}
              onRowClick={(q) => { setSelectedId(q.id); navigate("quotations"); }}
              columns={[
                { key: "quotationNo", header: "Quotation" },
                { key: "client", header: "Client", render: (q) => q.client?.name },
                { key: "total", header: "Total", render: (q) => formatCurrency(q.total) },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProcurementDashboard({ data, navigate }: { data: any; navigate: (v: string) => void }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Procurement Dashboard" description="BOQs, MRQs, supplier quotes, PRs and LPOs in flight" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Active BOQs" value={data?.boqs?.length ?? 0} icon={ClipboardCheck} tone="amber" />
        <StatCard label="Open MRQs" value={data?.mrqs?.length ?? 0} icon={ClipboardList} tone="blue" />
        <StatCard label="Quotes pending" value={data?.supplierQuotes?.length ?? 0} icon={FileText} tone="amber" />
        <StatCard label="PRs in flight" value={data?.prs?.length ?? 0} icon={Receipt} />
        <StatCard label="LPOs open" value={data?.lpos?.length ?? 0} icon={ShoppingCart} tone="green" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">BOQs in procurement</CardTitle></CardHeader>
          <CardContent className="p-0">
            <DataTable
              data={data?.boqs}
              columns={[
                { key: "boqNo", header: "BOQ" },
                { key: "project", header: "Project", render: (b) => b.project?.name },
                { key: "status", header: "Status", render: (b) => <StatusBadge status={b.status} /> },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Open MRQs</CardTitle></CardHeader>
          <CardContent className="p-0">
            <DataTable
              data={data?.mrqs}
              columns={[
                { key: "mrqNo", header: "MRQ" },
                { key: "project", header: "Project", render: (m) => m.project?.name },
                { key: "status", header: "Status", render: (m) => <StatusBadge status={m.status} /> },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Supplier quotes pending approval</CardTitle></CardHeader>
          <CardContent className="p-0">
            <DataTable
              data={data?.supplierQuotes}
              columns={[
                { key: "supplier", header: "Supplier", render: (s) => s.supplier?.name },
                { key: "totalAmount", header: "Amount", render: (s) => formatCurrency(s.totalAmount) },
                { key: "deliveryDays", header: "Delivery", render: (s) => `${s.deliveryDays}d` },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Purchase requests</CardTitle></CardHeader>
          <CardContent className="p-0">
            <DataTable
              data={data?.prs}
              columns={[
                { key: "prNo", header: "PR" },
                { key: "supplier", header: "Supplier", render: (p) => p.supplier?.name },
                { key: "totalAmount", header: "Amount", render: (p) => formatCurrency(p.totalAmount) },
                { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StoreDashboard({ data }: { data: any }) {
  const grns = data?.grns ?? [];
  const missing = data?.missingTax ?? [];
  const pendingQc = data?.pendingQc ?? [];
  return (
    <div className="space-y-6">
      <PageHeader title="Store & Warehouse Dashboard" description="GRNs, pending QC and missing tax invoices" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total GRNs" value={grns.length} icon={Warehouse} tone="blue" />
        <StatCard label="Pending QC" value={pendingQc.length} icon={ShieldCheck} tone="amber" />
        <StatCard label="Missing tax invoice" value={missing.length} icon={AlertTriangle} tone="red" />
        <StatCard label="LPOs sent (incoming)" value={data?.recent?.length ?? 0} icon={ShoppingCart} tone="green" />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Recent GRNs</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={grns}
            columns={[
              { key: "grnNo", header: "GRN" },
              { key: "lpo", header: "LPO", render: (g) => g.lpo?.lpoNo },
              { key: "supplier", header: "Supplier", render: (g) => g.lpo?.supplier?.name },
              { key: "status", header: "Status", render: (g) => <StatusBadge status={g.status} /> },
              {
                key: "tax",
                header: "Tax invoice",
                render: (g) =>
                  g.taxInvoiceSubmitted ? (
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Submitted</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">Missing</Badge>
                  ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function QcDashboard({ data }: { data: any }) {
  const pending = data?.pendingDelivery ?? [];
  const stages = data?.pendingStages ?? [];
  const reports = data?.reports ?? [];
  return (
    <div className="space-y-6">
      <PageHeader title="Quality Control Dashboard" description="Pending inspections & recent reports" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Delivery inspections pending" value={pending.length} icon={ClipboardCheck} tone="amber" />
        <StatCard label="Stage QC pending" value={stages.length} icon={Hammer} tone="amber" />
        <StatCard label="QC reports (recent)" value={reports.length} icon={ShieldCheck} tone="blue" />
        <StatCard label="Failed (recent)" value={reports.filter((r: any) => r.status === "FAILED").length} icon={AlertTriangle} tone="red" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Delivery inspections pending</CardTitle></CardHeader>
          <CardContent className="p-0">
            <DataTable
              data={pending}
              columns={[
                { key: "grnNo", header: "GRN" },
                { key: "lpo", header: "LPO", render: (g) => g.lpo?.lpoNo },
                { key: "supplier", header: "Supplier", render: (g) => g.lpo?.supplier?.name },
                { key: "receivedAt", header: "Received", render: (g) => formatDate(g.receivedAt) },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Stage QC pending</CardTitle></CardHeader>
          <CardContent className="p-0">
            <DataTable
              data={stages}
              columns={[
                { key: "stageName", header: "Stage" },
                { key: "productionOrder", header: "Order", render: (s) => s.productionOrder?.orderNo },
                { key: "project", header: "Project", render: (s) => s.productionOrder?.project?.name },
                { key: "completedAt", header: "Completed", render: (s) => formatDate(s.completedAt) },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProductionDashboard({ data }: { data: any }) {
  const orders = data?.orders ?? [];
  const active = data?.active ?? [];
  return (
    <div className="space-y-6">
      <PageHeader title="Production Dashboard" description="Joinery & metal production orders with stage progress" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total orders" value={orders.length} icon={Factory} tone="blue" />
        <StatCard label="Active" value={active.length} icon={Hammer} tone="amber" />
        <StatCard label="Joinery" value={orders.filter((o: any) => o.type === "JOINERY").length} icon={Factory} />
        <StatCard label="Metal" value={orders.filter((o: any) => o.type === "METAL").length} icon={Factory} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Active production orders</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={active}
            columns={[
              { key: "orderNo", header: "Order" },
              { key: "type", header: "Type", render: (o) => <Badge variant="outline" className="text-[10px]">{o.type}</Badge> },
              { key: "project", header: "Project", render: (o) => o.project?.name },
              {
                key: "progress",
                header: "Progress",
                render: (o) => {
                  const passed = o.stages?.filter((s: any) => ["QC_PASSED", "SKIPPED", "COMPLETED"].includes(s.status)).length ?? 0;
                  const total = o.stages?.length ?? 0;
                  return `${passed}/${total}`;
                },
              },
              { key: "dueDate", header: "Due", render: (o) => formatDate(o.dueDate) },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function EngineeringDashboard({ data }: { data: any }) {
  const drawings = data?.drawings ?? [];
  return (
    <div className="space-y-6">
      <PageHeader title="Engineering / Drafting Dashboard" description="Drawings in draft, submitted & awaiting client" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total drawings" value={drawings.length} icon={PencilRuler} tone="blue" />
        <StatCard label="Drafts" value={data?.drafts?.length ?? 0} icon={PencilRuler} />
        <StatCard label="In review" value={data?.submitted?.length ?? 0} icon={ShieldCheck} tone="amber" />
        <StatCard label="Awaiting client" value={data?.awaitingClient?.length ?? 0} icon={Clock} tone="amber" />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Drawings</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={drawings}
            columns={[
              { key: "drawingNo", header: "Drawing" },
              { key: "drawingType", header: "Type" },
              { key: "project", header: "Project", render: (d) => d.project?.name },
              { key: "status", header: "Status", render: (d) => <StatusBadge status={d.status} /> },
              { key: "createdAt", header: "Created", render: (d) => formatDate(d.createdAt) },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectDeptDashboard({ data }: { data: any }) {
  const projects = data?.projects ?? [];
  return (
    <div className="space-y-6">
      <PageHeader title="Project Department Dashboard" description="Projects ready for delivery, installation & feedback" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="In delivery/install" value={projects.length} icon={Truck} tone="blue" />
        <StatCard label="Awaiting feedback" value={projects.filter((p: any) => p.status === "FEEDBACK_PENDING").length} icon={ClipboardCheck} tone="amber" />
        <StatCard label="Installed" value={projects.filter((p: any) => p.status === "INSTALLED").length} icon={Hammer} tone="green" />
        <StatCard label="Delivered" value={projects.filter((p: any) => p.status === "DELIVERED").length} icon={Truck} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Projects in delivery / installation phase</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={projects}
            columns={[
              { key: "projectNo", header: "Project" },
              { key: "name", header: "Name" },
              { key: "client", header: "Client", render: (p) => p.client?.name },
              { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
              {
                key: "ack",
                header: "Delivery",
                render: (p) => (p.deliveryAck ? "Signed" : "-"),
              },
              {
                key: "inst",
                header: "Installation",
                render: (p) =>
                  p.installation ? <StatusBadge status={p.installation.status} /> : "-",
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function FinanceDashboard({ data }: { data: any }) {
  const links = data?.paymentLinks ?? [];
  return (
    <div className="space-y-6">
      <PageHeader title="Finance & Accounts Dashboard" description="Payment links and projects ready for final claim" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Payment links" value={links.length} icon={Wallet} tone="blue" />
        <StatCard label="Paid" value={data?.paid ?? 0} icon={Wallet} tone="green" />
        <StatCard label="Pending" value={data?.pending ?? 0} icon={Clock} tone="amber" />
        <StatCard label="Ready for final claim" value={data?.readyForFinal?.length ?? 0} icon={Flag} tone="amber" />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Payment links</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={links}
            columns={[
              { key: "linkRef", header: "Link ref" },
              { key: "project", header: "Project", render: (p) => p.project?.name },
              { key: "amount", header: "Amount", render: (p) => formatCurrency(p.amount) },
              { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
              { key: "paidAt", header: "Paid", render: (p) => formatDate(p.paidAt) },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
