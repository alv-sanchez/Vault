---
date: 2026-05-12
related: service-locator-pattern.md, ✅ may12th-ECOM->SPLIT.md
status: done
tags: [ecom, ohfy-split, service-locator, soft-dep, bms-bbbb]
---

# Post OMS→OHFY-Service-Locator — soft-dep refactor rundown (BMS-BBBB)


## TL;DR

- **Before:** OHFY-eCommerce had a hard, compile-time dependency on OHFY-OMS. Ecom code called `DraftInvoiceController.initializeDraftInvoice(...)` directly. That dependency was the first cross-Tier-3 edge in the repo and broke the parallel-siblings invariant.
- **After:** OHFY-eCommerce resolves OMS services at runtime through `ServiceLocator.resolve('DraftInvoiceService')` etc. No compile-time reference to OMS. The OHFY-OMS line is gone from OHFY-eCommerce's `sfdx-project.json` dependencies. Tier-3 packages are siblings again.
- **Scope:** 52 file changes, ~1,960 net lines removed, 12 method call-sites virtualized.

## Visual — tier package model (post-BMS-BBBB)

Solid arrows = compile-time dependencies (declared in `sfdx-project.json`).
Dotted arrows = runtime-only soft dependencies resolved via `ServiceLocator.resolve(...)`.
★ marks anything new in BMS-BBBB.

```mermaid
flowchart TD
    classDef tier0 fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#000
    classDef tier1 fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px,color:#000
    classDef tier2 fill:#fff3e0,stroke:#ef6c00,stroke-width:2px,color:#000
    classDef tier3 fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#000
    classDef tier4 fill:#fce4ec,stroke:#c2185b,stroke-width:2px,color:#000
    classDef newpkg fill:#fff4e6,stroke:#e67e22,stroke-width:3px,color:#000

    %% ── Tier 0 ──
    DM["<b>OHFY-Data-Model</b> · Tier 0<br/>~100 sObjects + field extensions<br/>Configuration_Preference__mdt"]:::tier0
    U["<b>OHFY-Utilities</b> · Tier 0<br/>U_ObjectUtility · U_UserUtil<br/>U_ParseErrorMessage · TestDataFactory<br/>ExternalIdPopulator"]:::tier0

    %% ── Tier 1 ──
    SL["<b>OHFY-Service-Locator</b> · Tier 1<br/><br/><b>Resolver</b><br/>ServiceLocator.resolve(name) — bulletin board<br/><br/><b>Interfaces</b><br/>★ DraftInvoiceService (5 methods)<br/>★ DeliveryHelperService (2 methods)<br/>★ InvoiceQueryService (3 methods)<br/>InvoiceREXTriggerService<br/>InvoiceACTGTriggerService<br/>DeliveryUpdaterService · ...<br/><br/><b>DTOs (★ relocated here in BMS-BBBB)</b><br/>★ DraftInvoiceDTO · ConfirmDraftDTO<br/>★ InvoiceItemDTO · InvoiceItem helper"]:::tier1

    %% ── Tier 2 ──
    P["<b>OHFY-PLTFM</b> · Tier 2<br/>TriggerHandler · ObjectTriggerService<br/>ContextManager · QueryService<br/>E_ConfigurationPreferenceMDT<br/>TwilioSMSService (NamedCred + ExtCred)"]:::tier2

    %% ── Tier 3 ──
    OMS["<b>OHFY-OMS</b> · Tier 3<br/>DraftInvoiceController · E_Delivery_Items<br/>E_Invoicing_Items · E_Invoicing_TableMessages<br/>(Invoice / Allocation / Credit / Delivery)<br/><br/><b>★ Soft-dep impls (BMS-BBBB):</b><br/>★ DraftInvoiceServiceImpl<br/>★ DeliveryHelperServiceImpl<br/>★ InvoiceQueryServiceImpl<br/>★ 3 Service_Configuration__mdt records<br/><br/><b>Soft-dep impl for REX:</b><br/>InvoiceTriggerMethods_REX → InvoiceREXTriggerService"]:::tier3
    WMS["<b>OHFY-WMS</b> · Tier 3<br/>Purchase orders, picking,<br/>transfers, inventory receipts"]:::tier3
    REX["<b>OHFY-REX</b> · Tier 3<br/>Goals, incentives, display runs<br/><br/><b>Soft-dep impl for OMS:</b><br/>(REX-side trigger methods)"]:::tier3
    ECOM["<b>OHFY-eCommerce</b> · Tier 3 (NEW)<br/>EcomWrappers (ServiceLocator delegators)<br/>CartController (slimmed legacy)<br/>OrderConfirmationService<br/>AbandonedCartReminder{Batch,Scheduler}<br/>OrderHistoryController · RegisterController<br/>UpdateContactController · EcomBrandingController<br/>NotificationPreferenceController<br/>GetNonEcomDraftInvoiceGroups<br/><br/><b>Owned objects:</b><br/>Notification__c · Notification_Log__c<br/>Contact_Notification__c · Ecom_Branding__mdt<br/><br/><i>Consumer only — no service impls</i>"]:::newpkg

    %% ── Tier 4 ──
    PUI["<b>OHFY-PLTFM-UI</b> · Tier 4<br/>PLTFM_UI_Wrappers · LWCs"]:::tier4
    OUI["<b>OHFY-OMS-UI</b> · Tier 4<br/>OMS_UI_Wrappers · invoice / credits LWCs"]:::tier4
    WUI["<b>OHFY-WMS-UI</b> · Tier 4<br/>WMS_UI_Wrappers · picking / PO LWCs"]:::tier4
    RUI["<b>OHFY-REX-UI</b> · Tier 4<br/>REX_UI_Wrappers · goals / incentives LWCs"]:::tier4
    EUI["<b>OHFY-eCommerce-UI</b> · Tier 4 (NEW)<br/>Ecom_UI_Wrappers (44-method @AuraEnabled facade)<br/>24 storefront LWCs · 28 static resources<br/>2 LMS message channels<br/>Ecom_Branding__mdt records (23)"]:::newpkg

    %% ── Compile-time edges (solid) ──
    DM ==> SL
    U ==> SL
    SL ==> P
    P ==> OMS
    P ==> WMS
    P ==> REX
    P ==> ECOM
    P ==> PUI
    OMS ==> OUI
    WMS ==> WUI
    REX ==> RUI
    ECOM ==> EUI

    %% ── Runtime soft-dep edges (dotted) ──
    ECOM -. "★ Soft-dep (BMS-BBBB):<br/>resolve('DraftInvoiceService')<br/>resolve('DeliveryHelperService')<br/>resolve('InvoiceQueryService')" .-> OMS
    OMS -. "Soft-dep (pre-existing):<br/>resolve('InvoiceREXTriggerService')" .-> REX
```

## Visual — runtime call flow

What actually happens at runtime when `Ecom_UI_Wrappers.initializeDraftInvoice(...)` is called from an LWC. Note that **PLTFM never appears in this path** — it's just a compile-time tier dependency for the packages involved. The call routes through **Service-Locator** (the bulletin board).

```mermaid
sequenceDiagram
    autonumber
    participant LWC as Storefront LWC<br/>(ecomCartPage, etc.)
    participant UI as Ecom_UI_Wrappers<br/>(OHFY-eCommerce-UI)
    participant EW as EcomWrappers<br/>(OHFY-eCommerce)
    participant SL as ServiceLocator<br/>(OHFY-Service-Locator)
    participant CMDT as Service_Configuration__mdt<br/>(record shipped by OHFY-OMS)
    participant IMPL as DraftInvoiceServiceImpl<br/>(OHFY-OMS)
    participant DC as DraftInvoiceController<br/>(OHFY-OMS)

    LWC->>UI: initializeDraftInvoice(customerId, salesRepId, fulfillmentLocationId, dockSale)
    UI->>EW: EcomWrappers.initializeDraftInvoice(...)
    EW->>SL: resolve('DraftInvoiceService')

    alt cache miss
        SL->>CMDT: SELECT Implementation_Class__c FROM Service_Configuration__mdt<br/>WHERE Interface_Name__c = 'DraftInvoiceService'
        CMDT-->>SL: "DraftInvoiceServiceImpl"
        SL->>SL: Type.forName('DraftInvoiceServiceImpl').newInstance()
    else cache hit
        SL->>SL: return cached instance
    end

    SL-->>EW: instance (cast to DraftInvoiceService interface)
    EW->>IMPL: .initializeDraftInvoice(customerId, salesRepId, fulfillmentLocationId, dockSale)
    IMPL->>DC: DraftInvoiceController.initializeDraftInvoice(...)
    DC-->>IMPL: DraftInvoiceDTO
    IMPL-->>EW: DraftInvoiceDTO
    EW-->>UI: DraftInvoiceDTO
    UI-->>LWC: DraftInvoiceDTO (JSON-serialized to LWC)

    Note over LWC,DC: No compile-time edge between OHFY-eCommerce and OHFY-OMS.<br/>If OHFY-OMS is uninstalled, step 4 (CMDT query) returns 0 rows<br/>and ServiceLocator throws ServiceLocatorException. Loud failure mode.
```

## Visual — before vs. after (the cross-Tier-3 edge removed)

```mermaid
flowchart LR
    subgraph BEFORE["BEFORE (pre-BMS-BBBB)"]
        direction TB
        B_P["OHFY-PLTFM<br/>Tier 2"]
        B_OMS["OHFY-OMS<br/>Tier 3"]
        B_WMS["OHFY-WMS<br/>Tier 3"]
        B_REX["OHFY-REX<br/>Tier 3"]
        B_ECOM["OHFY-eCommerce<br/>Tier 3"]
        B_P ==> B_OMS
        B_P ==> B_WMS
        B_P ==> B_REX
        B_P ==> B_ECOM
        B_ECOM == "HARD cross-Tier-3<br/>(forbidden by tier model)" ==> B_OMS
    end

    subgraph AFTER["AFTER (post-BMS-BBBB)"]
        direction TB
        A_P["OHFY-PLTFM<br/>Tier 2"]
        A_OMS["OHFY-OMS<br/>Tier 3"]
        A_WMS["OHFY-WMS<br/>Tier 3"]
        A_REX["OHFY-REX<br/>Tier 3"]
        A_ECOM["OHFY-eCommerce<br/>Tier 3"]
        A_P ==> A_OMS
        A_P ==> A_WMS
        A_P ==> A_REX
        A_P ==> A_ECOM
        A_ECOM -. "SOFT-dep via<br/>ServiceLocator (runtime)" .-> A_OMS
    end

    classDef hard fill:#ffcdd2,stroke:#c62828,stroke-width:3px
    classDef soft fill:#c8e6c9,stroke:#2e7d32,stroke-width:3px
    class B_ECOM,B_OMS hard
    class A_ECOM,A_OMS soft
```

## Why we did this

1. **Architectural cleanliness.** OMS / WMS / REX have always been mutually independent at Tier 3. Adding OHFY-eCommerce as a Tier-3 package that *depended on* OMS would have created the first cross-Tier-3 edge and set a precedent that every future Tier-3 domain could build on top of an existing one — turning the parallel-siblings model into a tangled graph.
2. **Customer install footprint.** With soft-dep, an OHFY-eCommerce customer who doesn't also buy OHFY-OMS can install ecom alone. The runtime resolve will throw a clear `ServiceLocatorException` instead of compile-time failures. Easier to support "ecom-only" SKUs later.
3. **Swappable OMS implementation.** If a customer wants ecom but with a different invoice engine (custom rules, integration to NetSuite/SAP, etc.), they ship a different `DraftInvoiceService` implementation registered through the same `Service_Configuration__mdt` record. Ecom doesn't know or care which impl is wired up.
4. **Testability.** Tests can register mock impls without OMS being involved.

## Why Service-Locator, not PLTFM

The original plan (in [[service-locator-pattern]]) said "move DTOs to OHFY-PLTFM." That doesn't actually work because of tier mechanics:

- The 3 new interfaces (`DraftInvoiceService`, `DeliveryHelperService`, `InvoiceQueryService`) live in **OHFY-Service-Locator** (Tier 1) — that's where the existing pattern (`InvoiceREXTriggerService`, etc.) puts them.
- The interface method signatures reference `DraftInvoiceDTO`, `ConfirmDraftDTO`, `InvoiceItemDTO`. For the interface to compile, those types must be **visible to Service-Locator at compile time**.
- Service-Locator depends on Tier 0 only. It **cannot reference PLTFM types** (PLTFM is Tier 2, above Service-Locator). The dependency would be circular.
- Therefore the DTOs had to land **at Tier 0 or Tier 1** — Service-Locator (Tier 1) was chosen because the DTOs naturally co-locate with the interface contract that uses them.

This deviation from the original plan is the cleanest fix; the alternative was redefining all interface methods to return `Map<String, Object>` (losing type safety).

## What moved where

| Item                                                                                                              | From                                     | To                                                             | Phase |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------- | ----- |
| `DraftInvoiceDTO` + `_T`                                                                                          | `OHFY-OMS/.../classes/DTOs/invoice/`     | `OHFY-Service-Locator/.../classes/DTOs/invoice/`               | A     |
| `ConfirmDraftDTO` + `_T`                                                                                          | same                                     | same                                                           | A     |
| `InvoiceItemDTO` + `_T`                                                                                           | `OHFY-OMS/.../classes/DTOs/invoiceItem/` | `OHFY-Service-Locator/.../classes/DTOs/invoiceItem/`           | A     |
| `InvoiceItem` (helper) + `_T`                                                                                     | same                                     | same                                                           | A     |
| `DraftInvoiceService` interface (5 methods)                                                                       | — (new)                                  | `OHFY-Service-Locator/.../classes/serviceInterfaces/invoice/`  | B     |
| `DeliveryHelperService` interface (2 methods)                                                                     | — (new)                                  | `OHFY-Service-Locator/.../classes/serviceInterfaces/delivery/` | B     |
| `InvoiceQueryService` interface (3 methods)                                                                       | — (new)                                  | `OHFY-Service-Locator/.../classes/serviceInterfaces/invoice/`  | B     |
| `DraftInvoiceServiceImpl`                                                                                         | — (new)                                  | `OHFY-OMS/.../classes/services/invoice/`                       | C     |
| `DeliveryHelperServiceImpl`                                                                                       | — (new)                                  | `OHFY-OMS/.../classes/services/delivery/`                      | C     |
| `InvoiceQueryServiceImpl`                                                                                         | — (new)                                  | `OHFY-OMS/.../classes/services/invoice/`                       | C     |
| `Service_Configuration.Draft_Invoice_Service.md-meta.xml`                                                         | — (new)                                  | `OHFY-OMS/.../customMetadata/serviceConfiguration/`            | D     |
| `Service_Configuration.Delivery_Helper_Service.md-meta.xml`                                                       | — (new)                                  | same                                                           | D     |
| `Service_Configuration.Invoice_Query_Service.md-meta.xml`                                                         | — (new)                                  | same                                                           | D     |
| `EcomWrappers.cls` rewritten as ServiceLocator delegators                                                         | OHFY-eCommerce (in place)                | OHFY-eCommerce (in place)                                      | E     |
| `CartController.cls` — 6 inline duplicates deleted, replaced with thin ServiceLocator delegators (−322 net lines) | OHFY-eCommerce (in place)                | OHFY-eCommerce (in place)                                      | E     |
| `Ecom_UI_Wrappers.cls` — `pricelistId` arg dropped from `initializeDraftInvoice*`                                 | OHFY-eCommerce-UI (in place)             | OHFY-eCommerce-UI (in place)                                   | E     |
| `draftInvoiceService.js` — `pricelistId` arg dropped from `_fetchDraft()` call site                               | OHFY-eCommerce-UI (in place)             | OHFY-eCommerce-UI (in place)                                   | E     |
| `sfdx-project.json` — OHFY-OMS removed from both ecom packages' dependencies                                      | (root)                                   | (root, in place)                                               | F     |

## The 12 virtualized call-sites

These are now `((InterfaceName) ServiceLocator.resolve('InterfaceName')).method(...)` rather than direct OMS class references:

**Routed through `DraftInvoiceService` (7 methods):**
- `EcomWrappers.initializeDraftInvoice` → `DraftInvoiceController.initializeDraftInvoice`
- `EcomWrappers.initializeDraftInvoice_Ecom` → same canonical
- `EcomWrappers.onInvoiceItemChange` → `DraftInvoiceController.onInvoiceItemChange`
- `EcomWrappers.updateDraftInvoice` → `DraftInvoiceController.updateDraftInvoice`
- `EcomWrappers.confirmDrafts` → `DraftInvoiceController.confirmDrafts`
- `EcomWrappers.confirmDrafts_ECOM` → same canonical
- `CartController.createAccountItem` → `DraftInvoiceController.createAccountItem`

**Routed through `DeliveryHelperService` (2 methods):**
- `CartController.checkLockedDelivery` → `E_Delivery_Items.checkLockedDelivery`
- `CartController.getNextAvailableDeliveryDate` → `E_Delivery_Items.getNextAvailableDeliveryDate`

**Routed through `InvoiceQueryService` (3 methods):**
- `CartController.getQuantityAvailableAtFulfillmentLocation` → `E_Invoicing_Items.getQuantityAvailableAtFulfillmentLocation`
- `CartController.getTerritoryExclusions` → `E_Invoicing_Items.getTerritoryExclusions`
- `CartController.setDeliveryMessage` → `E_Invoicing_TableMessages.setDeliveryMessage`

## Pre-existing bug fixed in the process

`initializeDraftInvoice` was being called by ecom with **5 arguments** (including `pricelistId`), but the canonical `DraftInvoiceController.initializeDraftInvoice` only accepts **4 arguments** (no `pricelistId`). The ecom code wouldn't compile against the current OMS canonical.

Resolution applied: dropped `pricelistId` from the ecom call chain to match the 4-arg canonical. Pricelist is now derived server-side from the customer record. Affected files:
- `EcomWrappers.cls` — both `initializeDraftInvoice` and `initializeDraftInvoice_Ecom`
- `Ecom_UI_Wrappers.cls` — both LWC-facing methods
- `draftInvoiceService.js` — `_fetchDraft()` no longer passes `pricelistId`

## Outstanding — methods that should also go through the service locator

### `getBrands` — not yet virtualized

Originally classified as "no OMS counterpart found" during the duplicate audit. Re-classified as a copy after the user spotted the canonical:

| Ecom method | OHFY-OMS canonical | Used where |
|---|---|---|
| `CartController.getBrands(List<Pricelist_Item__c> priceListItems)` | `E_Invoicing_Items.getBrandsForItems(List<Id> itemTypeIds)` | Storefront brand-filter sidebar |

Signatures don't quite line up — ecom takes pricelist-item records, OMS takes pre-extracted item-type IDs. So this isn't a 1:1 delegation; the wrapper needs to extract `itemTypeIds` from the pricelist-item records first, then call the canonical.

**To wire this through the soft-dep pattern, three small edits:**

1. **Add method to `InvoiceQueryService` interface** in OHFY-Service-Locator:
   ```apex
   List<Item_Type__c> getBrandsForItems(List<Id> itemTypeIds);
   ```

2. **Add implementation to `InvoiceQueryServiceImpl`** in OHFY-OMS:
   ```apex
   @namespaceAccessible
   global List<Item_Type__c> getBrandsForItems(List<Id> itemTypeIds) {
       return E_Invoicing_Items.getBrandsForItems(itemTypeIds);
   }
   ```

3. **Rewire `CartController.getBrands`** to extract item-type IDs first, then resolve and delegate:
   ```apex
   @namespaceAccessible
   public static List<Item_Type__c> getBrands(List<Pricelist_Item__c> priceListItems) {
       List<Id> itemTypeIds = new List<Id>();
       for (Pricelist_Item__c pli : priceListItems) {
           if (pli.Item__r != null && pli.Item__r.Item_Type__c != null) {
               itemTypeIds.add(pli.Item__r.Item_Type__c);
           }
       }
       return ((InvoiceQueryService) ServiceLocator.resolve('InvoiceQueryService'))
           .getBrandsForItems(itemTypeIds);
   }
   ```

**Audit needed first:** confirm `E_Invoicing_Items.getBrandsForItems(itemTypeIds)` does the same `Item_Type__c` lookup that the ecom inline body currently does. If the canonical applies additional filters (active, deleted, etc.) that ecom doesn't apply (or vice versa), the semantics diverge and the ecom inline should stay.

**Effort estimate:** ~10 minutes once audited. Smallest possible "Phase E extension" to BMS-BBBB.

### Other CartController methods that weren't in BMS-BBBB scope

These were classified as "genuinely ecom-specific" in the original audit. Worth re-checking each for OMS counterparts in `E_Promotions`, `E_Invoicing_Items`, etc.:

- `getPromotionCriteriaQuantities(List<Id>, List<Id>)`
- `getPromotionJunctions(List<Id>)`
- `getItemIdToPromotionsMap(List<Id>, List<Id>, Map, List<Id>, Boolean)`
- `getOrderConfirmation(Id, String)`
- `fixEcomOrderNames(Id, String)`
- `getMinimumCaseQuantity(Id)` — uses `E_ConfigurationPreferenceMDT` (in PLTFM); already routes downstream correctly
- `addDraftItems(String, Id)` — uses `InvoiceItem.toInvoiceItemSObject` (now in Service-Locator); already correct
- `clearDraftItems(List<Id>)` — manipulates `Invoice_Item__c` directly via SOQL; no OMS class call

A grep pass against `E_Promotions`, `E_Invoice*`, and `E_Order*` would surface any hidden canonicals.

## Runtime mechanics (for review)

When `EcomWrappers.initializeDraftInvoice(...)` is called:

1. `ServiceLocator.resolve('DraftInvoiceService')` checks its in-memory cache.
2. Cache miss → query `Service_Configuration__mdt WHERE Interface_Name__c = 'DraftInvoiceService'` → finds the record we created in OHFY-OMS pointing at `DraftInvoiceServiceImpl`.
3. `Type.forName('DraftInvoiceServiceImpl').newInstance()` instantiates the impl at runtime. No compile-time reference.
4. Cast to `DraftInvoiceService` interface (compile-safe since both sides see the interface from Service-Locator).
5. Call `.initializeDraftInvoice(customerId, salesRepId, fulfillmentLocationId, dockSale)`.
6. The impl delegates to `DraftInvoiceController.initializeDraftInvoice(...)` — that part is OMS-internal.

**Caching:** `serviceCache` is a static `Map` — lives for the duration of a single Apex transaction (one request, one async job, one trigger context). Next transaction re-queries the CMDT. So the CMDT lookup cost is amortized per-transaction, not per-org.

**Test setup:** `ServiceLocator.isTest = false` by default → tests query the real CMDT. The CMDT records we created seed correctly during tests. No mock setup needed in `_T` classes unless they want to substitute a different impl.

## Verification checklist (before pushing this PR)

- [ ] `npm run prettier` then `npm run prettier:verify`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `sf project deploy validate -d OHFY-Service-Locator/force-app -o <alias> -l RunSpecifiedTests -t "DraftInvoiceDTO_T,ConfirmDraftDTO_T,InvoiceItemDTO_T,InvoiceItem_T,ServiceLocator_T" -w 30`
- [ ] `sf project deploy validate -d OHFY-OMS/force-app -o <alias> -l RunSpecifiedTests -t "DraftInvoiceController_T,E_Delivery_Items_T,E_Invoicing_Items_T" -w 30`
- [ ] `sf project deploy validate -d OHFY-eCommerce/force-app -o <alias> -l RunSpecifiedTests -t "EcomWrappers_T,CartController_T,OrderConfirmationService_T" -w 30` *(run whichever ecom `_T` classes do exist)*
- [ ] Full-stack scratch-org deploy: `bash utilityScripts/claim-dev.sh -a soft-dep-test && npm run deploy:full -- --target-org soft-dep-test`
- [ ] Smoke the storefront end-to-end: shop → cart → checkout (exercises 7+ of the 12 virtualized methods)

## Related notes

- [[service-locator-pattern]] — full pattern walkthrough, REX example, and OMS↔REX canonical case
- [[✅ may12th-ECOM->SPLIT]] — companion note covering the field-extension reclassification done the same day, plus the Apex duplicate audit that identified the 12 methods that ended up in BMS-BBBB scope
