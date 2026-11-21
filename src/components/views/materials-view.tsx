"use client";

import { useState } from "react";
import { useList, useAction } from "@/lib/queries";
import type { SessionUser } from "@/lib/auth-shared";
import { PageHeader } from "../erp/primitives";
import { DataTable } from "../erp/data-table";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

export function MaterialsView({ user }: { user: SessionUser }) {
  const { data, isLoading } = useList<any>("materials");
  const [createOpen, setCreateOpen] = useState(false);
  const canCreate = user.role === "PROCUREMENT" || user.role === "ADMIN";
  return (
    <div className="space-y-4">
      <PageHeader
        title="Materials"
        description="Material master with supplier & unit price"
        actions={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> New material
            </Button>
          ) : null
        }
      />
      <DataTable
        loading={isLoading}
        data={data}
        columns={[
          { key: "name", header: "Name", render: (m) => <span className="font-medium">{m.name}</span> },
          { key: "spec", header: "Spec", render: (m) => m.spec || "—" },
          { key: "unit", header: "Unit", render: (m) => <Badge variant="outline" className="text-[10px]">{m.unit}</Badge> },
          { key: "unitPrice", header: "Unit price", render: (m) => formatCurrency(m.unitPrice) },
          { key: "supplier", header: "Supplier", render: (m) => m.supplier?.name },
          {
            key: "inStock",
            header: "Stock",
            render: (m) =>
              m.inStock ? (
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">In stock</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Out</Badge>
              ),
          },
        ]}
      />
      {createOpen && <CreateMaterialDialog open={createOpen} onOpenChange={setCreateOpen} />}
    </div>
  );
}

function useSuppliersForMaterial() {
  return useQuery({
    queryKey: ["suppliers-for-material"],
    queryFn: async () => {
      const res = await fetch("/api/data?view=suppliers");
      if (!res.ok) return [];
      return res.json();
    },
  });
}

function CreateMaterialDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: suppliers } = useSuppliersForMaterial();
  const mutation = useAction();
  const [form, setForm] = useState({
    name: "",
    spec: "",
    unit: "piece",
    unitPrice: 0,
    supplierId: "",
    inStock: true,
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New material</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-1.5">
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Spec</Label>
              <Input value={form.spec} onChange={(e) => setForm({ ...form, spec: e.target.value })} placeholder="18mm / grade A…" />
            </div>
            <div className="grid gap-1.5">
              <Label>Unit</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["piece", "sqm", "meter", "sheet", "set"].map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Unit price (AED)</Label>
              <Input type="number" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })} />
            </div>
            <div className="grid gap-1.5">
              <Label>In stock</Label>
              <Select value={form.inStock ? "true" : "false"} onValueChange={(v) => setForm({ ...form, inStock: v === "true" })}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Supplier *</Label>
            <Select value={form.supplierId} onValueChange={(v) => setForm({ ...form, supplierId: v })}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Select supplier" /></SelectTrigger>
              <SelectContent>
                {(suppliers ?? []).map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={mutation.isPending || !form.name || !form.supplierId}
            onClick={() =>
              mutation.mutate(
                { action: "create-material", ...form },
                {
                  onSuccess: () => { toast.success("Material created"); onOpenChange(false); },
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
