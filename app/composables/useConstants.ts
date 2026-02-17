import type { YearConstants, LumpSumOption, TaxYear } from '~/types/calculator'

export const LUMP_SUM_OPTIONS: LumpSumOption[] = [
  { rate: 17, label: '17%', description: 'Wolne zawody / uslugi dla podmiotow powiazanych' },
  { rate: 15, label: '15%', description: 'Ogolne' },
  { rate: 14, label: '14%', description: 'Ochrona zdrowia, architekci' },
  { rate: 12.5, label: '12,5%', description: 'Uslugi zwiazane z oprogramowaniem' },
  { rate: 12, label: '12%', description: 'IT (programisci)' },
  { rate: 10, label: '10%', description: 'Nieruchomosci' },
  { rate: 8.5, label: '8,5%', description: 'Najem / IT (testerzy)' },
  { rate: 5.5, label: '5,5%', description: 'Budownictwo' },
  { rate: 3, label: '3%', description: 'Gastronomia' },
  { rate: 2, label: '2%', description: 'Inne' },
]

const YEAR_2026: YearConstants = {
  year: '2026',
  minimumWage: 4806,
  averageSalary: 9420,
  zusBase: 5652,               // 60% × 9420
  preferentialZusBase: 1441.80, // 30% × 4806
  retirementRate: 0.1952,
  disabilityRate: 0.08,
  sicknessRate: 0.0245,
  accidentRate: 0.0167,
  laborFundRate: 0.0245,
  healthRate: 0.09,
  healthRateLinear: 0.049,
  minHealthBase: 4806,         // 100% of minimum wage
  pitThreshold: 120000,
  taxFreeAmount: 30000,
  pitRate1: 0.12,
  pitRate2: 0.32,
  linearRate: 0.19,
  ipBoxRate: 0.05,
  vatRate: 0.23,
  workingDays: 251,
  ryczaltHealthBracket1Limit: 60000,
  ryczaltHealthBracket2Limit: 300000,
  ryczaltHealthAmount1: 498.35,
  ryczaltHealthAmount2: 830.58,
  ryczaltHealthAmount3: 1495.04,
  healthDeductionLimitLinear: 14100,
}

const YEAR_2025: YearConstants = {
  year: '2025',
  minimumWage: 4666,
  averageSalary: 8673,
  zusBase: 5203.80,
  preferentialZusBase: 1399.80,
  retirementRate: 0.1952,
  disabilityRate: 0.08,
  sicknessRate: 0.0245,
  accidentRate: 0.0167,
  laborFundRate: 0.0245,
  healthRate: 0.09,
  healthRateLinear: 0.049,
  minHealthBase: 4666,
  pitThreshold: 120000,
  taxFreeAmount: 30000,
  pitRate1: 0.12,
  pitRate2: 0.32,
  linearRate: 0.19,
  ipBoxRate: 0.05,
  vatRate: 0.23,
  workingDays: 250,
  ryczaltHealthBracket1Limit: 60000,
  ryczaltHealthBracket2Limit: 300000,
  ryczaltHealthAmount1: 461.66,
  ryczaltHealthAmount2: 769.44,
  ryczaltHealthAmount3: 1384.97,
  healthDeductionLimitLinear: 12900,
}

const CONSTANTS_BY_YEAR: Record<TaxYear, YearConstants> = {
  '2026': YEAR_2026,
  '2025': YEAR_2025,
}

export function useConstants() {
  function getConstants(year: TaxYear): YearConstants {
    return CONSTANTS_BY_YEAR[year]
  }

  return {
    getConstants,
    LUMP_SUM_OPTIONS,
    CONSTANTS_BY_YEAR,
  }
}
