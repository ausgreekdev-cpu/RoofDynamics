/**
 * RoofDynamics - WA Roof BOM Calculator
 * Exact engineering calculations per RoofDynamics specification.
 */

const COASTAL_SUBURBS = [
  "Fremantle",
  "Scarborough",
  "Cottesloe",
  "Hillarys",
  "Rockingham",
];

const SHEET_COVER_WIDTH = 0.762; // Colorbond Corrugated Custom Orb effective cover width (m)
const BATTEN_SPACING = 0.9; // Topspan 40mm battens at 0.9m centres
const BATTEN_STOCK_LENGTH = 6.5; // Stock length in metres
const ANTICON_COVERAGE = 15; // Anticon 60mm blanket: 15m² per roll
const FASTENERS_STANDARD = 7; // 7 screws per m² standard region
const FASTENERS_CYCLONIC = 10; // 10 screws per m² cyclonic/high-wind ridge
const DEFAULT_WASTE_GABLE = 0.07; // 7% waste for gable
const DEFAULT_WASTE_HIP_VALLEY = 0.12; // 12% waste for hip/valley

export interface RoofBOMInputs {
  planArea: number; // m²
  pitchDegrees: number;
  wastePercentage?: number;
  roofType?: "gable" | "hip_valley";
  suburb?: string;
  isCyclonicZone?: boolean;
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

/**
 * Check if a suburb is in the WA coastal zone (AS/NZS 2728)
 */
function isCoastalSuburb(suburb?: string): boolean {
  if (!suburb) return false;
  return COASTAL_SUBURBS.includes(suburb.trim());
}

/**
 * Calculate the complete Roof BOM
 */
export function calculateRoofBOM(inputs: RoofBOMInputs): RoofBOMResult {
  const { planArea, pitchDegrees, suburb, isCyclonicZone = false } = inputs;
  const wastePercentage =
    inputs.wastePercentage !== undefined
      ? inputs.wastePercentage
      : inputs.roofType === "hip_valley"
        ? DEFAULT_WASTE_HIP_VALLEY
        : DEFAULT_WASTE_GABLE;

  const pitchFactor = calculatePitchFactor(pitchDegrees);
  const trueArea = planArea * pitchFactor * (1 + wastePercentage);
  const coastalSuburb = isCoastalSuburb(suburb);
  const coastalGrade = coastalSuburb || isCyclonicZone;

  // Colorbond Corrugated (Custom Orb) sheets: effective cover 0.762m
  const sheets = Math.ceil(trueArea / SHEET_COVER_WIDTH);

  // Roof battens: lineal metres = ceil(TrueArea / 0.9), divided by 6.5m stock lengths
  const battenLinealMetres = Math.ceil(trueArea / BATTEN_SPACING);
  const battenStockLengths = Math.ceil(battenLinealMetres / BATTEN_STOCK_LENGTH);

  // Anticon 60mm insulation: rolls = ceil(TrueArea / 15)
  const insulationRolls = Math.ceil(trueArea / ANTICON_COVERAGE);

  // Fasteners: 7 screws/m² standard, 10 screws/m² cyclonic/high-wind ridge
  const fastenersPerM2 = isCyclonicZone || coastalGrade ? FASTENERS_CYCLONIC : FASTENERS_STANDARD;
  const fasteners = Math.ceil(trueArea * fastenersPerM2);

  // Build line items with cost estimates
  const sheetUnitCost = coastalGrade ? 45.0 : 32.0; // per sheet
  const battenUnitCost = 8.50; // per lineal metre
  const insulationUnitCost = coastalGrade ? 85.0 : 65.0; // per roll
  const fastenerUnitCost = coastalGrade ? 0.85 : 0.65; // per screw

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
      itemName: coastalGrade
        ? "12g x 65mm Class 4 Stainless 316 Crest Screws (Coastal)"
        : "12g x 65mm Crest Screws with Neo Washers (Standard)",
      quantity: fasteners,
      unit: "screws",
      unitCost: fastenerUnitCost,
      totalCost: fasteners * fastenerUnitCost,
      isCoastalGrade: coastalGrade,
    },
  ];

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
    items,
  };
}

export { COASTAL_SUBURBS, isCoastalSuburb };
