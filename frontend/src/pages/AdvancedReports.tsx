"use client";

import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { FeatureGate } from "../components/FeatureGate";
import { generateReportCSV, generateProfitLossReport, generateJobSummaryReport, generateStockMovementReport, generateCrewPerformanceReport } from "../utils/advancedReporting";
import { BarChart3, Download, FileSpreadsheet, TrendingUp, Package, Users, DollarSign } from "lucide-react";

export default function AdvancedReports() {
  const [reportType, setReportType] = useState("profit_loss");
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [jobs, setJobs] = useState<Array<Record<string, unknown>>>([]);
  const [stockItems, setStockItems] = useState<Array<Record<string, unknown>>>([]);
  const [crew, setCrew] = useState<Array<Record<string, unknown>>>([]);
  const [reportData, setReportData] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [j, s, c] = await Promise.all([
        api.getJobs(),
        api.getStockItems(),
        api.getCrew(),
      ]);
      setJobs(j);
      setStockItems(s);
      setCrew(c);
    } catch {
      setJobs([]);
      setStockItems([]);
      setCrew([]);
    }
  };

  const generateReport = () => {
    let data: Array<Record<string, unknown>> = [];
    switch (reportType) {
      case "profit_loss":
        data = generateProfitLossReport(jobs);
        break;
      case "job_summary":
        data = generateJobSummaryReport(jobs);
        break;
      case "stock_movement":
        data = generateStockMovementReport(stockItems);
        break;
      case "crew_performance":
        data = generateCrewPerformanceReport(crew);
        break;
    }
    setReportData(data);
  };

  const exportCSV = () => {
    if (reportData.length === 0) return;
    generateReportCSV({ startDate, endDate, reportType: reportType as any }, reportData as any);
  };

  const reportTypes = [
    { key: "profit_loss", label: "Profit & Loss by Job Type", icon: DollarSign },
    { key: "job_summary", label: "Job Summary Report", icon: TrendingUp },
    { key: "stock_movement", label: "Stock Movement Report", icon: Package },
    { key: "crew_performance", label: "Crew Performance Report", icon: Users },
  ];

  return (
    <FeatureGate moduleKey="BI_EXECUTIVE">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F8FAFC]">Advanced Reports</h1>
            <p className="text-[#94A3B8]">Custom date range reports with Excel/CSV export</p>
          </div>
        </div>

        {/* Report Configuration */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
          <h3 className="text-sm font-bold text-[#F8FAFC] mb-4">Report Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]"
              >
                {reportTypes.map((rt) => (
                  <option key={rt.key} value={rt.key}>{rt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={generateReport}
                className="flex-1 py-2 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg hover:bg-[#38BDF8] transition"
              >
                Generate
              </button>
              <button
                onClick={exportCSV}
                disabled={reportData.length === 0}
                className="px-3 py-2 bg-[#1E293B] border border-[#334155] text-[#94A3B8] rounded-lg hover:text-[#F8FAFC] disabled:opacity-50 transition"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Report Results */}
        {reportData.length > 0 && (
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#0F172A]/50">
                  <tr>
                    {Object.keys(reportData[0]).map((header) => (
                      <th key={header} className="px-4 py-3 text-xs font-bold text-[#94A3B8]">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, i) => (
                    <tr key={i} className="border-b border-[#1E293B]/30">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-4 py-3 text-sm text-[#F8FAFC]">
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-[#334155] flex justify-between items-center">
              <span className="text-xs text-[#64748B]">{reportData.length} rows</span>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg hover:bg-[#38BDF8] transition text-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export to CSV
              </button>
            </div>
          </div>
        )}

        {reportData.length === 0 && (
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-8 text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-[#64748B]" />
            <p className="text-[#94A3B8]">Select a report type and click "Generate" to view results.</p>
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
