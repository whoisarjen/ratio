export type TaxYear = '2026' | '2025'

export type RateType = 'hourly' | 'daily' | 'monthly' | 'annual'

export type ZusType =
  | 'normal'       // Full ZUS (big)
  | 'preferential' // Preferential (2 years)
  | 'health_only'  // Only health insurance (ulga na start - 6 months)
  | 'no_zus'       // Without ZUS

export type TaxationType =
  | 'progressive'  // Skala podatkowa 12%/32%
  | 'linear'       // Podatek liniowy 19%
  | 'lump_sum'     // Ryczałt
  | 'ip_box'       // IP BOX 5%

export type LumpSumRate =
  | 17 | 15 | 14 | 12.5 | 12 | 10 | 8.5 | 5.5 | 3 | 2

export interface LumpSumOption {
  rate: LumpSumRate
  label: string
  description: string
}

export interface CalculatorInput {
  grossAmount: number
  rateType: RateType
  taxYear: TaxYear
  zusType: ZusType
  sickInsurance: boolean
  taxationType: TaxationType
  lumpSumRate: LumpSumRate
  monthlyCosts: number
  paidVacationDays: number
  workingDaysPerYear: number
  yourWorkingDays: number
  includeVat: boolean
  // IP BOX specific
  ipBoxPercentage: number  // % of income qualifying for IP BOX (0-100)
}

export interface ZusBreakdown {
  retirement: number
  disability: number
  sickness: number
  accident: number
  laborFund: number
  healthInsurance: number
  totalSocial: number
  totalWithHealth: number
}

export interface TaxBreakdown {
  name: string
  base: number
  rate: string
  amount: number
}

export interface CalculationResult {
  // Income
  grossAnnual: number
  grossMonthly: number
  grossDaily: number
  grossHourly: number

  // Net
  netAnnual: number
  netMonthly: number
  netDaily: number
  netHourly: number

  // Costs
  pitAnnual: number
  pitMonthly: number
  zusAnnual: number
  zusMonthly: number
  healthInsuranceAnnual: number
  healthInsuranceMonthly: number
  costsAnnual: number

  // Effective rate
  effectiveTaxRate: number

  // VAT
  vatMonthly: number
  invoiceGrossMonthly: number

  // Breakdowns
  zusBreakdown: ZusBreakdown
  taxBreakdowns: TaxBreakdown[]

  // Working info
  workingDaysPerYear: number
  yourWorkingDays: number
}

export interface YearConstants {
  year: TaxYear
  minimumWage: number
  averageSalary: number
  zusBase: number              // 60% of avg salary
  preferentialZusBase: number  // 30% of min wage
  retirementRate: number       // 19.52%
  disabilityRate: number       // 8%
  sicknessRate: number         // 2.45%
  accidentRate: number         // 1.67%
  laborFundRate: number        // 2.45%
  healthRate: number           // 9% for progressive, base for calculation
  healthRateLinear: number     // 4.9% for linear tax
  minHealthBase: number        // Minimum health insurance base
  pitThreshold: number         // 120,000 PLN
  taxFreeAmount: number        // 30,000 PLN
  pitRate1: number             // 12%
  pitRate2: number             // 32%
  linearRate: number           // 19%
  ipBoxRate: number            // 5%
  vatRate: number              // 23%
  workingDays: number          // ~251
  // Ryczałt health brackets
  ryczaltHealthBracket1Limit: number  // 60,000
  ryczaltHealthBracket2Limit: number  // 300,000
  ryczaltHealthAmount1: number
  ryczaltHealthAmount2: number
  ryczaltHealthAmount3: number
  // Health deduction limit for linear tax
  healthDeductionLimitLinear: number
}
