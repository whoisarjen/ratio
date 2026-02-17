<script setup lang="ts">
import type {
  RateType,
  TaxYear,
  ZusType,
  TaxationType,
  LumpSumRate,
  CalculatorInput,
} from '~/types/calculator'
import { useTaxCalculator } from '~/composables/useTaxCalculator'
import { useConstants, LUMP_SUM_OPTIONS } from '~/composables/useConstants'

const { calculate } = useTaxCalculator()
const { getConstants } = useConstants()

// --- LocalStorage helpers ---
const STORAGE_KEY = 'ratio-calculator-state'

interface SavedState {
  grossAmount: number
  rateType: RateType
  taxYear: TaxYear
  zusType: ZusType
  sickInsurance: boolean
  taxationType: TaxationType
  lumpSumRate: LumpSumRate
  monthlyCosts: number
  paidVacationDays: number
  includeVat: boolean
  ipBoxPercentage: number
  yourWorkingDays: number
}

function loadState(): Partial<SavedState> {
  if (import.meta.server) return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

const saved = loadState()

// --- State (restored from localStorage if available) ---
const grossAmount = ref(saved.grossAmount ?? 20000)
const rateType = ref<RateType>(saved.rateType ?? 'monthly')
const taxYear = ref<TaxYear>(saved.taxYear ?? '2026')
const zusType = ref<ZusType>(saved.zusType ?? 'normal')
const sickInsurance = ref(saved.sickInsurance ?? true)
const taxationType = ref<TaxationType>(saved.taxationType ?? 'lump_sum')
const lumpSumRate = ref<LumpSumRate>(saved.lumpSumRate ?? 12)
const monthlyCosts = ref(saved.monthlyCosts ?? 0)
const paidVacationDays = ref(saved.paidVacationDays ?? 26)
const includeVat = ref(saved.includeVat ?? false)
const showAdvanced = ref(false)
const showTaxDetails = ref(false)
const showZusDetails = ref(false)

// IP BOX
const ipBoxPercentage = ref(saved.ipBoxPercentage ?? 100)

const constants = computed(() => getConstants(taxYear.value))
const workingDaysPerYear = computed(() => constants.value.workingDays)
const yourWorkingDays = ref(saved.yourWorkingDays ?? 225)

// --- Persist state to localStorage ---
const stateToSave = computed<SavedState>(() => ({
  grossAmount: grossAmount.value,
  rateType: rateType.value,
  taxYear: taxYear.value,
  zusType: zusType.value,
  sickInsurance: sickInsurance.value,
  taxationType: taxationType.value,
  lumpSumRate: lumpSumRate.value,
  monthlyCosts: monthlyCosts.value,
  paidVacationDays: paidVacationDays.value,
  includeVat: includeVat.value,
  ipBoxPercentage: ipBoxPercentage.value,
  yourWorkingDays: yourWorkingDays.value,
}))

watch(stateToSave, (val) => {
  if (import.meta.server) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  } catch {}
}, { deep: true })

// Rate type labels
const rateTypes: { value: RateType; label: string; suffix: string }[] = [
  { value: 'hourly', label: 'Godzinowa', suffix: 'PLN/h' },
  { value: 'daily', label: 'Dzienna', suffix: 'PLN/d' },
  { value: 'monthly', label: 'Miesieczna', suffix: 'PLN/m' },
  { value: 'annual', label: 'Roczna', suffix: 'PLN/r' },
]

// Tax year options
const taxYears: { value: TaxYear; label: string }[] = [
  { value: '2026', label: '2026' },
  { value: '2025', label: '2025' },
]

// ZUS options
const zusOptions: { value: ZusType; label: string; description: string }[] = [
  { value: 'normal', label: 'Pelny ZUS', description: 'Duzy ZUS' },
  { value: 'preferential', label: 'Preferencyjny', description: '2 lata' },
  { value: 'health_only', label: 'Tylko zdrowotna', description: '6 mies. / UoP' },
  { value: 'no_zus', label: 'Bez ZUS', description: '' },
]

// Tax type options - main 3 (IP BOX handled separately)
const mainTaxOptions: { value: TaxationType; label: string; description: string }[] = [
  { value: 'progressive', label: 'Skala podatkowa', description: '12% / 32%' },
  { value: 'linear', label: 'Liniowy', description: '19%' },
  { value: 'lump_sum', label: 'Ryczalt', description: '2% - 17%' },
]

// --- Calculation ---
const result = computed(() => {
  const input: CalculatorInput = {
    grossAmount: grossAmount.value || 0,
    rateType: rateType.value,
    taxYear: taxYear.value,
    zusType: zusType.value,
    sickInsurance: sickInsurance.value,
    taxationType: taxationType.value,
    lumpSumRate: lumpSumRate.value,
    monthlyCosts: monthlyCosts.value || 0,
    paidVacationDays: paidVacationDays.value || 0,
    workingDaysPerYear: workingDaysPerYear.value,
    yourWorkingDays: yourWorkingDays.value || 225,
    includeVat: includeVat.value,
    ipBoxPercentage: ipBoxPercentage.value,
  }
  return calculate(input)
})

function formatPLN(value: number): string {
  return new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

useHead({
  title: 'Ratio - Kalkulator B2B Polska',
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 lg:pb-12">
    <!-- Hero -->
    <div class="text-center mb-10">
      <h1 class="text-3xl sm:text-4xl font-bold text-surface-900 mb-3">
        Kalkulator B2B
      </h1>
      <p class="text-surface-400 text-lg max-w-xl mx-auto">
        Oblicz swoje zarobki netto jako kontrahent B2B w Polsce.
        Porownaj formy opodatkowania i znajdz najlepsza opcje.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- LEFT: Input Panel -->
      <div class="lg:col-span-5 lg:order-1 space-y-5">
        <!-- Income Input Card -->
        <div class="card p-6">
          <h2 class="text-xs font-semibold text-surface-900 uppercase tracking-wider mb-4">
            Przychod
          </h2>

          <!-- Rate type chips -->
          <div class="flex flex-wrap gap-2 mb-4">
            <button
              v-for="rt in rateTypes"
              :key="rt.value"
              :class="['chip', rateType === rt.value && 'active']"
              @click="rateType = rt.value"
            >
              {{ rt.label }}
            </button>
          </div>

          <!-- Amount input -->
          <div class="relative mb-4">
            <input
              v-model.number="grossAmount"
              type="number"
              class="input-field text-xl font-bold pr-20"
              placeholder="0"
              min="0"
              step="100"
            >
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-surface-400">
              {{ rateTypes.find(r => r.value === rateType)?.suffix }}
            </span>
          </div>

          <!-- Tax Year -->
          <div>
            <label class="label">Rok podatkowy</label>
            <select v-model="taxYear" class="select-field">
              <option v-for="y in taxYears" :key="y.value" :value="y.value">
                {{ y.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Tax & ZUS Settings Card -->
        <div class="card p-6">
          <h2 class="text-xs font-semibold text-surface-900 uppercase tracking-wider mb-4">
            Podatki i ZUS
          </h2>

          <div class="space-y-4">
            <!-- Taxation Type - Main 3 options -->
            <div>
              <label class="label">Forma opodatkowania</label>
              <div class="space-y-2">
                <button
                  v-for="tt in mainTaxOptions"
                  :key="tt.value"
                  :class="[
                    'w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-150 text-left',
                    taxationType === tt.value
                      ? 'bg-brand-50 border-brand-300 ring-1 ring-brand-200'
                      : 'border-surface-200 hover:border-surface-300 bg-white',
                  ]"
                  @click="taxationType = tt.value"
                >
                  <span
                    :class="[
                      'text-sm font-semibold',
                      taxationType === tt.value ? 'text-brand-700' : 'text-surface-700',
                    ]"
                  >
                    {{ tt.label }}
                  </span>
                  <span
                    :class="[
                      'text-xs font-medium px-2 py-0.5 rounded-md',
                      taxationType === tt.value
                        ? 'bg-brand-100 text-brand-600'
                        : 'bg-surface-100 text-surface-500',
                    ]"
                  >
                    {{ tt.description }}
                  </span>
                </button>
              </div>

              <!-- IP BOX - Separate, visually distinct -->
              <div class="mt-3 p-3 rounded-xl border-2 border-dashed transition-all duration-150"
                :class="taxationType === 'ip_box'
                  ? 'border-brand-400 bg-brand-50'
                  : 'border-surface-200 bg-surface-50/50 hover:border-surface-300'"
              >
                <button
                  :class="[
                    'w-full flex items-center justify-between p-3 rounded-lg transition-all duration-150',
                    taxationType === 'ip_box'
                      ? 'bg-brand-600 text-white'
                      : 'bg-white hover:bg-brand-50 border border-surface-200',
                  ]"
                  @click="taxationType = 'ip_box'"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold">IP BOX</span>
                    <span
                      :class="[
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        taxationType === 'ip_box'
                          ? 'bg-white/20 text-white'
                          : 'bg-amber-100 text-amber-700',
                      ]"
                    >
                      5% PIT
                    </span>
                  </div>
                  <span :class="['text-xs', taxationType === 'ip_box' ? 'text-brand-200' : 'text-surface-400']">
                    Dla programistow
                  </span>
                </button>
                <p class="mt-2 text-xs text-surface-400 px-1">
                  Preferencyjne opodatkowanie dochodow z kwalifikowanej wlasnosci intelektualnej.
                </p>
              </div>
            </div>

            <!-- Lump sum rate selector -->
            <div v-if="taxationType === 'lump_sum'">
              <label class="label">Stawka ryczaltu</label>
              <select v-model.number="lumpSumRate" class="select-field">
                <option v-for="opt in LUMP_SUM_OPTIONS" :key="opt.rate" :value="opt.rate">
                  {{ opt.label }} - {{ opt.description }}
                </option>
              </select>
            </div>

            <!-- IP BOX percentage -->
            <div v-if="taxationType === 'ip_box'" class="space-y-3">
              <label class="label">
                Udzial dochodu kwalifikowanego IP BOX
              </label>
              <div class="flex items-center gap-3">
                <input
                  v-model.number="ipBoxPercentage"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  class="flex-1 h-2 bg-surface-200 rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                         [&::-webkit-slider-thumb]:bg-brand-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md
                         [&::-webkit-slider-thumb]:cursor-pointer"
                >
                <span class="text-sm font-bold text-brand-600 w-12 text-right tabular-nums">
                  {{ ipBoxPercentage }}%
                </span>
              </div>
              <p class="text-xs text-surface-400">
                Procent dochodu kwalifikujacego sie do stawki 5%.
                Pozostala czesc opodatkowana liniowo 19%.
              </p>
            </div>

            <!-- ZUS Type -->
            <div>
              <label class="label">Skladka ZUS</label>
              <select v-model="zusType" class="select-field">
                <option v-for="z in zusOptions" :key="z.value" :value="z.value">
                  {{ z.label }}{{ z.description ? ` (${z.description})` : '' }}
                </option>
              </select>
            </div>

            <!-- Sick insurance toggle -->
            <div
              v-if="zusType !== 'health_only' && zusType !== 'no_zus'"
              class="flex items-center justify-between"
            >
              <span class="text-sm font-medium text-surface-600">Chorobowe</span>
              <button
                :class="['toggle-track', sickInsurance && 'active']"
                @click="sickInsurance = !sickInsurance"
              >
                <div class="toggle-thumb" />
              </button>
            </div>

            <!-- Monthly costs -->
            <div>
              <label class="label">Koszty miesiecznie (netto)</label>
              <div class="relative">
                <input
                  v-model.number="monthlyCosts"
                  type="number"
                  class="input-field pr-16"
                  placeholder="0"
                  min="0"
                  step="100"
                >
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-surface-400">
                  PLN/m
                </span>
              </div>
            </div>
          </div>

          <!-- Advanced options -->
          <button
            class="mt-4 text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
            @click="showAdvanced = !showAdvanced"
          >
            <svg
              :class="['w-4 h-4 transition-transform', showAdvanced && 'rotate-180']"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            {{ showAdvanced ? 'Mniej opcji' : 'Wiecej opcji' }}
          </button>

          <div v-if="showAdvanced" class="mt-4 space-y-4 pt-4 border-t border-surface-100">
            <!-- Paid vacation -->
            <div>
              <label class="label">Platne dni wolne</label>
              <input
                v-model.number="paidVacationDays"
                type="number"
                class="input-field"
                min="0"
                max="365"
              >
            </div>

            <!-- Working days -->
            <div>
              <label class="label">Twoje dni robocze w roku</label>
              <input
                v-model.number="yourWorkingDays"
                type="number"
                class="input-field"
                min="1"
                max="366"
              >
              <p class="mt-1 text-xs text-surface-400">
                Dni roboczych w {{ taxYear }}: {{ workingDaysPerYear }}
              </p>
            </div>

            <!-- VAT toggle -->
            <div class="flex items-center justify-between">
              <div>
                <span class="text-sm font-medium text-surface-600">VAT (23%)</span>
                <p class="text-xs text-surface-400">Dolicz VAT do faktury</p>
              </div>
              <button
                :class="['toggle-track', includeVat && 'active']"
                @click="includeVat = !includeVat"
              >
                <div class="toggle-thumb" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: Results Panel -->
      <div class="lg:col-span-7 lg:order-2">
        <div class="lg:sticky lg:top-20 space-y-5">
          <!-- Net Income Hero -->
          <div class="card p-6 sm:p-8 bg-gradient-to-br from-brand-600 to-brand-700 border-0 text-white">
            <div class="flex items-start justify-between mb-6">
              <div>
                <p class="text-brand-200 text-sm font-medium mb-1">Netto miesieczne</p>
                <p class="text-5xl sm:text-6xl font-bold tabular-nums tracking-tight">
                  {{ formatPLN(result.netMonthly) }}
                </p>
                <p class="text-brand-200 text-sm mt-1">PLN / miesiac</p>
              </div>
              <div class="text-right">
                <p class="text-brand-200 text-sm font-medium">Efektywna stawka</p>
                <p class="text-2xl font-bold tabular-nums">
                  {{ formatPercent(result.effectiveTaxRate) }}%
                </p>
              </div>
            </div>

            <!-- Quick stats -->
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-white/10 rounded-xl p-3">
                <p class="text-xs text-brand-200 mb-0.5">Godzinowa</p>
                <p class="text-lg font-bold tabular-nums">{{ formatPLN(result.netHourly) }}</p>
              </div>
              <div class="bg-white/10 rounded-xl p-3">
                <p class="text-xs text-brand-200 mb-0.5">Dzienna</p>
                <p class="text-lg font-bold tabular-nums">{{ formatPLN(result.netDaily) }}</p>
              </div>
              <div class="bg-white/10 rounded-xl p-3">
                <p class="text-xs text-brand-200 mb-0.5">Roczna</p>
                <p class="text-lg font-bold tabular-nums">{{ formatPLN(result.netAnnual) }}</p>
              </div>
            </div>
          </div>

          <!-- Combined Breakdown Card -->
          <div class="card p-6">
            <!-- Monthly Summary - always visible -->
            <h2 class="text-xs font-semibold text-surface-900 uppercase tracking-wider mb-4">
              Podsumowanie miesieczne
            </h2>

            <div class="space-y-1">
              <div class="flex justify-between items-center py-2">
                <span class="text-sm text-surface-600">Przychod brutto</span>
                <span class="text-sm font-semibold text-surface-900 tabular-nums">
                  {{ formatPLN(result.grossMonthly) }} PLN
                </span>
              </div>

              <div class="h-px bg-surface-100" />

              <div class="flex justify-between items-center py-2">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-amber-400" />
                  <span class="text-sm text-surface-600">ZUS spoleczne</span>
                </div>
                <span class="text-sm font-semibold text-rose-600 tabular-nums">
                  -{{ formatPLN(result.zusMonthly) }} PLN
                </span>
              </div>

              <div class="flex justify-between items-center py-2">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-rose-400" />
                  <span class="text-sm text-surface-600">Skladka zdrowotna</span>
                </div>
                <span class="text-sm font-semibold text-rose-600 tabular-nums">
                  -{{ formatPLN(result.healthInsuranceMonthly) }} PLN
                </span>
              </div>

              <div class="flex justify-between items-center py-2">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-blue-400" />
                  <span class="text-sm text-surface-600">PIT</span>
                </div>
                <span class="text-sm font-semibold text-rose-600 tabular-nums">
                  -{{ formatPLN(result.pitMonthly) }} PLN
                </span>
              </div>

              <div v-if="monthlyCosts > 0" class="flex justify-between items-center py-2">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-purple-400" />
                  <span class="text-sm text-surface-600">Koszty</span>
                </div>
                <span class="text-sm font-semibold text-rose-600 tabular-nums">
                  -{{ formatPLN(monthlyCosts) }} PLN
                </span>
              </div>

              <div class="h-px bg-surface-200" />

              <div class="flex justify-between items-center py-2">
                <span class="text-sm font-semibold text-surface-900">Na reke</span>
                <span class="text-xl font-bold text-emerald-600 tabular-nums">
                  {{ formatPLN(result.netMonthly) }} PLN
                </span>
              </div>

              <div v-if="includeVat" class="flex justify-between items-center py-2">
                <span class="text-sm text-surface-400">Faktura brutto (z VAT)</span>
                <span class="text-sm font-semibold text-surface-500 tabular-nums">
                  {{ formatPLN(result.invoiceGrossMonthly) }} PLN
                </span>
              </div>
            </div>

            <!-- Tax Details - collapsible -->
            <div class="mt-4 pt-4 border-t border-surface-100">
              <button
                class="w-full flex items-center justify-between text-sm font-medium text-surface-600 hover:text-surface-800 transition-colors"
                @click="showTaxDetails = !showTaxDetails"
              >
                <span>Szczegoly podatku</span>
                <svg
                  :class="['w-4 h-4 transition-transform', showTaxDetails && 'rotate-180']"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div v-if="showTaxDetails" class="mt-3">
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr class="text-left text-xs text-surface-400 uppercase tracking-wider">
                        <th class="pb-3 font-medium">Podatek</th>
                        <th class="pb-3 font-medium text-right">Podstawa</th>
                        <th class="pb-3 font-medium text-right">Stawka</th>
                        <th class="pb-3 font-medium text-right">Kwota roczna</th>
                      </tr>
                    </thead>
                    <tbody class="text-sm">
                      <tr
                        v-for="(tax, i) in result.taxBreakdowns"
                        :key="i"
                        class="border-t border-surface-100"
                      >
                        <td class="py-3 font-medium text-surface-700">{{ tax.name }}</td>
                        <td class="py-3 text-right tabular-nums text-surface-500">
                          {{ formatPLN(tax.base) }} PLN
                        </td>
                        <td class="py-3 text-right tabular-nums text-surface-500">{{ tax.rate }}</td>
                        <td class="py-3 text-right tabular-nums font-semibold text-surface-900">
                          {{ formatPLN(tax.amount) }} PLN
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- ZUS Details - collapsible -->
            <div class="mt-4 pt-4 border-t border-surface-100">
              <button
                class="w-full flex items-center justify-between text-sm font-medium text-surface-600 hover:text-surface-800 transition-colors"
                @click="showZusDetails = !showZusDetails"
              >
                <span>Szczegoly ZUS (miesiecznie)</span>
                <svg
                  :class="['w-4 h-4 transition-transform', showZusDetails && 'rotate-180']"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div v-if="showZusDetails" class="mt-3">
                <div class="grid grid-cols-2 gap-3">
                  <div class="bg-surface-50 rounded-xl p-3">
                    <p class="text-xs text-surface-400 mb-0.5">Emerytalna</p>
                    <p class="text-sm font-semibold text-surface-900 tabular-nums">
                      {{ formatPLN(result.zusBreakdown.retirement) }} PLN
                    </p>
                  </div>
                  <div class="bg-surface-50 rounded-xl p-3">
                    <p class="text-xs text-surface-400 mb-0.5">Rentowa</p>
                    <p class="text-sm font-semibold text-surface-900 tabular-nums">
                      {{ formatPLN(result.zusBreakdown.disability) }} PLN
                    </p>
                  </div>
                  <div class="bg-surface-50 rounded-xl p-3">
                    <p class="text-xs text-surface-400 mb-0.5">Wypadkowa</p>
                    <p class="text-sm font-semibold text-surface-900 tabular-nums">
                      {{ formatPLN(result.zusBreakdown.accident) }} PLN
                    </p>
                  </div>
                  <div class="bg-surface-50 rounded-xl p-3">
                    <p class="text-xs text-surface-400 mb-0.5">Chorobowa</p>
                    <p class="text-sm font-semibold text-surface-900 tabular-nums">
                      {{ formatPLN(result.zusBreakdown.sickness) }} PLN
                    </p>
                  </div>
                  <div class="bg-surface-50 rounded-xl p-3">
                    <p class="text-xs text-surface-400 mb-0.5">Fundusz Pracy</p>
                    <p class="text-sm font-semibold text-surface-900 tabular-nums">
                      {{ formatPLN(result.zusBreakdown.laborFund) }} PLN
                    </p>
                  </div>
                  <div class="bg-brand-50 rounded-xl p-3 border border-brand-200">
                    <p class="text-xs text-brand-500 mb-0.5">Zdrowotna</p>
                    <p class="text-sm font-semibold text-brand-700 tabular-nums">
                      {{ formatPLN(result.zusBreakdown.healthInsurance) }} PLN
                    </p>
                  </div>
                </div>

                <div class="mt-3 flex justify-between items-center pt-3 border-t border-surface-100">
                  <span class="text-sm font-medium text-surface-600">Razem ZUS</span>
                  <span class="text-sm font-bold text-surface-900 tabular-nums">
                    {{ formatPLN(result.zusBreakdown.totalWithHealth) }} PLN
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Disclaimer - inline, no card -->
          <p class="text-xs text-surface-400 px-1">
            Wyniki orientacyjne. Dokladne wyliczenia zaleza od indywidualnej sytuacji.
            Skonsultuj z doradca podatkowym.
          </p>
        </div>
      </div>
    </div>

    <!-- Mobile sticky result bar -->
    <div class="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-gradient-to-r from-brand-600 to-brand-700 text-white px-4 py-3 shadow-lg">
      <div class="flex items-center justify-between max-w-6xl mx-auto">
        <span class="text-sm font-medium text-brand-200">Netto / mies.</span>
        <span class="text-xl font-bold tabular-nums">{{ formatPLN(result.netMonthly) }} PLN</span>
      </div>
    </div>
  </div>
</template>
