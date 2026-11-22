"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { aiAgentService, type AgentResult } from "../services/aiAgentService";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { socketService } from "../services/socketService";
import {
  Play,
  Terminal,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Users,
  HardHat,
  Bot,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const COLORS = ["#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function Dashboard() {
  const { tenant } = useAuth();
  interface DashboardSummary { totalQuotes?: number; totalJobs?: number; totalRevenue?: number; lowStockCount?: number; [key: string]: unknown }
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  interface ExecutionEntry { id?: string; agentId: string; agentName: string; status: string; message: string; timestamp: string; data?: unknown }
  const [executions, setExecutions] = useState<ExecutionEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<AgentResult[] | null>(null);
  const [llmInitialized, setLlmInitialized] = useState(false);

  useEffect(() => {
    aiAgentService.initialize().then(() => setLlmInitialized(true));
    fetchSummary();

    // Connect to WebSocket for real-time updates
    if (tenant?.id) {
      socketService.connect(tenant.id);
      const unsubscribe = socketService.on("quote:accepted", (data) => {
        setExecutions((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            agentId: "realtime",
            agentName: "Real-Time Update",
            status: "completed",
            message: `Quote ${data.quoteId} accepted — Job created automatically`,
            timestamp: new Date().toISOString(),
          },
        ]);
        fetchSummary();
      });
      return () => {
        unsubscribe();
        socketService.disconnect();
      };
    }
  }, [tenant?.id]);

  const fetchSummary = async () => {
    try {
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch {
      setSummary({
        totalQuotes: 24,
        totalJobs: 12,
        totalRevenue: 184500,
        lowStockCount: 3,
      });
    }
  };

  const handleRunAll = async () => {
    setIsRunning(true);
    const feed: ExecutionEntry[] = [];
    setExecutions(feed);

    const addEntry = (agentId: string, agentName: string, status: string, message: string, data?: unknown) => {
      const entry = {
        id: String(Date.now() + Math.random()),
        agentId,
        agentName,
        status,
        message,
        timestamp: new Date().toISOString(),
        data,
      };
      setExecutions((prev) => [...prev, entry]);
      return entry;
    };

    try {
      addEntry("system", "Empire Automation", "running", "Initializing 4 autonomous agents...");

      const agentResults = await aiAgentService.runAllAgents({
        crew: [
          { name: "John Smith", tickets: [{ isValid: true }, { isValid: true }] },
          { name: "Mike Wilson", tickets: [{ isValid: true }, { isValid: false }] },
          { name: "Sarah Davis", tickets: [{ isValid: true }, { isValid: true }] },
        ],
        invoice: { number: "INV-001", amount: 15000 },
        purchaseOrder: { number: "PO-001", amount: 15000 },
        deliveryDocket: { number: "DD-001" },
        photos: [
          { url: "/images/before1.jpg", suburb: "Fremantle" },
          { url: "/images/after1.jpg", suburb: "Fremantle" },
        ],
        suburb: "Fremantle",
        items: [
          { itemName: "Colorbond Sheets", quantity: 40 },
          { itemName: "Roof Batten", quantity: 120 },
        ],
      });

      setResults(agentResults);

      for (const result of agentResults) {
        addEntry(
          result.agentId,
          result.agentName,
          result.success ? "completed" : "failed",
          result.message,
          result.data
        );
        await new Promise((r) => setTimeout(r, 500));
      }

      addEntry("system", "Empire Automation", "completed", "All automations complete. Check module results.");
    } catch (err: unknown) {
      addEntry("system", "Empire Automation", "failed", (err as Error)?.message || "Automation failed");
    } finally {
      setIsRunning(false);
    }
  };

  const chartData = [
    { month: "Jan", gross: 45000, net: 32000 },
    { month: "Feb", gross: 52000, net: 38000 },
    { month: "Mar", gross: 48000, net: 35000 },
    { month: "Apr", gross: 61000, net: 45000 },
    { month: "May", gross: 58000, net: 42000 },
    { month: "Jun", gross: 67000, net: 51000 },
  ];

  const funnelData = [
    { name: "Leads", value: 120, color: COLORS[0] },
    { name: "Quotes Sent", value: 85, color: COLORS[1] },
    { name: "Quotes Accepted", value: 52, color: COLORS[2] },
    { name: "Jobs Completed", value: 38, color: COLORS[3] },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC]">Executive BI Dashboard</h1>
          <p className="text-[#94A3B8]">One-Man Empire AI Autopilot Hub — {tenant?.name}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSummary}
            className="px-4 py-2 bg-[#1E293B] border border-[#334155] text-[#94A3B8] rounded-lg hover:text-[#F8FAFC] hover:border-[#0EA5E9] transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            data-tour="run-all"
            onClick={handleRunAll}
            disabled={isRunning}
            className="px-5 py-2 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg hover:bg-[#38BDF8] disabled:opacity-50 transition flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin"></div>
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run All Empire Automations
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Quotes"
          value={summary?.totalQuotes || 0}
          icon={PhoneCallIcon}
          color="#0EA5E9"
          trend="+12%"
        />
        <MetricCard
          title="Active Jobs"
          value={summary?.totalJobs || 0}
          icon={HardHatIcon}
          color="#10B981"
          trend="+5%"
        />
        <MetricCard
          title="Total Revenue"
          value={`$${(summary?.totalRevenue || 0).toLocaleString()}`}
          icon={DollarSignIcon}
          color="#F59E0B"
          trend="+18%"
        />
        <MetricCard
          title="Low Stock Items"
          value={summary?.lowStockCount || 0}
          icon={AlertCircleIcon}
          color="#EF4444"
          trend="3 items"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
          <h3 className="text-sm font-bold text-[#F8FAFC] mb-4">Gross vs Net Margin per Month</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <defs>
                  <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <Bar dataKey="gross" fill="url(#colorGross)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net" fill="url(#colorNet)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
          <h3 className="text-sm font-bold text-[#F8FAFC] mb-4">Lead-to-Win Funnel</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={funnelData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  labelLine={false}
                  label={({ percent }: { percent?: number }) => `${Math.round((percent ?? 0) * 100)}%`}
                >
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {funnelData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[#94A3B8]">{d.name}</span>
                <span className="ml-auto text-[#F8FAFC] font-medium">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Agent Execution Feed */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#334155]">
          <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#0EA5E9]" />
            Live Execution Feed
          </h3>
          <span className="text-[10px] px-2 py-1 rounded bg-[#10B981]/20 text-[#10B981]">
            {llmInitialized ? "LLM: Online" : "LLM: Offline (Deterministic)"}
          </span>
        </div>
        <div className="max-h-64 overflow-y-auto p-4 space-y-3 bg-[#0F172A]/50">
          {executions.length === 0 ? (
            <div className="text-center py-8 text-[#64748B]">
              <p>No automations executed yet.</p>
              <p className="text-xs mt-2 text-[#546A84]">Click "Run All Empire Automations" to start</p>
            </div>
          ) : (
            executions.map((entry) => (
              <div
                key={entry.id}
                className={`flex flex-col gap-1 p-3 rounded bg-[#1E293B]/30 border border-transparent ${
                  entry.status === "completed"
                    ? "border-[#10B981]/30"
                    : entry.status === "failed"
                      ? "border-[#EF4444]/30"
                      : "border-[#0EA5E9]/30"
                }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className={`font-bold ${entry.status === "completed" ? "text-[#10B981]" : entry.status === "failed" ? "text-[#EF4444]" : "text-[#0EA5E9]"}`}>
                    {entry.status.toUpperCase()}
                  </span>
                  <span className="text-[#64748B]">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-[#F8FAFC]">{entry.agentName}</div>
                  <span className="text-[#94A3B8] text-xs">{entry.message}</span>
                </div>
                {!!entry.data && entry.agentId !== "system" && (
                  <div className="mt-2 pt-2 border-t border-[#334155]/50 text-xs text-[#64748B]">
                    {String(JSON.stringify(entry.data ?? {}).slice(0, 200))}...
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Agent Results Summary */}
      {results && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((r) => (
            <AgentResultCard key={r.agentId} result={r} />
          ))}
        </div>
      )}
    </div>
  );
}

const PhoneCallIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 011 1.091l.168.168c.103.103.15.24.168.37l.213.374c.056.14.076.298.076.47v4.28c0 .171-.02.337-.076.48l-.213.373c-.018.13-.065.267-.168.37l-.168.167c-.09.09-.14.207-.168.368l-.053.215c-.024.095-.03.197-.03.296v1.282c0 .099.006.201.03.296l.053.215c.028.161.078.292.168.368l.168.167c.103.104.24.15.37.168l.374.213c.172.096.33.116.47.076h4.28c.171 0 .337-.02.48-.076l.373-.213c.13-.018.267-.065.37-.168l.167-.168c.16-.161.27-.375.27-.593V8.28c0-.218-.11-.431-.27-.593l-.167-.168c-.09-.09-.207-.14-.368-.168l-.215-.053c-.095-.024-.197-.03-.296-.03H5.28c-.218 0-.431.11-.593.27L2 7.28A2 2 0 004 9h12a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2z"/></svg>;
const HardHatIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 11v3a2 2 0 002 2h6a2 2 0 002-2v-3m-2-6l-4-4m0 0L5 9m5 4 4 4m-4-4h3m-3 3v3m-6 0H5a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v2a2 2 0 01-2 2H9z"/></svg>;
const DollarSignIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2-3 .895-3 2-1.343 2-3 2zm0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
const AlertCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>;

function MetricCard({ title, value, icon: Icon, color, trend }: { title: string; value: number | string; icon: React.ComponentType<{ className?: string }>; color: string; trend: string }) {
  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#64748B] font-medium uppercase">{title}</p>
          <p className="text-2xl font-bold text-[#F8FAFC] mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg bg-[${color}]/10 flex items-center justify-center text-[${color}]`}>
          <Icon />
        </div>
      </div>
      <p className="text-xs text-[#10B981] mt-3 font-medium">{trend}</p>
    </div>
  );
}

function AgentResultCard({ result }: { result: AgentResult }) {
  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-[#0EA5E9] uppercase tracking-tighter">{result.agentName}</span>
        <span className={`text-xs font-bold ${result.success ? "text-[#10B981]" : "text-[#EF4444]"}`}>
          {result.success ? "SUCCESS" : "FAILED"}
        </span>
      </div>
      <p className="text-xs text-[#94A3B8] mb-2">{result.message}</p>
      <div className="text-[10px] text-[#546A84]">{result.executionTimeMs}ms</div>
    </div>
  );
}
