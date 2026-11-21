"use client";

import { useState } from "react";
import { useList, useDetail, useAction } from "@/lib/queries";
import type { SessionUser } from "@/lib/auth-shared";
import { PageHeader } from "../erp/primitives";
import { DataTable } from "../erp/data-table";
import { StatusBadge } from "../status-badge";
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
import { FileUploadButton, UploadedFileChip } from "../file-upload-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Send, CheckCircle2 } from "lucide-react";
import { formatDate, parseJsonSafe } from "@/lib/format";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

export function DrawingsView({ user }: { user: SessionUser }) {
  const { data, isLoading } = useList<any>("drawings");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const canCreate = user.role === "ENGINEERING" || user.role === "ADMIN";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Drawing Submissions"
        description="Engineering drawings through PM, sales & client approval"
        actions={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> New Drawing
            </Button>
          ) : null
        }
      />
      <DataTable
        loading={isLoading}
        data={data}
        onRowClick={(d) => setDetailId(d.id)}
        columns={[
          { key: "drawingNo", header: "Drawing" },
          { key: "drawingType", header: "Type" },
          { key: "project", header: "Project", render: (d) => d.project?.name },
          { key: "drawnBy", header: "Drawn by", render: (d) => d.drawnBy?.name },
          { key: "status", header: "Status", render: (d) => <StatusBadge status={d.status} /> },
          { key: "createdAt", header: "Created", render: (d) => formatDate(d.createdAt) },
        ]}
      />
      <DrawingDetailDialog id={detailId} onOpenChange={(v) => !v && setDetailId(null)} user={user} />
      {createOpen && <CreateDrawingDialog open={createOpen} onOpenChange={setCreateOpen} />}
    </div>
  );
}

function DrawingDetailDialog({ id, onOpenChange, user }: { id: string | null; onOpenChange: (v: boolean) => void; user: SessionUser }) {
  const { data: d, isLoading } = useDetail<any>("drawing", id);
  const mutation = useAction();
  const isEng = user.role === "ENGINEERING" || user.role === "ADMIN";
  const isPm = user.role === "PROJECT" || user.role === "ADMIN";
  const isClient = user.role === "SALES" || user.role === "ADMIN"; // sales approves on behalf of client

  return (
    <Dialog open={!!id} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{d?.drawingNo ?? "Drawing"}</DialogTitle>
          <DialogDescription>{d?.project?.name}, {d?.drawingType}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          {isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading...</p>
          ) : d ? (
            <div className="space-y-3 text-sm p-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={d.status} /></div>
              {d.remarks && <p className="text-muted-foreground">{d.remarks}</p>}
              {d.attachmentsJson && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Attachments</p>
                  <ul className="text-xs space-y-1">
                    {parseJsonSafe<string[]>(d.attachmentsJson, []).map((a, i) => (
                      <li key={i} className="bg-muted/40 rounded px-2 py-1">{a}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                {isEng && d.status === "DRAFT" && (
                  <ActionButton action="submit-drawing-pm" payload={{ id: d.id }} label="Submit to PM" icon={Send} mutation={mutation} onClose={onOpenChange} />
                )}
                {isPm && d.status === "SUBMITTED_TO_PM" && (
                  <ActionButton action="submit-drawing-client" payload={{ id: d.id }} label="Forward to client" icon={Send} mutation={mutation} onClose={onOpenChange} />
                )}
                {isClient && d.status === "SUBMITTED_TO_CLIENT" && (
                  <ActionButton
                    action="approve-drawing-client"
                    payload={{ id: d.id }}
                    label="Approve (client)"
                    icon={CheckCircle2}
                    mutation={mutation}
                    onClose={onOpenChange}
                    className="bg-emerald-700 hover:bg-emerald-800"
                  />
                )}
              </div>
            </div>
          ) : null}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function ActionButton({
  action,
  payload,
  label,
  icon: Icon,
  mutation,
  onClose,
  className,
}: {
  action: string;
  payload: Record<string, any>;
  label: string;
  icon: any;
  mutation: any;
  onClose: (v: boolean) => void;
  className?: string;
}) {
  return (
    <Button
      className={className}
      disabled={mutation.isPending}
      onClick={() =>
        mutation.mutate({ action, ...payload }, {
          onSuccess: () => { toast.success("Done"); onClose(false); },
          onError: (e: any) => toast.error(e.message),
        })
      }
    >
      <Icon className="size-4" />
      {label}
    </Button>
  );
}

function useProjectsForDrawing() {
  return useQuery({
    queryKey: ["projects-for-drawing"],
    queryFn: async () => {
      const res = await fetch("/api/data?view=projects");
      if (!res.ok) return [];
      return res.json();
    },
  });
}

function CreateDrawingDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: projects } = useProjectsForDrawing();
  const mutation = useAction();
  const [projectId, setProjectId] = useState("");
  const [drawingType, setDrawingType] = useState("shop drawing");
  const [remarks, setRemarks] = useState("");
  const [attachments, setAttachments] = useState<{ url: string; filename: string }[]>([]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New drawing</DialogTitle>
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
            <Label>Drawing type</Label>
            <Select value={drawingType} onValueChange={setDrawingType}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["elevation", "shop drawing", "assembly", "detail"].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Drawing files</Label>
            <FileUploadButton
              category="drawing"
              refType="drawing"
              refId={projectId || undefined}
              accept="image/*,application/pdf"
              multiple
              label="Upload drawing files"
              onUploaded={(files) => setAttachments((prev) => [...prev, ...files])}
            />
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {attachments.map((a, i) => (
                  <UploadedFileChip
                    key={i}
                    url={a.url}
                    filename={a.filename}
                    onRemove={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label>Remarks</Label>
            <Textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={mutation.isPending || !projectId}
            onClick={() =>
              mutation.mutate(
                {
                  action: "create-drawing",
                  projectId,
                  drawingType,
                  remarks,
                  attachmentsJson: attachments.map((a) => a.url),
                },
                {
                  onSuccess: () => {
                    toast.success("Drawing created");
                    onOpenChange(false);
                    setAttachments([]);
                  },
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
