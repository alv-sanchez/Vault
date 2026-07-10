---
title: Syncing E-Commerce Front-End with Split
branch: develop-split
target_org: apr30Test (scratch)
synced_on: 2026-05-06
synced_by: Alvaro Sanchez
status: All 23 LWCs deploy clean against the migrated Apex / data model.
related: "[[Syncing E-Commerce Backend with Split]]"
tags:
  - ecom
  - split
  - lwc
  - schema-migration
  - paper-trail
  - front-end
---

# Syncing E-Commerce Front-End with Split

Companion to [[Syncing E-Commerce Backend with Split]] (backend Apex + metadata sync). Once the Apex layer was returning the new Invoice__c / Invoice_Item__c / Placement__c shape with renamed fields, every LWC that read those records by API name had to be retagged. This note captures every front-end edit that landed in the same `develop-split` deploy.

Starting state: backend deploy clean, but LWCs were still reading legacy `ohfy__Order_*__c`, `ohfy__Order_Items__r`, etc. → silent runtime breakage.
Ending state: **23/23 LWC bundles deploy `Succeeded`. No remaining legacy field/object references in `force-app/main/default/lwc/`.**

---

## Field & Relationship Renames Applied in LWC Tree

| Legacy reference (LWC) | Replacement | Where it shows up |
|---|---|---|
| `ohfy__Order_Items__r` (subquery alias) | `ohfy__Invoice_Items__r` | `ecomOrderHistory`, `ecomHomeBody`, `ecomOrderPlaced` |
| `ohfy__Order__c` / `'Order__c'` | `ohfy__Invoice__c` / `'Invoice__c'` | `ecomOrderPlaced.js` default sObjectName + sessionStorage params |
| `ohfy__Order_Item__c` (objectName configs) | `ohfy__Invoice_Item__c` | `userDataService` aggregate query, `ecomOrderItemUtils` field list |
| `ohfy__Account_Item__c` | `ohfy__Placement__c` | `draftInvoiceService` factory comments + sObjectName references |
| `ohfy__Order_Number__c` | `ohfy__Invoice_Number__c` | order header display, `ecomOrderPlaced.html` invoice line |
| `ohfy__Order_Date__c` | `ohfy__Invoice_Date__c` | date formatters, `userDataService.getGroupedSumByDate` `dateField` |
| `ohfy__Order_Total__c` | `ohfy__Invoice_Total__c` | totals card, history tally |
| `ohfy__Sub_Total__c` | `ohfy__Subtotal__c` | per-line subtotal in `ecomOrderHistory`, `ecomHomeBody`, `ecomOrderPlaced` |
| `ohfy__Backorder_Quantity__c` | `ohfy__Backorder_Case_Quantity__c` | order-history backorder badge + `hasBackorder` flag |
| `ohfy__Discounted_Unit_Price__c` | `ohfy__Discounted_Case_Price__c` | savings/discount calc in history rows |
| `ohfy__Ordered_Quantity__c` (Invoice_Item__c paths) | `ohfy__Ordered_Case_Quantity__c` | order-history line-item, `ecomOrderItemUtils` field list |
| `ohfy__Signed__c` / `ohfy__Picked__c` / `ohfy__Dock_Sale__c` | `ohfy__Is_Signed__c` / `ohfy__Is_Picked__c` / `ohfy__Is_Dock_Sale__c` | order status flags + status mapping helpers |
| `ohfy__Sold_In_Units__c` | `ohfy__Is_Sold_In_Units__c` | `ecomShop`, `ecomProductPage`, `ecomCartPage`, `ecomHomeBody`, `ecomOrderHistory`, `userDataService`, `draftInvoiceService` |
| `ohfy__Tracked_By_Lots__c` | `ohfy__Is_Lot_Tracked__c` | `userDataService` getRecordAndFields field list |
| `ohfy__Stock_UOM_Sub_Type__c` | `ohfy__Item_Type_Subtype__c` | `ecomShop` UOM display, `ecomProductPage` UOM badge, `ecomCartPage` product subtype, `userDataService` field list |
| `ohfy__Fulfilled_From__c` / `__r` | `ohfy__Fulfillment_Location__c` / `__r` | `userDataService` account record (fulfillment location + warehouse cutoff time) |
| `ohfy__Straight_Line__c` (Promotion__c) | `ohfy__Is_Straight_Line__c` | `userDataService.supportedPromotions` filter |
| `ohfy__Delivery_Locked__c` (incl. raw SOQL strings) | `ohfy__Is_Locked__c` / `Is_Locked__c` | `ecomReviewSummary` `fieldsToRetrieve` + `filterCondition` strings |
| `ohfy__Sellable__c` (Location__c) | `ohfy__Is_Sellable__c` | location filtering |
| `QA_DraftInvoiceController` (DTO doc-comment) | `DraftInvoiceController` | `draftInvoiceService` DraftInvoiceDTO header |
| `ohfy__Active_Route__c` (Account_Route__c) | `ohfy__Is_Active_Route__c` | `navigationMenu` + `ecomOrderPlaced` filter map (runtime SOQL was throwing "no such column") |
| `ohfy__Default_Price__c` (Item__c) | `ohfy__Default_Case_Price__c` | `userDataService` pricelist field list, `ecomShop` regular-price read |
| `ohfy__Stock_UOM__c` (Item__c) | `ohfy__UOM__c` | `userDataService` pricelist field list, `ecomProductPage` UOM badge |
| `ohfy__Day_of_Week__c` (Route__c) | `ohfy__Day_Of_Week__c` (capital O — case-sensitive) | `navigationMenu` + `ecomOrderPlaced` route SELECT + day lookup |
| `ohfy__Item_Line__r.Supplier__c` / `Supplier__r.Name` | `ohfy__Supplier__c` / `ohfy__Supplier__r.Name` | `userDataService` pricelist field list — namespace prefix was missing |
| `ohfy__Item_Type__r.Subtype__c` | `ohfy__Item_Type__r.ohfy__Subtype__c` | `userDataService` pricelist field list — same namespace-prefix omission |
| `ohfy__Route__r.ohfy__Active__c` (filter map key) | `ohfy__Route__r.ohfy__Is_Active__c` | `ecomReviewSummary` `getRecordsByMultipleFields` filter map |
| `ohfy__Item__r.ohfy__Units_Per_Pallet__c` / `Units_Per_Layer__c` | *(removed — Core dropped them)* | `userDataService` pricelist field list. Replacements available: `Cases_Per_Layer__c`, `Cases_Per_Pallet__c`, `Layers_Per_Pallet__c` — wire those in if/when the storefront uses them. |
| `ohfy__Discounted_Item_Price__c` (Pricelist_Item__c) | `ohfy__Discounted_Case_Price__c` | `userDataService` field list + price-map writes, `navigationMenu` price fallback, `ecomHomeBody` price formatter, `reorderModal` unit-price resolver, `ecomProductPage` doc comment |
| `ohfy__Item_Type__r.Sub_Type__c` | `ohfy__Item_Type__r.Subtype__c` | `userDataService` pricelist field list (Item_Type__c branch) |
| `brand.ohfy__Sub_Type__c` | `brand.ohfy__Subtype__c` | `userDataService.getDataForFilters` — types/suppliers/brands options builder (6 sites) |
| `ohfy__Item__r.ohfy__Sub_Type__c` | *(removed — Item__c.Sub_Type__c is gone; the formula `Item_Type_Subtype__c` is already in the field list)* | `userDataService` pricelist field list |

---

## Per-LWC Change Log

### `userDataService/userDataService.js` (25 edits across two passes)
- `accountRecord.ohfy__Fulfilled_From__c` / `__r.ohfy__Warehouse_Cutoff_Time__c` → `Fulfillment_Location__c` / `__r.Warehouse_Cutoff_Time__c` (3 sites: getRecord field list line 251–252, runtime read line 695–696, commented-out fallback line 894).
- `getFilteredRecords` field paths on `ohfy__Item__r`: `Sold_In_Units__c → Is_Sold_In_Units__c`, `Stock_UOM_Sub_Type__c → Item_Type_Subtype__c`, `Tracked_By_Lots__c → Is_Lot_Tracked__c`.
- Promotion filter: `promo.ohfy__Straight_Line__c` → `promo.ohfy__Is_Straight_Line__c`.
- `getGroupedSumByDate` config: `objectName: "ohfy__Order_Item__c" → "ohfy__Invoice_Item__c"`, `dateField: "ohfy__Order_Date__c" → "ohfy__Invoice_Date__c"`, `sumField: "ohfy__Ordered_Quantity__c" → "ohfy__Ordered_Case_Quantity__c"`, where-clause `ohfy__Order__r.ohfy__Customer__c → ohfy__Invoice__r.ohfy__Customer__c`.
- Pricelist field list: `ohfy__Discounted_Item_Price__c → ohfy__Discounted_Case_Price__c` (and the two price-map writes that read it). `ohfy__Item_Type__r.Sub_Type__c → Subtype__c`. `ohfy__Item__r.ohfy__Sub_Type__c` line removed (Item__c has no equivalent; the formula `Item_Type_Subtype__c` is already in the field list).
- Filter-options builder (`getDataForFilters`): `brand.ohfy__Sub_Type__c → brand.ohfy__Subtype__c` (6 sites — types-list condition, label/value, supplier subtype, brand-options subtype).

### `ecomOrderHistory/ecomOrderHistory.js` (31 edits)
- Order-card mapping in `processOrders()`: `Order_Items__r → Invoice_Items__r`, `Order_Number__c → Invoice_Number__c`, `Order_Date__c → Invoice_Date__c`, `Order_Total__c → Invoice_Total__c`, status flags `Signed__c → Is_Signed__c`, `Picked__c → Is_Picked__c`, `Dock_Sale__c → Is_Dock_Sale__c`.
- Per-line item fields: `Backorder_Quantity__c → Backorder_Case_Quantity__c`, `Discounted_Unit_Price__c → Discounted_Case_Price__c`, `Sub_Total__c → Subtotal__c`, `Ordered_Quantity__c → Ordered_Case_Quantity__c` (savings calc + line-item subtotal display), `Sold_In_Units__c → Is_Sold_In_Units__c`.
- Stats accumulator: `order.ohfy__Order_Total__c` → `Invoice_Total__c`, `order.Order_Items__r` → `Invoice_Items__r` length.
- `getOrderedProducts` mapping: `ai.ohfy__Item__r?.ohfy__Sold_In_Units__c` → `Is_Sold_In_Units__c` (Placement record path).

### `ecomHomeBody/ecomHomeBody.js` (23 edits)
- Same shape as `ecomOrderHistory` (it duplicates the recent-orders mapping for the home page): subquery alias, parent fields, line-item fields, savings calc.

### `ecomOrderPlaced/ecomOrderPlaced.js` + `.html` (10 edits)
- Default sObjectName flipped from `'Order__c'` → `'Invoice__c'` in three places: `@track sObjectName` initial value, `pageRef.state.sObjectName ||` fallback, and the sessionStorage rehydrate fallback.
- Invoice mapping: `inv.ohfy__Order_Items__r → Invoice_Items__r`, `inv.ohfy__Order_Total__c → Invoice_Total__c`, `inv.ohfy__Order_Number__c → Invoice_Number__c`.
- Per-line: `item.ohfy__Sub_Total__c → Subtotal__c`, comment "reconciles with Sub_Total__c" → "reconciles with Subtotal__c".
- Template: `Invoice: {invoice.ohfy__Order_Number__c}` → `Invoice_Number__c`.

### `ecomShop/ecomShop.js` (2 edits)
- `safeItem.ohfy__Stock_UOM_Sub_Type__c` → `Item_Type_Subtype__c` (UOM fallback string).
- `safeItem.ohfy__Sold_In_Units__c` (commented branch) → `Is_Sold_In_Units__c` for parity if uncommented.

### `ecomProductPage/ecomProductPage.js` (3 edits)
- `sourceProduct.ohfy__Sold_In_Units__c` → `Is_Sold_In_Units__c` (live + commented variants).
- `sourceProduct.ohfy__Stock_UOM_Sub_Type__c` → `Item_Type_Subtype__c` (UOM badge).

### `ecomCartPage/ecomCartPage.js` (2 edits)
- Cart-row enrichment: `product?.ohfy__Stock_UOM_Sub_Type__c` → `Item_Type_Subtype__c`, `product?.ohfy__Sold_In_Units__c` → `Is_Sold_In_Units__c`.

### `ecomReviewSummary/ecomReviewSummary.js` (6 edits)
- Generic-query filter: `'ohfy__Delivery_Locked__c'` field name + raw SOQL `WHERE ohfy__Delivery_Locked__c != true` and `Delivery_Locked__c = false` clauses → `Is_Locked__c` (with proper namespace prefixing).

### `ecomOrderItemUtils/ecomOrderItemUtils.js` (5 edits)
- `ORDER_ITEM_FIELDS` list: `ohfy__Ordered_Quantity__c → Ordered_Case_Quantity__c`, `ohfy__Backorder_Quantity__c → Backorder_Case_Quantity__c`.
- Header doc-comment: "Saved Order_Items (Apex)" → "Saved Invoice_Items (Apex)".

### `navigationMenu/navigationMenu.js` (7 edits across two follow-up passes)
- Account_Route filter map: `"ohfy__Active_Route__c": true` → `"ohfy__Is_Active_Route__c": true` (runtime SOQL was failing with "No such column 'ohfy__Active_Route__c' on entity 'ohfy__Account_Route__c'").
- Pricelist price fallback: `item.ohfy__Discounted_Item_Price__c` → `ohfy__Discounted_Case_Price__c`.
- Route SELECT + day-of-week reads: `ohfy__Route__r.ohfy__Day_of_Week__c → Day_Of_Week__c` (capital O; SOQL is case-sensitive on field API names).

### `ecomReviewSummary/ecomReviewSummary.js` (additional edit — third pass)
- Filter map for `getRecordsByMultipleFields`: `'ohfy__Route__r.ohfy__Active__c': true` → `ohfy__Is_Active__c`.

### `ecomOrderPlaced/ecomOrderPlaced.js` (additional edits — third pass)
- Route SELECT + day-of-week reads: `ohfy__Day_of_Week__c → Day_Of_Week__c` (capital O).

### `reorderModal/reorderModal.js` (4 edits — second pass)
- Unit-price resolver: `plItem.ohfy__Discounted_Item_Price__c` → `ohfy__Discounted_Case_Price__c` (4 references — null check + assignments).

### `draftInvoiceService/draftInvoiceService.js` (8 edits)
- Runtime read: `item.ohfy__Sold_In_Units__c` → `Is_Sold_In_Units__c`.
- DTO header: "matches QA_DraftInvoiceController.DraftInvoiceDTO structure" → "matches DraftInvoiceController.DraftInvoiceDTO structure".
- JSDoc comments: `Order_Item__c ID → Invoice_Item__c ID` (3 sites), `Account_Item__c for → Placement__c for` (3 sites).

---

## Apex ↔ LWC Contract Verifications

- `draftInvoiceService.js` imports `@salesforce/apex/EcomWrappers.{initializeDraftInvoice, onInvoiceItemChange, updateDraftInvoice}` — all three methods exist on the new local `EcomWrappers.cls` (which routes to `DraftInvoiceController.*`). No import path changes required.
- All `@salesforce/apex/CartController.*` imports across the LWC tree (`getMetadataActiveStatus`, `getQuantityAvailableAtFulfillmentLocation`, `getBrands`, `getPromotionCriteriaQuantities`, `getRecordAndFields`, `getRecordsByMultipleFields`, `getFilteredRecords`, `setDeliveryMessage`, `checkLockedDelivery`, `getNextAvailableDeliveryDate`, `getMinimumCaseQuantity`, `getUserInstance`, `getCurrentUserId`, `getFilesForProduct`, `getGroupedSumByDate`, `getPromotionJunctions`, `getItemIdToPromotionsMap`, `getTerritoryExclusions`, `confirmDraftsWithBackorder`, `clearDraftItems`, `addDraftItems`, `createAccountItem`, `fixEcomOrderNames`) — signatures unchanged; method bodies migrated or stubbed. LWCs still load; the four promotion stubs return empty (carries through as "no promos applied" in the UI, see backend note for the rebuild pending against `Promotion_Item__c`/`Promotion_Item_Type__c`).
- `@salesforce/apex/OrderHistoryController.{getOrderHistory, getOrderedProducts}` — return types changed from `List<Order__c>` / `List<Account_Item__c>` to `List<Invoice__c>` / `List<Placement__c>`. The LWC consumes records by API name (now renamed in this pass) so the shape matches.

---

## Front-End Behavior That Will Need a Second Pass

Items that compile + render but lean on backend stubs or fields that don't exist yet:

1. **Promotions surface in `ecomShop` / `ecomProductPage` / `ecomCartPage` / `ecomReviewSummary`** — the four backend promo methods are stubbed (no `Promotion_Item__c` / `Promotion_Item_Type__c` rebuild yet). Discount badges, criteria progress bars, and item→promo lookups will silently render empty until the new model is wired through.
2. **Order-history Case vs Unit quantity rendering** — Invoice_Item__c now exposes `Ordered_Case_Quantity__c` *and* `Ordered_Unit_Quantity__c` as separate fields. The LWC currently reads only the case quantity. If/when the storefront supports unit-only ordering, the history rows will need a `cases + " × " + units` style render (or one of the rolled-up formulas like `Backorder_Quantity_Total_Cases__c`).
3. **Invoice line-item fields that have no Core replacement** — `UOM__c`, `Item_Units_Per_Case__c`, `Individual_Unit_Price__c` were dropped from the OrderHistoryController SELECT. The order-history LWC no longer surfaces these; if the design needs them, they have to be sourced from `Item__r` lookups (e.g. `Item__r.Units_Per_Case__c`) or new local fields on Invoice_Item__c.
4. **`fixEcomOrderNames` is sunsetted backend-side** — the LWC `draftInvoiceService` still has call sites that fire `fixEcomOrderNames(...)` after confirm. The Apex method is a no-op so nothing breaks, but the call should be removed in a follow-up cleanup pass to drop dead chatter.

---

## Deploy / Validation

- `sf project deploy start --target-org apr30Test --source-dir force-app/main/default/lwc` → 23/23 components, 0 failures, status `Succeeded`.
- No Apex tests run on this pass — coverage was validated in the backend deploy (see [[Syncing E-Commerce Backend with Split]]).
- Manual-test follow-up: golden path on `apr30Test` (Shop → Cart → Confirm → Order History) once the dev server is pointed at the scratch org.
