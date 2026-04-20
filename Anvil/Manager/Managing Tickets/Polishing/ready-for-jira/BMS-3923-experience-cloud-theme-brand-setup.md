---
ticket: BMS-3923
jira: https://ohanafy.atlassian.net/browse/BMS-3923
status: Ready for Jira (pending final approval)
---

# BMS-3923 — Experience Cloud theme & brand setup (Gulf branding)

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
