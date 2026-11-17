/**
 * RoofDynamics - Advanced Reporting
 * Custom date range reports, Excel/CSV export, profit & loss by job type.
 */

export interface ReportConfig {
  startDate: string;
  endDate: string;
  reportType: "profit_loss" | "job_summary" | "stock_movement" | "crew_performance";
  groupBy?: "month" | "quarter" | "job_type" | "crew";
}

export interface ReportRow {
  [key: string]: string | number;
}

export function generateReportCSV(config: ReportConfig, data: ReportRow[]): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const rows = data.map((row) => headers.map((h) => {
    const val = row[h];
    if (typeof val === "string" && val.includes(",")) {
      return `"${val}"`;
    }
    return String(val ?? "");
  }));

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `report-${config.reportType}-${config.startDate}-to-${config.endDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function generateProfitLossReport(jobs: any[]): ReportRow[] {
  const grouped: Record<string, { revenue: number; costs: number; count: number }> = {};

  jobs.forEach((job) => {
    const type = job.quote?.jobType || "standard";
    if (!grouped[type]) {
      grouped[type] = { revenue: 0, costs: 0, count: 0 };
    }
    grouped[type].revenue += job.quote?.totalIncGst || 0;
    grouped[type].costs += (job.quote?.totalExGst || 0) * 0.7; // estimated 70% cost
    grouped[type].count += 1;
  });

  return Object.entries(grouped).map(([type, data]) => ({
    "Job Type": type,
    "Jobs": data.count,
    "Revenue": data.revenue.toFixed(2),
    "Estimated Costs": data.costs.toFixed(2),
    "Gross Profit": (data.revenue - data.costs).toFixed(2),
    "Margin %": data.revenue > 0 ? (((data.revenue - data.costs) / data.revenue) * 100).toFixed(1) + "%" : "0%",
  }));
}

export function generateJobSummaryReport(jobs: any[]): ReportRow[] {
  return jobs.map((job) => ({
    "Job Number": job.jobNumber,
    "Customer": job.quote?.customerName || "N/A",
    "Suburb": job.quote?.customerSuburb || "N/A",
    "Status": job.status,
    "Scheduled": job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString("en-AU") : "Not scheduled",
    "Completed": job.completedDate ? new Date(job.completedDate).toLocaleDateString("en-AU") : "Not completed",
    "Revenue": (job.quote?.totalIncGst || 0).toFixed(2),
    "Roof Height (m)": job.roofHeight || 0,
    "Asbestos Removal": job.isAsbestosRemoval ? "Yes" : "No",
  }));
}

export function generateStockMovementReport(stockItems: any[]): ReportRow[] {
  return stockItems.map((item) => ({
    "SKU": item.sku,
    "Item": item.name,
    "Location": item.location,
    "On Hand": item.quantityOnHand,
    "Reserved": item.quantityReserved,
    "Available": item.quantityOnHand - item.quantityReserved,
    "Reorder Point": item.reorderPoint,
    "Status": item.quantityOnHand <= item.reorderPoint ? "LOW STOCK" : "OK",
    "Unit Cost": `$${item.unitCost}`,
    "Total Value": `$${(item.quantityOnHand * item.unitCost).toFixed(2)}`,
  }));
}

export function generateCrewPerformanceReport(crew: any[]): ReportRow[] {
  return crew.map((member) => ({
    "Crew Member": `${member.firstName} ${member.lastName}`,
    "Role": member.role,
    "Hourly Rate": `$${member.hourlyRate}/hr`,
    "Active": member.isActive ? "Yes" : "No",
    "Hire Date": new Date(member.hireDate).toLocaleDateString("en-AU"),
  }));
}
