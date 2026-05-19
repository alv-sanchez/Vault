---
ticket: BMS-4053
title: "Retailer Portal Product Card — Ph 1: Card Component"
type: Story
parent: BMS-3924 (decomposed)
source_polish: "../BMS-4053-product-card-ph1.md"
source_progress: "Anvil/Manager/Managing Tickets/Gulf Retailer Portal Epic Specfic/BMS-4053 — Product Card Ph 1 — Card Component.md"
iterated_on: 2026-05-05
phase: 2a
execution_order: 6
status: "Backlog — extraction + Gulf-specific surfaces"
tags: [polish, iterating, ecom, gulf, card, sprint3]
---

# BMS-4053 — Iterating (outstanding only)

> Epic-specific note says **~60% built**. The card UI exists inline in `ecomShop.html`; this ticket is the extraction + adding Gulf-specific data surfaces.

## Pulled OUT (already complete per epic note)

| Item | Path |
|---|---|
| Product card rendering in `ecomShop` (image, name, SKU, type, UOM, price) | `lwc/ecomShop/ecomShop.html` |
| Cart state on cards (add/remove/qty buttons) | `ecomShop.js` — `handleAddToCart()` |
| Stock status badges (In/Low/Out, configurable via MDT) | ecomShop + Configuration_Preference MDT |
| Promotion savings display (savings amount on tile) | ecomShop |
| MSRP comparison (unit price vs individual unit price) | ecomShop |

→ Polish first-pass ACs about "card displays image / name / brand / pack / price" and the basic add-to-cart interaction are partly redundant — these exist inline. The remaining work is the **extraction**, plus the **Gulf-specific** additions.

## REMAINING (what hasn't been done)

### Code work

1. **Extract `lwc/productCard`** from ecomShop.html into a standalone, reusable LWC. Define an `@api item` property contract (JSDoc shape). Refactor ecomShop to render `<c-product-card item={tile}>`.
2. **Parent-agnostic data contract** — card must accept the same shape from ecomShop, search, reorder, promotions hosts. Document the shape so BMS-4054 / BMS-3927 / reorder consumers can pass it.
3. **Gulf pricing-code resolution display** — show account-specific price per the retailer's Gulf pricing code on the card. **Hard-blocked on BMS-4049 spike.**
4. **Warehouse availability indicator (FL / AL badge)** — currently no warehouse badge. Tier display works; this is a *which-warehouse-stocks-it* indicator, not the In/Low/Out status.
5. **Pack configuration details** beyond UOM — pack count / pack-size string ("24 x 12oz") rendered prominently. Today's display is UOM-only per epic note.
6. **Pricing-resolution-failure state** — 'Contact your rep for pricing' fallback when the pricing waterfall returns no value (instead of $0.00 or blank). Net-new state.

### Outstanding ACs (from polish first-pass, with completed work removed)

```gherkin
Scenario: Card extracted to standalone LWC with documented input contract
  Given productCard is at `lwc/productCard`
  When  ecomShop renders cards via <c-product-card item={tile}>
  Then  pagination, filters, and add-to-cart still pass regression
  And   the @api item shape is documented in JSDoc and reusable by search / reorder hosts

Scenario: Gulf pricing-code resolution displayed on card (depends on BMS-4049)
  Given the retailer's Account resolves to a Gulf pricing code
  When  the card renders for an Item__c
  Then  the unit price shown is the resolved price for that pricing code (not list)
  And   if multiple codes apply, the spike's tie-break rule decides which is shown

Scenario: Warehouse availability indicator (which warehouse stocks)
  Given the retailer's Account.Fulfillment_Location__c = 'Mobile AL'
  When  the card renders
  Then  a small badge / label shows the warehouse name OR a regional indicator (FL / AL)
  And   this is distinct from the In/Low/Out tier badge already on the card

Scenario: Pack configuration details (beyond UOM)
  Given Item__c has Units_Per_Case__c = 24, UOM__c = '12oz', Cases_Per_Pack__c = 1
  When  the card renders
  Then  a pack string '24 x 12oz' (or similar canonical form) is displayed prominently
  And   distinguishes 24×12oz from 12×20oz of the same brand at a glance

Scenario: Pricing-resolution-failure path
  Given the pricing waterfall returns no resolved price
  When  the card renders
  Then  the price area shows 'Contact your rep for pricing' (NOT $0 / blank)
  And   Add-to-Cart is disabled with an explanatory tooltip
```

ACs about "card renders with name / image / SKU / UOM" and "add-to-cart inline qty selector" can be downgraded to **regression scenarios** since the underlying interactions exist inline.

## Conflicts to verify

| Item | Epic note says | Actual code says | Resolution needed |
|---|---|---|---|
| Promotion savings display | COMPLETE | UI shows savings; **data feed is stubbed** — `getItemIdToPromotionsMap`, `getPromotionCriteriaQuantities` return empty | Confirm: does the savings number on the card actually compute from a live source today, or is the displayed value stale/zero until promo rebuild lands? |
| MSRP comparison pricing | COMPLETE | Likely fine — depends on whether `Item__c.MSRP__c` (or equivalent) is populated; doesn't depend on stubs | Quick spot-check |
| `addDraftItems` cart-write path | implied via "Cart state on cards COMPLETE" | **STUB** — `CartController.addDraftItems` returns empty (`CartController.cls:559-562`); live write path is `EcomWrappers` → `DraftInvoiceController` | Card extraction must call `cartService` / `draftInvoiceService`, not the stubbed CartController method |

## Hard dependencies (still binding)

- **BMS-4049 — Gulf Pricing Spike** — must land before pricing-code AC can ship.
- **BMS-3925 — Product Catalog & Availability** — provides the warehouse-aware data feeding the card.
- **Promotion-model rebuild** — needed for live promotion strikethrough + label.
- **BMS-3930** — same title-mismatch.

## Updated estimate

**~2–2.5 days** for the extraction + Gulf-specific surfaces, **excluding** BMS-4049 outcome and the promo rebuild. Down from polish first-pass's 3–4d because the underlying card markup, cart wiring, and stock badges are confirmed in place; the work is structural (extract) + additive (badge, pack string, pricing display, fallback state).
