"use client";

import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { FeatureGate } from "../components/FeatureGate";
import { generateABABankFile } from "../utils/documentGenerator";
import {
  Users,
  Clock,
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Search,
  Plus,
  Download,
} from "lucide-react";

export default function OperationsHRIS() {
  const [crew, setCrew] = useState<any[]>([]);
  const [hris, setHRIS] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [rosterView, setRosterView] = useState<"list" | "calendar">("list");
  const [weather, setWeather] = useState({ temp: 18, windSpeed: 25, condition: "Partly Cloudy" });
  const [payrollResult, setPayrollResult] = useState<any>(null);
  const [hoursInput, setHoursInput] = useState<Record<string, number>>({});
  const [calculatingPayroll, setCalculatingPayroll] = useState(false);
  const [payPeriodStart, setPayPeriodStart] = useState(new Date().toISOString().split("T")[0]);
  const [payPeriodEnd, setPayPeriodEnd] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    loadData();
    fetchWeather();
  }, []);

  const loadData = async () => {
    try {
      const [c, h, j] = await Promise.all([api.getCrew(), api.getHRIS(), api.getJobs()]);
      setCrew(c);
      setHRIS(h);
      setJobs(j);
    } catch {
      setJobs([]);
      setCrew([
        { id: "1", firstName: "John", lastName: "Smith", role: "Crew Lead", hireDate: "2023-01-15", hourlyRate: 45, isActive: true },
        { id: "2", firstName: "Mike", lastName: "Wilson", role: "Roofer", hireDate: "2023-03-10", hourlyRate: 38, isActive: true },
        { id: "3", firstName: "Sarah", lastName: "Davis", role: "Apprentice", hireDate: "2024-01-10", hourlyRate: 28, isActive: true },
      ]);
      setHRIS([
        { id: "1", crewMemberId: "1", whiteCardNumber: "WC-12345", whiteCardExpiry: "2026-12-01", workingAtHeightsCert: "WAH-678", plumbingLicence: "", builderReg: "", kpiRating: 4.8 },
        { id: "2", crewMemberId: "2", whiteCardNumber: "WC-12346", whiteCardExpiry: "2025-06-15", workingAtHeightsCert: "WAH-679", plumbingLicence: "PL-999", builderReg: "", kpiRating: 4.5 },
        { id: "3", crewMemberId: "3", whiteCardNumber: "", whiteCardExpiry: "", workingAtHeightsCert: "", plumbingLicence: "", builderReg: "", kpiRating: 3.9 },
      ]);
    }
  };

  const handleCalculatePayroll = async () => {
    setCalculatingPayroll(true);
    try {
      const crewInputs = crew.map((member) => ({
        crewMemberId: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        hourlyRate: member.hourlyRate,
        hoursWorked: hoursInput[member.id] || 40,
        // Apprentices are exempt from the WA MyLeave levy (0%)
        isApprentice: String(member.role || "").toLowerCase().includes("apprentice"),
      }));

      const result = await api.calculatePayroll({
        crewInputs,
        periodStart: payPeriodStart,
        periodEnd: payPeriodEnd,
        tenantId: "tenant-1",
        save: false,
      });
      setPayrollResult(result);
    } catch (err: any) {
      alert(err.message || "Payroll calculation failed");
    } finally {
      setCalculatingPayroll(false);
    }
  };

  const fetchWeather = async () => {
    try {
      // Try to fetch real Perth weather with a 6s timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=-31.9505&longitude=115.8605&current=temperature_2m,windspeed_10m,weathercode", { signal: controller.signal });
      clearTimeout(timeout);
      if (response.ok) {
        const data = await response.json();
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          windSpeed: Math.round(data.current.windspeed_10m),
          condition: "Live Perth Weather (Open-Meteo)",
        });
      } else {
        setWeather({ temp: 18, windSpeed: 25, condition: "Typical Perth conditions (fallback)" });
      }
    } catch {
      setWeather({ temp: 18, windSpeed: 25, condition: "Typical Perth conditions (offline fallback)" });
    }
  };

  const isWindUnsafe = weather.windSpeed > 35;

  // Current week (Mon-Sun) for roster calendar
  const weekDays = (() => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  })();

  return (
    <FeatureGate moduleKey="OPERATIONS_HRIS">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F8FAFC]">Operations / HRIS</h1>
            <p className="text-[#94A3B8]">Crew roster, HRIS profiles, and payroll management</p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg hover:bg-[#38BDF8] transition"
          >
            <Plus className="w-4 h-4" />
            Add Crew Member
          </button>
        </div>

        {/* Weather Safety Banner */}
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            isWindUnsafe
              ? "bg-[#7F1D1D]/20 border border-[#7F1D1D]/30"
              : "bg-[#10B981]/10 border border-[#10B981]/30"
          }`}
        >
          <div className={isWindUnsafe ? "w-6 h-6 text-[#FCA5A5]" : "w-6 h-6 text-[#10B981]"}>
            {isWindUnsafe ? <AlertTriangle /> : <CheckCircle2 />}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-[#F8FAFC]">Perth Weather & Wind Safety</h3>
            <p className="text-sm text-[#94A3B8]">
              {weather.temp}°C • Wind {weather.windSpeed} km/h • {weather.condition}
            </p>
            {isWindUnsafe && (
              <p className="text-sm text-[#FCA5A5] font-medium">
                ⚠ High wind &gt; 35 km/h — UNSAFE for sheet laying. Crew should not climb roofs.
              </p>
            )}
            {!isWindUnsafe && (
              <p className="text-sm text-[#10B981] font-medium">
                ✓ Wind conditions safe for roofing work.
              </p>
            )}
          </div>
          <button
            onClick={fetchWeather}
            className="text-xs text-[#0EA5E9] hover:underline"
          >
            Refresh Weather
          </button>
        </div>

        {/* Roster View Toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#F8FAFC]">Crew Roster</h2>
          <div className="flex gap-1 bg-[#0F172A] border border-[#334155] rounded-lg p-1">
            <button
              onClick={() => setRosterView("list")}
              className={`px-3 py-1.5 text-xs rounded-md transition ${rosterView === "list" ? "bg-[#0EA5E9] text-[#0F172A] font-bold" : "text-[#94A3B8] hover:text-[#F8FAFC]"}`}
            >
              List
            </button>
            <button
              onClick={() => setRosterView("calendar")}
              className={`px-3 py-1.5 text-xs rounded-md transition ${rosterView === "calendar" ? "bg-[#0EA5E9] text-[#0F172A] font-bold" : "text-[#94A3B8] hover:text-[#F8FAFC]"}`}
            >
              Calendar
            </button>
          </div>
        </div>

        {rosterView === "calendar" ? (
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-x-auto">
            <div className="grid grid-cols-7 min-w-[800px]">
              {weekDays.map((d, i) => {
                const isToday = d.toDateString() === new Date().toDateString();
                const dayJobs = jobs.filter((j) => j.scheduledDate && new Date(j.scheduledDate).toDateString() === d.toDateString());
                return (
                  <div key={i} className={`min-h-[160px] p-2 border-r border-[#334155]/50 ${isToday ? "bg-[#0EA5E9]/5" : ""}`}>
                    <div className="text-center mb-2">
                      <div className="text-[10px] uppercase text-[#64748B]">{d.toLocaleDateString("en-AU", { weekday: "short" })}</div>
                      <div className={`text-sm font-bold ${isToday ? "text-[#0EA5E9]" : "text-[#F8FAFC]"}`}>{d.getDate()}</div>
                    </div>
                    <div className="space-y-1">
                      {dayJobs.map((j) => (
                        <div key={j.id} className="p-1.5 rounded bg-[#0EA5E9]/15 border border-[#0EA5E9]/30 text-[10px]">
                          <div className="font-bold text-[#38BDF8]">{j.jobNumber}</div>
                          <div className="text-[#94A3B8] truncate">{j.quote?.customerSuburb || j.status}</div>
                        </div>
                      ))}
                      {dayJobs.length === 0 && <div className="text-[10px] text-[#475569] text-center pt-4">—</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#0F172A]/50">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Crew Member</th>
                  <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Role</th>
                  <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Hourly Rate</th>
                  <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">White Card</th>
                  <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Working at Heights</th>
                  <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Plumbing Lic</th>
                  <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">KPI</th>
                  <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Status</th>
                </tr>
              </thead>
              <tbody>
                {crew.map((member, i) => {
                  const hrisProfile = hris.find((h) => h.crewMemberId === member.id);
                  const hasWhiteCard = hrisProfile?.whiteCardNumber;
                  const hasWAH = hrisProfile?.workingAtHeightsCert;
                  const hasPlumbing = hrisProfile?.plumbingLicence;
                  return (
                    <tr key={member.id} className="border-b border-[#1E293B]/30">
                      <td className="px-4 py-3 text-sm text-[#F8FAFC]">
                        {member.firstName} {member.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#94A3B8]">{member.role}</td>
                      <td className="px-4 py-3 text-sm text-[#94A3B8]">${member.hourlyRate}/hr</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${hasWhiteCard ? "bg-[#10B981]/20 text-[#10B981]" : "bg-[#EF4444]/20 text-[#EF4444]"}`}>
                          {hasWhiteCard ? "✓" : "✗"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${hasWAH ? "bg-[#10B981]/20 text-[#10B981]" : "bg-[#EF4444]/20 text-[#EF4444]"}`}>
                          {hasWAH ? "✓" : "✗"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${hasPlumbing ? "bg-[#10B981]/20 text-[#10B981]" : "bg-[#64748A]/20 text-[#64748A]"}`}>
                          {hasPlumbing ? "✓" : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#94A3B8]">
                        {hrisProfile?.kpiRating != null ? Number(hrisProfile.kpiRating).toFixed(1) : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${member.isActive ? "bg-[#10B981]/20 text-[#10B981]" : "bg-[#64748A]/20 text-[#64748A]"}`}>
                          {member.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Payroll Section */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
          <h3 className="text-sm font-bold text-[#F8FAFC] mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Payday Super & STP Phase 2 Calculator
          </h3>

          {/* Pay Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Period Start</label>
              <input
                type="date"
                value={payPeriodStart}
                onChange={(e) => setPayPeriodStart(e.target.value)}
                className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Period End</label>
              <input
                type="date"
                value={payPeriodEnd}
                onChange={(e) => setPayPeriodEnd(e.target.value)}
                className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]"
              />
            </div>
          </div>

          {/* Hours Input per Crew Member */}
          <div className="bg-[#0F172A] border border-[#334155] rounded-lg overflow-hidden mb-4">
            <table className="w-full text-left">
              <thead className="bg-[#0F172A]/50">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Crew Member</th>
                  <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Role</th>
                  <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Hourly Rate</th>
                  <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Hours Worked</th>
                </tr>
              </thead>
              <tbody>
                {crew.map((member) => (
                  <tr key={member.id} className="border-b border-[#1E293B]/30">
                    <td className="px-4 py-3 text-sm text-[#F8FAFC]">{member.firstName} {member.lastName}</td>
                    <td className="px-4 py-3 text-sm text-[#94A3B8]">{member.role}</td>
                    <td className="px-4 py-3 text-sm text-[#94A3B8]">${member.hourlyRate}/hr</td>
                    <td className="px-4 py-3 text-sm">
                      <input
                        type="number"
                        value={hoursInput[member.id] || 40}
                        onChange={(e) => setHoursInput({ ...hoursInput, [member.id]: parseFloat(e.target.value) || 0 })}
                        className="w-20 px-2 py-1 bg-[#1E293B] border border-[#334155] rounded text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]"
                        min="0"
                        max="60"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleCalculatePayroll}
            disabled={calculatingPayroll || crew.length === 0}
            className="px-4 py-2 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg text-sm hover:bg-[#38BDF8] transition disabled:opacity-50 flex items-center gap-2"
          >
            {calculatingPayroll ? "Calculating..." : "Calculate Payroll"}
          </button>

          {/* Payroll Results */}
          {payrollResult && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
                <div className="bg-[#0F172A] p-4 rounded-lg border border-[#334155]">
                  <p className="text-xs text-[#64748B]">Ordinary Time Earnings</p>
                  <p className="text-lg font-bold text-[#F8FAFC]">${payrollResult.totals.totalOTE.toLocaleString()}</p>
                </div>
                <div className="bg-[#0F172A] p-4 rounded-lg border border-[#334155]">
                  <p className="text-xs text-[#64748B]">Super Guarantee (12%)</p>
                  <p className="text-lg font-bold text-[#10B981]">${payrollResult.totals.totalSuper.toLocaleString()}</p>
                </div>
                <div className="bg-[#0F172A] p-4 rounded-lg border border-[#334155]">
                  <p className="text-xs text-[#64748B]">PAYG Withholding</p>
                  <p className="text-lg font-bold text-[#F59E0B]">${payrollResult.totals.totalPayg.toLocaleString()}</p>
                </div>
                <div className="bg-[#0F172A] p-4 rounded-lg border border-[#334155]">
                  <p className="text-xs text-[#64748B]">WA MyLeave Levy (0.75% · apprentices 0%)</p>
                  <p className="text-lg font-bold text-[#F59E0B]">${payrollResult.totals.totalMyLeave.toLocaleString()}</p>
                </div>
                <div className="bg-[#0F172A] p-4 rounded-lg border border-[#334155]">
                  <p className="text-xs text-[#64748B]">Net Pay</p>
                  <p className="text-lg font-bold text-[#0EA5E9]">${payrollResult.totals.totalNetPay.toLocaleString()}</p>
                </div>
              </div>

              {/* Per-Crew Breakdown */}
              <div className="bg-[#0F172A] border border-[#334155] rounded-lg overflow-hidden mt-4">
                <table className="w-full text-left">
                  <thead className="bg-[#0F172A]/50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Crew Member</th>
                      <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Hours</th>
                      <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">OTE</th>
                      <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Super (12%)</th>
                      <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">PAYG</th>
                      <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">MyLeave</th>
                      <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Net Pay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollResult.lines.map((line: any) => (
                      <tr key={line.crewMemberId} className="border-b border-[#1E293B]/30">
                        <td className="px-4 py-3 text-sm text-[#F8FAFC]">{line.firstName} {line.lastName}</td>
                        <td className="px-4 py-3 text-sm text-[#94A3B8]">{line.hoursWorked}</td>
                        <td className="px-4 py-3 text-sm text-[#F8FAFC]">${line.ote.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-[#10B981]">${line.superGuarantee.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-[#F59E0B]">${line.paygWithholding.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-[#F59E0B]">${line.myLeaveLevy.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-[#0EA5E9] font-bold">${line.netPay.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => generateABABankFile({
                    bsb: "066-000",
                    accountNumber: "12345678",
                    accountName: "Perth Premier Roofing",
                    payments: payrollResult.lines.map((line: any) => ({
                      bsb: "066-000",
                      accountNumber: line.crewMemberId.substring(0, 8),
                      accountName: `${line.firstName} ${line.lastName}`,
                      amount: line.netPay,
                      reference: `PAY-${line.crewMemberId.substring(0, 6)}`,
                    })),
                  })}
                  className="px-4 py-2 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg text-sm hover:bg-[#38BDF8] transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Generate .ABA Bank File
                </button>
                <button className="px-4 py-2 bg-[#1E293B] border border-[#334155] text-[#94A3B8] rounded-lg text-sm hover:text-[#F8FAFC] transition">
                  Preview STP JSON
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </FeatureGate>
  );
}
