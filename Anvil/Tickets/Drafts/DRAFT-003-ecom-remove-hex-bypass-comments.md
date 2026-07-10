---
ticket: BMS-5309
title: "Remove redundant ohfy-disable bypass comments and formalize eCommerce-UI exclusion from token/hex enforcement"
type: Chore
status: Backlog
priority: Low
assignee:
reporter: Alvaro Sanchez
epic:
sprint:
labels:
  - ecom
  - tech-debt
package: E-Commerce
effort: S
components:
  - ecomRegister
  - ecomShop
  - ecomProfilePage
  - ecomProductPage
  - ecomCartPage
  - ecomThemeAdmin
blocked_by:
blocks:
created:
updated:
jira: https://ohanafy.atlassian.net/browse/BMS-5309
tags:
  - ticket
  - ecom
  - cleanup
---

# Remove redundant ohfy-disable bypass comments and formalize eCommerce-UI exclusion from token/hex enforcement |ECOM|

## Related
- Hand-off: [[ecom-ui-remove-hex-bypasses]]

---

**Priority**: Low
**Effort**: S
**Components**: ecomRegister, ecomShop, ecomProfilePage, ecomProductPage, ecomCartPage, ecomThemeAdmin (CSS)

## Story Statement

As an engineer, I want to remove dead `ohfy-disable` bypass comments from OHFY-eCommerce-UI LWC files and formalize that eCommerce-UI is permanently excluded from both `--ohfy-*` CSS token consumption and the `no-hardcoded-hex` lint rule, so that future contributors understand the boundary and don't waste time migrating this package to the internal design-token system.

## Exclusion Rationale

OHFY-eCommerce-UI must **not** be enforced to consume `--ohfy-*` (aka `var(--ohfy-color-*)`, `var(--ohfy-spacing-*)`, etc.) CSS design tokens or comply with the `ohfy-theme/no-hardcoded-hex` lint rule. The reasons:

1. **Separate theming system** — The eCommerce storefront has its own customer-facing runtime theming engine (`ecomThemeAdmin`) that lets admins configure colors via CMDT records. Theme values are injected at runtime as CSS custom properties by the theme engine, not via the `--ohfy-*` token set used by internal Ohanafy UI packages (OMS-UI, WMS-UI, PLTFM-UI, REX-UI).
2. **Customer-facing vs internal** — The `--ohfy-*` tokens encode the Ohanafy internal brand (Cork, Mellow Yellow, Dark Denim, etc.). The eCommerce storefront is white-labeled for each customer's brand — forcing internal tokens would break customer theming.
3. **Admin chrome independence** — `ecomThemeAdmin` itself uses literal hex intentionally so its UI remains readable regardless of what theme values are saved by the admin.

This exclusion is already implemented at the config level (`eslint.config.js:117`, `stylelint.config.js:29`) but is not documented anywhere — this ticket formalizes it.

## Acceptance Criteria

### SCENARIO: All HTML bypass comments are removed
**GIVEN** the `OHFY-eCommerce-UI` package contains 25 `<!-- ohfy-disable no-hardcoded-hex -->` and `<!-- ohfy-disable-next-line no-hardcoded-hex -->` comments across 5 LWC HTML files
**WHEN** the cleanup is applied
**THEN** zero `ohfy-disable` comments remain in any `.html` file under `OHFY-eCommerce-UI/force-app/`
**AND** `grep -rn "ohfy-disable" OHFY-eCommerce-UI/force-app --include="*.html"` returns no results

### SCENARIO: No functional or visual regressions
**GIVEN** the `ohfy-theme/no-hardcoded-hex` rule is already excluded for `OHFY-eCommerce-UI` at config level in both `eslint.config.js` (line 117) and `stylelint.config.js` (line 29)
**WHEN** the bypass comments are removed
**THEN** `npm run lint` passes with no new warnings or errors
**AND** `npm run prettier:verify` passes
**AND** no visual changes occur in any eCommerce storefront component

### SCENARIO: eCommerce-UI exclusion from token/hex enforcement is documented
**GIVEN** `OHFY-eCommerce-UI` is excluded from `ohfy-theme/no-hardcoded-hex` in both `eslint.config.js` and `stylelint.config.js`, and is not expected to consume `--ohfy-*` CSS design tokens — because `--ohfy-*` tokens are for LWCs used internally within the Salesforce app, whereas eCommerce is built on an Experience Site with its own theme settings and configurations managed by `ecomThemeAdmin`
**WHEN** the PR is merged
**THEN** the exclusion rationale is captured in the PR description (or a code comment in the lint configs) so that future engineers understand this is intentional, not an oversight
**AND** no new `--ohfy-*` token enforcement or `no-hardcoded-hex` rule coverage is added for `OHFY-eCommerce-UI`

### SCENARIO: Optional CSS-level disable comment
**GIVEN** `ecomThemeAdmin.css` line 1 contains `/* stylelint-disable ohfy-theme/no-hardcoded-hex -- ... */`
**WHEN** the engineer reviews it
**THEN** the comment may be kept (it doubles as documentation for why the admin chrome uses literal hex) or removed (it is technically redundant since the config excludes the package)
**AND** the decision is noted in the PR description

## Dependencies
- **Cannot Start Until**: None
- **This Story Unlocks**: None
- **Ships With**: None

## Testing Notes
- Verify `eslint.config.js:117` still ignores `**/OHFY-eCommerce-UI/**` for the `ohfy-theme/no-hardcoded-hex` rule
- Verify `stylelint.config.js:29` still ignores `OHFY-eCommerce-UI/**`
- Run `npm run lint` and `npm run prettier:verify` after removal
- No Apex or backend changes — purely HTML comment removal

## Implementation Notes
- **Bypass distribution**: ecomRegister (11), ecomShop (5), ecomProfilePage (5), ecomProductPage (3), ecomCartPage (1)
- Config-level exclusions live in `eslint.config.js:117` and `stylelint.config.js:29` — do not remove those
- The eCommerce package has its own runtime theming system (`ecomThemeAdmin`) that justifies the exclusion — hardcoded hex values in this package are intentional and will not be migrated to `--ohfy-*` tokens
- Total hardcoded hex in the package: ~274 occurrences (203 CSS, 39 HTML inline, 32 JS) — these are NOT in scope for removal, only the bypass comments are
- Detailed inventory in the hand-off doc: `Engineering/Hand-Offs/ecom-ui-remove-hex-bypasses.md`
