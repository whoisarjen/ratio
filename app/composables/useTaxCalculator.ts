import type {
  CalculatorInput,
  CalculationResult,
  ZusBreakdown,
  TaxBreakdown,
  YearConstants,
} from '~/types/calculator'
import { useConstants } from './useConstants'

export function useTaxCalculator() {
  const { getConstants } = useConstants()

  function calculate(input: CalculatorInput): CalculationResult {
    const c = getConstants(input.taxYear)

    // Step 1: Convert input to annual gross revenue
    const grossAnnual = toAnnual(input.grossAmount, input.rateType, input.yourWorkingDays)
    const grossMonthly = grossAnnual / 12

    // Step 2: Calculate ZUS social contributions
    const zusBreakdown = calculateZus(input, c)
    // Deductible social = retirement + disability + sickness + accident (NO labor fund)
    const zusDeductibleMonthly = zusBreakdown.retirement + zusBreakdown.disability
      + zusBreakdown.sickness + zusBreakdown.accident
    const zusDeductibleAnnual = zusDeductibleMonthly * 12

    // Step 3: Calculate annual costs
    const costsAnnual = input.monthlyCosts * 12

    // Step 4: Calculate health insurance (uses deductible social for income calculation)
    const healthAnnual = calculateHealthInsurance(input, c, grossAnnual, zusDeductibleAnnual, costsAnnual)
    const healthMonthly = healthAnnual / 12

    // Update ZUS breakdown with health
    zusBreakdown.healthInsurance = healthMonthly
    zusBreakdown.totalWithHealth = zusDeductibleMonthly + healthMonthly

    // Step 5: Calculate PIT (uses deductible social only)
    const { pitAnnual, taxBreakdowns } = calculatePit(input, c, grossAnnual, zusDeductibleAnnual, costsAnnual, healthAnnual)

    // Step 6: Calculate net (deductible social + health + PIT + costs)
    const netAnnual = grossAnnual - zusDeductibleAnnual - healthAnnual - pitAnnual - costsAnnual
    const netMonthly = netAnnual / 12

    // Step 7: Calculate VAT
    const vatMonthly = input.includeVat ? grossMonthly * c.vatRate : 0
    const invoiceGrossMonthly = grossMonthly + vatMonthly

    // Step 8: Effective tax rate
    const effectiveTaxRate = grossAnnual > 0
      ? ((grossAnnual - netAnnual) / grossAnnual) * 100
      : 0

    // Working days
    const hoursPerDay = 8
    const effectiveWorkingDays = input.yourWorkingDays - input.paidVacationDays

    return {
      grossAnnual,
      grossMonthly,
      grossDaily: effectiveWorkingDays > 0 ? grossAnnual / effectiveWorkingDays : 0,
      grossHourly: effectiveWorkingDays > 0 ? grossAnnual / (effectiveWorkingDays * hoursPerDay) : 0,

      netAnnual,
      netMonthly,
      netDaily: effectiveWorkingDays > 0 ? netAnnual / effectiveWorkingDays : 0,
      netHourly: effectiveWorkingDays > 0 ? netAnnual / (effectiveWorkingDays * hoursPerDay) : 0,

      pitAnnual,
      pitMonthly: pitAnnual / 12,
      zusAnnual: zusDeductibleAnnual,
      zusMonthly: zusDeductibleMonthly,
      healthInsuranceAnnual: healthAnnual,
      healthInsuranceMonthly: healthMonthly,
      costsAnnual,

      effectiveTaxRate,

      vatMonthly,
      invoiceGrossMonthly,

      zusBreakdown,
      taxBreakdowns,

      workingDaysPerYear: c.workingDays,
      yourWorkingDays: input.yourWorkingDays,
    }
  }

  function toAnnual(amount: number, rateType: string, workingDays: number): number {
    const hoursPerDay = 8
    switch (rateType) {
      case 'hourly':
        return amount * hoursPerDay * workingDays
      case 'daily':
        return amount * workingDays
      case 'monthly':
        return amount * 12
      case 'annual':
        return amount
      default:
        return amount * 12
    }
  }

  function calculateZus(input: CalculatorInput, c: YearConstants): ZusBreakdown {
    let base: number
    let includeLaborFund = true

    switch (input.zusType) {
      case 'normal':
        base = c.zusBase
        break
      case 'preferential':
        base = c.preferentialZusBase
        includeLaborFund = false
        break
      case 'health_only':
        return {
          retirement: 0,
          disability: 0,
          sickness: 0,
          accident: 0,
          laborFund: 0,
          healthInsurance: 0,
          totalSocial: 0,
          totalWithHealth: 0,
        }
      case 'no_zus':
        return {
          retirement: 0,
          disability: 0,
          sickness: 0,
          accident: 0,
          laborFund: 0,
          healthInsurance: 0,
          totalSocial: 0,
          totalWithHealth: 0,
        }
      default:
        base = c.zusBase
    }

    const retirement = round(base * c.retirementRate)
    const disability = round(base * c.disabilityRate)
    const sickness = input.sickInsurance ? round(base * c.sicknessRate) : 0
    const accident = round(base * c.accidentRate)
    const laborFund = includeLaborFund ? round(base * c.laborFundRate) : 0

    // totalSocial includes labor fund for display purposes
    const totalSocial = retirement + disability + sickness + accident + laborFund

    return {
      retirement,
      disability,
      sickness,
      accident,
      laborFund,
      healthInsurance: 0,
      totalSocial,
      totalWithHealth: totalSocial,
    }
  }

  function calculateHealthInsurance(
    input: CalculatorInput,
    c: YearConstants,
    grossAnnual: number,
    zusDeductibleAnnual: number,
    costsAnnual: number,
  ): number {
    if (input.zusType === 'no_zus') return 0

    const taxationType = input.taxationType === 'ip_box' ? 'linear' : input.taxationType
    const minHealth = round(c.minHealthBase * c.healthRate)

    switch (taxationType) {
      case 'progressive': {
        // 9% of income (revenue - costs - deductible ZUS social), minimum applies
        const annualIncome = grossAnnual - costsAnnual - zusDeductibleAnnual
        const monthlyIncome = annualIncome / 12
        const monthlyHealth = Math.max(round(monthlyIncome * c.healthRate), minHealth)
        return monthlyHealth * 12
      }
      case 'linear': {
        // 4.9% of income, minimum applies
        const annualIncome = grossAnnual - costsAnnual - zusDeductibleAnnual
        const monthlyIncome = annualIncome / 12
        const monthlyHealth = Math.max(round(monthlyIncome * c.healthRateLinear), minHealth)
        return monthlyHealth * 12
      }
      case 'lump_sum': {
        // Fixed amounts based on annual revenue brackets
        if (grossAnnual <= c.ryczaltHealthBracket1Limit) {
          return c.ryczaltHealthAmount1 * 12
        } else if (grossAnnual <= c.ryczaltHealthBracket2Limit) {
          return c.ryczaltHealthAmount2 * 12
        } else {
          return c.ryczaltHealthAmount3 * 12
        }
      }
      default:
        return minHealth * 12
    }
  }

  function calculatePit(
    input: CalculatorInput,
    c: YearConstants,
    grossAnnual: number,
    zusDeductibleAnnual: number,
    costsAnnual: number,
    healthAnnual: number,
  ): { pitAnnual: number; taxBreakdowns: TaxBreakdown[] } {
    const taxBreakdowns: TaxBreakdown[] = []

    switch (input.taxationType) {
      case 'progressive': {
        // Income = revenue - costs - deductible ZUS social
        const taxableIncome = Math.max(0, grossAnnual - costsAnnual - zusDeductibleAnnual)
        let pit = 0

        if (taxableIncome <= c.taxFreeAmount) {
          pit = 0
          taxBreakdowns.push({
            name: 'PIT - Skala podatkowa',
            base: taxableIncome,
            rate: '0%',
            amount: 0,
          })
        } else if (taxableIncome <= c.pitThreshold) {
          pit = (taxableIncome - c.taxFreeAmount) * c.pitRate1
          taxBreakdowns.push({
            name: 'PIT - Skala podatkowa (12%)',
            base: taxableIncome,
            rate: '12%',
            amount: round(pit),
          })
        } else {
          const firstBracket = (c.pitThreshold - c.taxFreeAmount) * c.pitRate1
          const secondBracket = (taxableIncome - c.pitThreshold) * c.pitRate2
          pit = firstBracket + secondBracket
          taxBreakdowns.push({
            name: 'PIT - Skala 12%',
            base: c.pitThreshold - c.taxFreeAmount,
            rate: '12%',
            amount: round(firstBracket),
          })
          taxBreakdowns.push({
            name: 'PIT - Skala 32%',
            base: taxableIncome - c.pitThreshold,
            rate: '32%',
            amount: round(secondBracket),
          })
        }

        return { pitAnnual: Math.max(0, round(pit)), taxBreakdowns }
      }

      case 'linear': {
        // Income = revenue - costs - deductible ZUS social
        const taxableIncome = Math.max(0, grossAnnual - costsAnnual - zusDeductibleAnnual)
        // Health insurance partially deductible from income
        const healthDeduction = Math.min(healthAnnual, c.healthDeductionLimitLinear)
        const adjustedIncome = Math.max(0, taxableIncome - healthDeduction)
        const pit = adjustedIncome * c.linearRate

        taxBreakdowns.push({
          name: 'PIT - Podatek liniowy',
          base: adjustedIncome,
          rate: '19%',
          amount: round(pit),
        })

        return { pitAnnual: Math.max(0, round(pit)), taxBreakdowns }
      }

      case 'lump_sum': {
        // Tax on revenue - can deduct ZUS social and 50% of health insurance
        const healthDeduction = healthAnnual * 0.5
        const taxBase = Math.max(0, grossAnnual - zusDeductibleAnnual - healthDeduction)
        const rate = input.lumpSumRate / 100
        const pit = taxBase * rate

        taxBreakdowns.push({
          name: `PIT - Ryczalt ${input.lumpSumRate}%`,
          base: taxBase,
          rate: `${input.lumpSumRate}%`,
          amount: round(pit),
        })

        return { pitAnnual: Math.max(0, round(pit)), taxBreakdowns }
      }

      case 'ip_box': {
        // IP BOX: qualifying income taxed at 5%, rest at linear 19%
        const taxableIncome = Math.max(0, grossAnnual - costsAnnual - zusDeductibleAnnual)
        const healthDeduction = Math.min(healthAnnual, c.healthDeductionLimitLinear)
        const adjustedIncome = Math.max(0, taxableIncome - healthDeduction)

        const ipBoxRatio = input.ipBoxPercentage / 100
        const ipBoxIncome = adjustedIncome * ipBoxRatio
        const regularIncome = adjustedIncome * (1 - ipBoxRatio)

        const ipBoxTax = ipBoxIncome * c.ipBoxRate
        const regularTax = regularIncome * c.linearRate

        if (ipBoxIncome > 0) {
          taxBreakdowns.push({
            name: 'PIT - IP BOX (5%)',
            base: ipBoxIncome,
            rate: '5%',
            amount: round(ipBoxTax),
          })
        }
        if (regularIncome > 0) {
          taxBreakdowns.push({
            name: 'PIT - Liniowy (19%)',
            base: regularIncome,
            rate: '19%',
            amount: round(regularTax),
          })
        }

        return {
          pitAnnual: Math.max(0, round(ipBoxTax + regularTax)),
          taxBreakdowns,
        }
      }

      default:
        return { pitAnnual: 0, taxBreakdowns: [] }
    }
  }

  function round(value: number): number {
    return Math.round(value * 100) / 100
  }

  return { calculate }
}
