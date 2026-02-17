<div align="center">
  <img src="public/logo.png" alt="Ratio" width="120" />
  <h1>ratio</h1>
  <p><strong>Polish B2B Tax Calculator</strong></p>
  <p>Calculate your net income as a B2B contractor in Poland. Compare tax forms, ZUS contributions, and find the best option.</p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![Nuxt](https://img.shields.io/badge/Nuxt-4.3-00DC82?logo=nuxtdotjs&logoColor=white)](https://nuxt.com)
  [![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org)
  [![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

  [Live Demo](https://ratio-b2b.vercel.app) &bull; [Report Bug](https://github.com/kamilowczarek/ratio/issues/new?template=bug_report.md) &bull; [Request Feature](https://github.com/kamilowczarek/ratio/issues/new?template=feature_request.md)
</div>

---

## Features

- **4 tax forms** -- Progressive scale (12%/32%), Linear tax (19%), Ryczalt (2-17%), IP BOX (5%)
- **ZUS contribution variants** -- Full ZUS, preferential (first 2 years), health-only (ulga na start), or no ZUS
- **Health insurance calculations** -- Accurate per-tax-form health insurance with bracket-based amounts for ryczalt
- **2025 / 2026 tax year support** -- Up-to-date constants for minimum wage, average salary, ZUS bases, and health brackets
- **IP BOX with adjustable ratio** -- Slider to set qualifying income percentage (5% rate on IP portion, 19% on the rest)
- **Multiple rate inputs** -- Enter your rate as hourly, daily, monthly, or annual
- **Real-time calculations** -- All results update instantly as you change inputs
- **Monthly breakdown** -- Detailed view of gross, ZUS social, health insurance, PIT, costs, and net
- **Effective tax rate** -- See your total tax burden as a percentage at a glance
- **VAT support** -- Optionally add 23% VAT to see invoice gross amounts
- **Working days customization** -- Adjust working days per year and paid vacation days
- **Fully client-side** -- No backend, no data sent anywhere. All calculations happen in your browser
- **Mobile responsive** -- Works on desktop, tablet, and mobile screens

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Nuxt 4](https://nuxt.com) (v4.3) |
| UI Library | [Vue 3](https://vuejs.org) (v3.5) |
| Language | [TypeScript](https://www.typescriptlang.org) (strict) |
| Styling | [Tailwind CSS](https://tailwindcss.com) via `@nuxtjs/tailwindcss` |
| Fonts | [Inter](https://rsms.me/inter/) via `@nuxtjs/google-fonts` |
| Package Manager | npm |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) >= 18.x
- npm (comes with Node.js)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/kamilowczarek/ratio.git
   cd ratio
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
# Build the application
npm run build

# Generate static site
npm run generate

# Preview the production build locally
npm run preview
```

## Project Structure

```
ratio/
├── app/
│   ├── assets/css/main.css     # Tailwind base styles and component classes
│   ├── composables/
│   │   ├── useConstants.ts     # Tax year constants (2025/2026), lump sum rates
│   │   └── useTaxCalculator.ts # Core calculation engine (ZUS, health, PIT)
│   ├── types/
│   │   └── calculator.ts       # TypeScript interfaces and type definitions
│   ├── layouts/
│   │   └── default.vue         # App shell with header and footer
│   ├── pages/
│   │   └── index.vue           # Main calculator page
│   └── app.vue                 # Root component
├── public/                     # Static assets (favicon, logo)
├── nuxt.config.ts              # Nuxt configuration
├── tailwind.config.ts          # Tailwind theme (brand/surface colors, shadows)
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

## How Calculations Work

The calculator follows Polish tax law for B2B (sole proprietorship) contractors:

1. **Gross income** is calculated from the input rate (hourly/daily/monthly/annual) and working days
2. **ZUS social contributions** are computed on the appropriate base (full, preferential, or zero)
3. **Health insurance** is calculated per tax form:
   - Progressive: 9% of income (revenue - costs - ZUS social), minimum applies
   - Linear / IP BOX: 4.9% of income, minimum applies
   - Ryczalt: fixed monthly amounts based on annual revenue brackets
4. **PIT** is calculated according to the chosen tax form, with applicable deductions
5. **Net income** = Gross - ZUS social - Health insurance - PIT - Costs

> Labor Fund (Fundusz Pracy) is displayed but NOT deducted from net income, matching the behavior of podatki.wtf.

## Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) before submitting a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with care for the Polish B2B community.</p>
  <p>
    <a href="https://github.com/kamilowczarek/ratio/stargazers">Star this repo</a> if you find it useful!
  </p>
</div>
