"use client";

import { useState } from "react";
import { useList, useDetail, useAction } from "@/lib/queries";
import type { SessionUser } from "@/lib/auth-shared";
import { PageHeader, EmptyState } from "../erp/primitives";
import { DataTable } from "../erp/data-table";
import { StatusBadge } from "../status-badge";
import { QcReportFormDialog } from "./qc-report-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ShieldCheck, Bell } from "lucide-react";
import { formatDate, parseJsonSafe } from "@/lib/format";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

export function GrnView({ user }: { user: SessionUser }) {
  const { data, isLoading } = useList<any>("grns");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const grns = data ?? [];
  const missingTax = grns.filter((g: any) => !g.taxInvoiceSubmitted);
  const canCreate = user.role === "STORE" || user.role === "ADMIN";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Goods Receiving Notes"
        description="GRNs created against delivered LPOs"
        actions={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> New GRN
            </Button>
          ) : null
        }
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            Pending tax invoices
            <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">
              {missingTax.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {missingTax.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">All GRNs have tax invoices submitted.</p>
          ) : (
            <DataTable
              data={missingTax}
              columns={[
                { key: "grnNo", header: "GRN" },
                { key: "lpo", header: "LPO", render: (g) => g.lpo?.lpoNo },
                { key: "supplier", header: "Supplier", render: (g) => g.lpo?.supplier?.name },
                { key: "receivedAt", header: "Received", render: (g) => formatDate(g.receivedAt) },
              ]}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">All GRNs</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DataTable
            loading={isLoading}
            data={grns}
            onRowClick={(g) => setDetailId(g.id)}
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

      <GrnDetailDialog id={detailId} onOpenChange={(v) => !v && setDetailId(null)} user={user} />
      {createOpen && <CreateGrnDialog open={createOpen} onOpenChange={setCreateOpen} />}
    </div>
  );
}

function GrnDetailDialog({ id, onOpenChange, user }: { id: string | null; onOpenChange: (v: boolean) => void; user: SessionUser }) {
  const { data: g, isLoading } = useDetail<any>("grn", id);
  const mutation = useAction();
  const [qcOpen, setQcOpen] = useState(false);
  const canMarkTax = (user.role === "STORE" || user.role === "ADMIN") && g && !g.taxInvoiceSubmitted;
  const docs = g ? parseJsonSafe<string[]>(g.documentsReceived, []) : [];

  return (
    <>
      <Dialog open={!!id} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{g?.grnNo ?? "GRN detail"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading…</p>
            ) : g ? (
              <div className="space-y-3 text-sm p-1">
                <div className="flex justify-between"><span className="text-muted-foreground">LPO</span><span>{g.lpo?.lpoNo}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Supplier</span><span>{g.lpo?.supplier?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Project</span><span>{g.project?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={g.status} /></div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Documents received</p>
                  <div className="flex gap-2">
                    {["deliveryNote", "taxInvoice", "lpo"].map((d) => (
                      <Badge
                        key={d}
                        variant="outline"
                        className={`text-[10px] ${docs.includes(d) ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}
                      >
                        {d}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax invoice no</span><span>{g.taxInvoiceNo || "—"}</span></div>
                {g.qcReport && (
                  <Card>
                    <CardContent className="p-3 text-xs space-y-1">
                      <p className="font-medium">QC report {g.qcReport.reportNo}</p>
                      <p>Status: {g.qcReport.status}</p>
                      {g.qcReport.remarks && <p>Remarks: {g.qcReport.remarks}</p>}
                    </CardContent>
                  </Card>
                )}
                {g.status === "QC_PENDING" && (user.role === "QC" || user.role === "ADMIN") && (
                  <Button className="w-full" onClick={() => setQcOpen(true)}>
                    <ShieldCheck className="size-4" /> Submit QC inspection
                  </Button>
                )}
                {canMarkTax && (
                  <Button
                    className="w-full bg-emerald-700 hover:bg-emerald-800"
                    disabled={mutation.isPending}
                    onClick={() =>
                      mutation.mutate(
                        { action: "update-grn", grnId: g.id, taxInvoiceSubmitted: true, taxInvoiceNo: "TI-" + Date.now().toString().slice(-6), status: g.status },
                        {
                          onSuccess: () => toast.success("Tax invoice marked submitted"),
                          onError: (e: any) => toast.error(e.message),
                        }
                      )
                    }
                  >
                    Mark tax invoice submitted
                  </Button>
                )}
                {(user.role === "STORE" || user.role === "ADMIN") && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => toast.info("Follow-up notification queued to procurement")}
                  >
                    <Bell className="size-4" /> Send follow-up
                  </Button>
                )}
              </div>
            ) : null}
          </ScrollArea>
        </DialogContent>
      </Dialog>
      {qcOpen && g && (
        <QcReportFormDialog
          open={qcOpen}
          onOpenChange={setQcOpen}
          type="DELIVERY_INSPECTION"
          refType="LPO"
          refId={g.lpoId}
          title={`QC — GRN ${g.grnNo}`}
        />
      )}
    </>
  );
}

function useLposForGrn() {
  return useQuery({
    queryKey: ["lpos-for-grn"],
    queryFn: async () => {
      const res = await fetch("/api/data?view=lpos");
      if (!res.ok) return [];
      return res.json();
    },
  });
}

function CreateGrnDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: lpos } = useLposForGrn();
  const mutation = useAction();
  const [lpoId, setLpoId] = useState("");
  const [docs, setDocs] = useState<Record<string, boolean>>({ deliveryNote: true, taxInvoice: false, lpo: true });
  const [taxInvoiceNo, setTaxInvoiceNo] = useState("");
  const [remarks, setRemarks] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New GRN</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-1.5">
            <Label>LPO *</Label>
            <Select value={lpoId} onValueChange={setLpoId}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Select LPO" /></SelectTrigger>
              <SelectContent>
                {(lpos ?? []).filter((l: any) => l.status !== "CLOSED").map((l: any) => (
                  <SelectItem key={l.id} value={l.id}>{l.lpoNo} — {l.supplier?.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Documents received</Label>
            {[
              { key: "deliveryNote", label: "Delivery note" },
              { key: "taxInvoice", label: "Tax invoice" },
              { key: "lpo", label: "LPO copy" },
            ].map((d) => (
              <div key={d.key} className="flex items-center gap-2">
                <Checkbox
                  id={d.key}
                  checked={docs[d.key]}
                  onCheckedChange={(v) => setDocs({ ...docs, [d.key]: !!v })}
                />
                <Label htmlFor={d.key} className="text-sm font-normal cursor-pointer">{d.label}</Label>
              </div>
            ))}
          </div>
          <div className="grid gap-1.5">
            <Label>Tax invoice no (if submitted)</Label>
            <Input value={taxInvoiceNo} onChange={(e) => setTaxInvoiceNo(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Remarks</Label>
            <Textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={mutation.isPending || !lpoId}
            onClick={() => {
              const docsReceived = Object.keys(docs).filter((k) => docs[k]);
              mutation.mutate(
                {
                  action: "create-grn",
                  lpoId,
                  documentsReceived: docsReceived,
                  taxInvoiceNo: taxInvoiceNo || null,
                  taxInvoiceSubmitted: docs.taxInvoice,
                  remarks,
                },
                {
                  onSuccess: () => { toast.success("GRN created — QC pending"); onOpenChange(false); },
                  onError: (e: any) => toast.error(e.message),
                }
              );
            }}
          >
            Create GRN
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
