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
import { Send, Printer } from "lucide-react";
import { formatCurrency, formatDate, parseJsonSafe } from "@/lib/format";
import { toast } from "sonner";
import { EmailPreviewDialog } from "../erp/email-preview";
import { SlipDocument, SlipDialog } from "../slip-document";

export function LpoList({ user }: { user: SessionUser }) {
  const { data, isLoading } = useList<any>("lpos");
  const [detailId, setDetailId] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <PageHeader title="Local Purchase Orders" description="LPOs issued to suppliers (CC to Store)" />
      <DataTable
        loading={isLoading}
        data={data}
        onRowClick={(l) => setDetailId(l.id)}
        columns={[
          { key: "lpoNo", header: "LPO No" },
          { key: "project", header: "Project", render: (l) => l.project?.name },
          { key: "supplier", header: "Supplier", render: (l) => l.supplier?.name },
          { key: "totalAmount", header: "Amount", render: (l) => formatCurrency(l.totalAmount) },
          { key: "status", header: "Status", render: (l) => <StatusBadge status={l.status} /> },
          { key: "expectedDelivery", header: "Expected", render: (l) => formatDate(l.expectedDelivery) },
        ]}
      />
      <LpoDetailDialog id={detailId} onOpenChange={(v) => !v && setDetailId(null)} user={user} />
    </div>
  );
}

function LpoDetailDialog({ id, onOpenChange, user }: { id: string | null; onOpenChange: (v: boolean) => void; user: SessionUser }) {
  const { data: l, isLoading } = useDetail<any>("lpo", id);
  const mutation = useAction();
  const [email, setEmail] = useState<any>(null);
  const [slipOpen, setSlipOpen] = useState(false);
  const canSend = (user.role === "PROCUREMENT" || user.role === "ADMIN") && l?.status === "ISSUED";
  const prItems: any[] = l?.pr ? parseJsonSafe<any[]>(l.pr.itemsJson, []) : [];
  return (
    <>
      <Dialog open={!!id} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{l?.lpoNo ?? "LPO detail"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading...</p>
            ) : l ? (
              <div className="space-y-3 text-sm p-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Supplier</span><span>{l.supplier?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Project</span><span>{l.project?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold text-amber-700">{formatCurrency(l.totalAmount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Expected</span><span>{formatDate(l.expectedDelivery)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={l.status} /></div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button variant="outline" onClick={() => setSlipOpen(true)}>
                    <Printer className="size-4" /> Print LPO
                  </Button>
                  {canSend && (
                    <Button
                      disabled={mutation.isPending}
                      onClick={() =>
                        mutation.mutate(
                          { action: "send-lpo", lpoId: l.id },
                          {
                            onSuccess: (data) => {
                              toast.success("LPO sent to supplier");
                              if (data?.email) setEmail(data.email);
                            },
                            onError: (e: any) => toast.error(e.message),
                          }
                        )
                      }
                    >
                      <Send className="size-4" /> Send to supplier
                    </Button>
                  )}
                </div>
              </div>
            ) : null}
          </ScrollArea>
        </DialogContent>
      </Dialog>
      {l && (
        <SlipDialog open={slipOpen} onOpenChange={setSlipOpen} title={`LPO ${l.lpoNo}`}>
          <SlipDocument
            title="LOCAL PURCHASE ORDER"
            documentNo={l.lpoNo}
            date={formatDate(l.sentAt ?? l.createdAt)}
            status={(l.status || "").replace(/_/g, " ")}
            fromName="Al Gurg Group"
            fromAddress="Procurement Department, Al Quoz Industrial Area 3, Dubai, UAE"
            fromContact="procurement@algurggroup.ae  |  +971 4 000 0000"
            toLabel="Supplier"
            toName={l.supplier?.name}
            toAddress={l.supplier?.contactPerson ? `Attn: ${l.supplier.contactPerson}` : ""}
            toContact={
              [l.supplier?.phone, l.supplier?.email].filter(Boolean).join("  |  ") || ""
            }
            infoRows={[
              { label: "LPO no", value: l.lpoNo },
              { label: "PR no", value: l.pr?.prNo ?? "-" },
              { label: "Project", value: l.project?.name ?? "-" },
              { label: "Project no", value: l.project?.projectNo ?? "-" },
              { label: "Supplier", value: l.supplier?.name ?? "-" },
              { label: "Expected delivery", value: formatDate(l.expectedDelivery) },
              { label: "Sent date", value: formatDate(l.sentAt) },
              { label: "Status", value: (l.status || "").replace(/_/g, " ") },
            ]}
            items={{
              headers: ["#", "Description", "Qty", "Unit", "Unit Price", "Total"],
              amountColumnIndex: 5,
              rows: prItems.map((it: any, idx: number) => {
                const qty = Number(it.qty) || 0;
                const unitPrice = Number(it.unitPrice) || 0;
                return [
                  idx + 1,
                  it.description || "-",
                  qty,
                  it.unit || "-",
                  formatCurrency(unitPrice),
                  formatCurrency(qty * unitPrice),
                ];
              }),
              totals: [
                { label: "Total amount", value: formatCurrency(l.totalAmount) },
              ],
            }}
            notes="Please deliver the materials as per the specifications above. Goods will be inspected on arrival by the Store Department and QC. Please include delivery note, tax invoice and a copy of this LPO. Payment terms as agreed."
            signatures={["Procurement Head", "Business Manager"]}
          />
        </SlipDialog>
      )}
      <EmailPreviewDialog open={!!email} onOpenChange={(v) => !v && setEmail(null)} email={email} />
    </>
  );
}
