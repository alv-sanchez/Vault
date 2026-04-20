---
ticket: BMS-3923
title: Experience Cloud theme & brand setup (Gulf branding)
type: Audit
status: Backlog — AC 1 configuration partially in progress
file_audited: force-app/main/default/lwc/ecomOrderHistory/ecomOrderHistory.js (the @wire only) + Experience Builder theme panel
jira: https://ohanafy.atlassian.net/browse/BMS-3923
audited_on: 2026-04-14
tags:
  - audit
  - ecom
  - branding
  - manager
---
%%  %%
# BMS-3923 — Experience Cloud theme & brand setup (Gulf branding)

> [!warning] Verdict
> **AC 1 (configuration) is partially in progress.** Site header logo and favicon are done; primary / secondary / accent brand colors are being set in the Experience Builder theme panel; font family is still untouched. **AC 2 is not separate work** — it's the validation that AC 1's tokens cascaded correctly to standard components, so each AC 2 item inherits its status from its AC 1 dependency. **AC 3 (responsive), AC 4 (WCAG), and AC 5 (login page branding) remain at zero.** The Jira comment claiming "Completed — Experience Cloud brand setup is now wired through `getBrandingResource`" still overstates the scope and should be walked back to reflect partial progress.

## Status legend

- ✅ **Done** — configuration applied and verified
- 📝 **In progress** — being configured in Experience Builder
- ❌ **Not started**
- ⚠️ **Concern / smell** — works but worth flagging

---

## ✅ What IS there

### In Experience Builder (admin config)
- ✅ Site header logo set (correct aspect ratio on desktop + mobile)
- ✅ Favicon set to Gulf icon
- 📝 Primary / Secondary / Accent brand colors being applied via the Theme panel

### In LWC code (reusable plumbing)
```js
@wire(getBrandingResource, { resourceKey: 'OhanaLoadingImage' })
wiredBranding({ data }) {
    if (data) {
        this.loadingLogo = '/resource/' + data;
    }
}
```

- A reusable Apex method (`getBrandingResource`) that resolves a static-resource URL by key
- A `@wire` consumer in `ecomOrderHistory.js` that pulls one image by key `'OhanaLoadingImage'`
- Assignment to `this.loadingLogo` for the loading spinner
- (Per the user's Jira comment) the same pattern is also used for `defaultImage` somewhere

**What this gives you in practice**: any LWC component that wants a brand-configurable image can `@wire` it via the same method. That's reusable plumbing — useful, but unrelated to AC 1's theme panel work.

---

## AC status — work items + validation gates

### AC 1 — Configuration (set the tokens)
The actual work items. Each is a single configuration action in Experience Builder.

| Status | Token | Where |
|---|---|---|
| ✅ | Site header logo (correct aspect ratio, desktop + mobile) | Theme panel → Logo |
| ✅ | Favicon set to Gulf icon | Site → General → Favicon |
| 📝 | Primary brand color | Theme panel → Colors |
| 📝 | Secondary brand color | Theme panel → Colors |
| 📝 | Accent color | Theme panel → Colors |
| ❌ | Default font family applied globally (headings / body / navigation) | Theme panel → Typography |

⚠️ **Wrong brand name in resource key** — the literal `resourceKey` in the LWC `@wire` is `'OhanaLoadingImage'`, not a Gulf-named asset. The static resource record itself may point to a Gulf image, but the key string baked into LWC code references "Ohana". Cosmetic but worth fixing before this work is considered done.

### AC 2 — Validation (tokens cascade correctly)
**Not separate work — these are validation gates that depend on AC 1 being done.** Each item inherits its status from the AC 1 token it depends on. Once AC 1's tokens are set in the Theme panel, SLDS-styled components pick them up automatically without per-component CSS.

| Status | Validation check | Depends on AC 1 item |
|---|---|---|
| 📝 | Standard Button renders in primary brand color with white text | ← Primary brand color (📝) |
| 📝 | Button hover/focus states use secondary brand color | ← Secondary brand color (📝) |
| ❌ | Standard Card inherits font family from theme | ← Default font family (❌) |
| 📝 | Standard Card inherits background / border-radius from theme | ← Theme background token (📝, partial) |

**The real risk in AC 2 isn't the cascade itself — it's whether existing custom LWCs have already overridden these tokens with hardcoded CSS.** Once AC 1 finishes, do a one-page sweep of `force-app/main/default/lwc/**` for hardcoded color classes (`bg-yellow-`, `text-yellow-`, `border-yellow-`, `bg-blue-`, etc. — Tailwind utility classes that bypass SLDS tokens). The `ecomOrderHistory`, `ecomShop`, and other Tailwind-loaded LWCs are most likely to have this problem.

### AC 3 — Responsive layout and mobile rendering
- ❌ Logo repositions/resizes at 1440px / 768px / 375px breakpoints without overflow or clipping
- ❌ Navigation collapses to hamburger menu at mobile breakpoint with brand-colored icon
- ❌ No horizontal scrollbar at any breakpoint
- ❌ Text legible (min 14px body equivalent) across all breakpoints
- ❌ **Nothing in this AC is addressed.**

### AC 4 — Accessibility contrast compliance
- ❌ WCAG 2.1 AA contrast audit (4.5:1 normal text, 3:1 large text)
- ❌ Documented alternative pairing for any combo that fails AA
- ❌ Interactive elements distinguishable from static text without relying solely on color
- ❌ **Nothing in this AC is addressed.**

### AC 5 — Login and unauthenticated pages carry branding
- ❌ Login page displays Gulf logo, brand colors, branded background — NOT default Salesforce template
- ❌ Forgot Password page inherits theme
- ❌ Self-registration page inherits theme
- ❌ No Salesforce default logos or blue color scheme on any unauthenticated page
- ❌ **Nothing in this AC is addressed**, and structurally **nothing in this AC CAN be addressed by an LWC `@wire`** — login pages run before any LWC mounts. AC 5 needs Experience Builder login template configuration.

---

## 🚨 Ticket bloat / scope concerns

### This is at least 5 tickets disguised as one
The ticket title is "theme & brand setup," but the ACs span **five distinct surfaces of work**, each with its own configuration UI, its own deliverables, and (in some cases) its own skill set:

| Sub-feature | Where the work lives | Suggested split |
|---|---|---|
| Brand colors + fonts + header logo + favicon | Experience Builder → Theme panel | **Split #1** — admin-config work, no code |
| Design token cascade for downstream LWCs | CSS custom properties + theme layout component | **Split #2** — engineering work, depends on #1 |
| Responsive layout validation at 1440 / 768 / 375 | QA / regression activity | **Split #3** — testing-shaped task, not a build task |
| WCAG 2.1 AA contrast audit + remediation | Lighthouse / axe DevTools audit + design fixes | **Split #4** — separate skill set, requires Gulf brand approval if remediation needed |
| Login + unauthenticated page branding | Experience Cloud login template config (different from Theme panel) | **Split #5** — separate config surface |

A single "Done" verdict on this ticket would conflate admin theme config, frontend engineering, QA validation, accessibility audit, and a separate auth-page config — none of which a single engineer can credibly own as one PR.

### WCAG audit is not theme setup
AC 4 asks for a WCAG 2.1 AA contrast pass with a documented alternative pairing if any Gulf brand color combo fails. **This is open-ended remediation work.** If Gulf's brand palette fails AA in any of the standard pairings (highly likely for any palette that wasn't designed with WCAG in mind), the team will need to:

- Pick alternative shade pairings
- Get them approved by Gulf's brand stakeholder
- Re-audit
- Possibly negotiate brand-guideline exceptions

That's a **multi-week conversation**, not a build task — and it absolutely should not be hidden inside a "theme setup" ticket. Should be its own story, with its own stakeholder cycle.

### Login page branding lives in a different config UI
AC 5 requires that the Salesforce login template be replaced with a Gulf-branded one. **This is configured separately from the Experience Builder Theme panel** — it lives under Site → Login & Registration → Login Page Type / Branding. A different surface, different testing, different rollback story. Bundling it into "theme setup" makes the ticket harder to ship and harder to verify.

### Over-prescriptive AC items
- **"1440px, 768px, 375px"** — three exact breakpoints in an AC is over-spec. SLDS handles most of this; testing at exactly those three values feels like the author was Googling "common breakpoints" rather than asking what Gulf retailers actually use.
- **"Minimum 14px body equivalent"** — this is the Salesforce default. Calling it out as AC is over-specifying baseline behavior.
- **"Button renders in primary brand color with white text"** — this is SLDS default behavior for `slds-button_brand` once the theme palette is set. Auditing it as a separate AC scenario is auditing SLDS, not the theme.

### Open questions still unanswered
The ticket has three open questions that the team never resolved:
- Does Gulf have an existing brand style guide (hex codes, font files, logo variants)?
- Should this ticket include a secondary dark mode theme variant?
- Will the site use a custom domain (e.g., `portal.gulfdistributors.com`)?

**The first one is the kicker** — without an existing brand style guide, **none of AC 1, AC 2, or AC 4 can even start**. You don't have hex codes to enter, font files to upload, or a documented palette to audit against. The ticket is unbuildable until that question is answered.

### The ticket is labeled `refinement-needed`
The ticket itself carries the `refinement-needed` label from the author. This is a flag that the work was never properly groomed. **Acting on a `refinement-needed` ticket without insisting on the refinement is how scope creeps post-deploy.**

### The Jira comment overstates completion
On 2026-04-13, this comment was posted to BMS-3923:

> "Completed — Experience Cloud brand setup is now wired through the centralized `getBrandingResource` Apex method. LWCs pull both the loading logo and default fallback image from the branding resource…"

This is **technically accurate for the loading spinner**, but the ticket is not about loading spinners. **Closing this ticket as Done with only the wire in place would mark all 5 ACs as passed when only ~5% of one AC is actually addressed.** Future engineers reading this ticket history will assume the theme work was done, which it wasn't, and the next "Gulf branding doesn't look right" bug will be a surprise.

---

## Recommendation

1. **Walk back the Jira comment** to reflect partial progress, not "Completed." Suggested replacement: "Header logo and favicon set in Experience Builder. Primary / secondary / accent colors in progress. Reusable LWC branding plumbing landed via `getBrandingResource` for spinner / fallback image cases. Font family, design token validation, login page branding, WCAG audit, and responsive validation remain open."
2. **Finish AC 1 first, then AC 2 falls out for free.** Once tokens are set, AC 2's validation gates should pass automatically — the only real remaining engineering work is the LWC sweep for hardcoded Tailwind color classes that bypass SLDS tokens.
3. **Do NOT close BMS-3923 yet.** AC 3 (responsive), AC 4 (WCAG), and AC 5 (login page) are still untouched. Split those into sub-tickets before considering this done.
4. **Get the open questions answered in writing** — especially "does Gulf have a brand style guide." Without it, the in-progress color work is guess-driven and may need to be redone once the official palette arrives.
5. **Push the WCAG audit out** — make it a separate story so it doesn't block the visual brand setup from shipping.
6. **Fix the `OhanaLoadingImage` resource key** — rename to a Gulf-specific key as part of the existing in-progress work, before the wire ships to anyone else.
7. **Treat the LWC wire as plumbing, not a feature.** It's a useful pattern other tickets can consume but doesn't satisfy any AC on its own.

## Related
- Jira: https://ohanafy.atlassian.net/browse/BMS-3923
- Blocked by: BMS-3930
- Code touched: `force-app/main/default/lwc/ecomOrderHistory/ecomOrderHistory.js` (`@wire(getBrandingResource…)` — single block, ~6 lines)
- Open questions block this work: Gulf brand style guide existence, dark mode scope, custom domain
