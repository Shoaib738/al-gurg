"use client";

import { useState, useMemo } from "react";
import { useQuery, useAction } from "@/lib/queries";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

interface Item {
  description: string;
  spec: string;
  qty: number;
  unit: string;
  material: string;
  materialCost: number;
  laborHours: number;
  laborRate: number;
  productionHours: number;
  installationHours: number;
  referenceImage: string;
  detailLink: string;
}

const EMPTY_ITEM: Item = {
  description: "",
  spec: "",
  qty: 1,
  unit: "piece",
  material: "",
  materialCost: 0,
  laborHours: 0,
  laborRate: 0,
  productionHours: 0,
  installationHours: 0,
  referenceImage: "",
  detailLink: "",
};

function unitPrice(it: Item) {
  return (Number(it.materialCost) + Number(it.laborHours) * Number(it.laborRate)) * 1.4;
}

export function QuotationForm({
  open,
  onOpenChange,
  onCreated,
  enquiryId,
  editQuotation,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (id: string) => void;
  enquiryId?: string;
  editQuotation?: any;
}) {
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string>(
    enquiryId || editQuotation?.enquiryId || ""
  );
  const [items, setItems] = useState<Item[]>(
    editQuotation?.items?.length
      ? editQuotation.items.map((i: any) => ({
          description: i.description || "",
          spec: i.spec || "",
          qty: Number(i.qty) || 1,
          unit: i.unit || "piece",
          material: i.material || "",
          materialCost: Number(i.materialCost) || 0,
          laborHours: Number(i.laborHours) || 0,
          laborRate: Number(i.laborRate) || 0,
          productionHours: Number(i.productionHours) || 0,
          installationHours: Number(i.installationHours) || 0,
          referenceImage: i.referenceImage || "",
          detailLink: i.detailLink || "",
        }))
      : [{ ...EMPTY_ITEM }]
  );
  const [meta, setMeta] = useState({
    validity: editQuotation?.validity ?? 30,
    deliveryWeeks: editQuotation?.deliveryWeeks ?? 4,
    paymentTerms: editQuotation?.paymentTerms ?? "50% advance, 50% before delivery",
    warranty: editQuotation?.warranty ?? "2 years",
    notes: editQuotation?.notes ?? "",
  });

  const mutation = useAction();

  const { data: enquiries } = useQuery({
    queryKey: ["enquiries-for-form"],
    queryFn: async () => {
      const res = await fetch("/api/data?view=enquiries");
      if (!res.ok) return [];
      return res.json();
    },
  });
  const { data: materials } = useQuery({
    queryKey: ["materials-for-form"],
    queryFn: async () => {
      const res = await fetch("/api/data?view=materials");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, it) => s + unitPrice(it) * Number(it.qty), 0);
    const vat = subtotal * 0.05;
    const total = subtotal + vat;
    return { subtotal, vat, total };
  }, [items]);

  function update(idx: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function addRow() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }
  function removeRow(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function pickMaterial(idx: number, materialId: string) {
    const m = (materials as any[])?.find((x) => x.id === materialId);
    if (m) {
      update(idx, {
        material: m.name,
        unit: m.unit,
        materialCost: m.unitPrice,
        spec: m.spec || "",
      });
    }
  }

  function submit() {
    if (!selectedEnquiryId) {
      toast.error("Select an enquiry first");
      return;
    }
    if (items.length === 0 || items.every((i) => !i.description)) {
      toast.error("Add at least one item with a description");
      return;
    }
    const payload = {
      action: editQuotation ? "update-quotation" : "create-quotation",
      enquiryId: selectedEnquiryId,
      id: editQuotation?.id,
      items: items.filter((i) => i.description),
      validity: Number(meta.validity),
      deliveryWeeks: Number(meta.deliveryWeeks),
      paymentTerms: meta.paymentTerms,
      warranty: meta.warranty,
      notes: meta.notes,
    };
    mutation.mutate(payload, {
      onSuccess: (data) => {
        toast.success(editQuotation ? "Quotation updated" : "Quotation created");
        onCreated(editQuotation?.id ?? data.id);
      },
      onError: (e: any) => toast.error(e.message),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {editQuotation ? `Edit ${editQuotation.quotationNo}` : "Create quotation"}
          </DialogTitle>
          <DialogDescription>
            Build line items — unit price = (material cost + labor hours × rate) × 1.4 margin.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4 p-1">
            {!editQuotation && (
              <div className="grid gap-1.5">
                <Label>Enquiry *</Label>
                <Select value={selectedEnquiryId} onValueChange={setSelectedEnquiryId}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select enquiry" /></SelectTrigger>
                  <SelectContent>
                    {(enquiries ?? []).map((e: any) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.enquiryNo} — {e.title} ({e.client?.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/60">
                  <TableRow>
                    <TableHead className="text-xs">Description</TableHead>
                    <TableHead className="text-xs w-40">Material</TableHead>
                    <TableHead className="text-xs w-24">Qty</TableHead>
                    <TableHead className="text-xs w-24">Unit</TableHead>
                    <TableHead className="text-xs w-28">Mat. cost</TableHead>
                    <TableHead className="text-xs w-24">Lab. hrs</TableHead>
                    <TableHead className="text-xs w-24">Lab. rate</TableHead>
                    <TableHead className="text-xs w-28">Unit price</TableHead>
                    <TableHead className="text-xs w-28">Total</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Input
                          value={it.description}
                          onChange={(e) => update(idx, { description: e.target.value })}
                          placeholder="Wardrobe 3-door…"
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={(materials as any[])?.find((m) => m.name === it.material)?.id ?? ""}
                          onValueChange={(v) => pickMaterial(idx, v)}
                        >
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Pick" /></SelectTrigger>
                          <SelectContent>
                            {(materials ?? []).map((m: any) => (
                              <SelectItem key={m.id} value={m.id} className="text-xs">{m.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={it.qty}
                          onChange={(e) => update(idx, { qty: Number(e.target.value) })}
                          className="h-8 text-xs w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={it.unit}
                          onChange={(e) => update(idx, { unit: e.target.value })}
                          className="h-8 text-xs w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={it.materialCost}
                          onChange={(e) => update(idx, { materialCost: Number(e.target.value) })}
                          className="h-8 text-xs w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={it.laborHours}
                          onChange={(e) => update(idx, { laborHours: Number(e.target.value) })}
                          className="h-8 text-xs w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={it.laborRate}
                          onChange={(e) => update(idx, { laborRate: Number(e.target.value) })}
                          className="h-8 text-xs w-24"
                        />
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {formatCurrency(unitPrice(it))}
                      </TableCell>
                      <TableCell className="text-xs font-semibold">
                        {formatCurrency(unitPrice(it) * it.qty)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-red-600"
                          onClick={() => removeRow(idx)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={addRow}>
                <Plus className="size-3.5" /> Add row
              </Button>
              <div className="text-right text-sm space-y-0.5">
                <p><span className="text-muted-foreground">Subtotal:</span> <span className="font-medium">{formatCurrency(totals.subtotal)}</span></p>
                <p><span className="text-muted-foreground">VAT (5%):</span> <span className="font-medium">{formatCurrency(totals.vat)}</span></p>
                <p className="text-base"><span className="text-muted-foreground">Grand total:</span> <span className="font-bold text-amber-700">{formatCurrency(totals.total)}</span></p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Validity (days)</Label>
                <Input type="number" value={meta.validity} onChange={(e) => setMeta({ ...meta, validity: Number(e.target.value) })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Delivery (weeks)</Label>
                <Input type="number" value={meta.deliveryWeeks} onChange={(e) => setMeta({ ...meta, deliveryWeeks: Number(e.target.value) })} />
              </div>
              <div className="grid gap-1.5 col-span-2">
                <Label>Payment terms</Label>
                <Input value={meta.paymentTerms} onChange={(e) => setMeta({ ...meta, paymentTerms: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Warranty</Label>
                <Input value={meta.warranty} onChange={(e) => setMeta({ ...meta, warranty: e.target.value })} />
              </div>
              <div className="grid gap-1.5 col-span-2">
                <Label>Notes</Label>
                <Textarea rows={2} value={meta.notes} onChange={(e) => setMeta({ ...meta, notes: e.target.value })} />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            {editQuotation ? "Save changes" : "Create draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
