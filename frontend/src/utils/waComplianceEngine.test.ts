import { describe, it, expect } from "vitest";
import { evaluateWACompliance } from "./waComplianceEngine";

describe("waComplianceEngine", () => {
  describe("$20,000 Rule (WA Building Services Board)", () => {
    it("should pass when under $20k", () => {
      const result = evaluateWACompliance({
        quoteTotalIncGst: 15000,
        jobType: "reroofing",
        includesRoofPlumbing: false,
        roofHeight: 3.0,
        isAsbestosRemoval: false,
        asbestosArea: 0,
        hasBuilderRegNumber: false,
        hasPlumbingLicence: true,
        hasSWMS: true,
        hasEdgeProtection: true,
        hasAsbestosLicence: false,
        hasWorkSafeNotification: false,
      });
      const rule = result.rulesEvaluated.find((r) => r.rule.includes("$20,000"));
      expect(rule?.passed).toBe(true);
    });

    it("should fail when over $20k without builder reg (structural)", () => {
      const result = evaluateWACompliance({
        quoteTotalIncGst: 25000,
        jobType: "structural",
        includesRoofPlumbing: false,
        roofHeight: 3.0,
        isAsbestosRemoval: false,
        asbestosArea: 0,
        hasBuilderRegNumber: false,
        hasPlumbingLicence: true,
        hasSWMS: true,
        hasEdgeProtection: true,
        hasAsbestosLicence: false,
        hasWorkSafeNotification: false,
      });
      expect(result.passed).toBe(false);
      expect(result.blockedReason).toContain("Builder Practitioner");
    });

    it("should pass when over $20k with builder reg", () => {
      const result = evaluateWACompliance({
        quoteTotalIncGst: 25000,
        jobType: "reroofing",
        includesRoofPlumbing: false,
        roofHeight: 3.0,
        isAsbestosRemoval: false,
        asbestosArea: 0,
        hasBuilderRegNumber: true,
        hasPlumbingLicence: true,
        hasSWMS: true,
        hasEdgeProtection: true,
        hasAsbestosLicence: false,
        hasWorkSafeNotification: false,
      });
      const rule = result.rulesEvaluated.find((r) => r.rule.includes("$20,000"));
      expect(rule?.passed).toBe(true);
    });
  });

  describe("Plumber Licensing Rule", () => {
    it("should fail when roof plumbing included without licence", () => {
      const result = evaluateWACompliance({
        quoteTotalIncGst: 5000,
        jobType: "standard",
        includesRoofPlumbing: true,
        roofHeight: 2.0,
        isAsbestosRemoval: false,
        asbestosArea: 0,
        hasBuilderRegNumber: false,
        hasPlumbingLicence: false,
        hasSWMS: false,
        hasEdgeProtection: false,
        hasAsbestosLicence: false,
        hasWorkSafeNotification: false,
      });
      expect(result.passed).toBe(false);
      expect(result.blockedReason).toContain("licensed plumber");
    });

    it("should pass when roof plumbing included with licence", () => {
      const result = evaluateWACompliance({
        quoteTotalIncGst: 5000,
        jobType: "standard",
        includesRoofPlumbing: true,
        roofHeight: 2.0,
        isAsbestosRemoval: false,
        asbestosArea: 0,
        hasBuilderRegNumber: false,
        hasPlumbingLicence: true,
        hasSWMS: false,
        hasEdgeProtection: false,
        hasAsbestosLicence: false,
        hasWorkSafeNotification: false,
      });
      const rule = result.rulesEvaluated.find((r) => r.rule.includes("Plumbers"));
      expect(rule?.passed).toBe(true);
    });

    it("should pass when no roof plumbing work", () => {
      const result = evaluateWACompliance({
        quoteTotalIncGst: 5000,
        jobType: "standard",
        includesRoofPlumbing: false,
        roofHeight: 2.0,
        isAsbestosRemoval: false,
        asbestosArea: 0,
        hasBuilderRegNumber: false,
        hasPlumbingLicence: false,
        hasSWMS: false,
        hasEdgeProtection: false,
        hasAsbestosLicence: false,
        hasWorkSafeNotification: false,
      });
      const rule = result.rulesEvaluated.find((r) => r.rule.includes("Plumbers"));
      expect(rule?.passed).toBe(true);
    });
  });

  describe("WorkSafe WHS Act 2020 - Height Safety", () => {
    it("should require SWMS for roof height > 2.0m", () => {
      const result = evaluateWACompliance({
        quoteTotalIncGst: 5000,
        jobType: "standard",
        includesRoofPlumbing: false,
        roofHeight: 3.5,
        isAsbestosRemoval: false,
        asbestosArea: 0,
        hasBuilderRegNumber: false,
        hasPlumbingLicence: false,
        hasSWMS: false,
        hasEdgeProtection: false,
        hasAsbestosLicence: false,
        hasWorkSafeNotification: false,
      });
      expect(result.passed).toBe(false);
      expect(result.requiredActions).toContain("Complete and sign Falling from Heights SWMS before crew clock-in");
    });

    it("should require edge protection for roof height > 2.0m", () => {
      const result = evaluateWACompliance({
        quoteTotalIncGst: 5000,
        jobType: "standard",
        includesRoofPlumbing: false,
        roofHeight: 3.5,
        isAsbestosRemoval: false,
        asbestosArea: 0,
        hasBuilderRegNumber: false,
        hasPlumbingLicence: false,
        hasSWMS: true,
        hasEdgeProtection: false,
        hasAsbestosLicence: false,
        hasWorkSafeNotification: false,
      });
      expect(result.passed).toBe(false);
      expect(result.requiredActions).toContain("Install and verify perimeter edge protection before crew clock-in");
    });

    it("should pass when SWMS and edge protection verified", () => {
      const result = evaluateWACompliance({
        quoteTotalIncGst: 5000,
        jobType: "standard",
        includesRoofPlumbing: false,
        roofHeight: 3.5,
        isAsbestosRemoval: false,
        asbestosArea: 0,
        hasBuilderRegNumber: false,
        hasPlumbingLicence: false,
        hasSWMS: true,
        hasEdgeProtection: true,
        hasAsbestosLicence: false,
        hasWorkSafeNotification: false,
      });
      const rule = result.rulesEvaluated.find((r) => r.rule.includes("Falling from Heights"));
      expect(rule?.passed).toBe(true);
    });

    it("should not require height safety for roof <= 2.0m", () => {
      const result = evaluateWACompliance({
        quoteTotalIncGst: 5000,
        jobType: "standard",
        includesRoofPlumbing: false,
        roofHeight: 1.8,
        isAsbestosRemoval: false,
        asbestosArea: 0,
        hasBuilderRegNumber: false,
        hasPlumbingLicence: false,
        hasSWMS: false,
        hasEdgeProtection: false,
        hasAsbestosLicence: false,
        hasWorkSafeNotification: false,
      });
      const rule = result.rulesEvaluated.find((r) => r.rule.includes("Height Safety"));
      expect(rule?.passed).toBe(true);
    });
  });

  describe("Asbestos Removal (>10m²)", () => {
    it("should require asbestos licence for removal over 10m²", () => {
      const result = evaluateWACompliance({
        quoteTotalIncGst: 5000,
        jobType: "standard",
        includesRoofPlumbing: false,
        roofHeight: 3.0,
        isAsbestosRemoval: true,
        asbestosArea: 15,
        hasBuilderRegNumber: false,
        hasPlumbingLicence: false,
        hasSWMS: true,
        hasEdgeProtection: true,
        hasAsbestosLicence: false,
        hasWorkSafeNotification: false,
      });
      expect(result.passed).toBe(false);
      expect(result.requiredActions).toContain("Engage licensed asbestos removalist before starting work");
    });

    it("should require 5-day WorkSafe notification for removal over 10m²", () => {
      const result = evaluateWACompliance({
        quoteTotalIncGst: 5000,
        jobType: "standard",
        includesRoofPlumbing: false,
        roofHeight: 3.0,
        isAsbestosRemoval: true,
        asbestosArea: 15,
        hasBuilderRegNumber: false,
        hasPlumbingLicence: false,
        hasSWMS: true,
        hasEdgeProtection: true,
        hasAsbestosLicence: true,
        hasWorkSafeNotification: false,
      });
      expect(result.passed).toBe(false);
      expect(result.requiredActions).toContain("Submit 5-day WorkSafe asbestos removal notification");
    });

    it("should pass when all asbestos requirements met", () => {
      const result = evaluateWACompliance({
        quoteTotalIncGst: 5000,
        jobType: "standard",
        includesRoofPlumbing: false,
        roofHeight: 3.0,
        isAsbestosRemoval: true,
        asbestosArea: 15,
        hasBuilderRegNumber: false,
        hasPlumbingLicence: false,
        hasSWMS: true,
        hasEdgeProtection: true,
        hasAsbestosLicence: true,
        hasWorkSafeNotification: true,
      });
      expect(result.passed).toBe(true);
    });

    it("should not require licence for removal <= 10m²", () => {
      const result = evaluateWACompliance({
        quoteTotalIncGst: 5000,
        jobType: "standard",
        includesRoofPlumbing: false,
        roofHeight: 3.0,
        isAsbestosRemoval: true,
        asbestosArea: 8,
        hasBuilderRegNumber: false,
        hasPlumbingLicence: false,
        hasSWMS: true,
        hasEdgeProtection: true,
        hasAsbestosLicence: false,
        hasWorkSafeNotification: false,
      });
      const rule = result.rulesEvaluated.find((r) => r.rule.includes("Asbestos Removal"));
      expect(rule?.passed).toBe(true);
    });
  });

  describe("Fully Compliant Job", () => {
    it("should pass all rules for a fully compliant job", () => {
      const result = evaluateWACompliance({
        quoteTotalIncGst: 15000,
        jobType: "standard",
        includesRoofPlumbing: true,
        roofHeight: 3.5,
        isAsbestosRemoval: true,
        asbestosArea: 15,
        hasBuilderRegNumber: true,
        hasPlumbingLicence: true,
        hasSWMS: true,
        hasEdgeProtection: true,
        hasAsbestosLicence: true,
        hasWorkSafeNotification: true,
      });
      expect(result.passed).toBe(true);
      expect(result.requiredActions).toHaveLength(0);
    });
  });

  describe("Home Building Contracts Act 1991 (WA) — 6.5% Deposit Cap", () => {
    const base = {
      quoteTotalIncGst: 100000,
      jobType: "standard" as const,
      includesRoofPlumbing: false,
      roofHeight: 2.0,
      isAsbestosRemoval: false,
      asbestosArea: 0,
      hasBuilderRegNumber: true,
      hasPlumbingLicence: true,
      hasSWMS: true,
      hasEdgeProtection: true,
      hasAsbestosLicence: false,
      hasWorkSafeNotification: false,
      isResidential: true,
      buildingPermitNumber: "BA1-2026-TEST",
    };

    it("blocks a residential deposit above 6.5%", () => {
      const result = evaluateWACompliance({ ...base, depositAmount: 10000 });
      expect(result.passed).toBe(false);
      expect(result.blockedReason).toMatch(/6\.5% statutory cap/i);
      expect(result.requiredActions.join(" ")).toMatch(/WA Notice for the Home Owner/);
    });

    it("allows a deposit at or below 6.5%", () => {
      const result = evaluateWACompliance({ ...base, depositAmount: 6500 });
      expect(result.passed).toBe(true);
      expect(result.warnings.join(" ")).toMatch(/WA Notice for the Home Owner/);
    });

    it("does not apply the cap to commercial work", () => {
      const result = evaluateWACompliance({ ...base, isResidential: false, depositAmount: 20000 });
      expect(result.passed).toBe(true);
    });
  });

  describe("LGA Building Permit BA1/BA2", () => {
    const base = {
      quoteTotalIncGst: 25000,
      jobType: "structural" as const,
      includesRoofPlumbing: false,
      roofHeight: 2.0,
      isAsbestosRemoval: false,
      asbestosArea: 0,
      hasBuilderRegNumber: true,
      hasPlumbingLicence: true,
      hasSWMS: true,
      hasEdgeProtection: true,
      hasAsbestosLicence: false,
      hasWorkSafeNotification: false,
    };

    it("requires a building permit for work over $20k", () => {
      const result = evaluateWACompliance(base);
      expect(result.passed).toBe(false);
      expect(result.blockedReason).toMatch(/Building Permit/i);
    });

    it("passes when a permit number is supplied", () => {
      const result = evaluateWACompliance({ ...base, buildingPermitNumber: "BA1-2026-001" });
      expect(result.passed).toBe(true);
    });

    it("requires a permit for structural conversion even under $20k", () => {
      const result = evaluateWACompliance({
        ...base,
        quoteTotalIncGst: 15000,
        isStructuralConversion: true,
      });
      expect(result.passed).toBe(false);
    });
  });

  describe("Security of Payment Act 2021 (WA) — 15 business days", () => {
    const base = {
      quoteTotalIncGst: 50000,
      jobType: "standard" as const,
      includesRoofPlumbing: false,
      roofHeight: 1.0,
      isAsbestosRemoval: false,
      asbestosArea: 0,
      hasBuilderRegNumber: true,
      hasPlumbingLicence: true,
      hasSWMS: true,
      hasEdgeProtection: true,
      hasAsbestosLicence: false,
      hasWorkSafeNotification: false,
      buildingPermitNumber: "BA2-2026-TEST",
    };

    it("warns when the Payment Schedule is due soon", () => {
      const result = evaluateWACompliance({ ...base, paymentClaimDaysElapsed: 13 });
      expect(result.passed).toBe(true);
      expect(result.warnings.join(" ")).toMatch(/Payment Schedule due in 2 business day/);
    });

    it("blocks when the Payment Schedule is overdue", () => {
      const result = evaluateWACompliance({ ...base, paymentClaimDaysElapsed: 16 });
      expect(result.passed).toBe(false);
      expect(result.requiredActions.join(" ")).toMatch(/Escalate overdue statutory payment claim/);
    });

    it("passes with ample time remaining", () => {
      const result = evaluateWACompliance({ ...base, paymentClaimDaysElapsed: 5 });
      expect(result.passed).toBe(true);
    });
  });
});
