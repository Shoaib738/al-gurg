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
    admin: await db.user.create({ data: { loginId: 'AG001', email: 'admin@algurggroup.ae', name: 'System Administrator', role: UserRole.ADMIN, phone: '+971500000001', passwordHash } }),
    mazen: await db.user.create({ data: { loginId: 'AG002', email: 'mazen@algurggroup.ae', name: 'Mr. Mazen Al Gurg', role: UserRole.BUSINESS_MANAGER, phone: '+971500000002', passwordHash } }),
    roy: await db.user.create({ data: { loginId: 'AG003', email: 'roy@algurggroup.ae', name: 'Mr. Roy Mathew', role: UserRole.ESTIMATION, phone: '+971500000003', passwordHash } }),
    sales: await db.user.create({ data: { loginId: 'AG004', email: 'sales@algurggroup.ae', name: 'Sales Team Lead', role: UserRole.SALES, phone: '+971500000004', passwordHash } }),
    nimesha: await db.user.create({ data: { loginId: 'AG005', email: 'nimesha@algurggroup.ae', name: 'Ms. Nimesha Perera', role: UserRole.PROCUREMENT, phone: '+971500000005', passwordHash } }),
    store: await db.user.create({ data: { loginId: 'AG006', email: 'store@algurggroup.ae', name: 'Store Keeper', role: UserRole.STORE, phone: '+971500000006', passwordHash } }),
    venkat: await db.user.create({ data: { loginId: 'AG007', email: 'venkat@algurggroup.ae', name: 'Mr. Venketeswaram', role: UserRole.QC, phone: '+971500000007', passwordHash } }),
    motasem: await db.user.create({ data: { loginId: 'AG008', email: 'motasem@algurggroup.ae', name: 'Mr. Motasem Al Rashid', role: UserRole.PRODUCTION, phone: '+971500000008', passwordHash } }),
    draft: await db.user.create({ data: { loginId: 'AG009', email: 'draftsman@algurggroup.ae', name: 'Technical Drafter', role: UserRole.ENGINEERING, phone: '+971500000009', passwordHash } }),
    wasim: await db.user.create({ data: { loginId: 'AG010', email: 'wasim@algurggroup.ae', name: 'Mr. Wasim Khan', role: UserRole.PROJECT, phone: '+971500000010', passwordHash } }),
    finance: await db.user.create({ data: { loginId: 'AG011', email: 'finance@algurggroup.ae', name: 'Finance Officer', role: UserRole.FINANCE, phone: '+971500000011', passwordHash } }),
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

  // =====================================================
  // NEW DEMO ENTRIES — different workflow stages
  // Adds: 1 NEW enquiry, 1 DRAFT quotation, 1 PENDING_APPROVAL quotation,
  // 1 SENT_TO_CLIENT quotation, 1 IN_PROCUREMENT project, 1 READY_FOR_DELIVERY project.
  // All existing data above is preserved unchanged.
  // =====================================================

  // --- New clients for the new demo entries ---
  const fatimaClient = await db.client.create({
    data: {
      name: 'Mrs. Fatima Al Sayed',
      type: ClientType.RETAIL,
      email: 'fatima.alsayed@example.com',
      phone: '+971502345678',
      whatsapp: '+971502345678',
      address: 'Arabian Ranches, Dubai, UAE',
    },
  })
  const marinaClient = await db.client.create({
    data: {
      name: 'Dubai Marina Apartments',
      type: ClientType.PROJECT,
      company: 'Dubai Marina Apartments LLC',
      contactPerson: 'Mr. Tariq Bin Salim',
      email: 'tariq@marinaapartments.ae',
      phone: '+97143456789',
      whatsapp: '+97143456789',
      address: 'Dubai Marina, Dubai, UAE',
    },
  })
  const internalClient = await db.client.create({
    data: {
      name: 'Al Gurg Group (Internal)',
      type: ClientType.PROJECT,
      company: 'Al Gurg Group LLC',
      contactPerson: 'Mr. Mazen Al Gurg',
      email: 'mazen@algurggroup.ae',
      phone: '+971500000002',
      whatsapp: '+971500000002',
      address: 'Al Quoz Industrial Area 3, Dubai, UAE',
    },
  })

  // === Entry 1: New enquiry (status: NEW) - Fatima ===
  const enquiry3 = await db.enquiry.create({
    data: {
      enquiryNo: 'ENQ-2026-003',
      enquiryDate: new Date('2026-11-18'),
      source: EnquirySource.PHONE,
      clientId: fatimaClient.id,
      salesUserId: users.sales.id,
      title: 'Bedroom Wardrobe and Vanity Set',
      description: 'Walk-in wardrobe with mirrored sliding doors plus matching vanity with stone top. Approx 3 linear meters.',
      projectType: 'Wardrobe, Vanity',
      location: 'Arabian Ranches, Dubai',
      attachments: JSON.stringify(['bedroom-layout.pdf', 'finish-sample.jpg']),
      status: EnquiryStatus.NEW,
    },
  })

  // === Entry 2: Draft quotation (status: DRAFT) - for existing ENQ-2026-002 ===
  const q2 = await db.quotation.create({
    data: {
      quotationNo: 'QUO-2026-002',
      enquiryId: enquiry2.id,
      clientId: clients.retail.id,
      createdBy: users.roy.id,
      template: 'retail-standard',
      validity: 30,
      deliveryWeeks: 4,
      paymentTerms: '50% advance, 50% before delivery',
      warranty: '2 years on manufacturing defects',
      subtotal: 18_500,
      discount: 0,
      vat: 925,
      total: 19_425,
      status: QuotationStatus.DRAFT,
      notes: 'L-shaped walk-in wardrobe, mirrored sliding doors, internal drawers and shelving. Excludes electrical work.',
    },
  })
  await db.quotationItem.createMany({
    data: [
      { quotationId: q2.id, lineNumber: 1, description: 'Walk-in wardrobe body - Laminated MDF', spec: '18mm MDF body, oak laminate', qty: 4.5, unit: 'meter', material: 'MDF + Laminate', materialCost: 1500, laborHours: 10, laborRate: 45, productionHours: 12, installationHours: 4, unitPrice: 2667, total: 12000 },
      { quotationId: q2.id, lineNumber: 2, description: 'Mirrored sliding doors with track', spec: '6mm mirror, soft-close track', qty: 2, unit: 'panel', material: 'Mirror + Aluminium', materialCost: 1800, laborHours: 6, laborRate: 45, productionHours: 8, installationHours: 2, unitPrice: 3250, total: 6500 },
    ],
  })
  await db.timelineEvent.createMany({
    data: [
      { enquiryId: enquiry2.id, quotationId: q2.id, userId: users.roy.id, stage: 'Quotation Drafted', message: 'Quotation QUO-2026-002 drafted (DRAFT) - awaiting review', createdAt: new Date('2026-11-14T10:00:00Z') },
    ],
  })

  // === Entry 3: Pending approval quotation (status: PENDING_APPROVAL) - Fatima ===
  const q3 = await db.quotation.create({
    data: {
      quotationNo: 'QUO-2026-003',
      enquiryId: enquiry3.id,
      clientId: fatimaClient.id,
      createdBy: users.roy.id,
      template: 'retail-standard',
      validity: 30,
      deliveryWeeks: 5,
      paymentTerms: '40% advance, 60% before delivery',
      warranty: '2 years on manufacturing defects',
      subtotal: 32_000,
      discount: 0,
      vat: 1_600,
      total: 33_600,
      status: QuotationStatus.PENDING_APPROVAL,
      notes: 'Wardrobe + Vanity set. Stone top for vanity to be procured separately by client or via Al Gurg (subject to approval).',
    },
  })
  await db.quotationItem.createMany({
    data: [
      { quotationId: q3.id, lineNumber: 1, description: 'Bedroom wardrobe - Veneered MDF body', spec: '18mm MDF body, oak veneer doors, soft-close hinges', qty: 3, unit: 'meter', material: 'MDF + Veneer', materialCost: 5500, laborHours: 18, laborRate: 45, productionHours: 20, installationHours: 4, unitPrice: 6000, total: 18000 },
      { quotationId: q3.id, lineNumber: 2, description: 'Vanity unit with stone top cutout', spec: 'MDF body, laminate finish, marble cutout', qty: 1, unit: 'piece', material: 'MDF + Laminate + Stone', materialCost: 6000, laborHours: 14, laborRate: 45, productionHours: 16, installationHours: 3, unitPrice: 14000, total: 14000 },
    ],
  })
  await db.quotationComment.create({
    data: { quotationId: q3.id, userId: users.roy.id, text: 'Please review pricing for vanity stone top - I included marble cutout but actual stone to be sourced by procurement. Confirm if we should quote the stone separately.', createdAt: new Date('2026-11-19T15:30:00Z') },
  })
  await db.timelineEvent.createMany({
    data: [
      { enquiryId: enquiry3.id, userId: users.sales.id, stage: 'Enquiry Received', message: 'New enquiry ENQ-2026-003 received via phone from Mrs. Fatima Al Sayed', createdAt: new Date('2026-11-18T11:00:00Z') },
      { enquiryId: enquiry3.id, quotationId: q3.id, userId: users.roy.id, stage: 'Quotation Drafted', message: 'Quotation QUO-2026-003 drafted by Estimation', createdAt: new Date('2026-11-19T14:00:00Z') },
      { enquiryId: enquiry3.id, quotationId: q3.id, userId: users.roy.id, stage: 'Submitted for Approval', message: 'Quotation QUO-2026-003 submitted to Mr. Mazen for approval', createdAt: new Date('2026-11-19T15:00:00Z') },
    ],
  })

  // === Entry 4: Sent quotation (status: SENT_TO_CLIENT) - Marina Apartments ===
  const enquiry4 = await db.enquiry.create({
    data: {
      enquiryNo: 'ENQ-2026-004',
      enquiryDate: new Date('2026-11-19'),
      source: EnquirySource.EMAIL,
      clientId: marinaClient.id,
      salesUserId: users.sales.id,
      title: 'Kitchen Cabinets Bulk Order',
      description: '50 unit kitchen cabinets for Marina Apartments Tower B renovation. Standardised modular design.',
      projectType: 'Kitchen',
      location: 'Dubai Marina',
      attachments: JSON.stringify(['kitchen-spec.pdf', 'tower-b-layouts.zip']),
      status: EnquiryStatus.QUOTED,
    },
  })
  const q4 = await db.quotation.create({
    data: {
      quotationNo: 'QUO-2026-004',
      enquiryId: enquiry4.id,
      clientId: marinaClient.id,
      createdBy: users.roy.id,
      template: 'project-standard',
      validity: 45,
      deliveryWeeks: 8,
      paymentTerms: '30% advance, 60% before delivery, 10% after installation',
      warranty: '2 years on manufacturing defects',
      subtotal: 110_000,
      discount: 0,
      vat: 5_500,
      total: 115_500,
      status: QuotationStatus.SENT_TO_CLIENT,
      approvedBy: users.mazen.id,
      approvedAt: new Date('2026-11-21T10:00:00Z'),
      sentAt: new Date('2026-11-22T09:00:00Z'),
      notes: 'Standardised modular kitchen cabinets. Excludes counter tops, sinks and appliances. Site survey to be arranged after signature.',
    },
  })
  await db.quotationItem.createMany({
    data: [
      { quotationId: q4.id, lineNumber: 1, description: 'Modular Kitchen Cabinet - Standard Unit', spec: '18mm MDF body, laminate finish, soft-close hinges, 1m wide', qty: 50, unit: 'piece', material: 'MDF + Laminate', materialCost: 1200, laborHours: 8, laborRate: 45, productionHours: 10, installationHours: 2, unitPrice: 2200, total: 110000 },
    ],
  })
  await db.timelineEvent.createMany({
    data: [
      { enquiryId: enquiry4.id, userId: users.sales.id, stage: 'Enquiry Received', message: 'New enquiry ENQ-2026-004 received via email from Dubai Marina Apartments', createdAt: new Date('2026-11-19T09:30:00Z') },
      { enquiryId: enquiry4.id, quotationId: q4.id, userId: users.roy.id, stage: 'Quotation Drafted', message: 'Quotation QUO-2026-004 drafted by Estimation', createdAt: new Date('2026-11-20T14:00:00Z') },
      { enquiryId: enquiry4.id, quotationId: q4.id, userId: users.roy.id, stage: 'Submitted for Approval', message: 'Quotation submitted to Mr. Mazen for approval', createdAt: new Date('2026-11-20T16:00:00Z') },
      { enquiryId: enquiry4.id, quotationId: q4.id, userId: users.mazen.id, stage: 'Quotation Approved', message: 'Quotation approved by Business Manager', createdAt: new Date('2026-11-21T10:00:00Z') },
      { enquiryId: enquiry4.id, quotationId: q4.id, userId: users.sales.id, stage: 'Sent to Client', message: 'Quotation sent to Dubai Marina Apartments - awaiting client signature', createdAt: new Date('2026-11-22T09:00:00Z') },
    ],
  })

  // === Entry 5: New project in procurement (status: IN_PROCUREMENT) ===
  // QUO-2026-005 is a parallel progressed quotation (signed + paid + order released)
  // used to seed PRJ-2026-002. Kept separate from QUO-2026-004 so the SENT_TO_CLIENT
  // demo entry is preserved.
  const q5 = await db.quotation.create({
    data: {
      quotationNo: 'QUO-2026-005',
      enquiryId: enquiry4.id,
      clientId: marinaClient.id,
      createdBy: users.roy.id,
      template: 'project-standard',
      validity: 45,
      deliveryWeeks: 8,
      paymentTerms: '30% advance, 60% before delivery, 10% after installation',
      warranty: '2 years on manufacturing defects',
      subtotal: 110_000,
      discount: 0,
      vat: 5_500,
      total: 115_500,
      status: QuotationStatus.ORDER_RELEASED,
      approvedBy: users.mazen.id,
      approvedAt: new Date('2026-11-16T10:00:00Z'),
      sentAt: new Date('2026-11-17T09:00:00Z'),
      signedAt: new Date('2026-11-18T14:00:00Z'),
      notes: 'Same scope as QUO-2026-004 but progressed: signed and advance paid. Used to seed PRJ-2026-002 in IN_PROCUREMENT stage.',
    },
  })
  await db.quotationItem.createMany({
    data: [
      { quotationId: q5.id, lineNumber: 1, description: 'Modular Kitchen Cabinet - Standard Unit', spec: '18mm MDF body, laminate finish, soft-close hinges, 1m wide', qty: 50, unit: 'piece', material: 'MDF + Laminate', materialCost: 1200, laborHours: 8, laborRate: 45, productionHours: 10, installationHours: 2, unitPrice: 2200, total: 110000 },
    ],
  })

  const project2 = await db.project.create({
    data: {
      projectNo: 'PRJ-2026-002',
      name: 'Marina Apartments Kitchen renovation',
      enquiryId: enquiry4.id,
      quotationId: q5.id,
      clientId: marinaClient.id,
      type: ClientType.PROJECT,
      startDate: new Date('2026-11-20'),
      dueDate: new Date('2027-01-15'),
      deliveryDate: new Date('2027-01-10'),
      status: ProjectStatus.IN_PROCUREMENT,
    },
  })

  // Advance payment link for q5
  await db.paymentLink.create({
    data: {
      projectId: project2.id,
      quotationId: q5.id,
      amount: 34_650, // 30% advance
      linkRef: 'PAY-2026-002',
      status: PaymentLinkStatus.PAID,
      generatedById: users.finance.id,
      generatedAt: new Date('2026-11-18T15:00:00Z'),
      sentAt: new Date('2026-11-18T15:30:00Z'),
      paidAt: new Date('2026-11-19T09:00:00Z'),
    },
  })

  // BOQ-M-002 for PRJ-2026-002 (issued to procurement)
  const boq2 = await db.boq.create({
    data: {
      boqNo: 'BOQ-M-002',
      projectId: project2.id,
      quotationId: q5.id,
      issuedBy: users.roy.id,
      status: BoqStatus.IN_PROCUREMENT,
      issuedAt: new Date('2026-11-21T11:00:00Z'),
    },
  })
  await db.boqItem.createMany({
    data: [
      { boqId: boq2.id, materialId: materials.mdf18.id, description: 'MDF Board 18mm MR Grade', spec: '2440x1220', qty: 75, unit: 'sheet', available: true },
      { boqId: boq2.id, materialId: materials.laminate.id, description: 'High Pressure Laminate', spec: '1mm Decorative', qty: 50, unit: 'sheet', available: false, notes: 'Out of stock - need procurement' },
      { boqId: boq2.id, materialId: materials.hinges.id, description: 'Soft Close Hinges 110deg', spec: 'full overlay', qty: 200, unit: 'piece', available: true },
      { boqId: boq2.id, materialId: materials.handles.id, description: 'Bar Handle 128mm Matte Black', spec: 'matte', qty: 100, unit: 'piece', available: true },
    ],
  })

  // MRQ-2026-002 (SUBMITTED, awaiting supplier quotes)
  const mrq2 = await db.materialRequisition.create({
    data: {
      mrqNo: 'MRQ-2026-002',
      projectId: project2.id,
      boqId: boq2.id,
      createdById: users.nimesha.id,
      status: MrqStatus.SUBMITTED,
      createdAt: new Date('2026-11-22T09:00:00Z'),
    },
  })
  await db.materialRequisitionItem.createMany({
    data: [
      { mrqId: mrq2.id, materialId: materials.laminate.id, description: 'High Pressure Laminate 1mm', spec: 'Decorative', qty: 50, unit: 'sheet', quotedPrice: null },
    ],
  })

  await db.timelineEvent.createMany({
    data: [
      { enquiryId: enquiry4.id, projectId: project2.id, quotationId: q5.id, userId: users.sales.id, stage: 'Sent to Client', message: 'Quotation QUO-2026-005 sent to client', createdAt: new Date('2026-11-17T09:00:00Z') },
      { enquiryId: enquiry4.id, projectId: project2.id, quotationId: q5.id, userId: users.sales.id, stage: 'Client Signed', message: 'Signed quotation received from Dubai Marina Apartments', createdAt: new Date('2026-11-18T14:00:00Z') },
      { projectId: project2.id, userId: users.finance.id, stage: 'Payment Link Generated', message: 'Advance payment link PAY-2026-002 generated (30% of total)', createdAt: new Date('2026-11-18T15:00:00Z') },
      { projectId: project2.id, userId: users.finance.id, stage: 'Payment Received', message: 'Advance payment received from client', createdAt: new Date('2026-11-19T09:00:00Z') },
      { projectId: project2.id, userId: users.roy.id, stage: 'Order Released', message: 'Order released - email sent to Procurement, Technical & Production', createdAt: new Date('2026-11-20T11:00:00Z') },
      { projectId: project2.id, quotationId: q5.id, userId: users.roy.id, stage: 'BOQ Issued', message: 'BOQ-M-002 issued to Procurement', createdAt: new Date('2026-11-21T11:00:00Z') },
      { projectId: project2.id, userId: users.nimesha.id, stage: 'MRQ Created', message: 'MRQ-2026-002 created - awaiting supplier quotes for laminate', createdAt: new Date('2026-11-22T09:00:00Z') },
    ],
  })

  // === Entry 6: Project ready for delivery (status: READY_FOR_DELIVERY) ===
  const enquiry5 = await db.enquiry.create({
    data: {
      enquiryNo: 'ENQ-2026-005',
      enquiryDate: new Date('2026-10-25'),
      source: EnquirySource.WALK_IN,
      clientId: internalClient.id,
      salesUserId: users.sales.id,
      title: 'Office Furniture - Al Gurg HQ',
      description: 'Office desks and storage cabinets for new HQ floor. 10 desks and 10 storage units.',
      projectType: 'Office Furniture',
      location: 'Al Quoz, Dubai',
      attachments: JSON.stringify(['office-layout.pdf']),
      status: EnquiryStatus.CONFIRMED,
    },
  })
  const q6 = await db.quotation.create({
    data: {
      quotationNo: 'QUO-2026-006',
      enquiryId: enquiry5.id,
      clientId: internalClient.id,
      createdBy: users.roy.id,
      template: 'project-standard',
      validity: 30,
      deliveryWeeks: 4,
      paymentTerms: 'Internal transfer',
      warranty: '2 years on manufacturing defects',
      subtotal: 60_000,
      discount: 0,
      vat: 3_000,
      total: 63_000,
      status: QuotationStatus.ORDER_RELEASED,
      approvedBy: users.mazen.id,
      approvedAt: new Date('2026-10-28T10:00:00Z'),
      sentAt: new Date('2026-10-29T09:00:00Z'),
      signedAt: new Date('2026-10-30T11:00:00Z'),
      notes: 'Internal Al Gurg project. 10 desks + 10 storage cabinets.',
    },
  })
  await db.quotationItem.createMany({
    data: [
      { quotationId: q6.id, lineNumber: 1, description: 'Executive Office Desk - Laminated MDF', spec: '18mm MDF body, oak laminate, cable management', qty: 10, unit: 'piece', material: 'MDF + Laminate', materialCost: 1500, laborHours: 8, laborRate: 45, productionHours: 10, installationHours: 2, unitPrice: 3000, total: 30000 },
      { quotationId: q6.id, lineNumber: 2, description: 'Storage Cabinet - Sliding Doors', spec: '18mm MDF body, laminate finish, soft-close', qty: 10, unit: 'piece', material: 'MDF + Laminate', materialCost: 1500, laborHours: 8, laborRate: 45, productionHours: 10, installationHours: 2, unitPrice: 3000, total: 30000 },
    ],
  })

  const project3 = await db.project.create({
    data: {
      projectNo: 'PRJ-2026-003',
      name: 'Office Furniture - Al Gurg HQ',
      enquiryId: enquiry5.id,
      quotationId: q6.id,
      clientId: internalClient.id,
      type: ClientType.PROJECT,
      startDate: new Date('2026-11-01'),
      dueDate: new Date('2026-11-30'),
      deliveryDate: new Date('2026-12-01'),
      status: ProjectStatus.READY_FOR_DELIVERY,
    },
  })

  await db.paymentLink.create({
    data: {
      projectId: project3.id,
      quotationId: q6.id,
      amount: 18_900, // 30% advance
      linkRef: 'PAY-2026-003',
      status: PaymentLinkStatus.PAID,
      generatedById: users.finance.id,
      generatedAt: new Date('2026-10-30T13:00:00Z'),
      sentAt: new Date('2026-10-30T13:30:00Z'),
      paidAt: new Date('2026-11-01T09:00:00Z'),
    },
  })

  // Drawing submission for PRJ-2026-003
  await db.drawingSubmission.create({
    data: {
      drawingNo: 'DRW-2026-002',
      projectId: project3.id,
      drawnById: users.draft.id,
      drawingType: 'Shop Drawing',
      approvedById: users.wasim.id,
      approvedByClientAt: new Date('2026-11-03T15:00:00Z'),
      status: DrawingStatus.APPROVED,
      attachmentsJson: JSON.stringify(['desk-elevation.pdf', 'cabinet-plan.pdf']),
      remarks: 'Drawings approved internally.',
      createdAt: new Date('2026-11-02T10:00:00Z'),
    },
  })

  // Production order PRD-2026-003 - joinery, all stages QC_PASSED
  const prodJoinery3 = await db.productionOrder.create({
    data: {
      orderNo: 'PRD-2026-003',
      projectId: project3.id,
      type: ProductionType.JOINERY,
      releasedBy: users.motasem.id,
      drawingApproved: true,
      dueDate: new Date('2026-11-28'),
      status: 'COMPLETED',
    },
  })
  const joineryStages3 = ['Pressing', 'Cutting', 'Lipping / Edge Banding', 'Boring', 'CNC Routing', 'Sanding', 'Painting', 'Packing', 'Delivery']
  for (let i = 0; i < joineryStages3.length; i++) {
    const stageName = joineryStages3[i]
    const startDay = 6 + i * 2
    const endDay = 7 + i * 2
    const startDate = new Date(`2026-11-${String(startDay).padStart(2, '0')}T08:00:00Z`)
    const endDate = new Date(`2026-11-${String(endDay).padStart(2, '0')}T17:00:00Z`)
    const qc = await db.qcReport.create({
      data: {
        reportNo: `QC-PRD3-J-${i + 1}`,
        type: 'PRODUCTION_STAGE',
        refType: 'ProductionStage',
        refId: 'pending',
        qcUserId: users.venkat.id,
        inspectionDate: endDate,
        status: 'PASSED',
        checklistJson: JSON.stringify([
          { item: 'Quality check passed', status: 'PASS' },
          { item: 'Dimensions within tolerance', status: 'PASS' },
          { item: 'Surface finish acceptable', status: 'PASS' },
        ]),
        submittedAt: new Date(endDate.getTime() + 30 * 60 * 1000),
      },
    })
    const stage = await db.productionStage.create({
      data: {
        productionOrderId: prodJoinery3.id,
        stageName,
        stageOrder: i + 1,
        operatorId: users.motasem.id,
        status: StageStatus.QC_PASSED,
        startedAt: startDate,
        completedAt: endDate,
        qcReportId: qc.id,
      },
    })
    await db.qcReport.update({
      where: { id: qc.id },
      data: { refId: stage.id, productionStageId: stage.id },
    })
  }

  await db.timelineEvent.createMany({
    data: [
      { enquiryId: enquiry5.id, projectId: project3.id, quotationId: q6.id, userId: users.sales.id, stage: 'Enquiry Received', message: 'Internal enquiry ENQ-2026-005 received from Al Gurg management', createdAt: new Date('2026-10-25T09:00:00Z') },
      { enquiryId: enquiry5.id, projectId: project3.id, quotationId: q6.id, userId: users.roy.id, stage: 'Quotation Drafted', message: 'Quotation QUO-2026-006 drafted by Estimation', createdAt: new Date('2026-10-27T14:00:00Z') },
      { enquiryId: enquiry5.id, projectId: project3.id, quotationId: q6.id, userId: users.mazen.id, stage: 'Quotation Approved', message: 'Quotation approved by Business Manager', createdAt: new Date('2026-10-28T10:00:00Z') },
      { enquiryId: enquiry5.id, projectId: project3.id, quotationId: q6.id, userId: users.sales.id, stage: 'Client Signed', message: 'Quotation signed internally by Mr. Mazen', createdAt: new Date('2026-10-30T11:00:00Z') },
      { projectId: project3.id, userId: users.finance.id, stage: 'Payment Link Generated', message: 'Internal payment link PAY-2026-003 generated', createdAt: new Date('2026-10-30T13:00:00Z') },
      { projectId: project3.id, userId: users.roy.id, stage: 'Order Released', message: 'Order released - production initiated', createdAt: new Date('2026-11-01T11:00:00Z') },
      { projectId: project3.id, userId: users.draft.id, stage: 'Drawings Approved', message: 'DRW-2026-002 approved - released to production', createdAt: new Date('2026-11-03T15:00:00Z') },
      { projectId: project3.id, userId: users.motasem.id, stage: 'Production Completed', message: 'All joinery stages completed with QC PASSED', createdAt: new Date('2026-11-28T17:00:00Z') },
      { projectId: project3.id, userId: users.wasim.id, stage: 'Ready for Delivery', message: 'Project ready for delivery - awaiting dispatch', createdAt: new Date('2026-11-29T09:00:00Z') },
    ],
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
    // Notifications for new demo entries
    { userId: users.roy.id, type: 'ENQUIRY_NEW', title: 'New Enquiry', message: 'New phone enquiry ENQ-2026-003 from Mrs. Fatima Al Sayed (Wardrobe & Vanity)', refType: 'Enquiry', refId: enquiry3.id },
    { userId: users.mazen.id, type: 'APPROVAL_PENDING', title: 'Quotation Pending Approval', message: 'QUO-2026-003 awaiting your approval - review vanity stone top pricing', refType: 'Quotation', refId: q3.id },
    { userId: users.sales.id, type: 'CLIENT_FOLLOWUP', title: 'Awaiting Client Signature', message: 'QUO-2026-004 sent to Dubai Marina Apartments - awaiting signature', refType: 'Quotation', refId: q4.id },
    { userId: users.nimesha.id, type: 'BOQ_RECEIVED', title: 'BOQ-M Received', message: 'BOQ-M-002 issued for project PRJ-2026-002 (Marina Apartments kitchen)', refType: 'BOQ', refId: boq2.id },
    { userId: users.nimesha.id, type: 'MRQ_PENDING', title: 'MRQ Awaiting Quotes', message: 'MRQ-2026-002 awaiting supplier quotes for laminate', refType: 'MRQ', refId: mrq2.id },
    { userId: users.wasim.id, type: 'DELIVERY_READY', title: 'Project Ready for Delivery', message: 'PRJ-2026-003 (Al Gurg HQ office furniture) ready for delivery', refType: 'Project', refId: project3.id },
  ]
  for (const n of notifs) {
    await db.notification.create({ data: n })
  }

  console.log('Seed complete. Demo user accounts created:')
  for (const [k, u] of Object.entries(users)) {
    console.log(`   ${u.loginId}  ${u.email}  (${u.role})`)
  }
  console.log(`   Default password for all accounts: ${DEFAULT_PASSWORD}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
