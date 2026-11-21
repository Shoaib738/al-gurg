// Seed script - populate demo data for Al Gurg Furniture ERP
// Run with: bun run scripts/seed.ts

import { PrismaClient, UserRole, ClientType, EnquirySource, EnquiryStatus, QuotationStatus, ProjectStatus, BoqStatus, MrqStatus, ProductionType, StageStatus, DrawingStatus, PaymentLinkStatus, RedFlagSeverity } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

// Default password for all demo accounts. In production, each user gets a unique
// password set by an administrator and the default is never used.
const DEFAULT_PASSWORD = 'Welcome@2026'

async function main() {
  console.log('Seeding Al Gurg Group operations database...')
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10)

  // ---------- USERS ----------
  const users = {
    admin: await db.user.create({ data: { email: 'admin@algurggroup.ae', name: 'System Administrator', role: UserRole.ADMIN, phone: '+971500000001', passwordHash } }),
    mazen: await db.user.create({ data: { email: 'mazen@algurggroup.ae', name: 'Mr. Mazen Al Gurg', role: UserRole.BUSINESS_MANAGER, phone: '+971500000002', passwordHash } }),
    roy: await db.user.create({ data: { email: 'roy@algurggroup.ae', name: 'Mr. Roy Mathew', role: UserRole.ESTIMATION, phone: '+971500000003', passwordHash } }),
    sales: await db.user.create({ data: { email: 'sales@algurggroup.ae', name: 'Sales Team Lead', role: UserRole.SALES, phone: '+971500000004', passwordHash } }),
    nimesha: await db.user.create({ data: { email: 'nimesha@algurggroup.ae', name: 'Ms. Nimesha Perera', role: UserRole.PROCUREMENT, phone: '+971500000005', passwordHash } }),
    store: await db.user.create({ data: { email: 'store@algurggroup.ae', name: 'Store Keeper', role: UserRole.STORE, phone: '+971500000006', passwordHash } }),
    venkat: await db.user.create({ data: { email: 'venkat@algurggroup.ae', name: 'Mr. Venketeswaram', role: UserRole.QC, phone: '+971500000007', passwordHash } }),
    motasem: await db.user.create({ data: { email: 'motasem@algurggroup.ae', name: 'Mr. Motasem Al Rashid', role: UserRole.PRODUCTION, phone: '+971500000008', passwordHash } }),
    draft: await db.user.create({ data: { email: 'draftsman@algurggroup.ae', name: 'Technical Drafter', role: UserRole.ENGINEERING, phone: '+971500000009', passwordHash } }),
    wasim: await db.user.create({ data: { email: 'wasim@algurggroup.ae', name: 'Mr. Wasim Khan', role: UserRole.PROJECT, phone: '+971500000010', passwordHash } }),
    finance: await db.user.create({ data: { email: 'finance@algurggroup.ae', name: 'Finance Officer', role: UserRole.FINANCE, phone: '+971500000011', passwordHash } }),
  }

  // ---------- CLIENTS ----------
  const clients = {
    retail: await db.client.create({
      data: {
        name: 'Mr. Ahmed Al Mansoori (Retail)',
        type: ClientType.RETAIL,
        email: 'ahmed.mansoori@example.com',
        phone: '+971501234567',
        whatsapp: '+971501234567',
        address: 'Dubai Marina, Dubai, UAE',
      },
    }),
    project: await db.client.create({
      data: {
        name: 'Skyline Hospitality Group',
        type: ClientType.PROJECT,
        company: 'Skyline Hospitality Group LLC',
        contactPerson: 'Mr. Khalid Rahman',
        email: 'khalid@skylinehospitality.ae',
        phone: '+97142345678',
        whatsapp: '+97142345678',
        address: 'Business Bay, Dubai, UAE',
      },
    }),
  }

  // ---------- SUPPLIERS & MATERIALS ----------
  const supplier1 = await db.supplier.create({
    data: {
      name: 'Egwood Panels FZ LLC',
      contactPerson: 'Mr. Suresh',
      email: 'sales@egwoodpanels.ae',
      phone: '+97143456789',
      whatsapp: '+97143456789',
      materials: 'MDF, Plywood, Veneer, Laminate',
    },
  })
  const supplier2 = await db.supplier.create({
    data: {
      name: 'Aluminium & Steel Traders',
      contactPerson: 'Mr. Praveen',
      email: 'info@alsteeltraders.ae',
      phone: '+97144567890',
      whatsapp: '+97144567890',
      materials: 'Aluminium profiles, Steel sheets, Hardware',
    },
  })
  const supplier3 = await db.supplier.create({
    data: {
      name: 'Premium Hardware LLC',
      contactPerson: 'Mr. Vinod',
      email: 'orders@premiumhardware.ae',
      phone: '+97145678901',
      whatsapp: '+97145678901',
      materials: 'Hinges, Handles, Slides, Locks',
    },
  })

  const materials = {
    mdf18: await db.material.create({ data: { name: 'MDF Board 18mm', spec: '18mm MR Grade', unit: 'sheet (2440x1220)', unitPrice: 145, supplierId: supplier1.id, inStock: true } }),
    plywood18: await db.material.create({ data: { name: 'Marine Plywood 18mm', spec: 'BWP Grade', unit: 'sheet (2440x1220)', unitPrice: 220, supplierId: supplier1.id, inStock: true } }),
    veneer: await db.material.create({ data: { name: 'Natural Oak Veneer', spec: '0.6mm Crown Cut', unit: 'sqm', unitPrice: 85, supplierId: supplier1.id, inStock: true } }),
    laminate: await db.material.create({ data: { name: 'High Pressure Laminate', spec: '1mm Decorative', unit: 'sheet (2440x1220)', unitPrice: 175, supplierId: supplier1.id, inStock: false } }),
    edgeBand: await db.material.create({ data: { name: 'Edge Banding PVC 2mm', spec: 'Oak matching', unit: 'roll 50m', unitPrice: 65, supplierId: supplier1.id, inStock: true } }),
    alumProfile: await db.material.create({ data: { name: 'Aluminium Profile 40x40', spec: 'Anodised', unit: 'meter', unitPrice: 38, supplierId: supplier2.id, inStock: true } }),
    steelSheet: await db.material.create({ data: { name: 'Steel Sheet 2mm', spec: 'CR Grade', unit: 'sheet (2440x1220)', unitPrice: 290, supplierId: supplier2.id, inStock: true } }),
    hinges: await db.material.create({ data: { name: 'Soft Close Hinges', spec: '110 degree full overlay', unit: 'piece', unitPrice: 12, supplierId: supplier3.id, inStock: true } }),
    slides: await db.material.create({ data: { name: 'Telescopic Drawer Slides 450mm', spec: 'Soft close, 35kg load', unit: 'pair', unitPrice: 28, supplierId: supplier3.id, inStock: false } }),
    handles: await db.material.create({ data: { name: 'Bar Handle 128mm', spec: 'Matte black', unit: 'piece', unitPrice: 18, supplierId: supplier3.id, inStock: true } }),
  }

  // ---------- ENQUIRY (sample 1 - Project / Hotel, sample 2 - Retail) ----------
  const enquiry1 = await db.enquiry.create({
    data: {
      enquiryNo: 'ENQ-2026-001',
      enquiryDate: new Date('2026-11-05'),
      source: EnquirySource.EMAIL,
      clientId: clients.project.id,
      salesUserId: users.sales.id,
      title: 'Hotel Wardrobes & Vanities - Tower A (24 floors)',
      description: 'Supply and install 288 wardrobes and 288 vanities for guest rooms across 24 floors. Includes stone tops, mirrors, LED lighting. Required as per attached drawings and BOQ.',
      projectType: 'Wardrobe, Vanity',
      location: 'Business Bay, Dubai',
      attachments: JSON.stringify(['enquiry-drawings-tower-A.pdf', 'boq-hotel-furniture.xlsx', 'reference-images.zip']),
      status: EnquiryStatus.CONFIRMED,
    },
  })

  const enquiry2 = await db.enquiry.create({
    data: {
      enquiryNo: 'ENQ-2026-002',
      enquiryDate: new Date('2026-11-12'),
      source: EnquirySource.WHATSAPP,
      clientId: clients.retail.id,
      salesUserId: users.sales.id,
      title: 'Master Bedroom Walk-in Wardrobe',
      description: 'L-shaped walk-in wardrobe, mirrored sliding doors, internal drawers and shelving. Approx 4.5 linear meters.',
      projectType: 'Wardrobe',
      location: 'Dubai Marina',
      attachments: JSON.stringify(['walkin-layout.jpg', 'finish-sample.png']),
      status: EnquiryStatus.QUOTED,
    },
  })

  // ---------- QUOTATION (sample for enquiry1, approved) ----------
  const q1 = await db.quotation.create({
    data: {
      quotationNo: 'QUO-2026-001',
      enquiryId: enquiry1.id,
      clientId: clients.project.id,
      createdBy: users.roy.id,
      template: 'project-standard',
      validity: 30,
      deliveryWeeks: 10,
      paymentTerms: '30% advance with LPO, 60% before delivery, 10% after installation',
      warranty: '2 years on manufacturing defects',
      subtotal: 1_180_000,
      discount: 30_000,
      vat: 107_500,
      total: 1_257_500,
      status: QuotationStatus.ORDER_RELEASED,
      approvedBy: users.mazen.id,
      approvedAt: new Date('2026-11-08'),
      sentAt: new Date('2026-11-09'),
      signedAt: new Date('2026-11-15'),
      notes: 'Includes site survey, shop drawings approval, packaging and delivery to site. Excludes electrical and MEP works.',
    },
  })

  await db.quotationItem.createMany({
    data: [
      { quotationId: q1.id, lineNumber: 1, description: 'Hotel Guest Wardrobe - Laminated body with veneer doors', spec: '18mm MDF body, oak veneer doors, soft-close hinges', referenceImage: '/samples/wardrobe-hotel.jpg', detailLink: '/samples/wardrobe-spec.pdf', qty: 288, unit: 'piece', material: 'MDF + Veneer', materialCost: 1450, laborHours: 12, laborRate: 45, productionHours: 14, installationHours: 3, unitPrice: 2350, total: 676800 },
      { quotationId: q1.id, lineNumber: 2, description: 'Vanity Unit with drawer & stone top cutout', spec: '18mm MDF body, laminate finish, marble cutout', referenceImage: '/samples/vanity-hotel.jpg', detailLink: '/samples/vanity-spec.pdf', qty: 288, unit: 'piece', material: 'MDF + Laminate + Stone', materialCost: 980, laborHours: 8, laborRate: 45, productionHours: 10, installationHours: 2, unitPrice: 1750, total: 504000 },
    ],
  })

  await db.quotationComment.create({
    data: { quotationId: q1.id, userId: users.mazen.id, text: 'Material cost on wardrobe doors is on the higher side. Please re-check veneer pricing with Egwood.', createdAt: new Date('2026-11-07T10:00:00Z') },
  })
  await db.quotationComment.create({
    data: { quotationId: q1.id, userId: users.roy.id, text: 'Confirmed with Egwood - veneer price is updated for crown cut grade. Costing holds.', createdAt: new Date('2026-11-07T14:30:00Z') },
  })

  // ---------- PROJECT (from confirmed quotation) ----------
  const project1 = await db.project.create({
    data: {
      projectNo: 'PRJ-2026-001',
      name: 'Skyline Tower A - Hotel Furniture',
      enquiryId: enquiry1.id,
      quotationId: q1.id,
      clientId: clients.project.id,
      type: ClientType.PROJECT,
      startDate: new Date('2026-11-15'),
      dueDate: new Date('2027-01-25'),
      deliveryDate: new Date('2027-01-20'),
      status: ProjectStatus.IN_PRODUCTION,
    },
  })

  // ---------- TIMELINE events ----------
  await db.timelineEvent.createMany({
    data: [
      { enquiryId: enquiry1.id, projectId: project1.id, userId: users.sales.id, stage: 'Enquiry Received', message: 'Enquiry ENQ-2026-001 received via email from sales team', createdAt: new Date('2026-11-05T09:15:00Z') },
      { enquiryId: enquiry1.id, projectId: project1.id, userId: users.roy.id, stage: 'Quotation Drafted', message: 'Quotation QUO-2026-001 drafted by Estimation', createdAt: new Date('2026-11-06T16:20:00Z') },
      { enquiryId: enquiry1.id, projectId: project1.id, quotationId: q1.id, userId: users.roy.id, stage: 'Submitted for Approval', message: 'Quotation submitted to Mr. Mazen for approval', createdAt: new Date('2026-11-06T17:00:00Z') },
      { enquiryId: enquiry1.id, projectId: project1.id, quotationId: q1.id, userId: users.mazen.id, stage: 'Quotation Approved', message: 'Quotation approved by Business Manager', createdAt: new Date('2026-11-08T11:00:00Z') },
      { enquiryId: enquiry1.id, projectId: project1.id, quotationId: q1.id, userId: users.sales.id, stage: 'Sent to Client', message: 'Quotation sent to Skyline Hospitality Group', createdAt: new Date('2026-11-09T09:30:00Z') },
      { enquiryId: enquiry1.id, projectId: project1.id, quotationId: q1.id, userId: users.sales.id, stage: 'Client Signed', message: 'Signed quotation received from client', createdAt: new Date('2026-11-15T14:00:00Z') },
      { projectId: project1.id, userId: users.finance.id, stage: 'Payment Link Generated', message: 'Advance payment link generated (30% of total)', createdAt: new Date('2026-11-15T15:00:00Z') },
      { projectId: project1.id, userId: users.finance.id, stage: 'LPO Received', message: 'Local Purchase Order received from client', createdAt: new Date('2026-11-16T10:00:00Z') },
      { projectId: project1.id, userId: users.roy.id, stage: 'Order Released', message: 'Order released - email sent to Procurement, Technical & Production', createdAt: new Date('2026-11-16T11:00:00Z') },
    ],
  })

  // ---------- BOQ-M (Bill of Quantity for Material) ----------
  const boq1 = await db.boq.create({
    data: {
      boqNo: 'BOQ-M-001',
      projectId: project1.id,
      quotationId: q1.id,
      issuedBy: users.roy.id,
      status: BoqStatus.IN_PROCUREMENT,
      issuedAt: new Date('2026-11-16T12:00:00Z'),
    },
  })
  await db.boqItem.createMany({
    data: [
      { boqId: boq1.id, materialId: materials.mdf18.id, description: 'MDF Board 18mm MR Grade', spec: '2440x1220', qty: 480, unit: 'sheet', available: true },
      { boqId: boq1.id, materialId: materials.veneer.id, description: 'Natural Oak Veneer Crown Cut', spec: '0.6mm', qty: 850, unit: 'sqm', available: true },
      { boqId: boq1.id, materialId: materials.laminate.id, description: 'High Pressure Laminate', spec: '1mm Decorative', qty: 220, unit: 'sheet', available: false, notes: 'Out of stock - need procurement' },
      { boqId: boq1.id, materialId: materials.edgeBand.id, description: 'Edge Banding PVC 2mm Oak', spec: 'matching', qty: 35, unit: 'roll 50m', available: true },
      { boqId: boq1.id, materialId: materials.hinges.id, description: 'Soft Close Hinges 110deg', spec: 'full overlay', qty: 2304, unit: 'piece', available: true },
      { boqId: boq1.id, materialId: materials.slides.id, description: 'Telescopic Drawer Slides 450mm', spec: 'soft close', qty: 1152, unit: 'pair', available: false, notes: 'Out of stock - need procurement' },
      { boqId: boq1.id, materialId: materials.handles.id, description: 'Bar Handle 128mm Matte Black', spec: 'matte', qty: 576, unit: 'piece', available: true },
    ],
  })

  // ---------- MRQ (Material Requisition - for missing items) ----------
  const mrq1 = await db.materialRequisition.create({
    data: {
      mrqNo: 'MRQ-2026-001',
      projectId: project1.id,
      boqId: boq1.id,
      createdById: users.nimesha.id,
      status: MrqStatus.CONVERTED_TO_PR,
      createdAt: new Date('2026-11-17T09:00:00Z'),
    },
  })
  await db.materialRequisitionItem.createMany({
    data: [
      { mrqId: mrq1.id, materialId: materials.laminate.id, description: 'High Pressure Laminate 1mm', spec: 'Decorative', qty: 220, unit: 'sheet', quotedPrice: 38500 },
      { mrqId: mrq1.id, materialId: materials.slides.id, description: 'Telescopic Drawer Slides 450mm', spec: 'Soft close 35kg', qty: 1152, unit: 'pair', quotedPrice: 32256 },
    ],
  })

  // ---------- Supplier Quote (approved) ----------
  const sq1 = await db.supplierQuote.create({
    data: {
      supplierId: supplier1.id,
      mrqId: mrq1.id,
      requestedById: users.nimesha.id,
      approvedById: users.mazen.id,
      approvedAt: new Date('2026-11-18T10:00:00Z'),
      totalAmount: 38500,
      deliveryDays: 10,
      status: 'APPROVED',
      remarks: 'Quote matched market rate. Approved.',
    },
  })
  const sq2 = await db.supplierQuote.create({
    data: {
      supplierId: supplier3.id,
      mrqId: mrq1.id,
      requestedById: users.nimesha.id,
      approvedById: users.mazen.id,
      approvedAt: new Date('2026-11-18T10:05:00Z'),
      totalAmount: 32256,
      deliveryDays: 14,
      status: 'APPROVED',
      remarks: 'Approved.',
    },
  })

  // ---------- PR (Purchase Request) ----------
  const pr1 = await db.purchaseRequest.create({
    data: {
      prNo: 'PR-2026-001',
      projectId: project1.id,
      mrqId: mrq1.id,
      supplierQuoteId: sq1.id,
      supplierId: supplier1.id,
      createdById: users.nimesha.id,
      sapRef: 'SAP-PR-2026-001',
      status: 'CONVERTED_TO_LPO',
      approvedAt: new Date('2026-11-18T14:00:00Z'),
      totalAmount: 38500,
      itemsJson: JSON.stringify([{ description: 'High Pressure Laminate 1mm', qty: 220, unit: 'sheet', unitPrice: 175 }]),
    },
  })
  const pr2 = await db.purchaseRequest.create({
    data: {
      prNo: 'PR-2026-002',
      projectId: project1.id,
      mrqId: mrq1.id,
      supplierQuoteId: sq2.id,
      supplierId: supplier3.id,
      createdById: users.nimesha.id,
      sapRef: 'SAP-PR-2026-002',
      status: 'CONVERTED_TO_LPO',
      approvedAt: new Date('2026-11-18T14:05:00Z'),
      totalAmount: 32256,
      itemsJson: JSON.stringify([{ description: 'Telescopic Drawer Slides 450mm', qty: 1152, unit: 'pair', unitPrice: 28 }]),
    },
  })

  // ---------- LPO (Local Purchase Order) ----------
  const lpo1 = await db.localPurchaseOrder.create({
    data: {
      lpoNo: 'LPO-INT-001',
      prId: pr1.id,
      projectId: project1.id,
      supplierId: supplier1.id,
      createdById: users.nimesha.id,
      totalAmount: 38500,
      status: 'DELIVERED',
      sentAt: new Date('2026-11-18T16:00:00Z'),
      expectedDelivery: new Date('2026-11-28'),
      deliveredAt: new Date('2026-11-27T11:00:00Z'),
    },
  })
  const lpo2 = await db.localPurchaseOrder.create({
    data: {
      lpoNo: 'LPO-INT-002',
      prId: pr2.id,
      projectId: project1.id,
      supplierId: supplier3.id,
      createdById: users.nimesha.id,
      totalAmount: 32256,
      status: 'SENT_TO_SUPPLIER',
      sentAt: new Date('2026-11-19T09:00:00Z'),
      expectedDelivery: new Date('2026-12-02'),
    },
  })

  // ---------- GRN + QC report for LPO1 ----------
  const qc1 = await db.qcReport.create({
    data: {
      reportNo: 'QC-DEL-001',
      type: 'DELIVERY_INSPECTION',
      refType: 'LPO',
      refId: lpo1.id,
      qcUserId: users.venkat.id,
      inspectionDate: new Date('2026-11-27T11:30:00Z'),
      status: 'PARTIAL',
      photos: JSON.stringify(['/photos/laminate-batch1.jpg', '/photos/laminate-batch2.jpg']),
      remarks: '200 sheets received in good condition. 20 sheets have edge damage. Need replacement.',
      missingItems: JSON.stringify([{ item: 'HPL sheets', ordered: 220, received: 200, missing: 20 }]),
      checklistJson: JSON.stringify([
        { item: 'Material spec matches LPO', status: 'PASS' },
        { item: 'Quantity matches', status: 'PARTIAL' },
        { item: 'Packaging intact', status: 'PASS' },
        { item: 'No visible damage', status: 'FAIL' },
      ]),
      submittedAt: new Date('2026-11-27T13:00:00Z'),
    },
  })

  const grn1 = await db.goodsReceivingNote.create({
    data: {
      grnNo: 'GRN-2026-001',
      lpoId: lpo1.id,
      projectId: project1.id,
      storeUserId: users.store.id,
      qcReportId: qc1.id,
      documentsReceived: JSON.stringify(['deliveryNote', 'lpo']),
      taxInvoiceNo: null,
      taxInvoiceSubmitted: false,
      remarks: 'Tax invoice pending - supplier to submit by month end. Follow up required.',
      status: 'QC_PARTIAL',
    },
  })

  // ---------- Drawing submission ----------
  const drawing1 = await db.drawingSubmission.create({
    data: {
      drawingNo: 'DRW-2026-001',
      projectId: project1.id,
      drawnById: users.draft.id,
      drawingType: 'Shop Drawing',
      approvedById: users.wasim.id,
      approvedByClientAt: new Date('2026-11-22T15:00:00Z'),
      status: DrawingStatus.APPROVED,
      attachmentsJson: JSON.stringify(['wardrobe-elevation-A.pdf', 'vanity-plan-B.pdf', 'wardrobe-section-C.pdf']),
      remarks: 'Drawings approved by client on 22-Nov-2026. Released to production.',
      createdAt: new Date('2026-11-19T10:00:00Z'),
    },
  })

  // ---------- Production Orders + stages ----------
  const prodJoinery = await db.productionOrder.create({
    data: {
      orderNo: 'PRD-2026-001',
      projectId: project1.id,
      type: ProductionType.JOINERY,
      releasedBy: users.motasem.id,
      drawingApproved: true,
      dueDate: new Date('2027-01-15'),
      status: 'IN_PROGRESS',
    },
  })

  const joineryStages = ['Pressing', 'Cutting', 'Lipping / Edge Banding', 'Boring', 'CNC Routing', 'Sanding', 'Painting', 'Packing', 'Delivery']
  for (let i = 0; i < joineryStages.length; i++) {
    const stageName = joineryStages[i]
    let status: StageStatus = StageStatus.NOT_STARTED
    let startedAt: Date | null = null
    let completedAt: Date | null = null
    let qcReportId: string | null = null

    if (i === 0) { // Pressing - completed + QC passed
      status = StageStatus.QC_PASSED
      startedAt = new Date('2026-11-23T08:00:00Z')
      completedAt = new Date('2026-11-25T17:00:00Z')
      const qc = await db.qcReport.create({
        data: {
          reportNo: `QC-PRD-J-${i+1}`,
          type: 'PRODUCTION_STAGE',
          refType: 'ProductionStage',
          refId: 'pending',
          qcUserId: users.venkat.id,
          inspectionDate: new Date('2026-11-25T18:00:00Z'),
          status: 'PASSED',
          checklistJson: JSON.stringify([
            { item: 'Veneer pressing uniform', status: 'PASS' },
            { item: 'No air bubbles', status: 'PASS' },
            { item: 'Adhesive coverage complete', status: 'PASS' },
            { item: 'Sheet dimensions correct', status: 'PASS' },
          ]),
          submittedAt: new Date('2026-11-25T18:30:00Z'),
        },
      })
      qcReportId = qc.id
    } else if (i === 1) { // Cutting - completed + QC passed
      status = StageStatus.QC_PASSED
      startedAt = new Date('2026-11-26T08:00:00Z')
      completedAt = new Date('2026-11-28T17:00:00Z')
      const qc = await db.qcReport.create({
        data: {
          reportNo: `QC-PRD-J-${i+1}`,
          type: 'PRODUCTION_STAGE',
          refType: 'ProductionStage',
          refId: 'pending',
          qcUserId: users.venkat.id,
          inspectionDate: new Date('2026-11-28T18:00:00Z'),
          status: 'PASSED',
          checklistJson: JSON.stringify([
            { item: 'Cut dimensions within tolerance', status: 'PASS' },
            { item: 'No chipping on edges', status: 'PASS' },
            { item: 'All pieces labelled', status: 'PASS' },
          ]),
          submittedAt: new Date('2026-11-28T18:30:00Z'),
        },
      })
      qcReportId = qc.id
    } else if (i === 2) { // Lipping - in progress
      status = StageStatus.IN_PROGRESS
      startedAt = new Date('2026-11-29T08:00:00Z')
    } else if (i === 3) { // Boring - red flag - delayed
      status = StageStatus.NOT_STARTED
    }

    const stage = await db.productionStage.create({
      data: {
        productionOrderId: prodJoinery.id,
        stageName,
        stageOrder: i + 1,
        operatorId: users.motasem.id,
        status,
        startedAt,
        completedAt,
        qcReportId,
        remarks: i === 3 ? 'Pending - edge banding machine under maintenance causing delay' : null,
      },
    })
    // link QC report back to stage
    if (qcReportId) {
      await db.qcReport.update({ where: { id: qcReportId }, data: { refId: stage.id, productionStageId: stage.id } })
    }
  }

  const prodMetal = await db.productionOrder.create({
    data: {
      orderNo: 'PRD-2026-002',
      projectId: project1.id,
      type: ProductionType.METAL,
      releasedBy: users.motasem.id,
      drawingApproved: true,
      dueDate: new Date('2027-01-10'),
      status: 'IN_PROGRESS',
    },
  })
  const metalStages = ['Cutting', 'Welding', 'Painting', 'Packing', 'Delivery']
  for (let i = 0; i < metalStages.length; i++) {
    let status: StageStatus = StageStatus.NOT_STARTED
    let startedAt: Date | null = null
    let completedAt: Date | null = null
    if (i === 0) {
      status = StageStatus.QC_PASSED
      startedAt = new Date('2026-11-24T08:00:00Z')
      completedAt = new Date('2026-11-26T17:00:00Z')
    } else if (i === 1) {
      status = StageStatus.IN_PROGRESS
      startedAt = new Date('2026-11-27T08:00:00Z')
    }
    await db.productionStage.create({
      data: {
        productionOrderId: prodMetal.id,
        stageName: metalStages[i],
        stageOrder: i + 1,
        operatorId: users.motasem.id,
        status,
        startedAt,
        completedAt,
      },
    })
  }

  // ---------- Payment link ----------
  await db.paymentLink.create({
    data: {
      projectId: project1.id,
      quotationId: q1.id,
      amount: 377250, // 30% advance
      linkRef: 'PAY-2026-001',
      status: PaymentLinkStatus.PAID,
      generatedById: users.finance.id,
      generatedAt: new Date('2026-11-15T15:00:00Z'),
      sentAt: new Date('2026-11-15T15:30:00Z'),
      paidAt: new Date('2026-11-16T09:30:00Z'),
    },
  })

  // ---------- Red flag (delay) ----------
  await db.redFlag.create({
    data: {
      projectId: project1.id,
      raisedById: users.motasem.id,
      department: 'Production',
      reason: 'Edge banding machine under maintenance - Lipping stage delayed by 3 days. Will impact downstream Boring stage.',
      severity: RedFlagSeverity.HIGH,
      daysDelayed: 3,
    },
  })

  await db.delayComplaint.create({
    data: {
      projectId: project1.id,
      raisedById: users.nimesha.id,
      department: 'Procurement',
      reason: 'Slides (LPO-INT-002) delivery delayed - supplier awaiting stock from origin. Expected delivery 02-Dec pushed to 05-Dec.',
      daysDelayed: 3,
      status: 'IN_REVIEW',
    },
  })

  // ---------- Notifications ----------
  const notifs = [
    { userId: users.roy.id, type: 'ENQUIRY_NEW', title: 'New Enquiry', message: 'New enquiry ENQ-2026-002 received from sales team', refType: 'Enquiry', refId: enquiry2.id },
    { userId: users.mazen.id, type: 'APPROVAL_PENDING', title: 'Quotation Pending Approval', message: 'QUO-2026-001 awaiting your approval', refType: 'Quotation', refId: q1.id },
    { userId: users.nimesha.id, type: 'BOQ_RECEIVED', title: 'BOQ-M Received', message: 'BOQ-M-001 issued for project PRJ-2026-001', refType: 'BOQ', refId: boq1.id },
    { userId: users.venkat.id, type: 'QC_SCHEDULED', title: 'QC Inspection Scheduled', message: 'LPO-INT-002 delivery inspection due on 02-Dec', refType: 'LPO', refId: lpo2.id },
    { userId: users.motasem.id, type: 'DRAWING_APPROVED', title: 'Drawings Approved', message: 'DRW-2026-001 approved by client - production can proceed', refType: 'Drawing', refId: drawing1.id },
    { userId: users.wasim.id, type: 'RED_FLAG', title: 'Red Flag Raised', message: 'High severity delay flag on PRJ-2026-001 - production', refType: 'Project', refId: project1.id },
    { userId: users.store.id, type: 'TAX_INVOICE_PENDING', title: 'Tax Invoice Pending', message: 'GRN-2026-001 - supplier tax invoice not yet submitted', refType: 'GRN', refId: grn1.id },
    { userId: users.finance.id, type: 'PAYMENT_RECEIVED', title: 'Payment Received', message: 'Advance payment PAY-2026-001 received from Skyline Hospitality', refType: 'PaymentLink', refId: 'pending' },
  ]
  for (const n of notifs) {
    await db.notification.create({ data: n })
  }

  console.log('Seed complete. Demo user accounts created:')
  for (const [k, u] of Object.entries(users)) {
    console.log(`   ${k.padEnd(10)} ${u.email}  (${u.role})`)
  }
  console.log(`   Default password for all accounts: ${DEFAULT_PASSWORD}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
