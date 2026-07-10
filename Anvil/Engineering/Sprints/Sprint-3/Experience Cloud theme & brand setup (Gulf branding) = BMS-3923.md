---
ticket: BMS-3923
status: in-progress
branch: story/BMS-3923
assignee: Alvaro Sanchez
packages_touched:
  - OHFY-eCommerce-UI
  - OHFY-Data-Model
updated: 2026-05-28
---

# BMS-3923: Experience Cloud Theme & Brand Setup

## Summary

Deliver a **knob-driven theme system** for the Experience Cloud storefront so an admin can change brand colors from a single UI and have them cascade across every page — no code changes, no redeploys.

The ticket originally scoped Gulf-specific branding, but the implementation is brand-agnostic: any distributor can configure their own palette via the Theme Admin page.

## Architecture

### Knob → Token → CSS cascade

```
Admin picks 13 color "knobs"
        ↓
    Ecom_Theme__c          (singleton record — one row per org)
        ↓
    colorUtils.deriveTokens()  (JS — derives ~25 CSS custom properties)
        ↓
    ohfyTheme.loadOhfyTheme()  (applies tokens to document.documentElement)
        ↓
    ohfyGlobalStyles.css        (bridge selectors route Tailwind utilities
                                 through --ohfy-* tokens)
        ↓
    Every LWC inherits tokens via CSS custom property cascade
```

### Color Spaces (used in `colorUtils.js`)

| Space | Components | Range | Used For |
|-------|-----------|-------|----------|
| **HSL** | Hue, Saturation, Lightness | H: 0-360, S/L: 0-100% | `darken()`, `lighten()`, `nudgeSurface()` — shift lightness without altering hue |
| **RGB** | Red, Green, Blue | 0-255 each | Storage as `#RRGGBB` hex; native `<input type="color">` picker |
| **WCAG Luminance** | Single 0-1 value | 0=black, 1=white | `getContrastColor()`, `getContrastRatio()` — accessibility contrast checks |

HSL is the workhorse: darken/lighten just shift the L channel. WCAG luminance is perceptual (weights green at 71.52%) — more accurate than HSL lightness for accessibility math.

## Components Built

### New (added on this branch)

| Component | Type | Purpose |
|-----------|------|---------|
| `ecomThemeAdmin` | LWC | Admin UI — 13 color pickers, live preview (7 tabs), WCAG contrast badges, save/revert |
| `ohfyTheme` | LWC (service) | Single entry point for loading theme: Tailwind + global styles + DB tokens |
| `colorUtils` | LWC (service) | Pure-JS color math: hex↔HSL, darken/lighten, contrast ratio, token derivation |
| `EcomThemeController` | Apex | `getTheme()`, `upsertTheme()`, `revertTheme()` — CRUD on `Ecom_Theme__c` singleton |
| `ohfyGlobalStyles.css` | Static Resource | CSS custom property catalog + Tailwind→token bridge selectors |
| `Ecom_Theme__c` | Custom Object | 13 color fields + `Is_Active__c` |
| `Ecom_Theme_Reader` | Permission Set | Read access to `Ecom_Theme__c` for storefront community users |

### Migrated (this session)

14 storefront LWCs migrated from bare `loadStyle(this, tailwindcss)` to `loadOhfyTheme(this)` so every page loads the global styles and applies saved theme tokens:

`ecomCartPage`, `ecomOrderHistory`, `ecomHomeBody`, `ecomOrderPlaced`, `ecomPromotions`, `ecomProductPage`, `ecomRegister`, `ecomShop`, `ecomReviewSummary`, `ecomSupport`, `itemPromotionsModal`, `navigationMenu`, `ecomFooter`, `ecomProfilePage`

## The 13 Knobs

Each knob maps to an `Ecom_Theme__c` field and drives specific UI elements:

| Group | Knob | Field | Default | Drives |
|-------|------|-------|---------|--------|
| **Nav** | Nav Background | `Nav_Background_Color__c` | `#FFFFFF` | Top navigation bar background |
| **Nav** | Nav Links | `Nav_Link_Color__c` | `#2663EB` | Nav menu links (Home, Shop, etc.) |
| **Body** | Primary | `Primary_Color__c` | `#2663EB` | Primary buttons, hero CTAs, branded accents |
| **Body** | Body Text | `Body_Text_Color__c` | `#111827` | All page body text and headings |
| **Footer** | Footer Background | `Footer_Background_Color__c` | `#F3F4F6` | Footer band background |
| **Footer** | Footer Text | `Footer_Text_Color__c` | `#555555` | Footer headings and copy |
| **Footer** | Footer Links | `Footer_Link_Color__c` | `#555555` | Clickable links in footer |
| **Modules** | Order By Banner | `Order_By_Color__c` | `#2663EB` | "Order by X for Y delivery" nav banner |
| **Modules** | Place-By Banner | `Place_By_Color__c` | `#FBBF24` | "Place orders by 4pm" nav banner |
| **Modules** | Promo Accent | `Promo_Color__c` | `#FBBF24` | Promo CTAs, badges, progress banners |
| **Modules** | Add to Cart | `Card_Control_Color__c` | `#2663EB` | "Add to Cart" button on product cards |
| **Modules** | In Cart | `In_Cart_Color__c` | `#FBBF24` | Border/label/stepper on in-cart product cards |

> **Body Surface** (`Body_Surface_Color__c`, default `#F9FAFB`) is defined but commented out of the admin UI — reserved for Phase 2.

## CSS Bridge Layer (`ohfyGlobalStyles.css`)

The bridge converts Tailwind utility classes into theme token lookups so existing LWC markup doesn't need changes:

| Tailwind Class | Bridges To | Specificity |
|---------------|-----------|-------------|
| `bg-blue-{300-900}` | `--ohfy-color-primary` | `(0,2,0)` doubled `[class~=]` |
| `bg-yellow-{300-700}` | `--ohfy-color-primary` | `(0,2,0)` |
| `text-gray-{900}` | `--ohfy-color-text` | `(0,2,0)` |
| `text-gray-{500-600}` | `--ohfy-color-text-muted` | `(0,2,0)` |
| `bg-white` | `--ohfy-color-surface` | `(0,2,0)` |
| `text-blue-*` | `--ohfy-color-text-link` | `(0,2,0)` |

### Scoped overrides (win over bridge via higher specificity)

Module-specific CSS scopes prevent the global bridge from overriding element-specific knobs:

| Scope Class | Targets | Token Used | Specificity |
|------------|---------|-----------|-------------|
| `.ohfy-nav` | Nav bar | `--ohfy-color-nav`, `--ohfy-color-nav-link` | `(0,1,0)` – `(0,2,0)` |
| `.ohfy-footer` | Footer | `--ohfy-color-footer`, `--ohfy-color-footer-text/link` | `(0,2,0)` – `(0,3,0)` |
| `.ohfy-order-by` | Delivery banner | `--ohfy-color-order-by` | `(0,3,0)` |
| `.ohfy-place-by` | Place-by banner | `--ohfy-color-place-by` | `(0,3,0)` |
| `.ohfy-promo` | Promo elements | `--ohfy-color-promo` | `(0,3,0)` |
| `.ohfy-add-to-cart` | Add to Cart btn | `--ohfy-color-add-to-cart` | `(0,3,0)` |
| `.ohfy-in-cart` | In-cart state | `--ohfy-color-in-cart` | `(0,3,0)` |

### Auto-contrast for text inside primary backgrounds

Child elements with `text-white` or `text-blue-100` inside a primary-bg area are overridden to `--ohfy-color-on-primary` (auto-derived via `getContrastColor`). This prevents invisible text when primary is set to a light color like white — `getContrastColor` picks black text on light primaries, white text on dark primaries.

## Bugs Fixed (2026-05-28 session)

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Place-By banner turns blue in admin preview | Tailwind `bg-yellow-400` bridged to primary; scoped CSS didn't win in shadow DOM | Admin CSS now applies `--ohfy-color-place-by` directly; removed Tailwind bg classes from banner HTML |
| Changing Primary affects Order By / Place By banners | Same bridge bleed-through | Added `.ohfy-order-by` / `.ohfy-place-by` scope classes to `navigationMenu.html` banners |
| Order History active tab invisible when Primary is white | `text-yellow-700` + `border-yellow-500` bridged to primary (white) | Changed tab to `text-gray-900` + `border-gray-800` (not bridged) |
| Footer not picking up theme colors | `ecomFooter` loaded bare Tailwind, not `loadOhfyTheme`; no `.ohfy-footer` scope class | Migrated to `loadOhfyTheme`; added `.ohfy-footer` to root container |
| Profile page not themed | Same bare Tailwind issue | Migrated to `loadOhfyTheme` |
| Hero text invisible when Primary is white | `text-white` on children overrides parent's inherited `on-primary` | Added descendant rules in `ohfyGlobalStyles.css` for `text-white`/`text-blue-100` inside `bg-blue-*` |

## WCAG Contrast Checks

The admin UI shows per-knob contrast badges:

- **Text knobs** (Body Text, Nav Links, Footer Text/Links): checked at **4.5:1** (WCAG AA normal text)
- **Component-bg knobs** (Primary, all Modules): checked at **3.0:1** (WCAG AA non-text UI components)
- **Auto-derived `on-*` tokens** (on-primary, on-place-by, etc.): always pure black or white via `getContrastColor` — WCAG AAA by construction

A summary chip at the top of the Colors panel shows the total issue count (e.g., "4 contrast issues").

## Key Files

```
OHFY-eCommerce-UI/
├── force-app/main/default/
│   ├── classes/
│   │   ├── EcomThemeController.cls       ← Apex CRUD for Ecom_Theme__c
│   │   └── EcomThemeController_T.cls     ← Tests
│   ├── lwc/
│   │   ├── ecomThemeAdmin/               ← Admin UI (picker + preview)
│   │   ├── ohfyTheme/                    ← Theme loader service
│   │   └── colorUtils/                   ← Color math (HSL, contrast, tokens)
│   ├── permissionsets/
│   │   └── Ecom_Theme_Reader.permissionset-meta.xml
│   └── staticresources/
│       └── ohfyGlobalStyles.css          ← Token catalog + bridge selectors

OHFY-Data-Model/
└── force-app/main/default/objects/
    └── Ecom_Theme__c/                    ← 13 color fields + Is_Active__c
```

## What's Left

- [ ] Phase 2: expose Body Surface knob in admin UI (field exists, commented out of KNOBS array)
- [ ] Tailwind `tailwind_eCommerce` static resource consolidation (some components still reference old `tailwind` name)
- [ ] Gulf-specific assets (logo, favicon, hero banner) — pending brand kit delivery
- [ ] Custom domain `portal.gulfdistributors.com` — follow-up ticket
- [ ] Login / password-reset page branding (Experience Builder login page template)
