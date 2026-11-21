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
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";

export function SupplierQuoteList({ user }: { user: SessionUser }) {
  const { data, isLoading } = useList<any>("supplier-quotes");
  const [detailId, setDetailId] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <PageHeader title="Supplier Quotes" description="Quotes received from suppliers against MRQs" />
      <DataTable
        loading={isLoading}
        data={data}
        onRowClick={(s) => setDetailId(s.id)}
        columns={[
          { key: "supplier", header: "Supplier", render: (s) => s.supplier?.name },
          { key: "mrq", header: "MRQ", render: (s) => s.mrq?.mrqNo },
          { key: "totalAmount", header: "Amount", render: (s) => formatCurrency(s.totalAmount) },
          { key: "deliveryDays", header: "Delivery", render: (s) => `${s.deliveryDays}d` },
          { key: "status", header: "Status", render: (s) => <StatusBadge status={s.status} /> },
          { key: "createdAt", header: "Created", render: (s) => formatDate(s.createdAt) },
        ]}
      />
      <SupplierQuoteDetailDialog id={detailId} onOpenChange={(v) => !v && setDetailId(null)} user={user} />
    </div>
  );
}

function SupplierQuoteDetailDialog({ id, onOpenChange, user }: { id: string | null; onOpenChange: (v: boolean) => void; user: SessionUser }) {
  const { data: s, isLoading } = useDetail<any>("supplier-quote", id);
  const mutation = useAction();
  const canApprove = (user.role === "BUSINESS_MANAGER" || user.role === "ADMIN") && s?.status === "PENDING";
  return (
    <Dialog open={!!id} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{s?.supplier?.name ?? "Supplier quote"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          {isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading...</p>
          ) : s ? (
            <div className="space-y-2 text-sm p-1">
              <div className="flex justify-between"><span className="text-muted-foreground">MRQ</span><span>{s.mrq?.mrqNo}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold text-amber-700">{formatCurrency(s.totalAmount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{s.deliveryDays} days</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={s.status} /></div>
              {s.remarks && <p className="text-xs text-muted-foreground">{s.remarks}</p>}
              {canApprove && (
                <Button
                  className="w-full mt-2 bg-emerald-700 hover:bg-emerald-800"
                  disabled={mutation.isPending}
                  onClick={() =>
                    mutation.mutate(
                      { action: "approve-supplier-quote", id: s.id },
                      {
                        onSuccess: () => { toast.success("Supplier quote approved"); onOpenChange(false); },
                        onError: (e: any) => toast.error(e.message),
                      }
                    )
                  }
                >
                  <CheckCircle2 className="size-4" /> Approve
                </Button>
              )}
            </div>
          ) : null}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
