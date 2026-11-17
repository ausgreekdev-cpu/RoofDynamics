/**
 * RoofDynamics - Document Generator
 * Generates PDFs, CSVs, and .ABA bank files for compliance and accounting.
 */

import { jsPDF } from "jspdf";

// ============================================================
// 10-Year Warranty Certificate PDF
// ============================================================
export function generateWarrantyCertificate(data: {
  tenantName: string;
  tenantABN: string;
  tenantColour: string;
  jobNumber: string;
  customerName: string;
  customerAddress: string;
  customerSuburb: string;
  roofType: string;
  completionDate: string;
  warrantyYears: number;
  bluescopeWarranty: boolean;
}) {
  const doc = new jsPDF();
  const { tenantName, tenantABN, tenantColour, jobNumber, customerName, customerAddress, customerSuburb, roofType, completionDate, warrantyYears, bluescopeWarranty } = data;

  // Header
  doc.setFillColor(14, 165, 233); // #0EA5E9
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("ROOFDYNAMICS", 105, 18, { align: "center" });
  doc.setFontSize(12);
  doc.text("10-Year Workmanship & Bluescope Warranty Certificate", 105, 28, { align: "center" });
  doc.setFontSize(9);
  doc.text("Powered by AusGreek Developments", 105, 35, { align: "center" });

  // Tenant info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let y = 50;
  doc.text(`Issued by: ${tenantName}`, 20, y);
  y += 6;
  doc.text(`ABN: ${tenantABN}`, 20, y);
  y += 12;

  // Certificate body
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("WARRANTY CERTIFICATE", 105, y, { align: "center" });
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const lines = [
    `This certificate confirms that the roofing work completed at the property listed below`,
    `is covered by a ${warrantyYears}-year workmanship warranty from the date of completion.`,
    ``,
    `Job Number: ${jobNumber}`,
    `Customer: ${customerName}`,
    `Property Address: ${customerAddress}, ${customerSuburb}, WA`,
    `Roof Type: ${roofType}`,
    `Completion Date: ${completionDate}`,
    `Warranty Period: ${warrantyYears} years from completion date`,
    ``,
    `This warranty covers defects in workmanship and installation for the specified period.`,
    `Materials are covered by the manufacturer's warranty (Bluescope Steel) where applicable.`,
  ];

  lines.forEach((line) => {
    doc.text(line, 20, y);
    y += 6;
  });

  y += 6;
  if (bluescopeWarranty) {
    doc.setFillColor(16, 185, 129); // #10B981
    doc.rect(20, y - 4, 170, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("✓ Bluescope Steel Warranty Included", 105, y + 1, { align: "center" });
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    y += 12;
  }

  // Terms
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Terms & Conditions:", 20, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  const terms = [
    "1. Warranty covers workmanship defects only, not material failure covered by manufacturer.",
    "2. Warranty is void if roof is modified by unauthorised parties.",
    "3. Regular maintenance required to maintain warranty validity.",
    "4. Claims must be submitted in writing within 30 days of defect discovery.",
    "5. Warranty is transferable to new property owner with written notification.",
  ];
  terms.forEach((term) => {
    doc.text(term, 20, y);
    y += 5;
  });

  // Footer
  y = 270;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("RoofDynamics — Powered by AusGreek Developments", 105, y, { align: "center" });
  doc.text(`Generated: ${new Date().toLocaleDateString("en-AU")}`, 105, y + 5, { align: "center" });

  doc.save(`Warranty-Certificate-${jobNumber}.pdf`);
}

// ============================================================
// .ABA Bank File Generator
// ============================================================
export function generateABABankFile(data: {
  bsb: string;
  accountNumber: string;
  accountName: string;
  payments: Array<{
    bsb: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    reference: string;
  }>;
}) {
  const { bsb, accountNumber, accountName, payments } = data;

  const lines: string[] = [];

  // Header record (type 0)
  const header = [
    "0", // record type
    " " , // blank
    bsb.replace(/-/g, ""), // BSB (6 digits)
    accountNumber.padStart(9, " "), // account number (9 chars)
    " " , // indicator (space for credit)
    accountName.substring(0, 26).padEnd(26, " "), // account name
    " " , // blank
    " " , // blank
    new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "2-digit" }).replace(/\//g, ""), // processing date DDMMYY
    " " , // blank
    " " , // blank
    " " , // blank
    " " , // blank
    " " , // blank
    " " , // blank
    " " , // blank
    "1", // file credit indicator
  ].join("");
  lines.push(header);

  // Detail records (type 1)
  let totalAmount = 0;
  payments.forEach((payment) => {
    const amount = Math.round(payment.amount * 100); // cents
    totalAmount += amount;
    const detail = [
      "1", // record type
      payment.bsb.replace(/-/g, ""), // BSB (6 digits)
      payment.accountNumber.padStart(9, " "), // account number
      " " , // indicator
      payment.accountName.substring(0, 32).padEnd(32, " "), // account name
      String(amount).padStart(10, "0"), // amount in cents
      payment.reference.substring(0, 18).padEnd(18, " "), // reference
      "00000000", // trace BSB
      "0000000", // trace account
      " " , // remitter name indicator
      " " , // blank
      " " , // blank
    ].join("");
    lines.push(detail);
  });

  // Footer record (type 7)
  const footer = [
    "7", // record type
    "999-999", // BSB
    " " .repeat(9), // account number
    " " , // indicator
    " " .repeat(26), // account name
    String(totalAmount).padStart(10, "0"), // total amount
    String(payments.length).padStart(6, "0"), // record count
    " " .repeat(12), // blank
    " " , // blank
  ].join("");
  lines.push(footer);

  const content = lines.join("\r\n");
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payroll-${new Date().toISOString().split("T")[0]}.aba`;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// BAS Report PDF
// ============================================================
export function generateBASReport(data: {
  tenantName: string;
  period: string;
  year: number;
  gstCollected: number;
  gstPaid: number;
  netGst: number;
  filed: boolean;
}) {
  const doc = new jsPDF();
  const { tenantName, period, year, gstCollected, gstPaid, netGst, filed } = data;

  doc.setFillColor(14, 165, 233);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("BAS Summary Report", 105, 15, { align: "center" });
  doc.setFontSize(10);
  doc.text(`${tenantName} — ${period} ${year}`, 105, 23, { align: "center" });

  let y = 45;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Quarterly Business Activity Statement", 20, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const rows = [
    ["GST on Sales (1A)", `$${gstCollected.toFixed(2)}`],
    ["GST on Purchases (1B)", `$${gstPaid.toFixed(2)}`],
    ["Net GST Payable (1A - 1B)", `$${netGst.toFixed(2)}`],
    ["Status", filed ? "Filed" : "Not Filed"],
  ];

  rows.forEach(([label, value]) => {
    doc.text(label, 20, y);
    doc.text(value, 150, y);
    y += 8;
  });

  y += 10;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("RoofDynamics — Powered by AusGreek Developments", 105, 270, { align: "center" });
  doc.text(`Generated: ${new Date().toLocaleDateString("en-AU")}`, 105, 275, { align: "center" });

  doc.save(`BAS-${period}-${year}.pdf`);
}

// ============================================================
// TPAR CSV Export
// ============================================================
export function generateTPARCSV(data: Array<{
  contractorName: string;
  abn: string;
  abnValid: boolean;
  totalPayments: number;
  financialYear: number;
}>) {
  const headers = ["Contractor Name", "ABN", "ABN Valid", "Total Payments", "Financial Year"];
  const rows = data.map((r) => [
    r.contractorName,
    r.abn,
    r.abnValid ? "Yes" : "No",
    r.totalPayments.toFixed(2),
    r.financialYear.toString(),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `TPAR-${new Date().getFullYear()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// SWMS PDF with Digital Signature
// ============================================================
export function generateSWMSDocument(data: {
  tenantName: string;
  jobTitle: string;
  roofHeight: number;
  edgeProtectionRequired: boolean;
  edgeProtectionVerified: boolean;
  fallingFromHeightsSigned: boolean;
  signedBy?: string;
  signedAt?: string;
  asbestosRemoval: boolean;
  asbestosLicenceNumber?: string;
  workSafeNotificationDate?: string;
  tipReceiptUrl?: string;
  hazardChecklist: string[];
  harnessSerial?: string;
}) {
  const doc = new jsPDF();
  const { tenantName, jobTitle, roofHeight, edgeProtectionRequired, edgeProtectionVerified, fallingFromHeightsSigned, signedBy, signedAt, asbestosRemoval, asbestosLicenceNumber, workSafeNotificationDate, tipReceiptUrl, hazardChecklist, harnessSerial } = data;

  doc.setFillColor(14, 165, 233);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("SAFE WORK METHOD STATEMENT (SWMS)", 105, 15, { align: "center" });
  doc.setFontSize(10);
  doc.text(`${tenantName} — ${jobTitle}`, 105, 23, { align: "center" });

  let y = 40;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  doc.text(`Roof Height: ${roofHeight}m`, 20, y); y += 6;
  doc.text(`Edge Protection Required: ${edgeProtectionRequired ? "Yes" : "No"}`, 20, y); y += 6;
  doc.text(`Edge Protection Verified: ${edgeProtectionVerified ? "Yes" : "No"}`, 20, y); y += 6;
  doc.text(`Falling from Heights SWMS Signed: ${fallingFromHeightsSigned ? "Yes" : "No"}`, 20, y); y += 6;
  if (signedBy) {
    doc.text(`Signed By: ${signedBy}`, 20, y); y += 6;
  }
  if (signedAt) {
    doc.text(`Signed At: ${signedAt}`, 20, y); y += 6;
  }
  if (harnessSerial) {
    doc.text(`Harness Serial: ${harnessSerial}`, 20, y); y += 6;
  }

  y += 4;
  if (asbestosRemoval) {
    doc.setFillColor(245, 158, 11); // #F59E0B
    doc.rect(20, y - 4, 170, 8, "F");
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("⚠ ASBESTOS REMOVAL WORK", 105, y + 1, { align: "center" });
    y += 10;
    doc.setFont("helvetica", "normal");
    doc.text(`Asbestos Licence: ${asbestosLicenceNumber || "NOT PROVIDED"}`, 20, y); y += 6;
    doc.text(`WorkSafe Notification: ${workSafeNotificationDate || "NOT SUBMITTED"}`, 20, y); y += 6;
    doc.text(`Tip Receipt: ${tipReceiptUrl || "NOT UPLOADED"}`, 20, y); y += 6;
  }

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Pre-Start Hazard Checklist:", 20, y); y += 6;
  doc.setFont("helvetica", "normal");
  hazardChecklist.forEach((item) => {
    doc.text(`☐ ${item}`, 25, y); y += 5;
  });

  // Signature line
  y += 10;
  doc.line(20, y, 100, y);
  doc.setFontSize(8);
  doc.text("Signature", 20, y + 4);
  doc.text(`Date: ${new Date().toLocaleDateString("en-AU")}`, 120, y + 4);

  y = 270;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("RoofDynamics — Powered by AusGreek Developments", 105, y, { align: "center" });

  doc.save(`SWMS-${jobTitle.replace(/\s+/g, "-")}.pdf`);
}

// ============================================================
// Progress Claim Invoice PDF
// ============================================================
export function generateInvoicePDF(data: {
  tenantName: string;
  tenantABN: string;
  invoiceNumber: string;
  milestone: string;
  customerName: string;
  customerAddress: string;
  amount: number;
  gstAmount: number;
  totalIncGst: number;
  dueDate: string;
  status: string;
}) {
  const doc = new jsPDF();
  const { tenantName, tenantABN, invoiceNumber, milestone, customerName, customerAddress, amount, gstAmount, totalIncGst, dueDate, status } = data;

  const milestoneLabels: Record<string, string> = {
    DEPOSIT_10: "10% Deposit",
    MATERIALS_50: "50% Materials on Site",
    COMPLETION_40: "40% Completion",
  };

  doc.setFillColor(14, 165, 233);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", 105, 15, { align: "center" });
  doc.setFontSize(10);
  doc.text(`${tenantName} — ${invoiceNumber}`, 105, 23, { align: "center" });

  let y = 40;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  doc.text(`From: ${tenantName}`, 20, y); y += 6;
  doc.text(`ABN: ${tenantABN}`, 20, y); y += 6;
  doc.text(`Invoice: ${invoiceNumber}`, 20, y); y += 6;
  doc.text(`Milestone: ${milestoneLabels[milestone] || milestone}`, 20, y); y += 6;
  doc.text(`Status: ${status}`, 20, y); y += 10;

  doc.text(`To: ${customerName}`, 20, y); y += 6;
  doc.text(`Address: ${customerAddress}`, 20, y); y += 6;
  doc.text(`Due Date: ${dueDate}`, 20, y); y += 12;

  // Line items table
  doc.setFont("helvetica", "bold");
  doc.text("Description", 20, y);
  doc.text("Amount (ex GST)", 120, y);
  doc.text("GST", 160, y);
  doc.text("Total", 185, y);
  y += 6;
  doc.line(20, y, 190, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.text(milestoneLabels[milestone] || milestone, 20, y);
  doc.text(`$${amount.toFixed(2)}`, 120, y);
  doc.text(`$${gstAmount.toFixed(2)}`, 160, y);
  doc.text(`$${totalIncGst.toFixed(2)}`, 185, y);
  y += 10;

  doc.line(20, y, 190, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Total (inc GST)", 20, y);
  doc.text(`$${totalIncGst.toFixed(2)}`, 185, y);

  y = 270;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("RoofDynamics — Powered by AusGreek Developments", 105, y, { align: "center" });

  doc.save(`Invoice-${invoiceNumber}.pdf`);
}
