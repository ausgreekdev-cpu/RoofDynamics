/** Pure ROI calculator helpers for the public marketing site. */
export interface RoiInputs {
  annualJobs: number
  avgJobValue: number
  hoursSavedPerJob: number
  hourlyCost: number
  monthlySoftwareCost: number
}

export interface RoiResult {
  annualRevenue: number
  annualLabourSaving: number
  annualSoftwareCost: number
  netAnnualBenefit: number
  roiPercent: number
  paybackMonths: number
}

export function calculateRoi(i: RoiInputs): RoiResult {
  const annualRevenue = i.annualJobs * i.avgJobValue
  const annualLabourSaving = i.annualJobs * i.hoursSavedPerJob * i.hourlyCost
  const annualSoftwareCost = i.monthlySoftwareCost * 12
  const netAnnualBenefit = annualLabourSaving - annualSoftwareCost
  const roiPercent = annualSoftwareCost > 0 ? (netAnnualBenefit / annualSoftwareCost) * 100 : 0
  const paybackMonths = netAnnualBenefit > 0 ? Math.round((annualSoftwareCost / netAnnualBenefit) * 12 * 10) / 10 : 0
  return { annualRevenue, annualLabourSaving, annualSoftwareCost, netAnnualBenefit, roiPercent, paybackMonths }
}

export const DEFAULT_ROI: RoiInputs = {
  annualJobs: 120,
  avgJobValue: 18000,
  hoursSavedPerJob: 4,
  hourlyCost: 45,
  monthlySoftwareCost: 199,
}
