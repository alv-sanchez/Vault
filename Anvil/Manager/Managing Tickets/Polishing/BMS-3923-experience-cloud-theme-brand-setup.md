---
ticket: BMS-3923
title: "Experience Cloud theme & brand setup (Gulf branding)"
type: Story
parent_epic: "BMS-3702 — Gulf E-Commerce & Ordering"
blocked_by: "BMS-3930 — Retailer credit terms display & payment status"
status: "Needs Refinement"
sprint: "Sprint 1"
repo_scanned: "/Users/alvarosanchez_1/Documents/OHFY-Ecom/force-app"
polished_on: 2026-04-17
polished_by: Alvaro Sanchez
jira: https://ohanafy.atlassian.net/browse/BMS-3923
tags: [polish, ecom, gulf, branding]
---

# BMS-3923 — Jira-Ready

**Title:** Experience Cloud theme & brand setup (Gulf branding)

**Description:**

Deliver Gulf branding across the Experience Cloud portal by (1) creating Gulf static resources + matching `Ecom_Branding__mdt` records so existing `getBrandingResource` consumers render Gulf assets with zero code changes, (2) introducing a global CSS token layer (`OhfyGlobalStyles.css`) referenced in Experience Builder Head Markup so downstream LWCs consume `var(--ohfy-*)` instead of hard-coded values, and (3) applying Gulf colors/fonts via Experience Builder's Theme panel.

**Current State (2026-04-17, per codebase scan):**
- `EcomBrandingController.getBrandingResource(resourceKey)` is live — consumed by 10+ LWCs (navigationMenu, ecomLogoDisplay, ecomShop, ecomPromotions, ecomOrderHistory, …).
- `Ecom_Branding__mdt` holds 20 `resourceKey → Static_Resource_Name__c` mappings; key used as fallback.
- Static resources today are Ohana-branded — no Gulf assets.
- No `--ohfy-*` CSS custom-property layer exists. Styling is Tailwind + Salesforce `--dxp-g-*`.
- Layout = `navigationMenu` (header) + `ecomFooter` (footer). No unified Theme Layout component.

**Out of Scope:**
- Experience Cloud site provisioning itself (pending BMS-3930 clarification).
- Custom domain `portal.gulfdistributors.com` (follow-up).
- New consumer LWCs (covered by downstream ECOM tickets).

**Acceptance Criteria:**

```gherkin
Scenario: Gulf static resources mapped via Ecom_Branding__mdt
  Given Gulf logo, loading image, favicon, and hero banner are committed as static resources
  When  OHFY-Ecom is deployed with matching Ecom_Branding__mdt records
  Then  Records exist mapping OhanaLogo→GulfLogo, OhanaLoadingImage→GulfLoadingImage, Favicon→GulfFavicon, EcomHeroBanner→GulfHeroBanner
  And   Each resourceKey resolves through getBrandingResource to the Gulf resource

Scenario: Existing LWCs render Gulf assets without code changes
  Given Gulf Ecom_Branding__mdt records are active
  When  the site loads
  Then  All 10+ LWCs consuming getBrandingResource display Gulf assets with no component-level edits

Scenario: Global brand tokens delivered via OhfyGlobalStyles static resource
  Given OhfyGlobalStyles.css is committed defining :root tokens
        (--ohfy-color-primary, --ohfy-color-secondary, --ohfy-color-accent,
         --ohfy-color-text, --ohfy-font-family, --ohfy-radius-md)
  When  the static resource is referenced in Experience Builder (Head Markup <link> or Theme custom CSS)
  Then  Tokens are available globally and inherit through shadow DOM into every LWC
  And   LWC CSS uses var(--ohfy-*) with no imports required

Scenario: Sample LWC consumes tokens (cascade verification)
  Given OhfyGlobalStyles is loaded
  When  a sample LWC sets background: var(--ohfy-color-primary)
  Then  the element renders the Gulf primary color
  And   changing the token value + redeploy updates color everywhere with no component edits

Scenario: Brand color & typography via Experience Builder Theme panel
  Given the Experience Cloud site is provisioned
  When  an admin applies the Gulf theme
  Then  primary/secondary/accent colors + font match Gulf's brand palette
  And   --dxp-g-* tokens align with --ohfy-* tokens (single source of truth)

Scenario: Responsive layout at 1440/768/375 px
  Given Gulf theme is applied
  When  a reviewer previews at each breakpoint
  Then  logo rescales, navigation collapses to hamburger at mobile, no horizontal scroll, body text ≥14px

Scenario: WCAG 2.1 AA accessibility compliance
  Given Gulf colors are applied
  When  the site is audited with Lighthouse or axe DevTools
  Then  all text/background combos meet AA contrast (4.5:1 normal, 3:1 large)
  And   interactive elements are distinguishable without relying on color alone

Scenario: Login and unauthenticated pages carry Gulf branding
  Given a retailer hits the portal URL unauthenticated
  When  login and password-reset pages render
  Then  Gulf logo + palette are visible; no default Salesforce template or blue scheme

Scenario: Tokens documented for downstream ECOM sprints
  Given OhfyGlobalStyles.css exists
  When  a developer opens the file
  Then  a header comment block lists each --ohfy-* token with its Gulf value and usage role
  And   downstream tickets can consume tokens without hard-coded hex values
```

**Technical Approach:**
1. **Assets:** Create `GulfLogo.png`, `GulfLoadingImage.png`, `GulfFavicon.png`, `GulfHeroBanner.jpeg` + `Ecom_Branding.Gulf*.md-meta.xml` records.
2. **Tokens:** Commit `staticresources/OhfyGlobalStyles.css` with Gulf `:root` custom properties + header comment docs; reference via Experience Builder Head Markup `<link>`.
3. **Consumers:** Audit `navigationMenu`, `ecomFooter`, and 8 other `getBrandingResource` consumers for hard-coded hex/font values; replace with `var(--ohfy-*)`.
4. **Theme panel:** Set Experience Builder color/font pickers to match tokens so `--dxp-g-*` aligns.
5. **A11y gate:** Run Lighthouse/axe on dev scratch org; document alternative pairings for any AA failures.

**Open Questions (carry to refinement):**
- Confirm BMS-3930 is the correct "blocked by" — its title reads as credit-terms UI, not site provisioning.
- Gulf brand kit (hex codes, font files, logo variants, favicon set) — received?
- Custom domain in scope or follow-up?

**Estimate:** ~2 days (1d assets + metadata, 1d token layer + consumer audit + a11y).

---

# BMS-3923 — Polish Notes

## Verdict at a Glance
**Ready for refinement with small scope corrections.** The branding infrastructure already exists — it's not net-new. Gulf branding is a **data/asset swap plus potential token layer**, not a platform build. The auto-gen discovery analysis ("no existing pattern found") is wrong; the ticket should be rebased on the real pattern.

| Area                                                  | Verdict                                                                                                                      |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Story statement (Gulf-branded portal from day one)    | Confirmed                                                                                                                    |
| Acceptance criteria (5 Gherkin scenarios)             | Mostly testable — see edits below                                                                                            |
| Auto-gen claim: "net new development"                 | **Contradicted** — branding pattern is mature                                                                                |
| Alvaro's comment: `getBrandingResource` already wired | **Confirmed** (`EcomBrandingController.cls:37-50`)                                                                           |
| `OhanaLoadingImage` static resource                   | **Confirmed** (`staticresources/OhanaLoadingImage.png`)                                                                      |
| Brand tokens as CSS custom properties (`--ohfy-*`)    | **Contradicted** — not in use; codebase uses Tailwind + Salesforce `--dxp-g-*`                                               |
| Custom Theme Layout component (Aura or LWC)           | **Contradicted by structure** — no unified layout; `navigationMenu` (header) + `ecomFooter` (footer) are separate components |
| Experience Cloud site metadata                        | Absent in source control — site may exist in-org but is not tracked                                                          |
| Dependency BMS-3930                                   | **Mismatched title** — that ticket is "Retailer credit terms display & payment status", not site provisioning                |

---

## Phase 2 — Business Requirements & ACs

### Structural check
- ✅ Clear purpose
- ✅ Testable Gherkin ACs
- ✅ Scoped (theme/brand only, not the broader site build)
- ✅ Correct issue type (Story)

### AC validation
| Scenario | Verdict | Note |
|---|---|---|
| 1. Gulf brand theme applied in Experience Builder | Partially testable | Logo / palette / font / favicon observable, but the ticket should clarify whether this is done via Experience Builder Theme panel **OR** via the existing `Ecom_Branding__mdt` + static resource pattern — they're different levers |
| 2. Theme tokens cascade to sample component | **Contradicted by current code** | The codebase has **no CSS custom-property token system today**. Cascade today happens via (a) Tailwind utility classes, (b) Salesforce `--dxp-g-*` tokens, and (c) metadata-driven asset swaps via `getBrandingResource`. The AC as written requires a net-new token layer |
| 3. Responsive layout at 1440/768/375 | Confirmed — testable | Navigation currently uses Tailwind responsive classes; breakpoint coverage is plausible |
| 4. WCAG 2.1 AA contrast | Confirmed — testable | Good to keep as-is |
| 5. Login / unauth pages carry branding | Confirmed — testable | Scope note: unauthenticated pages are Salesforce-controlled; this AC requires either Experience Builder login page config or a custom login LWC |

### Gaps to plug
- **Missing AC**: "Create Gulf static resources and corresponding `Ecom_Branding__mdt` records so existing `getBrandingResource` consumers render Gulf assets without code changes." This is the actual shape of the work in this codebase.
- **Missing AC**: Regression criterion — existing 10+ LWCs that consume `getBrandingResource` (navigationMenu, ecomLogoDisplay, ecomShop, ecomPromotions, ecomOrderHistory, etc.) continue to render without visual regression.
- **Missing AC**: Handoff criterion — "Downstream ECOM tickets can consume Gulf brand tokens without hard-coded values," if the CSS token layer is in scope.
- **Open question (already on ticket)**: custom domain — decide in scope or split.

---

## Phase 3 — Technical Approach

### Ticket says
> "Configure the Experience Cloud site theme via Experience Builder's Theme panel — set brand colors, fonts, and logo assets as **design tokens** so all downstream LWC components inherit them automatically. Use a custom Theme Layout component (Aura or LWC-based) for header/footer to enforce consistent chrome. **Export brand tokens as CSS custom properties** for any custom LWC components built in later ECOM sprints."

### Claim-by-claim validation (honesty protocol)

**Claim 1: `getBrandingResource` is already wired up (Alvaro's comment)**
- **Code shows:** `EcomBrandingController.cls:37-50` — `@AuraEnabled(cacheable=true) String getBrandingResource(String resourceKey)` returning a static resource name by querying `Ecom_Branding__mdt`. 10+ LWCs use the `@wire(getBrandingResource, {resourceKey: '...'})` pattern (navigationMenu, ecomLogoDisplay, ecomShop, ecomPromotions, ecomOrderHistory, etc.). 20 `Ecom_Branding__mdt` records exist at `customMetadata/ecomBranding/` (OhanaLoadingImage, OhanaLogo, Favicon, category icons).
- **Assessment:** **Confirmed.** The auto-gen "no existing pattern found" note is incorrect.

**Claim 2: Configure theme via Experience Builder Theme panel**
- **Code shows:** No Experience Cloud network metadata in source control (`networks/`, `communities/`, `experiences/` absent). The site likely exists in-org but isn't tracked. Experience Builder theme config happens in the org, not necessarily in the repo.
- **Assessment:** **Unverifiable from code** (but not contradicted). The Theme panel is valid; just needs the org provisioned first.

**Claim 3: "Design tokens" / "export brand tokens as CSS custom properties"**
- **Code shows:** No `--ohfy-*` custom properties anywhere. `navigationMenu.css` uses `--dxp-g-root`, `--dxp-g-root-font-family`, `--dxp-g-neutral-contrast` (Salesforce platform defaults). Styling is otherwise Tailwind utility classes (`tailwind.css` is a 2.9 MB static resource).
- **Assessment:** **Contradicted today.** If we want a Gulf-specific CSS custom property layer, it's **net-new scope** — not a repaint of existing tokens.

**Claim 4: Custom Theme Layout component (Aura or LWC)**
- **Code shows:** No `ThemeLayout` component. The layout is composed of two discrete LWCs: `navigationMenu` (header with search, cart badge, user menu, logo via `getBrandingResource`) and `ecomFooter` (footer accordion menus).
- **Assessment:** **Contradicted as "single theme layout".** Either (a) leave the two-component layout, or (b) decide to build a unified Theme Layout. Both are valid; ticket should pick one explicitly.

**Claim 5: Gulf-specific assets and metadata records**
- **Code shows:** Static resources today are Ohana-branded (`OhanaLogo.png`, `OhanaLoadingImage.png`, `faviconOhana.png`, `EcomHeroBanner.jpeg`, product category icons). **No `gulf-*` or `Gulf*` resources exist.** No `Ecom_Branding.Gulf*` metadata records.
- **Assessment:** **Incomplete.** This is the bulk of the real work: create Gulf-equivalent static resources + corresponding metadata records.

### Scorecard
| # | Claim | Verdict |
|---|---|---|
| 1 | `getBrandingResource` wired | Confirmed |
| 2 | Experience Builder Theme panel | Unverifiable (site not in repo) |
| 3 | CSS custom-property tokens | Contradicted (net-new) |
| 4 | Unified Theme Layout component | Contradicted by structure |
| 5 | Gulf assets in repo | Incomplete — net-new assets required |

---

## Phase 4 — Dependencies

| Link | Check | Result |
|---|---|---|
| Blocked by BMS-3930 ("Retailer credit terms display & payment status") | Does upstream deliver the site shell? | **Title mismatch.** BMS-3930 title is about credit-terms UI, not site shell provisioning. Either re-link or clarify BMS-3930's true scope. |
| Parent BMS-3702 (Gulf ECOM) | Parent consistent | Confirmed |
| Downstream ECOM tickets (BMS-3928, BMS-3926, etc.) | Do they assume Gulf tokens exist? | Likely yes. Ship Gulf-specific `Ecom_Branding__mdt` records + assets as the concrete handoff artifact |

---

## Top Issues (ranked)

1. **Dependency mismatch on BMS-3930.** The "blocked by" points at a credit-terms ticket. Either fix the link or clarify BMS-3930's scope in its own title.
2. **AC #2 "theme tokens cascade" needs grounding.** Today's cascade is Tailwind + platform tokens + metadata-driven assets. Decide whether to add a `--ohfy-*` custom-property layer as part of this ticket or defer.
3. **Rewrite the technical approach.** The "net new development" framing is wrong. The real work is: (a) create Gulf static resources, (b) add `Ecom_Branding.Gulf*` metadata records, (c) optionally introduce a CSS custom-property token layer, (d) ensure `ecomFooter` also consumes `getBrandingResource` (currently only the header does per the scan).
4. **Decide unified Theme Layout vs. keep `navigationMenu + ecomFooter` pair.** Both valid; be explicit.
5. **Regression coverage.** 10+ LWCs currently depend on `getBrandingResource`. Swapping resource mappings in the mdt must not break them.

---

## Suggested Revisions

### Proposed title (unchanged)
"Experience Cloud theme & brand setup (Gulf branding)"

### Proposed description addition
Add a "Current State" section so the team isn't refining against a blank slate:

> **Current State (as of 2026-04-17, per codebase scan):**
> - `EcomBrandingController.getBrandingResource(resourceKey)` is live and consumed by 10+ LWCs (navigationMenu, ecomLogoDisplay, ecomShop, ecomPromotions, ecomOrderHistory, …).
> - `Ecom_Branding__mdt` (custom metadata type) holds 20 `resourceKey → Static_Resource_Name__c` mappings; fallback logic uses the key if no mdt record is found.
> - Today's static resources are Ohana-branded (no Gulf assets).
> - No `--ohfy-*` CSS custom-property layer exists; styling is Tailwind + Salesforce `--dxp-g-*` tokens.
> - `navigationMenu` is the header; `ecomFooter` is the footer. No unified Theme Layout component.

Add an "Out of Scope" section:

> - Experience Cloud site provisioning itself (depends on clarifying BMS-3930 scope or a separate ticket).
> - Custom domain (`portal.gulfdistributors.com`) — split to follow-up unless confirmed in scope.
> - New LWCs that would *consume* the tokens (covered by downstream ECOM tickets).

### Proposed replacement ACs
```gherkin
Scenario: Gulf static resources uploaded and mapped via Ecom_Branding__mdt
  Given the Gulf-approved logo, loading image, favicon, and hero banner are committed as static resources
  When  an admin deploys OHFY-Ecom with matching Ecom_Branding__mdt records
  Then  Ecom_Branding records exist for: OhanaLogo → GulfLogo, OhanaLoadingImage → GulfLoadingImage, Favicon → GulfFavicon (and any others needed)
  And   Each resourceKey resolves via getBrandingResource to the Gulf static resource name

Scenario: Existing LWCs render Gulf assets without code changes
  Given the Gulf Ecom_Branding__mdt records are active
  When  the site loads in any browser context
  Then  navigationMenu displays GulfLogo
  And   ecomLogoDisplay renders the Gulf logo
  And   All 10+ LWCs currently consuming getBrandingResource display Gulf assets (no component-level imports or URLs changed)

Scenario: Brand color & typography applied via Experience Builder theme
  Given the Experience Cloud site is provisioned
  When  an admin applies the Gulf theme in Experience Builder's Theme panel
  Then  Primary, secondary, accent colors and default font family match Gulf's approved brand palette
  And   Standard Button and Card components on a test page render with the Gulf theme without per-component CSS overrides

Scenario: Responsive layout at desktop, tablet, and mobile
  Given the Gulf theme is applied
  When  a reviewer previews at 1440px, 768px, 375px
  Then  Logo rescales/repositions cleanly, no horizontal scroll at any breakpoint
  And   Navigation collapses to a hamburger menu at mobile
  And   Body text remains ≥14px equivalent

Scenario: Accessibility contrast compliance
  Given Gulf brand colors are applied
  When  the site is audited with Lighthouse or axe DevTools
  Then  All text/background combinations meet WCAG 2.1 AA (4.5:1 normal, 3:1 large)
  And   Interactive elements are distinguishable without relying solely on color

Scenario: Login and unauthenticated pages carry Gulf branding
  Given a retailer navigates to the Gulf portal URL unauthenticated
  When  the login and password-reset pages render
  Then  Gulf logo, palette, and background are visible — no default Salesforce template
  And   No default Salesforce logos or blue color scheme appear on any unauthenticated page

Scenario: Global brand tokens delivered via OhfyGlobalStyles static resource
  Given a static resource OhfyGlobalStyles.css is committed to the OHFY-Ecom repo
  And   it defines Gulf tokens at :root (e.g., --ohfy-color-primary, --ohfy-color-secondary,
        --ohfy-color-accent, --ohfy-color-text, --ohfy-font-family, --ohfy-radius-md)
  When  the static resource is referenced in Experience Builder (Theme → custom CSS,
        or Settings → Advanced → Head Markup via <link>)
  Then  Every page on the Gulf Experience Cloud site loads the token definitions globally
  And   LWC component CSS files can reference any token via var(--ohfy-*) without any import
  And   Tokens inherit through shadow DOM boundaries into every LWC on the page

Scenario: Sample LWC consumes global tokens (cascade verification)
  Given OhfyGlobalStyles is loaded on the site
  When  a sample LWC's CSS uses background: var(--ohfy-color-primary)
  Then  The rendered element shows the Gulf primary color
  And   Changing the token value in OhfyGlobalStyles.css and redeploying updates the
        color everywhere without editing any component CSS

Scenario: Tokens documented for downstream ECOM sprints
  Given OhfyGlobalStyles.css exists
  When  a developer opens the repo
  Then  A README or comment block in the file lists each --ohfy-* token with its
        Gulf value and intended usage (color role, typography, spacing)
  And   Downstream ECOM tickets can consume tokens without hard-coded hex values
```

### Technical approach (proposed — using global CSS pattern)
1. **Assets layer:** Create Gulf static resources (`GulfLogo.png`, `GulfLoadingImage.png`, `GulfFavicon.png`, `GulfHeroBanner.jpeg`) and corresponding `Ecom_Branding.Gulf*.md-meta.xml` records so the existing `getBrandingResource` consumers swap to Gulf automatically.
2. **Token layer:** Commit `staticresources/OhfyGlobalStyles.css` defining Gulf `:root` custom properties. Reference it in Experience Builder (Theme → custom CSS or Head Markup `<link>`) so it loads on every page. LWC CSS files then use `var(--ohfy-*)` — CSS custom properties pierce shadow DOM so no per-component import is needed.
3. **Consumer layer:** Audit `navigationMenu`, `ecomFooter`, and the 8 other LWCs that use `getBrandingResource` for any hard-coded hex / font values; replace with `var(--ohfy-*)` references.
4. **Experience Builder Theme panel:** Set brand color pickers to match (so `--dxp-g-*` tokens also align — avoids a second source of truth).
5. **Accessibility gate:** Run Lighthouse/axe on a dev scratch org; document any color pair that fails AA and publish an alternative pairing in the token docs.

### Proposed field updates
- **Blocked By:** re-link to whichever ticket actually provisions the Experience Cloud site shell; or update BMS-3930's title to reflect site-provisioning scope.
- **Labels:** keep `refinement-needed` until the dependency is resolved, then drop.

---

## Open Questions for Team Refinement
1. Which ticket actually provisions the Experience Cloud site shell? (BMS-3930 title doesn't match.)
2. Does Gulf have an approved brand kit (hex codes, font files, logo variants, favicon set)?
3. In scope this ticket: unified Theme Layout component? `--ohfy-*` CSS custom-property token layer?
4. Is the custom domain (`portal.gulfdistributors.com`) in scope or follow-up?
5. Dark-mode variant — in scope or separate?

## Readiness Recommendation
**Hold briefly, then GO.** Two small fixes (dependency link + rewrite the technical approach on top of the existing pattern) and this is a clean Sprint 1 ticket. The work itself is ~1-2 days of asset creation + metadata records, not a platform build.
