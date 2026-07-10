---
ticket: BMS-4053
title: "Retailer Portal Product Card — Ph 1: Card Component"
type: Story
parent_epic: "BMS-3702 — Gulf E-Commerce & Ordering"
parent_decomposed_from: "BMS-3924"
status: "Backlog / Refinement Needed"
sprint: "Sprint 3 (2026-05-16 → 2026-05-29)"
repo_scanned: "/Users/alvarosanchez_1/Documents/OHFY-Ecom/force-app + /Users/alvarosanchez_1/OHFY-Split/OHFY-Data-Model"
polished_on: 2026-05-05
polished_by: Alvaro Sanchez
jira: https://ohanafy.atlassian.net/browse/BMS-4053
tags: [polish, ecom, gulf, card, sprint3]
---

# BMS-4053 — Jira-Ready

**Title:** Extract reusable `lwc/productCard` — pricing, pack info, warehouse availability, add-to-cart

**Description:**

As a Gulf retailer buyer, I want product cards to clearly show my account's resolved unit price, pack configuration, image, and warehouse availability — and let me add to cart inline — so I can evaluate items at a glance regardless of where the card appears (catalog, search, reorder).

**Current State (2026-05-05, per codebase scan):**

- Tile markup is inline in `lwc/ecomShop/ecomShop.html` today. There is no `lwc/productCard` LWC. **Extracting to a reusable component is the core net-new structural work.**
- Source data shape (in ecomShop's items[]): mix of `Item__c` fields (Name, Item_Type__r.Name, image URL, pack), resolved unit price, in-cart quantity, promo state. The card needs a stable input contract.
- Warehouse availability: `CartController.getQuantityAvailableAtFulfillmentLocation` (live, `CartController.cls:642-680`) — returns `Map<Id, Decimal>` per item at the user's fulfillment Location__c.
- Cart-write path: `EcomWrappers.initializeDraftInvoice` / `onInvoiceItemChange` / `updateDraftInvoice` / `confirmDrafts` (`classes/experienceSite/EcomWrappers.cls`) — passes through to `DraftInvoiceController`. Used by `cartService` and `draftInvoiceService` LWCs.
- Pricing: resolver class lives upstream (Pricelist__c + Pricelist_Item__c + Tier_Setting__c data; resolver entry point not in OHFY-Ecom). Today's catalog already shows a price; the source path needs documenting before this card extraction.
- Promo flag for "struck-through original price + discounted price + label": gated on the four stubbed CartController methods (`getItemIdToPromotionsMap` etc.) — same shared blocker as BMS-3925 / 3927.
- Min-order-qty: `CartController.getMinimumCaseQuantity(Id accountId)` is **account-scoped**, not item-scoped. There is **no `Min_Order_Quantity__c` field on `Item__c`**.
- Configuration MDT: `EcomMinimumCaseQuantity` exists (account-scoped). No `EcomLowStockThresholdCases` MDT today.
- Catalog object is `Item__c`. `Cart_Item__c.Product__c` is a *lookup field name* pointing at `ohfy__Item__c`.

**Out of Scope:**

- Grid layout & cross-context reuse (search results, reorder) — covered by **BMS-4054** Ph 2.
- Promotion-model rebuild — shared dependency; file as its own ticket.
- The PRC pricing waterfall resolver itself — assumed upstream; this ticket only consumes the resolved price.
- Per-item `Min_Order_Quantity__c` field (today's MDT is account-scoped; AC #5's "min 5 cases for Brand Y" implies per-SKU which is net-new metadata).

**Acceptance Criteria:**

```gherkin
Scenario: Card renders with the retailer's resolved unit price (not list price)
  Given a portal-logged-in retailer whose Account resolves to pricelist/pricing-code 'VOL-047' with Account.Fulfillment_Location__c = 'Mobile AL'
  When  ecomShop renders the card for an Item__c
  Then  the card displays the unit price resolved by the upstream pricing waterfall for VOL-047
  And   if a Promotion__c eligible to this retailer is active for the item AND the promotion-model rebuild has shipped
  Then  both the original price (struck through) and the promotional price are shown
  And   a label below the price reads 'Volume Price' or 'Promo Price' (driven by which layer of the waterfall resolved)
  And   if pricing cannot be resolved, the card shows 'Contact your rep for pricing' (NOT $0.00 or blank)

Scenario: Card displays pack configuration & brand hierarchy
  Given Item__c records share the same Item_Type__c (brand) but vary by Units_Per_Case__c × UOM__c × Cases_Per_Pack__c
  When  the card renders
  Then  the card shows: image (or fallback), Item_Type__r.Name (brand), Item__c.Name (variant), pack string (e.g., '24 x 12oz'), UPC (Retailer_UPC__c)
  And   the brand color/accent is consistent across cards of the same Item_Type__c

Scenario: Warehouse availability indicator
  Given the retailer's Account.Fulfillment_Location__c = 'Huntsville AL'
  And   Inventory__c.Quantity_Available__c at Huntsville AL is 12 cases for the Item__c
  And   the configurable low-stock threshold (e.g., Configuration_Preference__mdt.EcomLowStockThresholdCases) = 24
  When  the card renders
  Then  a 'Low Stock' badge displays
  And   if Quantity_Available__c = 0, the badge reads 'Out of Stock' and the Add-to-Cart button is disabled (visually grayed out)
  And   the card does NOT display the exact case count — only the tier (In Stock / Low Stock / Out of Stock)
  And   the status reflects only the retailer's Fulfillment Location__c, not aggregate Gulf inventory

Scenario: Add-to-cart from the card
  Given the retailer is viewing a card for an in-stock item
  When  the retailer clicks 'Add to Cart'
  Then  an inline quantity selector appears defaulting to 1 case
  And   the selector enforces the account-scoped minimum case quantity (CartController.getMinimumCaseQuantity)
  And   on confirm, the item is added via the draft-invoice path (EcomWrappers.onInvoiceItemChange → DraftInvoiceController)
  And   the card shows a success indicator (checkmark + qty badge) and the global cart icon updates without a full page reload

Scenario: Card is a slottable LWC with a documented input contract
  Given productCard is extracted as `lwc/productCard`
  When  any parent LWC (ecomShop, future search-results host, reorder host) passes the documented item-data object
  Then  the card renders identically across hosts
  And   regression tests on ecomShop pagination + filter + cart-add still pass

Scenario: Pricing-resolution failure path
  Given the upstream pricing waterfall returns no resolved price for the retailer-item pair
  When  the card renders
  Then  the price area shows 'Contact your rep for pricing' (NOT '$0.00' or blank)
  And   Add-to-Cart is disabled with a tooltip explaining the missing price
  And   no console error or unhandled promise rejection is thrown
```

**Technical Approach:**

1. **Extract `lwc/productCard`** from ecomShop.html. Define an `@api item` property with documented shape: `{ id, name, brandName, image, pack, upc, unitPrice, listPrice, isOnPromo, promoLabel, availabilityTier, isAddToCartDisabled, minOrderCases, currentInCartQty }`. Single source of truth in JSDoc.
2. **Refactor ecomShop** to render `<c-product-card item={tile}>` per page item; preserve pagination + filter behavior (keep regression tests green).
3. **Pricing source documenting:** identify the upstream resolver and document how ecomShop / productCard receive resolved prices. If today's path is "resolver runs upstream and the data already arrives in items[]", make that explicit.
4. **Low-stock threshold:** add `Configuration_Preference__mdt.EcomLowStockThresholdCases` (default 24) — coordinate with BMS-3925 since both want it.
5. **Pricing-resolution-failure UI path:** add the 'Contact your rep for pricing' state.
6. **Promo display:** wire the strikethrough + label to the promo-map output. Card must work cleanly when the map is empty (current state) — i.e., no error, just no badge.
7. **Cart-write path:** call `cartService` / `draftInvoiceService` (which already routes through `EcomWrappers`). Don't reintroduce CartController.addDraftItems (stubbed).
8. **Tests:** Jest stubs for productCard cover all states (in-stock, low-stock, out-of-stock, promo, no-price). Snapshot test for visual regression.

**Open Questions (carry to refinement):**

- Pricing resolver entry point — which class/method does the upstream package expose? Is there an `@AuraEnabled` or `@namespaceAccessible` resolver we call from OHFY-Ecom?
- Does Gulf want exact case counts visible, or only the tier? (current AC = tier only.)
- Low-stock threshold — global MDT, per-warehouse on Location__c, or per-item on Item__c?
- Min-order-qty AC mentions "min 5 cases for Brand Y" — is that per-SKU? Today's mechanism is per-Account. If per-SKU, that's net-new metadata (`Min_Order_Cases__c` on Item__c?).
- Brand color/accent — is there a brand-color field on Item_Type__c, or are colors driven by `Ecom_Branding__mdt`?
- Image fallback strategy — `defaultProductImage`, `defaultKeggedProductImage` exist as static resources in OHFY-Ecom. Confirm fallback rules.

**Estimate:** ~3–4 days **excluding** the promotion-rebuild and assuming the pricing resolver entry point is already documented.

---

# BMS-4053 — Polish Notes

## Verdict at a Glance

**Refinement needed but on the right track.** Decomposing into a Ph 1 / Ph 2 split is sensible. Top risks: (a) wrong object names in the original framing (Price_Record__c, Warehouse__c don't exist), (b) shared promo blocker, (c) pricing resolver source needs documenting, (d) min-order-qty AC implies per-SKU metadata that doesn't exist today.

| Area                                                      | Verdict                                                                              |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Story statement (extracted card with pricing/pack/avail)  | Confirmed                                                                            |
| Existing tile inline in ecomShop                          | **Confirmed** — extraction is genuine net-new structural work                        |
| `Product__c`, `Price_Record__c`, `Warehouse__c` framing   | **Contradicted** — actual model is Item__c, Pricelist*, Location__c                  |
| Warehouse availability mechanism                          | **Confirmed** (CartController.cls:642-680)                                           |
| Promo strikethrough + label                               | **Contradicted today** — promo lookup methods are stubs                              |
| Add-to-cart wires through CartController.addDraftItems    | **Contradicted** — that method is stubbed; live path is `EcomWrappers` → DraftInvoice |
| Account-scoped minimum case quantity                      | **Confirmed** (CartController.getMinimumCaseQuantity)                                |
| Per-SKU "min 5 cases for Brand Y"                         | **Contradicted** — no `Min_Order_*` field on Item__c                                 |
| `EcomLowStockThresholdCases` MDT                          | **Not found** — needs to be added                                                    |
| Pricing-resolution-failure 'Contact your rep' state       | Sensible; net-new                                                                    |

---

## Phase 2 — Business Requirements & ACs

### Structural check

- ✅ Clear purpose
- ✅ Story type
- ✅ Sensible Ph 1 / Ph 2 split with BMS-4054
- 🟨 Sprint 3 with BMS-4054 also Sprint 3 — coordinate ordering (Ph 2 depends on Ph 1)

### AC validation (4 scenarios on the ticket)

| AC | Verdict | Notes |
|---|---|---|
| 1 — Card renders with account-specific pricing + 'Contact rep' fallback | Partial | Resolver source TBD; fallback state is sensible net-new |
| 2 — Pack configuration + brand hierarchy | Confirmed (testable) | All fields exist on Item__c / Item_Type__c |
| 3 — Warehouse availability tier badge | Partial | Live availability ✅; threshold MDT missing |
| 4 — Add-to-cart with inline qty selector + min-order enforcement | Partial | Account-scoped min works; per-SKU "min 5 for Brand Y" doesn't |

### Gaps to plug

- **Missing AC**: regression — ecomShop's pagination + filter + cart still work after the card extraction.
- **Missing AC**: card with empty promo map (current state) renders cleanly without errors.
- **Missing AC**: image-fallback behavior (Item__c with no image URL → `defaultProductImage` / `defaultKeggedProductImage`).
- **Missing AC**: card data-input contract — explicit JSDoc shape so downstream hosts (search results, reorder) know what to pass.
- **Missing AC**: pricing-resolution-failure state ('Contact your rep for pricing') — already in the AC text, but worth lifting to its own scenario for clarity.

---

## Phase 3 — Technical Approach

### Auto-gen ticket says

> "Architecture Layer: UI/Experience (L3). Relevant SObjects: Product__c, Product_Category__c, Cart__c, Cart_Item__c, Invoice__c (draft for ecom orders), Account, Contact. Key Repos: OHFY-Core (product catalog), Ozone (Experience Cloud components, 331 objects)."

### Claim-by-claim validation

**Claim 1: SObjects = `Product__c`, `Product_Category__c`, ...**
- **Code shows:** Neither exists. Catalog = `Item__c`; Category = formula on Item__c rolling up from Item_Type__c.
- **Assessment:** **Contradicted.** Update.

**Claim 2: SObjects = `Cart__c`, `Cart_Item__c`**
- **Code shows:** Both exist locally in OHFY-Ecom. `Cart_Item__c.Product__c` is a *lookup field* pointing at `ohfy__Item__c`; `Cart_Item__c.Cart__c` is master-detail; other fields: Unit_Price__c, Ordered_Quantity__c, Subtotal__c, Savings__c, Product_Image__c.
- **Assessment:** **Confirmed** but flag the lookup-field-name confusion.

**Claim 3: SObjects = `Invoice__c` (draft for ecom orders)**
- **Code shows:** `Invoice__c` exists; Develop-Split has migrated cart-confirm path to `DraftInvoiceController`. `EcomWrappers.cls` wraps it for LWC consumption.
- **Assessment:** **Confirmed.**

**Claim 4: "Key Repos: OHFY-Core (product catalog), Ozone (Experience Cloud components, 331 objects)"**
- **Code shows:** Repo names don't match local layout. Catalog metadata lives in `OHFY-Data-Model` (`/Users/alvarosanchez_1/OHFY-Split/OHFY-Data-Model`). Ecom LWCs/classes live in `OHFY-Ecom` (`/Users/alvarosanchez_1/Documents/OHFY-Ecom/force-app`). "OHFY-Core" and "Ozone" appear to be obsolete repo labels from an earlier architecture.
- **Assessment:** **Contradicted.** Update.

**Claim 5: "Pricing engine (account-specific pricing) integration point"**
- **Code shows:** Pricelist__c + Pricelist_Item__c + Pricelist_Account__c + Tier_Setting__c. Resolver class not located in OHFY-Ecom.
- **Assessment:** **Unverifiable from this repo.** Document the upstream entry point during refinement.

**Claim 6: "Inventory system (availability check)"**
- **Code shows:** Live API: `CartController.getQuantityAvailableAtFulfillmentLocation` (`CartController.cls:642-680`).
- **Assessment:** **Confirmed.**

**Claim 7: "Delivery cutoff time enforcement"**
- **Code shows:** New field `Location__c.Warehouse_Cutoff_Time__c` (Time field) was just added; `AbandonedCartReminderScheduler` consumes it. Card-level cutoff display would be a new UI surface.
- **Assessment:** **Out of scope for the card** but flag if Gulf wants it on the card.

**Claim 8: "Case minimum validation at order submission"**
- **Code shows:** `CartController.getMinimumCaseQuantity(accountId)` is account-scoped. No per-SKU min field.
- **Assessment:** **Partially correct.** Per-SKU minimums aren't supported today.

### Scorecard

| # | Claim | Verdict |
|---|---|---|
| 1 | `Product__c` / `Product_Category__c` SObjects | Contradicted |
| 2 | `Cart__c` / `Cart_Item__c` | Confirmed |
| 3 | `Invoice__c` for draft orders | Confirmed |
| 4 | "OHFY-Core" / "Ozone" repos | Contradicted |
| 5 | Pricing engine entry point | Unverifiable |
| 6 | Inventory availability | Confirmed |
| 7 | Delivery cutoff time | Out of scope (or flag) |
| 8 | Case minimum validation | Partially correct |

---

## Phase 4 — Dependencies

| Link | Check | Result |
|---|---|---|
| Decomposed-from **BMS-3924** | Should be parent | Currently "relates to" — convert |
| Sibling **BMS-4054** (Ph 2 Grid) | Ph 2 depends on Ph 1's extracted card | Order: Ph 1 ships first |
| Sibling **BMS-3925** (catalog) | Reuses the card | Reuses output of this ticket |
| Sibling **BMS-3927** (search) | Reuses the card | Same |
| Implicit dep: **promotion rebuild** | Promo strikethrough + label depends on it | File as own ticket |
| Pricing resolver | Upstream | Document during refinement |
| BMS-3930 | Title mismatch | Same as siblings |

---

## Top Issues (ranked)

1. **Object naming wrong.** `Product__c`, `Product_Category__c`, `Price_Record__c`, `Warehouse__c` — none exist. Use `Item__c`, `Item_Type__c`, `Location__c`, `Inventory__c`, `Pricelist*`.
2. **`addDraftItems` is stubbed** (CartController.cls:559-562). The auto-gen tech approach implies using it; live path is `EcomWrappers` → `DraftInvoiceController`.
3. **Per-SKU min-order isn't a thing today.** AC mentions "min 5 cases for Brand Y" — implies per-SKU. Either drop this AC or add `Min_Order_Cases__c` to Item__c (metadata change).
4. **Low-stock threshold MDT is missing.** Add `EcomLowStockThresholdCases` (or similar) — shared with BMS-3925.
5. **Pricing resolver entry point isn't documented.** Card needs to know how to ask for a resolved price.
6. **Repo names "OHFY-Core / Ozone" are obsolete.** Update to OHFY-Data-Model + OHFY-Ecom.
7. **Promo display gated on stub rebuild.** Acknowledge in ticket.

---

## Suggested Revisions

- Rewrite ACs with `Item__c` / `Item_Type__c` / `Inventory__c` / `Location__c`.
- Replace "queries Price_Record__c" with: "consumes resolved unit price from upstream pricing waterfall (Pricelist__c + Pricelist_Item__c + Tier_Setting__c data; resolver entry point TBD)."
- Replace "via CartController.addDraftItems" with "via cartService → draftInvoiceService → EcomWrappers → DraftInvoiceController."
- Add the regression AC, the empty-promo-map AC, and the image-fallback AC.
- Drop or split the per-SKU minimum AC depending on Gulf's actual requirement.
- Re-link decomposed-from BMS-3924 as parent (not "relates to").
- Re-link or clarify BMS-3930.
