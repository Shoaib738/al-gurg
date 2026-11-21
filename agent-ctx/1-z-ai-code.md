# Task 1 — Al Gurg Furniture Production & Operations ERP

## Agent
Z.ai Code (main agent — single comprehensive task)

## Summary
Built a complete, single-page Next.js 16 ERP application for Al Gurg Furniture Group
covering the full enquiry → quotation → approval → order → procurement (BOQ/MRQ/PR/LPO)
→ store/GRN → QC → production (joinery 9 stages + metal 5 stages with QC gates) →
engineering drawings → delivery/installation → feedback → finance workflow, plus
red flags, delays, timeline tracking, and notifications.

## Approach
Because the spec required the user-visible surface to live entirely on `/` and the
API to remain thin, the implementation uses:
- A single generic `/api/data` route handling ~45 GET views and ~45 POST actions via
  switch statements, with Prisma includes for full relational fetches.
- Client-side state (Zustand-style useState in AppShell) for navigation between
  role-filtered views.
- TanStack Query for all server state.
- Role-aware navigation map (`src/lib/nav.ts`).
- Tailwind theme retuned to a warm copper/amber primary palette (no indigo/blue).

## Files created / modified
Modified:
- src/app/page.tsx — server component, session-gated (LoginScreen | AppShell)
- src/app/layout.tsx — amber theme, TanStack + Sonner providers, ERP metadata
- src/app/globals.css — copper/amber theme tokens, print + scrollbar helpers
- src/lib/auth.ts — slimmed to server-only (imports SessionUser type from auth-shared)

Created (lib):
- src/lib/auth-shared.ts — client-safe SessionUser type + ROLE_LABELS + ROLE_HOME
- src/lib/nav.ts — ROLE_NAV + VIEW_TITLES
- src/lib/format.ts — AED currency, dd-MMM-yyyy dates, parseJsonSafe
- src/lib/queries.ts — useList/useDetail/useDashboard/useAction/useNotifications + re-exports

Created (API):
- src/app/api/data/route.ts — generic GET/POST data API (all views + actions)

Created (components):
- src/components/providers.tsx — TanStack QueryClientProvider
- src/components/login-screen.tsx — branded login with 11 demo accounts
- src/components/app-shell.tsx — sidebar (desktop + mobile Sheet), topbar, notifications bell, footer
- src/components/view-router.tsx — dispatches active view to component
- src/components/status-badge.tsx — color-mapped status badge for all app statuses
- src/components/erp/primitives.tsx — StatCard / EmptyState / PageHeader / LoadingState
- src/components/erp/data-table.tsx — striped, sticky-header, hover, click-to-open table
- src/components/erp/action-button.tsx — mutation-driven button with toast
- src/components/erp/email-preview.tsx — simulated email confirmation dialog
- src/components/erp/timeline.tsx — vertical timeline strip

Created (views):
- src/components/views/dashboard-view.tsx — role-tailored dashboards (admin, bm, estimation, sales, procurement, store, qc, production, engineering, project-dept, finance)
- src/components/views/enquiry-list.tsx — list + create dialog + detail dialog
- src/components/views/quotation-list.tsx — list + create entry
- src/components/views/quotation-form.tsx — multi-line item builder with auto-costing
- src/components/views/quotation-detail.tsx — full workflow: edit/submit/approve/reject/comment/send/sign/generate-payment-link/mark-paid/release-order + comments + timeline + print + simulated order-release email
- src/components/views/project-list.tsx
- src/components/views/project-detail.tsx — 11-tab centerpiece (overview, quotation, boq, procurement, store, production, engineering, delivery/install, feedback, flags & delays, timeline)
- src/components/views/production-stage-stepper.tsx — sequential QC-gated stage pipeline with Start/Complete/Submit-QC/Pass/Fail/Skip; gates next stage until current is QC_PASSED
- src/components/views/qc-report-form.tsx — checklist + missing items + photos + remarks; emits simulated email on submit
- src/components/views/boq-list.tsx, mrq-list.tsx, supplier-quote-list.tsx, pr-list.tsx, lpo-list.tsx — list + detail + role-gated actions (issue boq, request supplier quote, approve quote, approve PR, convert to LPO, send LPO with email)
- src/components/views/grn-view.tsx — GRNs + pending tax invoices tracker + create + QC link
- src/components/views/qc-view.tsx — pending delivery + pending stage inspections + reports
- src/components/views/production-view.tsx — production orders + create + stage stepper
- src/components/views/drawings-view.tsx — drawings + create + approval workflow buttons
- src/components/views/finance-view.tsx — payment links + generate + mark paid + ready-for-final
- src/components/views/project-dept-view.tsx — delivery/install/feedback phase projects
- src/components/views/red-flags-delays-view.tsx — red flags + delays with raise & resolve
- src/components/views/clients-view.tsx, suppliers-view.tsx, materials-view.tsx, users-view.tsx

## Verification
- `bun run lint` — clean (no errors, no warnings).
- `curl http://localhost:3000/` — returns 200 with login screen markup.
- Login (admin@algurg.test / demo123) returns user JSON; cookie persists.
- Notifications endpoint returns role-specific items.
- Dashboard endpoints (admin, bm, ...) return real seeded counts/lists.
- Project detail returns full relations (2 production orders with 9 & 5 stages, 10 timeline events, red flags, mrqs, lpos).
- POST actions verified: `raise-red-flag` creates a flag visible in `red-flags` view; `start-stage` transitions stage to IN_PROGRESS.
- agent-browser visual check: login screen renders all 11 demo accounts; clicking Mazen logs in and shows BM dashboard with active projects, red-flag counts; project detail renders all 11 tabs; production tab shows joinery stages (Pressing → ... → Delivery) with QC PASSED badges and locked subsequent stages.

## Known limitations / deviations
- Auth is the pre-existing demo cookie scheme (any 3+ char password). No real NextAuth.
- `useDemoUsers` lookup hook was removed from the login screen (the demo accounts are
  hard-coded which is sufficient and avoids an unauthenticated fetch to `/api/data`).
- Procurement dashboard's "supplier quotes pending approval" list is fetched from the
  dashboard endpoint; supplier quotes are not directly attached to a Project (they live
  under MRQ), so the project-detail Procurement tab flattens them from `mrqs.supplierQuotes`.
- Mobile nav uses a Sheet drawer as specified; touch targets meet ≥44px.
- No file uploads — attachments/images are URL or filename strings only (demo).
- No edit/delete for users, clients, suppliers, materials beyond create (read-only lists
  per spec for users).
- `bun run build` was not run (sandbox restriction per task instructions).
