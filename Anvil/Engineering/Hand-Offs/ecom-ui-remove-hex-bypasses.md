# eCommerce-UI: Remove Hardcoded-Hex Bypasses & Formalize Token/Hex Exclusion

**Package:** `OHFY-eCommerce-UI`
**Date:** 2026-06-09

---

## Context

The `ohfy-theme/no-hardcoded-hex` lint rule enforces `var(--ohfy-*)` design tokens instead of hardcoded hex colors across Tier 4 UI packages. Both the ESLint and Stylelint configs **already exclude** `OHFY-eCommerce-UI` from this rule:

- **`eslint.config.js:117`** — `ignores: ["...", "**/OHFY-eCommerce-UI/**"]`
- **`stylelint.config.js:29`** — `ignoreFiles: ["...", "OHFY-eCommerce-UI/**"]`

Because the package is excluded at the config level, the inline `<!-- ohfy-disable no-hardcoded-hex -->` bypass comments scattered throughout the eCommerce LWCs are **dead code** — they do nothing and should be removed.

## Permanent Exclusion: `--ohfy-*` Tokens and `no-hardcoded-hex`

OHFY-eCommerce-UI should **never** be enforced to consume `--ohfy-*` CSS design tokens (`var(--ohfy-color-*)`, `var(--ohfy-spacing-*)`, etc.) or comply with the `no-hardcoded-hex` lint rule. This is intentional, not an oversight:

1. **Separate theming system** — The eCommerce storefront has its own customer-facing runtime theming engine (`ecomThemeAdmin`) that lets admins configure colors via CMDT records. Theme values are injected at runtime as CSS custom properties by the theme engine, not via the `--ohfy-*` token set used by internal UI packages (OMS-UI, WMS-UI, PLTFM-UI, REX-UI).
2. **Customer-facing vs internal** — The `--ohfy-*` tokens encode the Ohanafy internal brand (Cork, Mellow Yellow, Dark Denim, etc.). The eCommerce storefront is white-labeled for each customer's brand — forcing internal tokens would break customer theming.
3. **Admin chrome independence** — `ecomThemeAdmin` itself uses literal hex intentionally so its UI stays readable regardless of what theme values the admin saves.

---

## Task 1: Remove All `ohfy-disable` Bypass Comments

Strip every `<!-- ohfy-disable ... -->` and `<!-- ohfy-disable-next-line ... -->` comment from HTML files in the package. These are no-ops since the rule doesn't run here.

### Files & Counts

| Component | File | Bypass Count |
|---|---|---|
| `ecomRegister` | `ecomRegister.html` | 11 |
| `ecomShop` | `ecomShop.html` | 5 |
| `ecomProfilePage` | `ecomProfilePage.html` | 5 |
| `ecomProductPage` | `ecomProductPage.html` | 3 |
| `ecomCartPage` | `ecomCartPage.html` | 1 |
| **Total** | | **25** |

### How

Remove entire lines (or just the comment portion if on a line with other content) matching:
- `<!-- ohfy-disable no-hardcoded-hex -->`
- `<!-- ohfy-disable-next-line no-hardcoded-hex -->`

No functional change — these comments have no effect since the rule is globally excluded for this package.

---

## Task 2: Confirm CSS-Level Exclusion Is Intact

The Stylelint `ohfy-theme/no-hardcoded-hex` rule also already ignores `OHFY-eCommerce-UI/**`. One CSS file has its own file-level disable comment that is also redundant:

| Component | File | Comment |
|---|---|---|
| `ecomThemeAdmin` | `ecomThemeAdmin.css:1` | `/* stylelint-disable ohfy-theme/no-hardcoded-hex -- ... */` |

This can optionally be removed as well, though it also serves as documentation for why the file uses literal hex (admin chrome that must remain readable regardless of saved theme). **Decision: keep or remove** is up to the implementer — the comment is harmless either way.

---

## Inventory: Hardcoded Hex Values in eCommerce-UI

For reference, here is the current distribution of hardcoded hex values. These are **not being migrated** — eCommerce-UI is excluded from token enforcement because it has its own theming system (`ecomThemeAdmin`).

### By File Type

| Type | Occurrences |
|---|---|
| CSS | ~203 |
| HTML (inline styles) | ~39 |
| JS | ~32 |
| **Total** | **~274** |

### By Component

| Component | CSS | HTML | JS | Total |
|---|---|---|---|---|
| `ecomThemeAdmin` | 136 | — | 20 | 156 |
| `ecomProfilePage` | — | 13 | 4 | 17 |
| `ecomRegister` | — | 11 | — | 11 |
| `ecomShop` | 2 | 5 | 3 | 10 |
| `ecomProductPage` | — | 6 | — | 6 |
| `ecomFooter` | 6 | — | — | 6 |
| `colorUtils` | — | — | 5 | 5 |
| `ecomCartPage` | — | 4 | — | 4 |
| `configurableBanner` | 3 | — | — | 3 |

### Unique Hex Colors (HTML inline styles)

```
#0176d3  #0a6ffd  #15803d  #2663eb  #92400e
#bbf7d0  #f0fdf4  #f3f4f6  #f59e0b  #fefce8
```

### Unique Hex Colors (JS)

```
#000000  #002870  #003594  #111827  #16325c
#2663eb  #4bca81  #555555  #d1d5db  #e53e3e
#f3f4f6  #f9fafb  #fbbf24  #ffb75d  #ffffff
```

---

## Why eCommerce-UI Is Excluded

The eCommerce storefront has its own runtime theming system (`ecomThemeAdmin`) that lets admins configure colors via CMDT records. The theme admin UI itself intentionally uses literal hex so its chrome remains readable regardless of what theme values are saved. The storefront components consume theme values at runtime via CSS custom properties set by the theme engine — not via the `--ohfy-*` design tokens used by the internal Ohanafy UI packages.

Enforcing `--ohfy-*` tokens here would conflict with the customer-facing theming model.

---

## Acceptance Criteria

- [ ] All 25 `<!-- ohfy-disable ... -->` comments removed from HTML files
- [ ] No functional or visual regressions (bypass removal is cosmetic — the rule was never running)
- [ ] `npm run lint` still passes (confirms the config-level exclusion is working)
- [ ] `npm run prettier:verify` passes after removal
