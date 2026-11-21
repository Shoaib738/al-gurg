"use client";

import { useState } from "react";
import { useDetail, useAction } from "@/lib/queries";
import type { SessionUser } from "@/lib/auth-shared";
import { PageHeader } from "../erp/primitives";
import { StatusBadge } from "../status-badge";
import { TimelineStrip } from "../erp/timeline";
import { EmailPreviewDialog } from "../erp/email-preview";
import { QuotationForm } from "./quotation-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Printer,
  Send,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Wallet,
  Rocket,
  Pencil,
  FileSignature,
  Banknote,
} from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { toast } from "sonner";

export function QuotationDetail({
  id,
  user,
  onBack,
}: {
  id: string;
  user: SessionUser;
  onBack: () => void;
}) {
  const { data: q, isLoading } = useDetail<any>("quotation", id);
  const [editOpen, setEditOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [emailPreview, setEmailPreview] = useState<any>(null);
  const [comment, setComment] = useState("");

  if (isLoading || !q) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        <div className="h-48 rounded-md bg-muted animate-pulse" />
      </div>
    );
  }

  const role = user.role;
  const isEstimation = role === "ESTIMATION" || role === "ADMIN";
  const isBM = role === "BUSINESS_MANAGER" || role === "ADMIN";
  const isSales = role === "SALES" || role === "ADMIN";
  const isFinance = role === "FINANCE" || role === "ADMIN";

  return (
    <div className="space-y-4 print-area">
      <div className="flex items-center justify-between gap-3 no-print">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="size-4" /> Back to quotations
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="size-4" /> Print
        </Button>
      </div>

      <PageHeader
        title={`${q.quotationNo}`}
        description={`${q.client?.name} · ${q.enquiry?.enquiryNo ?? "—"}`}
        actions={<StatusBadge status={q.status} />}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Client</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{q.client?.name}</p>
            <p className="text-muted-foreground">{q.client?.company || q.client?.email || "—"}</p>
            <p className="text-muted-foreground">{q.client?.phone || "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Commercial terms</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <Row label="Validity" value={`${q.validity} days`} />
            <Row label="Delivery" value={`${q.deliveryWeeks} weeks`} />
            <Row label="Payment" value={q.paymentTerms} />
            <Row label="Warranty" value={q.warranty} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Workflow</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <Row label="Created by" value={q.creator?.name} />
            <Row label="Created" value={formatDate(q.createdAt)} />
            <Row label="Approved by" value={q.approver?.name ?? "—"} />
            <Row label="Approved at" value={formatDate(q.approvedAt)} />
            <Row label="Sent" value={formatDate(q.sentAt)} />
            <Row label="Signed" value={formatDate(q.signedAt)} />
          </CardContent>
        </Card>
      </div>

      {/* Action buttons (role-gated) */}
      <Card className="no-print">
        <CardContent className="flex flex-wrap gap-2 p-4">
          {isEstimation && q.status === "DRAFT" && (
            <>
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" /> Edit items
              </Button>
              <ActionButton
                action="submit-quotation"
                payload={{ id: q.id }}
                label="Submit for approval"
                icon={Send}
                successMessage="Submitted to Business Manager"
              />
            </>
          )}
          {isBM && q.status === "PENDING_APPROVAL" && (
            <>
              <ActionButton
                action="approve-quotation"
                payload={{ id: q.id }}
                label="Approve"
                icon={CheckCircle2}
                variant="default"
                className="bg-emerald-700 hover:bg-emerald-800"
                successMessage="Quotation approved"
              />
              <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                <XCircle className="size-4" /> Reject
              </Button>
              <Button variant="outline" onClick={() => setCommentOpen(true)}>
                <MessageSquare className="size-4" /> Add comment
              </Button>
            </>
          )}
          {isSales && q.status === "APPROVED" && (
            <ActionButton
              action="send-quotation"
              payload={{ id: q.id }}
              label="Send to client"
              icon={Send}
              successMessage="Marked as sent to client"
            />
          )}
          {isSales && q.status === "SENT_TO_CLIENT" && (
            <ActionButton
              action="sign-quotation"
              payload={{ id: q.id }}
              label="Mark client signed"
              icon={FileSignature}
              className="bg-emerald-700 hover:bg-emerald-800"
              successMessage="Quotation signed & confirmed"
            />
          )}
          {isFinance && q.status === "SIGNED_CONFIRMED" && (
            <Button onClick={() => setPaymentOpen(true)}>
              <Wallet className="size-4" /> Generate payment link
            </Button>
          )}
          {isFinance && (q.status === "PAYMENT_LINK_SENT" || q.status === "PAID") && q.paymentLinks?.length > 0 && (
            <ActionButton
              action="mark-payment-paid"
              payload={{ paymentLinkId: q.paymentLinks[0].id }}
              label="Mark advance paid"
              icon={Banknote}
              className="bg-emerald-700 hover:bg-emerald-800"
              successMessage="Payment marked as received"
            />
          )}
          {isEstimation && (q.status === "PAID" || q.status === "LPO_RECEIVED" || q.status === "PAYMENT_LINK_SENT") && (
            <ActionButton
              action="release-order"
              payload={{ id: q.id }}
              label="Release order"
              icon={Rocket}
              className="bg-amber-700 hover:bg-amber-800"
              successMessage="Order released — project created"
              onSuccess={(data) => setEmailPreview(data.email)}
            />
          )}
          {isEstimation && q.status === "LPO_RECEIVED" && (
            <ActionButton
              action="confirm-lpo-client"
              payload={{ id: q.id, lpoRef: "CLIENT-LPO" }}
              label="Confirm client LPO"
              icon={FileSignature}
            />
          )}
          {(q.status !== "DRAFT") && (
            <Button variant="ghost" onClick={() => setCommentOpen(true)}>
              <MessageSquare className="size-4" /> Comment
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Items table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Line items</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[28rem]">
            <Table>
              <TableHeader className="bg-muted/60 sticky top-0">
                <TableRow>
                  <TableHead className="text-xs">#</TableHead>
                  <TableHead className="text-xs">Image</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs">Spec</TableHead>
                  <TableHead className="text-xs">Qty</TableHead>
                  <TableHead className="text-xs">Material cost</TableHead>
                  <TableHead className="text-xs">Labor</TableHead>
                  <TableHead className="text-xs">Unit price</TableHead>
                  <TableHead className="text-xs text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(q.items ?? []).map((it: any) => (
                  <TableRow key={it.id}>
                    <TableCell className="text-xs">{it.lineNumber}</TableCell>
                    <TableCell>
                      {it.referenceImage ? (
                        <img
                          src={it.referenceImage}
                          alt={it.description}
                          className="size-10 rounded object-cover border"
                        />
                      ) : (
                        <div className="size-10 rounded bg-muted/50" />
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      <p className="font-medium">{it.description}</p>
                      {it.material && (
                        <p className="text-muted-foreground">{it.material}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{it.spec || "—"}</TableCell>
                    <TableCell className="text-xs">{it.qty} {it.unit}</TableCell>
                    <TableCell className="text-xs">{formatCurrency(it.materialCost)}</TableCell>
                    <TableCell className="text-xs">{it.laborHours}h × {formatCurrency(it.laborRate)}</TableCell>
                    <TableCell className="text-xs font-medium">{formatCurrency(it.unitPrice)}</TableCell>
                    <TableCell className="text-xs font-semibold text-right">{formatCurrency(it.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4 sm:justify-end">
        <Card className="sm:col-start-2">
          <CardContent className="p-4 space-y-1 text-sm">
            <Row label="Subtotal" value={formatCurrency(q.subtotal)} />
            <Row label="Discount" value={formatCurrency(q.discount)} />
            <Row label="VAT (5%)" value={formatCurrency(q.vat)} />
            <div className="flex justify-between border-t pt-1.5 mt-1.5 text-base">
              <span className="font-semibold">Grand total</span>
              <span className="font-bold text-amber-700">{formatCurrency(q.total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Comments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="size-4" /> Comments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(q.comments ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments yet.</p>
            ) : (
              q.comments.map((c: any) => (
                <div key={c.id} className="rounded-md border p-2.5 text-sm">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-medium">{c.user?.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(c.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm">{c.text}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <TimelineStrip events={q.timeline} />
      </div>

      {/* Dialogs */}
      {editOpen && (
        <QuotationForm
          open={editOpen}
          onOpenChange={setEditOpen}
          onCreated={() => setEditOpen(false)}
          editQuotation={q}
        />
      )}

      <CommentDialog
        open={commentOpen}
        onOpenChange={setCommentOpen}
        onSubmit={async (text) => {
          await fetch("/api/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "comment-quotation", id: q.id, text }),
          });
          toast.success("Comment added");
          setCommentOpen(false);
        }}
      />

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onSubmit={async (reason) => {
          await fetch("/api/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "reject-quotation", id: q.id, comment: reason }),
          });
          toast.success("Quotation rejected");
          setRejectOpen(false);
        }}
      />

      <PaymentLinkDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        quotationTotal={q.total}
        onSubmit={async (amount) => {
          // create project if not exists via release-order? No — finance just generates link, needs a project.
          // For demo: generate link against any existing project for this client, or quote-only link.
          const res = await fetch("/api/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "generate-payment-link",
              projectId: q.projects?.[0]?.id ?? "",
              quotationId: q.id,
              amount,
            }),
          });
          const data = await res.json();
          if (data.success) {
            toast.success(`Payment link ${data.linkRef} generated`);
            setPaymentOpen(false);
          } else {
            toast.error(data.error || "Failed");
          }
        }}
      />

      <EmailPreviewDialog
        open={!!emailPreview}
        onOpenChange={(v) => !v && setEmailPreview(null)}
        email={emailPreview}
      />
    </div>
  );
}

function ActionButton({
  action,
  payload,
  label,
  icon: Icon,
  variant = "default",
  className,
  successMessage,
  onSuccess,
}: {
  action: string;
  payload: Record<string, any>;
  label: string;
  icon?: any;
  variant?: "default" | "outline" | "destructive" | "secondary" | "ghost";
  className?: string;
  successMessage?: string;
  onSuccess?: (data: any) => void;
}) {
  const mutation = useAction();
  return (
    <Button
      variant={variant}
      className={className}
      disabled={mutation.isPending}
      onClick={() =>
        mutation.mutate({ action, ...payload }, {
          onSuccess: (data) => {
            toast.success(successMessage || "Done");
            onSuccess?.(data);
          },
          onError: (e: any) => toast.error(e.message),
        })
      }
    >
      {Icon && <Icon className="size-4" />}
      {label}
    </Button>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}

function CommentDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add comment</DialogTitle>
        </DialogHeader>
        <Textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Your comment or revision note…"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => text && onSubmit(text)}>Post comment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject quotation</DialogTitle>
          <DialogDescription>Provide a reason for rejection.</DialogDescription>
        </DialogHeader>
        <Textarea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection…"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={() => reason && onSubmit(reason)}>Reject</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PaymentLinkDialog({
  open,
  onOpenChange,
  onSubmit,
  quotationTotal,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (amount: number) => Promise<void>;
  quotationTotal: number;
}) {
  const [amount, setAmount] = useState<number>(Math.round((quotationTotal || 0) * 0.5));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate payment link</DialogTitle>
          <DialogDescription>
            Typically 50% advance. Quotation total: {formatCurrency(quotationTotal)}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label>Amount (AED)</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => amount && onSubmit(amount)}>Generate link</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
