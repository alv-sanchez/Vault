# Storefront Theme Admin

## Component

`Ecom_Theme__c` (Custom Object, singleton row) + `EcomThemeController.cls` + `ecomThemeAdmin` LWC + `colorUtils` LWC + `ohfyTheme` LWC + `ohfyGlobalStyles` static resource.

## Tickets

| Ticket | Date Added | Engineer | Ticket Type |
|---|---|---|---|
| [[BMS-3923]] | 5/12/2026 | Alvaro Sanchez | Story |

---

## 1. Overview

**Purpose:** Admin-configurable runtime theming for the E-Commerce storefront. Lets an admin pick 12 brand colors (Nav, Body, Footer, and 5 module accents) from one screen, preview them live against synthetic storefront pages, and publish them to the live site without a deploy.

**Target Users:** Admins (during subscriber org brand-up).

**How it works:** Saved colors land on a singleton `Ecom_Theme__c` record. On every storefront page load, `loadOhfyTheme(component)` fetches that row and applies the values as CSS custom properties (`--ohfy-color-*`) on `document.documentElement`. CSS custom properties inherit through Shadow DOM, so every LWC's children pick them up for free — no per-LWC plumbing. A bridge layer in `ohfyGlobalStyles.css` rewrites the existing Tailwind utility classes (`bg-blue-600`, `text-gray-700`, etc.) to read from those tokens, which is why no LWC source had to change.

---

## 2. Accessing the admin

Admins open the LWC via the internal Lightning app page:

1. **App Launcher → search "Theme"**
2. Click **Storefront Theme**

Access is gated client-side by the `Ecom_Theme_Admin` custom permission. The Apex layer is intentionally **not** gated in the current demo phase — restore the server-side check before production (see the re-enable checklist in `EcomThemeController.cls` header).

---

## 3. The 12 knobs

| Group | Knob | Default | Drives |
|---|---|---|---|
| Nav | Nav Background | `#FFFFFF` | The top navigation bar — visible on every page. |
| Nav | Nav Links | `#2663EB` | Main menu links: Home, Shop, Promotions, Order History, Support. |
| Body | Primary | `#2663EB` | Primary buttons and branded accents — Checkout, Submit, hero CTAs. |
| Body | Body Text | `#111827` | All page body text and section headings. |
| Footer | Footer Background | `#F3F4F6` | The footer band at the bottom of every page. |
| Footer | Footer Text | `#555555` | Footer column headings and supporting copy. |
| Footer | Footer Links | `#555555` | Clickable links in the footer. |
| Modules | Order By Banner | `#2663EB` | Top nav band — "Order by X for Y delivery". Text auto-contrasts. |
| Modules | Place-By Banner | `#FBBF24` | Next-day cutoff band — "Place orders by 4pm for next-day delivery". Text auto-contrasts. |
| Modules | Promo Accent | `#FBBF24` | Promo CTAs (Promotions page) + promo badges/progress banners (Shop, Cart). |
| Modules | Add to Cart | `#2663EB` | The "Add to Cart" button on product cards (Shop, Product). |
| Modules | In Cart | `#FBBF24` | Border, label, quantity stepper on product cards already in cart. |

**Body Surface** (page background across all pages) is intentionally fixed at `#F9FAFB` in Phase 1. The KNOB entry is commented out — saturated body-surface values flooded too many pages in trials. Reserved for Phase 2.

---

## 4. Live preview + actions

The left pane renders synthetic Home / Shop / Cart / Promotions / Orders / Checkout / Profile pages using the draft theme. The right pane is the picker. Live preview is scoped to the `.preview-canvas` element — dragging a swatch does NOT bleed into the admin chrome.

| Button | Behavior |
|---|---|
| **Save** | Upserts every knob value into `Ecom_Theme__c`. Storefront retints on next page load. |
| **Cancel** | Discards working edits, reloads last saved palette. |
| **Revert** | Stages a reset to defaults — preview turns neutral but nothing is persisted. Click Save to commit (deletes the row), or edit any color to back out. |

The staged revert pattern prevents the destructive footgun of "I clicked Revert and immediately lost everything."

---

## 5. WCAG contrast badges

Each foreground knob shows an inline contrast badge — `✓ X.XX:1` (passes) or `⚠ X.XX:1` (fails) — checked against the natural adjacent surface. The top of the Colors panel summarizes: **✓ Contrast OK** or **⚠ N contrast issues**.

| Knob | Pairing | Threshold | Why |
|---|---|---|---|
| Nav Links | Nav | 4.5:1 (AA Text) | Link text sits on the nav surface. |
| Primary | Body (`#F9FAFB`) | 3.0:1 (AA UI) | Primary buttons live on page bodies. UI threshold (component, not text). |
| Body Text | Body | 4.5:1 (AA Text) | All page copy on the page surface. |
| Footer Text / Links | Footer | 4.5:1 (AA Text) | Both sit on the footer surface. |
| Order By Banner | Nav | 3.0:1 (AA UI) | Sits in the nav stack. |
| Place-By Banner | Nav | 3.0:1 (AA UI) | Sits in the nav stack; sometimes the top edge when Order-By is hidden. |
| Promo Accent | Body | 3.0:1 (AA UI) | Promo elements live on page bodies and cards. |
| Add to Cart | Body | 3.0:1 (AA UI) | Button on product cards, body-adjacent. |
| In Cart | Body | 3.0:1 (AA UI) | State border on a card; must distinguish from page bg. |

**Banner / button text color is auto-derived** (`--ohfy-color-on-*`) via `getContrastColor`, which always picks pure black or white — that's WCAG **AAA** by construction, so the picker doesn't expose a text-color knob for those module knobs.

`getContrastRatio(hex1, hex2)` in `colorUtils.js` implements WCAG 2.1 exactly (`(L_lighter + 0.05) / (L_darker + 0.05)` with sRGB linearization).

---

## 6. Schema

`Ecom_Theme__c` is a singleton record; the controller always reads/writes the first row, ordered by `Is_Active__c DESC NULLS LAST, LastModifiedDate DESC`.

| Field | Type | Stores |
|---|---|---|
| `Primary_Color__c` | Text(7) | Primary knob hex |
| `Body_Text_Color__c` | Text(7) | Body Text knob hex |
| `Body_Surface_Color__c` | Text(7) | Body Surface (Phase 2 — currently unused but field retained) |
| `Nav_Background_Color__c` | Text(7) | Nav Background knob hex |
| `Nav_Link_Color__c` | Text(7) | Nav Links knob hex |
| `Footer_Background_Color__c` | Text(7) | Footer Background knob hex |
| `Footer_Text_Color__c` | Text(7) | Footer Text knob hex |
| `Footer_Link_Color__c` | Text(7) | Footer Links knob hex |
| `Order_By_Color__c` | Text(7) | Order By Banner knob hex |
| `Place_By_Color__c` | Text(7) | Place-By Banner knob hex |
| `Promo_Color__c` | Text(7) | Promo Accent knob hex |
| `Card_Control_Color__c` | Text(7) | Add to Cart knob hex |
| `In_Cart_Color__c` | Text(7) | In Cart knob hex |
| `Is_Active__c` | Checkbox | True for the live row (currently always true) |

`Nav_Text_Color__c` and `Variant_Name__c` were removed in Phase 1 cleanup — they may linger as orphan columns in the org until a destructive change pass.

---

## 7. Apex contract

```apex
// Singleton fetch. Returns null if no row exists.
@AuraEnabled public static Map<String, String> getTheme()

// Upserts the singleton. Map keys = field API names; blank/whitespace → null.
@AuraEnabled public static Map<String, String> upsertTheme(Map<String, String> theme)

// Deletes the singleton row → storefront falls back to :root defaults.
@AuraEnabled public static void revertTheme()
```

`EcomThemeController_T` covers 8 tests (round-trip, blank-to-null, revert, null-payload throw). Demo phase: no server-side admin gate.

---

## 8. Token / scope-class quick reference

| Token | Drives | Bridge scope class |
|---|---|---|
| `--ohfy-color-primary` (+ `-hover`, `-active`, `-on-primary`) | Any Tailwind `bg-blue-*` storefront-wide | global bridge |
| `--ohfy-color-text` (+ `-secondary`, `-muted`, `-inverse`) | Tailwind `text-gray-*` | global bridge |
| `--ohfy-color-nav` (+ `-link`) | Nav scope | `.ohfy-nav` |
| `--ohfy-color-footer` (+ `-text`, `-link`) | Footer scope | `.ohfy-footer` |
| `--ohfy-color-order-by` (+ `-on-order-by`) | Scheduled-delivery banner | `.ohfy-order-by` |
| `--ohfy-color-place-by` (+ `-on-place-by`) | Next-day banner | `.ohfy-place-by` |
| `--ohfy-color-promo` (+ `-on-promo`, `-promo-bg`) | Promo elements | `.ohfy-promo` |
| `--ohfy-color-card-control` (alias `-add-to-cart`, + `-on-…`) | Add-to-Cart button | `.ohfy-add-to-cart` |
| `--ohfy-color-in-cart` (+ `-on-in-cart`) | In-cart card state | `.ohfy-in-cart` |
| `--ohfy-color-surface` | Page body background | inline `style` on outer wrapper of 9 page LWCs |

Doubled scope-class selectors (e.g. `.ohfy-promo.ohfy-promo`) lift specificity to (0,2,0) so module scopes beat the global Tailwind bridge of the same specificity.

---

## 9. Edge cases / things to know

- **Profile dropdown is isolated from Nav scope.** The dropdown panel that opens on profile click would otherwise be re-tinted by `.ohfy-nav [class*="bg-white"]` → goes dark and unreadable when Nav is dark. Doubled `.profile-dropdown.profile-dropdown` rules in `navigationMenu.css` opt it out and restore literal Tailwind whites/grays.
- **Search dropdown** uses the same pattern (`.search-container.search-container`) for the same reason.
- **Body bg is intentional fixed.** Page wrappers across the 9 storefront pages render `style="background-color: var(--ohfy-color-surface, #F9FAFB);"` on their outer div. Card surfaces (`bg-white`) stay literal — cards do NOT theme to Body.
- **Live storefront propagation.** Save is instant in the DB, but logged-in customers holding open pages won't see the new theme until next navigation. Experience Cloud page cache may add another ~60 seconds.
- **Logo follows Branding metadata.** The preview's nav and the live nav both wire `getBrandingResource({ resourceKey: 'OhanaLogo' })` → admins changing the logo via `Ecom_Branding__mdt` (see [[configurable-ecom-branding]]) get a faithful preview without a separate hookup.

---

## 10. Phase 1 deliberate omissions

- **Body Surface knob.** Commented out; fixed at `#F9FAFB`. Phase 2 if/when surface-flood scoping is solved per-page.
- **Nav Text knob.** Removed entirely. Nav text falls back to literal `#1F2937` via collapsed bridge rules. If Nav Background ever goes dark, nav text becomes unreadable — re-introduce the knob if that's a real requirement.
- **Border / status / focus-ring tokens.** Not exposed; cascade was too aggressive in trials.
- **Light / Dark / Multi-variant themes.** `Variant_Name__c` was scoped for v2 and then removed. Future work.
- **Server-side admin gate on Apex.** Demo phase only — restore before production.

---

## 11. Verification

```bash
sf apex run test --class-names EcomThemeController_T --target-org <alias>
# Expect 8/8 pass.
```

End-to-end smoke: open the admin LWC → drag Primary → confirm preview canvas retints live. Save → reload Shop / Cart / Profile in another tab → all retint. Click Revert → preview returns to neutral. Click Save again → singleton row deleted; storefront returns to `:root` defaults on next load.

---

## Related notes

- [[configurable-ecom-branding]] — sibling system for swappable image assets (logo, favicon, hero, category icons). The theme picker pulls the configured logo through the same `getBrandingResource` wire.
- [[navigation-header]] — consumes Nav Background, Nav Links, Order-By, Place-By tokens.
- [[shop-page]] — consumes Primary, Promo, Add-to-Cart, In-Cart tokens.
- [[cart-page]] — consumes Promo + Primary tokens.
- [[promotions-page]] — consumes Promo Accent + Primary tokens.
- [[profile-page]] — consumes Primary (the 10 hardcoded `#0A6FFD` literals were tokenized in BMS-3923).

## Future Configurability

| Feature | Status |
|---|---|
| Body Surface knob (page background) | Deferred — page-flood scoping needed first |
| Light / Dark / High-contrast variants | Deferred — `Variant_Name__c` was removed |
| Border + focus-ring tokens | Deferred — cascade too aggressive in trials |
| Server-side admin gate restoration | Required before production |
