# Task 1 — Al Gurg Operations Portal: Printable slips + demo data expansion

## Agent
Z.ai Code (main agent — feature add-on task on top of existing ERP)

## Summary
Added downloadable/printable business-document slips for six key entity types
(Quotation, Payment Receipt, BOQ-M, LPO, GRN, QC Report) using a new reusable
`SlipDocument` component. Each slip opens in a dialog with a "Print / Save PDF"
button that uses the existing `.print-area`/`.no-print` CSS pipeline. Tightened the
print CSS for clean PDF output (proper `@page` margins, `print-color-adjust: exact`,
hidden footer/sidebar/topbar, 11pt font). Expanded the seed script with 5 new demo
entries covering distinct workflow stages (NEW enquiry, DRAFT quotation,
PENDING_APPROVAL quotation, SENT_TO_CLIENT quotation, IN_PROCUREMENT project, and
READY_FOR_DELIVERY project with all production stages QC_PASSED).

## Approach
- Kept the existing app shell, auth, API, and routing 100% unchanged. All edits are
  additive.
- The `SlipDocument` component is fully presentational and reusable: it accepts a
  generic props bag (title, documentNo, from/to, infoRows, items table with totals,
  notes, signatures, optional children) and renders a professional A4-style layout
  with an amber-800 logo band. The whole slip is wrapped in `.print-area`, and the
  toolbar with the Print button is wrapped in `.no-print`.
- Each view that needed a print button gets a small wrapper component (e.g.
  `PaymentRowActions`, `QcReportPrintButton`) holding local `useState` for the
  dialog open state. The slip's `SlipDialog` is rendered alongside the existing
  detail dialog so both can coexist.
- For the seed data expansion, the contradiction in the spec ("QUO-2026-004 status
  SENT_TO_CLIENT" vs "PRJ-2026-002 uses QUO-2026-004 signed+paid") was resolved by
  creating QUO-2026-005 as a parallel progressed quotation for the same Marina
  Apartments client, used to seed PRJ-2026-002. QUO-2026-004 itself stays at
  SENT_TO_CLIENT as a visible demo entry. Both demo stages are now represented.

## Files modified

### CSS
- `src/app/globals.css` — Reworked `@media print` block: added `@page { margin: 1.5cm }`,
  `print-color-adjust: exact` / `-webkit-print-color-adjust: exact`, 11pt body font,
  explicit `footer { display: none !important }`, sidebar/topbar/overlay hidden,
  `page-break-inside: avoid` for tables/images, `.print-area` resets box-shadow.

### New component
- `src/components/slip-document.tsx` — `SlipDocument` + `SlipDialog` exports.
  Renders a professional A4-style slip: amber-800 AG logo band header, From/To
  columns, info-row grid, bordered items table with `amountColumnIndex` right-align
  + grand-total highlighting, notes/terms block, signature grid, footer with TRN.
  Print button lives in a `.no-print` toolbar.

### Print-button integrations
- `src/components/views/quotation-detail.tsx` — Replaced bare `window.print()` with a
  "Print Quotation" button that opens a `SlipDialog` rendering the full QUOTATION
  slip with line items, subtotal/discount/VAT/grand-total, validity/delivery/
  payment/warranty info rows, and 3 signatures (Estimation, BM, Client).
- `src/components/views/finance-view.tsx` — Added `PaymentRowActions` component
  with a "Receipt" button on every payment link row, opening a PAYMENT RECEIPT
  slip. Preserves the existing Mark-Paid button.
- `src/components/views/boq-list.tsx` — Added "Print BOQ" button inside the BOQ
  detail dialog, opening a BILL OF QUANTITY (MATERIAL) slip showing items with
  availability + From Estimation / To Procurement (internal document).
- `src/components/views/lpo-list.tsx` — Added "Print LPO" button inside the LPO
  detail dialog, opening a LOCAL PURCHASE ORDER slip. Parses `pr.itemsJson` for
  the line items, computes per-line totals, and shows grand-total amount +
  Procurement Head / Business Manager signatures.
- `src/components/views/grn-view.tsx` — Added "Print GRN" button inside the GRN
  detail dialog, opening a GOODS RECEIVING NOTE slip. Items table is a checklist
  of documents received (delivery note / tax invoice / LPO copy). Store Keeper /
  QC Head signatures.
- `src/components/views/qc-view.tsx` — Added `QcReportPrintButton` to the
  "All QC reports" tab; opens a QC INSPECTION REPORT slip with checklist table,
  missing-items + remarks in notes, and the QC officer signature. Lazy-loads the
  full report via `useDetail("qc-report", ...)` only when the print button is
  clicked.

### Seed expansion
- `scripts/seed.ts` — Inserted a "NEW DEMO ENTRIES" block before the
  Notifications section, adding:
  - 3 new clients: Mrs. Fatima Al Sayed (retail), Dubai Marina Apartments
    (project), Al Gurg Group Internal (project).
  - ENQ-2026-003 (NEW, phone, Fatima wardrobe+vanity)
  - QUO-2026-002 (DRAFT, for ENQ-2026-002 walk-in wardrobe, ~AED 18,500)
  - QUO-2026-003 (PENDING_APPROVAL, for Fatima, ~AED 32,000) + Roy's comment
    asking Mazen to review vanity stone top pricing.
  - ENQ-2026-004 + QUO-2026-004 (SENT_TO_CLIENT, Marina Apartments kitchen
    cabinets, 50 units @ AED 2,200 = AED 110,000), approved by Mazen, sent to
    client, awaiting signature.
  - QUO-2026-005 (ORDER_RELEASED for Marina Apartments, signed + 30% advance
    paid via PAY-2026-002).
  - PRJ-2026-002 (Marina Apartments Kitchen renovation, IN_PROCUREMENT) with
    BOQ-M-002 issued + MRQ-2026-002 (SUBMITTED, awaiting supplier quotes for
    laminate).
  - ENQ-2026-005 + QUO-2026-006 (signed + paid internal Al Gurg HQ office
    furniture) + PRJ-2026-003 (READY_FOR_DELIVERY) with PRD-2026-003 joinery
    production order, all 9 stages QC_PASSED with linked QC reports, plus
    DRW-2026-002 drawing submission.
  - 6 new notifications (new enquiry, pending approval, awaiting client
    signature, BOQ received, MRQ awaiting quotes, project ready for delivery).

## Database counts after re-seed
- Enquiries: 5 (was 2)
- Quotations: 6 (was 1) — covering DRAFT, PENDING_APPROVAL, SENT_TO_CLIENT,
  ORDER_RELEASED x3
- Projects: 3 (was 1) — IN_PRODUCTION, IN_PROCUREMENT, READY_FOR_DELIVERY
- BOQs: 2, MRQs: 2, QC reports: 12 (9 new for PRJ-2026-003's 9 stages),
  Timeline events: 34, Notifications: 14.

## Verification
- `bun run lint` — clean (no errors, no warnings).
- `pkill -f next-server; rm db/custom.db; bun run db:push; bun run scripts/seed.ts`
  — ran successfully, all demo accounts + new entries inserted.
- `setsid nohup bash .zscripts/dev.sh > /tmp/dev-final.log 2>&1 &` — dev server
  healthy, Next.js "ready" + health-check 200, mini-services step started cleanly.
- `curl -s http://127.0.0.1:3000/` — HTTP 200, page contains Al Gurg branding and
  login form markup (AG001, Welcome, loginId).

## Known deviations / notes
- The task spec lists QUO-2026-004 as both SENT_TO_CLIENT and (separately) as the
  signed+paid quotation used by PRJ-2026-002. These two states are mutually
  exclusive on a single row, so I created QUO-2026-005 as the progressed (signed +
  paid + ORDER_RELEASED) quotation that seeds PRJ-2026-002, leaving QUO-2026-004
  in SENT_TO_CLIENT state as the "sent, awaiting client signature" demo entry.
  This way both workflow stages are visibly represented in the quotations list.
- All amounts in AED; all dates in dd-MMM-yyyy (via `formatCurrency`/`formatDate`
  from `src/lib/format.ts`).
- `SlipDocument` uses inline `style` for the dynamic signature-column count
  (Tailwind can't generate `grid-cols-N` for arbitrary N at runtime). This is
  necessary because the number of signatures varies per document (1 to 3).
