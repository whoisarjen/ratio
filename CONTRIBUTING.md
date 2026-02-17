# Contributing to Ratio

Thank you for your interest in contributing to Ratio! This guide will help you get started.

## Code of Conduct

By participating in this project, you agree to treat all contributors with respect and maintain a welcoming, inclusive environment.

## How to Contribute

### Reporting Bugs

If you find a bug, please [open an issue](https://github.com/kamilowczarek/ratio/issues/new?template=bug_report.md) with:

- A clear description of the problem
- Steps to reproduce the issue
- Expected vs. actual behavior
- Your browser and OS information

### Suggesting Features

Feature requests are welcome! Please [open an issue](https://github.com/kamilowczarek/ratio/issues/new?template=feature_request.md) describing:

- The problem your feature would solve
- Your proposed solution
- Any alternatives you have considered

### Submitting Changes

1. **Fork** the repository and create your branch from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Install** dependencies:

   ```bash
   npm install
   ```

3. **Make your changes** following the project conventions (see below).

4. **Test** your changes locally:

   ```bash
   npm run dev
   ```

5. **Build** to verify there are no errors:

   ```bash
   npm run build
   ```

6. **Commit** your changes with a clear message:

   ```bash
   git commit -m "Add: description of your change"
   ```

7. **Push** to your fork and [open a Pull Request](https://github.com/kamilowczarek/ratio/compare).

## Development Setup

### Prerequisites

- Node.js >= 18.x
- npm

### Running Locally

```bash
git clone https://github.com/kamilowczarek/ratio.git
cd ratio
npm install
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Project Conventions

### Code Style

- **TypeScript** -- All code should be typed. Avoid `any` where possible.
- **Vue 3 Composition API** -- Use `<script setup lang="ts">` for all components.
- **Tailwind CSS** -- Use utility classes. Prefer the existing design tokens (brand/surface color scales, card/input component classes defined in `main.css`).

### File Organization

- `app/types/` -- TypeScript interfaces and type definitions
- `app/composables/` -- Reusable logic (calculation engine, constants)
- `app/components/` -- Vue components
- `app/pages/` -- Nuxt page routes
- `app/layouts/` -- Layout wrappers

### Commit Messages

Use clear, descriptive commit messages. Prefix with a category:

- `Add:` -- New features or files
- `Fix:` -- Bug fixes
- `Update:` -- Changes to existing functionality
- `Refactor:` -- Code restructuring without behavior changes
- `Docs:` -- Documentation changes
- `Style:` -- Formatting, CSS changes (no logic changes)

### Tax Calculation Guidelines

When modifying tax calculations:

- Reference the specific Polish tax law or ZUS regulation that applies
- Update constants in `app/composables/useConstants.ts` for new tax years
- Ensure all tax forms (progressive, linear, lump sum, IP BOX) are handled
- Verify health insurance bracket logic for ryczalt
- Keep the `YearConstants` interface in sync with any new fields

## Updating Tax Year Constants

To add support for a new tax year:

1. Add the new year to the `TaxYear` type in `app/types/calculator.ts`
2. Create a new `YEAR_XXXX` constant object in `app/composables/useConstants.ts`
3. Register it in the `CONSTANTS_BY_YEAR` record
4. Add the year option to the tax year selector in `app/pages/index.vue`
5. Verify calculations against official sources (e.g., ZUS.pl, podatki.gov.pl)

## Pull Request Guidelines

- Keep PRs focused -- one feature or fix per PR
- Describe what your PR does and why
- Link any related issues
- Make sure the app builds without errors (`npm run build`)
- Test across different tax form and ZUS combinations

## Questions?

If you have questions about contributing, feel free to [open a discussion](https://github.com/kamilowczarek/ratio/issues) on the repository.

Thank you for helping make Ratio better!
