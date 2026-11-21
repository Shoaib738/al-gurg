"use client";

import { useState } from "react";
import { useList, useAction } from "@/lib/queries";
import type { SessionUser } from "@/lib/auth-shared";
import { PageHeader, EmptyState } from "../erp/primitives";
import { DataTable } from "../erp/data-table";
import { StatusBadge } from "../status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Banknote, Wallet } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

export function FinanceView({ user }: { user: SessionUser }) {
  const { data: dashboard } = useList<any>("dashboard-finance");
  const links = dashboard?.paymentLinks ?? [];
  const readyForFinal = dashboard?.readyForFinal ?? [];
  const [genOpen, setGenOpen] = useState(false);
  const canGenerate = user.role === "FINANCE" || user.role === "ADMIN";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Finance & Accounts"
        description="Payment links & projects ready for final claim"
        actions={
          canGenerate ? (
            <Button onClick={() => setGenOpen(true)}>
              <Plus className="size-4" /> Generate payment link
            </Button>
          ) : null
        }
      />
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Payment links</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={links}
            columns={[
              { key: "linkRef", header: "Link ref" },
              { key: "project", header: "Project", render: (p) => p.project?.name },
              { key: "amount", header: "Amount", render: (p) => formatCurrency(p.amount) },
              { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
              { key: "generatedAt", header: "Generated", render: (p) => formatDate(p.generatedAt) },
              { key: "paidAt", header: "Paid", render: (p) => formatDate(p.paidAt) },
              {
                key: "action",
                header: "",
                render: (p) =>
                  canGenerate && p.status !== "PAID" ? (
                    <MarkPaidButton id={p.id} />
                  ) : null,
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Projects ready for final claim</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {readyForFinal.length === 0 ? (
            <EmptyState title="No projects ready for final claim" description="Projects with submitted customer feedback will appear here." />
          ) : (
            <DataTable
              data={readyForFinal}
              columns={[
                { key: "projectNo", header: "Project" },
                { key: "name", header: "Name" },
                { key: "client", header: "Client", render: (p) => p.client?.name },
                { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {genOpen && <GeneratePaymentDialog open={genOpen} onOpenChange={setGenOpen} />}
    </div>
  );
}

function MarkPaidButton({ id }: { id: string }) {
  const mutation = useAction();
  return (
    <Button
      size="sm"
      className="bg-emerald-700 hover:bg-emerald-800"
      disabled={mutation.isPending}
      onClick={() =>
        mutation.mutate(
          { action: "mark-payment-paid", paymentLinkId: id },
          {
            onSuccess: () => toast.success("Marked as paid"),
            onError: (e: any) => toast.error(e.message),
          }
        )
      }
    >
      <Banknote className="size-3.5" /> Mark paid
    </Button>
  );
}

function useProjectsForPayment() {
  return useQuery({
    queryKey: ["projects-for-payment"],
    queryFn: async () => {
      const res = await fetch("/api/data?view=projects");
      if (!res.ok) return [];
      return res.json();
    },
  });
}

function GeneratePaymentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: projects } = useProjectsForPayment();
  const mutation = useAction();
  const [projectId, setProjectId] = useState("");
  const [amount, setAmount] = useState(0);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate payment link</DialogTitle>
          <DialogDescription>Typically the 50% advance or final claim.</DialogDescription>
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
          <div className="grid gap-1.5">
            <Label>Amount (AED)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={mutation.isPending || !projectId || !amount}
            onClick={() =>
              mutation.mutate(
                { action: "generate-payment-link", projectId, amount },
                {
                  onSuccess: (data) => { toast.success(`Payment link ${data.linkRef} generated`); onOpenChange(false); },
                  onError: (e: any) => toast.error(e.message),
                }
              )
            }
          >
            <Wallet className="size-4" /> Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
