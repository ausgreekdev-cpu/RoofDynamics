import { describe, it, expect } from "vitest";
import { calculateRoofBOM, isCoastalSuburb, COASTAL_SUBURBS } from "./roofBomCalculator";

describe("roofBomCalculator", () => {
  describe("Pitch Factor", () => {
    it("should calculate pitch factor for 0 degrees (flat roof)", () => {
      const result = calculateRoofBOM({ planArea: 100, pitchDegrees: 0 });
      expect(result.pitchFactor).toBe(1);
    });

    it("should calculate pitch factor for 22 degrees", () => {
      const result = calculateRoofBOM({ planArea: 100, pitchDegrees: 22 });
      // 1 / cos(22 * PI / 180) = 1 / cos(0.384) ≈ 1.078
      expect(result.pitchFactor).toBeCloseTo(1.078, 2);
    });

    it("should calculate pitch factor for 45 degrees", () => {
      const result = calculateRoofBOM({ planArea: 100, pitchDegrees: 45 });
      // 1 / cos(45 * PI / 180) = 1 / cos(0.785) ≈ 1.414
      expect(result.pitchFactor).toBeCloseTo(1.414, 2);
    });
  });

  describe("True Roof Surface Area", () => {
    it("should calculate true area with 7% waste for gable roof", () => {
      const result = calculateRoofBOM({ planArea: 100, pitchDegrees: 0, roofType: "gable" });
      // 100 * 1 * 1.07 = 107
      expect(result.trueArea).toBe(107);
    });

    it("should calculate true area with 12% waste for hip/valley roof", () => {
      const result = calculateRoofBOM({ planArea: 100, pitchDegrees: 0, roofType: "hip_valley" });
      // 100 * 1 * 1.12 = 112
      expect(result.trueArea).toBe(112);
    });

    it("should use custom waste percentage when provided", () => {
      const result = calculateRoofBOM({ planArea: 100, pitchDegrees: 0, wastePercentage: 0.15 });
      // 100 * 1 * 1.15 = 115
      expect(result.trueArea).toBe(115);
    });
  });

  describe("Colorbond Sheets", () => {
    it("should calculate sheet count with effective cover 0.762m", () => {
      const result = calculateRoofBOM({ planArea: 100, pitchDegrees: 0 });
      // trueArea = 107, sheets = ceil(107 / 0.762) = ceil(140.42) = 141
      expect(result.sheets).toBe(141);
    });
  });

  describe("Roof Battens", () => {
    it("should calculate batten lineal metres at 0.9m centres", () => {
      const result = calculateRoofBOM({ planArea: 100, pitchDegrees: 0 });
      // trueArea = 107, lineal = ceil(107 / 0.9) = ceil(118.89) = 119
      expect(result.battenLinealMetres).toBe(119);
    });

    it("should calculate batten stock lengths (6.5m)", () => {
      const result = calculateRoofBOM({ planArea: 100, pitchDegrees: 0 });
      // 119 / 6.5 = 18.31 → ceil = 19
      expect(result.battenStockLengths).toBe(19);
    });
  });

  describe("Anticon Insulation", () => {
    it("should calculate insulation rolls (15m² per roll)", () => {
      const result = calculateRoofBOM({ planArea: 100, pitchDegrees: 0 });
      // trueArea = 107, rolls = ceil(107 / 15) = ceil(7.13) = 8
      expect(result.insulationRolls).toBe(8);
    });
  });

  describe("Fasteners", () => {
    it("should use 7 screws/m² for standard region", () => {
      const result = calculateRoofBOM({ planArea: 100, pitchDegrees: 0 });
      // trueArea = 107, fasteners = ceil(107 * 7) = 749
      expect(result.fasteners).toBe(749);
    });

    it("should use 10 screws/m² for cyclonic zone", () => {
      const result = calculateRoofBOM({ planArea: 100, pitchDegrees: 0, isCyclonicZone: true });
      // trueArea = 107, fasteners = ceil(107 * 10) = 1070
      expect(result.fasteners).toBe(1070);
    });
  });

  describe("Coastal Zone (AS/NZS 2728)", () => {
    it("should detect coastal suburb", () => {
      expect(isCoastalSuburb("Fremantle")).toBe(true);
      expect(isCoastalSuburb("Scarborough")).toBe(true);
      expect(isCoastalSuburb("Cottesloe")).toBe(true);
      expect(isCoastalSuburb("Hillarys")).toBe(true);
      expect(isCoastalSuburb("Rockingham")).toBe(true);
    });

    it("should not detect non-coastal suburb", () => {
      expect(isCoastalSuburb("Midland")).toBe(false);
      expect(isCoastalSuburb("Armadale")).toBe(false);
      expect(isCoastalSuburb("Joondalup")).toBe(false);
    });

    it("should flag coastal grade when suburb is coastal", () => {
      const result = calculateRoofBOM({ planArea: 100, pitchDegrees: 0, suburb: "Fremantle" });
      expect(result.coastalGrade).toBe(true);
      expect(result.coastalSuburb).toBe(true);
    });

    it("should upgrade materials to Colorbond Ultra for coastal zone", () => {
      const result = calculateRoofBOM({ planArea: 100, pitchDegrees: 0, suburb: "Fremantle" });
      const sheetItem = result.items.find((i) => i.itemType === "sheet");
      expect(sheetItem?.itemName).toContain("Colorbond Ultra");
      expect(sheetItem?.isCoastalGrade).toBe(true);
    });

    it("should use stainless 316 fasteners for coastal zone", () => {
      const result = calculateRoofBOM({ planArea: 100, pitchDegrees: 0, suburb: "Fremantle" });
      const fastenerItem = result.items.find((i) => i.itemType === "fastener");
      expect(fastenerItem?.itemName).toContain("Stainless 316");
      expect(fastenerItem?.isCoastalGrade).toBe(true);
    });
  });

  describe("BOM Line Items", () => {
    it("should generate 5 line items", () => {
      const result = calculateRoofBOM({ planArea: 100, pitchDegrees: 22, suburb: "Midland" });
      expect(result.items.length).toBe(5);
    });

    it("should include sheet, batten, batten_stock, insulation, fastener", () => {
      const result = calculateRoofBOM({ planArea: 100, pitchDegrees: 22, suburb: "Midland" });
      const types = result.items.map((i) => i.itemType);
      expect(types).toContain("sheet");
      expect(types).toContain("batten");
      expect(types).toContain("batten_stock");
      expect(types).toContain("insulation");
      expect(types).toContain("fastener");
    });
  });

  describe("COASTAL_SUBURBS export", () => {
    it("should contain all 5 coastal suburbs", () => {
      expect(COASTAL_SUBURBS).toHaveLength(5);
      expect(COASTAL_SUBURBS).toContain("Fremantle");
      expect(COASTAL_SUBURBS).toContain("Scarborough");
      expect(COASTAL_SUBURBS).toContain("Cottesloe");
      expect(COASTAL_SUBURBS).toContain("Hillarys");
      expect(COASTAL_SUBURBS).toContain("Rockingham");
    });
  });
});
