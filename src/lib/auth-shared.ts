// Client-safe auth constants and types (no server-only imports).
// Split from auth.ts so client components can import these without pulling
// in `next/headers`.

import { UserRole } from "@prisma/client";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  avatar?: string | null;
}

// Role -> default landing page
export const ROLE_HOME: Record<UserRole, string> = {
  ADMIN: "admin",
  BUSINESS_MANAGER: "bm",
  ESTIMATION: "estimation",
  SALES: "sales",
  PROCUREMENT: "procurement",
  STORE: "store",
  QC: "qc",
  PRODUCTION: "production",
  ENGINEERING: "engineering",
  PROJECT: "project",
  FINANCE: "finance",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrator",
  BUSINESS_MANAGER: "Business Manager",
  ESTIMATION: "Estimation Department",
  SALES: "Sales Team",
  PROCUREMENT: "Procurement Department",
  STORE: "Store / Warehouse",
  QC: "Quality Control",
  PRODUCTION: "Production",
  ENGINEERING: "Engineering / Drafting",
  PROJECT: "Project Department",
  FINANCE: "Finance & Accounts",
};
