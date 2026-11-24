import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding RoofDynamics database...');

  // ============================================================
  // Tenant 1 — Perth Premier Roofing & Plumbing Pty Ltd (Enterprise)
  // ============================================================
  const tenant1 = await prisma.tenant.upsert({
    where: { id: 'tenant-1' },
    update: {},
    create: {
      id: 'tenant-1',
      name: 'Perth Premier Roofing & Plumbing Pty Ltd',
      abn: '51 004 395 174',
      builderRegNumber: 'BU12345',
      plumberLicence: 'PL999',
      primaryColour: '#0EA5E9',
      subscriptionTier: 'EMPIRE_ENTERPRISE_LEASE',
      monthlyLeaseFee: 699,
      isWhiteLabel: true,
    },
  });

  // Tenant 1 entitlements — all modules unlocked
  const allModules = [
    'CRM_QUOTING', 'WMS_MRP', 'OPERATIONS_HRIS', 'WHS_SAFETY',
    'EAM_FLEET', 'ACCOUNTING', 'PUBLIC_WEBSITE', 'AI_SOCIAL_AGENT',
    'BI_EXECUTIVE', 'SAAS_SUPER_ADMIN',
  ] as const;

  for (const moduleKey of allModules) {
    await prisma.moduleEntitlement.upsert({
      where: { tenantId_moduleKey: { tenantId: tenant1.id, moduleKey } },
      update: { isEnabled: true },
      create: { tenantId: tenant1.id, moduleKey, isEnabled: true, addOnPrice: 0 },
    });
  }

  // Tenant 1 users
  const hashedPassword1 = await (await import('bcrypt')).hash('Demo1234!', 10);
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant1.id, email: 'admin@perthpremier.com.au' } },
    update: { password: hashedPassword1 },
    create: { tenantId: tenant1.id, email: 'admin@perthpremier.com.au', name: 'John Smith', role: 'admin', password: hashedPassword1 },
  });

  // Developer (platform) account — full access + dev tools
  const hashedPasswordDev = await (await import('bcrypt')).hash('!Ausgreek123', 10);
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant1.id, email: 'ausgreekdev@gmail.com' } },
    update: { password: hashedPasswordDev, role: 'developer' },
    create: { tenantId: tenant1.id, email: 'ausgreekdev@gmail.com', name: 'AusGreek Developer', role: 'developer', password: hashedPasswordDev },
  });

  // Tenant 1 crew
  const crew1 = await prisma.crewMember.create({
    data: { tenantId: tenant1.id, firstName: 'John', lastName: 'Smith', role: 'Crew Lead', hireDate: new Date('2023-01-15'), hourlyRate: 45 },
  });
  const crew2 = await prisma.crewMember.create({
    data: { tenantId: tenant1.id, firstName: 'Mike', lastName: 'Wilson', role: 'Roofer', hireDate: new Date('2023-03-10'), hourlyRate: 38 },
  });
  const crew3 = await prisma.crewMember.create({
    data: { tenantId: tenant1.id, firstName: 'Sarah', lastName: 'Davis', role: 'Apprentice', hireDate: new Date('2024-01-10'), hourlyRate: 28 },
  });

  // HRIS profiles
  await prisma.hRISProfile.create({
    data: {
      tenantId: tenant1.id, crewMemberId: crew1.id,
      whiteCardNumber: 'WC-12345', whiteCardExpiry: new Date('2026-12-01'),
      workingAtHeightsCert: 'WAH-678', workingAtHeightsExpiry: new Date('2026-12-01'),
      plumbingLicence: 'PL-999', plumbingLicenceExpiry: new Date('2026-12-01'),
      builderReg: 'BU12345', builderRegExpiry: new Date('2026-12-01'),
      kpiRating: 4.8,
    },
  });
  await prisma.hRISProfile.create({
    data: {
      tenantId: tenant1.id, crewMemberId: crew2.id,
      whiteCardNumber: 'WC-12346', whiteCardExpiry: new Date('2025-06-15'),
      workingAtHeightsCert: 'WAH-679', workingAtHeightsExpiry: new Date('2026-06-15'),
      kpiRating: 4.5,
    },
  });
  await prisma.hRISProfile.create({
    data: {
      tenantId: tenant1.id, crewMemberId: crew3.id,
      whiteCardNumber: 'WC-12347', whiteCardExpiry: new Date('2027-01-01'),
      kpiRating: 3.9,
    },
  });

  // Tickets (valid + expired)
  await prisma.ticket.createMany({
    data: [
      { tenantId: tenant1.id, crewMemberId: crew1.id, ticketType: 'WHITE_CARD', ticketNumber: 'WC-12345', status: 'VALID', expiryDate: new Date('2026-12-01') },
      { tenantId: tenant1.id, crewMemberId: crew1.id, ticketType: 'WORKING_AT_HEIGHTS', ticketNumber: 'WAH-678', status: 'VALID', expiryDate: new Date('2026-12-01') },
      { tenantId: tenant1.id, crewMemberId: crew1.id, ticketType: 'PLUMBING_LICENCE', ticketNumber: 'PL-999', status: 'VALID', expiryDate: new Date('2026-12-01') },
      { tenantId: tenant1.id, crewMemberId: crew2.id, ticketType: 'WHITE_CARD', ticketNumber: 'WC-12346', status: 'VALID', expiryDate: new Date('2025-06-15') },
      { tenantId: tenant1.id, crewMemberId: crew2.id, ticketType: 'WORKING_AT_HEIGHTS', ticketNumber: 'WAH-679', status: 'VALID', expiryDate: new Date('2026-06-15') },
      { tenantId: tenant1.id, crewMemberId: crew3.id, ticketType: 'WHITE_CARD', ticketNumber: 'WC-12347', status: 'VALID', expiryDate: new Date('2027-01-01') },
      { tenantId: tenant1.id, crewMemberId: crew2.id, ticketType: 'EWP', ticketNumber: 'EWP-001', status: 'EXPIRED', expiryDate: new Date('2025-01-01') },
    ],
  });

  // Tenant 1 stock items
  await prisma.stockItem.createMany({
    data: [
      { tenantId: tenant1.id, sku: 'CB-CORR-3.0', name: 'Colorbond Corrugated 3.0m', location: 'WELSHPOOL_MAIN_YARD', quantityOnHand: 45, quantityReserved: 10, reorderPoint: 20, unitCost: 32, supplier: 'Lysaght Welshpool' },
      { tenantId: tenant1.id, sku: 'BATT-40MM', name: 'Topspan 40mm Batten', location: 'HILUX_UTE_1', quantityOnHand: 120, quantityReserved: 30, reorderPoint: 50, unitCost: 8.5, supplier: 'Stramit Malaga' },
      { tenantId: tenant1.id, sku: 'ANTICON-60', name: 'Anticon 60mm Insulation', location: 'WELSHPOOL_MAIN_YARD', quantityOnHand: 12, quantityReserved: 5, reorderPoint: 8, unitCost: 65, supplier: 'Metroll Canning Vale' },
      { tenantId: tenant1.id, sku: 'SCREW-12G', name: '12g x 65mm Crest Screws', location: 'ISUZU_TRUCK_2', quantityOnHand: 5000, quantityReserved: 1500, reorderPoint: 2000, unitCost: 0.65, supplier: 'Stratco' },
      { tenantId: tenant1.id, sku: 'GUTTER-150', name: '150mm Quad Gutter', location: 'WELSHPOOL_MAIN_YARD', quantityOnHand: 8, quantityReserved: 3, reorderPoint: 10, unitCost: 25, supplier: 'Stramit Malaga' },
      { tenantId: tenant1.id, sku: 'DOWNPIPE-90', name: '90mm Round Downpipe', location: 'HILUX_UTE_1', quantityOnHand: 15, quantityReserved: 5, reorderPoint: 8, unitCost: 18, supplier: 'Stramit Malaga' },
    ],
  });

  // Tenant 1 equipment & harnesses
  await prisma.equipment.createMany({
    data: [
      { tenantId: tenant1.id, assetType: 'UTE', name: 'Hilux Ute 1', serialNumber: 'HT-001', status: 'ACTIVE', location: 'WELSHPOOL_MAIN_YARD', cost: 45000, purchaseDate: new Date('2023-01-15') },
      { tenantId: tenant1.id, assetType: 'UTE', name: 'Isuzu Truck 2', serialNumber: 'IS-002', status: 'ACTIVE', location: 'WELSHPOOL_MAIN_YARD', cost: 68000, purchaseDate: new Date('2022-06-10') },
      { tenantId: tenant1.id, assetType: 'EDGE_PROTECTION_RAIL_KIT', name: 'Edge Protection Rail Kit A', serialNumber: 'EP-001', status: 'ACTIVE', location: 'HILUX_UTE_1', cost: 3500, purchaseDate: new Date('2024-03-01') },
      { tenantId: tenant1.id, assetType: 'NAIL_GUN', name: 'Nail Gun - Makita', serialNumber: 'NG-001', status: 'ACTIVE', location: 'ISUZU_TRUCK_2', cost: 450, purchaseDate: new Date('2023-08-20') },
      { tenantId: tenant1.id, assetType: 'TRAILER', name: 'Equipment Trailer', serialNumber: 'TR-001', status: 'MAINTENANCE', location: 'WELSHPOOL_MAIN_YARD', cost: 8500, purchaseDate: new Date('2022-09-15') },
    ],
  });

  await prisma.harness.createMany({
    data: [
      { tenantId: tenant1.id, name: 'Full Body Harness - Crew 1', serialNumber: 'HARN-001', status: 'ACTIVE', lastInspectionDate: new Date('2026-05-01'), nextInspectionDue: new Date('2026-11-01') },
      { tenantId: tenant1.id, name: 'Full Body Harness - Crew 2', serialNumber: 'HARN-002', status: 'ACTIVE', lastInspectionDate: new Date('2026-04-15'), nextInspectionDue: new Date('2026-10-15') },
      { tenantId: tenant1.id, name: 'Full Body Harness - Crew 3', serialNumber: 'HARN-003', status: 'ACTIVE', lastInspectionDate: new Date('2026-03-01'), nextInspectionDue: new Date('2026-09-01') },
    ],
  });

  // Asset inspections
  await prisma.assetInspection.createMany({
    data: [
      { tenantId: tenant1.id, equipmentId: null, harnessId: null, inspectionType: 'AS/NZS 1891.4', status: 'PASSED', inspectionDate: new Date('2026-05-01'), nextDueDate: new Date('2026-11-01'), inspectorName: 'Safety Inspector WA' },
    ],
  });

  // Tenant 1 leads (10+ across various suburbs and statuses)
  const leads = await prisma.lead.createMany({
    data: [
      { tenantId: tenant1.id, firstName: 'James', lastName: 'Wilson', suburb: 'Fremantle', status: 'QUOTING', estimatedValue: 35000, source: 'Website', phone: '0412 345 678', email: 'james.wilson@email.com' },
      { tenantId: tenant1.id, firstName: 'Sarah', lastName: 'McDonald', suburb: 'Scarborough', status: 'CONTACTED', estimatedValue: 28000, source: 'Referral', phone: '0423 456 789', email: 'sarah.mcdonald@email.com' },
      { tenantId: tenant1.id, firstName: 'Robert', lastName: 'Thompson', suburb: 'Cottesloe', status: 'NEW', estimatedValue: 42000, source: 'Google Ads', phone: '0434 567 890', email: 'robert.thompson@email.com' },
      { tenantId: tenant1.id, firstName: 'Lisa', lastName: 'Chen', suburb: 'Hillarys', status: 'NEGOTIATION', estimatedValue: 55000, source: 'Website', phone: '0445 678 901', email: 'lisa.chen@email.com' },
      { tenantId: tenant1.id, firstName: 'Mark', lastName: 'Anderson', suburb: 'Rockingham', status: 'WON', estimatedValue: 38000, source: 'Referral', phone: '0456 789 012', email: 'mark.anderson@email.com' },
      { tenantId: tenant1.id, firstName: 'Emma', lastName: 'Taylor', suburb: 'Midland', status: 'NEW', estimatedValue: 22000, source: 'Facebook', phone: '0467 890 123', email: 'emma.taylor@email.com' },
      { tenantId: tenant1.id, firstName: 'David', lastName: 'Lee', suburb: 'Joondalup', status: 'CONTACTED', estimatedValue: 31000, source: 'Google Ads', phone: '0478 901 234', email: 'david.lee@email.com' },
      { tenantId: tenant1.id, firstName: 'Karen', lastName: 'White', suburb: 'Armadale', status: 'LOST', estimatedValue: 18000, source: 'Website', phone: '0489 012 345', email: 'karen.white@email.com' },
      { tenantId: tenant1.id, firstName: 'Tom', lastName: 'Brown', suburb: 'Fremantle', status: 'QUOTING', estimatedValue: 62000, source: 'Referral', phone: '0490 123 456', email: 'tom.brown@email.com' },
      { tenantId: tenant1.id, firstName: 'Rachel', lastName: 'Green', suburb: 'Scarborough', status: 'WON', estimatedValue: 45000, source: 'Website', phone: '0401 234 567', email: 'rachel.green@email.com' },
    ],
  });

  // Fetch leads for quote creation
  const allLeads = await prisma.lead.findMany({ where: { tenantId: tenant1.id } });

  // Tenant 1 quotes (various statuses)
  const quote1 = await prisma.quote.create({
    data: {
      tenantId: tenant1.id, leadId: allLeads[0].id,
      customerName: 'James Wilson', customerEmail: 'james.wilson@email.com', customerPhone: '0412 345 678',
      customerAddress: '12 Beach St', customerSuburb: 'Fremantle',
      planArea: 180, pitchDegrees: 22, wastePercentage: 7, roofHeight: 3.5,
      totalIncGst: 35000, totalExGst: 31818.18, gstAmount: 3181.82,
      status: 'ACCEPTED', coastalZone: true, corrosionFlag: true,
      requiresBuilderReg: false, requiresPlumbingLic: false, requiresSWMS: true,
      compliancePassed: true, acceptedAt: new Date('2026-01-15'),
    },
  });

  const quote2 = await prisma.quote.create({
    data: {
      tenantId: tenant1.id, leadId: allLeads[1].id,
      customerName: 'Sarah McDonald', customerEmail: 'sarah.mcdonald@email.com', customerPhone: '0423 456 789',
      customerAddress: '45 Ocean View Rd', customerSuburb: 'Scarborough',
      planArea: 150, pitchDegrees: 18, wastePercentage: 7, roofHeight: 2.8,
      totalIncGst: 28000, totalExGst: 25454.55, gstAmount: 2545.45,
      status: 'SENT', coastalZone: true, corrosionFlag: true,
      requiresBuilderReg: false, requiresPlumbingLic: true, requiresSWMS: true,
      compliancePassed: false, complianceNotes: 'Plumbing licence required for gutter replacement',
    },
  });

  const quote3 = await prisma.quote.create({
    data: {
      tenantId: tenant1.id, leadId: allLeads[2].id,
      customerName: 'Robert Thompson', customerEmail: 'robert.thompson@email.com', customerPhone: '0434 567 890',
      customerAddress: '78 Marine Parade', customerSuburb: 'Cottesloe',
      planArea: 220, pitchDegrees: 25, wastePercentage: 12, roofHeight: 4.0,
      totalIncGst: 42000, totalExGst: 38181.82, gstAmount: 3818.18,
      status: 'DRAFT', coastalZone: true, corrosionFlag: true,
      requiresBuilderReg: true, requiresPlumbingLic: false, requiresSWMS: true,
      compliancePassed: false, complianceNotes: 'Builder registration required for re-roofing over $20k',
    },
  });

  const quote4 = await prisma.quote.create({
    data: {
      tenantId: tenant1.id, leadId: allLeads[3].id,
      customerName: 'Lisa Chen', customerEmail: 'lisa.chen@email.com', customerPhone: '0445 678 901',
      customerAddress: '33 Sunset Blvd', customerSuburb: 'Hillarys',
      planArea: 250, pitchDegrees: 20, wastePercentage: 7, roofHeight: 3.2,
      totalIncGst: 55000, totalExGst: 50000, gstAmount: 5000,
      status: 'SENT', coastalZone: true, corrosionFlag: true,
      requiresBuilderReg: true, requiresPlumbingLic: true, requiresSWMS: true,
      compliancePassed: false,
    },
  });

  const quote5 = await prisma.quote.create({
    data: {
      tenantId: tenant1.id, leadId: allLeads[4].id,
      customerName: 'Mark Anderson', customerEmail: 'mark.anderson@email.com', customerPhone: '0456 789 012',
      customerAddress: '90 Coastal Hwy', customerSuburb: 'Rockingham',
      planArea: 200, pitchDegrees: 22, wastePercentage: 7, roofHeight: 3.0,
      totalIncGst: 38000, totalExGst: 34545.45, gstAmount: 3454.55,
      status: 'ACCEPTED', coastalZone: true, corrosionFlag: true,
      requiresBuilderReg: false, requiresPlumbingLic: false, requiresSWMS: true,
      compliancePassed: true, acceptedAt: new Date('2026-02-01'),
    },
  });

  // ============================================================
  // Jobs (linked to accepted quotes)
  // ============================================================
  const job1 = await prisma.job.create({
    data: {
      tenantId: tenant1.id, quoteId: quote1.id, jobNumber: 'JOB-001',
      status: 'COMPLETED', scheduledDate: new Date('2026-01-20'), completedDate: new Date('2026-01-25'),
      roofHeight: 3.5, crewLeadId: crew1.id, swmsSigned: true, edgeProtectionVerified: true,
    },
  });

  const job2 = await prisma.job.create({
    data: {
      tenantId: tenant1.id, quoteId: quote5.id, jobNumber: 'JOB-002',
      status: 'IN_PROGRESS', scheduledDate: new Date('2026-02-10'),
      roofHeight: 3.0, crewLeadId: crew2.id, swmsSigned: true, edgeProtectionVerified: true,
    },
  });

  // Crew assignments
  await prisma.crewAssignment.createMany({
    data: [
      { tenantId: tenant1.id, jobId: job1.id, crewMemberId: crew1.id },
      { tenantId: tenant1.id, jobId: job1.id, crewMemberId: crew2.id },
      { tenantId: tenant1.id, jobId: job2.id, crewMemberId: crew2.id },
      { tenantId: tenant1.id, jobId: job2.id, crewMemberId: crew3.id },
    ],
  });

  // SWMS records
  await prisma.sWMS.create({
    data: {
      tenantId: tenant1.id, jobId: job1.id, title: 'Fremantle Residential Re-roof',
      roofHeight: 3.5, edgeProtectionRequired: true, edgeProtectionVerified: true,
      fallingFromHeightsSigned: true, signedBy: 'John Smith', signedAt: new Date('2026-01-18'),
      asbestosRemoval: false,
    },
  });

  await prisma.sWMS.create({
    data: {
      tenantId: tenant1.id, jobId: job2.id, title: 'Rockingham Roof Replacement',
      roofHeight: 3.0, edgeProtectionRequired: true, edgeProtectionVerified: true,
      fallingFromHeightsSigned: true, signedBy: 'Mike Wilson', signedAt: new Date('2026-02-08'),
      asbestosRemoval: false,
    },
  });

  // Asbestos removal SWMS (Super Six > 10m²)
  const job3 = await prisma.job.create({
    data: {
      tenantId: tenant1.id, quoteId: quote3.id, jobNumber: 'JOB-003',
      status: 'PENDING', scheduledDate: new Date('2026-03-01'),
      roofHeight: 4.0, isAsbestosRemoval: true, asbestosArea: 15,
      crewLeadId: crew1.id, swmsSigned: false, edgeProtectionVerified: false,
    },
  });

  await prisma.sWMS.create({
    data: {
      tenantId: tenant1.id, jobId: job3.id, title: 'Cottesloe Asbestos Super Six Removal',
      roofHeight: 4.0, edgeProtectionRequired: true, edgeProtectionVerified: false,
      fallingFromHeightsSigned: false,
      asbestosRemoval: true, asbestosLicenceNumber: null,
      workSafeNotificationDate: null, tipReceiptUrl: null,
    },
  });

  // ============================================================
  // BOM Items (for accepted quotes)
  // ============================================================
  await prisma.bOMItem.createMany({
    data: [
      { tenantId: tenant1.id, quoteId: quote1.id, itemType: 'sheet', itemName: 'Colorbond Ultra Corrugated Sheet (Coastal Grade)', quantity: 141, unit: 'sheets', unitCost: 45, totalCost: 6345, isCoastalGrade: true },
      { tenantId: tenant1.id, quoteId: quote1.id, itemType: 'batten', itemName: 'Topspan 40mm Roof Batten', quantity: 119, unit: 'lineal metres', unitCost: 8.5, totalCost: 1011.5, isCoastalGrade: false },
      { tenantId: tenant1.id, quoteId: quote1.id, itemType: 'insulation', itemName: 'Anticon 60mm Insulation Blanket', quantity: 8, unit: 'rolls', unitCost: 85, totalCost: 680, isCoastalGrade: true },
      { tenantId: tenant1.id, quoteId: quote1.id, itemType: 'fastener', itemName: '12g x 65mm Class 4 Stainless 316 Crest Screws (Coastal)', quantity: 749, unit: 'screws', unitCost: 0.85, totalCost: 636.65, isCoastalGrade: true },
    ],
  });

  // ============================================================
  // Stock Reservations (for jobs)
  // ============================================================
  const stockItems = await prisma.stockItem.findMany({ where: { tenantId: tenant1.id } });
  if (stockItems.length > 0) {
    await prisma.stockReservation.createMany({
      data: [
        { tenantId: tenant1.id, jobId: job1.id, stockItemId: stockItems[0].id, quantity: 40 },
        { tenantId: tenant1.id, jobId: job1.id, stockItemId: stockItems[2].id, quantity: 8 },
        { tenantId: tenant1.id, jobId: job2.id, stockItemId: stockItems[1].id, quantity: 30 },
      ],
    });
  }

  // ============================================================
  // Invoices (all milestones)
  // ============================================================
  await prisma.invoice.createMany({
    data: [
      { tenantId: tenant1.id, jobId: job1.id, quoteId: quote1.id, invoiceNumber: 'INV-DEP-001', milestone: 'DEPOSIT_10', amount: 3500, gstAmount: 318.18, totalIncGst: 3500, status: 'PAID', dueDate: new Date('2026-01-16'), paidAt: new Date('2026-01-17') },
      { tenantId: tenant1.id, jobId: job1.id, quoteId: quote1.id, invoiceNumber: 'INV-MAT-001', milestone: 'MATERIALS_50', amount: 17500, gstAmount: 1590.91, totalIncGst: 17500, status: 'PAID', dueDate: new Date('2026-01-20'), paidAt: new Date('2026-01-21') },
      { tenantId: tenant1.id, jobId: job1.id, quoteId: quote1.id, invoiceNumber: 'INV-COM-001', milestone: 'COMPLETION_40', amount: 14000, gstAmount: 1272.73, totalIncGst: 14000, status: 'PAID', dueDate: new Date('2026-01-26'), paidAt: new Date('2026-01-27'), warrantyCertificateUrl: '/certs/warranty-JOB001.pdf' },
      { tenantId: tenant1.id, jobId: job2.id, quoteId: quote5.id, invoiceNumber: 'INV-DEP-002', milestone: 'DEPOSIT_10', amount: 3800, gstAmount: 345.45, totalIncGst: 3800, status: 'PAID', dueDate: new Date('2026-02-02'), paidAt: new Date('2026-02-03') },
      { tenantId: tenant1.id, jobId: job2.id, quoteId: quote5.id, invoiceNumber: 'INV-MAT-002', milestone: 'MATERIALS_50', amount: 19000, gstAmount: 1727.27, totalIncGst: 19000, status: 'SENT', dueDate: new Date('2026-02-15') },
    ],
  });

  // GST Ledger entries
  await prisma.gSTLedger.createMany({
    data: [
      { tenantId: tenant1.id, invoiceId: (await prisma.invoice.findFirst({ where: { invoiceNumber: 'INV-DEP-001' } }))!.id, gstCollected: 318.18, gstPaid: 0, period: 'Q1', year: 2026 },
      { tenantId: tenant1.id, invoiceId: (await prisma.invoice.findFirst({ where: { invoiceNumber: 'INV-MAT-001' } }))!.id, gstCollected: 1590.91, gstPaid: 0, period: 'Q1', year: 2026 },
      { tenantId: tenant1.id, invoiceId: (await prisma.invoice.findFirst({ where: { invoiceNumber: 'INV-COM-001' } }))!.id, gstCollected: 1272.73, gstPaid: 0, period: 'Q1', year: 2026 },
    ],
  });

  // BAS Return
  await prisma.bASReturn.create({
    data: {
      tenantId: tenant1.id, period: 'Q1', year: 2026,
      gstCollected: 3181.82, gstPaid: 1200, netGst: 1981.82, filed: false,
    },
  });

  // TPAR Records
  await prisma.tPARRecord.createMany({
    data: [
      { tenantId: tenant1.id, contractorName: 'Lysaght Welshpool', abn: '71 902 294 131', abnValid: true, totalPayments: 12500, financialYear: 2026 },
      { tenantId: tenant1.id, contractorName: 'Metroll Canning Vale', abn: '78 961 183 673', abnValid: true, totalPayments: 8300, financialYear: 2026 },
      { tenantId: tenant1.id, contractorName: 'Stramit Malaga', abn: '64 710 276 773', abnValid: true, totalPayments: 5200, financialYear: 2026 },
      { tenantId: tenant1.id, contractorName: 'Stratco', abn: '12 345 678 901', abnValid: false, totalPayments: 3100, financialYear: 2026 },
    ],
  });

  // RFQs to Perth suppliers
  const rfq1 = await prisma.rFQ.create({
    data: {
      tenantId: tenant1.id, jobId: job1.id, title: 'Colorbond Sheets - Fremantle Job',
      supplierName: 'Lysaght Welshpool', supplierContact: 'sales@lysaght.com.au',
      bidAmount: 6345, leadTimeDays: 5, status: 'accepted',
      items: {
        create: [
          { itemName: 'Colorbond Ultra Corrugated Sheet', quantity: 141, unit: 'sheets', unitPrice: 45, totalPrice: 6345 },
        ],
      },
    },
  });

  await prisma.rFQ.create({
    data: {
      tenantId: tenant1.id, jobId: job1.id, title: 'Battens & Insulation - Fremantle Job',
      supplierName: 'Stramit Malaga', supplierContact: 'orders@stramit.com.au',
      bidAmount: 1691.5, leadTimeDays: 3, status: 'quoted',
      items: {
        create: [
          { itemName: 'Topspan 40mm Batten', quantity: 119, unit: 'lineal metres', unitPrice: 8.5, totalPrice: 1011.5 },
          { itemName: 'Anticon 60mm Insulation', quantity: 8, unit: 'rolls', unitPrice: 85, totalPrice: 680 },
        ],
      },
    },
  });

  await prisma.rFQ.create({
    data: {
      tenantId: tenant1.id, jobId: job2.id, title: 'Roofing Materials - Rockingham Job',
      supplierName: 'Metroll Canning Vale', supplierContact: 'sales@metroll.com.au',
      bidAmount: 0, leadTimeDays: 7, status: 'open',
      items: {
        create: [
          { itemName: 'Colorbond Corrugated Sheet', quantity: 120, unit: 'sheets', unitPrice: 32, totalPrice: 3840 },
        ],
      },
    },
  });

  // Purchase Order from accepted RFQ
  await prisma.purchaseOrder.create({
    data: {
      tenantId: tenant1.id, rfqId: rfq1.id, poNumber: 'PO-001',
      supplierName: 'Lysaght Welshpool', totalAmount: 6345, status: 'received',
    },
  });

  // ============================================================
  // Tenant 2 — Swan Valley Roof Restorations (SaaS)
  // ============================================================
  const tenant2 = await prisma.tenant.upsert({
    where: { id: 'tenant-2' },
    update: {},
    create: {
      id: 'tenant-2',
      name: 'Swan Valley Roof Restorations',
      abn: '87 004 419 283',
      builderRegNumber: 'BU67890',
      plumberLicence: null,
      primaryColour: '#10B981',
      subscriptionTier: 'PRO_SAFETY',
      monthlyLeaseFee: 199,
      isWhiteLabel: false,
    },
  });

  const proSafetyModules: Array<'CRM_QUOTING' | 'WHS_SAFETY' | 'EAM_FLEET' | 'PUBLIC_WEBSITE'> = ['CRM_QUOTING', 'WHS_SAFETY', 'EAM_FLEET', 'PUBLIC_WEBSITE'];
  for (const moduleKey of proSafetyModules) {
    await prisma.moduleEntitlement.upsert({
      where: { tenantId_moduleKey: { tenantId: tenant2.id, moduleKey } },
      update: { isEnabled: true },
      create: { tenantId: tenant2.id, moduleKey, isEnabled: true, addOnPrice: 0 },
    });
  }

  await prisma.moduleEntitlement.upsert({
    where: { tenantId_moduleKey: { tenantId: tenant2.id, moduleKey: 'AI_SOCIAL_AGENT' } },
    update: {},
    create: { tenantId: tenant2.id, moduleKey: 'AI_SOCIAL_AGENT', isEnabled: false, addOnPrice: 49 },
  });

  const hashedPassword2 = await (await import('bcrypt')).hash('Demo1234!', 10);
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant2.id, email: 'admin@swanvalley.com.au' } },
    update: { password: hashedPassword2 },
    create: { tenantId: tenant2.id, email: 'admin@swanvalley.com.au', name: 'Dave Brown', role: 'admin', password: hashedPassword2 },
  });

  // Tenant 2 crew
  await prisma.crewMember.create({
    data: { tenantId: tenant2.id, firstName: 'Dave', lastName: 'Brown', role: 'Owner/Operator', hireDate: new Date('2022-06-01'), hourlyRate: 55 },
  });

  // Tenant 2 leads
  await prisma.lead.createMany({
    data: [
      { tenantId: tenant2.id, firstName: 'Peter', lastName: 'Smith', suburb: 'Midland', status: 'NEW', estimatedValue: 15000, source: 'Website' },
      { tenantId: tenant2.id, firstName: 'Jane', lastName: 'Doe', suburb: 'Swan Valley', status: 'CONTACTED', estimatedValue: 22000, source: 'Referral' },
    ],
  });

  // Tenant 1 WHS & SWMS (Working at Heights) sample
  const project1 = await prisma.project.create({
    data: {
      tenantId: tenant1.id,
      name: 'Fremantle Re-roof',
      customerName: 'James Wilson',
      customerEmail: 'james@example.com',
      address: '12 Beach St',
      suburb: 'Fremantle',
      state: 'WA',
      postcode: '6160',
      status: 'IN_PROGRESS',
      coastalZone: true,
      pitchDegrees: 22,
      planArea: 180,
      notes: 'Working at heights SWMS required',
    },
  });
  await prisma.whsSwmsDocument.create({
    data: {
      tenantId: tenant1.id,
      projectId: project1.id,
      title: 'Working at Heights SWMS — Fremantle Re-roof',
      roofHeight: 6.5,
      edgeProtectionRequired: true,
      edgeProtectionVerified: true,
      harnessInspectionVerified: true,
      fragileRoofIdentified: true,
      weatherAssessed: true,
      exclusionZonesSet: true,
      emergencyRescuePlan: true,
      hazardNotes: 'Fragile skylights on north face; edge protection installed.',
      controlMeasures: 'Harness + anchor points; buddy system; exclusion zone 3m.',
      status: 'SIGNED_OFF',
      signedAt: new Date(),
      signOffs: {
        create: [
          {
            tenantId: tenant1.id,
            guestName: 'John Smith',
            tradeLicense: 'WC-12345',
            signatureDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            signedAt: new Date(),
          },
        ],
      },
    },
  });

  // Tenant 2 stock
  await prisma.stockItem.createMany({
    data: [
      { tenantId: tenant2.id, sku: 'CB-CORR-3.0', name: 'Colorbond Corrugated 3.0m', location: 'WELSHPOOL_MAIN_YARD', quantityOnHand: 20, quantityReserved: 5, reorderPoint: 10, unitCost: 32, supplier: 'Lysaght Welshpool' },
      { tenantId: tenant2.id, sku: 'SCREW-12G', name: '12g x 65mm Crest Screws', location: 'HILUX_UTE_1', quantityOnHand: 2000, quantityReserved: 500, reorderPoint: 1000, unitCost: 0.65, supplier: 'Stratco' },
    ],
  });

  console.log('✅ Seed complete');
  console.log(`   Tenant 1: ${tenant1.name} — 10 modules, 10 leads, 5 quotes, 3 jobs, 5 invoices, 3 RFQs, 6 stock items`);
  console.log(`   Tenant 2: ${tenant2.name} — 4 modules + 1 locked add-on, 2 leads, 2 stock items`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
