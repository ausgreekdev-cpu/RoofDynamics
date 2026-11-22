/**
 * RoofDynamics - WA Roof BOM Calculator
 * Exact engineering calculations per the RoofDynamics AGENTS.md specification.
 *
 * Regulatory drivers:
 *  - AS/NZS 2728 coastal corrosion (<1km surf) -> Colorbond Ultra + Class 4 / 316 SS
 *  - Darling Scarp / coastal high-wind ridge -> 10 screws/m² (else 7)
 *  - AS 3959 bushfire prone (BAL-19 / BAL-29) -> Ember Guard mesh + Sarking
 */

const COASTAL_SUBURBS = [
  "Fremantle",
  "Scarborough",
  "Cottesloe",
  "Hillarys",
  "Rockingham",
];

// Darling Scarp / high-wind ridge suburbs (10 screws/m²)
const DARLING_SCARP_SUBURBS = [
  "Kalamunda",
  "Mundaring",
  "Roleystone",
  "Wungong",
  "Armadale",
];

// AS 3959 bushfire prone suburbs. BAL-29 assigned to the higher-risk scarp
// suburbs; BAL-19 to the foothill suburbs. Deterministic per AGENTS.md.
const BAL_29_SUBURBS = ["Kalamunda", "Mundaring", "Roleystone"];
const BAL_19_SUBURBS = ["Wungong", "Armadale"];

const SHEET_COVER_WIDTH = 0.762; // Colorbond Corrugated Custom Orb effective cover width (m)
const BATTEN_SPACING = 0.9; // Topspan 40mm battens at 0.9m centres
const BATTEN_STOCK_LENGTH = 6.5; // Stock length in metres
const ANTICON_COVERAGE = 15; // Anticon 60mm blanket: 15m² per roll
const FASTENERS_STANDARD = 7; // 7 screws per m² standard region
const FASTENERS_HIGH_WIND = 10; // 10 screws/m² coastal / Darling Scarp ridge
const DEFAULT_WASTE_GABLE = 0.07; // 7% waste for gable
const DEFAULT_WASTE_HIP_VALLEY = 0.12; // 12% waste for hip/valley
const RUN_RATIO = 1.5; // assumed sheet-run length:width ratio for cut-length derivation

export type BalRating = "BAL-19" | "BAL-29" | null;

export interface SheetRun {
  plane: number;
  planeAreaM2: number;
  widthM: number;
  cutLengthMm: number;
  sheetsAcross: number;
}

export interface RoofBOMInputs {
  planArea: number; // m²
  pitchDegrees: number;
  wastePercentage?: number;
  roofType?: "gable" | "hip_valley";
  suburb?: string;
  /** Legacy flag — forces high-wind fastener rate */
  isCyclonicZone?: boolean;
  /** Optional live cost overrides (Wave 1.1) keyed by item type, e.g. { "Colorbond Sheet": 34.5 } */
  costOverrides?: Record<string, number>;
}

export interface RoofBOMResult {
  pitchFactor: number;
  trueArea: number; // m²
  sheets: number;
  battenLinealMetres: number;
  battenStockLengths: number;
  insulationRolls: number;
  fasteners: number;
  coastalGrade: boolean;
  coastalSuburb: boolean;
  highWindZone: boolean;
  darlingScarp: boolean;
  bushfireProne: boolean;
  balRating: BalRating;
  emberGuardRequired: boolean;
  sarkingRequired: boolean;
  sheetRollingSchedule: SheetRun[];
  items: Array<{
    itemType: string;
    itemName: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
    isCoastalGrade: boolean;
  }>;
}

/**
 * Calculate pitch factor: 1 / cos(pitchDegrees * PI / 180)
 */
function calculatePitchFactor(pitchDegrees: number): number {
  const radians = (pitchDegrees * Math.PI) / 180;
  return 1 / Math.cos(radians);
}

function normaliseSuburb(suburb?: string): string {
  return (suburb || "").trim();
}

/** Check if a suburb is in the WA coastal zone (AS/NZS 2728 <1km surf). */
function isCoastalSuburb(suburb?: string): boolean {
  const s = normaliseSuburb(suburb);
  return COASTAL_SUBURBS.includes(s);
}

/** Darling Scarp high-wind ridge suburb (10 screws/m²). */
function isDarlingScarpSuburb(suburb?: string): boolean {
  const s = normaliseSuburb(suburb);
  return DARLING_SCARP_SUBURBS.includes(s);
}

/** AS 3959 BAL rating for bushfire-prone suburbs. */
export function balRatingFor(suburb?: string): BalRating {
  const s = normaliseSuburb(suburb);
  if (BAL_29_SUBURBS.includes(s)) return "BAL-29";
  if (BAL_19_SUBURBS.includes(s)) return "BAL-19";
  return null;
}

/**
 * Derive exact sheet cut-length runs per roof plane (millimetres).
 * Each plane's area is split from the true area; width derived from the
 * plan geometry using RUN_RATIO, then cut length = plane length in mm rounded
 * to the nearest 5mm. Sheets across = ceil(width / 0.762).
 */
function buildSheetRollingSchedule(
  trueArea: number,
  roofType: "gable" | "hip_valley",
  pitchFactor: number
): SheetRun[] {
  const planeCount = roofType === "hip_valley" ? 4 : 2;
  const planeArea = trueArea / planeCount;
  const runs: SheetRun[] = [];

  for (let i = 0; i < planeCount; i++) {
    // Width from area with the run-ratio assumption, adjusted for pitch slope
    const widthM = Math.sqrt(Math.max(planeArea, 0) / RUN_RATIO);
    const lengthM = Math.max(planeArea, 0) / Math.max(widthM, 0.001);
    const cutLengthMm = Math.ceil((lengthM * pitchFactor * 1000) / 5) * 5;
    const sheetsAcross = Math.ceil(widthM / SHEET_COVER_WIDTH);
    runs.push({
      plane: i + 1,
      planeAreaM2: Math.round(planeArea * 100) / 100,
      widthM: Math.round(widthM * 1000) / 1000,
      cutLengthMm,
      sheetsAcross,
    });
  }
  return runs;
}

/**
 * Calculate the complete Roof BOM
 */
export function calculateRoofBOM(inputs: RoofBOMInputs): RoofBOMResult {
  const { planArea, pitchDegrees, suburb, isCyclonicZone = false } = inputs;
  const roofType = inputs.roofType || "gable";
  const wastePercentage =
    inputs.wastePercentage !== undefined
      ? inputs.wastePercentage
      : roofType === "hip_valley"
        ? DEFAULT_WASTE_HIP_VALLEY
        : DEFAULT_WASTE_GABLE;

  const pitchFactor = calculatePitchFactor(pitchDegrees);
  const trueArea = planArea * pitchFactor * (1 + wastePercentage);
  const coastalSuburb = isCoastalSuburb(suburb);
  const darlingScarp = isDarlingScarpSuburb(suburb);
  const highWindZone = coastalSuburb || darlingScarp || isCyclonicZone;
  const coastalGrade = coastalSuburb || isCyclonicZone;
  const balRating = balRatingFor(suburb);
  const bushfireProne = balRating !== null;
  const emberGuardRequired = bushfireProne;
  const sarkingRequired = bushfireProne;

  // Colorbond Corrugated (Custom Orb) sheets: effective cover 0.762m
  const sheets = Math.ceil(trueArea / SHEET_COVER_WIDTH);

  // Roof battens: lineal metres = ceil(TrueArea / 0.9), divided by 6.5m stock lengths
  const battenLinealMetres = Math.ceil(trueArea / BATTEN_SPACING);
  const battenStockLengths = Math.ceil(battenLinealMetres / BATTEN_STOCK_LENGTH);

  // Anticon 60mm insulation: rolls = ceil(TrueArea / 15)
  const insulationRolls = Math.ceil(trueArea / ANTICON_COVERAGE);

  // Fasteners: 7/m² standard, 10/m² coastal / Darling Scarp high-wind ridge
  const fastenersPerM2 = highWindZone ? FASTENERS_HIGH_WIND : FASTENERS_STANDARD;
  const fasteners = Math.ceil(trueArea * fastenersPerM2);

  const sheetRollingSchedule = buildSheetRollingSchedule(trueArea, roofType, pitchFactor);

  // Build line items with cost estimates
  const sheetUnitCost = coastalGrade ? 45.0 : 32.0;
  const battenUnitCost = 8.50;
  const insulationUnitCost = coastalGrade ? 85.0 : 65.0;
  const fastenerUnitCost = coastalGrade ? 0.85 : 0.65;

  const items = [
    {
      itemType: "sheet",
      itemName: coastalGrade ? "Colorbond Ultra Corrugated Sheet (Coastal Grade)" : "Colorbond Corrugated Sheet (Custom Orb)",
      quantity: sheets,
      unit: "sheets",
      unitCost: sheetUnitCost,
      totalCost: sheets * sheetUnitCost,
      isCoastalGrade: coastalGrade,
    },
    {
      itemType: "batten",
      itemName: "Topspan 40mm Roof Batten",
      quantity: battenLinealMetres,
      unit: "lineal metres",
      unitCost: battenUnitCost,
      totalCost: battenLinealMetres * battenUnitCost,
      isCoastalGrade: false,
    },
    {
      itemType: "batten_stock",
      itemName: "Topspan 40mm Batten Stock Lengths (6.5m)",
      quantity: battenStockLengths,
      unit: "lengths",
      unitCost: battenUnitCost * BATTEN_STOCK_LENGTH,
      totalCost: battenStockLengths * battenUnitCost * BATTEN_STOCK_LENGTH,
      isCoastalGrade: false,
    },
    {
      itemType: "insulation",
      itemName: "Anticon 60mm Insulation Blanket",
      quantity: insulationRolls,
      unit: "rolls",
      unitCost: insulationUnitCost,
      totalCost: insulationRolls * insulationUnitCost,
      isCoastalGrade: coastalGrade,
    },
    {
      itemType: "fastener",
      itemName: highWindZone
        ? "12g x 65mm Class 4 / 316 Stainless Crest Screws (High-Wind)"
        : "12g x 65mm Crest Screws with Neo Washers (Standard)",
      quantity: fasteners,
      unit: "screws",
      unitCost: fastenerUnitCost,
      totalCost: fasteners * fastenerUnitCost,
      isCoastalGrade: coastalGrade,
    },
  ];

  // AS 3959 bushfire additions
  if (emberGuardRequired) {
    const meshSheets = Math.ceil(trueArea / 2);
    items.push({
      itemType: "ember_guard",
      itemName: `Ember Guard Mesh (${balRating} — AS 3959)`,
      quantity: meshSheets,
      unit: "sheets",
      unitCost: 55.0,
      totalCost: meshSheets * 55.0,
      isCoastalGrade: false,
    });
  }
  if (sarkingRequired) {
    const sarkingRolls = Math.ceil(trueArea / 20);
    items.push({
      itemType: "sarking",
      itemName: `Sarking / Rigid Sheet (${balRating} — AS 3959)`,
      quantity: sarkingRolls,
      unit: "rolls",
      unitCost: 75.0,
      totalCost: sarkingRolls * 75.0,
      isCoastalGrade: false,
    });
  }

  const overrides = inputs.costOverrides || {};
  const finalItems = items.map((it) => {
    const o = overrides[it.itemType];
    if (o === undefined) return it;
    return { ...it, unitCost: o, totalCost: Math.round(it.quantity * o * 100) / 100 };
  });

  return {
    pitchFactor: Math.round(pitchFactor * 1000) / 1000,
    trueArea: Math.round(trueArea * 100) / 100,
    sheets,
    battenLinealMetres,
    battenStockLengths,
    insulationRolls,
    fasteners,
    coastalGrade,
    coastalSuburb,
    highWindZone,
    darlingScarp,
    bushfireProne,
    balRating,
    emberGuardRequired,
    sarkingRequired,
    sheetRollingSchedule,
    items: finalItems,
  };
}

export {
  COASTAL_SUBURBS,
  DARLING_SCARP_SUBURBS,
  BAL_29_SUBURBS,
  BAL_19_SUBURBS,
  isCoastalSuburb,
};
