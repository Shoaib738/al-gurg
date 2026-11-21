"use client";

import { useState } from "react";
import { useList, useAction } from "@/lib/queries";
import type { SessionUser } from "@/lib/auth-shared";
import { PageHeader, EmptyState } from "../erp/primitives";
import { DataTable } from "../erp/data-table";
import { StatusBadge } from "../status-badge";
import { ProductionStageStepper } from "./production-stage-stepper";
import { QcReportFormDialog } from "./qc-report-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Factory } from "lucide-react";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

export function ProductionView({ user }: { user: SessionUser }) {
  const { data, isLoading } = useList<any>("production-orders");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const selected = (data ?? []).find((o: any) => o.id === selectedId);
  const [qcTarget, setQcTarget] = useState<{ stageId: string; stageName: string } | null>(null);

  const canCreate = user.role === "PRODUCTION" || user.role === "ESTIMATION" || user.role === "ADMIN";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Production Orders"
        description="Joinery (9 stages) and metal (5 stages) with QC gates"
        actions={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> New Production Order
            </Button>
          ) : null
        }
      />
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardContent className="p-0">
            <DataTable
              loading={isLoading}
              data={data}
              onRowClick={(o) => setSelectedId(o.id)}
              columns={[
                { key: "orderNo", header: "Order" },
                { key: "type", header: "Type", render: (o) => <StatusBadge status={o.type} /> },
                { key: "status", header: "Status", render: (o) => <StatusBadge status={o.status} /> },
              ]}
            />
          </CardContent>
        </Card>
        <div className="lg:col-span-2">
          {selected ? (
            <ProductionStageStepper
              order={selected}
              user={user}
              onQcOpen={(stageId, stageName) => setQcTarget({ stageId, stageName })}
            />
          ) : (
            <EmptyState
              title="Select a production order"
              description="Pick an order from the left to see its stage pipeline."
            />
          )}
        </div>
      </div>

      {createOpen && <CreateProductionOrderDialog open={createOpen} onOpenChange={setCreateOpen} />}
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

function useProjectsForProduction() {
  return useQuery({
    queryKey: ["projects-for-prod"],
    queryFn: async () => {
      const res = await fetch("/api/data?view=projects");
      if (!res.ok) return [];
      return res.json();
    },
  });
}

function CreateProductionOrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: projects } = useProjectsForProduction();
  const mutation = useAction();
  const [projectId, setProjectId] = useState("");
  const [type, setType] = useState<"JOINERY" | "METAL">("JOINERY");
  const [dueDate, setDueDate] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New production order</DialogTitle>
          <DialogDescription>
            Creates a {type === "JOINERY" ? "9-stage joinery" : "5-stage metal"} production order with sequential QC gates.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-1.5">
            <Label>Project *</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>
                {(projects ?? []).map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.projectNo} — {p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as any)}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="JOINERY">JOINERY (9 stages)</SelectItem>
                  <SelectItem value="METAL">METAL (5 stages)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={mutation.isPending || !projectId}
            onClick={() =>
              mutation.mutate(
                { action: "create-production-order", projectId, type, dueDate: dueDate || undefined },
                {
                  onSuccess: (data) => { toast.success(`Production order ${data.orderNo} created`); onOpenChange(false); },
                  onError: (e: any) => toast.error(e.message),
                }
              )
            }
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
