# Shared Services

## Components
`userDataService` LWC, `draftInvoiceService` LWC, `cartService` LWC (legacy), `c/utils` LWC

## Related Tickets
- [[BMS-4048-quick-fixes]] — `c/utils` sanitizeSearchInput
- [[BMS-4072-delivery-banner-cutoff-fix]] — `userDataService.warehouseCutoffTime`
- [[BMS-4011]] — Account Item creation on cart operations

---

## 1. Overview

**Purpose:** Singleton service classes that manage shared state across all e-commerce LWCs. Single source of truth for user/account data, cart state, and utility functions.

**Target Users:** Internal (consumed by other LWCs)

---

## 2. Features

### userDataService
- Singleton — single instance shared across all LWCs
- Initializes: user, account, pricelist items, promotions, filter options, order history
- Caches data with 5-minute timeout
- Dual pub/sub: LMS (primary) + direct callbacks (fallback)
- Exposes: `getUserData()`, `getPricelistData()`, `getPromotionsData()`, `getFilterData()`, `getAllData()`
- Seeds `Contact_Notification__c` on initialization
- Stores `warehouseCutoffTime` from `Account.Fulfilled_From__r.Warehouse_Cutoff_Time__c`

### draftInvoiceService
- Singleton — manages draft invoice (cart) state
- Operations: initialize, add/update item, bulk add, clear all, update fields, confirm
- Handles split invoices via subtype-to-invoice routing
- Fire-and-forget post-confirm: `fixEcomOrderNames`, `sendOrderConfirmation`
- Dual pub/sub via `DraftInvoiceChannel` LMS

### Account Item Sync (BMS-4011)
Keeps `Account_Item__c` records in sync with cart operations. Fires as fire-and-forget — cart operations succeed even if Account Item creation fails.

**Logic (`CartController.createAccountItem`):**
- If no `Account_Item__c` exists for the item + account → **create** with `Active__c = true`, `Sequence__c = MAX + 1`
- If exists but `Active__c = false` → **reactivate** (`Active__c = true`, `Sequence__c` updated)
- If exists and already active → **no-op**

**Where it fires:**

| Call Site | Trigger |
|---|---|
| `addOrUpdateInvoiceItem()` | New item added to cart (Shop, Product, Cart pages) |
| `addMultipleItems()` | Bulk add from Reorder Modal |

**Why:** Downstream features like Update Invoice depend on `Account_Item__c` records existing for the customer's products. Without them, Update Invoice breaks after ECOM orders.

### cartService (Legacy)
- Wrapper around older cart operations
- Scheduled for deprecation/LMS migration

### c/utils
- `sanitizeSearchInput()` — normalizes smart quotes, em dashes, non-breaking spaces

---

## 3. Known Issues & Workarounds
- `enableTestingMode()` in userDataService uses hardcoded IDs for Experience Builder preview
- `cartService` is legacy — new components should use `draftInvoiceService`

---

## 4. Backend Notes

| Apex Method | Service | Description |
|---|---|---|
| `CartController.getUserInstance` | userDataService | Current user + contact |
| `CartController.getRecordAndFields` | userDataService | Account fields including warehouse cutoff |
| `EcomWrappers.initializeDraftInvoice` | draftInvoiceService | Create/fetch draft |
| `EcomWrappers.confirmDrafts_ECOM` | draftInvoiceService | Confirm draft → New status |
| `CartController.fixEcomOrderNames` | draftInvoiceService | Post-confirm name fix |
| `CartController.createAccountItem` | draftInvoiceService | Create/reactivate Account_Item__c on cart add |

---

## 5. Changelog

| Date | Ticket | Change |
|---|---|---|
| 2026-04 | BMS-4048 | Added `c/utils` with `sanitizeSearchInput()` |
| 2026-04 | BMS-4072 | `userDataService` stores `warehouseCutoffTime` from Location |
| 2026-04 | BMS-4011 | Account Item creation/reactivation on cart add and bulk reorder |
