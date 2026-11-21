"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { titleCase } from "@/lib/format";

type Tone =
  | "gray"
  | "amber"
  | "green"
  | "red"
  | "blue"
  | "purple"
  | "orange"
  | "teal";

const TONE_CLASSES: Record<Tone, string> = {
  gray: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  amber:
    "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
  green:
    "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
  red: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900",
  blue: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-900",
  purple:
    "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-950 dark:text-fuchsia-300 dark:border-fuchsia-900",
  orange:
    "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900",
  teal: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-900",
};

// Maps known statuses to a tone. Unknown ones default by keyword sniffing.
const STATUS_TONE_MAP: Record<string, Tone> = {
  // Enquiry
  NEW: "amber",
  IN_ESTIMATION: "blue",
  QUOTED: "teal",
  CONFIRMED: "green",
  LOST: "red",
  ON_HOLD: "gray",
  // Quotation
  DRAFT: "gray",
  PENDING_APPROVAL: "amber",
  APPROVED: "green",
  REJECTED: "red",
  SENT_TO_CLIENT: "blue",
  SIGNED_CONFIRMED: "green",
  PAYMENT_LINK_SENT: "purple",
  PAID: "green",
  LPO_RECEIVED: "teal",
  ORDER_RELEASED: "green",
  // Project
  IN_PLANNING: "blue",
  IN_PROCUREMENT: "amber",
  IN_ENGINEERING: "blue",
  IN_PRODUCTION: "amber",
  QC_IN_PROGRESS: "purple",
  READY_FOR_DELIVERY: "teal",
  DELIVERED: "teal",
  IN_INSTALLATION: "blue",
  INSTALLED: "teal",
  FEEDBACK_PENDING: "amber",
  COMPLETED: "green",
  CANCELLED: "red",
  // BOQ
  ISSUED_TO_PROCUREMENT: "blue",
  // MRQ
  SUBMITTED: "blue",
  QUOTED: "teal",
  CONVERTED_TO_PR: "teal",
  CONVERTED_TO_LPO: "teal",
  // Generic
  PENDING: "amber",
  RECEIVED: "blue",
  QC_PENDING: "amber",
  QC_PASSED: "green",
  QC_FAILED: "red",
  QC_PARTIAL: "orange",
  INVOICED: "teal",
  INVOICING: "teal",
  CLOSED: "gray",
  IN_PROGRESS: "blue",
  NOT_STARTED: "gray",
  SKIPPED: "gray",
  ISSUED: "blue",
  SENT_TO_SUPPLIER: "blue",
  DELIVERED: "teal",
  PARTIAL: "orange",
  SCHEDULED: "gray",
  COMPLETED: "green",
  INSPECTED: "teal",
  PASSED: "green",
  FAILED: "red",
  REWORK: "orange",
  // Drawing
  SUBMITTED_TO_PM: "blue",
  SUBMITTED_TO_SALES: "blue",
  SUBMITTED_TO_CLIENT: "amber",
  // Payment
  GENERATED: "amber",
  SENT: "blue",
  EXPIRED: "gray",
  // Severity
  LOW: "gray",
  MEDIUM: "amber",
  HIGH: "orange",
  CRITICAL: "red",
  // Delay
  OPEN: "red",
  IN_REVIEW: "amber",
  RESOLVED: "green",
  RELEASED: "blue",
  APPROVED: "green",
};

function inferTone(status: string): Tone {
  const key = status?.toUpperCase?.();
  if (key && STATUS_TONE_MAP[key]) return STATUS_TONE_MAP[key];
  const lower = (status || "").toLowerCase();
  if (/(fail|reject|lost|cancel|critical|overdue|open)/.test(lower)) return "red";
  if (/(pend|wait|draft|hold|expir)/.test(lower)) return "amber";
  if (/(approv|pass|paid|complet|confirm|signed)/.test(lower)) return "green";
  if (/(sent|submit|in_progress|in-prog|processing|issued|received)/.test(lower))
    return "blue";
  if (/(partial|rework|warn)/.test(lower)) return "orange";
  return "gray";
}

export function StatusBadge({
  status,
  className,
  children,
}: {
  status?: string | null;
  className?: string;
  children?: React.ReactNode;
}) {
  const value = (status ?? "") as string;
  const tone = inferTone(value);
  return (
    <Badge
      variant="outline"
      className={cn(TONE_CLASSES[tone], "font-medium capitalize", className)}
    >
      {children ?? (value ? titleCase(value) : "-")}
    </Badge>
  );
}
