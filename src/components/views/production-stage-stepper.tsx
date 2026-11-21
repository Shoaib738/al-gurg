"use client";

import type { SessionUser } from "@/lib/auth-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "../status-badge";
import { useAction } from "@/lib/queries";
import { formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import {
  Play,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  SkipForward,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_ICON: Record<string, string> = {
  NOT_STARTED: "○",
  IN_PROGRESS: "◐",
  QC_PENDING: "◑",
  QC_PASSED: "●",
  QC_FAILED: "✕",
  SKIPPED: "↷",
  COMPLETED: "✓",
};

export function ProductionStageStepper({
  order,
  user,
  onQcOpen,
}: {
  order: any;
  user: SessionUser;
  onQcOpen: (stageId: string, stageName: string) => void;
}) {
  const stages = order.stages ?? [];
  const canOperate =
    user.role === "PRODUCTION" ||
    user.role === "ADMIN";
  const canQc = user.role === "QC" || user.role === "ADMIN";

  // A stage is unlocked if previous stage is QC_PASSED / SKIPPED / COMPLETED (or it's the first)
  function isUnlocked(stage: any) {
    if (stage.stageOrder === 1) return true;
    const prev = stages.find((s: any) => s.stageOrder === stage.stageOrder - 1);
    if (!prev) return true;
    return ["QC_PASSED", "SKIPPED", "COMPLETED"].includes(prev.status);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            {order.orderNo}
            <Badge variant="outline" className="text-[10px]">{order.type}</Badge>
            <StatusBadge status={order.status} />
          </CardTitle>
          <div className="text-xs text-muted-foreground">
            {order.project?.name} · Due {formatDateTime(order.dueDate)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ol className="relative">
          {stages.map((stage: any, idx: number) => {
            const unlocked = isUnlocked(stage);
            const active = ["IN_PROGRESS", "QC_PENDING"].includes(stage.status);
            return (
              <li
                key={stage.id}
                className={cn(
                  "relative pl-8 pb-4 last:pb-0",
                  idx < stages.length - 1 && "border-l-2 border-muted ml-2"
                )}
              >
                <span
                  className={cn(
                    "absolute -left-[9px] top-0 size-4 rounded-full border-2 flex items-center justify-center text-[8px] font-bold",
                    stage.status === "QC_PASSED" && "bg-emerald-600 border-emerald-600 text-white",
                    stage.status === "COMPLETED" && "bg-emerald-700 border-emerald-700 text-white",
                    stage.status === "IN_PROGRESS" && "bg-amber-500 border-amber-500 text-white",
                    stage.status === "QC_PENDING" && "bg-amber-500 border-amber-500 text-white animate-pulse",
                    stage.status === "QC_FAILED" && "bg-red-600 border-red-600 text-white",
                    stage.status === "SKIPPED" && "bg-muted border-muted-foreground text-muted-foreground",
                    stage.status === "NOT_STARTED" && "bg-background border-muted-foreground/50 text-transparent"
                  )}
                >
                  {stage.status === "QC_PASSED" || stage.status === "COMPLETED" ? "✓" : stage.status === "QC_FAILED" ? "✕" : ""}
                </span>

                <div className="rounded-lg border bg-card p-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">
                          {String(stage.stageOrder).padStart(2, "0")}
                        </span>
                        <p className="text-sm font-semibold truncate">{stage.stageName}</p>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 space-y-0.5">
                        {stage.operator && <p>Operator: {stage.operator.name}</p>}
                        {stage.startedAt && <p>Started: {formatDateTime(stage.startedAt)}</p>}
                        {stage.completedAt && <p>Completed: {formatDateTime(stage.completedAt)}</p>}
                        {stage.qcReport && (
                          <p className="text-amber-700">QC: {stage.qcReport.reportNo} ({stage.qcReport.status})</p>
                        )}
                        {stage.remarks && <p>Remarks: {stage.remarks}</p>}
                      </div>
                    </div>
                    <StatusBadge status={stage.status} />
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {canOperate && stage.status === "NOT_STARTED" && unlocked && (
                      <StageButton
                        label="Start"
                        icon={Play}
                        action="start-stage"
                        payload={{ stageId: stage.id }}
                      />
                    )}
                    {canOperate && stage.status === "IN_PROGRESS" && (
                      <StageButton
                        label="Complete for QC"
                        icon={CheckCircle2}
                        action="complete-stage"
                        payload={{ stageId: stage.id }}
                        className="bg-amber-600 hover:bg-amber-700"
                      />
                    )}
                    {canOperate && stage.status === "QC_FAILED" && (
                      <StageButton
                        label="Restart"
                        icon={Play}
                        action="start-stage"
                        payload={{ stageId: stage.id }}
                      />
                    )}
                    {canQc && stage.status === "QC_PENDING" && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-emerald-700 hover:bg-emerald-800"
                          onClick={() => onQcOpen(stage.id, stage.stageName)}
                        >
                          <ShieldCheck className="size-3.5" /> Submit QC
                        </Button>
                      </>
                    )}
                    {canQc && stage.status === "QC_PENDING" && (
                      <>
                        <QcPassButton stageId={stage.id} />
                        <QcFailButton stageId={stage.id} />
                      </>
                    )}
                    {canOperate && stage.status === "NOT_STARTED" && !unlocked && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="size-3" /> Locked — previous stage pending
                      </span>
                    )}
                    {canOperate && ["NOT_STARTED", "IN_PROGRESS"].includes(stage.status) && unlocked && (
                      <SkipButton stageId={stage.id} />
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

function StageButton({
  label,
  icon: Icon,
  action,
  payload,
  className,
}: {
  label: string;
  icon: any;
  action: string;
  payload: Record<string, any>;
  className?: string;
}) {
  const mutation = useAction();
  return (
    <Button
      size="sm"
      variant="default"
      className={className}
      disabled={mutation.isPending}
      onClick={() =>
        mutation.mutate({ action, ...payload }, {
          onSuccess: () => toast.success(`${label} — done`),
          onError: (e: any) => toast.error(e.message),
        })
      }
    >
      <Icon className="size-3.5" />
      {label}
    </Button>
  );
}

function QcPassButton({ stageId }: { stageId: string }) {
  const mutation = useAction();
  return (
    <Button
      size="sm"
      variant="outline"
      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
      disabled={mutation.isPending}
      onClick={() =>
        mutation.mutate(
          { action: "qc-pass-stage", stageId, qcReportData: { remarks: "QC passed (quick)" } },
          {
            onSuccess: () => toast.success("Stage QC passed"),
            onError: (e: any) => toast.error(e.message),
          }
        )
      }
    >
      <CheckCircle2 className="size-3.5" /> Pass
    </Button>
  );
}

function QcFailButton({ stageId }: { stageId: string }) {
  const mutation = useAction();
  return (
    <Button
      size="sm"
      variant="outline"
      className="border-red-300 text-red-700 hover:bg-red-50"
      disabled={mutation.isPending}
      onClick={() =>
        mutation.mutate(
          { action: "qc-fail-stage", stageId, qcReportData: { remarks: "QC failed — rework needed" } },
          {
            onSuccess: () => toast.success("Stage QC failed"),
            onError: (e: any) => toast.error(e.message),
          }
        )
      }
    >
      <AlertCircle className="size-3.5" /> Fail
    </Button>
  );
}

function SkipButton({ stageId }: { stageId: string }) {
  const mutation = useAction();
  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-muted-foreground"
      disabled={mutation.isPending}
      onClick={() => {
        const reason = window.prompt("Reason for skipping this stage?");
        if (!reason) return;
        mutation.mutate(
          { action: "skip-stage", stageId, reason },
          {
            onSuccess: () => toast.success("Stage skipped"),
            onError: (e: any) => toast.error(e.message),
          }
        );
      }}
    >
      <SkipForward className="size-3.5" /> Skip
    </Button>
  );
}
