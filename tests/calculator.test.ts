import { describe, it, expect } from 'vitest'
import type { CalculatorInput } from '~/types/calculator'
import { useTaxCalculator } from '~/composables/useTaxCalculator'

const { calculate } = useTaxCalculator()

// Helper: default input with overrides
function input(overrides: Partial<CalculatorInput> = {}): CalculatorInput {
  return {
    grossAmount: 10000,
    rateType: 'monthly',
    taxYear: '2026',
    zusType: 'normal',
    sickInsurance: true,
    taxationType: 'progressive',
    lumpSumRate: 12,
    monthlyCosts: 0,
    paidVacationDays: 26,
    workingDaysPerYear: 251,
    yourWorkingDays: 225,
    includeVat: false,
    ipBoxPercentage: 100,
    ...overrides,
  }
}

// Tolerance for floating point (2 decimal places)
const PRECISION = 2

function expectClose(actual: number, expected: number) {
  expect(actual).toBeCloseTo(expected, PRECISION)
}

// ============================================================
// ZUS CONTRIBUTION AMOUNTS
// Full ZUS base 2026 = 5,652 PLN
// Preferential base 2026 = 1,441.80 PLN
// ============================================================

describe('ZUS Contributions', () => {
  describe('Full ZUS (normal)', () => {
    it('calculates correct ZUS breakdown with sickness', () => {
      const r = calculate(input({ zusType: 'normal', sickInsurance: true }))
      expectClose(r.zusBreakdown.retirement, 1103.27)  // 5652 * 0.1952
      expectClose(r.zusBreakdown.disability, 452.16)   // 5652 * 0.08
      expectClose(r.zusBreakdown.sickness, 138.47)     // 5652 * 0.0245
      expectClose(r.zusBreakdown.accident, 94.39)      // 5652 * 0.0167
      expectClose(r.zusBreakdown.laborFund, 138.47)    // 5652 * 0.0245
      expectClose(r.zusBreakdown.totalSocial, 1926.76)
    })

    it('calculates correct ZUS without sickness', () => {
      const r = calculate(input({ zusType: 'normal', sickInsurance: false }))
      expectClose(r.zusBreakdown.sickness, 0)
      expectClose(r.zusBreakdown.retirement, 1103.27)
      expectClose(r.zusBreakdown.disability, 452.16)
      expectClose(r.zusBreakdown.accident, 94.39)
      expectClose(r.zusBreakdown.laborFund, 138.47)
      // totalSocial = 1103.27 + 452.16 + 0 + 94.39 + 138.47 = 1788.29
      expectClose(r.zusBreakdown.totalSocial, 1788.29)
    })

    it('deductible ZUS excludes labor fund', () => {
      const r = calculate(input({ zusType: 'normal', sickInsurance: true }))
      // zusMonthly = retirement + disability + sickness + accident (NO labor fund)
      // = 1103.27 + 452.16 + 138.47 + 94.39 = 1788.29
      expectClose(r.zusMonthly, 1788.29)
      expectClose(r.zusAnnual, 21459.48) // 1788.29 * 12
    })
  })

  describe('Preferential ZUS', () => {
    it('calculates correct preferential breakdown with sickness', () => {
      const r = calculate(input({ zusType: 'preferential', sickInsurance: true }))
      expectClose(r.zusBreakdown.retirement, 281.44)  // 1441.80 * 0.1952
      expectClose(r.zusBreakdown.disability, 115.34)  // 1441.80 * 0.08
      expectClose(r.zusBreakdown.sickness, 35.32)     // 1441.80 * 0.0245
      expectClose(r.zusBreakdown.accident, 24.08)     // 1441.80 * 0.0167
      expectClose(r.zusBreakdown.laborFund, 0)        // excluded for preferential
    })

    it('deductible ZUS for preferential', () => {
      const r = calculate(input({ zusType: 'preferential', sickInsurance: true }))
      // 281.44 + 115.34 + 35.32 + 24.08 = 456.18
      expectClose(r.zusMonthly, 456.18)
      expectClose(r.zusAnnual, 5474.16)
    })

    it('preferential without sickness', () => {
      const r = calculate(input({ zusType: 'preferential', sickInsurance: false }))
      expectClose(r.zusBreakdown.sickness, 0)
      // 281.44 + 115.34 + 0 + 24.08 = 420.86
      expectClose(r.zusMonthly, 420.86)
    })
  })

  describe('Health-only ZUS', () => {
    it('returns zero social contributions', () => {
      const r = calculate(input({ zusType: 'health_only' }))
      expectClose(r.zusBreakdown.retirement, 0)
      expectClose(r.zusBreakdown.disability, 0)
      expectClose(r.zusBreakdown.sickness, 0)
      expectClose(r.zusBreakdown.accident, 0)
      expectClose(r.zusBreakdown.laborFund, 0)
      expectClose(r.zusMonthly, 0)
      expectClose(r.zusAnnual, 0)
    })

    it('still calculates health insurance', () => {
      const r = calculate(input({ zusType: 'health_only', taxationType: 'lump_sum', lumpSumRate: 12 }))
      // grossAnnual = 120,000 → bracket 2 → 830.58/month
      expectClose(r.healthInsuranceMonthly, 830.58)
    })
  })

  describe('No ZUS', () => {
    it('returns zero for everything including health', () => {
      const r = calculate(input({ zusType: 'no_zus' }))
      expectClose(r.zusBreakdown.retirement, 0)
      expectClose(r.zusBreakdown.disability, 0)
      expectClose(r.zusBreakdown.sickness, 0)
      expectClose(r.zusBreakdown.accident, 0)
      expectClose(r.zusBreakdown.laborFund, 0)
      expectClose(r.zusMonthly, 0)
      expectClose(r.healthInsuranceMonthly, 0)
      expectClose(r.healthInsuranceAnnual, 0)
    })
  })
})

// ============================================================
// HEALTH INSURANCE
// ============================================================

describe('Health Insurance', () => {
  describe('Progressive (9%)', () => {
    it('calculates 9% of income at 10k/month', () => {
      const r = calculate(input({ taxationType: 'progressive' }))
      // income = 120000 - 0 - 21459.48 = 98540.52
      // monthly = 98540.52 / 12 = 8211.71
      // health = round(8211.71 * 0.09) = round(739.0539) = 739.05
      expectClose(r.healthInsuranceMonthly, 739.05)
    })

    it('applies minimum health when income is low', () => {
      const r = calculate(input({ grossAmount: 2000, taxationType: 'progressive' }))
      // income = 24000 - 21459.48 = 2540.52
      // monthly = 211.71, health = round(211.71 * 0.09) = 19.05
      // min = round(4806 * 0.09) = 432.54
      // max(19.05, 432.54) = 432.54
      expectClose(r.healthInsuranceMonthly, 432.54)
    })
  })

  describe('Linear (4.9%)', () => {
    it('calculates 4.9% of income at 10k/month', () => {
      const r = calculate(input({ taxationType: 'linear' }))
      // income = 120000 - 0 - 21459.48 = 98540.52
      // monthly = 8211.71, health = round(8211.71 * 0.049) = 402.37
      // min = 432.54, max(402.37, 432.54) = 432.54 ← minimum kicks in!
      expectClose(r.healthInsuranceMonthly, 432.54)
    })

    it('uses 4.9% when income is high enough', () => {
      const r = calculate(input({ grossAmount: 30000, taxationType: 'linear' }))
      // income = 360000 - 0 - 21459.48 = 338540.52
      // monthly = 28211.71, health = round(28211.71 * 0.049) = 1382.37
      // min = 432.54, max(1382.37, 432.54) = 1382.37
      expectClose(r.healthInsuranceMonthly, 1382.37)
    })
  })

  describe('IP BOX (uses linear 4.9%)', () => {
    it('uses linear health rate for IP BOX', () => {
      const r = calculate(input({ taxationType: 'ip_box' }))
      // Same as linear at 10k: minimum 432.54 kicks in
      expectClose(r.healthInsuranceMonthly, 432.54)
    })
  })

  describe('Ryczalt (bracket-based)', () => {
    it('bracket 1: revenue <= 60,000', () => {
      const r = calculate(input({
        grossAmount: 5000,
        taxationType: 'lump_sum',
        lumpSumRate: 12,
      }))
      // 5000 * 12 = 60,000 ≤ 60,000 → bracket 1
      expectClose(r.healthInsuranceMonthly, 498.35)
    })

    it('bracket 2: revenue > 60,000 and <= 300,000', () => {
      const r = calculate(input({
        grossAmount: 10000,
        taxationType: 'lump_sum',
        lumpSumRate: 12,
      }))
      // 10000 * 12 = 120,000 → bracket 2
      expectClose(r.healthInsuranceMonthly, 830.58)
    })

    it('bracket 3: revenue > 300,000', () => {
      const r = calculate(input({
        grossAmount: 35000,
        taxationType: 'lump_sum',
        lumpSumRate: 12,
      }))
      // 35000 * 12 = 420,000 > 300,000 → bracket 3
      expectClose(r.healthInsuranceMonthly, 1495.04)
    })

    it('boundary: exactly 60,000 is bracket 1', () => {
      const r = calculate(input({
        grossAmount: 5000,
        taxationType: 'lump_sum',
        lumpSumRate: 12,
      }))
      // 60000 <= 60000 → bracket 1
      expectClose(r.healthInsuranceMonthly, 498.35)
    })

    it('boundary: 60,001 is bracket 2', () => {
      const r = calculate(input({
        grossAmount: 60001,
        rateType: 'annual',
        taxationType: 'lump_sum',
        lumpSumRate: 12,
      }))
      // 60001 > 60000 → bracket 2
      expectClose(r.healthInsuranceMonthly, 830.58)
    })

    it('boundary: exactly 300,000 is bracket 2', () => {
      const r = calculate(input({
        grossAmount: 25000,
        taxationType: 'lump_sum',
        lumpSumRate: 12,
      }))
      // 25000 * 12 = 300,000 <= 300,000 → bracket 2
      expectClose(r.healthInsuranceMonthly, 830.58)
    })

    it('boundary: 300,001 is bracket 3', () => {
      const r = calculate(input({
        grossAmount: 300001,
        rateType: 'annual',
        taxationType: 'lump_sum',
        lumpSumRate: 12,
      }))
      // 300001 > 300000 → bracket 3
      expectClose(r.healthInsuranceMonthly, 1495.04)
    })
  })
})

// ============================================================
// PIT CALCULATIONS
// ============================================================

describe('PIT', () => {
  describe('Progressive scale (12%/32%)', () => {
    it('zero tax when below tax-free amount', () => {
      const r = calculate(input({
        grossAmount: 2000,
        taxationType: 'progressive',
      }))
      // taxableIncome = 24000 - 21459.48 = 2540.52 ≤ 30,000
      expectClose(r.pitAnnual, 0)
    })

    it('12% bracket only at 10k/month', () => {
      const r = calculate(input({
        grossAmount: 10000,
        taxationType: 'progressive',
      }))
      // taxableIncome = 120000 - 21459.48 = 98540.52
      // pit = (98540.52 - 30000) * 0.12 = 68540.52 * 0.12 = 8224.86
      expectClose(r.pitAnnual, 8224.86)
    })

    it('dual brackets at high income (50k/month)', () => {
      const r = calculate(input({
        grossAmount: 50000,
        taxationType: 'progressive',
      }))
      // taxableIncome = 600000 - 21459.48 = 578540.52
      // firstBracket = (120000 - 30000) * 0.12 = 10800
      // secondBracket = (578540.52 - 120000) * 0.32 = 458540.52 * 0.32 = 146732.97
      expectClose(r.pitAnnual, 157532.97)
    })

    it('exactly at threshold boundary (taxable = 120,000)', () => {
      // We need grossAmount such that taxableIncome = 120000
      // taxableIncome = grossAnnual - zusDeductibleAnnual = grossAnnual - 21459.48
      // grossAnnual = 141459.48 => monthlyGross = 11788.29
      const r = calculate(input({
        grossAmount: 141459.48,
        rateType: 'annual',
        taxationType: 'progressive',
      }))
      // taxableIncome = 141459.48 - 21459.48 = 120000.00 (exactly at threshold)
      // Still in first bracket: pit = (120000 - 30000) * 0.12 = 10800
      expectClose(r.pitAnnual, 10800)
    })
  })

  describe('Linear (19%)', () => {
    it('calculates 19% with health deduction at 10k/month', () => {
      const r = calculate(input({
        grossAmount: 10000,
        taxationType: 'linear',
      }))
      // taxableIncome = 120000 - 21459.48 = 98540.52
      // health = 432.54/mo * 12 = 5190.48 (minimum applied)
      // healthDeduction = min(5190.48, 14100) = 5190.48
      // adjusted = 98540.52 - 5190.48 = 93350.04
      // pit = 93350.04 * 0.19 = 17736.51
      expectClose(r.pitAnnual, 17736.51)
    })

    it('health deduction capped at limit (30k/month)', () => {
      const r = calculate(input({
        grossAmount: 30000,
        taxationType: 'linear',
      }))
      // health = 1382.37/mo * 12 = 16588.44
      // healthDeduction = min(16588.44, 14100) = 14100 ← CAPPED
      // taxableIncome = 360000 - 21459.48 = 338540.52
      // adjusted = 338540.52 - 14100 = 324440.52
      // pit = 324440.52 * 0.19 = 61643.70
      expectClose(r.pitAnnual, 61643.70)
    })
  })

  describe('Ryczalt', () => {
    it('12% rate at 10k/month (verified against podatki.wtf)', () => {
      const r = calculate(input({
        grossAmount: 10000,
        taxationType: 'lump_sum',
        lumpSumRate: 12,
      }))
      // healthDeduction = 9966.96 * 0.5 = 4983.48
      // taxBase = 120000 - 21459.48 - 4983.48 = 93557.04
      // pit = 93557.04 * 0.12 = 11226.84
      expectClose(r.pitAnnual, 11226.84)
    })

    it('8.5% rate', () => {
      const r = calculate(input({
        grossAmount: 10000,
        taxationType: 'lump_sum',
        lumpSumRate: 8.5,
      }))
      // Same health and deductions
      // pit = 93557.04 * 0.085 = 7952.35
      expectClose(r.pitAnnual, 7952.35)
    })

    it('17% rate', () => {
      const r = calculate(input({
        grossAmount: 10000,
        taxationType: 'lump_sum',
        lumpSumRate: 17,
      }))
      // pit = 93557.04 * 0.17 = 15904.70
      expectClose(r.pitAnnual, 15904.70)
    })

    it('costs do NOT reduce ryczalt tax base', () => {
      const withoutCosts = calculate(input({
        grossAmount: 10000,
        taxationType: 'lump_sum',
        lumpSumRate: 12,
        monthlyCosts: 0,
      }))
      const withCosts = calculate(input({
        grossAmount: 10000,
        taxationType: 'lump_sum',
        lumpSumRate: 12,
        monthlyCosts: 1000,
      }))
      // PIT should be identical (costs don't affect ryczalt tax base)
      expectClose(withCosts.pitAnnual, withoutCosts.pitAnnual)
      // But net should differ by costs (12000/year)
      expectClose(withCosts.netAnnual, withoutCosts.netAnnual - 12000)
    })

    it('50% of health insurance is deducted from ryczalt base', () => {
      const r = calculate(input({
        grossAmount: 10000,
        taxationType: 'lump_sum',
        lumpSumRate: 12,
      }))
      // Verify the tax breakdown shows the correct base
      const taxBreakdown = r.taxBreakdowns[0]
      // taxBase = 120000 - 21459.48 - (9966.96 * 0.5) = 93557.04
      expectClose(taxBreakdown.base, 93557.04)
    })
  })

  describe('IP BOX', () => {
    it('100% qualifying income at 5%', () => {
      const r = calculate(input({
        grossAmount: 10000,
        taxationType: 'ip_box',
        ipBoxPercentage: 100,
      }))
      // taxableIncome = 120000 - 21459.48 = 98540.52
      // health = 432.54/mo (minimum), annual = 5190.48
      // healthDeduction = min(5190.48, 14100) = 5190.48
      // adjusted = 98540.52 - 5190.48 = 93350.04
      // ipBoxTax = 93350.04 * 0.05 = 4667.50
      expectClose(r.pitAnnual, 4667.50)
      expect(r.taxBreakdowns).toHaveLength(1)
      expect(r.taxBreakdowns[0].rate).toBe('5%')
    })

    it('50% qualifying / 50% linear', () => {
      const r = calculate(input({
        grossAmount: 10000,
        taxationType: 'ip_box',
        ipBoxPercentage: 50,
      }))
      // adjusted = 93350.04
      // ipBox = 93350.04 * 0.5 = 46675.02
      // regular = 93350.04 * 0.5 = 46675.02
      // ipBoxTax = 46675.02 * 0.05 = 2333.75
      // regularTax = 46675.02 * 0.19 = 8868.25
      // total = 2333.75 + 8868.25 = 11202.00
      expectClose(r.pitAnnual, 11202.00)
      expect(r.taxBreakdowns).toHaveLength(2)
    })

    it('0% qualifying equals linear tax', () => {
      const ipBox = calculate(input({
        grossAmount: 10000,
        taxationType: 'ip_box',
        ipBoxPercentage: 0,
      }))
      const linear = calculate(input({
        grossAmount: 10000,
        taxationType: 'linear',
      }))
      // Same health, same everything → PIT should match
      expectClose(ipBox.pitAnnual, linear.pitAnnual)
      expectClose(ipBox.netAnnual, linear.netAnnual)
    })

    it('uses linear health (4.9%) not progressive (9%)', () => {
      const ipBox = calculate(input({
        grossAmount: 30000,
        taxationType: 'ip_box',
        ipBoxPercentage: 100,
      }))
      const linear = calculate(input({
        grossAmount: 30000,
        taxationType: 'linear',
      }))
      // IP BOX and linear should have identical health insurance
      expectClose(ipBox.healthInsuranceMonthly, linear.healthInsuranceMonthly)
    })
  })
})

// ============================================================
// NET INCOME (end-to-end)
// ============================================================

describe('Net Income (end-to-end)', () => {
  describe('10k/month with full ZUS', () => {
    it('progressive', () => {
      const r = calculate(input({
        grossAmount: 10000,
        taxationType: 'progressive',
      }))
      // net = 120000 - 21459.48 - 8868.60 - 8224.86 = 81447.06
      expectClose(r.netAnnual, 81447.06)
      expectClose(r.netMonthly, 81447.06 / 12)
    })

    it('linear', () => {
      const r = calculate(input({
        grossAmount: 10000,
        taxationType: 'linear',
      }))
      // net = 120000 - 21459.48 - 5190.48 - 17736.51 = 75613.53
      expectClose(r.netAnnual, 75613.53)
    })

    it('ryczalt 12% (matches podatki.wtf: 6,445.56 PLN/month)', () => {
      const r = calculate(input({
        grossAmount: 10000,
        taxationType: 'lump_sum',
        lumpSumRate: 12,
      }))
      // net = 120000 - 21459.48 - 9966.96 - 11226.84 = 77346.72
      expectClose(r.netAnnual, 77346.72)
      expectClose(r.netMonthly, 6445.56)
    })

    it('IP BOX 100%', () => {
      const r = calculate(input({
        grossAmount: 10000,
        taxationType: 'ip_box',
        ipBoxPercentage: 100,
      }))
      // net = 120000 - 21459.48 - 5190.48 - 4667.50 = 88682.54
      expectClose(r.netAnnual, 88682.54)
    })
  })

  describe('low income (2k/month)', () => {
    it('progressive: negative net with full ZUS', () => {
      const r = calculate(input({
        grossAmount: 2000,
        taxationType: 'progressive',
      }))
      // ZUS alone = 21459.48/yr, health = 5190.48/yr, PIT = 0
      // net = 24000 - 21459.48 - 5190.48 - 0 = -2649.96
      expectClose(r.netAnnual, -2649.96)
      expect(r.netAnnual).toBeLessThan(0)
    })
  })

  describe('high income (50k/month)', () => {
    it('progressive: enters 32% bracket', () => {
      const r = calculate(input({
        grossAmount: 50000,
        taxationType: 'progressive',
      }))
      // health = 4339.05/mo, annual = 52068.60
      // pit = 10800 + 146732.97 = 157532.97
      // net = 600000 - 21459.48 - 52068.60 - 157532.97 = 368938.95
      expectClose(r.netAnnual, 368938.95)
    })
  })

  describe('no ZUS', () => {
    it('progressive: only PIT deducted', () => {
      const r = calculate(input({
        grossAmount: 10000,
        taxationType: 'progressive',
        zusType: 'no_zus',
      }))
      // ZUS = 0, health = 0
      // taxableIncome = 120000, pit = (120000 - 30000) * 0.12 = 10800
      // net = 120000 - 0 - 0 - 10800 = 109200
      expectClose(r.netAnnual, 109200)
      expectClose(r.netMonthly, 9100)
    })
  })

  describe('health-only ZUS', () => {
    it('ryczalt 12% at 10k/month', () => {
      const r = calculate(input({
        grossAmount: 10000,
        taxationType: 'lump_sum',
        lumpSumRate: 12,
        zusType: 'health_only',
      }))
      // ZUS social = 0, health = 830.58/mo (bracket 2)
      // healthDeduction = 9966.96 * 0.5 = 4983.48
      // taxBase = 120000 - 0 - 4983.48 = 115016.52
      // pit = 115016.52 * 0.12 = 13801.98
      expectClose(r.pitAnnual, 13801.98)
      // net = 120000 - 0 - 9966.96 - 13801.98 = 96231.06
      expectClose(r.netAnnual, 96231.06)
    })
  })

  describe('preferential ZUS', () => {
    it('progressive at 10k/month', () => {
      const r = calculate(input({
        grossAmount: 10000,
        taxationType: 'progressive',
        zusType: 'preferential',
      }))
      // zusDeductible = 456.18/mo, annual = 5474.16
      // health progressive: income = 120000 - 5474.16 = 114525.84
      // monthlyIncome = 9543.82, health = round(9543.82 * 0.09) = 858.94
      // healthAnnual = 858.94 * 12 = 10307.28
      // taxableIncome = 114525.84, pit = (114525.84 - 30000) * 0.12 = 10143.10
      // net = 120000 - 5474.16 - 10307.28 - 10143.10 = 94075.46
      expectClose(r.netAnnual, 94075.46)
    })
  })

  describe('with monthly costs', () => {
    it('progressive: costs reduce income and net', () => {
      const r = calculate(input({
        grossAmount: 10000,
        taxationType: 'progressive',
        monthlyCosts: 1000,
      }))
      // costsAnnual = 12000
      // health: income = 120000 - 12000 - 21459.48 = 86540.52
      // monthlyIncome = 7211.71, health = round(7211.71 * 0.09) = 649.05
      // healthAnnual = 649.05 * 12 = 7788.60
      // taxableIncome = 120000 - 12000 - 21459.48 = 86540.52
      // pit = (86540.52 - 30000) * 0.12 = 56540.52 * 0.12 = 6784.86
      // net = 120000 - 21459.48 - 7788.60 - 6784.86 - 12000 = 71967.06
      expectClose(r.netAnnual, 71967.06)
    })

    it('ryczalt: costs reduce NET but NOT tax base', () => {
      const noCosts = calculate(input({
        grossAmount: 10000,
        taxationType: 'lump_sum',
        lumpSumRate: 12,
        monthlyCosts: 0,
      }))
      const withCosts = calculate(input({
        grossAmount: 10000,
        taxationType: 'lump_sum',
        lumpSumRate: 12,
        monthlyCosts: 1000,
      }))
      // PIT identical (costs don't affect ryczalt tax)
      expectClose(withCosts.pitAnnual, noCosts.pitAnnual)
      // Net differs by exactly 12,000
      expectClose(withCosts.netAnnual, noCosts.netAnnual - 12000)
    })
  })
})

// ============================================================
// RATE TYPE CONVERSIONS
// ============================================================

describe('Rate Type Conversions', () => {
  it('monthly: amount * 12', () => {
    const r = calculate(input({ grossAmount: 10000, rateType: 'monthly' }))
    expectClose(r.grossAnnual, 120000)
  })

  it('annual: amount as-is', () => {
    const r = calculate(input({ grossAmount: 120000, rateType: 'annual' }))
    expectClose(r.grossAnnual, 120000)
  })

  it('daily: amount * workingDays', () => {
    const r = calculate(input({ grossAmount: 1200, rateType: 'daily', yourWorkingDays: 225 }))
    // 1200 * 225 = 270,000
    expectClose(r.grossAnnual, 270000)
  })

  it('hourly: amount * 8 * workingDays', () => {
    const r = calculate(input({ grossAmount: 150, rateType: 'hourly', yourWorkingDays: 225 }))
    // 150 * 8 * 225 = 270,000
    expectClose(r.grossAnnual, 270000)
  })

  it('hourly and daily give same annual for equivalent rates', () => {
    const hourly = calculate(input({ grossAmount: 150, rateType: 'hourly', yourWorkingDays: 225 }))
    const daily = calculate(input({ grossAmount: 1200, rateType: 'daily', yourWorkingDays: 225 }))
    expectClose(hourly.grossAnnual, daily.grossAnnual)
    expectClose(hourly.netAnnual, daily.netAnnual)
  })
})

// ============================================================
// VAT
// ============================================================

describe('VAT', () => {
  it('no VAT by default', () => {
    const r = calculate(input({ includeVat: false }))
    expectClose(r.vatMonthly, 0)
    expectClose(r.invoiceGrossMonthly, r.grossMonthly)
  })

  it('23% VAT when enabled', () => {
    const r = calculate(input({ grossAmount: 10000, rateType: 'monthly', includeVat: true }))
    expectClose(r.vatMonthly, 2300) // 10000 * 0.23
    expectClose(r.invoiceGrossMonthly, 12300) // 10000 + 2300
  })

  it('VAT does not affect net income calculation', () => {
    const noVat = calculate(input({ includeVat: false }))
    const withVat = calculate(input({ includeVat: true }))
    expectClose(noVat.netAnnual, withVat.netAnnual)
    expectClose(noVat.netMonthly, withVat.netMonthly)
  })
})

// ============================================================
// WORKING DAYS & RATES
// ============================================================

describe('Working Days and Rate Calculations', () => {
  it('gross daily and hourly use effective working days', () => {
    const r = calculate(input({
      grossAmount: 120000,
      rateType: 'annual',
      yourWorkingDays: 225,
      paidVacationDays: 25,
    }))
    // effectiveWorkingDays = 225 - 25 = 200
    expectClose(r.grossDaily, 120000 / 200)       // 600
    expectClose(r.grossHourly, 120000 / (200 * 8)) // 75
  })

  it('handles zero effective working days', () => {
    const r = calculate(input({
      yourWorkingDays: 26,
      paidVacationDays: 26,
    }))
    // effectiveWorkingDays = 0
    expectClose(r.grossDaily, 0)
    expectClose(r.grossHourly, 0)
    expectClose(r.netDaily, 0)
    expectClose(r.netHourly, 0)
  })
})

// ============================================================
// ZERO INCOME
// ============================================================

describe('Zero Income', () => {
  it('full ZUS progressive: negative net', () => {
    const r = calculate(input({
      grossAmount: 0,
      taxationType: 'progressive',
      zusType: 'normal',
    }))
    expectClose(r.grossAnnual, 0)
    expectClose(r.pitAnnual, 0)
    // Still pays ZUS and minimum health
    expect(r.zusAnnual).toBeGreaterThan(0)
    expect(r.healthInsuranceAnnual).toBeGreaterThan(0)
    expect(r.netAnnual).toBeLessThan(0)
  })

  it('no ZUS: zero everything', () => {
    const r = calculate(input({
      grossAmount: 0,
      zusType: 'no_zus',
    }))
    expectClose(r.grossAnnual, 0)
    expectClose(r.zusAnnual, 0)
    expectClose(r.healthInsuranceAnnual, 0)
    expectClose(r.pitAnnual, 0)
    expectClose(r.netAnnual, 0)
    expectClose(r.effectiveTaxRate, 0)
  })
})

// ============================================================
// EFFECTIVE TAX RATE
// ============================================================

describe('Effective Tax Rate', () => {
  it('calculates correct effective rate', () => {
    const r = calculate(input({
      grossAmount: 10000,
      taxationType: 'lump_sum',
      lumpSumRate: 12,
    }))
    // net = 77346.72, gross = 120000
    // rate = ((120000 - 77346.72) / 120000) * 100 = (42653.28 / 120000) * 100 = 35.544...%
    expectClose(r.effectiveTaxRate, 35.54)
  })

  it('zero for zero income', () => {
    const r = calculate(input({
      grossAmount: 0,
      zusType: 'no_zus',
    }))
    expectClose(r.effectiveTaxRate, 0)
  })
})

// ============================================================
// TAX YEAR 2025 vs 2026
// ============================================================

describe('Tax Year Differences', () => {
  it('2025 uses different constants', () => {
    const r2025 = calculate(input({
      grossAmount: 10000,
      taxYear: '2025',
      taxationType: 'lump_sum',
      lumpSumRate: 12,
    }))
    const r2026 = calculate(input({
      grossAmount: 10000,
      taxYear: '2026',
      taxationType: 'lump_sum',
      lumpSumRate: 12,
    }))
    // Different ZUS bases → different ZUS amounts
    expect(r2025.zusMonthly).not.toBeCloseTo(r2026.zusMonthly, PRECISION)
    // Different ryczalt health amounts
    expect(r2025.healthInsuranceMonthly).not.toBeCloseTo(r2026.healthInsuranceMonthly, PRECISION)
  })

  it('2025 ryczalt health brackets use 2025 amounts', () => {
    const r = calculate(input({
      grossAmount: 10000,
      taxYear: '2025',
      taxationType: 'lump_sum',
      lumpSumRate: 12,
    }))
    // 120,000 > 60,000 and <= 300,000 → bracket 2
    // 2025 bracket 2 = 769.44
    expectClose(r.healthInsuranceMonthly, 769.44)
  })

  it('2025 ZUS base is different', () => {
    const r = calculate(input({
      grossAmount: 10000,
      taxYear: '2025',
      taxationType: 'progressive',
      zusType: 'normal',
    }))
    // 2025 ZUS base = 5203.80
    // retirement = round(5203.80 * 0.1952) = round(1015.7822) = 1015.78
    expectClose(r.zusBreakdown.retirement, 1015.78)
  })

  it('2025 health deduction limit for linear is 12,900', () => {
    const r = calculate(input({
      grossAmount: 30000,
      taxYear: '2025',
      taxationType: 'linear',
    }))
    // 2025 ZUS base = 5203.80
    // deductible monthly = retirement + disability + sickness + accident
    // = 1015.78 + 416.30 + 127.49 + 86.90 = 1646.47
    // deductible annual = 19757.64
    // income = 360000 - 19757.64 = 340242.36
    // monthlyIncome = 28353.53, health = round(28353.53 * 0.049) = 1389.32
    // min health = round(4666 * 0.09) = 419.94
    // health = max(1389.32, 419.94) = 1389.32
    // healthAnnual = 1389.32 * 12 = 16671.84
    // healthDeduction = min(16671.84, 12900) = 12900 ← 2025 limit
    // adjusted = 340242.36 - 12900 = 327342.36
    // pit = 327342.36 * 0.19 = 62195.05
    expectClose(r.pitAnnual, 62195.05)
  })
})

// ============================================================
// RYCZALT RATE VARIANTS
// ============================================================

describe('Ryczalt Rate Variants', () => {
  const ryczaltRates = [2, 3, 5.5, 8.5, 10, 12, 12.5, 14, 15, 17] as const

  ryczaltRates.forEach((rate) => {
    it(`${rate}% rate produces positive PIT at 10k/month`, () => {
      const r = calculate(input({
        grossAmount: 10000,
        taxationType: 'lump_sum',
        lumpSumRate: rate,
      }))
      expect(r.pitAnnual).toBeGreaterThan(0)
      // Verify the tax breakdown uses the correct rate
      expect(r.taxBreakdowns[0].rate).toBe(`${rate}%`)
    })
  })

  it('higher rate produces higher PIT', () => {
    const low = calculate(input({
      grossAmount: 10000,
      taxationType: 'lump_sum',
      lumpSumRate: 8.5,
    }))
    const high = calculate(input({
      grossAmount: 10000,
      taxationType: 'lump_sum',
      lumpSumRate: 17,
    }))
    expect(high.pitAnnual).toBeGreaterThan(low.pitAnnual)
    expect(high.netAnnual).toBeLessThan(low.netAnnual)
  })
})

// ============================================================
// CONSTANTS VERIFICATION
// ============================================================

describe('2026 Constants Verification', () => {
  it('full ZUS total matches official 1,926.76 PLN', () => {
    const r = calculate(input({
      zusType: 'normal',
      sickInsurance: true,
    }))
    expectClose(r.zusBreakdown.totalSocial, 1926.76)
  })

  it('minimum health insurance is 432.54 PLN (9% of 4806)', () => {
    // At very low income, progressive health hits minimum
    const r = calculate(input({
      grossAmount: 2000,
      taxationType: 'progressive',
    }))
    expectClose(r.healthInsuranceMonthly, 432.54)
  })
})
