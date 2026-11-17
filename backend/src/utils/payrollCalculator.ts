/**
 * RoofDynamics - Payday Super & STP Phase 2 Payroll Calculator
 * Western Australian construction industry payroll calculations.
 */

// 2026 ATO Tax Tables (Resident, weekly)
// Source: ATO Tax Withheld Calculator
interface TaxBracket {
  min: number;
  max: number;
  base: number;
  rate: number;
  threshold: number;
}

const TAX_BRACKETS_2026: TaxBracket[] = [
  { min: 0, max: 359, base: 0, rate: 0, threshold: 0 },
  { min: 360, max: 438, base: 0, rate: 0.19, threshold: 359 },
  { min: 439, max: 548, base: 15, rate: 0.29, threshold: 438 },
  { min: 549, max: 721, base: 46.85, rate: 0.21, threshold: 548 },
  { min: 722, max: 865, base: 83.09, rate: 0.30, threshold: 721 },
  { min: 866, max: 1119, base: 126.00, rate: 0.30, threshold: 865 },
  { min: 1120, max: 1282, base: 201.90, rate: 0.32, threshold: 1119 },
  { min: 1283, max: 1732, base: 253.74, rate: 0.32, threshold: 1282 },
  { min: 1733, max: 2166, base: 397.50, rate: 0.34, threshold: 1732 },
  { min: 2167, max: 3111, base: 544.72, rate: 0.37, threshold: 2166 },
  { min: 3112, max: 4000, base: 893.86, rate: 0.39, threshold: 3111 },
  { min: 4001, max: Infinity, base: 1239.82, rate: 0.45, threshold: 4000 },
];

// WA MyLeave (Construction Portable LSL) levy rate
const MYLEAVE_LEVY_RATE = 0.027; // 2.7%

// Super Guarantee rate (2026)
const SUPER_GUARANTEE_RATE = 0.12; // 12%

export interface PayrollInput {
  crewMemberId: string;
  firstName: string;
  lastName: string;
  hourlyRate: number;
  hoursWorked: number;
  payFrequency?: 'weekly' | 'fortnightly' | 'monthly';
}

export interface PayrollLineResult {
  crewMemberId: string;
  firstName: string;
  lastName: string;
  hoursWorked: number;
  hourlyRate: number;
  ote: number;
  superGuarantee: number;
  paygWithholding: number;
  myLeaveLevy: number;
  netPay: number;
}

export interface PayrollResult {
  lines: PayrollLineResult[];
  totals: {
    totalOTE: number;
    totalSuper: number;
    totalPayg: number;
    totalMyLeave: number;
    totalNetPay: number;
    lineCount: number;
  };
  stpJson: any;
}

/**
 * Calculate PAYG withholding for weekly earnings
 */
function calculatePAYG(weeklyEarnings: number): number {
  const bracket = TAX_BRACKETS_2026.find(
    (b) => weeklyEarnings >= b.min && weeklyEarnings <= b.max
  );

  if (!bracket) return 0;

  const tax = bracket.base + (weeklyEarnings - bracket.threshold) * bracket.rate;
  return Math.round(tax * 100) / 100;
}

/**
 * Calculate payroll for a pay run
 */
export function calculatePayroll(inputs: PayrollInput[]): PayrollResult {
  const lines: PayrollLineResult[] = [];

  for (const input of inputs) {
    const { crewMemberId, firstName, lastName, hourlyRate, hoursWorked } = input;

    // OTE = hourly rate × hours worked
    const ote = Math.round(hourlyRate * hoursWorked * 100) / 100;

    // Super Guarantee = OTE × 12%
    const superGuarantee = Math.round(ote * SUPER_GUARANTEE_RATE * 100) / 100;

    // PAYG Withholding (weekly tax tables)
    const paygWithholding = calculatePAYG(ote);

    // WA MyLeave Levy = OTE × 2.7%
    const myLeaveLevy = Math.round(ote * MYLEAVE_LEVY_RATE * 100) / 100;

    // Net Pay = OTE - PAYG (super is employer contribution, not deducted from employee)
    const netPay = Math.round((ote - paygWithholding) * 100) / 100;

    lines.push({
      crewMemberId,
      firstName,
      lastName,
      hoursWorked,
      hourlyRate,
      ote,
      superGuarantee,
      paygWithholding,
      myLeaveLevy,
      netPay,
    });
  }

  const totals = {
    totalOTE: Math.round(lines.reduce((sum, l) => sum + l.ote, 0) * 100) / 100,
    totalSuper: Math.round(lines.reduce((sum, l) => sum + l.superGuarantee, 0) * 100) / 100,
    totalPayg: Math.round(lines.reduce((sum, l) => sum + l.paygWithholding, 0) * 100) / 100,
    totalMyLeave: Math.round(lines.reduce((sum, l) => sum + l.myLeaveLevy, 0) * 100) / 100,
    totalNetPay: Math.round(lines.reduce((sum, l) => sum + l.netPay, 0) * 100) / 100,
    lineCount: lines.length,
  };

  // STP Phase 2 JSON preview
  const stpJson = {
    stpVersion: "2.0",
    payEvent: {
      payPeriodStart: new Date().toISOString().split('T')[0],
      payPeriodEnd: new Date().toISOString().split('T')[0],
      payDate: new Date().toISOString().split('T')[0],
      employees: lines.map((line) => ({
        employeeId: line.crewMemberId,
        grossAmount: line.ote,
        paygWithholding: line.paygWithholding,
        superannuationGuarantee: line.superGuarantee,
        ordinaryTimeEarnings: line.ote,
      })),
      totals: {
        grossAmount: totals.totalOTE,
        paygWithholding: totals.totalPayg,
        superannuationGuarantee: totals.totalSuper,
      },
    },
  };

  return { lines, totals, stpJson };
}

export { calculatePAYG, SUPER_GUARANTEE_RATE, MYLEAVE_LEVY_RATE };
