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
import { Plus, ArrowLeft } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";

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
  const canIssue = (user.role === "ESTIMATION" || user.role === "ADMIN") && b?.status === "DRAFT";
  return (
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
          ) : null}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
