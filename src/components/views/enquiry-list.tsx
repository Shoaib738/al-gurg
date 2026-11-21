"use client";

import { useState } from "react";
import { useList, useDetail, useAction } from "@/lib/queries";
import type { SessionUser } from "@/lib/auth-shared";
import { PageHeader, EmptyState } from "../erp/primitives";
import { DataTable } from "../erp/data-table";
import { StatusBadge } from "../status-badge";
import { TimelineStrip } from "../erp/timeline";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowLeft } from "lucide-react";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

export function EnquiryList({
  user,
  onSelect,
  navigateToQuotation,
}: {
  user: SessionUser;
  onSelect: (id: string) => void;
  navigateToQuotation: (id: string) => void;
}) {
  const { data, isLoading } = useList<any>("enquiries");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Enquiries"
        description="Client enquiries received across email, WhatsApp, phone & walk-in"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> New Enquiry
          </Button>
        }
      />
      <DataTable
        loading={isLoading}
        data={data}
        onRowClick={(e) => setDetailId(e.id)}
        columns={[
          { key: "enquiryNo", header: "Enquiry No", render: (e) => <span className="font-medium">{e.enquiryNo}</span> },
          { key: "enquiryDate", header: "Date", render: (e) => formatDate(e.enquiryDate) },
          { key: "client", header: "Client", render: (e) => e.client?.name },
          { key: "title", header: "Title" },
          { key: "salesUser", header: "Sales", render: (e) => e.salesUser?.name },
          { key: "source", header: "Source", render: (e) => <Badge variant="outline" className="text-[10px] capitalize">{(e.source || "").toLowerCase()}</Badge> },
          { key: "status", header: "Status", render: (e) => <StatusBadge status={e.status} /> },
        ]}
      />
      <CreateEnquiryDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EnquiryDetailDialog
        id={detailId}
        onOpenChange={(v) => !v && setDetailId(null)}
        navigateToQuotation={navigateToQuotation}
      />
    </div>
  );
}

function EnquiryDetailDialog({
  id,
  onOpenChange,
  navigateToQuotation,
}: {
  id: string | null;
  onOpenChange: (v: boolean) => void;
  navigateToQuotation: (id: string) => void;
}) {
  const { data, isLoading } = useDetail<any>("enquiry", id);
  return (
    <Dialog open={!!id} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{data?.enquiryNo ?? "Enquiry detail"}</DialogTitle>
          <DialogDescription>
            {data?.client?.name} · {formatDate(data?.enquiryDate)}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          {isLoading ? (
            <p className="text-sm text-muted-foreground p-4">Loading…</p>
          ) : data ? (
            <div className="space-y-4 p-1">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Title" value={data.title} />
                <Field label="Project type" value={data.projectType || "—"} />
                <Field label="Location" value={data.location || "—"} />
                <Field label="Source" value={data.source} />
                <Field label="Sales" value={data.salesUser?.name} />
                <Field label="Status" value={<StatusBadge status={data.status} />} />
              </div>
              {data.description && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{data.description}</p>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quotations</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (data.quotations?.[0]) {
                        navigateToQuotation(data.quotations[0].id);
                        onOpenChange(false);
                      }
                    }}
                  >
                    Open first quotation
                  </Button>
                </div>
                {(data.quotations ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No quotations yet.</p>
                ) : (
                  <DataTable
                    data={data.quotations}
                    onRowClick={(q: any) => {
                      navigateToQuotation(q.id);
                      onOpenChange(false);
                    }}
                    columns={[
                      { key: "quotationNo", header: "Quotation" },
                      { key: "status", header: "Status", render: (q: any) => <StatusBadge status={q.status} /> },
                    ]}
                  />
                )}
              </div>
              <TimelineStrip events={data.timeline} />
            </div>
          ) : null}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function useLookupData() {
  return useQuery({
    queryKey: ["lookup-clients-materials"],
    queryFn: async () => {
      const res = await fetch("/api/data?view=clients-and-materials");
      if (!res.ok) return { clients: [], materials: [], suppliers: [], salesUsers: [] };
      return res.json();
    },
    staleTime: 60_000,
  });
}

function CreateEnquiryDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const lookup = useLookupData();
  const mutation = useAction();
  const [form, setForm] = useState({
    clientId: "",
    title: "",
    description: "",
    projectType: "",
    location: "",
    source: "EMAIL",
    salesUserId: "",
  });

  function submit() {
    if (!form.clientId || !form.title) {
      toast.error("Client and title are required");
      return;
    }
    mutation.mutate(
      { action: "create-enquiry", ...form, attachments: [] },
      {
        onSuccess: () => {
          toast.success("Enquiry created");
          onOpenChange(false);
          setForm({ clientId: "", title: "", description: "", projectType: "", location: "", source: "EMAIL", salesUserId: "" });
        },
        onError: (e: any) => toast.error(e.message),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New enquiry</DialogTitle>
          <DialogDescription>
            Log a new client enquiry. Estimation will be notified.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label>Client *</Label>
            <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                {(lookup.data?.clients ?? []).map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} ({c.type})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Wardrobes for master bedroom" />
          </div>
          <div className="grid gap-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Project type</Label>
              <Input value={form.projectType} onChange={(e) => setForm({ ...form, projectType: e.target.value })} placeholder="Wardrobe / kitchen…" />
            </div>
            <div className="grid gap-1.5">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Dubai Marina…" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Source</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["EMAIL", "WHATSAPP", "PHONE", "WALK_IN"].map((s) => (
                    <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Sales person</Label>
              <Select value={form.salesUserId} onValueChange={(v) => setForm({ ...form, salesUserId: v })}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Auto (you)" /></SelectTrigger>
                <SelectContent>
                  {(lookup.data?.salesUsers ?? []).map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={mutation.isPending}>Create enquiry</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
