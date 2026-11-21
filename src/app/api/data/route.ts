import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { Prisma, UserRole } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// =====================================================
// Helpers
// =====================================================

const JOINERY_STAGES = [
  "Pressing",
  "Cutting",
  "Lipping/Edge Banding",
  "Boring",
  "CNC Routing",
  "Sanding",
  "Painting",
  "Packing",
  "Delivery",
];
const METAL_STAGES = ["Cutting", "Welding", "Painting", "Packing", "Delivery"];

async function notifyUsers(
  roles: UserRole[],
  type: string,
  title: string,
  message: string,
  refType?: string,
  refId?: string
) {
  const users = await db.user.findMany({
    where: { role: { in: roles }, isActive: true },
    select: { id: true },
  });
  if (users.length === 0) return;
  await db.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type,
      title,
      message,
      refType: refType ?? null,
      refId: refId ?? null,
    })),
  });
}

async function timelineEvent(
  data: Prisma.TimelineEventUncheckedCreateInput
) {
  return db.timelineEvent.create({ data });
}

function genNumber(prefix: string): string {
  const stamp = Date.now().toString().slice(-8);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `${prefix}-${stamp}${rand}`;
}

function computeQuotationTotals(
  items: Array<{
    materialCost?: number;
    laborHours?: number;
    laborRate?: number;
    qty?: number;
  }>
) {
  let subtotal = 0;
  const computed = items.map((it, idx) => {
    const materialCost = Number(it.materialCost) || 0;
    const laborHours = Number(it.laborHours) || 0;
    const laborRate = Number(it.laborRate) || 0;
    const qty = Number(it.qty) || 0;
    const unitPrice = (materialCost + laborHours * laborRate) * 1.4;
    const total = unitPrice * qty;
    subtotal += total;
    return { idx, unitPrice, total };
  });
  const discount = 0;
  const vat = subtotal * 0.05;
  const grand = subtotal - discount + vat;
  return { computed, subtotal, discount, vat, total: grand };
}

// =====================================================
// GET views
// =====================================================

async function handleGet(req: NextRequest, session: any) {
  const { searchParams } = new URL(req.url);
  const view = (searchParams.get("view") || "").toLowerCase();
  const id = searchParams.get("id") || undefined;

  switch (view) {
    case "notifications": {
      const items = await db.notification.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: "desc" },
        take: 30,
      });
      const unread = items.filter((n) => !n.read).length;
      return { items, unread };
    }

    case "dashboard-admin": {
      const [
        users,
        clients,
        suppliers,
        materials,
        enquiries,
        quotations,
        projects,
        boqs,
        mrqs,
        prs,
        lpos,
        grns,
        productionOrders,
        drawings,
        redFlags,
        delays,
        pendingApprovals,
      ] = await Promise.all([
        db.user.count(),
        db.client.count(),
        db.supplier.count(),
        db.material.count(),
        db.enquiry.count(),
        db.quotation.count(),
        db.project.count(),
        db.boq.count(),
        db.materialRequisition.count(),
        db.purchaseRequest.count(),
        db.localPurchaseOrder.count(),
        db.goodsReceivingNote.count(),
        db.productionOrder.count(),
        db.drawingSubmission.count(),
        db.redFlag.count({ where: { resolved: false } }),
        db.delayComplaint.count({ where: { status: { not: "RESOLVED" } } }),
        db.quotation.count({ where: { status: "PENDING_APPROVAL" } }),
      ]);
      const recentProjects = await db.project.findMany({
        orderBy: { updatedAt: "desc" },
        take: 6,
        include: { client: true },
      });
      const recentTimeline = await db.timelineEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 12,
        include: { user: true, project: true },
      });
      return {
        counts: {
          users,
          clients,
          suppliers,
          materials,
          enquiries,
          quotations,
          projects,
          boqs,
          mrqs,
          prs,
          lpos,
          grns,
          productionOrders,
          drawings,
          redFlags,
          delays,
          pendingApprovals,
        },
        recentProjects,
        recentTimeline,
      };
    }

    case "dashboard-bm": {
      const projects = await db.project.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          client: true,
          redFlags: { where: { resolved: false } },
          delays: { where: { status: { not: "RESOLVED" } } },
          timeline: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      });
      const pendingApprovals = await db.quotation.findMany({
        where: { status: "PENDING_APPROVAL" },
        include: { client: true, enquiry: true, creator: true },
      });
      const openRedFlags = await db.redFlag.findMany({
        where: { resolved: false },
        include: { project: { include: { client: true } }, raiser: true },
        orderBy: { createdAt: "desc" },
      });
      const openDelays = await db.delayComplaint.findMany({
        where: { status: { not: "RESOLVED" } },
        include: { project: { include: { client: true } }, raiser: true },
        orderBy: { createdAt: "desc" },
      });
      return { projects, pendingApprovals, openRedFlags, openDelays };
    }

    case "dashboard-estimation": {
      const enquiries = await db.enquiry.findMany({
        where: { status: { in: ["NEW", "IN_ESTIMATION"] } },
        include: { client: true, salesUser: true, quotations: true },
        orderBy: { createdAt: "desc" },
      });
      const drafts = await db.quotation.findMany({
        where: { status: "DRAFT" },
        include: { client: true, enquiry: true },
        orderBy: { updatedAt: "desc" },
      });
      const submittedForApproval = await db.quotation.findMany({
        where: { status: "PENDING_APPROVAL" },
        include: { client: true, enquiry: true },
      });
      const orderReady = await db.quotation.findMany({
        where: { status: { in: ["PAID", "LPO_RECEIVED"] } },
        include: { client: true, enquiry: true },
      });
      return { enquiries, drafts, submittedForApproval, orderReady };
    }

    case "dashboard-sales": {
      const enquiries = await db.enquiry.findMany({
        include: { client: true, quotations: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      const sent = await db.quotation.findMany({
        where: { status: "SENT_TO_CLIENT" },
        include: { client: true, enquiry: true },
      });
      const signed = await db.quotation.findMany({
        where: { status: "SIGNED_CONFIRMED" },
        include: { client: true, enquiry: true },
      });
      return { enquiries, sent, signed };
    }

    case "dashboard-procurement": {
      const boqs = await db.boq.findMany({
        where: { status: { in: ["ISSUED_TO_PROCUREMENT", "IN_PROCUREMENT"] } },
        include: { project: { include: { client: true } }, issuer: true },
        orderBy: { createdAt: "desc" },
      });
      const mrqs = await db.materialRequisition.findMany({
        where: { status: { not: "CONVERTED_TO_PR" } },
        include: { project: { include: { client: true } }, creator: true },
        orderBy: { createdAt: "desc" },
      });
      const supplierQuotes = await db.supplierQuote.findMany({
        where: { status: "PENDING" },
        include: { supplier: true, mrq: true, requester: true },
      });
      const prs = await db.purchaseRequest.findMany({
        where: { status: { in: ["PENDING", "APPROVED"] } },
        include: { supplier: true, project: { include: { client: true } } },
        orderBy: { createdAt: "desc" },
      });
      const lpos = await db.localPurchaseOrder.findMany({
        where: { status: { in: ["ISSUED", "SENT_TO_SUPPLIER"] } },
        include: { supplier: true, project: { include: { client: true } } },
        orderBy: { createdAt: "desc" },
      });
      return { boqs, mrqs, supplierQuotes, prs, lpos };
    }

    case "dashboard-store": {
      const grns = await db.goodsReceivingNote.findMany({
        include: {
          lpo: { include: { supplier: true } },
          project: { include: { client: true } },
          storeUser: true,
        },
        orderBy: { receivedAt: "desc" },
      });
      const pendingQc = grns.filter((g) => g.status === "QC_PENDING");
      const missingTax = grns.filter((g) => !g.taxInvoiceSubmitted);
      const recent = await db.localPurchaseOrder.findMany({
        where: { status: "SENT_TO_SUPPLIER" },
        include: { supplier: true, project: { include: { client: true } } },
        take: 8,
      });
      return { grns, pendingQc, missingTax, recent };
    }

    case "dashboard-qc": {
      const pendingDelivery = await db.goodsReceivingNote.findMany({
        where: { status: "QC_PENDING" },
        include: {
          lpo: { include: { supplier: true } },
          project: { include: { client: true } },
        },
      });
      const pendingStages = await db.productionStage.findMany({
        where: { status: "QC_PENDING" },
        include: {
          productionOrder: { include: { project: { include: { client: true } } } },
          operator: true,
        },
        orderBy: { completedAt: "desc" },
      });
      const reports = await db.qcReport.findMany({
        include: { qcUser: true },
        orderBy: { createdAt: "desc" },
        take: 12,
      });
      return { pendingDelivery, pendingStages, reports };
    }

    case "dashboard-production": {
      const orders = await db.productionOrder.findMany({
        include: {
          project: { include: { client: true } },
          stages: { orderBy: { stageOrder: "asc" } },
          releaser: true,
        },
        orderBy: { createdAt: "desc" },
      });
      const active = orders.filter((o) =>
        o.stages.some((s) => s.status === "IN_PROGRESS" || s.status === "QC_PENDING")
      );
      return { orders, active };
    }

    case "dashboard-engineering": {
      const drawings = await db.drawingSubmission.findMany({
        include: {
          project: { include: { client: true } },
          drawnBy: true,
          approver: true,
        },
        orderBy: { createdAt: "desc" },
      });
      const drafts = drawings.filter((d) => d.status === "DRAFT");
      const submitted = drawings.filter((d) =>
        ["SUBMITTED_TO_PM", "SUBMITTED_TO_SALES", "SUBMITTED_TO_CLIENT"].includes(
          d.status
        )
      );
      const awaitingClient = drawings.filter(
        (d) => d.status === "SUBMITTED_TO_CLIENT"
      );
      return { drawings, drafts, submitted, awaitingClient };
    }

    case "dashboard-project": {
      const projects = await db.project.findMany({
        where: {
          status: {
            in: [
              "READY_FOR_DELIVERY",
              "DELIVERED",
              "IN_INSTALLATION",
              "INSTALLED",
              "FEEDBACK_PENDING",
            ],
          },
        },
        include: {
          client: true,
          deliveryAck: true,
          installation: true,
          feedback: true,
        },
        orderBy: { updatedAt: "desc" },
      });
      return { projects };
    }

    case "dashboard-finance": {
      const paymentLinks = await db.paymentLink.findMany({
        include: {
          project: { include: { client: true } },
          quotation: true,
          generator: true,
        },
        orderBy: { createdAt: "desc" },
      });
      const readyForFinal = await db.project.findMany({
        where: { status: "FEEDBACK_PENDING" },
        include: { client: true, quotation: true },
      });
      const paid = paymentLinks.filter((p) => p.status === "PAID").length;
      const pending = paymentLinks.filter((p) => p.status !== "PAID").length;
      return { paymentLinks, readyForFinal, paid, pending };
    }

    case "enquiries": {
      return await db.enquiry.findMany({
        include: { client: true, salesUser: true, quotations: true },
        orderBy: { createdAt: "desc" },
      });
    }

    case "enquiry": {
      return await db.enquiry.findUnique({
        where: { id },
        include: {
          client: true,
          salesUser: true,
          quotations: { include: { client: true } },
          projects: true,
          timeline: {
            orderBy: { createdAt: "asc" },
            include: { user: true },
          },
        },
      });
    }

    case "quotations": {
      return await db.quotation.findMany({
        include: { client: true, enquiry: true, creator: true },
        orderBy: { createdAt: "desc" },
      });
    }

    case "quotation": {
      return await db.quotation.findUnique({
        where: { id },
        include: {
          client: true,
          enquiry: true,
          creator: true,
          approver: true,
          items: { orderBy: { lineNumber: "asc" } },
          comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
          attachments: true,
          approvalLogs: { include: { user: true }, orderBy: { createdAt: "asc" } },
          projects: true,
          boqs: true,
          paymentLinks: true,
          timeline: {
            orderBy: { createdAt: "asc" },
            include: { user: true },
          },
        },
      });
    }

    case "projects": {
      return await db.project.findMany({
        include: {
          client: true,
          quotation: true,
          enquiry: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    case "project": {
      return await db.project.findUnique({
        where: { id },
        include: {
          client: true,
          enquiry: true,
          quotation: {
            include: { items: { orderBy: { lineNumber: "asc" } }, creator: true },
          },
          boqs: { include: { items: true, issuer: true }, orderBy: { createdAt: "desc" } },
          mrqs: {
            include: {
              items: true,
              creator: true,
              supplierQuotes: { include: { supplier: true, approver: true } },
              prs: true,
            },
            orderBy: { createdAt: "desc" },
          },
          prs: {
            include: { supplier: true, creator: true, supplierQuote: true, lpos: true },
          },
          lpos: {
            include: {
              supplier: true,
              creator: true,
              pr: true,
              grns: { include: { qcReport: true, storeUser: true } },
            },
          },
          grns: {
            include: { lpo: { include: { supplier: true } }, qcReport: true, storeUser: true },
          },
          productionOrders: {
            include: {
              stages: {
                orderBy: { stageOrder: "asc" },
                include: { operator: true, qcReport: true },
              },
              releaser: true,
            },
            orderBy: { createdAt: "asc" },
          },
          drawings: {
            include: { drawnBy: true, approver: true },
            orderBy: { createdAt: "desc" },
          },
          deliveryAck: { include: { deliverer: true } },
          installation: { include: { teamLead: true, inspection: true } },
          feedback: { include: { submitter: true } },
          paymentLinks: { include: { generator: true, quotation: true } },
          redFlags: { include: { raiser: true }, orderBy: { createdAt: "desc" } },
          delays: { include: { raiser: true }, orderBy: { createdAt: "desc" } },
          timeline: {
            orderBy: { createdAt: "asc" },
            include: { user: true },
          },
        },
      });
    }

    case "boqs": {
      return await db.boq.findMany({
        include: {
          project: { include: { client: true } },
          issuer: true,
          items: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    case "boq": {
      return await db.boq.findUnique({
        where: { id },
        include: {
          project: { include: { client: true } },
          issuer: true,
          quotation: true,
          items: { include: { material: true } },
        },
      });
    }

    case "mrqs": {
      return await db.materialRequisition.findMany({
        include: {
          project: { include: { client: true } },
          creator: true,
          items: true,
          supplierQuotes: { include: { supplier: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    case "mrq": {
      return await db.materialRequisition.findUnique({
        where: { id },
        include: {
          project: { include: { client: true } },
          creator: true,
          items: { include: { material: true } },
          supplierQuotes: {
            include: { supplier: true, requester: true, approver: true, prs: true },
          },
          prs: { include: { supplier: true } },
        },
      });
    }

    case "supplier-quotes": {
      return await db.supplierQuote.findMany({
        include: {
          supplier: true,
          mrq: { include: { project: { include: { client: true } } } },
          requester: true,
          approver: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    case "supplier-quote": {
      return await db.supplierQuote.findUnique({
        where: { id },
        include: {
          supplier: true,
          mrq: { include: { project: true, items: true } },
          requester: true,
          approver: true,
          prs: { include: { supplier: true } },
        },
      });
    }

    case "prs": {
      return await db.purchaseRequest.findMany({
        include: {
          supplier: true,
          project: { include: { client: true } },
          creator: true,
          lpos: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    case "pr": {
      return await db.purchaseRequest.findUnique({
        where: { id },
        include: {
          supplier: true,
          project: { include: { client: true } },
          creator: true,
          supplierQuote: true,
          lpos: { include: { supplier: true, grns: true } },
        },
      });
    }

    case "lpos": {
      return await db.localPurchaseOrder.findMany({
        include: {
          supplier: true,
          project: { include: { client: true } },
          creator: true,
          pr: true,
          grns: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    case "lpo": {
      return await db.localPurchaseOrder.findUnique({
        where: { id },
        include: {
          supplier: true,
          project: { include: { client: true } },
          creator: true,
          pr: true,
          grns: {
            include: { qcReport: true, storeUser: true },
          },
        },
      });
    }

    case "grns": {
      return await db.goodsReceivingNote.findMany({
        include: {
          lpo: { include: { supplier: true, pr: true } },
          project: { include: { client: true } },
          storeUser: true,
          qcReport: true,
        },
        orderBy: { receivedAt: "desc" },
      });
    }

    case "grn": {
      return await db.goodsReceivingNote.findUnique({
        where: { id },
        include: {
          lpo: { include: { supplier: true, project: { include: { client: true } } } },
          project: { include: { client: true } },
          storeUser: true,
          qcReport: { include: { qcUser: true } },
        },
      });
    }

    case "qc-reports": {
      return await db.qcReport.findMany({
        include: {
          qcUser: true,
          grn: { include: { lpo: { include: { supplier: true } } } },
          productionStages: { include: { productionOrder: true } },
          installation: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    case "qc-report": {
      return await db.qcReport.findUnique({
        where: { id },
        include: {
          qcUser: true,
          grn: true,
          productionStages: { include: { productionOrder: true } },
          installation: true,
        },
      });
    }

    case "production-orders": {
      return await db.productionOrder.findMany({
        include: {
          project: { include: { client: true } },
          releaser: true,
          stages: {
            orderBy: { stageOrder: "asc" },
            include: { operator: true, qcReport: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    case "production-order": {
      return await db.productionOrder.findUnique({
        where: { id },
        include: {
          project: { include: { client: true } },
          releaser: true,
          stages: {
            orderBy: { stageOrder: "asc" },
            include: { operator: true, qcReport: true },
          },
        },
      });
    }

    case "drawings": {
      return await db.drawingSubmission.findMany({
        include: {
          project: { include: { client: true } },
          drawnBy: true,
          approver: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    case "drawing": {
      return await db.drawingSubmission.findUnique({
        where: { id },
        include: {
          project: { include: { client: true } },
          drawnBy: true,
          approver: true,
        },
      });
    }

    case "clients": {
      return await db.client.findMany({
        include: {
          _count: { select: { enquiries: true, quotations: true, projects: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    case "suppliers": {
      return await db.supplier.findMany({
        include: {
          _count: { select: { supplierQuotes: true, prs: true, lpos: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    case "materials": {
      return await db.material.findMany({
        include: { supplier: true },
        orderBy: { createdAt: "desc" },
      });
    }

    case "users": {
      return await db.user.findMany({
        orderBy: { createdAt: "asc" },
      });
    }

    case "red-flags": {
      return await db.redFlag.findMany({
        include: {
          project: { include: { client: true } },
          raiser: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    case "delays": {
      return await db.delayComplaint.findMany({
        include: {
          project: { include: { client: true } },
          raiser: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    case "payment-links": {
      return await db.paymentLink.findMany({
        include: {
          project: { include: { client: true } },
          quotation: true,
          generator: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    case "clients-and-materials": {
      const [clients, materials, suppliers, salesUsers] = await Promise.all([
        db.client.findMany({ orderBy: { name: "asc" } }),
        db.material.findMany({ include: { supplier: true } }),
        db.supplier.findMany({ orderBy: { name: "asc" } }),
        db.user.findMany({ where: { role: "SALES" } }),
      ]);
      return { clients, materials, suppliers, salesUsers };
    }

    default:
      return { error: `Unknown view: ${view}` };
  }
}

// =====================================================
// POST actions
// =====================================================

async function handlePost(payload: any, session: any) {
  const action = payload.action;
  const uid = session.id;
  const role = session.role as UserRole;

  switch (action) {
    // ---- Enquiry ----
    case "create-enquiry": {
      const count = await db.enquiry.count();
      const enquiryNo = `ENQ-${String(count + 1).padStart(4, "0")}`;
      const enq = await db.enquiry.create({
        data: {
          enquiryNo,
          clientId: payload.clientId,
          salesUserId: payload.salesUserId || uid,
          title: payload.title,
          description: payload.description || "",
          projectType: payload.projectType || null,
          location: payload.location || null,
          source: (payload.source || "EMAIL") as any,
          attachments: payload.attachments
            ? JSON.stringify(payload.attachments)
            : null,
          status: "IN_ESTIMATION",
        },
      });
      await timelineEvent({
        enquiryId: enq.id,
        userId: uid,
        stage: "ENQUIRY",
        message: `Enquiry ${enquiryNo} created for "${payload.title}"`,
      });
      await notifyUsers(
        ["ESTIMATION"],
        "NEW_ENQUIRY",
        "New enquiry for estimation",
        `${enquiryNo}: ${payload.title}`,
        "ENQUIRY",
        enq.id
      );
      return { success: true, id: enq.id, enquiryNo };
    }

    // ---- Quotation create / update ----
    case "create-quotation": {
      const enquiry = await db.enquiry.findUnique({
        where: { id: payload.enquiryId },
      });
      if (!enquiry) throw new Error("Enquiry not found");
      const count = await db.quotation.count();
      const quotationNo = `QTN-${String(count + 1).padStart(4, "0")}`;
      const items = Array.isArray(payload.items) ? payload.items : [];
      const { computed, subtotal, discount, vat, total } = computeQuotationTotals(
        items
      );
      const q = await db.quotation.create({
        data: {
          quotationNo,
          enquiryId: payload.enquiryId,
          clientId: enquiry.clientId,
          createdBy: uid,
          validity: Number(payload.validity) || 30,
          deliveryWeeks: Number(payload.deliveryWeeks) || 4,
          paymentTerms:
            payload.paymentTerms || "50% advance, 50% before delivery",
          warranty: payload.warranty || "2 years",
          notes: payload.notes || null,
          subtotal,
          discount,
          vat,
          total,
          status: "DRAFT",
          items: {
            create: items.map((it: any, idx: number) => ({
              lineNumber: idx + 1,
              description: it.description || "",
              spec: it.spec || null,
              referenceImage: it.referenceImage || null,
              detailLink: it.detailLink || null,
              qty: Number(it.qty) || 0,
              unit: it.unit || "piece",
              material: it.material || null,
              materialCost: Number(it.materialCost) || 0,
              laborHours: Number(it.laborHours) || 0,
              laborRate: Number(it.laborRate) || 0,
              productionHours: Number(it.productionHours) || 0,
              installationHours: Number(it.installationHours) || 0,
              unitPrice: computed[idx].unitPrice,
              total: computed[idx].total,
            })),
          },
        },
      });
      await db.enquiry.update({
        where: { id: payload.enquiryId },
        data: { status: "IN_ESTIMATION" },
      });
      await timelineEvent({
        enquiryId: payload.enquiryId,
        quotationId: q.id,
        userId: uid,
        stage: "QUOTATION_DRAFT",
        message: `Quotation ${quotationNo} drafted (AED ${Math.round(total)})`,
      });
      return { success: true, id: q.id, quotationNo };
    }

    case "update-quotation": {
      const items = Array.isArray(payload.items) ? payload.items : [];
      const { computed, subtotal, discount, vat, total } = computeQuotationTotals(
        items
      );
      await db.quotationItem.deleteMany({
        where: { quotationId: payload.id },
      });
      await db.quotation.update({
        where: { id: payload.id },
        data: {
          validity: Number(payload.validity) || 30,
          deliveryWeeks: Number(payload.deliveryWeeks) || 4,
          paymentTerms:
            payload.paymentTerms || "50% advance, 50% before delivery",
          warranty: payload.warranty || "2 years",
          notes: payload.notes || null,
          subtotal,
          discount,
          vat,
          total,
          items: {
            create: items.map((it: any, idx: number) => ({
              lineNumber: idx + 1,
              description: it.description || "",
              spec: it.spec || null,
              referenceImage: it.referenceImage || null,
              detailLink: it.detailLink || null,
              qty: Number(it.qty) || 0,
              unit: it.unit || "piece",
              material: it.material || null,
              materialCost: Number(it.materialCost) || 0,
              laborHours: Number(it.laborHours) || 0,
              laborRate: Number(it.laborRate) || 0,
              productionHours: Number(it.productionHours) || 0,
              installationHours: Number(it.installationHours) || 0,
              unitPrice: computed[idx].unitPrice,
              total: computed[idx].total,
            })),
          },
        },
      });
      await db.approvalLog.create({
        data: {
          quotationId: payload.id,
          userId: uid,
          action: "edited",
          comment: "Items updated",
        },
      });
      return { success: true };
    }

    case "submit-quotation": {
      const q = await db.quotation.findUnique({ where: { id: payload.id } });
      if (!q) throw new Error("Quotation not found");
      await db.quotation.update({
        where: { id: payload.id },
        data: { status: "PENDING_APPROVAL" },
      });
      await db.approvalLog.create({
        data: {
          quotationId: payload.id,
          userId: uid,
          action: "submitted",
        },
      });
      await timelineEvent({
        quotationId: payload.id,
        enquiryId: q.enquiryId,
        userId: uid,
        stage: "QUOTATION_SUBMITTED",
        message: `Quotation ${q.quotationNo} submitted for approval`,
      });
      await notifyUsers(
        ["BUSINESS_MANAGER", "ADMIN"],
        "APPROVAL_REQUIRED",
        "Quotation awaiting approval",
        `${q.quotationNo} submitted for your review`,
        "QUOTATION",
        payload.id
      );
      return { success: true };
    }

    case "approve-quotation": {
      if (role !== "BUSINESS_MANAGER" && role !== "ADMIN") {
        throw new Error("Only Business Manager or Admin can approve quotations");
      }
      const q = await db.quotation.findUnique({ where: { id: payload.id } });
      if (!q) throw new Error("Quotation not found");
      await db.quotation.update({
        where: { id: payload.id },
        data: {
          status: "APPROVED",
          approvedBy: uid,
          approvedAt: new Date(),
        },
      });
      await db.approvalLog.create({
        data: {
          quotationId: payload.id,
          userId: uid,
          action: "approved",
          comment: payload.comment || null,
        },
      });
      await timelineEvent({
        quotationId: payload.id,
        enquiryId: q.enquiryId,
        userId: uid,
        stage: "QUOTATION_APPROVED",
        message: `Quotation ${q.quotationNo} approved by ${session.name}`,
      });
      await notifyUsers(
        ["SALES", "ESTIMATION"],
        "QUOTATION_APPROVED",
        "Quotation approved",
        `${q.quotationNo} has been approved and is ready to send to client`,
        "QUOTATION",
        payload.id
      );
      return { success: true };
    }

    case "reject-quotation": {
      const q = await db.quotation.findUnique({ where: { id: payload.id } });
      if (!q) throw new Error("Quotation not found");
      await db.quotation.update({
        where: { id: payload.id },
        data: { status: "REJECTED" },
      });
      await db.approvalLog.create({
        data: {
          quotationId: payload.id,
          userId: uid,
          action: "rejected",
          comment: payload.comment || null,
        },
      });
      await timelineEvent({
        quotationId: payload.id,
        enquiryId: q.enquiryId,
        userId: uid,
        stage: "QUOTATION_REJECTED",
        message: `Quotation ${q.quotationNo} rejected: ${payload.comment || ""}`,
      });
      await notifyUsers(
        ["ESTIMATION"],
        "QUOTATION_REJECTED",
        "Quotation rejected",
        `${q.quotationNo} was rejected. Comment: ${payload.comment || "n/a"}`,
        "QUOTATION",
        payload.id
      );
      return { success: true };
    }

    case "comment-quotation": {
      await db.quotationComment.create({
        data: {
          quotationId: payload.id,
          userId: uid,
          text: payload.text,
        },
      });
      return { success: true };
    }

    case "send-quotation": {
      const q = await db.quotation.findUnique({ where: { id: payload.id } });
      if (!q) throw new Error("Quotation not found");
      await db.quotation.update({
        where: { id: payload.id },
        data: { status: "SENT_TO_CLIENT", sentAt: new Date() },
      });
      await timelineEvent({
        quotationId: payload.id,
        enquiryId: q.enquiryId,
        userId: uid,
        stage: "QUOTATION_SENT",
        message: `Quotation ${q.quotationNo} sent to client`,
      });
      return { success: true };
    }

    case "sign-quotation": {
      const q = await db.quotation.findUnique({ where: { id: payload.id } });
      if (!q) throw new Error("Quotation not found");
      await db.quotation.update({
        where: { id: payload.id },
        data: { status: "SIGNED_CONFIRMED", signedAt: new Date() },
      });
      await db.enquiry.update({
        where: { id: q.enquiryId },
        data: { status: "CONFIRMED" },
      });
      await timelineEvent({
        quotationId: payload.id,
        enquiryId: q.enquiryId,
        userId: uid,
        stage: "QUOTATION_SIGNED",
        message: `Quotation ${q.quotationNo} signed & confirmed by client`,
      });
      await notifyUsers(
        ["FINANCE"],
        "QUOTATION_SIGNED",
        "Quotation signed by client",
        `${q.quotationNo} signed - please generate payment link`,
        "QUOTATION",
        payload.id
      );
      return { success: true };
    }

    case "generate-payment-link": {
      const q = payload.quotationId
        ? await db.quotation.findUnique({ where: { id: payload.quotationId } })
        : null;
      const link = await db.paymentLink.create({
        data: {
          projectId: payload.projectId,
          quotationId: payload.quotationId || null,
          amount: Number(payload.amount) || 0,
          linkRef: `PAY-${genNumber("L").replace("L-", "")}`,
          status: "GENERATED",
          generatedById: uid,
        },
      });
      if (q) {
        await db.quotation.update({
          where: { id: q.id },
          data: { status: "PAYMENT_LINK_SENT" },
        });
        await timelineEvent({
          quotationId: q.id,
          userId: uid,
          stage: "PAYMENT_LINK",
          message: `Payment link ${link.linkRef} generated for AED ${Math.round(
            link.amount
          )}`,
        });
      }
      return { success: true, id: link.id, linkRef: link.linkRef };
    }

    case "mark-payment-paid": {
      const link = await db.paymentLink.findUnique({
        where: { id: payload.paymentLinkId },
      });
      if (!link) throw new Error("Payment link not found");
      await db.paymentLink.update({
        where: { id: payload.paymentLinkId },
        data: { status: "PAID", paidAt: new Date() },
      });
      if (link.quotationId) {
        const q = await db.quotation.findUnique({
          where: { id: link.quotationId },
        });
        if (q) {
          await db.quotation.update({
            where: { id: q.id },
            data: { status: "PAID" },
          });
          await timelineEvent({
            quotationId: q.id,
            enquiryId: q.enquiryId,
            userId: uid,
            stage: "PAYMENT_RECEIVED",
            message: `Payment of AED ${Math.round(
              link.amount
            )} received for ${q.quotationNo}`,
          });
        }
      }
      await notifyUsers(
        ["ESTIMATION"],
        "PAYMENT_RECEIVED",
        "Advance payment received",
        `Payment link ${link.linkRef} marked PAID (AED ${Math.round(
          link.amount
        )})`,
        "PAYMENT_LINK",
        link.id
      );
      return { success: true };
    }

    case "confirm-lpo-client": {
      const q = await db.quotation.findUnique({ where: { id: payload.id } });
      if (!q) throw new Error("Quotation not found");
      await db.quotation.update({
        where: { id: payload.id },
        data: { status: "LPO_RECEIVED" },
      });
      await timelineEvent({
        quotationId: payload.id,
        enquiryId: q.enquiryId,
        userId: uid,
        stage: "LPO_RECEIVED",
        message: `Client LPO received (ref: ${payload.lpoRef || "-"})`,
      });
      return { success: true };
    }

    case "release-order": {
      const q = await db.quotation.findUnique({ where: { id: payload.id } });
      if (!q) throw new Error("Quotation not found");
      // Create a project if not exists
      let project = await db.project.findFirst({
        where: { quotationId: payload.id },
      });
      if (!project) {
        const pcount = await db.project.count();
        const projectNo = `PRJ-${String(pcount + 1).padStart(4, "0")}`;
        project = await db.project.create({
          data: {
            projectNo,
            name: `Project - ${q.quotationNo}`,
            enquiryId: q.enquiryId,
            quotationId: q.id,
            clientId: q.clientId,
            type: "PROJECT",
            startDate: new Date(),
            dueDate: new Date(Date.now() + (q.deliveryWeeks || 4) * 7 * 86400000),
            status: "ORDER_RELEASED",
          },
        });
      }
      await db.quotation.update({
        where: { id: payload.id },
        data: { status: "ORDER_RELEASED" },
      });
      await db.enquiry.update({
        where: { id: q.enquiryId },
        data: { status: "CONFIRMED" },
      });
      await timelineEvent({
        projectId: project.id,
        quotationId: payload.id,
        enquiryId: q.enquiryId,
        userId: uid,
        stage: "ORDER_RELEASED",
        message: `Order released - Project ${project.projectNo} created`,
      });
      // Notify procurement, engineering, production and project departments in app
      await notifyUsers(
        ["PROCUREMENT", "ENGINEERING", "PRODUCTION", "PROJECT"],
        "ORDER_RELEASED",
        "New order released",
        `Project ${project.projectNo} (Quotation ${q.quotationNo}). Please begin your workflow.`,
        "PROJECT",
        project.id
      );
      // Send outbound email to procurement with engineering, production and project on CC.
      const orderReleaseEmailSubject = `Order Released | Project ${project.projectNo} (${q.quotationNo})`;
      const orderReleaseEmailBody = `Dear Team,<br/><br/>Order has been released for Project ${project.projectNo} (Quotation ${q.quotationNo}, AED ${Math.round(
        q.total
      )}).<br/><br/>Please initiate your respective workflows:<br/>  • Procurement: prepare BOQ-M, check stock, raise MRQ<br/>  • Engineering: prepare drawings for client approval<br/>  • Production: plan joinery and metal stages<br/>  • Project Department: schedule site visit<br/><br/>Regards,<br/>Estimation Department`;
      await sendEmail({
        to: "procurement@algurggroup.ae",
        cc: ["engineering@algurggroup.ae", "production@algurggroup.ae", "project@algurggroup.ae"],
        subject: orderReleaseEmailSubject,
        body: orderReleaseEmailBody,
        refType: "ORDER_RELEASE",
        refId: project.id,
      });
      return {
        success: true,
        projectId: project.id,
        projectNo: project.projectNo,
        email: {
          to: "procurement@algurggroup.ae",
          cc: ["engineering@algurggroup.ae", "production@algurggroup.ae", "project@algurggroup.ae"],
          subject: orderReleaseEmailSubject,
          body: orderReleaseEmailBody,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // ---- BOQ ----
    case "create-boq": {
      const project = await db.project.findUnique({
        where: { id: payload.projectId },
      });
      if (!project) throw new Error("Project not found");
      const count = await db.boq.count();
      const boqNo = `BOQ-${String(count + 1).padStart(4, "0")}`;
      const items = Array.isArray(payload.items) ? payload.items : [];
      const boq = await db.boq.create({
        data: {
          boqNo,
          projectId: payload.projectId,
          quotationId: payload.quotationId || null,
          issuedBy: uid,
          status: "DRAFT",
          items: {
            create: items.map((it: any, idx: number) => ({
              materialId: it.materialId || null,
              description: it.description || "",
              spec: it.spec || null,
              qty: Number(it.qty) || 0,
              unit: it.unit || "piece",
              available: it.available ?? true,
              notes: it.notes || null,
            })),
          },
        },
      });
      await timelineEvent({
        projectId: payload.projectId,
        userId: uid,
        stage: "BOQ_CREATED",
        message: `BOQ ${boqNo} created with ${items.length} items`,
      });
      return { success: true, id: boq.id, boqNo };
    }

    case "issue-boq": {
      const boq = await db.boq.findUnique({
        where: { id: payload.boqId },
        include: { project: true },
      });
      if (!boq) throw new Error("BOQ not found");
      await db.boq.update({
        where: { id: payload.boqId },
        data: { status: "ISSUED_TO_PROCUREMENT", issuedAt: new Date() },
      });
      await timelineEvent({
        projectId: boq.projectId,
        userId: uid,
        stage: "BOQ_ISSUED",
        message: `BOQ ${boq.boqNo} issued to Procurement`,
      });
      await notifyUsers(
        ["PROCUREMENT"],
        "BOQ_ISSUED",
        "BOQ issued for procurement",
        `${boq.boqNo} for ${boq.project?.name} - please check stock & raise MRQ`,
        "BOQ",
        boq.id
      );
      return { success: true };
    }

    // ---- MRQ ----
    case "create-mrq": {
      const project = await db.project.findUnique({
        where: { id: payload.projectId },
      });
      if (!project) throw new Error("Project not found");
      const count = await db.materialRequisition.count();
      const mrqNo = `MRQ-${String(count + 1).padStart(4, "0")}`;
      const items = Array.isArray(payload.items) ? payload.items : [];
      const mrq = await db.materialRequisition.create({
        data: {
          mrqNo,
          projectId: payload.projectId,
          boqId: payload.boqId || null,
          createdById: uid,
          status: "SUBMITTED",
          items: {
            create: items.map((it: any) => ({
              materialId: it.materialId || null,
              description: it.description || "",
              spec: it.spec || null,
              qty: Number(it.qty) || 0,
              unit: it.unit || "piece",
            })),
          },
        },
      });
      await timelineEvent({
        projectId: payload.projectId,
        userId: uid,
        stage: "MRQ_CREATED",
        message: `MRQ ${mrqNo} raised for ${items.length} items`,
      });
      return { success: true, id: mrq.id, mrqNo };
    }

    // ---- Supplier quote ----
    case "create-supplier-quote": {
      const sq = await db.supplierQuote.create({
        data: {
          supplierId: payload.supplierId,
          mrqId: payload.mrqId,
          requestedById: uid,
          totalAmount: Number(payload.totalAmount) || 0,
          deliveryDays: Number(payload.deliveryDays) || 7,
          remarks: payload.remarks || null,
          status: "PENDING",
        },
      });
      await notifyUsers(
        ["BUSINESS_MANAGER", "ADMIN"],
        "SUPPLIER_QUOTE_PENDING",
        "Supplier quote awaiting approval",
        `Supplier quote AED ${Math.round(
          sq.totalAmount
        )} for MRQ - please review`,
        "SUPPLIER_QUOTE",
        sq.id
      );
      return { success: true, id: sq.id };
    }

    case "approve-supplier-quote": {
      if (role !== "BUSINESS_MANAGER" && role !== "ADMIN") {
        throw new Error("Only Business Manager or Admin can approve supplier quotes");
      }
      await db.supplierQuote.update({
        where: { id: payload.id },
        data: { status: "APPROVED", approvedById: uid, approvedAt: new Date() },
      });
      await notifyUsers(
        ["PROCUREMENT"],
        "SUPPLIER_QUOTE_APPROVED",
        "Supplier quote approved",
        `You can now raise the PR`,
        "SUPPLIER_QUOTE",
        payload.id
      );
      return { success: true };
    }

    // ---- PR ----
    case "create-pr": {
      const project = await db.project.findUnique({
        where: { id: payload.projectId },
      });
      if (!project) throw new Error("Project not found");
      const count = await db.purchaseRequest.count();
      const prNo = `PR-${String(count + 1).padStart(4, "0")}`;
      const pr = await db.purchaseRequest.create({
        data: {
          prNo,
          projectId: payload.projectId,
          mrqId: payload.mrqId || null,
          supplierQuoteId: payload.supplierQuoteId || null,
          supplierId: payload.supplierId,
          createdById: uid,
          sapRef: payload.sapRef || null,
          totalAmount: Number(payload.totalAmount) || 0,
          itemsJson:
            typeof payload.itemsJson === "string"
              ? payload.itemsJson
              : JSON.stringify(payload.itemsJson || []),
          status: "PENDING",
        },
      });
      if (payload.mrqId) {
        await db.materialRequisition.update({
          where: { id: payload.mrqId },
          data: { status: "CONVERTED_TO_PR" },
        });
      }
      await timelineEvent({
        projectId: payload.projectId,
        userId: uid,
        stage: "PR_CREATED",
        message: `PR ${prNo} raised (AED ${Math.round(pr.totalAmount)})`,
      });
      return { success: true, id: pr.id, prNo };
    }

    case "approve-pr": {
      await db.purchaseRequest.update({
        where: { id: payload.prId },
        data: { status: "APPROVED", approvedAt: new Date() },
      });
      await notifyUsers(
        ["PROCUREMENT"],
        "PR_APPROVED",
        "Purchase Request approved",
        `PR ready for LPO conversion`,
        "PR",
        payload.prId
      );
      return { success: true };
    }

    case "convert-pr-to-lpo": {
      const pr = await db.purchaseRequest.findUnique({
        where: { id: payload.prId },
        include: { project: true },
      });
      if (!pr) throw new Error("PR not found");
      const count = await db.localPurchaseOrder.count();
      const lpoNo = `LPO-${String(count + 1).padStart(4, "0")}`;
      const lpo = await db.localPurchaseOrder.create({
        data: {
          lpoNo,
          prId: payload.prId,
          projectId: pr.projectId,
          supplierId: pr.supplierId,
          createdById: uid,
          totalAmount: pr.totalAmount,
          status: "ISSUED",
          expectedDelivery: payload.expectedDelivery
            ? new Date(payload.expectedDelivery)
            : new Date(Date.now() + 7 * 86400000),
        },
      });
      await db.purchaseRequest.update({
        where: { id: payload.prId },
        data: { status: "CONVERTED_TO_LPO" },
      });
      await timelineEvent({
        projectId: pr.projectId,
        userId: uid,
        stage: "LPO_CREATED",
        message: `LPO ${lpoNo} issued from ${pr.prNo}`,
      });
      return { success: true, id: lpo.id, lpoNo };
    }

    case "send-lpo": {
      const lpo = await db.localPurchaseOrder.findUnique({
        where: { id: payload.lpoId },
        include: { supplier: true, project: true },
      });
      if (!lpo) throw new Error("LPO not found");
      await db.localPurchaseOrder.update({
        where: { id: payload.lpoId },
        data: { status: "SENT_TO_SUPPLIER", sentAt: new Date() },
      });
      await timelineEvent({
        projectId: lpo.projectId,
        userId: uid,
        stage: "LPO_SENT",
        message: `LPO ${lpo.lpoNo} sent to ${lpo.supplier.name}`,
      });
      await notifyUsers(
        ["STORE"],
        "LPO_SENT_CC",
        "LPO sent to supplier (CC)",
        `${lpo.lpoNo} sent to ${lpo.supplier.name} - please expect delivery`,
        "LPO",
        lpo.id
      );
      // Send outbound LPO email to supplier with store on CC.
      const lpoEmailSubject = `Local Purchase Order ${lpo.lpoNo}`;
      const lpoEmailBody = `Dear ${lpo.supplier.name},<br/><br/>Please find Local Purchase Order ${lpo.lpoNo} attached.<br/>Project: ${lpo.project?.name}<br/>Total: AED ${Math.round(
        lpo.totalAmount
      )}<br/>Expected delivery: ${new Date(
        lpo.expectedDelivery || Date.now()
      ).toDateString()}<br/><br/>Regards,<br/>Procurement Department<br/>Al Gurg Group`;
      await sendEmail({
        to: lpo.supplier.email || "supplier@algurggroup.ae",
        cc: ["store@algurggroup.ae"],
        subject: lpoEmailSubject,
        body: lpoEmailBody,
        refType: "LPO_SENT",
        refId: lpo.id,
      });
      return {
        success: true,
        email: {
          to: lpo.supplier.email || "supplier@algurggroup.ae",
          cc: ["store@algurggroup.ae"],
          subject: lpoEmailSubject,
          body: lpoEmailBody,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // ---- GRN ----
    case "create-grn": {
      const lpo = await db.localPurchaseOrder.findUnique({
        where: { id: payload.lpoId },
      });
      if (!lpo) throw new Error("LPO not found");
      const count = await db.goodsReceivingNote.count();
      const grnNo = `GRN-${String(count + 1).padStart(4, "0")}`;
      const grn = await db.goodsReceivingNote.create({
        data: {
          grnNo,
          lpoId: payload.lpoId,
          projectId: lpo.projectId,
          storeUserId: uid,
          documentsReceived: payload.documentsReceived
            ? JSON.stringify(payload.documentsReceived)
            : null,
          taxInvoiceNo: payload.taxInvoiceNo || null,
          taxInvoiceDate: payload.taxInvoiceDate
            ? new Date(payload.taxInvoiceDate)
            : null,
          taxInvoiceSubmitted: !!payload.taxInvoiceSubmitted,
          remarks: payload.remarks || null,
          status: "QC_PENDING",
        },
      });
      await db.localPurchaseOrder.update({
        where: { id: payload.lpoId },
        data: { status: "DELIVERED", deliveredAt: new Date() },
      });
      await timelineEvent({
        projectId: lpo.projectId,
        userId: uid,
        stage: "GRN_CREATED",
        message: `GRN ${grnNo} created for ${lpo.lpoNo} - QC pending`,
      });
      await notifyUsers(
        ["QC"],
        "QC_PENDING_DELIVERY",
        "Delivery awaiting QC inspection",
        `${grnNo} for ${lpo.lpoNo} - please inspect`,
        "GRN",
        grn.id
      );
      return { success: true, id: grn.id, grnNo };
    }

    case "update-grn": {
      await db.goodsReceivingNote.update({
        where: { id: payload.grnId },
        data: {
          taxInvoiceNo: payload.taxInvoiceNo,
          taxInvoiceSubmitted: payload.taxInvoiceSubmitted,
          taxInvoiceDate: payload.taxInvoiceDate
            ? new Date(payload.taxInvoiceDate)
            : undefined,
          remarks: payload.remarks,
          status: payload.status,
        },
      });
      return { success: true };
    }

    // ---- QC report ----
    case "create-qc-report": {
      const count = await db.qcReport.count();
      const reportNo = `QC-${String(count + 1).padStart(4, "0")}`;
      const rep = await db.qcReport.create({
        data: {
          reportNo,
          type: payload.type,
          refType: payload.refType,
          refId: payload.refId,
          productionStageId: payload.productionStageId || null,
          qcUserId: payload.qcUserId || uid,
          status: "PENDING",
          photos: payload.photos ? JSON.stringify(payload.photos) : null,
          remarks: payload.remarks || null,
          missingItems: payload.missingItems
            ? JSON.stringify(payload.missingItems)
            : null,
          checklistJson: payload.checklist
            ? JSON.stringify(payload.checklist)
            : null,
        },
      });
      return { success: true, id: rep.id, reportNo };
    }

    case "submit-qc-report": {
      const rep = await db.qcReport.findUnique({
        where: { id: payload.id },
      });
      if (!rep) throw new Error("QC report not found");
      await db.qcReport.update({
        where: { id: payload.id },
        data: {
          status: payload.status,
          remarks: payload.remarks ?? rep.remarks,
          missingItems: payload.missingItems
            ? JSON.stringify(payload.missingItems)
            : rep.missingItems,
          submittedAt: new Date(),
        },
      });
      // Link to GRN / stage
      if (rep.type === "DELIVERY_INSPECTION" && rep.refType === "LPO") {
        const grn = await db.goodsReceivingNote.findFirst({
          where: { lpoId: rep.refId },
        });
        if (grn) {
          const newStatus =
            payload.status === "PASSED"
              ? "QC_PASSED"
              : payload.status === "FAILED"
              ? "QC_FAILED"
              : "QC_PARTIAL";
          await db.goodsReceivingNote.update({
            where: { id: grn.id },
            data: { qcReportId: payload.id, status: newStatus },
          });
          await timelineEvent({
            projectId: grn.projectId,
            userId: uid,
            stage: "QC_DELIVERY",
            message: `Delivery QC ${payload.status} for GRN ${grn.grnNo}`,
          });
        }
        // Notify procurement, store and production in app
        await notifyUsers(
          ["PROCUREMENT", "STORE", "PRODUCTION"],
          "QC_DELIVERY_RESULT",
          `Delivery QC ${payload.status}`,
          `QC report ${rep.reportNo}. Status ${payload.status}.`,
          "QC_REPORT",
          rep.id
        );
        // Send outbound QC report email to procurement with info, stores and production on CC.
        const qcEmailSubject = `QC Report ${rep.reportNo} | ${payload.status}`;
        const missingItemsText = payload.missingItems?.length
          ? payload.missingItems.join(", ")
          : "none";
        const qcEmailBody = `QC inspection completed.<br/>Report: ${rep.reportNo}<br/>Status: ${payload.status}<br/>Remarks: ${payload.remarks || "n/a"}<br/>Missing items: ${missingItemsText}<br/><br/>Regards,<br/>Quality Control Department<br/>Al Gurg Group`;
        await sendEmail({
          to: "procurement@algurggroup.ae",
          cc: ["info@algurggroup.ae", "store@algurggroup.ae", "production@algurggroup.ae"],
          subject: qcEmailSubject,
          body: qcEmailBody,
          refType: "QC_REPORT",
          refId: rep.id,
        });
        return {
          success: true,
          email: {
            to: "procurement@algurggroup.ae",
            cc: ["info@algurggroup.ae", "store@algurggroup.ae", "production@algurggroup.ae"],
            subject: qcEmailSubject,
            body: qcEmailBody,
            timestamp: new Date().toISOString(),
          },
        };
      }
      if (rep.type === "PRODUCTION_STAGE" && rep.productionStageId) {
        const stage = await db.productionStage.findUnique({
          where: { id: rep.productionStageId },
          include: { productionOrder: true },
        });
        if (stage) {
          const newStatus =
            payload.status === "PASSED" ? "QC_PASSED" : "QC_FAILED";
          await db.productionStage.update({
            where: { id: stage.id },
            data: { qcReportId: payload.id, status: newStatus },
          });
          await timelineEvent({
            projectId: stage.productionOrder.projectId,
            userId: uid,
            stage: "QC_STAGE",
            message: `Stage "${stage.stageName}" QC ${payload.status}`,
          });
          if (payload.status === "PASSED") {
            await notifyUsers(
              ["PRODUCTION"],
              "STAGE_QC_PASSED",
              "Stage QC passed",
              `${stage.stageName} passed QC - next stage unlocked`,
              "STAGE",
              stage.id
            );
          }
        }
      }
      return { success: true };
    }

    // ---- Production ----
    case "create-production-order": {
      const project = await db.project.findUnique({
        where: { id: payload.projectId },
      });
      if (!project) throw new Error("Project not found");
      const count = await db.productionOrder.count();
      const orderNo = `PROD-${payload.type}-${String(count + 1).padStart(3, "0")}`;
      const stages =
        payload.type === "JOINERY" ? JOINERY_STAGES : METAL_STAGES;
      const order = await db.productionOrder.create({
        data: {
          orderNo,
          projectId: payload.projectId,
          type: payload.type,
          releasedBy: uid,
          dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
          status: "RELEASED",
          stages: {
            create: stages.map((name, i) => ({
              stageName: name,
              stageOrder: i + 1,
              status: "NOT_STARTED",
            })),
          },
        },
      });
      await timelineEvent({
        projectId: payload.projectId,
        userId: uid,
        stage: "PRODUCTION_ORDER",
        message: `${payload.type} production order ${orderNo} created with ${stages.length} stages`,
      });
      return { success: true, id: order.id, orderNo };
    }

    case "start-stage": {
      await db.productionStage.update({
        where: { id: payload.stageId },
        data: {
          status: "IN_PROGRESS",
          startedAt: new Date(),
          operatorId: uid,
        },
      });
      const stage = await db.productionStage.findUnique({
        where: { id: payload.stageId },
        include: { productionOrder: true },
      });
      if (stage) {
        await db.productionOrder.update({
          where: { id: stage.productionOrderId },
          data: { status: "IN_PROGRESS" },
        });
        await timelineEvent({
          projectId: stage.productionOrder.projectId,
          userId: uid,
          stage: "STAGE_STARTED",
          message: `Stage "${stage.stageName}" started`,
        });
      }
      return { success: true };
    }

    case "complete-stage": {
      await db.productionStage.update({
        where: { id: payload.stageId },
        data: { status: "QC_PENDING", completedAt: new Date() },
      });
      const stage = await db.productionStage.findUnique({
        where: { id: payload.stageId },
        include: { productionOrder: true },
      });
      if (stage) {
        await timelineEvent({
          projectId: stage.productionOrder.projectId,
          userId: uid,
          stage: "STAGE_COMPLETED",
          message: `Stage "${stage.stageName}" completed - awaiting QC`,
        });
        await notifyUsers(
          ["QC"],
          "STAGE_QC_PENDING",
          "Production stage awaiting QC",
          `${stage.stageName} ready for inspection`,
          "STAGE",
          stage.id
        );
      }
      return { success: true };
    }

    case "qc-pass-stage": {
      const stage = await db.productionStage.findUnique({
        where: { id: payload.stageId },
        include: { productionOrder: { include: { stages: true } } },
      });
      if (!stage) throw new Error("Stage not found");
      const count = await db.qcReport.count();
      const reportNo = `QC-${String(count + 1).padStart(4, "0")}`;
      const rep = await db.qcReport.create({
        data: {
          reportNo,
          type: "PRODUCTION_STAGE",
          refType: "ProductionStage",
          refId: stage.id,
          productionStageId: stage.id,
          qcUserId: uid,
          status: "PASSED",
          remarks: payload.qcReportData?.remarks || null,
          photos: payload.qcReportData?.photos
            ? JSON.stringify(payload.qcReportData.photos)
            : null,
          checklistJson: payload.qcReportData?.checklist
            ? JSON.stringify(payload.qcReportData.checklist)
            : null,
          submittedAt: new Date(),
        },
      });
      await db.productionStage.update({
        where: { id: payload.stageId },
        data: { qcReportId: rep.id, status: "QC_PASSED" },
      });
      // Mark next stage as startable (status stays NOT_STARTED but unlocked)
      const next = stage.productionOrder.stages.find(
        (s) => s.stageOrder === stage.stageOrder + 1
      );
      await timelineEvent({
        projectId: stage.productionOrder.projectId,
        userId: uid,
        stage: "STAGE_QC_PASSED",
        message: `Stage "${stage.stageName}" QC PASSED${
          next ? ` - next: ${next.stageName}` : ""
        }`,
      });
      return { success: true, nextStageId: next?.id ?? null };
    }

    case "qc-fail-stage": {
      const stage = await db.productionStage.findUnique({
        where: { id: payload.stageId },
        include: { productionOrder: true },
      });
      if (!stage) throw new Error("Stage not found");
      const count = await db.qcReport.count();
      const reportNo = `QC-${String(count + 1).padStart(4, "0")}`;
      const rep = await db.qcReport.create({
        data: {
          reportNo,
          type: "PRODUCTION_STAGE",
          refType: "ProductionStage",
          refId: stage.id,
          productionStageId: stage.id,
          qcUserId: uid,
          status: "FAILED",
          remarks: payload.qcReportData?.remarks || null,
          photos: payload.qcReportData?.photos
            ? JSON.stringify(payload.qcReportData.photos)
            : null,
          checklistJson: payload.qcReportData?.checklist
            ? JSON.stringify(payload.qcReportData.checklist)
            : null,
          submittedAt: new Date(),
        },
      });
      await db.productionStage.update({
        where: { id: payload.stageId },
        data: { qcReportId: rep.id, status: "QC_FAILED" },
      });
      await timelineEvent({
        projectId: stage.productionOrder.projectId,
        userId: uid,
        stage: "STAGE_QC_FAILED",
        message: `Stage "${stage.stageName}" QC FAILED - rework required`,
      });
      await notifyUsers(
        ["PRODUCTION", "BUSINESS_MANAGER"],
        "STAGE_QC_FAILED",
        "Stage QC failed",
        `${stage.stageName} failed QC - rework required`,
        "STAGE",
        stage.id
      );
      return { success: true };
    }

    case "skip-stage": {
      const stage = await db.productionStage.findUnique({
        where: { id: payload.stageId },
        include: { productionOrder: true },
      });
      if (!stage) throw new Error("Stage not found");
      await db.productionStage.update({
        where: { id: payload.stageId },
        data: { status: "SKIPPED", remarks: payload.reason },
      });
      await timelineEvent({
        projectId: stage.productionOrder.projectId,
        userId: uid,
        stage: "STAGE_SKIPPED",
        message: `Stage "${stage.stageName}" skipped: ${payload.reason}`,
      });
      return { success: true };
    }

    // ---- Drawing ----
    case "create-drawing": {
      const project = await db.project.findUnique({
        where: { id: payload.projectId },
      });
      if (!project) throw new Error("Project not found");
      const count = await db.drawingSubmission.count();
      const drawingNo = `DRW-${String(count + 1).padStart(4, "0")}`;
      const d = await db.drawingSubmission.create({
        data: {
          drawingNo,
          projectId: payload.projectId,
          drawnById: uid,
          drawingType: payload.drawingType || "shop drawing",
          attachmentsJson: payload.attachmentsJson
            ? typeof payload.attachmentsJson === "string"
              ? payload.attachmentsJson
              : JSON.stringify(payload.attachmentsJson)
            : null,
          remarks: payload.remarks || null,
          status: "DRAFT",
        },
      });
      await timelineEvent({
        projectId: payload.projectId,
        userId: uid,
        stage: "DRAWING_CREATED",
        message: `Drawing ${drawingNo} (${payload.drawingType}) created`,
      });
      return { success: true, id: d.id, drawingNo };
    }

    case "submit-drawing-pm": {
      await db.drawingSubmission.update({
        where: { id: payload.id },
        data: { status: "SUBMITTED_TO_PM" },
      });
      const d = await db.drawingSubmission.findUnique({
        where: { id: payload.id },
        include: { project: true },
      });
      if (d) {
        await timelineEvent({
          projectId: d.projectId,
          userId: uid,
          stage: "DRAWING_TO_PM",
          message: `Drawing ${d.drawingNo} submitted to PM`,
        });
        await notifyUsers(
          ["PROJECT"],
          "DRAWING_REVIEW",
          "Drawing submitted for review",
          `${d.drawingNo} awaiting your review`,
          "DRAWING",
          d.id
        );
      }
      return { success: true };
    }

    case "submit-drawing-client": {
      await db.drawingSubmission.update({
        where: { id: payload.id },
        data: { status: "SUBMITTED_TO_CLIENT" },
      });
      const d = await db.drawingSubmission.findUnique({
        where: { id: payload.id },
      });
      if (d) {
        await timelineEvent({
          projectId: d.projectId,
          userId: uid,
          stage: "DRAWING_TO_CLIENT",
          message: `Drawing ${d.drawingNo} submitted to client`,
        });
      }
      return { success: true };
    }

    case "approve-drawing-client": {
      const d = await db.drawingSubmission.findUnique({
        where: { id: payload.id },
      });
      if (!d) throw new Error("Drawing not found");
      await db.drawingSubmission.update({
        where: { id: payload.id },
        data: {
          status: "APPROVED",
          approvedById: uid,
          approvedByClientAt: new Date(),
        },
      });
      await timelineEvent({
        projectId: d.projectId,
        userId: uid,
        stage: "DRAWING_APPROVED",
        message: `Drawing ${d.drawingNo} approved by client`,
      });
      // Unlock production orders for this project
      await db.productionOrder.updateMany({
        where: { projectId: d.projectId },
        data: { drawingApproved: true },
      });
      await notifyUsers(
        ["PRODUCTION", "ENGINEERING"],
        "DRAWING_APPROVED",
        "Drawing approved",
        `${d.drawingNo} approved - production can start`,
        "DRAWING",
        d.id
      );
      return { success: true };
    }

    // ---- Delivery / Installation / Feedback ----
    case "create-delivery-ack": {
      const d = await db.deliveryAcknowledgement.create({
        data: {
          projectId: payload.projectId,
          deliveredBy: uid,
          clientSigned: !!payload.clientSigned,
          remarks: payload.remarks || null,
        },
      });
      await db.project.update({
        where: { id: payload.projectId },
        data: { status: "DELIVERED" },
      });
      await timelineEvent({
        projectId: payload.projectId,
        userId: uid,
        stage: "DELIVERY_ACK",
        message: `Delivery acknowledged - client signed: ${payload.clientSigned ? "Yes" : "No"}`,
      });
      return { success: true, id: d.id };
    }

    case "create-installation": {
      const i = await db.installationRecord.create({
        data: {
          projectId: payload.projectId,
          teamLeadId: payload.teamLeadId || uid,
          startedAt: payload.startedAt ? new Date(payload.startedAt) : new Date(),
          status: "IN_PROGRESS",
        },
      });
      await db.project.update({
        where: { id: payload.projectId },
        data: { status: "IN_INSTALLATION" },
      });
      await timelineEvent({
        projectId: payload.projectId,
        userId: uid,
        stage: "INSTALLATION_STARTED",
        message: `Installation started`,
      });
      return { success: true, id: i.id };
    }

    case "complete-installation": {
      await db.installationRecord.update({
        where: { id: payload.id },
        data: { status: "COMPLETED", completedAt: new Date(), remarks: payload.remarks },
      });
      const inst = await db.installationRecord.findUnique({
        where: { id: payload.id },
      });
      if (inst) {
        await db.project.update({
          where: { id: inst.projectId },
          data: { status: "FEEDBACK_PENDING" },
        });
        await timelineEvent({
          projectId: inst.projectId,
          userId: uid,
          stage: "INSTALLATION_DONE",
          message: `Installation completed`,
        });
      }
      return { success: true };
    }

    case "create-feedback": {
      const ratings = payload.ratings || {};
      const fb = await db.customerFeedback.create({
        data: {
          projectId: payload.projectId,
          submittedById: uid,
          ratingsJson: JSON.stringify(ratings),
          comments: payload.comments || null,
          recommendation: payload.recommendation || null,
        },
      });
      await db.project.update({
        where: { id: payload.projectId },
        data: { status: "COMPLETED" },
      });
      await timelineEvent({
        projectId: payload.projectId,
        userId: uid,
        stage: "FEEDBACK",
        message: `Customer feedback submitted (overall: ${ratings.overall || "-"}/5)`,
      });
      await notifyUsers(
        ["FINANCE", "BUSINESS_MANAGER"],
        "FEEDBACK_SUBMITTED",
        "Customer feedback received",
        `Project feedback submitted - claim final payment`,
        "PROJECT",
        payload.projectId
      );
      return { success: true, id: fb.id };
    }

    // ---- Red flags / Delays ----
    case "raise-red-flag": {
      const rf = await db.redFlag.create({
        data: {
          projectId: payload.projectId,
          raisedById: uid,
          department: payload.department || "-",
          reason: payload.reason,
          severity: payload.severity || "MEDIUM",
          daysDelayed: Number(payload.daysDelayed) || 0,
        },
      });
      await timelineEvent({
        projectId: payload.projectId,
        userId: uid,
        stage: "RED_FLAG",
        message: `Red flag raised (${payload.severity}): ${payload.reason}`,
      });
      await notifyUsers(
        ["BUSINESS_MANAGER", "ADMIN"],
        "RED_FLAG",
        `Red flag: ${payload.severity}`,
        payload.reason,
        "RED_FLAG",
        rf.id
      );
      return { success: true, id: rf.id };
    }

    case "resolve-red-flag": {
      await db.redFlag.update({
        where: { id: payload.id },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          resolvedById: uid,
          resolution: payload.resolution,
        },
      });
      const rf = await db.redFlag.findUnique({ where: { id: payload.id } });
      if (rf) {
        await timelineEvent({
          projectId: rf.projectId,
          userId: uid,
          stage: "RED_FLAG_RESOLVED",
          message: `Red flag resolved: ${payload.resolution}`,
        });
      }
      return { success: true };
    }

    case "raise-delay": {
      const d = await db.delayComplaint.create({
        data: {
          projectId: payload.projectId,
          raisedById: uid,
          department: payload.department || "-",
          reason: payload.reason,
          daysDelayed: Number(payload.daysDelayed) || 0,
          status: "OPEN",
        },
      });
      await timelineEvent({
        projectId: payload.projectId,
        userId: uid,
        stage: "DELAY_RAISED",
        message: `Delay complaint: ${payload.reason} (${payload.daysDelayed} days)`,
      });
      await notifyUsers(
        ["BUSINESS_MANAGER", "ADMIN"],
        "DELAY_COMPLAINT",
        "Delay complaint raised",
        payload.reason,
        "DELAY",
        d.id
      );
      return { success: true, id: d.id };
    }

    case "resolve-delay": {
      await db.delayComplaint.update({
        where: { id: payload.id },
        data: {
          status: "RESOLVED",
          resolution: payload.resolution,
          resolvedAt: new Date(),
        },
      });
      const d = await db.delayComplaint.findUnique({
        where: { id: payload.id },
      });
      if (d) {
        await timelineEvent({
          projectId: d.projectId,
          userId: uid,
          stage: "DELAY_RESOLVED",
          message: `Delay resolved: ${payload.resolution}`,
        });
      }
      return { success: true };
    }

    case "mark-notification-read": {
      await db.notification.update({
        where: { id: payload.id },
        data: { read: true },
      });
      return { success: true };
    }

    case "create-client": {
      const c = await db.client.create({
        data: {
          name: payload.name,
          type: (payload.type || "RETAIL") as any,
          company: payload.company || null,
          contactPerson: payload.contactPerson || null,
          email: payload.email || null,
          phone: payload.phone || null,
          whatsapp: payload.whatsapp || null,
          address: payload.address || null,
        },
      });
      return { success: true, id: c.id };
    }

    case "create-supplier": {
      const s = await db.supplier.create({
        data: {
          name: payload.name,
          contactPerson: payload.contactPerson || null,
          email: payload.email || null,
          phone: payload.phone || null,
          whatsapp: payload.whatsapp || null,
          materials: payload.materials || null,
        },
      });
      return { success: true, id: s.id };
    }

    case "create-material": {
      const m = await db.material.create({
        data: {
          name: payload.name,
          spec: payload.spec || null,
          unit: payload.unit || "piece",
          unitPrice: Number(payload.unitPrice) || 0,
          supplierId: payload.supplierId,
          inStock: payload.inStock ?? true,
        },
      });
      return { success: true, id: m.id };
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

// =====================================================
// Route handlers
// =====================================================

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  try {
    const data = await handleGet(req, session);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  try {
    const payload = await req.json().catch(() => ({}));
    const data = await handlePost(payload, session);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
