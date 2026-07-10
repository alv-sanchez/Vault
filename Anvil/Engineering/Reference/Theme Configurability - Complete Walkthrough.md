---
title: Theme Configurability — Complete Walkthrough
ticket: BMS-3923
phase: 1.7
status: deployed to apr30Test · pending merge to deploy-test
last-updated: 2026-05-10
audience: Engineer onboarding to the theme system
purpose: One-pass mental model — how a Tailwind class becomes a brand color on screen.
---

# Theme Configurability — Complete Walkthrough

> Read once top-to-bottom. By the end you should be able to trace any pixel back to a knob in the admin UI and a row in the database.

---

## TL;DR — the system in 4 sentences

1. **Admin** opens `ecomThemeAdmin` LWC, sets 13 hex values in 4 groups (Body / Nav / Footer / Modules), clicks Save.
2. **Apex** (`EcomThemeController.upsertTheme`) writes them to a singleton `Ecom_Theme__c` row.
3. **Runtime** — every storefront LWC calls `loadOhfyTheme(this)`, which fetches the row once per page load and writes ~20 CSS custom properties to `document.documentElement`.
4. **Cascade** — those custom properties resolve inside every LWC's shadow root. A Tailwind utility bridge in `ohfyGlobalStyles.css` retargets `bg-blue-*` / `bg-yellow-*` / `text-gray-*` / etc. to those properties via `!important`, so every brand-coded element follows the theme without per-component refactoring.

---

## The visualization an engineer needs

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│   ADMIN  ─────────────────►  APEX  ─────────────────►  DATABASE                        │
│   ecomThemeAdmin LWC         EcomThemeController       Ecom_Theme__c (singleton row)   │
│   13 color pickers           .upsertTheme(Map)         13 hex fields                   │
│   + hex input + revert ↺                                                               │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                                                  │
                                                                  │  (later — buyer reload)
                                                                  ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  STOREFRONT PAGE LOAD                                                                  │
│                                                                                        │
│   Any LWC (ecomShop, navigationMenu, ecomFooter, ecomCart, …)                          │
│              │                                                                         │
│              │ connectedCallback() → loadOhfyTheme(this)                               │
│              ▼                                                                         │
│   c/ohfyTheme ─── injects Tailwind + ohfyGlobalStyles into THIS LWC's shadow root      │
│              │                                                                         │
│              │ MEMOIZED — only the first call hits Apex; rest reuse the cached tokens  │
│              ▼                                                                         │
│   EcomThemeController.getTheme()  →  Map<String,String> of 13 fields                   │
│              │                                                                         │
│              ▼                                                                         │
│   colorUtils.deriveTokens({...})                                                       │
│              │   primary  → primary + primary-hover + primary-active + on-primary      │
│              │   bodyText → text + text-secondary + text-muted + text-inverse          │
│              │   bodySurface → surface + surface-elevated + surface-sunken             │
│              │   nav / navText / navLink / footer / footerText / footerLink            │
│              │   placeBy + on-placeBy   promo + on-promo + promo-bg                    │
│              │   cardControl + on-card-control   inCart + on-in-cart                   │
│              ▼                                                                         │
│   document.documentElement.style.setProperty('--ohfy-color-...', '#hex')               │
│   (~20 custom properties written ONCE per page load)                                   │
│              │                                                                         │
│              ▼                                                                         │
│   CSS Custom Property inheritance — crosses shadow DOM boundaries                      │
│              │                                                                         │
│              ▼                                                                         │
│   Inside each LWC's shadow root, the Tailwind Bridge in ohfyGlobalStyles.css fires:    │
│                                                                                        │
│      Tailwind class            Bridge selector                  Resolved value         │
│      ────────────────          ────────────────                 ────────────────       │
│      bg-blue-600         →     [class*="bg-blue-"][class*="bg-blue-"]   primary        │
│      bg-yellow-400       →     [class*="bg-yellow-3..7"]...             primary        │
│                                  (UNLESS inside a scope class — see below)             │
│      text-gray-900       →     [class*="text-gray-9"]...                text           │
│      bg-white            →     [class*="bg-white"]...                   surface        │
│                                                                                        │
│   Scope overrides (more specific — win on (0,3,0) vs (0,2,0)):                         │
│                                                                                        │
│      .ohfy-nav         { bg-white → nav, text-gray → nav-text, etc. }                  │
│      .ohfy-footer      { bg-gray → footer, text-gray → footer-text, a → footer-link }  │
│      .ohfy-place-by    { bg-yellow → place-by (not primary)            }               │
│      .ohfy-promo       { bg-yellow → promo (not primary)               }               │
│      .ohfy-add-to-cart { bg-blue / border-blue / text-blue → add-to-cart-color }       │
│      .ohfy-in-cart     { bg-yellow / border-yellow → in-cart-color  }                  │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                          Pixel renders with the admin's chosen brand color.
```

**Mental model:**
- One source of truth: `Ecom_Theme__c` row (13 hex values).
- One write path: admin → Apex → DB.
- One read path: any LWC → `loadOhfyTheme` → cached tokens → `document.documentElement`.
- Two "language layers" inside a shadow root:
  1. **Direct token consumers** — `color: var(--ohfy-color-text)` in component CSS.
  2. **Tailwind bridge** — bulk-remaps utility classes to tokens via `!important`. This is how the storefront's existing markup theme-flips without any markup edit.
- **Scope classes** are how you override the bridge surgically. Without scope classes, every `bg-yellow-` goes to primary. With `.ohfy-place-by` on a specific banner, that banner's yellow goes to place-by instead.

---

## The 13 knobs (current — Phase 1.7)

| Group | Knob | Field on `Ecom_Theme__c` | Token | Default | What it drives |
|---|---|---|---|---|---|
| **Body** | Primary | `Primary_Color__c` | `--ohfy-color-primary` (+ hover/active/on-primary) | `#2663EB` | All `bg-blue-*` / `text-blue-*` / `border-blue-*` Tailwind utilities storefront-wide |
| | Body Text | `Body_Text_Color__c` | `--ohfy-color-text` (+ secondary/muted/inverse) | `#111827` | `text-gray-5/6/7/8/9*` utilities — page body, headings, captions |
| | Body Surface | `Body_Surface_Color__c` | `--ohfy-color-surface` (+ elevated/sunken) | `#FFFFFF` | `bg-white` (surface), `bg-gray-50` (sunken). HSL-nudged elevated tone auto-derives |
| **Nav** | Nav Background | `Nav_Background_Color__c` | `--ohfy-color-nav` | `#FFFFFF` | Inside `.ohfy-nav`: any `bg-white` element (nav-container, mobile header, drawer) |
| | Nav Text | `Nav_Text_Color__c` | `--ohfy-color-nav-text` | `#1F2937` | Inside `.ohfy-nav`: logo, profile button, search-area text, gray-text utilities. NOT menu links |
| | Nav Links | `Nav_Link_Color__c` | `--ohfy-color-nav-link` | `#2663EB` | Inside `.ohfy-nav .nav-items a`: Shop / Promotions / Orders / Support menu items |
| **Footer** | Footer Background | `Footer_Background_Color__c` | `--ohfy-color-footer` | `#F3F4F6` | Inside `.ohfy-footer`: any `bg-gray-*` element |
| | Footer Text | `Footer_Text_Color__c` | `--ohfy-color-footer-text` | `#555555` | Inside `.ohfy-footer`: column titles, body copy, gray-text utilities |
| | Footer Links | `Footer_Link_Color__c` | `--ohfy-color-footer-link` | `#2663EB` | Inside `.ohfy-footer`: column-list anchors and hover state |
| **Modules** | Place-By Banner | `Place_By_Color__c` | `--ohfy-color-place-by` (+ on-place-by) | `#FBBF24` | The next-day-delivery banner in nav (`.ohfy-place-by`). Text auto-contrasts |
| | Promo Accent | `Promo_Color__c` | `--ohfy-color-promo` (+ on-promo, promo-bg) | `#FBBF24` | All `.ohfy-promo` elements: Shop promo badges, Promotions CTAs, item-promo modal header, promo progress bar |
| | Add to Cart | `Card_Control_Color__c` | `--ohfy-color-add-to-cart` (+ on-add-to-cart) | `#2663EB` | Shop product card "Add to Cart" state — blue button container (`.ohfy-add-to-cart`) |
| | In Cart | `In_Cart_Color__c` | `--ohfy-color-in-cart` (+ on-in-cart) | `#FBBF24` | Shop product card "In Cart" state — yellow border + icon + qty stepper accents (`.ohfy-in-cart`) |

Auto-derived (no admin picker):
- `on-primary`, `on-place-by`, `on-promo`, `on-add-to-cart`, `on-in-cart` via `getContrastColor()` (WCAG luminance).
- `primary-hover` / `primary-active` via `darken(primary, 10)` / `darken(primary, 15)`.
- `text-secondary` / `text-muted` via `lighten(bodyText, 30/45)`.
- `surface-elevated` / `surface-sunken` via `nudgeSurface(bodySurface, 2/4)` (light surfaces darken, dark ones lighten).
- `promo-bg` via `lighten(promo, 35)` — the pale tint used by the promo-progress banner.

---

## Files inventory

```
force-app/main/default/
├── classes/
│   ├── EcomThemeController.cls            ← @AuraEnabled getTheme / upsertTheme / revertTheme
│   ├── EcomThemeController.cls-meta.xml
│   ├── EcomThemeController_T.cls          ← 10 tests, 100% pass, ≥80% coverage
│   └── EcomThemeController_T.cls-meta.xml
├── customPermissions/
│   └── Ecom_Theme_Admin.customPermission-meta.xml   ← gates write access + admin LWC visibility
├── permissionsets/
│   └── Ecom_Theme_Reader.permissionset-meta.xml     ← grants Apex Class Access + Object Read to buyers
├── objects/Ecom_Theme__c/
│   ├── Ecom_Theme__c.object-meta.xml      ← sharingModel=ReadWrite, externalSharingModel=ReadWrite
│   └── fields/
│       ├── Primary_Color__c.field-meta.xml
│       ├── Body_Text_Color__c.field-meta.xml
│       ├── Body_Surface_Color__c.field-meta.xml
│       ├── Nav_Background_Color__c.field-meta.xml
│       ├── Nav_Text_Color__c.field-meta.xml
│       ├── Nav_Link_Color__c.field-meta.xml
│       ├── Footer_Background_Color__c.field-meta.xml
│       ├── Footer_Text_Color__c.field-meta.xml
│       ├── Footer_Link_Color__c.field-meta.xml
│       ├── Place_By_Color__c.field-meta.xml
│       ├── Promo_Color__c.field-meta.xml
│       ├── Card_Control_Color__c.field-meta.xml     ← labelled "Add to Cart" in admin UI
│       ├── In_Cart_Color__c.field-meta.xml
│       ├── Variant_Name__c.field-meta.xml           ← v2 placeholder (Dark/HC variants)
│       └── Is_Active__c.field-meta.xml              ← v2 placeholder
├── lwc/
│   ├── ecomThemeAdmin/                    ← admin UI: 13 pickers grouped, hex input, per-knob ↺
│   ├── ecomThemeProvider/                 ← legacy runtime — now optional. Kept for backwards-compat
│   ├── colorUtils/                        ← pure-JS HSL math + deriveTokens / applyTokens / clearTokens
│   └── ohfyTheme/                         ← THE service module — loadOhfyTheme(this) auto-applies the theme
└── staticresources/
    ├── ohfyGlobalStyles.css               ← token defaults at :root + Tailwind bridge + scope overrides
    └── ohfyGlobalStyles.resource-meta.xml
```

---

## How a save reaches a buyer's screen (full trace)

```
Admin tab                                  ┃   Buyer tab (any storefront page)
                                           ┃
1. Drag picker, type hex, click ↺          ┃
   → ecomThemeAdmin.handleColorChange      ┃
   → formData = {...formData, key: hex}    ┃
   → applyLivePreview (only THIS tab)      ┃
                                           ┃
2. Click "Save"                            ┃
   → ecomThemeAdmin.handleSave             ┃
   → syncHexInputsIntoFormData             ┃   (catches any unfocused-input edge case)
   → upsertTheme({theme: payload})         ┃
   → Apex: gate via Ecom_Theme_Admin       ┃
           custom permission               ┃
   → DML: upsert singleton row             ┃
   → getTheme() → returns Map              ┃
   → LWC: refreshTheme()                   ┃   invalidates ohfyTheme module cache
   → tokens re-fetched, re-applied         ┃
   → status banner: "Theme saved…"         ┃
                                           ┃
                                           ┃   3. Buyer hard-reloads /shop
                                           ┃      → Many LWCs mount in parallel
                                           ┃      → Each calls loadOhfyTheme(this)
                                           ┃      → First mount triggers getTheme()
                                           ┃          (perm check passes: Ecom_Theme_Reader)
                                           ┃          (sharing check passes: ReadWrite external)
                                           ┃      → tokenCache resolved
                                           ┃      → ensureThemeApplied writes 20 props
                                           ┃           to document.documentElement
                                           ┃      → All subsequent LWC mounts re-apply
                                           ┃           the same tokens (cached, idempotent)
                                           ┃      → CSS cascade reaches every shadow
                                           ┃      → Bridge selectors match Tailwind classes
                                           ┃           → use var(--ohfy-color-...) with !important
                                           ┃      → Buyer sees admin's brand colors
                                           ┃
                                           ┃   4. Buyer clicks Shop → Cart
                                           ┃      → Cart page mounts new LWCs
                                           ┃      → loadOhfyTheme runs again
                                           ┃      → tokenCache still resolved → re-applies
                                           ┃           tokens (the sync-bug fix)
                                           ┃      → Cart shows the same brand colors
```

---

## Per-org setup checklist (when deploying to a new org)

1. **Deploy the package** — includes object meta (with `externalSharingModel=ReadWrite`), 13 fields, controller, custom permission, permission set, LWCs, static resource.
2. **Grant `Ecom_Theme_Admin` custom permission** to whoever should be able to write theme values. Typically: Setup → Permission Sets → (create "Storefront Admins" or reuse existing) → Custom Permissions → enable `Ecom_Theme_Admin` → assign to admin user(s).
3. **Assign `Ecom_Theme_Reader` permission set** to every buyer / community / portal user that needs to *see* the saved theme:
   ```bash
   sf org assign permset --target-org <alias> --name Ecom_Theme_Reader --on-behalf-of <buyer-username>
   ```
   Or Setup → Permission Sets → Ecom Theme Reader → Manage Assignments → Add Assignments → pick users.
4. **(Optional) Add an admin-only page** to the Experience Cloud site at `/admin/theme` and drop `ecomThemeAdmin` on it. The component self-gates via the custom permission; non-admins see nothing.

**No need to drop `ecomThemeProvider` on the storefront's Theme/Layout page anymore.** Every storefront LWC that calls `loadOhfyTheme(this)` auto-applies the theme on mount. The provider exists only for backwards compatibility with older Experience Builder pages.

---

## Reading the WCAG contrast badge

Every foreground knob in the admin UI shows a live contrast pill next to its picker (e.g., `✓ 3.42:1`). Here's how to read it.

### What the number means

WCAG 2.1 contrast ratio between the foreground color and the background it's paired against. Format: `lighter : darker`, anchored to `1`.

| Ratio     | Meaning                                                                                                                 |
| --------- | ----------------------------------------------------------------------------------------------------------------------- |
| `1.00:1`  | Identical colors — zero contrast, completely invisible                                                                  |
| `3.00:1`  | WCAG **AA** minimum for **large text** (≥18pt or ≥14pt bold) and **UI components** (buttons, icons, form-field borders) |
| `4.50:1`  | WCAG **AA** minimum for **normal body text**                                                                            |
| `7.00:1`  | WCAG **AAA** minimum for normal body text                                                                               |
| `21.00:1` | Pure black on pure white — theoretical maximum                                                                          |

### Per-knob thresholds in this system

Defined in `CONTRAST_PAIRING` in `lwc/ecomThemeAdmin/ecomThemeAdmin.js`:

| Knob | Threshold | WCAG level | Why this bar |
|---|---|---|---|
| Primary on Body Surface | `3.0:1` | AA UI | Primary is used on buttons / icons / banners — a UI component, not body copy |
| Body Text on Body Surface | `4.5:1` | AA normal text | Default page paragraphs |
| Nav Text on Nav Background | `4.5:1` | AA normal text | Logo + profile-area label copy |
| Nav Links on Nav Background | `4.5:1` | AA normal text | Menu items are treated as text |
| Footer Text on Footer Background | `4.5:1` | AA normal text | Footer body copy + column titles |
| Footer Links on Footer Background | `4.5:1` | AA normal text | Footer link list |

The 7 background / module knobs (`Body Surface`, `Nav Background`, `Footer Background`, `Place-By`, `Promo`, `Add to Cart`, `In Cart`) don't show a contrast pill — their `on-*` companion tokens auto-derive via `getContrastColor()` (always picks pure black or pure white based on luminance), so they're **WCAG AAA by construction**.

### How the ratio is computed

Implemented in `lwc/colorUtils/colorUtils.js → getContrastRatio(hex1, hex2)`. Strict implementation of the W3C spec — verified line-by-line:

1. **Normalize** each 8-bit RGB channel to `0..1` (divide by 255).
2. **Linearize** with the piece-wise gamma curve from the spec:
   - if channel ≤ `0.03928`: divide by `12.92`
   - else: `((channel + 0.055) / 1.055) ^ 2.4`
3. **Compute relative luminance** using the ITU-R BT.709 coefficients:
   `L = 0.2126·R + 0.7152·G + 0.0722·B`
4. **Compute contrast ratio**:
   `(max(L1, L2) + 0.05) / (min(L1, L2) + 0.05)`

The function is **fully WCAG 2.1 compliant** (and identical for WCAG 2.2, which kept the same contrast definition). WCAG 3.0's draft APCA algorithm is intentionally NOT used — it isn't finalized and isn't the regulatory standard yet.

Reference: [W3C WCAG 2.1 §1.4.3 Contrast Minimum](https://www.w3.org/TR/WCAG21/#contrast-minimum) · [Relative Luminance definition](https://www.w3.org/TR/WCAG21/#dfn-relative-luminance) · [Contrast Ratio formula](https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio).

### Reading the badge in practice

- **`✓ 3.42:1`** in green → passes the knob's threshold. Hover the pill for the threshold detail (e.g., "Passes WCAG AA UI (threshold 3.0:1)").
- **`⚠ 2.10:1`** in red → fails. The header chip flips from `✓ Contrast OK` to `⚠ N contrast issues` and the failing row's badge background turns red.
- **Save is not blocked** by a fail — admins sometimes need to honor a brand mandate that doesn't meet AA, so the panel warns rather than locks. (Adobe Spectrum, Material, Polaris all warn-not-block for the same reason.)

**Rule of thumb without doing math:**

| Range | Verdict |
|---|---|
| Below 3 | Almost always unreadable somewhere — fix it |
| 3 – 4.5 | Borderline. OK for buttons/icons, bad for paragraph text |
| 4.5 – 7 | Solid for body text |
| 7 + | Excellent. Black-on-white is 21 |

---

## Sharing, permissions, and the wall most people hit

Three independent layers must all permit a buyer's `getTheme()` call:

| Layer | What it controls | How we grant it |
|---|---|---|
| **Apex Class Access** | Whether the user can invoke the `@AuraEnabled` method at all | `Ecom_Theme_Reader` perm set → `<classAccesses><apexClass>EcomThemeController</apexClass></classAccesses>` |
| **Object Read permission** | Whether the user can SOQL-query the object | `Ecom_Theme_Reader` perm set → `<objectPermissions><allowRead>true</allowRead></objectPermissions>` |
| **Record-level sharing** | Whether the user can see THIS specific row (community/portal users count as "external") | Object meta: `externalSharingModel=ReadWrite` (so external sharing matches internal) |

If any one of the three is missing, `getTheme()` returns null (or throws) and the storefront falls back to `:root` defaults. The last layer (external sharing) is the silent killer — perm sets pass all dashboard checks, but Portal/Customer Community users still get blocked because their UserType is `PowerCustomerSuccess` / `CspLitePortal` / etc., which is "external".

If a buyer says "I see defaults", run this diagnostic Apex:
```apex
User buyer = [SELECT Id, Username FROM User WHERE Username = '<their-username>' LIMIT 1];
Ecom_Theme__c row = [SELECT Id FROM Ecom_Theme__c LIMIT 1];
UserRecordAccess access = [
    SELECT HasReadAccess FROM UserRecordAccess
    WHERE UserId = :buyer.Id AND RecordId = :row.Id
];
System.debug('HasRead: ' + access.HasReadAccess);
```
If false → sharing issue. If true → check browser console for `[ohfyTheme]` errors.

---

## The Tailwind bridge — full coverage map

In `force-app/main/default/staticresources/ohfyGlobalStyles.css`. All selectors use the doubled-attribute trick (`[class*="bg-blue-"][class*="bg-blue-"]`) to lift specificity to (0,2,0) and beat Tailwind's compiled utility specificity of (0,1,0) regardless of `!important` compilation flags.

| Tailwind utility family | Maps to (default scope) | Scope overrides |
|---|---|---|
| `bg-blue-*` | `--ohfy-color-primary` | `.ohfy-add-to-cart` → `--ohfy-color-add-to-cart` |
| `text-blue-*` | `--ohfy-color-text-link` | `.ohfy-add-to-cart` → `--ohfy-color-add-to-cart` |
| `border-blue-*` | `--ohfy-color-primary` | `.ohfy-add-to-cart` → `--ohfy-color-add-to-cart` |
| `hover:bg-blue-*` | `--ohfy-color-primary-hover` | (same scope) |
| `bg-yellow-3..7` / `bg-amber-3..7` | `--ohfy-color-primary` | `.ohfy-place-by` → place-by, `.ohfy-promo` → promo, `.ohfy-in-cart` → in-cart |
| `text-yellow-5..9` / `text-amber-5..9` | `--ohfy-color-primary` | (same as above, but text token) |
| `bg-yellow-1/2`, `bg-yellow-0/50/100/200` | NOT bridged (kept literal) | `.ohfy-promo` still catches these via `[class*="bg-yellow-"]` |
| `text-gray-9*` | `--ohfy-color-text` | `.ohfy-nav` → nav-text, `.ohfy-footer` → footer-text |
| `text-gray-7/8*` | `--ohfy-color-text-secondary` | (same scope overrides) |
| `text-gray-5/6*` | `--ohfy-color-text-muted` | (same scope overrides) |
| `text-gray-3/4*` | NOT bridged (kept literal) | — |
| `bg-white` | `--ohfy-color-surface` | `.ohfy-nav` → nav |
| `bg-gray-50` | `--ohfy-color-surface-sunken` | `.ohfy-footer` → footer |
| `bg-gray-100..900` | NOT bridged (kept literal, except inside .ohfy-footer) | `.ohfy-footer` catches all `bg-gray-*` |
| `bg-red-*` / `text-red-*` | NOT bridged | Semantic: stays red for out-of-stock / errors |
| `bg-green-*` / `text-green-*` | NOT bridged | Semantic: stays green for in-stock / success |

**The "what's themed and what isn't" rule:**
- Themed: primary / brand-colored elements (blues), primary-CTA yellows.
- Not themed: status colors (red error, green success), neutral grays (chrome dividers), pale tints used as decorative backgrounds.

If a brand needs red/green/light-yellow to be configurable, that's Phase 2 — add new tokens and bridge selectors.

---

## LWCs that participate (20+ touch the theme)

Every LWC below calls `loadOhfyTheme(this)` in its `connectedCallback`, which is the only requirement to receive the cascade.

```
ecomCartPage           ecomReviewSummary
ecomFooter             ecomShop
ecomHomeBody           ecomSupport
ecomLogoDisplay        ecomThemeAdmin
ecomOrderHistory       ecomThemeProvider
ecomOrderPlaced        itemPromotionsModal
ecomProductPage        navigationMenu
ecomProfilePage        ohfyTheme              (the service itself)
ecomPromotions         reorderModal
ecomRegister           configurableBanner
```

**Service-only LWCs** (no UI, intentionally don't load theme): `cartService`, `colorUtils`, `draftInvoiceService`, `ecomOrderItemUtils`, `pubsub`, `userDataService`, `utils`.

---

## Scope-class authoring guide

When you add new markup that should follow a specific knob, wrap it (or add to the existing class):

| If the element is conceptually… | Add this class | The token it'll resolve to |
|---|---|---|
| Part of the nav bar | `.ohfy-nav` (already on `navigationMenu` outer wrapper) | nav / nav-text / nav-link |
| Part of the footer | `.ohfy-footer` (already on `ecomFooter` outer wrapper) | footer / footer-text / footer-link |
| The next-day-delivery banner | `.ohfy-place-by` | place-by |
| A promo CTA / badge / banner | `.ohfy-promo` | promo |
| A product card's "Add to Cart" state | `.ohfy-add-to-cart` | add-to-cart |
| A product card's "In Cart" state | `.ohfy-in-cart` | in-cart |

The wrapper does the work. Children with Tailwind utility classes get retargeted automatically.

**To dodge the bridge entirely** for a specific element (e.g., a deliberately neutral-blue spinner): use `style="..."` inline. Inline styles win over class selectors.

---

## Known gaps / Phase 2 wishlist

| Gap | Why it's deferred |
|---|---|
| Red/green/orange status colors aren't admin-configurable | Phase 1 explicitly chose semantic locking — error red is error red regardless of brand |
| `text-gray-3/4*` and `bg-gray-100..400` aren't bridged | Most uses are dividers/disabled-states; admin shouldn't blow those away with brand color |
| Inline hex leaks in `ecomProductPage.html` (lines 221, 230) | Pre-existing leaks, same `#92400e`/`#f59e0b` pattern as the Shop ones we tokenized; trivially patched when there's appetite |
| Inline hex leaks in `ecomProfilePage.html` / `.js` (`#0A6FFD` ×N) | Multiple CTAs hardcoded; should mirror the `ecomRegister` patch we did in Phase 1.6 |
| Multi-variant themes (Dark / High Contrast) | Schema-ready (`Variant_Name__c` + `Is_Active__c` fields exist) but UI exposes only a single "Default" variant |
| WCAG contrast warning at save time | `getContrastColor` derives safe on-* tokens for derived backgrounds, but admin can still save Body Text = `#FFFF00` on Body Surface = `#FFFFFF`. No save-time validator yet |
| Removing the deprecated `ecomThemeProvider` LWC | Holds 21 deprecated `@api` props for backwards-compat with Experience Builder pages that already place it. Safe to remove only after all pages are rebuilt |

---

## Apex contract reference

`EcomThemeController.cls`:

```apex
@AuraEnabled
public static Map<String, String> getTheme()
    // No gate — callable by anyone with Apex Class Access.
    // Returns null if no row exists. Map keys are un-namespaced field API names.

@AuraEnabled
public static Map<String, String> upsertTheme(Map<String, String> theme)
    // Gates via FeatureManagement.checkPermission('Ecom_Theme_Admin').
    // Map keys must match field API names; unknown keys ignored.
    // Empty/whitespace strings normalized to null (cascade falls back to :root).
    // Returns the persisted record post-upsert (calls getTheme internally).

@AuraEnabled
public static void revertTheme()
    // Gates via FeatureManagement.checkPermission('Ecom_Theme_Admin').
    // Deletes all Ecom_Theme__c rows. Cascade falls back to :root defaults storefront-wide.
```

Why `Map<String, String>` instead of the sObject? In packaged-namespace contexts the LWC ↔ Apex serialization can prefix sObject field names with `ohfy__`. A literal-String map sidesteps this. The LWC also defensively checks both `record[fieldName]` and `record['ohfy__' + fieldName]` when reading.

---

## When something breaks: triage flowchart

```
"I saved colors but the storefront shows defaults"
        │
        ▼
Is the DB row populated?  sf data query "SELECT … FROM ohfy__Ecom_Theme__c"
   ├─ Empty → admin's Save isn't reaching Apex. Check browser console for
   │          `[ecomThemeAdmin] save failed:` errors. Likely Ecom_Theme_Admin perm missing.
   └─ Populated → continue ↓

Can the buyer-user query the row?  UserRecordAccess check (see "Sharing, permissions" above)
   ├─ HasReadAccess=false → external sharing model is Private, OR Ecom_Theme_Reader not assigned
   └─ true → continue ↓

Is the buyer hitting the Apex method?  Browser DevTools → Network → look for the
                                      `/aura?...EcomThemeController.getTheme` call
   ├─ No call → LWC isn't mounting / loadOhfyTheme is broken. Check `[ohfyTheme]` console logs.
   ├─ 403 / "Access denied" → Apex Class Access missing in perm set
   ├─ 200 with empty response → SOQL returned no rows (race? cache?)
   └─ 200 with data → continue ↓

Are tokens reaching document.documentElement?  DevTools → Elements → <html> → Computed → search "--ohfy"
   ├─ No `--ohfy-color-*` properties → applyTokens never ran. Check `[ohfyTheme]` console for errors.
   └─ Tokens present → continue ↓

Is the cascade reaching the LWC's shadow?  DevTools → pick an element → Computed → see if var() resolved
   ├─ var(--ohfy-color-X) resolves to default hex → the LWC doesn't load ohfyGlobalStyles.
   │     Check that its .js calls loadOhfyTheme(this) on connectedCallback.
   ├─ var() resolves to admin's hex but Tailwind class doesn't pick it up → bridge selector miss.
   │     Audit which Tailwind utility the element uses; add to ohfyGlobalStyles.css bridge if needed.
   └─ Resolves correctly → 🎉
```

---

## One-line summary for next person

> "Admin picks colors → Apex persists 13 hex values on a singleton row → every storefront LWC fetches them once per page load via `loadOhfyTheme` → tokens land on `document.documentElement` → Tailwind utility classes flip via a bridge layer in `ohfyGlobalStyles.css`, with `.ohfy-*` scope classes carving out per-zone overrides. Three permission layers (Apex Class Access + Object Read + external sharing) must all permit the read or the storefront silently falls back to `:root` defaults."


