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
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ArrowRightLeft, Plus } from "lucide-react";
import { formatCurrency, formatDate, parseJsonSafe } from "@/lib/format";
import { toast } from "sonner";

export function PrList({ user }: { user: SessionUser }) {
  const { data, isLoading } = useList<any>("prs");
  const [detailId, setDetailId] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <PageHeader title="Purchase Requests" description="PRs raised in SAP from approved supplier quotes" />
      <DataTable
        loading={isLoading}
        data={data}
        onRowClick={(p) => setDetailId(p.id)}
        columns={[
          { key: "prNo", header: "PR No" },
          { key: "project", header: "Project", render: (p) => p.project?.name },
          { key: "supplier", header: "Supplier", render: (p) => p.supplier?.name },
          { key: "totalAmount", header: "Amount", render: (p) => formatCurrency(p.totalAmount) },
          { key: "sapRef", header: "SAP ref", render: (p) => p.sapRef || "-" },
          { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
        ]}
      />
      <PrDetailDialog id={detailId} onOpenChange={(v) => !v && setDetailId(null)} user={user} />
    </div>
  );
}

function PrDetailDialog({ id, onOpenChange, user }: { id: string | null; onOpenChange: (v: boolean) => void; user: SessionUser }) {
  const { data: p, isLoading } = useDetail<any>("pr", id);
  const mutation = useAction();
  const [convertOpen, setConvertOpen] = useState(false);
  const [expected, setExpected] = useState("");
  const canAct = user.role === "PROCUREMENT" || user.role === "ADMIN";
  return (
    <>
      <Dialog open={!!id} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{p?.prNo ?? "PR detail"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading...</p>
            ) : p ? (
              <div className="space-y-3 text-sm p-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Project</span><span>{p.project?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Supplier</span><span>{p.supplier?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold text-amber-700">{formatCurrency(p.totalAmount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">SAP ref</span><span>{p.sapRef || "-"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={p.status} /></div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Items</p>
                  <pre className="text-xs bg-muted/40 rounded p-2 max-h-40 overflow-auto">{JSON.stringify(parseJsonSafe(p.itemsJson, []), null, 2)}</pre>
                </div>
                {canAct && p.status === "PENDING" && (
                  <Button
                    className="w-full bg-emerald-700 hover:bg-emerald-800"
                    disabled={mutation.isPending}
                    onClick={() =>
                      mutation.mutate(
                        { action: "approve-pr", prId: p.id },
                        {
                          onSuccess: () => toast.success("PR approved"),
                          onError: (e: any) => toast.error(e.message),
                        }
                      )
                    }
                  >
                    <CheckCircle2 className="size-4" /> Approve PR
                  </Button>
                )}
                {canAct && p.status === "APPROVED" && (
                  <Button className="w-full" disabled={mutation.isPending} onClick={() => setConvertOpen(true)}>
                    <ArrowRightLeft className="size-4" /> Convert to LPO
                  </Button>
                )}
              </div>
            ) : null}
          </ScrollArea>
        </DialogContent>
      </Dialog>
      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Convert to LPO</DialogTitle>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label>Expected delivery date</Label>
            <Input type="date" value={expected} onChange={(e) => setExpected(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertOpen(false)}>Cancel</Button>
            <Button
              disabled={mutation.isPending}
              onClick={() =>
                mutation.mutate(
                  { action: "convert-pr-to-lpo", prId: p.id, expectedDelivery: expected || undefined },
                  {
                    onSuccess: (data) => { toast.success(`LPO ${data.lpoNo} created`); setConvertOpen(false); onOpenChange(false); },
                    onError: (e: any) => toast.error(e.message),
                  }
                )
              }
            >
              Convert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
