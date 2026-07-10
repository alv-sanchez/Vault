# LWC Desktop/Mobile Duplication — Service Layer Proposal

## Problem

Several LWC components exist as near-identical desktop and mobile variants. Both variants import the same Apex methods, contain the same business logic (offline sync, reconciliation, drift checks, async queue management), and only differ in template layout. When a bug is fixed or feature is added (e.g., the offline sync work in PR #764), the same ~530 lines must be hand-ported to both files. This doubles maintenance effort and guarantees drift over time.

## Duplicated LWC Pairs

### Pair 1: `createInvoice` / `createInvoiceMobile` (OHFY-Split)

| | Desktop | Mobile |
|---|---|---|
| **Path** | `OHFY-OMS-UI/.../lwc/createInvoice/` | `OHFY-OMS-UI/.../lwc/createInvoiceMobile/` |
| **Lines** | 4,205 | 4,786 |
| **Apex imports** | 31 (all from `OMS_UI_Wrappers`) | 32 (same 31 + `getHistoricalInvoiceItems`) |
| **Shared imports** | 31 of 31 desktop imports are also in mobile | |

This is the highest-value refactor target. Nearly every Apex call, every handler method, every state-management function is duplicated. The only structural difference is the HTML template and one extra Apex import on mobile.

### Pair 2: `orderTable_Distro` / `orderTable_Distro_Mobile` (OHFY-Core)

| | Desktop | Mobile |
|---|---|---|
| **Path** | `force-app/.../lwc/orderTable_Distro/` | `force-app/.../lwc/orderTable_Distro_Mobile/` |
| **Lines** | ~4,400+ | ~4,800+ |
| **Shared logic** | Offline sync, reconciliation, drift checks, replay dedup, snapshot persistence — all identical |

This is the pair that triggered the observation (PR #764 added ~530 identical lines to both). Same pattern as Pair 1 — shared Apex imports, shared business logic, different templates.

### Non-duplicated pairs (parent-child pattern, no action needed)

These mobile components are lightweight presentational cards that receive data via `@api` props. No shared business logic to extract.

- `driverHomePage` (9,377 lines) -> `driverMobileRouteStopCard` (681 lines, 0 Apex imports)
- `salesRepHomePage` (7,724 lines) -> `salesRepMobileRouteStopCard` (354 lines, 0 Apex imports)

## Proposed Architecture: Shared Service Module

Extract shared Apex callout wrappers and business logic into a plain JavaScript ES module that both desktop and mobile LWCs import. LWC supports `import { fn } from 'c/moduleName'` for shared JS within the same namespace.

```
BEFORE (current — duplicated)
========================================

  createInvoice.js              createInvoiceMobile.js
  ┌─────────────────┐           ┌─────────────────────┐
  │ import Apex x31 │           │ import Apex x32     │
  │                 │           │                     │
  │ onInvoiceItem() │           │ onInvoiceItem()     │  <-- same logic
  │ onRetailInv()   │           │ onRetailInv()       │  <-- same logic
  │ onCreditItem()  │           │ onCreditItem()      │  <-- same logic
  │ reconcile()     │           │ reconcile()         │  <-- same logic
  │ offlineSnap()   │           │ offlineSnap()       │  <-- same logic
  │ replayDedup()   │           │ replayDedup()       │  <-- same logic
  │ driftChecks()   │           │ driftChecks()       │  <-- same logic
  │ drainQueue()    │           │ drainQueue()        │  <-- same logic
  │                 │           │                     │
  │ DESKTOP HTML    │           │ MOBILE HTML         │  <-- only real difference
  └─────────────────┘           └─────────────────────┘


AFTER (proposed — shared service)
========================================

  invoiceService.js (new shared module)
  ┌─────────────────────────────────────┐
  │ import Apex x32                     │
  │                                     │
  │ export onInvoiceItemChange(...)     │
  │ export onRetailInventoryChange(...) │
  │ export onCreditItemChange(...)      │
  │ export reconcileBeforeSubmit(...)   │
  │ export persistOfflineSnapshot(...)  │
  │ export restoreOfflineSnapshot(...)  │
  │ export enqueueReplayInvoiceItem()   │
  │ export enqueueReplayRetailInv()     │
  │ export enqueueReplayCredit()        │
  │ export invoiceItemDrifted(...)      │
  │ export creditDrifted(...)           │
  │ export retailInventoryDrifted(...)  │
  │ export numericDiffers(...)          │
  │ export drainAsyncQueue(...)         │
  │ export collectDbInvoiceItems(...)   │
  │ export isEmptyOrderQuantity(...)    │
  └──────────────┬──────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
  createInvoice.js   createInvoiceMobile.js
  ┌───────────────┐  ┌───────────────────┐
  │ import {      │  │ import {          │
  │   reconcile,  │  │   reconcile,      │
  │   onItem,     │  │   onItem,         │
  │   ...         │  │   ...             │
  │ } from        │  │ } from            │
  │ 'c/invoiceSvc'│  │ 'c/invoiceSvc'   │
  │               │  │                   │
  │ DESKTOP HTML  │  │ MOBILE HTML       │
  │ UI handlers   │  │ UI handlers       │
  │ (thin)        │  │ (thin)            │
  └───────────────┘  └───────────────────┘
```

## What goes in the service vs. stays in the component

| Layer | Lives in | Examples |
|---|---|---|
| Apex callout wrappers | `invoiceService.js` | `onInvoiceItemChange`, `confirmDrafts`, `initializeDraftInvoice` |
| Business logic | `invoiceService.js` | Reconciliation, drift checks, offline snapshot, replay dedup, async queue drain |
| State (dirty sets, flags) | Component instance | `_dirtyInvoiceItemIds`, `_isRehydrating`, `itemList` — passed to service functions as args |
| Template bindings | Component | `get isRehydrating()`, `handleQuantityChange()` |
| HTML layout | Component `.html` | Desktop vs. mobile markup |

The service functions are pure — they take state as input and return results. They don't own `this`. The component owns its reactive state and calls service functions when needed.

## Functions to extract (from PR #764 alone)

These are the ~530 lines duplicated across both files in the offline sync PR:

| Function | Purpose | Lines (approx) |
|---|---|---|
| `reconcileBeforeSubmit()` | Pre-submit client-vs-DB diff and replay | ~70 |
| `_drainAsyncQueue()` | Poll until async queue is empty | ~5 |
| `_collectDbInvoiceItems()` | Parse DB snapshot into item lookup map | ~15 |
| `_collectDbCreditsByCreditId()` | Parse DB snapshot into credit lookup map | ~8 |
| `_invoiceItemDrifted()` | Compare client item quantities to DB | ~20 |
| `_retailInventoryDrifted()` | Compare client retail inventory to DB | ~15 |
| `_creditDrifted()` | Compare client credit to DB | ~15 |
| `_numericDiffers()` | Null-safe numeric comparison | ~5 |
| `_persistOfflineSnapshot()` | Debounced write to sessionStorage | ~55 |
| `_hasPendingOfflineSnapshot()` | Check if snapshot exists for this customer | ~12 |
| `_isEmptyOrderQuantity()` | Check if all qty fields are zero | ~10 |
| `_enqueueReplayInvoiceItem()` | Deduped replay for invoice item edits | ~15 |
| `_enqueueReplayRetailInventory()` | Deduped replay for retail inventory edits | ~25 |
| `_enqueueReplayCredit()` | Deduped replay for credit edits | ~15 |
| `_restoreOfflineSnapshotIfAvailable()` | Restore from sessionStorage on remount | ~80 |

## Impact

- **Bug fixes land once.** The `_creditDrifted` field-name question from the PR #764 review (`quantity` vs `creditQuantity`) — if that's a bug, it currently needs to be fixed in two places. With a shared service, one fix covers both.
- **New features (like offline sync) are written once** and both form factors get them by importing the updated function.
- **Reduces combined JS by ~500+ lines** per shared feature added.
- **Applies to both repos** — same pattern works for OHFY-Core's `orderTable_Distro` pair and OHFY-Split's `createInvoice` pair.

## LWC constraint

LWC modules (`c/moduleName`) must be their own component folder with a `.js` file. The service module would be:

```
lwc/
  invoiceService/
    invoiceService.js    <-- exports only, no HTML template
```

No `.html` file = it's a pure JS module, not a renderable component. Both `createInvoice` and `createInvoiceMobile` import from it. This is a supported LWC pattern.
