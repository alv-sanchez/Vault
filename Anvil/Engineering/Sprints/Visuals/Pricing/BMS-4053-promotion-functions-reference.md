---
title: Promotion Functions Reference — Ecom Product Card (BMS-4053)
ticket: BMS-4053
created: 2026-06-22
tags: [ecom, promotions, price-resolver, bms-4053, reference]
---

# Promotion Functions Reference

Every function involved in resolving, discovering, and displaying promotions on the
retailer-portal product card — across all four layers. Each is tagged:

- 🟦 **EXISTING** — shipped before this ticket (mostly BMS-3876 `S_PriceResolver`, BMS-3873 FLP, legacy `CartController`).
- 🟩 **CREATED (BMS-4053)** — added or materially rewritten on this branch.

The flow, top to bottom: **OMS resolver** (backend truth) → **ecom backend** (discovery / thresholds) → **UI wrapper** (cross-package facade) → **LWC** (card rendering + cart-reactive pooling).

---

## 1. OMS — `S_PriceResolver.cls` (OHFY-OMS)

The cart-aware promotion engine. Layers promotions on top of the `S_FrontLinePricing` base. Ecom delegates to it; it owns no ecom code.

> Mental model: `query*` gather data → `filterEligiblePromotions` decides **who's eligible** → `scopeMatches` + `cartContextQuantities` decide **which items + pooled qty** → `applicableDiscount` + `isBetterForCustomer` pick **the winner per line**.

### Public API

| Fn | Tag | What it does |
| --- | --- | --- |
| `resolve(CartResolutionRequest)` → `CartResolutionResult` | 🟦 EXISTING | **Main pricing entry point.** Resolves the whole cart: FLP base + the single winning promotion per line (eligibility → scope → threshold → priority winnow → best-for-customer). One `LineResult` per input line. |
| `eligiblePromotionsByItem(accountId, fulfillmentLocationId, itemIds, asOfDate)` → `Map<Id, List<Promotion__c>>` | 🟩 CREATED | **Discovery (not pricing).** Returns *all* eligible, scope-matched promotions per item (tier rows included) for the storefront badge/modal. Where `resolve` returns one winner, this returns the full list. Reuses the same eligibility filter so discovery can never disagree with the resolved price. |

### Per-line resolution helpers (private)

| Fn                                                                   | Tag         | What it does                                                                                                                                                                                                                                                       |
| -------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `resolveLine(...)` → `LineResult`                                    | 🟦 EXISTING | Resolves a single line: finds qualifying promos, runs the priority winnow + best-for-customer pick, stamps the winner's discount onto the `LineResult`.                                                                                                            |
| `isBetterForCustomer(candidate, current)` → `Boolean`                | 🟦 EXISTING | Tiebreaker — deepest per-case discount wins; ties break on highest Promotion Id (determinism).                                                                                                                                                                     |
| `applicableDiscount(promo, casePrice, cartQty, tiers)` → `Qualified` | 🟦 EXISTING | The discount one promo applies to this line, or `null` if its threshold isn't met. **QD → highest tier whose `Min_Quantity` ≤ pooled qty**; Post-off → parent `Min_Quantity`/`Discount_Amount`. Handles Percent vs Dollar.                                         |
| `lineDiscountTotal(perCase, quantity)` → `Decimal`                   | 🟦 EXISTING | Per-case discount × line quantity (rounded).                                                                                                                                                                                                                       |
| `scopeMatches(promo, it)` → `Boolean`                                | 🟦 EXISTING | Does the item fall in the promo's cascade scope — ITEM / ITEM_TYPE (**Brand**) / ITEM_LINE (**Brand Family**) / SUPPLIER — plus optional `Packaging_Style__c`.                                                                                                     |
| `cartContextQuantities(...)` → `Map<Id, Decimal>`                    | 🟦 EXISTING | **The pooling logic.** Sums every cart line in each eligible promo's scope — tiers/thresholds evaluate against this pooled total, not a single line. (This is why a brand promo pools 6+5 across two SKUs to trip a tier of 10.)                                   |
| `filterEligiblePromotions(...)` → `List<Promotion__c>`               | 🟩 CREATED  | **Shared eligibility filter** — audience (group / one-day-sale targeting), exclusions, Location/Channel/Chain scope. Extracted from `resolve()` so both pricing and discovery (`eligiblePromotionsByItem`) run *one* implementation. Behavior-preserving refactor. |

### FLP + query helpers (private)

| Fn                                                            | Tag         | What it does                                                                                                                                                                  |
| ------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resolveFlpBase(...)` → `List<ResolutionResult>`              | 🟦 EXISTING | Delegates to `S_FrontLinePricing.resolve()` for the front-line base price per line.                                                                                           |
| `queryItems(itemIds)` → `Map<Id, Item__c>`                    | 🟦 EXISTING | Loads each item's cascade keys (Item_Type, Item_Line, Supplier, Packaging_Style) for scope matching.                                                                          |
| `queryCandidatePromotions(...)` → `List<Promotion__c>`        | 🟦 EXISTING | Active, in-date promotions whose scope touches any cart item — one query across all four scope levels. For **pricing**.                                                       |
| `queryAccountGroupIds(accountId, asOfDate)` → `Set<Id>`       | 🟦 EXISTING | Promotion groups the account belongs to (audience membership) as of date.                                                                                                     |
| `queryAccountScope(accountId)` → `Account`                    | 🟩 CREATED  | One row of the account's scope fields (`Premise_Type__c` + `Chain_Banner__c`) for Channel/Chain matching. (Factored out for reuse by discovery.)                              |
| `queryExclusions(accountId, candidates)` → `Set<Id>`          | 🟦 EXISTING | Promotions explicitly excluded for this account.                                                                                                                              |
| `queryTiers(candidates)` → `Map<Id, List<Promotion_Tier__c>>` | 🟦 EXISTING | Loads `Promotion_Tier__c` rows for QD candidates, keyed by promotion.                                                                                                         |
| `queryDiscoveryPromotions(...)` → `List<Promotion__c>`        | 🟩 CREATED  | Like `queryCandidatePromotions` but a richer SELECT (Name, Description, dates) + the `Promotion_Tiers__r` subquery — backs the **discovery** method (tier ladder for the UI). |

---

## 2. Ecom backend — `CartController.cls` (OHFY-eCommerce, legacy/)

Storefront helpers. Several were migrated off the dead old promotion model onto `Promotion__c` / `Promotion_Tier__c` this branch.

| Fn | Tag | What it does |
| --- | --- | --- |
| `getPromotionCriteriaQuantities(promotionIds, itemIds)` → `Map<String,Decimal>` | 🟩 CREATED (migrated) | Minimum case qty each promotion needs on an item before its discount unlocks — feeds the progress bar. **Post-off → parent `Min_Quantity`; QD → entry (lowest) tier.** Scope-matches mirror `S_PriceResolver.scopeMatches`. Rewritten onto the new model (was reading the deprecated `Promotion_Item__c` graph). Key = `"promotionId-itemId"`. |
| `promotionUnlockQuantity(promo)` → `Decimal` | 🟩 CREATED | Cases needed before a promo's discount unlocks — QD entry tier vs Post-off parent threshold. Helper for the above. |
| `promotionScopeMatches(promo, it)` → `Boolean` | 🟩 CREATED | Mirror of the resolver's scope match (ITEM/TYPE/LINE/SUPPLIER + packaging) so the bar can't disagree with the price. |
| `getBrands(brandIds)` → `List<Item_Type__c>` | 🟦 EXISTING | Brand (Item Type) records for storefront filters. |
| `getItemIdToPromotionsMap(...)` → `Map<String,List<Promotion__c>>` | 🟦 EXISTING (repointed) | Item → eligible promotions map for the card. **Repointed** this branch to flow from `S_PriceResolver.eligiblePromotionsByItem`. |
| `getPromotionJunctions(promoIds)` → `Map<Id,List<SObject>>` | 🟦 EXISTING (neutralized) | Legacy junction lookup on the old model — **neutralized to a no-op** this branch (old model deprecated). |

---

## 3. UI wrapper — `Ecom_UI_Wrappers.cls` (OHFY-eCommerce-UI)

`@AuraEnabled` facade. Delegates 1:1 to the backend / OMS resolver. LWCs only ever call these.

| Fn | Tag | Delegates to |
| --- | --- | --- |
| `resolveCatalogPricing(...)` → `List<LineResult>` | 🟩 CREATED | `S_PriceResolver.resolve` at qty 1 — account-specific catalog price + label per card. |
| `resolveCartPricing(accountId, fulfillmentLocationId, Map<Id,Decimal> quantitiesByItem)` → `List<LineResult>` | 🟩 CREATED | `S_PriceResolver.resolve` with real cart quantities — the **cart-reactive** (quantity-aware) tier price. |
| `getEligibleItemPromotions(accountId, fulfillmentLocationId, itemIds)` → `Map<Id,List<Promotion__c>>` | 🟩 CREATED | `S_PriceResolver.eligiblePromotionsByItem` — discovery list for badge/modal. |
| `getPromotionCriteriaQuantities(...)` | 🟩 CREATED (passthrough) | `CartController.getPromotionCriteriaQuantities` — unlock thresholds for the bar. |
| `getBrands` / `getItemIdToPromotionsMap` / `getPromotionJunctions` | 🟦 EXISTING (passthrough) | Their `CartController` counterparts above. |

---

## 4. LWC — `ecomShop.js` + `ecomProductCard.js` (OHFY-eCommerce-UI)

Card rendering, cart-reactive pricing, and the pooled tier meter.

### `ecomShop.js`

| Fn                                                        | Tag                     | What it does                                                                                                                                                                                                                                                                         |
| --------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `loadPromotionCriteriaQuantities()`                       | 🟦 EXISTING (repointed) | Loads the unlock-threshold map (the "/N" denominators) from the wrapper.                                                                                                                                                                                                             |
| `getItemPromotions(itemId)` / `itemHasPromotions(itemId)` | 🟦 EXISTING             | Read the discovery map for an item's eligible promos.                                                                                                                                                                                                                                |
| `refreshCartReactivePricing()`                            | 🟩 CREATED              | Builds quantities from `cartQuantities`, calls `resolveCartPricing`, applies the result. The cart-reactive price path.                                                                                                                                                               |
| `applyCartPricingToItems()`                               | 🟩 CREATED              | Idempotent per-item price/label override from the cart `LineResult` (or restore catalog price). Calls `repaginate()` — **cards render from the paginated `this.page`, so mutating `this.items` alone won't refresh them.**                                                           |
| `pooledCartQuantityForPromotion(promotionId)`             | 🟩 CREATED              | **The client-side pooling fix.** Sums `cartQuantities` across every cart line whose item is in the promo's scope (read from `itemToPromotionsMap`). Mirrors `S_PriceResolver.cartContextQuantities` so a brand promo advances **one shared bar** across all its items.               |
| `computeFirstPromotion(firstPromo, itemId, isOutOfStock)` | 🟩 CREATED              | Builds the **tier-ladder meter view-model** from the pooled qty + full tier list: positioned milestone markers, amber fill %, unlocked/locked state, the "saving X · N more to unlock Y" sentence, and the fulfilled state. Returns `null` only for flat always-on (≤1-case) promos. |
| `refreshAllPromotionProgress()`                           | 🟩 CREATED              | Recomputes the meter for **every** visible card (pooling means one item's qty change moves siblings' bars). Repaginates.                                                                                                                                                             |
| `updateItemPromotionProgress()`                           | 🟦 EXISTING (rewritten) | No-arg shim → `refreshAllPromotionProgress()`. Was per-line (the original single-line bug); now delegates to the pooled refresh.                                                                                                                                                     |

### `ecomProductCard.js`

| Fn | Tag | What it does |
| --- | --- | --- |
| `handlePromotionClick(event)` | 🟦 EXISTING | Opens the item-promotions modal (badge click). |
| `handlePromotionOverlayClick(event)` | 🟦 EXISTING (reused) | Opens the tier table from the meter / "See all volume tiers" link. |

---

## Provenance summary

| Layer | Created this branch (BMS-4053) | Pre-existing |
| --- | --- | --- |
| `S_PriceResolver` | `eligiblePromotionsByItem`, `filterEligiblePromotions`, `queryDiscoveryPromotions`, `queryAccountScope` | `resolve`, `resolveLine`, `applicableDiscount`, `scopeMatches`, `cartContextQuantities`, `isBetterForCustomer`, `lineDiscountTotal`, `resolveFlpBase`, `queryItems`, `queryCandidatePromotions`, `queryAccountGroupIds`, `queryExclusions`, `queryTiers` |
| `CartController` | `getPromotionCriteriaQuantities` (migrated), `promotionUnlockQuantity`, `promotionScopeMatches` | `getBrands`, `getItemIdToPromotionsMap` (repointed), `getPromotionJunctions` (neutralized) |
| `Ecom_UI_Wrappers` | `resolveCatalogPricing`, `resolveCartPricing`, `getEligibleItemPromotions`, `getPromotionCriteriaQuantities` | `getBrands`, `getItemIdToPromotionsMap`, `getPromotionJunctions` |
| LWC | `pooledCartQuantityForPromotion`, `computeFirstPromotion`, `refreshAllPromotionProgress`, `refreshCartReactivePricing`, `applyCartPricingToItems` | `getItemPromotions`, `itemHasPromotions`, `loadPromotionCriteriaQuantities`, `updateItemPromotionProgress` (rewritten), `handlePromotionClick`, `handlePromotionOverlayClick` |

**Key principle running through all of it:** there is exactly one eligibility implementation (`filterEligiblePromotions`) and one pooling rule (`cartContextQuantities` server-side, mirrored by `pooledCartQuantityForPromotion` client-side), so the badge, the meter, and the charged price can never contradict each other.
