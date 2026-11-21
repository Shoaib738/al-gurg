"use client";

import { useState } from "react";
import { useList, useDetail, useAction } from "@/lib/queries";
import type { SessionUser } from "@/lib/auth-shared";
import { PageHeader, EmptyState } from "../erp/primitives";
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
import { Plus, ArrowLeft, Printer } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { SlipDocument, SlipDialog } from "../slip-document";

export function BoqList({ user, navigate }: { user: SessionUser; navigate: (v: string) => void }) {
  const { data, isLoading } = useList<any>("boqs");
  const [detailId, setDetailId] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <PageHeader title="Bill of Quantities" description="BOQ-M issued by Estimation for procurement" />
      <DataTable
        loading={isLoading}
        data={data}
        onRowClick={(b) => setDetailId(b.id)}
        columns={[
          { key: "boqNo", header: "BOQ No", render: (b) => <span className="font-medium">{b.boqNo}</span> },
          { key: "project", header: "Project", render: (b) => b.project?.name },
          { key: "issuer", header: "Issued by", render: (b) => b.issuer?.name },
          { key: "status", header: "Status", render: (b) => <StatusBadge status={b.status} /> },
          { key: "issuedAt", header: "Issued", render: (b) => formatDate(b.issuedAt) },
        ]}
      />
      <BoqDetailDialog id={detailId} onOpenChange={(v) => !v && setDetailId(null)} user={user} />
    </div>
  );
}

function BoqDetailDialog({ id, onOpenChange, user }: { id: string | null; onOpenChange: (v: boolean) => void; user: SessionUser }) {
  const { data: b, isLoading } = useDetail<any>("boq", id);
  const mutation = useAction();
  const [slipOpen, setSlipOpen] = useState(false);
  const canIssue = (user.role === "ESTIMATION" || user.role === "ADMIN") && b?.status === "DRAFT";
  return (
    <>
      <Dialog open={!!id} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{b?.boqNo ?? "BOQ detail"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading...</p>
            ) : b ? (
              <div className="space-y-3 p-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{b.project?.name}, {b.project?.projectNo}</span>
                  <StatusBadge status={b.status} />
                </div>
                <DataTable
                  data={b.items}
                  columns={[
                    { key: "description", header: "Description" },
                    { key: "spec", header: "Spec", render: (i: any) => i.spec || "-" },
                    { key: "qty", header: "Qty", render: (i: any) => `${i.qty} ${i.unit}` },
                    {
                      key: "available",
                      header: "Stock",
                      render: (i: any) => (i.available ? "Available" : "Procure"),
                    },
                  ]}
                />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setSlipOpen(true)}>
                    <Printer className="size-4" /> Print BOQ
                  </Button>
                  {canIssue && (
                    <Button
                      disabled={mutation.isPending}
                      onClick={() =>
                        mutation.mutate(
                          { action: "issue-boq", boqId: b.id },
                          {
                            onSuccess: () => {
                              toast.success("BOQ issued to procurement");
                              onOpenChange(false);
                            },
                            onError: (e: any) => toast.error(e.message),
                          }
                        )
                      }
                    >
                      Issue to procurement
                    </Button>
                  )}
                </div>
              </div>
            ) : null}
          </ScrollArea>
        </DialogContent>
      </Dialog>
      {b && (
        <SlipDialog
          open={slipOpen}
          onOpenChange={setSlipOpen}
          title={`BOQ ${b.boqNo}`}
        >
          <SlipDocument
            title="BILL OF QUANTITY (MATERIAL)"
            documentNo={b.boqNo}
            date={formatDate(b.issuedAt ?? b.createdAt)}
            status={(b.status || "").replace(/_/g, " ")}
            fromName="Al Gurg Group"
            fromAddress="Estimation Department, Al Quoz Industrial Area 3, Dubai, UAE"
            fromContact="estimation@algurggroup.ae  |  +971 4 000 0000"
            toLabel="Issued To"
            toName="Al Gurg Group - Procurement Department"
            toAddress="Procurement Office, Al Quoz Industrial Area 3, Dubai, UAE"
            toContact="procurement@algurggroup.ae"
            infoRows={[
              { label: "Project", value: b.project?.name ?? "-" },
              { label: "Project no", value: b.project?.projectNo ?? "-" },
              { label: "Client", value: b.project?.client?.name ?? "-" },
              { label: "Quotation ref", value: b.quotation?.quotationNo ?? "-" },
              { label: "BOQ no", value: b.boqNo },
              { label: "Issued by", value: b.issuer?.name ?? "-" },
              { label: "Issued at", value: formatDate(b.issuedAt) },
              { label: "Status", value: (b.status || "").replace(/_/g, " ") },
            ]}
            items={{
              headers: ["#", "Description", "Spec", "Qty", "Unit", "Availability"],
              rows: (b.items ?? []).map((it: any, idx: number) => [
                idx + 1,
                it.description,
                it.spec || "-",
                it.qty,
                it.unit,
                it.available ? "In Stock" : "To Procure",
              ]),
            }}
            notes="This is an internal BOQ-M document for procurement planning. Materials marked 'To Procure' must be requisitioned via MRQ before production release."
            signatures={["Prepared by (Estimation)", "Issued to (Procurement)"]}
          />
        </SlipDialog>
      )}
    </>
  );
}
