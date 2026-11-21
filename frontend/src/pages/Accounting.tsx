"use client";

import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { FeatureGate } from "../components/FeatureGate";
import { useToast } from "../components/Toast";
import {
  CreditCard,
  FileText,
  BarChart3,
  FileCheck,
  Plus,
  RefreshCw,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { generateWarrantyCertificate, generateBASReport, generateTPARCSV, generateInvoicePDF, generateABABankFile } from "../utils/documentGenerator";
import { DataTable, type Column } from "../components/DataTable";

export default function Accounting() {
  const toast = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [tab, setTab] = useState("invoices");
  const [basData, setBasData] = useState<any>(null);
  const [basPeriod, setBasPeriod] = useState("Q1");
  const [basYear, setBasYear] = useState("2026");
  const [tparRecords, setTparRecords] = useState<any[]>([]);
  const [newContractor, setNewContractor] = useState({ name: "", abn: "", payments: "", year: "2026" });
  const [abnCheck, setAbnCheck] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (tab === "bas") loadBAS();
    if (tab === "tpar") loadTPAR();
  }, [tab, basPeriod, basYear]);

  const loadTPAR = async () => {
    try {
      const data = await api.getTPAR();
      setTparRecords(data);
    } catch {
      setTparRecords([]);
    }
  };

  const checkABN = async (abn: string) => {
    setAbnCheck(null);
    if (abn.replace(/\s/g, "").length !== 11) return;
    try {
      const result = await api.validateABN(abn);
      setAbnCheck(result);
    } catch {
      setAbnCheck(null);
    }
  };

  const addContractor = async () => {
    if (!newContractor.name || !newContractor.abn || !newContractor.payments) return;
    try {
      await api.createTPAR({
        contractorName: newContractor.name,
        abn: newContractor.abn,
        totalPayments: newContractor.payments,
        financialYear: newContractor.year,
      });
      setNewContractor({ name: "", abn: "", payments: "", year: "2026" });
      setAbnCheck(null);
      loadTPAR();
    } catch (err: any) {
      toast.error(err.message || "Failed to add contractor");
    }
  };

  const loadBAS = async () => {
    try {
      const data = await api.computeBAS(basPeriod, basYear);
      setBasData(data);
    } catch {
      setBasData({
        period: basPeriod,
        year: parseInt(basYear),
        gstCollected: 3181.82,
        gstPaid: 1200,
        netGst: 1981.82,
        totalSales: 35000,
        totalPurchases: 12000,
        invoiceCount: 5,
        ledgerEntries: 3,
      });
    }
  };

  const loadData = async () => {
    try {
      const data = await api.getInvoices();
      setInvoices(data);
    } catch {
      setInvoices([
        { id: "1", invoiceNumber: "INV-DEP-001", milestone: "DEPOSIT_10", amount: 3500, gstAmount: 318.18, totalIncGst: 3500, status: "PAID", dueDate: "2026-01-15", createdAt: "2026-01-10" },
        { id: "2", invoiceNumber: "INV-MAT-001", milestone: "MATERIALS_50", amount: 17500, gstAmount: 1590.91, totalIncGst: 17500, status: "SENT", dueDate: "2026-02-01", createdAt: "2026-01-20" },
        { id: "3", invoiceNumber: "INV-COM-001", milestone: "COMPLETION_40", amount: 14000, gstAmount: 1272.73, totalIncGst: 14000, status: "DRAFT", dueDate: null, createdAt: "2026-02-01" },
      ]);
    }
  };

  const milestoneLabels: Record<string, string> = {
    DEPOSIT_10: "10% Deposit",
    MATERIALS_50: "50% Materials",
    COMPLETION_40: "40% Completion",
  };

  const statusColors: Record<string, string> = {
    DRAFT: "#64748B",
    SENT: "#0EA5E9",
    PAID: "#10B981",
    OVERDUE: "#EF4444",
    CANCELLED: "#94A3B8",
  };

  const invoiceColumns: Column<any>[] = [
    { key: "invoiceNumber", header: "Invoice #", render: (r) => <span className="font-mono">{r.invoiceNumber}</span> },
    { key: "milestone", header: "Milestone", render: (r) => milestoneLabels[r.milestone || ""] || "—" },
    { key: "amount", header: "Amount", render: (r) => `$${Number(r.amount || 0).toLocaleString()}`, sortValue: (r) => Number(r.amount || 0) },
    { key: "gstAmount", header: "GST", render: (r) => `$${Number(r.gstAmount || 0).toLocaleString()}`, sortValue: (r) => Number(r.gstAmount || 0) },
    { key: "totalIncGst", header: "Total (inc GST)", render: (r) => <span className="font-bold">${Number(r.totalIncGst || 0).toLocaleString()}</span>, sortValue: (r) => Number(r.totalIncGst || 0) },
    {
      key: "status", header: "Status",
      render: (r) => (
        <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: `${statusColors[r.status] || "#64748B"}22`, color: statusColors[r.status] || "#64748B" }}>
          {r.status}
        </span>
      ),
    },
    { key: "dueDate", header: "Due Date", render: (r) => r.dueDate || "—" },
    {
      key: "actions", header: "Actions", sortable: false,
      render: (r) => (
        <div className="flex items-center gap-2">
          {r.status === "DRAFT" && <button className="text-xs text-[#0EA5E9] hover:underline">Send</button>}
          {r.status === "SENT" && <button className="text-xs text-[#10B981] hover:underline">Mark Paid</button>}
          <button
            onClick={() => generateInvoicePDF({
              tenantName: "Perth Premier Roofing & Plumbing Pty Ltd",
              tenantABN: "51 004 395 174",
              invoiceNumber: r.invoiceNumber,
              milestone: r.milestone || "DEPOSIT_10",
              customerName: r.quote?.customerName || "Customer",
              customerAddress: r.quote?.customerAddress || "",
              amount: Number(r.amount) || 0,
              gstAmount: Number(r.gstAmount) || 0,
              totalIncGst: Number(r.totalIncGst) || 0,
              dueDate: r.dueDate || "",
              status: r.status,
            })}
            className="text-xs text-[#94A3B8] hover:text-[#F8FAFC] flex items-center gap-1"
          >
            <Download className="w-3 h-3" /> PDF
          </button>
          {r.milestone === "COMPLETION_40" && (
            <button
              onClick={() => generateWarrantyCertificate({
                tenantName: "Perth Premier Roofing & Plumbing Pty Ltd",
                tenantABN: "51 004 395 174",
                tenantColour: "#0EA5E9",
                jobNumber: r.job?.jobNumber || "JOB-001",
                customerName: r.quote?.customerName || "Customer",
                customerAddress: r.quote?.customerAddress || "",
                customerSuburb: r.quote?.customerSuburb || "Perth",
                roofType: "Colorbond Corrugated",
                completionDate: new Date().toLocaleDateString("en-AU"),
                warrantyYears: 10,
                bluescopeWarranty: true,
              })}
              className="text-xs text-[#10B981] hover:underline flex items-center gap-1"
            >
              <FileCheck className="w-3 h-3" /> Warranty
            </button>
          )}
        </div>
      ),
    },
  ];

  const totalRevenue = invoices.reduce(
    (sum, inv) => sum + (inv.status === "PAID" ? Number(inv.totalIncGst) || 0 : 0),
    0
  );
  const totalOutstanding = invoices.reduce(
    (sum, inv) => sum + (inv.status !== "PAID" ? Number(inv.totalIncGst) || 0 : 0),
    0
  );

  return (
    <FeatureGate moduleKey="ACCOUNTING">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F8FAFC]">Accounting & Progress Claims</h1>
            <p className="text-[#94A3B8]">Milestone invoicing, GST ledger, BAS & TPAR reporting</p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg hover:bg-[#38BDF8] transition"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Total Revenue (Paid)" value={`$${totalRevenue.toLocaleString()}`} color="#10B981" icon={<FileCheck className="w-5 h-5" />} />
          <StatCard title="Outstanding" value={`$${totalOutstanding.toLocaleString()}`} color="#F59E0B" icon={<ClockIcon className="w-5 h-5" />} />
          <StatCard title="Total Invoices" value={invoices.length} color="#0EA5E9" icon={<FileText className="w-5 h-5" />} />
          <StatCard title="GST Collected (est.)" value={`$${Math.round(totalRevenue / 11).toLocaleString()}`} color="#8B5CF6" icon={<BarChart3 className="w-5 h-5" />} />
        </div>

        <div className="flex gap-2 mb-4">
          {["invoices", "gst", "bas", "tpar"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t ? "bg-[#0EA5E9] text-[#0F172A]" : "bg-[#1E293B] text-[#94A3B8] border border-[#334155] hover:text-[#F8FAFC]"}`}
            >
              {t === "invoices" ? "Invoices" : t === "gst" ? "GST Ledger" : t === "bas" ? "BAS Returns" : "TPAR"}
            </button>
          ))}
        </div>

        {tab === "invoices" && (
          <DataTable
            data={invoices}
            columns={invoiceColumns}
            searchFields={["invoiceNumber", "status", "milestone"]}
            pageSize={8}
            emptyMessage="No invoices found"
          />
        )}

        {tab === "gst" && (
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
            <h3 className="text-sm font-bold text-[#F8FAFC] mb-4">GST Ledger (10%)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#0F172A] p-4 rounded border border-[#334155]">
                <p className="text-xs text-[#64748B]">GST Collected</p>
                <p className="text-xl font-bold text-[#10B981]">$4,500.00</p>
              </div>
              <div className="bg-[#0F172A] p-4 rounded border border-[#334155]">
                <p className="text-xs text-[#64748B]">GST Paid</p>
                <p className="text-xl font-bold text-[#F59E0B]">$2,100.00</p>
              </div>
              <div className="bg-[#0F172A] p-4 rounded border border-[#334155]">
                <p className="text-xs text-[#64748B]">Net GST Payable</p>
                <p className="text-xl font-bold text-[#F59E0B]">$2,400.00</p>
              </div>
              <div className="bg-[#0F172A] p-4 rounded border border-[#334155]">
                <p className="text-xs text-[#64748B]">BAS Period</p>
                <p className="text-xl font-bold text-[#0EA5E9]">Q1 2026</p>
              </div>
            </div>
          </div>
        )}

        {tab === "bas" && (
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <h3 className="text-sm font-bold text-[#F8FAFC]">Quarterly BAS Summary</h3>
              <div className="flex gap-2">
                <select
                  value={basPeriod}
                  onChange={(e) => setBasPeriod(e.target.value)}
                  className="px-3 py-1.5 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] text-sm focus:ring-2 focus:ring-[#0EA5E9]"
                >
                  {["Q1", "Q2", "Q3", "Q4"].map((q) => <option key={q} value={q}>{q}</option>)}
                </select>
                <input
                  type="number"
                  value={basYear}
                  onChange={(e) => setBasYear(e.target.value)}
                  className="w-20 px-3 py-1.5 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] text-sm focus:ring-2 focus:ring-[#0EA5E9]"
                />
                <button
                  onClick={loadBAS}
                  className="px-3 py-1.5 bg-[#1E293B] border border-[#334155] text-[#94A3B8] rounded-lg text-sm hover:text-[#F8FAFC] transition"
                >
                  Refresh
                </button>
              </div>
            </div>
            <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#64748B]">GST on Sales (1A)</p>
                  <p className="text-[#F8FAFC] font-bold">${(basData?.gstCollected || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[#64748B]">GST on Purchases (1B)</p>
                  <p className="text-[#F8FAFC] font-bold">${(basData?.gstPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[#64748B]">Net GST Payable</p>
                  <p className="text-[#10B981] font-bold">${(basData?.netGst || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[#64748B]">Total Sales</p>
                  <p className="text-[#F8FAFC] font-bold">${(basData?.totalSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[#64748B]">Invoices Included</p>
                  <p className="text-[#F8FAFC] font-bold">{basData?.invoiceCount || 0}</p>
                </div>
                <div>
                  <p className="text-[#64748B]">Ledger Entries</p>
                  <p className="text-[#F8FAFC] font-bold">{basData?.ledgerEntries || 0}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={async () => {
                    try {
                      await api.createBASReturn({
                        period: basPeriod,
                        year: basYear,
                        gstCollected: basData.gstCollected,
                        gstPaid: basData.gstPaid,
                      });
                      await loadBAS();
                    } catch (err: any) {
                      toast.error(err.message || "Failed to create BAS return");
                    }
                  }}
                  className="px-4 py-2 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg hover:bg-[#38BDF8] transition"
                >
                  Lodge BAS
                </button>
                <button
                  onClick={() => generateBASReport({
                    tenantName: "Perth Premier Roofing & Plumbing Pty Ltd",
                    period: basPeriod,
                    year: parseInt(basYear),
                    gstCollected: basData?.gstCollected || 0,
                    gstPaid: basData?.gstPaid || 0,
                    netGst: basData?.netGst || 0,
                    filed: false,
                  })}
                  className="px-4 py-2 bg-[#1E293B] border border-[#334155] text-[#94A3B8] rounded-lg hover:text-[#F8FAFC] transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Export PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "tpar" && (
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
            <h3 className="text-sm font-bold text-[#F8FAFC] mb-4">TPAR - Taxable Payments Annual Report</h3>

            {/* Add Contractor Form with live ABN validation */}
            <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-4 mb-4">
              <h4 className="text-xs font-bold text-[#94A3B8] mb-3">Add Contractor (ABN verified via ATO checksum)</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  value={newContractor.name}
                  onChange={(e) => setNewContractor({ ...newContractor, name: e.target.value })}
                  placeholder="Contractor name"
                  className="px-3 py-2 bg-[#1E293B] border border-[#334155] rounded-lg text-[#F8FAFC] text-sm focus:ring-2 focus:ring-[#0EA5E9]"
                />
                <div>
                  <input
                    value={newContractor.abn}
                    onChange={(e) => {
                      setNewContractor({ ...newContractor, abn: e.target.value });
                      checkABN(e.target.value);
                    }}
                    placeholder="ABN (11 digits)"
                    className="w-full px-3 py-2 bg-[#1E293B] border border-[#334155] rounded-lg text-[#F8FAFC] text-sm focus:ring-2 focus:ring-[#0EA5E9]"
                  />
                  {abnCheck && (
                    <p className={`text-xs mt-1 ${abnCheck.isValid ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                      {abnCheck.isValid ? "✓ " : "✗ "}{abnCheck.message}
                      {abnCheck.entityName ? ` — ${abnCheck.entityName}` : ""}
                    </p>
                  )}
                </div>
                <input
                  type="number"
                  value={newContractor.payments}
                  onChange={(e) => setNewContractor({ ...newContractor, payments: e.target.value })}
                  placeholder="Total payments"
                  className="px-3 py-2 bg-[#1E293B] border border-[#334155] rounded-lg text-[#F8FAFC] text-sm focus:ring-2 focus:ring-[#0EA5E9]"
                />
                <button
                  onClick={addContractor}
                  className="px-4 py-2 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg text-sm hover:bg-[#38BDF8] transition"
                >
                  Add Contractor
                </button>
              </div>
            </div>

            <div className="bg-[#0F172A] border border-[#334155] rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-[#0F172A]/50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Contractor</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">ABN</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">ABN Valid</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Total Payments</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Financial Year</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tparRecords.map((r) => (
                    <tr key={r.id} className="border-b border-[#1E293B]/30">
                      <td className="px-4 py-3 text-sm text-[#F8FAFC]">{r.contractorName}</td>
                      <td className="px-4 py-3 text-sm text-[#94A3B8] font-mono">{r.abn}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={r.abnValid ? "text-[#10B981]" : "text-[#EF4444]"}>
                          {r.abnValid ? "✓ Valid" : "✗ Invalid"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#94A3B8]">${Number(r.totalPayments).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-sm text-[#94A3B8]">{r.financialYear}</td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={async () => { await api.deleteTPAR(r.id); loadTPAR(); }}
                          className="text-xs text-[#EF4444] hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {tparRecords.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-[#64748B]">No contractors registered</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => generateTPARCSV(tparRecords.map((r) => ({
                contractorName: r.contractorName,
                abn: r.abn,
                abnValid: r.abnValid,
                totalPayments: Number(r.totalPayments),
                financialYear: r.financialYear,
              })))}
              className="mt-4 px-4 py-2 bg-[#1E293B] border border-[#334155] text-[#94A3B8] rounded-lg hover:text-[#F8FAFC] transition flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export CSV
            </button>
          </div>
        )}
      </div>
    </FeatureGate>
  );
}

function StatCard({ title, value, color, icon }: { title: string; value: string | number; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-[#64748B] font-medium uppercase">{title}</p>
        <div className={`w-9 h-9 rounded-lg bg-[${color}]/10 flex items-center justify-center text-[${color}]`}>{icon}</div>
      </div>
      <p className="text-xl font-bold text-[#F8FAFC]">{value}</p>
    </div>
  );
}

const ClockIcon = (props: any) => (
  <svg {...props} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
