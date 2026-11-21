"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "amber" | "green" | "red" | "blue";
}) {
  const toneClasses: Record<string, string> = {
    default: "text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300",
    amber: "text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300",
    green:
      "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300",
    red: "text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300",
    blue: "text-sky-700 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-300",
  };
  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="flex items-start justify-between p-4 gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
            {label}
          </p>
          <p className="text-2xl font-bold leading-none">{value}</p>
          {hint && (
            <p className="text-xs text-muted-foreground truncate">{hint}</p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "rounded-lg p-2.5 shrink-0",
              toneClasses[tone]
            )}
          >
            <Icon className="size-5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-2 border border-dashed rounded-xl bg-muted/30">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground max-w-sm">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-3 border-b">
      <div className="space-y-0.5">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function LoadingState({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-12 rounded-md bg-muted animate-pulse"
          style={{ opacity: 1 - i * 0.1 }}
        />
      ))}
    </div>
  );
}
