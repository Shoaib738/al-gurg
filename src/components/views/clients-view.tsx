"use client";

import { useState } from "react";
import { useList, useAction } from "@/lib/queries";
import type { SessionUser } from "@/lib/auth-shared";
import { PageHeader } from "../erp/primitives";
import { DataTable } from "../erp/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Plus, Building2 } from "lucide-react";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

export function ClientsView({ user }: { user: SessionUser }) {
  const { data, isLoading } = useList<any>("clients");
  const [createOpen, setCreateOpen] = useState(false);
  const canCreate = user.role === "SALES" || user.role === "ADMIN";
  return (
    <div className="space-y-4">
      <PageHeader
        title="Clients"
        description="Retail & project clients"
        actions={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> New client
            </Button>
          ) : null
        }
      />
      <DataTable
        loading={isLoading}
        data={data}
        columns={[
          { key: "name", header: "Name", render: (c) => <span className="font-medium">{c.name}</span> },
          { key: "type", header: "Type", render: (c) => <Badge variant="outline" className="text-[10px]">{c.type}</Badge> },
          { key: "company", header: "Company", render: (c) => c.company || "-" },
          { key: "contactPerson", header: "Contact", render: (c) => c.contactPerson || "-" },
          { key: "email", header: "Email", render: (c) => c.email || "-" },
          { key: "phone", header: "Phone", render: (c) => c.phone || "-" },
          {
            key: "counts",
            header: "Activity",
            render: (c) => (
              <span className="text-xs text-muted-foreground">
                {c._count?.enquiries ?? 0} enq, {c._count?.quotations ?? 0} qtn, {c._count?.projects ?? 0} prj
              </span>
            ),
          },
        ]}
      />
      {createOpen && <CreateClientDialog open={createOpen} onOpenChange={setCreateOpen} />}
    </div>
  );
}

function CreateClientDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const mutation = useAction();
  const [form, setForm] = useState({
    name: "",
    type: "RETAIL",
    company: "",
    contactPerson: "",
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New client</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RETAIL">RETAIL</SelectItem>
                  <SelectItem value="PROJECT">PROJECT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Company</Label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Contact person</Label>
              <Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={mutation.isPending || !form.name}
            onClick={() =>
              mutation.mutate(
                { action: "create-client", ...form },
                {
                  onSuccess: () => { toast.success("Client created"); onOpenChange(false); },
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
