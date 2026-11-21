"use client";

import { useState } from "react";
import { useAction } from "@/lib/queries";
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
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmailPreviewDialog } from "../erp/email-preview";
import { FileUploadButton, UploadedFileChip } from "../file-upload-button";

interface ChecklistItem {
  name: string;
  status: "PASS" | "PARTIAL" | "FAIL" | "N/A";
}

export function QcReportFormDialog({
  open,
  onOpenChange,
  type,
  refType,
  refId,
  productionStageId,
  title,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  type: "DELIVERY_INSPECTION" | "PRODUCTION_STAGE" | "INSTALLATION_INSPECTION";
  refType: string;
  refId: string;
  productionStageId?: string;
  title?: string;
}) {
  const mutation = useAction();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { name: "Quantity matches LPO", status: "PASS" },
    { name: "Spec / quality matches", status: "PASS" },
    { name: "No visible damage", status: "PASS" },
  ]);
  const [remarks, setRemarks] = useState("");
  const [missingItems, setMissingItems] = useState<string[]>([]);
  const [missingInput, setMissingInput] = useState("");
  const [status, setStatus] = useState<"PASSED" | "FAILED" | "PARTIAL">("PASSED");
  const [emailPreview, setEmailPreview] = useState<any>(null);
  const [photos, setPhotos] = useState<{ url: string; filename: string }[]>([]);

  function submit() {
    mutation.mutate(
      {
        action: "create-qc-report",
        type,
        refType,
        refId,
        productionStageId: productionStageId || null,
        checklist,
        remarks,
        missingItems,
        photos: photos.map((p) => p.url),
      },
      {
        onSuccess: (created: any) => {
          // Now submit it
          mutation.mutate(
            {
              action: "submit-qc-report",
              id: created.id,
              status,
              remarks,
              missingItems,
            },
            {
              onSuccess: (data: any) => {
                toast.success(`QC report submitted - ${status}`);
                if (data?.email) {
                  setEmailPreview(data.email);
                }
                onOpenChange(false);
                setChecklist([
                  { name: "Quantity matches LPO", status: "PASS" },
                  { name: "Spec / quality matches", status: "PASS" },
                  { name: "No visible damage", status: "PASS" },
                ]);
                setRemarks("");
                setMissingItems([]);
                setPhotos([]);
              },
              onError: (e: any) => toast.error(e.message),
            }
          );
        },
        onError: (e: any) => toast.error(e.message),
      }
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{title || "QC inspection"}</DialogTitle>
            <DialogDescription>
              Complete the checklist and submit the report.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-muted/60">
                  <TableRow>
                    <TableHead className="text-xs">Checklist item</TableHead>
                    <TableHead className="text-xs w-32">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checklist.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Input
                          value={c.name}
                          onChange={(e) =>
                            setChecklist((p) =>
                              p.map((x, j) => (j === i ? { ...x, name: e.target.value } : x))
                            )
                          }
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={c.status}
                          onValueChange={(v) =>
                            setChecklist((p) =>
                              p.map((x, j) => (j === i ? { ...x, status: v as any } : x))
                            )
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["PASS", "PARTIAL", "FAIL", "N/A"].map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setChecklist([...checklist, { name: "", status: "PASS" }])}
            >
              <Plus className="size-3.5" /> Add checklist item
            </Button>

            <div className="grid gap-1.5">
              <Label>Missing items</Label>
              <div className="flex gap-2">
                <Input
                  value={missingInput}
                  onChange={(e) => setMissingInput(e.target.value)}
                  placeholder="e.g. 2 hinges missing"
                  className="h-9"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && missingInput) {
                      setMissingItems([...missingItems, missingInput]);
                      setMissingInput("");
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (missingInput) {
                      setMissingItems([...missingItems, missingInput]);
                      setMissingInput("");
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              {missingItems.length > 0 && (
                <ul className="text-xs space-y-1 mt-1">
                  {missingItems.map((m, i) => (
                    <li key={i} className="flex items-center justify-between bg-muted/40 rounded px-2 py-1">
                      {m}
                      <button
                        onClick={() => setMissingItems(missingItems.filter((_, j) => j !== i))}
                        className="text-red-600"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label>Inspection photos</Label>
              <FileUploadButton
                category="qc-photo"
                refType={refType}
                refId={refId}
                accept="image/*"
                multiple
                label="Upload photos"
                onUploaded={(files) => setPhotos((p) => [...p, ...files])}
              />
              {photos.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {photos.map((p, i) => (
                    <UploadedFileChip
                      key={i}
                      url={p.url}
                      filename={p.filename}
                      onRemove={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label>Remarks</Label>
              <Textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label>Final status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PASSED">PASSED</SelectItem>
                  <SelectItem value="PARTIAL">PARTIAL</SelectItem>
                  <SelectItem value="FAILED">FAILED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={mutation.isPending}>
              Submit QC report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <EmailPreviewDialog
        open={!!emailPreview}
        onOpenChange={(v) => !v && setEmailPreview(null)}
        email={emailPreview}
      />
    </>
  );
}
