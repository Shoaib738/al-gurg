"use client";

import { useState } from "react";
import { useList, useDetail, useAction } from "@/lib/queries";
import type { SessionUser } from "@/lib/auth-shared";
import { PageHeader } from "../erp/primitives";
import { DataTable } from "../erp/data-table";
import { StatusBadge } from "../status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

export function MrqList({ user }: { user: SessionUser }) {
  const { data, isLoading } = useList<any>("mrqs");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const canCreate = user.role === "PROCUREMENT" || user.role === "ADMIN";
  return (
    <div className="space-y-4">
      <PageHeader
        title="Material Requisitions"
        description="MRQs raised from BOQ for items unavailable in stock"
        actions={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> New MRQ
            </Button>
          ) : null
        }
      />
      <DataTable
        loading={isLoading}
        data={data}
        onRowClick={(m) => setDetailId(m.id)}
        columns={[
          { key: "mrqNo", header: "MRQ No" },
          { key: "project", header: "Project", render: (m) => m.project?.name },
          { key: "creator", header: "Raised by", render: (m) => m.creator?.name },
          { key: "items", header: "Items", render: (m) => m.items?.length ?? 0 },
          { key: "status", header: "Status", render: (m) => <StatusBadge status={m.status} /> },
          { key: "createdAt", header: "Created", render: (m) => formatDate(m.createdAt) },
        ]}
      />
      <MrqDetailDialog id={detailId} onOpenChange={(v) => !v && setDetailId(null)} user={user} />
      {createOpen && <CreateMrqDialog open={createOpen} onOpenChange={setCreateOpen} />}
    </div>
  );
}

function MrqDetailDialog({ id, onOpenChange, user }: { id: string | null; onOpenChange: (v: boolean) => void; user: SessionUser }) {
  const { data: m, isLoading } = useDetail<any>("mrq", id);
  const [sqOpen, setSqOpen] = useState(false);
  const canRequestQuote = user.role === "PROCUREMENT" || user.role === "ADMIN";
  return (
    <>
      <Dialog open={!!id} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{m?.mrqNo ?? "MRQ detail"}</DialogTitle>
            <DialogDescription>{m?.project?.name}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading...</p>
            ) : m ? (
              <div className="space-y-3 p-1">
                <div className="flex items-center justify-between">
                  <StatusBadge status={m.status} />
                  {canRequestQuote && (
                    <Button size="sm" onClick={() => setSqOpen(true)}>
                      <Plus className="size-3.5" /> Request supplier quote
                    </Button>
                  )}
                </div>
                <DataTable
                  data={m.items}
                  columns={[
                    { key: "description", header: "Description" },
                    { key: "spec", header: "Spec", render: (i: any) => i.spec || "-" },
                    { key: "qty", header: "Qty", render: (i: any) => `${i.qty} ${i.unit}` },
                    { key: "quotedPrice", header: "Quoted", render: (i: any) => i.quotedPrice ? formatCurrency(i.quotedPrice) : "-" },
                  ]}
                />
                {m.supplierQuotes?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1 uppercase">Supplier quotes</p>
                    <DataTable
                      data={m.supplierQuotes}
                      columns={[
                        { key: "supplier", header: "Supplier", render: (s: any) => s.supplier?.name },
                        { key: "totalAmount", header: "Amount", render: (s: any) => formatCurrency(s.totalAmount) },
                        { key: "deliveryDays", header: "Delivery", render: (s: any) => `${s.deliveryDays}d` },
                        { key: "status", header: "Status", render: (s: any) => <StatusBadge status={s.status} /> },
                      ]}
                    />
                  </div>
                )}
              </div>
            ) : null}
          </ScrollArea>
        </DialogContent>
      </Dialog>
      {sqOpen && m && (
        <CreateSupplierQuoteDialog
          open={sqOpen}
          onOpenChange={setSqOpen}
          mrqId={m.id}
        />
      )}
    </>
  );
}

function useProjectsAndSuppliers() {
  return useQuery({
    queryKey: ["projects-suppliers"],
    queryFn: async () => {
      const [p, s] = await Promise.all([
        fetch("/api/data?view=projects").then((r) => r.json()),
        fetch("/api/data?view=suppliers").then((r) => r.json()),
      ]);
      return { projects: Array.isArray(p) ? p : [], suppliers: Array.isArray(s) ? s : [] };
    },
  });
}

function CreateMrqDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const lookup = useProjectsAndSuppliers();
  const mutation = useAction();
  const [projectId, setProjectId] = useState("");
  const [boqId, setBoqId] = useState("");
  const [items, setItems] = useState([{ description: "", spec: "", qty: 1, unit: "piece" }]);

  const boqsForProject = (lookup.data?.projects ?? []).find((p: any) => p.id === projectId)?.boqs ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New material requisition</DialogTitle>
          <DialogDescription>Select a project and add items to procure.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-1.5">
            <Label>Project *</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>
                {(lookup.data?.projects ?? []).map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.projectNo} - {p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {boqsForProject.length > 0 && (
            <div className="grid gap-1.5">
              <Label>Linked BOQ (optional)</Label>
              <Select value={boqId} onValueChange={setBoqId}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Select BOQ" /></SelectTrigger>
                <SelectContent>
                  {boqsForProject.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>{b.boqNo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Items</Label>
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 gap-1">
                <Input
                  className="col-span-6 h-9 text-xs"
                  placeholder="Description"
                  value={it.description}
                  onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                />
                <Input
                  className="col-span-3 h-9 text-xs"
                  placeholder="Qty"
                  type="number"
                  value={it.qty}
                  onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, qty: Number(e.target.value) } : x))}
                />
                <Input
                  className="col-span-2 h-9 text-xs"
                  placeholder="Unit"
                  value={it.unit}
                  onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, unit: e.target.value } : x))}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="col-span-1 h-9"
                  onClick={() => setItems(items.filter((_, j) => j !== i))}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => setItems([...items, { description: "", spec: "", qty: 1, unit: "piece" }])}>
              <Plus className="size-3.5" /> Add item
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={mutation.isPending || !projectId}
            onClick={() =>
              mutation.mutate(
                { action: "create-mrq", projectId, boqId: boqId || null, items: items.filter((i) => i.description) },
                {
                  onSuccess: () => { toast.success("MRQ created"); onOpenChange(false); },
                  onError: (e: any) => toast.error(e.message),
                }
              )
            }
          >
            Create MRQ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateSupplierQuoteDialog({
  open,
  onOpenChange,
  mrqId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mrqId: string;
}) {
  const lookup = useProjectsAndSuppliers();
  const mutation = useAction();
  const [supplierId, setSupplierId] = useState("");
  const [total, setTotal] = useState(0);
  const [deliveryDays, setDeliveryDays] = useState(7);
  const [remarks, setRemarks] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request supplier quote</DialogTitle>
          <DialogDescription>Send an RFQ and record the supplier's offer.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-1.5">
            <Label>Supplier *</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Select supplier" /></SelectTrigger>
              <SelectContent>
                {(lookup.data?.suppliers ?? []).map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Total amount (AED)</Label>
              <Input type="number" value={total} onChange={(e) => setTotal(Number(e.target.value))} />
            </div>
            <div className="grid gap-1.5">
              <Label>Delivery (days)</Label>
              <Input type="number" value={deliveryDays} onChange={(e) => setDeliveryDays(Number(e.target.value))} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Remarks</Label>
            <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={mutation.isPending || !supplierId}
            onClick={() =>
              mutation.mutate(
                { action: "create-supplier-quote", mrqId, supplierId, totalAmount: total, deliveryDays, remarks },
                {
                  onSuccess: () => { toast.success("Supplier quote recorded"); onOpenChange(false); },
                  onError: (e: any) => toast.error(e.message),
                }
              )
            }
          >
            Save quote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
