"use client";

import { useState } from "react";
import { useList, useAction } from "@/lib/queries";
import type { SessionUser } from "@/lib/auth-shared";
import { PageHeader } from "../erp/primitives";
import { DataTable } from "../erp/data-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function SuppliersView({ user }: { user: SessionUser }) {
  const { data, isLoading } = useList<any>("suppliers");
  const [createOpen, setCreateOpen] = useState(false);
  const canCreate = user.role === "PROCUREMENT" || user.role === "ADMIN";
  return (
    <div className="space-y-4">
      <PageHeader
        title="Suppliers"
        description="Material suppliers"
        actions={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> New supplier
            </Button>
          ) : null
        }
      />
      <DataTable
        loading={isLoading}
        data={data}
        columns={[
          { key: "name", header: "Name", render: (s) => <span className="font-medium">{s.name}</span> },
          { key: "contactPerson", header: "Contact", render: (s) => s.contactPerson || "-" },
          { key: "email", header: "Email", render: (s) => s.email || "-" },
          { key: "phone", header: "Phone", render: (s) => s.phone || "-" },
          { key: "materials", header: "Materials", render: (s) => s.materials || "-" },
          {
            key: "counts",
            header: "Activity",
            render: (s) => (
              <span className="text-xs text-muted-foreground">
                {s._count?.supplierQuotes ?? 0} quotes, {s._count?.prs ?? 0} PRs, {s._count?.lpos ?? 0} LPOs
              </span>
            ),
          },
        ]}
      />
      {createOpen && <CreateSupplierDialog open={createOpen} onOpenChange={setCreateOpen} />}
    </div>
  );
}

function CreateSupplierDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const mutation = useAction();
  const [form, setForm] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    whatsapp: "",
    materials: "",
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New supplier</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-1.5">
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Contact person</Label>
              <Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>WhatsApp</Label>
              <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Materials supplied</Label>
            <Input value={form.materials} onChange={(e) => setForm({ ...form, materials: e.target.value })} placeholder="MDF, hinges, hardware..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={mutation.isPending || !form.name}
            onClick={() =>
              mutation.mutate(
                { action: "create-supplier", ...form },
                {
                  onSuccess: () => { toast.success("Supplier created"); onOpenChange(false); },
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
