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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Flag, Plus, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

export function RedFlagsDelaysView({ user, tab }: { user: SessionUser; tab: string }) {
  const rf = useList<any>("red-flags");
  const dl = useList<any>("delays");
  const initial = tab === "delays" ? "delays" : "red-flags";
  const [active, setActive] = useState(initial);
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [raiseType, setRaiseType] = useState<"red-flag" | "delay">("red-flag");

  function openRaise(type: "red-flag" | "delay") {
    setRaiseType(type);
    setRaiseOpen(true);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Red Flags & Delays"
        description="Escalations across departments - resolution required"
        actions={
          <>
            <Button variant="outline" onClick={() => openRaise("delay")}>
              <Plus className="size-4" /> Raise delay
            </Button>
            <Button onClick={() => openRaise("red-flag")}>
              <Plus className="size-4" /> Raise red flag
            </Button>
          </>
        }
      />
      <Tabs value={active} onValueChange={setActive}>
        <TabsList>
          <TabsTrigger value="red-flags"><Flag className="size-3.5" /> Red Flags ({rf.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="delays">Delays ({dl.data?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="red-flags" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {(rf.data ?? []).length === 0 ? (
                <EmptyState title="No red flags" />
              ) : (
                <DataTable
                  data={rf.data}
                  columns={[
                    { key: "project", header: "Project", render: (r) => r.project?.name },
                    { key: "department", header: "Dept" },
                    { key: "reason", header: "Reason" },
                    { key: "severity", header: "Severity", render: (r) => <StatusBadge status={r.severity} /> },
                    { key: "daysDelayed", header: "Days" },
                    {
                      key: "resolved",
                      header: "Status",
                      render: (r) => (r.resolved ? <StatusBadge status="RESOLVED" /> : <StatusBadge status="OPEN" />),
                    },
                    { key: "createdAt", header: "Raised", render: (r) => formatDate(r.createdAt) },
                    {
                      key: "action",
                      header: "",
                      render: (r) =>
                        !r.resolved ? <ResolveButton type="red-flag" id={r.id} /> : null,
                    },
                  ]}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delays" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {(dl.data ?? []).length === 0 ? (
                <EmptyState title="No delays" />
              ) : (
                <DataTable
                  data={dl.data}
                  columns={[
                    { key: "project", header: "Project", render: (d) => d.project?.name },
                    { key: "department", header: "Dept" },
                    { key: "reason", header: "Reason" },
                    { key: "daysDelayed", header: "Days" },
                    { key: "status", header: "Status", render: (d) => <StatusBadge status={d.status} /> },
                    { key: "createdAt", header: "Raised", render: (d) => formatDate(d.createdAt) },
                    {
                      key: "action",
                      header: "",
                      render: (d) =>
                        d.status !== "RESOLVED" ? <ResolveButton type="delay" id={d.id} /> : null,
                    },
                  ]}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {raiseOpen && (
        <RaiseDialog
          type={raiseType}
          open={raiseOpen}
          onOpenChange={setRaiseOpen}
        />
      )}
    </div>
  );
}

function ResolveButton({ type, id }: { type: "red-flag" | "delay"; id: string }) {
  const mutation = useAction();
  return (
    <Button
      size="sm"
      variant="outline"
      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
      disabled={mutation.isPending}
      onClick={() => {
        const resolution = window.prompt("Enter resolution note:");
        if (!resolution) return;
        mutation.mutate(
          {
            action: type === "red-flag" ? "resolve-red-flag" : "resolve-delay",
            id,
            resolution,
          },
          {
            onSuccess: () => toast.success("Resolved"),
            onError: (e: any) => toast.error(e.message),
          }
        );
      }}
    >
      <CheckCircle2 className="size-3.5" /> Resolve
    </Button>
  );
}

function useProjectsForRaise() {
  return useQuery({
    queryKey: ["projects-for-raise"],
    queryFn: async () => {
      const res = await fetch("/api/data?view=projects");
      if (!res.ok) return [];
      return res.json();
    },
  });
}

function RaiseDialog({
  type,
  open,
  onOpenChange,
}: {
  type: "red-flag" | "delay";
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: projects } = useProjectsForRaise();
  const mutation = useAction();
  const [projectId, setProjectId] = useState("");
  const [department, setDepartment] = useState("");
  const [reason, setReason] = useState("");
  const [daysDelayed, setDaysDelayed] = useState(0);
  const [severity, setSeverity] = useState("MEDIUM");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === "red-flag" ? "Raise red flag" : "Raise delay complaint"}
          </DialogTitle>
          <DialogDescription>
            Visible to Business Manager & Admin for resolution.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-1.5">
            <Label>Project *</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>
                {(projects ?? []).map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.projectNo} - {p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Department</Label>
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Procurement / Production / ..." />
          </div>
          <div className="grid gap-1.5">
            <Label>Reason</Label>
            <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Days delayed</Label>
              <Input type="number" value={daysDelayed} onChange={(e) => setDaysDelayed(Number(e.target.value))} />
            </div>
            {type === "red-flag" && (
              <div className="grid gap-1.5">
                <Label>Severity</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={mutation.isPending || !projectId || !reason}
            onClick={() =>
              mutation.mutate(
                {
                  action: type === "red-flag" ? "raise-red-flag" : "raise-delay",
                  projectId,
                  department,
                  reason,
                  daysDelayed,
                  severity,
                },
                {
                  onSuccess: () => { toast.success(type === "red-flag" ? "Red flag raised" : "Delay raised"); onOpenChange(false); },
                  onError: (e: any) => toast.error(e.message),
                }
              )
            }
          >
            Raise
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
