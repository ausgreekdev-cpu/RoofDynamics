/**
 * RoofDynamics - WA Statutory Compliance Engine
 * Western Australia building, plumbing, and WHS compliance rules.
 *
 * Governing legislation:
 *  - Home Building Contracts Act 1991 (WA) — 6.5% residential deposit cap
 *  - WA Building Services Board — $20,000 builder rule + BA1/BA2 permits
 *  - WA Plumbers Licensing Board — roof plumbing work
 *  - WorkSafe WA WHS Act 2020 — height safety + asbestos
 *  - Security of Payment Act 2021 (WA) — 15-business-day payment schedule
 */

export interface ComplianceContext {
  quoteTotalIncGst: number;
  jobType: "standard" | "structural" | "reroofing";
  includesRoofPlumbing: boolean; // gutters, downpipes, valley irons, box gutters, flashings
  roofHeight: number; // metres
  isAsbestosRemoval: boolean;
  asbestosArea: number; // m²
  hasBuilderRegNumber: boolean;
  hasPlumbingLicence: boolean;
  hasSWMS: boolean;
  hasEdgeProtection: boolean;
  hasAsbestosLicence: boolean;
  hasWorkSafeNotification: boolean;
  crewMemberTickets?: Array<{
    ticketType: string;
    isValid: boolean;
  }>;

  // --- New statutory inputs (optional for backwards compatibility) ---
  /** Residential vs commercial contract — deposit cap only applies to residential. */
  isResidential?: boolean;
  /** Requested deposit amount in dollars (inc GST). */
  depositAmount?: number;
  /** Tile-to-tin / structural conversion requires a building permit. */
  isStructuralConversion?: boolean;
  /** LGA building permit number (BA1 or BA2). */
  buildingPermitNumber?: string;
  /** For commercial claims — days elapsed since payment claim was served. */
  paymentClaimDaysElapsed?: number;
}

export interface ComplianceResult {
  passed: boolean;
  blockedReason?: string;
  requiredActions: string[];
  warnings: string[];
  rulesEvaluated: Array<{
    rule: string;
    passed: boolean;
    required: string;
    status: "pass" | "fail" | "warning";
  }>;
}

// Statutory constants
const DEPOSIT_CAP_RATE = 0.065; // 6.5% — Home Building Contracts Act 1991 (WA)
const DEPOSIT_CAP_MIN = 7500;
const DEPOSIT_CAP_MAX = 500000;
const PAYMENT_SCHEDULE_DAYS = 15; // Security of Payment Act 2021 (WA)

export function evaluateWACompliance(ctx: ComplianceContext): ComplianceResult {
  const rules: ComplianceResult["rulesEvaluated"] = [];
  const requiredActions: string[] = [];
  const warnings: string[] = [];
  let blockedReason: string | undefined;
  let passed = true;

  // Rule 1: WA Building Services Board $20,000 Rule + BA1/BA2 permit
  const over20k = ctx.quoteTotalIncGst >= 20000;
  const isStructuralOrReroof =
    ctx.jobType === "structural" || ctx.jobType === "reroofing";
  const requiresPermit = over20k || !!ctx.isStructuralConversion;

  if (over20k && isStructuralOrReroof) {
    if (!ctx.hasBuilderRegNumber) {
      rules.push({
        rule: "WA Building Services Board ($20,000 Rule)",
        passed: false,
        required: "WA Registered Builder Practitioner number required for structural/re-roofing work over $20,000 (inc GST)",
        status: "fail",
      });
      requiredActions.push(
        "Obtain WA Registered Builder Practitioner number before scheduling"
      );
      passed = false;
      blockedReason =
        "Job over $20,000 requires WA Registered Builder Practitioner number";
    } else {
      rules.push({
        rule: "WA Building Services Board ($20,000 Rule)",
        passed: true,
        required: "WA Registered Builder Practitioner number on file",
        status: "pass",
      });
    }
  } else {
    rules.push({
      rule: "WA Building Services Board ($20,000 Rule)",
      passed: true,
      required: "Not applicable (under $20,000 or non-structural work)",
      status: "pass",
    });
  }

  // Rule 1b: LGA Building Permit (BA1 / BA2) for ≥$20k or structural conversion
  if (requiresPermit) {
    if (!ctx.buildingPermitNumber) {
      rules.push({
        rule: "LGA Building Permit (BA1/BA2)",
        passed: false,
        required: "LGA Building Permit (BA1/BA2) number required for work ≥ $20,000 or structural tile-to-tin conversion",
        status: "fail",
      });
      requiredActions.push("Obtain LGA Building Permit (BA1 or BA2) before scheduling");
      passed = false;
      if (!blockedReason) blockedReason = "LGA Building Permit (BA1/BA2) required";
    } else {
      rules.push({
        rule: "LGA Building Permit (BA1/BA2)",
        passed: true,
        required: `Building Permit ${ctx.buildingPermitNumber} on file`,
        status: "pass",
      });
    }
  } else {
    rules.push({
      rule: "LGA Building Permit (BA1/BA2)",
      passed: true,
      required: "Not applicable (under $20,000 and no structural conversion)",
      status: "pass",
    });
  }

  // Rule 1c: Home Building Contracts Act 1991 (WA) — 6.5% residential deposit cap
  const depositCapApplies =
    ctx.isResidential === true &&
    ctx.quoteTotalIncGst >= DEPOSIT_CAP_MIN &&
    ctx.quoteTotalIncGst <= DEPOSIT_CAP_MAX;
  if (depositCapApplies && ctx.depositAmount !== undefined) {
    const maxDeposit = ctx.quoteTotalIncGst * DEPOSIT_CAP_RATE;
    if (ctx.depositAmount > maxDeposit + 0.01) {
      rules.push({
        rule: "Home Building Contracts Act 1991 (WA) — 6.5% Deposit Cap",
        passed: false,
        required: `Residential contracts $${DEPOSIT_CAP_MIN.toLocaleString()}–$${DEPOSIT_CAP_MAX.toLocaleString()} require a deposit ≤ 6.5% ($${maxDeposit.toFixed(2)}). Mandatory WA Notice for the Home Owner must be attached.`,
        status: "fail",
      });
      requiredActions.push(
        `Reduce deposit to ≤ $${maxDeposit.toFixed(2)} (6.5%) and attach the WA Notice for the Home Owner`
      );
      passed = false;
      if (!blockedReason) blockedReason = "Residential deposit exceeds the 6.5% statutory cap";
    } else {
      rules.push({
        rule: "Home Building Contracts Act 1991 (WA) — 6.5% Deposit Cap",
        passed: true,
        required: `Deposit $${ctx.depositAmount.toFixed(2)} within 6.5% cap ($${maxDeposit.toFixed(2)}). WA Notice for the Home Owner attached.`,
        status: "pass",
      });
    }
    warnings.push("Attach the mandatory WA Notice for the Home Owner to the contract");
  } else {
    rules.push({
      rule: "Home Building Contracts Act 1991 (WA) — 6.5% Deposit Cap",
      passed: true,
      required: "Not applicable (commercial work or contract outside $7,500–$500,000)",
      status: "pass",
    });
  }

  // Rule 2: WA Plumbers Licensing Board Rule
  if (ctx.includesRoofPlumbing) {
    if (!ctx.hasPlumbingLicence) {
      rules.push({
        rule: "WA Plumbers Licensing Board Rule",
        passed: false,
        required: "WA Plumbing Tradesperson / Contractor Licence required for roof plumbing work (gutters, downpipes, valley irons, box gutters, flashings) regardless of value",
        status: "fail",
      });
      requiredActions.push(
        "Assign crew member with valid WA Plumbing Licence before scheduling"
      );
      passed = false;
      if (!blockedReason) {
        blockedReason = "Roof plumbing work requires licensed plumber";
      }
    } else {
      rules.push({
        rule: "WA Plumbers Licensing Board Rule",
        passed: true,
        required: "WA Plumbing Licence verified for assigned crew",
        status: "pass",
      });
    }
  } else {
    rules.push({
      rule: "WA Plumbers Licensing Board Rule",
      passed: true,
      required: "Not applicable (no roof plumbing work)",
      status: "pass",
    });
  }

  // Rule 3: WorkSafe WA WHS Act 2020 - Falling from Heights
  if (ctx.roofHeight > 2.0) {
    if (!ctx.hasSWMS) {
      rules.push({
        rule: "WorkSafe WA WHS Act 2020 - Falling from Heights",
        passed: false,
        required: "Signed Falling from Heights SWMS required for roof height > 2.0m",
        status: "fail",
      });
      requiredActions.push(
        "Complete and sign Falling from Heights SWMS before crew clock-in"
      );
      passed = false;
      if (!blockedReason) {
        blockedReason = "SWMS required for work at height > 2.0m";
      }
    } else {
      rules.push({
        rule: "WorkSafe WA WHS Act 2020 - Falling from Heights",
        passed: true,
        required: "Signed Falling from Heights SWMS on file",
        status: "pass",
      });
    }

    if (!ctx.hasEdgeProtection) {
      rules.push({
        rule: "WorkSafe WA WHS Act 2020 - Edge Protection",
        passed: false,
        required: "Verified perimeter edge protection required for roof height > 2.0m",
        status: "fail",
      });
      requiredActions.push(
        "Install and verify perimeter edge protection before crew clock-in"
      );
      passed = false;
      if (!blockedReason) {
        blockedReason = "Edge protection required for work at height > 2.0m";
      }
    } else {
      rules.push({
        rule: "WorkSafe WA WHS Act 2020 - Edge Protection",
        passed: true,
        required: "Perimeter edge protection verified",
        status: "pass",
      });
    }
  } else {
    rules.push({
      rule: "WorkSafe WA WHS Act 2020 - Height Safety",
      passed: true,
      required: "Not applicable (roof height <= 2.0m)",
      status: "pass",
    });
  }

  // Rule 3b: Asbestos Super Six Removal > 10m²
  if (ctx.isAsbestosRemoval && ctx.asbestosArea > 10) {
    if (!ctx.hasAsbestosLicence) {
      rules.push({
        rule: "WorkSafe WA - Asbestos Removal Licence",
        passed: false,
        required: "WorkSafe WA Class B or Class A Asbestos Removal Licence required for asbestos removal over 10m²",
        status: "fail",
      });
      requiredActions.push(
        "Engage licensed asbestos removalist before starting work"
      );
      passed = false;
      if (!blockedReason) {
        blockedReason = "Asbestos removal licence required for removal over 10m²";
      }
    } else {
      rules.push({
        rule: "WorkSafe WA - Asbestos Removal Licence",
        passed: true,
        required: "Class B/A Asbestos Removal Licence verified",
        status: "pass",
      });
    }

    if (!ctx.hasWorkSafeNotification) {
      rules.push({
        rule: "WorkSafe WA - 5-Day Asbestos Notification",
        passed: false,
        required: "Mandatory 5-day WorkSafe notification log required for asbestos removal over 10m²",
        status: "fail",
      });
      requiredActions.push(
        "Submit 5-day WorkSafe asbestos removal notification"
      );
      passed = false;
    } else {
      rules.push({
        rule: "WorkSafe WA - 5-Day Asbestos Notification",
        passed: true,
        required: "5-day WorkSafe notification submitted",
        status: "pass",
      });
    }

    warnings.push("Double-wrap asbestos waste and track licensed landfill tip receipts");
  } else if (ctx.isAsbestosRemoval) {
    rules.push({
      rule: "WorkSafe WA - Asbestos Removal",
      passed: true,
      required: "Not applicable (asbestos area <= 10m²)",
      status: "pass",
    });
  }

  // Rule 4: Security of Payment Act 2021 (WA) — 15-business-day payment schedule
  if (ctx.paymentClaimDaysElapsed !== undefined) {
    const elapsed = ctx.paymentClaimDaysElapsed;
    const remaining = PAYMENT_SCHEDULE_DAYS - elapsed;
    if (remaining < 0) {
      rules.push({
        rule: "Security of Payment Act 2021 (WA) — Payment Schedule",
        passed: false,
        required: `Payment Schedule response deadline (${PAYMENT_SCHEDULE_DAYS} business days) has passed by ${Math.abs(remaining)} days`,
        status: "fail",
      });
      requiredActions.push("Escalate overdue statutory payment claim immediately");
      passed = false;
    } else if (remaining <= 3) {
      rules.push({
        rule: "Security of Payment Act 2021 (WA) — Payment Schedule",
        passed: true,
        required: `${remaining} business day(s) remaining to serve the Payment Schedule`,
        status: "warning",
      });
      warnings.push(`Payment Schedule due in ${remaining} business day(s)`);
    } else {
      rules.push({
        rule: "Security of Payment Act 2021 (WA) — Payment Schedule",
        passed: true,
        required: `${remaining} business day(s) remaining to serve the Payment Schedule`,
        status: "pass",
      });
    }
  } else {
    rules.push({
      rule: "Security of Payment Act 2021 (WA) — Payment Schedule",
      passed: true,
      required: "Not applicable (no active payment claim)",
      status: "pass",
    });
  }

  return {
    passed,
    blockedReason,
    requiredActions,
    warnings,
    rulesEvaluated: rules,
  };
}

export { evaluateWACompliance as default };
