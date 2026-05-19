---
date: 2026-05-12
related: service-locator-pattern.md, Big Kahuna - E-Commerce Enablement.md
status: in-progress
tags: [ecom, ohfy-split, data-model, package-architecture]
---


# May 12 — Re-classifying ecom field extensions as core (Data-Model)

## Context

As part of the OHFY-eCommerce / OHFY-eCommerce-UI split (folding the standalone `OHFY-Ecom` package into the OHFY-Split mono-repo), every ecom-added custom field on a shared object initially moved to `OHFY-eCommerce/objects/<obj>/fields/` under the **"ecom owns its data model"** stance. That stance maximizes domain cohesion at the cost of field discoverability (engineers querying `Invoice__c` have to grep both `OHFY-Data-Model` and `OHFY-eCommerce`).

Today's revision: walk the list field by field and reclassify the ones that are **actually shared / core** to live in `OHFY-Data-Model`, leaving only the genuinely ecom-specific extensions in `OHFY-eCommerce`.

## Decision criterion

A field is **core** (lives in `OHFY-Data-Model`) when:
- Multiple domains read or write it (OMS for invoicing, WMS for picking, etc., not just the storefront)
- The data is a regulatory / compliance / catalog attribute of the underlying object, independent of storefront usage
- Removing OHFY-eCommerce from a customer's install footprint should NOT erase the field

A field is **ecom-specific** (stays in `OHFY-eCommerce`) when:
- Only the storefront reads/writes it
- The data is a storefront preference, a notification opt-in, or an ecom-originated flag
- An OMS/WMS-only customer never installs OHFY-eCommerce and never needs the field

## Moves applied today (7 fields → OHFY-Data-Model)

| Field                                  | New location                                  | Why core                                                                                                                                                                                     |
| -------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Account.State_License_Number__c`      | `OHFY-Data-Model/objects/Account/fields/`     | Regulatory attribute of the customer account — used in BOL generation, distributor reporting, OMS invoicing compliance. Not storefront-only.                                                 |
| `Account.Alcohol_License_Required__c`  | `OHFY-Data-Model/objects/Account/fields/`     | Compliance flag — gates which orders the OMS will let leave the warehouse. Storefront also checks it, but it's an OMS-domain rule.                                                           |
| `Item__c.ATF_1__c`                     | `OHFY-Data-Model/objects/Item__c/fields/`     | "Above The Fold" product display text. Used wherever a product is rendered — storefront, OMS-UI inventory pages, possibly REX displays. Catalog attribute, not storefront preference.        |
| `Item__c.ATF_2__c`                     | same                                          | same                                                                                                                                                                                         |
| `Item__c.ATF_3__c`                     | same                                          | same                                                                                                                                                                                         |
| `Item__c.ATF_4__c`                     | same                                          | same                                                                                                                                                                                         |
| `Location__c.Warehouse_Cutoff_Time__c` | `OHFY-Data-Model/objects/Location__c/fields/` | Warehouse logistics — drives delivery scheduling in OMS, picking cutoffs in WMS. Storefront reads it too (to show "order by X for next-day delivery"), but it's a warehouse-domain property. |

## Fields that REMAIN in OHFY-eCommerce (genuinely ecom-specific)

| Field | Why ecom-specific |
|---|---|
| `Account.ECOM_Minimum_Case_Quantity__c` | Per-account override of the storefront minimum case quantity. Only the ecom cart enforces this. |
| `Contact.SMS_Opt_In__c` | SMS marketing opt-in — captured during storefront registration. Drives ecom abandoned-cart / delivery-cutoff SMS dispatch. |
| `Contact.SMS_Opt_In_Date__c` | Audit trail for the SMS opt-in. Same scope. |
| `Invoice__c.E_Commerce__c` | Boolean flag identifying invoices that originated from the storefront vs. OMS-direct. Storefront sets it on creation; consumers of this flag are ecom-specific (abandoned-cart batch, ecom order-confirmation flow). |
| `Invoice__c.Sales_Rep_Email__c` | Cached rep contact info shown in storefront-rendered order receipts. Only the ecom receipt template reads it. |
| `Invoice__c.Sales_Rep_Phone__c` | Same as above. |
| `Item_Type__c.Description__c` | Storefront category description (long-form blurb shown on the category browse page). Not used by OMS/WMS. |

## Ecom-owned custom objects (unchanged from yesterday's plan)

These remain in `OHFY-eCommerce/objects/` since they don't exist outside the storefront domain:

- `Notification__c` — notification templates / config
- `Notification_Log__c` — audit log of sent emails/SMS
- `Contact_Notification__c` — junction: which contacts opted into which notifications
- `Ecom_Branding__mdt` — branding asset map (resource key → static resource name) + 23 records
- `Configuration_Preference` records (3): `EcomMinimumCaseQuantity`, `EcommerceShowQuantityAvailable`, `ecomOrderRepNotificationTemplate`

## What this changes for engineers

**Before today's moves**, to see every field on `Invoice__c`, you had to grep:
- `OHFY-Data-Model/objects/Invoice__c/fields/`
- `OHFY-eCommerce/objects/Invoice__c/fields/`

**After today's moves**, `Invoice__c` still has fields in both folders (because `E_Commerce__c`, `Sales_Rep_Email__c`, `Sales_Rep_Phone__c` are legitimately ecom-only). But `Account.State_License_Number__c` and the `Item__c.ATF_*` series now live in their canonical Data-Model home, where most engineers expect to find catalog/customer attributes.

The split-folder reality remains a tax for `Invoice__c`, `Contact`, `Account` (the three objects that legitimately have ecom-specific fields) — but it's now the *minimum* tax, not the *full* tax.

## Standard to apply going forward

When adding a new field on a shared object (`Account`, `Contact`, `Invoice__c`, `Item__c`, `Location__c`, etc.):

1. Ask: **does any non-ecom domain (OMS / WMS / REX) need this field?**
   - Yes → `OHFY-Data-Model/objects/<obj>/fields/`
   - No → `OHFY-eCommerce/objects/<obj>/fields/`

2. Ask: **is this regulatory, catalog, or core-attribute data?**
   - Yes → `OHFY-Data-Model` regardless of who's consuming it today
   - No (UX preference, marketing flag, etc.) → wherever the consumer lives

3. **Default toward Data-Model when in doubt.** Pulling a field out of Data-Model later (because it turned out to be domain-specific) is easier than pulling it out of a domain package later (because it turned out to be needed elsewhere) — Salesforce treats cross-package field migrations as delete+recreate, which loses data.

This is informal guidance for now — worth promoting to a standards doc (`docs/engineering/standards/`) once the pattern is settled across a few more iterations.

## Open questions

- **`ECOM_Minimum_Case_Quantity__c` on Account** — does OMS ever need to know an account's storefront minimum? Today: no. If OMS ever wants to honor that minimum for direct sales (rep-entered orders for the same customer), this field migrates to Data-Model. Leaving in ecom for now.
- **`Invoice__c.E_Commerce__c`** — flag identifying invoices that came from the storefront. Trivially could be useful to OMS reporting ("how many invoices originated from ecom this month"). Defer the decision until someone actually queries it from OMS code.

## Apex function inventory (OHFY-eCommerce) + cross-package duplicate audit

Cross-referenced every `public static` / `global static` method in OHFY-eCommerce against OHFY-Utilities, OHFY-PLTFM, OHFY-OMS, OHFY-WMS by name and (where ambiguous) by body inspection. The result tells us which CartController/EcomWrappers/EcomConfigurationPreferenceMDT methods are **copies of canonical functions living elsewhere** vs. **genuinely ecom-specific**.

### Detection method

For each ecom method `Foo.bar(...)`, grep all other package source trees for a matching `public static`/`global static` declaration with the same name. Matches found go through a second pass — body inspection — to confirm whether the implementations are equivalent (true duplicate) or merely share a name (collision).

### Summary

47 production methods in OHFY-eCommerce. **17 are copies** of canonical functions that live in OHFY-Utilities (5), OHFY-PLTFM (2), or OHFY-OMS (10). **1 is a name collision** (different signature/semantics). **29 are genuinely ecom-specific.**

### Copies from OHFY-Utilities (5)

These should route to the OHFY-Utilities canonicals — the dependency edge already exists (eCommerce → Utilities, Tier 3 → Tier 0). Cleanup is trivial: replace the ecom copy's body with a delegation call. Or delete the ecom copy entirely and have `Ecom_UI_Wrappers` call the canonical directly.

✅ Done In Ecom_UI_Wrappers

| Ecom method                                                                  | OHFY-Utilities canonical                     | Notes                       |
| ---------------------------------------------------------------------------- | -------------------------------------------- | --------------------------- |
| `CartController.getFilteredRecords(objectName, fields, filter)`              | `U_ObjectUtility.getFilteredRecords`         | Generic SOQL builder        |
| `CartController.getRecordsByMultipleFields(objectName, fields, criteriaMap)` | `U_ObjectUtility.getRecordsByMultipleFields` | Generic SOQL builder        |
| `CartController.getRecordAndFields(recordId, objectName, fields)`            | `U_ObjectUtility.getRecordAndFields`         | Generic single-record fetch |
| `CartController.getGroupedSumByDate(...)`                                    | `U_ObjectUtility.getGroupedSumByDate`        | Aggregate SOQL              |
| `CartController.getUserInstance(fields)`                                     | `U_UserUtil.getUserInstance`                 | Current-user fetch          |



### Copies from OHFY-PLTFM (2 — whole class is a clone)

`EcomConfigurationPreferenceMDT` is essentially `E_ConfigurationPreferenceMDT` (in OHFY-PLTFM) with a different class name. Same body, same SOQL, same test-mode bypass logic. There's no reason for the ecom variant to exist beyond legacy package-isolation choices made when ecom was a standalone repo.


✅ Easy change i think

| Ecom method | OHFY-PLTFM canonical | Notes |
|---|---|---|
| `EcomConfigurationPreferenceMDT.getMetadataActiveStatus(key)` | `E_ConfigurationPreferenceMDT.getMetadataActiveStatus` | Full body duplicate |
| `EcomConfigurationPreferenceMDT.getMetadataValue(key)` | `E_ConfigurationPreferenceMDT.getMetadataValue` | Same |
| `CartController.getMetadataActiveStatus(key)` | (same canonical via `EcomConfigurationPreferenceMDT`) | Second-hop duplicate — CartController delegates to the ecom variant, which itself duplicates the PLTFM canonical |

**Recommended cleanup:** delete `EcomConfigurationPreferenceMDT` entirely. Route `Ecom_UI_Wrappers.getMetadataActiveStatus` and any internal ecom caller directly at `E_ConfigurationPreferenceMDT.getMetadataActiveStatus`. Delete `CartController.getMetadataActiveStatus`. Saves ~80 lines.

### Copies from OHFY-OMS (10)

These are the methods that drive the **cross-Tier-3 dependency** discussed in [[service-locator-pattern]] under "Applying the pattern to OHFY-eCommerce". They're the migration targets for **BMS-BBBB**. Either route through `ServiceLocator.resolve(...)` (preserves tier symmetry) or accept the hard dep.

| Ecom method                                                            | OHFY-OMS canonical                                            | Used where                                 |
| ---------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------ |
| `EcomWrappers.initializeDraftInvoice(...)`                             | `DraftInvoiceController.initializeDraftInvoice`               | Storefront cart bootstrap                  |
| `EcomWrappers.initializeDraftInvoice_Ecom(...)`                        | `DraftInvoiceController.initializeDraftInvoice` (variant)     | Same — ecom flag set                       |
| `EcomWrappers.onInvoiceItemChange(...)`                                | `DraftInvoiceController.onInvoiceItemChange`                  | Add/edit cart item                         |
| `EcomWrappers.updateDraftInvoice(...)`                                 | `DraftInvoiceController.updateDraftInvoice`                   | Cart-level field updates                   |
| `EcomWrappers.confirmDrafts(...)`                                      | `DraftInvoiceController.confirmDrafts`                        | Place order                                |
| `EcomWrappers.confirmDrafts_ECOM(...)`                                 | `DraftInvoiceController.confirmDrafts` (variant)              | Same — ecom flag set                       |
| `CartController.createAccountItem(...)`                                | `DraftInvoiceController.createAccountItem`                    | First-time-buy item creation               |
| `CartController.checkLockedDelivery(routeIds, deliveryDate)`           | `E_Delivery_Items.checkLockedDelivery`                        | Locked-delivery gate before adding to cart |
| `CartController.getNextAvailableDeliveryDate(routeIds, deliveryDate)`  | `E_Delivery_Items.getNextAvailableDeliveryDate`               | Soonest-delivery lookup                    |
| `CartController.getQuantityAvailableAtFulfillmentLocation(locationId)` | `E_Invoicing_Items.getQuantityAvailableAtFulfillmentLocation` | Stock visibility in cart UI                |
| `CartController.getTerritoryExclusions(territoryId)`                   | `E_Invoicing_Items.getTerritoryExclusions`                    | Pricelist territory filtering              |
| `CartController.setDeliveryMessage(recId)`                             | `E_Invoicing_TableMessages.setDeliveryMessage`                | Order summary message                      |

(That's 12 entries; the count of 10 above is the distinct canonical methods — initializeDraftInvoice and confirmDrafts each have an "_Ecom"/"_ECOM" variant that's the same canonical.)

### Copies from OHFY-WMS

**None found.** Despite the user-flagged hypothesis ("functions copied from OMS, WMS"), no ecom method directly mirrors a WMS canonical. `getQuantityAvailableAtFulfillmentLocation` is the closest candidate conceptually (inventory query) but the canonical lives in OMS's `E_Invoicing_Items`, not in WMS. Either WMS doesn't expose its inventory query as a same-named static, or the ecom team did its inventory lookup against the OMS invoice-side function instead of the WMS canonical.

Worth a follow-up grep when refactoring `getQuantityAvailableAtFulfillmentLocation` — there may be a true canonical inside WMS (e.g., `S_Inventory.getStockAtLocation` or similar) that's more appropriate than the OMS executable.

### Name collision (not a copy)

| Ecom method | Looks like | Reality |
|---|---|---|
| `UpdateContactController.updateContact(Contact) → Contact` | `E_SalesRepHome.updateContact(...) → String` (OMS) | **Different signatures and return types.** OMS's `updateContact` is a sales-rep-home utility that takes positional args and returns a status string; ecom's takes a full Contact sObject and returns the updated Contact. Same name, different semantics. Not a refactor target. |

### Genuinely ecom-specific (29 methods — keep)

The remainder. Either they implement storefront-specific business logic, route to ecom-specific objects (Notification__c, Cart__c-era methods, Ecom_Branding__mdt), or are thin LWC adapters with no upstream counterpart.

**CartController.cls (12 remaining after removing the 7 copies above):**
- `addDraftItems`, `clearDraftItems` — ecom-specific draft-invoice mutations (route to DraftInvoiceController DTOs, but the method-level semantics are ecom UX)
- `confirmDraftsWithBackorder` — ecom variant of `confirmDrafts` that allows backorder
- `fixEcomOrderNames` — ecom invoice name normalization
- `getBrands(priceListItems)` — pricelist-item → brand lookup; no OMS counterpart found
- `getCurrentUserId` — thin `UserInfo.getUserId()` wrapper; not really worth a canonical
- `getFilesForProduct(productId)` — ContentVersion query for product images
- `getItemIdToPromotionsMap(...)` — ecom promotion matrix; no OMS counterpart found
- `getMinimumCaseQuantity(accountId)` — ecom-only minimum enforcement
- `getOrderConfirmation(recordId, sObjectName)` — ecom invoice retrieval for confirmation page
- `getPromotionCriteriaQuantities(...)` — ecom promotion math; no OMS counterpart found
- `getPromotionJunctions(promoIds)` — ecom promotion join; no OMS counterpart found

| Method                                        | Why it stays in CartController (no canonical OMS counterpart)                                                             |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `addDraftItems`                               | Ecom-specific draft-invoice mutation — routes to `DraftInvoiceController` DTOs, but method-level semantics are ecom UX    |
| `clearDraftItems`                             | Ecom-specific draft-invoice mutation — routes to `DraftInvoiceController` DTOs, but method-level semantics are ecom UX    |
| `confirmDraftsWithBackorder`                  | Ecom variant of `confirmDrafts` that allows backorder                                                                     |
| `fixEcomOrderNames`                           | Ecom invoice name normalization                                                                                           |
| `getBrands(priceListItems)`                   | Pricelist-item → brand lookup; no OMS counterpart found -> it should be E_Invoicing_Items.getBrandsForItems(itemTypeIds); |
| `getCurrentUserId`                            | Thin `UserInfo.getUserId()` wrapper; not worth a canonical                                                                |
| `getFilesForProduct(productId)`               | `ContentVersion` query for product images                                                                                 |
| `getItemIdToPromotionsMap(...)`               | Ecom promotion matrix; no OMS counterpart found                                                                           |
| `getMinimumCaseQuantity(accountId)`           | Ecom-only minimum enforcement                                                                                             |
| `getOrderConfirmation(recordId, sObjectName)` | Ecom invoice retrieval for confirmation page                                                                              |
| `getPromotionCriteriaQuantities(...)`         | Ecom promotion math; no OMS counterpart found                                                                             |
| `getPromotionJunctions(promoIds)`             | Ecom promotion join; no OMS counterpart found                                                                             |

**EcomBrandingController.cls (3) — all ecom-only (Ecom_Branding__mdt is ecom-owned)**

**EcomWrappers.cls (0 remaining — all 6 methods route to OMS)**

**NotificationPreferenceController.cls (3) — all ecom-only (Notification__c is ecom-owned)**

**OrderConfirmationService.cls (1) — `sendOrderConfirmation` is ecom-only (uses ecom notification objects)**

**OrderHistoryController.cls (3) — all ecom-only (storefront order-history view)**

**RegisterController.cls (3) — all ecom-only (storefront self-registration)**

**UpdateContactController.cls (1) — ecom-only (storefront profile edit)**

**GetNonEcomDraftInvoiceGroups.cls (1) — `getInvoiceGroups` is Flow-invocable, ecom-specific naming**

### Action items implied by the audit

1. **OHFY-Utilities passthroughs (5 methods, ~15 min)** — pure mechanical cleanup. Delete the 5 CartController copies, route `Ecom_UI_Wrappers` directly at `U_ObjectUtility.*` and `U_UserUtil.getUserInstance`. Zero risk (Utilities is Tier 0, already a dep).

2. **OHFY-PLTFM ConfigPref consolidation (2 methods + whole class, ~30 min)** — delete `EcomConfigurationPreferenceMDT` entirely. Route ecom callers and the `Ecom_UI_Wrappers` passthrough at `E_ConfigurationPreferenceMDT` in PLTFM. PLTFM is already a dep. Saves ~80 lines and removes the hardest-to-spot duplication.

3. **OHFY-OMS soft-dep refactor (12 methods, ~11 hours)** — this is **BMS-BBBB** as scoped in [[service-locator-pattern]]. Define `IDraftInvoiceService` + `IDeliveryHelperService` + `IInvoiceQueryService` interfaces in OHFY-Service-Locator, move the relevant DTOs from OHFY-OMS to OHFY-PLTFM, OMS implements the interfaces, ecom resolves them via `ServiceLocator.resolve(...)`. Removes the cross-Tier-3 dep entirely.

Items 1 and 2 are **independent of BMS-BBBB** and can ship in this same split PR if scope allows — they don't touch the cross-Tier-3 edge, they just eliminate same-tier and lower-tier duplications.

## Pending TODOs

Captured at commit time (2026-05-12). Ordered by when they need to happen.

### Before pushing this branch to origin

These are blockers for CI / package version creation, not for local work.

- [ ] **Replace 2 alias placeholders in `sfdx-project.json`** with real `0Ho...` IDs returned by `sf package create`. Local commit is fine — the placeholders fail loud, not silent. But don't push until they're real, or CI will choke on the unresolved aliases.
  ```bash
  cd /Users/alvarosanchez_1/OHFY-Split
  sf package create --name OHFY-eCommerce    --packagetype Unlocked --path OHFY-eCommerce/force-app    -v <DEV_HUB>
  sf package create --name OHFY-eCommerce-UI --packagetype Unlocked --path OHFY-eCommerce-UI/force-app -v <DEV_HUB>
  ```
  Then edit `sfdx-project.json` → `packageAliases`, replacing `TODO_RUN_sf_package_create_OHFY-eCommerce` and `TODO_RUN_sf_package_create_OHFY-eCommerce-UI` with the new `0Ho...` IDs.

- [ ] (Optional) Decide whether to stub out the Twilio hardcoded `ACCOUNT_SID` + `FROM_NUMBER` constants in `OHFY-PLTFM/.../classes/services/notifications/TwilioSMSService.cls` (lines 27, 31) before pushing. Pre-existing values, not technically secret, but a known cleanup item (BMS-ZZZZ).

### Pre-PR validation gates

Run from the repo root before opening the PR. See repo-level `CLAUDE.md` → "Pre-PR Checks" for the canonical list.

- [ ] `npm run prettier:verify` — almost certainly needs `npm run prettier` first (the moved ecom files predate the OHFY-Split prettier config)
- [ ] `npm run lint`
- [ ] `npm test` — runs all LWC Jest tests across the mono-repo
- [ ] `sf project deploy validate -d <pkg>/force-app -o <alias> -l RunSpecifiedTests -t "<tests>" -w 30` for each touched package (see `service-locator-pattern.md` § CI/CD setup checklist for the per-package test selection)
- [ ] Full-stack scratch-org deploy: `bash utilityScripts/claim-dev.sh -a ecom-split-test && npm run deploy:full -- --target-org ecom-split-test`
- [ ] Manual UI smoke in the deployed Experience Cloud site: `/shop`, cart, checkout, order history, profile, notifications. Verify Twilio SMS still fires (NamedCred now resolves from PLTFM, not the old ecom package).
- [ ] Playwright e2e: `cd test-automation && npm run test:playwright:chromium -- tests/ecom/`
- [ ] Release the claimed org when done: `npm run org:release -- ecom-split-test` (prompt user first per repo convention)

### Quick wins available BEFORE BMS-BBBB (no soft-dep refactor needed)

These remove duplication that lives in lower-tier packages we already depend on — independent of the cross-Tier-3 OMS edge.

- [x] **OHFY-Utilities passthroughs** ✅ done 2026-05-12 — 5 CartController copies deleted (`getFilteredRecords`, `getRecordsByMultipleFields`, `getRecordAndFields`, `getGroupedSumByDate`, `getUserInstance`). `Ecom_UI_Wrappers` now routes directly at `U_ObjectUtility.*` and `U_UserUtil.getUserInstance`, matching the OMS-UI / WMS-UI / PLTFM-UI convention. CartController shrunk by 117 lines; CartController_T trimmed by 76 lines (6 tests removed). `getFilteredRecords` wrapper bumped to `@AuraEnabled(cacheable=true)` to match the canonical.
- [x] **OHFY-PLTFM ConfigPref consolidation** ✅ done 2026-05-12 — `EcomConfigurationPreferenceMDT.cls` + `_T` deleted entirely (production class + tests, 4 files, ~130 lines). `CartController.getMetadataActiveStatus` (2nd-hop wrapper) deleted; `CartController.getMinimumCaseQuantity` rewired at `E_ConfigurationPreferenceMDT.getMetadataActiveStatus` / `getMetadataValue` directly. `OrderConfirmationService` (2 call sites) and `Ecom_UI_Wrappers.getMetadataActiveStatus` rerouted at the PLTFM canonical. `EcomConfigurationPreferenceTestSetup.applyDefaults()` rewritten to seed `E_ConfigurationPreferenceTestSetup.configPreferences` (via `@TestVisible`) with the 3 ecom keys — preserves the test seeding pattern but feeds the canonical's map. Test files (`CartController_T`, `OrderConfirmationService_T`, `EcomConfigurationPreferenceTestSetup_T`) updated to reference the canonical's map. Net change: +74 / −385 = 311 net lines removed.

### Follow-up tickets (separate PRs)

| Ticket | What | Estimated effort |
|---|---|---|
| **BMS-XXXX** | Migrate `c/pubsub` consumers (`navigationMenu`, `ecomOrderHistory`, `ecomHomeBody`, `cartService`) to Lightning Message Service via existing `DraftInvoiceChannel` / `UserDataChannel`. Then delete `lwc/pubsub/` and `lwc/cartService/`. Critical: `navigationMenu` cart badge must keep working — subscribe directly to `DraftInvoiceChannel`. | 4-6 hours |
| **BMS-YYYY** | Rename `CartController` to something accurate (`Ecom_DraftInvoice_Helpers` or similar) or split into focused classes. Cart__c / Cart_Item__c are already deleted; only the misnomer remains. | 2-3 hours |
| **BMS-ZZZZ** | Move `TwilioSMSService.cls` hardcoded `ACCOUNT_SID` + `FROM_NUMBER` to a new `Twilio_Settings__mdt` Custom Metadata Type so different orgs can self-configure. | 2 hours |
| **BMS-AAAA** | Apex duplicate cleanup — execute the "Utilities passthroughs" + "PLTFM ConfigPref consolidation" quick wins above if not done in this PR. | 1 hour |
| **BMS-BBBB** | ✅ done 2026-05-12 — soft-dep refactor landed. 4 DTOs moved from OHFY-OMS → OHFY-Service-Locator (`DraftInvoiceDTO`, `ConfirmDraftDTO`, `InvoiceItemDTO`, `InvoiceItem` helper + their `_T` tests). 3 interfaces created in `OHFY-Service-Locator/.../serviceInterfaces/{invoice,delivery}/` (`DraftInvoiceService`, `DeliveryHelperService`, `InvoiceQueryService`). 3 impl classes in `OHFY-OMS/.../services/{invoice,delivery}/` (`DraftInvoiceServiceImpl`, `DeliveryHelperServiceImpl`, `InvoiceQueryServiceImpl`). 3 `Service_Configuration__mdt` records added to OHFY-OMS. `EcomWrappers` rewritten as ServiceLocator delegators (6 methods). CartController's 6 inline duplicates (`createAccountItem`, `checkLockedDelivery`, `getNextAvailableDeliveryDate`, `getQuantityAvailableAtFulfillmentLocation`, `getTerritoryExclusions`, `setDeliveryMessage`) deleted and replaced with thin ServiceLocator delegators. `Ecom_UI_Wrappers` + `draftInvoiceService.js` updated to drop `pricelistId` from `initializeDraftInvoice` (matched the 4-arg canonical — pre-existing signature bug fixed). **OHFY-OMS dropped from OHFY-eCommerce + OHFY-eCommerce-UI dependencies in `sfdx-project.json`** — cross-Tier-3 edge eliminated. Net diff: 52 file changes (21 modified/deleted, 31 new), ~1,960 net lines removed. |

### Outstanding judgment calls (not blockers)

- [ ] `Account.ECOM_Minimum_Case_Quantity__c` — leave in ecom or promote to Data-Model? Depends on whether OMS ever needs to honor the storefront minimum for rep-entered orders.
- [ ] `Invoice__c.E_Commerce__c` — leave in ecom or promote to Data-Model? Depends on whether OMS reporting ever wants to filter by storefront origin.
- [ ] `test-automation/setup/auth.ecom.setup.ts` vs. global `auth.setup.ts` — reconcile or keep both? Currently both exist side-by-side.
- [ ] `_archive/OHFY-eCommerce-pre-split-2026-05-10/` (4.5G on disk, gitignored) — delete when comfortable.

## Related work

- Backend split: `OHFY-Split/_archive/OHFY-eCommerce-pre-split-2026-05-10/` (gitignored) holds the pre-split source for reference
- Pattern handoff to Bryson: [[service-locator-pattern]] — covers the full architecture context + CI/CD setup
- Follow-up tickets filed: BMS-XXXX, BMS-YYYY, BMS-ZZZZ, BMS-AAAA, BMS-BBBB (see Pending TODOs above for scope of each)