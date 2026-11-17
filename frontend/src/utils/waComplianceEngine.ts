/**
 * RoofDynamics - WA Statutory Compliance Engine
 * Western Australia building, plumbing, and WHS compliance rules.
 */

export interface ComplianceContext {
  quoteTotalIncGst: number;
  jobType: "standard" | "structural" | "reroofing";
  includesRoofPlumbing: boolean; // gutters, downpipes, valley irons, roof flashings
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

export function evaluateWACompliance(ctx: ComplianceContext): ComplianceResult {
  const rules: ComplianceResult["rulesEvaluated"] = [];
  const requiredActions: string[] = [];
  const warnings: string[] = [];
  let blockedReason: string | undefined;
  let passed = true;

  // Rule 1: WA Building Services Board $20,000 Rule
  const over20k = ctx.quoteTotalIncGst >= 20000;
  const isStructuralOrReroof =
    ctx.jobType === "structural" || ctx.jobType === "reroofing";

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

  // Rule 2: WA Plumbers Licensing Board Rule
  if (ctx.includesRoofPlumbing) {
    if (!ctx.hasPlumbingLicence) {
      rules.push({
        rule: "WA Plumbers Licensing Board Rule",
        passed: false,
        required: "WA Plumbing Tradesperson / Contractor Licence required for roof plumbing work (gutters, downpipes, valley irons, roof flashings)",
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

    warnings.push(
      "Tip receipt tracking required for asbestos waste disposal"
    );
  } else if (ctx.isAsbestosRemoval) {
    rules.push({
      rule: "WorkSafe WA - Asbestos Removal",
      passed: true,
      required: "Not applicable (asbestos area <= 10m²)",
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
