# Service Locator Pattern in OHFY-Split

How OMS, WMS, and REX call each other across package boundaries without taking a hard (compile-time) dependency.

## The problem it solves

The tier graph from the repo root `CLAUDE.md`:

```
Tier 3: OMS, WMS, REX   ← parallel, cannot depend on each other
   ↓
Tier 4: OMS-UI, WMS-UI, REX-UI
```

OMS, WMS, and REX are deliberately **siblings, not parents/children of each other**. OMS cannot `import` REX classes or vice versa — the package manifests don't declare those dependencies, and adding one would force every customer who installs OMS to also install REX.

But the business doesn't respect those boundaries. When an OMS invoice is updated, REX goals tied to that invoice need to recalculate. OMS code has to **call** REX code without **depending on** REX code. Service Locator is how.

> **Note on "hard dependencies":** Service Locator's whole point is that there is **no** hard (compile-time) dependency between OMS and REX. The dependency is **resolved at runtime** via metadata. If REX is uninstalled, the metadata row is gone, `resolve()` throws, and OMS keeps running for everything else.
>
> Salesforce 2GP managed packages can't break a dependency cycle the way a microservice would (events, message bus). Service Locator is the Apex-native workaround: a Tier 1 "shared interfaces" package that both siblings know about, plus a metadata table that wires interface → implementation at runtime.

## The four moving pieces

```
┌─────────────────────────────────────────────────────────────────┐
│  Tier 1: OHFY-Service-Locator                                   │
│                                                                 │
│   • ServiceLocator.cls          ← the resolver                  │
│   • InvoiceREXTriggerService    ← the interface (a "contract")  │
│   • DeliveryUpdaterService      ← another interface             │
│   • ...                                                         │
└─────────────────────────────────────────────────────────────────┘
                ▲                                ▲
                │ implements                     │ calls resolve()
                │                                │
┌───────────────┴────────────┐   ┌───────────────┴────────────────┐
│  Tier 3: OHFY-REX          │   │  Tier 3: OHFY-OMS              │
│                            │   │                                │
│   InvoiceTriggerMethods_REX│   │   InvoiceAfterUpdate           │
│   implements               │   │     .updateGoals(...)          │
│     InvoiceREXTriggerService│  │   ↓ calls                      │
│                            │   │   ServiceLocator.resolve(      │
│   + a CustomMetadata row   │   │     'InvoiceREXTriggerService' │
│     that registers it      │   │   )                            │
└────────────────────────────┘   └────────────────────────────────┘
```

## The cross-package call, end to end (Invoice → Goals)

### Step 1 — The interface (Tier 1, OHFY-Service-Locator)

`OHFY-Service-Locator/.../serviceInterfaces/triggerMethods/invoice/InvoiceREXTriggerService.cls:1`

```apex
@namespaceAccessible
public interface InvoiceREXTriggerService {
    void createGoalInvoices(List<Invoice__c> invoices);
    void deleteGoalInvoices(List<Invoice__c> invoices);
    void updateGoals(List<Invoice__c> newInvoices, List<Invoice__c> oldInvoices);
}
```

This is the **contract**. Both OMS and REX depend on Service-Locator (Tier 1), so both can see this interface. Neither has to know about the other.

### Step 2 — The implementation (Tier 3, OHFY-REX)

`OHFY-REX/.../classes/triggerMethods/invoice/InvoiceTriggerMethods_REX.cls:9`

```apex
@NamespaceAccessible
public with sharing class InvoiceTriggerMethods_REX implements InvoiceREXTriggerService {

    @NamespaceAccessible
    public void createGoalInvoices(List<Invoice__c> invoices) { ... }

    @NamespaceAccessible
    public void updateGoals(List<Invoice__c> newInvoices, List<Invoice__c> oldInvoices) { ... }
}
```

REX writes the actual goal-recalculation logic and declares that it satisfies the interface.

### Step 3 — The wiring (Tier 3, OHFY-REX, custom metadata)

`OHFY-REX/.../customMetadata/serviceConfiguration/Service_Configuration.Invoice_REX_Trigger_Service.md-meta.xml`

```xml
<CustomMetadata ...>
    <label>Invoice REX Trigger Service</label>
    <values>
        <field>Interface_Name__c</field>
        <value xsi:type="xsd:string">InvoiceREXTriggerService</value>
    </values>
    <values>
        <field>Implementation_Class__c</field>
        <value xsi:type="xsd:string">InvoiceTriggerMethods_REX</value>
    </values>
</CustomMetadata>
```

A single `Service_Configuration__mdt` record. It says: *"When anyone asks for `InvoiceREXTriggerService`, instantiate `InvoiceTriggerMethods_REX`."* Crucially, **REX ships this record**, not OMS — REX is the package that owns the implementation, so REX brings the wiring with it.

### Step 4 — The call site (Tier 3, OHFY-OMS)

`OHFY-OMS/.../classes/triggerServices/invoice/triggerMethods/InvoiceAfterUpdate.cls:41`

```apex
@NamespaceAccessible
public static void updateGoals(List<Invoice__c> newInvoices, List<Invoice__c> oldInvoices) {
    ctx.pushContext(
        ContextManager.SourceSystem.TRIGGER_ENUM,
        ContextManager.OperationType.UPDATE_ENUM,
        'Invoice - Update Goals (AU)'
    );

    ((InvoiceRexTriggerService) ServiceLocator.resolve('InvoiceREXTriggerService'))
        .updateGoals(newInvoices, oldInvoices);
}
```

That one line is the entire cross-package call. Decompose it:

1. `ServiceLocator.resolve('InvoiceREXTriggerService')` — string lookup (no `import REX...`)
2. `(InvoiceRexTriggerService) ...` — cast to the interface (both packages see this type)
3. `.updateGoals(...)` — virtual dispatch lands in REX's implementation

### Step 5 — What `ServiceLocator.resolve` actually does

`OHFY-Service-Locator/.../ServiceLocator.cls:48`

```apex
public static Object resolve(String serviceName) {
    if (serviceCache.containsKey(serviceName)) {
        return serviceCache.get(serviceName);          // ① cached?
    }
    List<Service_Configuration__mdt> configs = getServiceConfig(serviceName);  // ② query MDT
    if (configs == null || configs.isEmpty() || String.isBlank(configs[0].Implementation_Class__c)) {
        throw new ServiceLocatorException(...);         // ③ misconfig → fail loud
    }
    Type implicitType = Type.forName(config.Implementation_Class__c);          // ④ reflection
    Object service = implicitType.newInstance();
    serviceCache.put(serviceName, service);
    return service;
}
```

`Type.forName(...)` is the trick. It resolves the class **by string at runtime**, bypassing the compile-time symbol table. That's why OMS can compile without REX present.

## Same shape, other directions

| Caller package | Interface (lives in Service-Locator) | Impl class | Impl package |
|---|---|---|---|
| OMS | `InvoiceREXTriggerService` | `InvoiceTriggerMethods_REX` | **REX** |
| OMS (Invoice/ACTG) | `InvoiceACTGTriggerService` | (accounting impl) | **OMS-Accounting** |
| OMS (Delivery) | `DeliveryUpdaterService` (`Service_Configuration.Delivery_Updater_Service_OMS`) | OMS impl | **OMS** |
| WMS | `DeliveryUpdaterService` (`Service_Configuration.Delivery_Updater_Service_WMS`) | WMS impl | **WMS** |
| REX, ACTG triggers on shared objects | `Account_OMS_Trigger_Service`, `Credit_ACTG_Trigger_Service`, `Event_REX_Trigger_Service`, `Task_REX_Trigger_Service` | per package | OMS / REX |

The naming convention `{Object}{Package}TriggerService` is consistent: *"trigger logic for `{Object}` that belongs to `{Package}`'s domain."* When the trigger fires in the package that owns the sObject, it calls each downstream package's logic through Service Locator.

## Subtleties worth knowing

- **The `DeliveryUpdaterService` row is the most interesting case**: both OMS *and* WMS each register their own implementation of the same interface. Because `Service_Configuration__mdt` records can be `protected` and live in different packages, each install's behavior is shaped by **which packages are installed**. Install OMS only → OMS's updater runs. Install both → whichever package's MDT record loads last "wins" (Salesforce loads them deterministically, but in practice this pattern is reserved for cases where only one will be active per org).

- **Caching is per-transaction, not per-org**: `serviceCache` is a static `Map`, which in Apex means "lives for the duration of one execution context." So a Service Locator call inside a bulk trigger only pays the MDT query cost once across all the trigger methods in that transaction — but the next user request starts fresh. This is exactly the right trade-off for Salesforce (governor-limit aware, no stale-class risk after a deploy).

- **The `(InvoiceRexTriggerService)` cast at the call site is doing more than satisfying the compiler** — it's the *only* type-safety check between the two packages. If a future REX change breaks the interface contract (e.g., removes `updateGoals`), nothing fails at deploy time in OMS; you get a runtime `ClassCastException` or method-not-found error the first time the trigger fires. That's why the interface in Service-Locator is functionally an **API contract** between sibling packages, and breaking changes to it deserve the same care as a public API.

## What this gets you

1. **OMS and REX deploy independently.** Either can ship without the other being present.
2. **Customers buy modules à la carte.** An OMS-only customer never installs REX; `ServiceLocator.resolve('InvoiceREXTriggerService')` would throw, but the trigger method is also gated off via `Trigger_Configuration__mdt.Bypass__c` for that org. Both layers of metadata cooperate.
3. **Bypass without code deploys.** Disabling the cross-package call is a metadata edit (`Bypass__c = true`), not a hotfix branch.
4. **No managed-package version lockstep.** OMS v1.40 can call REX v1.12 or v1.13 as long as the interface didn't change.

---

# Applying the pattern to OHFY-eCommerce

## Context for Bryson — what's just landed

The standalone `OHFY-Ecom` package has been folded into the OHFY-Split mono-repo as **two new packages**:

| Package | Tier | Role |
|---|---|---|
| **OHFY-eCommerce** | 3 | Backend: ecom-specific Apex (notifications, abandoned-cart, draft-invoice helpers, the legacy `CartController`), ecom objects (Notification, Notification_Log, Contact_Notification), field extensions on Account/Contact/Invoice__c/Location__c/Item__c/Item_Type__c, `Ecom_Branding__mdt` + records, ecom Configuration_Preference records |
| **OHFY-eCommerce-UI** | 4 | UI: 24 LWCs, 28 static resources, 2 LMS message channels, `Ecom_UI_Wrappers.cls` (single 44-method `@AuraEnabled` facade) |

The pair mirrors the OMS/OMS-UI, WMS/WMS-UI, REX/REX-UI shape.

## The architectural debt we're carrying

OHFY-eCommerce currently has a **hard, compile-time dependency on OHFY-OMS** for:
- `DraftInvoiceController.initializeDraftInvoice(...)`, `.onInvoiceItemChange(...)`, `.updateDraftInvoice(...)`, `.confirmDrafts(...)`
- `InvoiceItem.toInvoiceItemSObject(...)`
- DTO types: `DraftInvoiceDTO`, `ConfirmDraftDTO`, `InvoiceItemDTO`

This is the **first cross-Tier-3 dependency in the repo**. OMS, WMS, and REX have always been mutually independent. OHFY-eCommerce → OHFY-OMS is a new precedent that should be reverted to soft-dep via the Service Locator pattern before this graph gets baked into anyone's mental model.

The soft-dep migration is filed as **BMS-BBBB** — own ticket, own PR, separate from the split work. It's not blocking. But it should happen in the next sprint or two.

## The soft-dep migration plan (BMS-BBBB)

Following the exact same shape as the OMS↔REX `InvoiceREXTriggerService` example above:

```
┌─────────────────────────────────────────────────────────────────┐
│  Tier 1: OHFY-Service-Locator                                   │
│   • IDraftInvoiceService          ← NEW interface               │
└─────────────────────────────────────────────────────────────────┘
                ▲                              ▲
                │ implements                   │ calls resolve()
                │                              │
┌───────────────┴────────────┐   ┌─────────────┴──────────────────┐
│  Tier 3: OHFY-OMS          │   │  Tier 3: OHFY-eCommerce        │
│                            │   │                                │
│   DraftInvoiceServiceImpl  │   │   EcomWrappers.cls             │
│   implements               │   │   CartController.cls           │
│     IDraftInvoiceService   │   │                                │
│                            │   │   ↓ calls                      │
│   Delegates to existing    │   │   ServiceLocator.resolve(      │
│   DraftInvoiceController   │   │     'IDraftInvoiceService'     │
│   static methods           │   │   ).initializeDraftInvoice(...) │
│                            │   │                                │
│   + Service_Configuration  │   │                                │
│     CMDT record            │   │                                │
└────────────────────────────┘   └────────────────────────────────┘
```

### The DTO problem

Unlike the OMS↔REX case (which only exchanges `Invoice__c` SObjects and primitives), the eCommerce↔OMS surface area passes **custom DTO classes** (`DraftInvoiceDTO`, `ConfirmDraftDTO`, `InvoiceItemDTO`, `InvoiceItem`). The interface signature can't reference types defined in OHFY-OMS — or we're back to a hard dep.

**Resolution:** move the DTOs from `OHFY-OMS/.../classes/DTOs/invoice/` → `OHFY-PLTFM/.../classes/DTOs/invoice/` (or to OHFY-Service-Locator alongside the interface). PLTFM is shared infrastructure; both OMS and eCommerce already depend on it. The DTOs become a cross-domain contract.

This stretches ADR-0007's intent (which says "DTOs live in the domain package that owns them"). Worth a clarifying amendment: *"DTOs that are shared across multiple Tier-3 domains live in OHFY-PLTFM."* The invoice DTOs qualify.

### File-level work for BMS-BBBB

| Step | Files |
|---|---|
| 1. Define interface | New: `OHFY-Service-Locator/.../classes/serviceInterfaces/invoice/IDraftInvoiceService.cls` |
| 2. Move DTOs to PLTFM | Move `OHFY-OMS/.../classes/DTOs/invoice/{DraftInvoiceDTO,ConfirmDraftDTO,InvoiceItemDTO}.cls` → `OHFY-PLTFM/.../classes/DTOs/invoice/` |
| 3. Move InvoiceItem helper | `OHFY-OMS/.../classes/DTOs/invoice/InvoiceItem.cls` → same target |
| 4. OMS impl class | New: `OHFY-OMS/.../classes/services/invoice/DraftInvoiceServiceImpl.cls` — `@namespaceAccessible global class DraftInvoiceServiceImpl implements IDraftInvoiceService` — delegates to existing `DraftInvoiceController` static methods |
| 5. CMDT wiring | New: `OHFY-OMS/.../customMetadata/serviceConfiguration/Service_Configuration.Draft_Invoice_Service.md-meta.xml` |
| 6. Refactor eCommerce callers | `OHFY-eCommerce/.../classes/controllers/invoice/EcomWrappers.cls` (6 methods) — replace `DraftInvoiceController.xxx(...)` with `((IDraftInvoiceService) ServiceLocator.resolve('IDraftInvoiceService')).xxx(...)` |
| 7. Same for CartController | `OHFY-eCommerce/.../classes/controllers/legacy/CartController.cls` — `addDraftItems`, `createAccountItem`, `confirmDraftsWithBackorder`, `clearDraftItems` reference `InvoiceItem.toInvoiceItemSObject` and the DTOs. Rewire similarly. |
| 8. Drop OHFY-OMS dependency | `sfdx-project.json` → `OHFY-eCommerce` packageDirectory `dependencies` array: remove the `OHFY-OMS` entry |
| 9. OMS-UI / WMS-UI / REX-UI adjust | DTO imports continue to work (they pick up PLTFM transitively) but `*_UI_Wrappers.cls` method signatures now reference PLTFM-located types — re-verify each |

**Estimated effort:** ~11 hours engineering + ~2 hours validation.

---

# CI/CD setup checklist (Bryson)

## What's new in the package matrix

You go from 11 packages to **13 packages**. Two new entries in `sfdx-project.json`:

```json
{
  "path": "OHFY-eCommerce/force-app",
  "package": "OHFY-eCommerce",
  "versionName": "ver 0.1",
  "versionNumber": "0.1.0.NEXT",
  "default": false,
  "dependencies": [
    { "package": "OHFY-Data-Model",     "versionNumber": "0.3.0.LATEST" },
    { "package": "OHFY-Utilities",      "versionNumber": "0.6.0.LATEST" },
    { "package": "OHFY-Service-Locator","versionNumber": "0.4.0.LATEST" },
    { "package": "OHFY-PLTFM",          "versionNumber": "0.10.0.LATEST" },
    { "package": "OHFY-OMS",            "versionNumber": "0.4.0.LATEST" }  // ← removed in BMS-BBBB
  ]
},
{
  "path": "OHFY-eCommerce-UI/force-app",
  "package": "OHFY-eCommerce-UI",
  "versionName": "ver 0.1",
  "versionNumber": "0.1.0.NEXT",
  "default": false,
  "dependencies": [
    { "package": "OHFY-Data-Model",     "versionNumber": "0.3.0.LATEST" },
    { "package": "OHFY-Utilities",      "versionNumber": "0.6.0.LATEST" },
    { "package": "OHFY-Service-Locator","versionNumber": "0.4.0.LATEST" },
    { "package": "OHFY-PLTFM",          "versionNumber": "0.10.0.LATEST" },
    { "package": "OHFY-OMS",            "versionNumber": "0.4.0.LATEST" },
    { "package": "OHFY-eCommerce",      "versionNumber": "0.1.0.LATEST" }
  ]
}
```

`packageAliases` has two `TODO_RUN_sf_package_create_*` placeholders that need real `0Ho...` IDs — see step 1 below.

## One-time setup

### 1. Create the two package aliases on the Dev Hub

```bash
sf package create --name OHFY-eCommerce    --packagetype Unlocked --path OHFY-eCommerce/force-app    -v <DEV_HUB>
sf package create --name OHFY-eCommerce-UI --packagetype Unlocked --path OHFY-eCommerce-UI/force-app -v <DEV_HUB>
```

Replace the placeholders in `OHFY-Split/sfdx-project.json` → `packageAliases`:

```json
"OHFY-eCommerce":    "0Ho...",        // ← from `sf package create` output
"OHFY-eCommerce-UI": "0Ho..."         // ← same
```

### 2. Per-package CI deploy entries

The CI pipeline (whatever's configured for the other packages) needs two new entries for `OHFY-eCommerce/force-app` and `OHFY-eCommerce-UI/force-app`. The tier order matters because of dependencies:

```
0. OHFY-Data-Model
0. OHFY-Utilities                       (parallel with Data-Model)
1. OHFY-Service-Locator                 (depends on tier 0)
2. OHFY-PLTFM                           (depends on tier 1)
3. OHFY-OMS / OHFY-WMS / OHFY-REX       (parallel, depend on tier 2)
3. OHFY-eCommerce                       (depends on tier 2 + OMS — until BMS-BBBB drops the OMS dep)
4. OHFY-OMS-UI / OHFY-WMS-UI / OHFY-REX-UI / OHFY-PLTFM-UI / OHFY-eCommerce-UI (parallel, depend on tier 3)
```

### 3. Apex test selection per package

For each pre-PR validation, the relevant `_T` classes to run are:

| Package | Test classes |
|---|---|
| OHFY-PLTFM | `TwilioSMSService_T` (in addition to existing PLTFM tests) |
| OHFY-eCommerce | `OrderConfirmationService_T`, `AbandonedCartReminderBatch_T`, `AbandonedCartReminderScheduler_T`, `EcomConfigurationPreferenceMDT_T`, `EcomConfigurationPreferenceTestSetup_T`, `CartController_T`, `GetNonEcomDraftInvoiceGroups_T`, `OrderHistoryController_T`, `UpdateContactController_T`, `RegisterController_T`, `EcomBrandingController_T`, `NotificationPreferenceController_T` |
| OHFY-eCommerce-UI | (no Apex tests yet — `Ecom_UI_Wrappers` is a thin facade; consider adding wrapper-level smoke tests as a follow-up) |

### 4. Deploy validation per package

The existing pattern (`sf project deploy validate -d <pkg>/force-app -o <alias> -l RunSpecifiedTests -t "<tests>" -w 30`) extends naturally:

```bash
sf project deploy validate -d OHFY-eCommerce/force-app    -o <alias> -l RunSpecifiedTests \
  -t "OrderConfirmationService_T,AbandonedCartReminderBatch_T,AbandonedCartReminderScheduler_T,EcomConfigurationPreferenceMDT_T,EcomConfigurationPreferenceTestSetup_T,CartController_T,GetNonEcomDraftInvoiceGroups_T,OrderHistoryController_T,UpdateContactController_T,RegisterController_T,EcomBrandingController_T,NotificationPreferenceController_T" \
  -w 30

sf project deploy validate -d OHFY-eCommerce-UI/force-app -o <alias> -l NoTestRun -w 30
```

### 5. Scratch-org pool sizing

Adding 2 packages increases full-stack deploy time meaningfully (deploy validation in particular). If the org pool is currently sized for 11 packages, watch for queue depth after this lands. Consider increasing pool size or splitting full-stack and per-package deploy paths.

### 6. Playwright e2e tests

Storefront e2e specs moved to `test-automation/tests/ecom/` (5 specs + ecom-specific fixtures under `test-automation/support/ecom/`). They run from the existing `test-automation/playwright.config.ts` — same harness as `oms/`, `wms/`, `pltfm/`. The pre-existing CI playwright entry should pick them up automatically if it globs `tests/**/*.spec.ts`.

There's also `test-automation/setup/auth.ecom.setup.ts` that lives next to the global `auth.setup.ts`. Decide whether to consolidate them; not blocking.

### 7. Org-metadata namespace-prefix rule

`OHFY-eCommerce` doesn't ship any FlexiPages / layouts / tabs yet (those came over with the LWCs, which are in OHFY-eCommerce-UI). But once ecom-specific layouts get added, the `org-metadata/managed/` vs `org-metadata/scratch/` namespace-prefix rule (see repo root `CLAUDE.md`) applies the same way it does for other packages.

## Known issues / follow-ups already filed

| Ticket       | What                                                                                                                                                                                                                                                                                                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BMS-XXXX** | Migrate `c/pubsub` consumers (`navigationMenu`, `ecomOrderHistory`, `ecomHomeBody`, `cartService`) to Lightning Message Service via existing `DraftInvoiceChannel` / `UserDataChannel`. Then delete `lwc/pubsub/` and `lwc/cartService/`. Cart-badge UX must keep working — `navigationMenu` needs to subscribe to `DraftInvoiceChannel` directly.                                 |
| **BMS-YYYY** | (Partially done) `Cart__c` / `Cart_Item__c` objects already deleted. `CartController.cls` already trimmed of cart-touching methods. Remaining: rename `CartController` to something accurate (`Ecom_DraftInvoice_Helpers` or similar), or split into focused classes.                                                                                                              |
| **BMS-ZZZZ** | `TwilioSMSService.cls` has hardcoded `ACCOUNT_SID` (`ACe4c6b5fa...`) and `FROM_NUMBER` (`+18665475424`). Move both to a `Twilio_Settings__mdt` Custom Metadata Type so different orgs can self-configure.                                                                                                                                                                          |
| **BMS-AAAA** | The "copied OMS/WMS functions" cleanup: `CartController` has ~10 generic SOQL helpers (`getFilteredRecords`, `getRecordsByMultipleFields`, `getRecordAndFields`, `getGroupedSumByDate`, ...) that duplicate `U_ObjectUtility` in OHFY-Utilities. Route the wrapper at the canonicals; delete the ecom copies. LWC imports don't change because they go through `Ecom_UI_Wrappers`. |
| **BMS-BBBB** | The soft-dep refactor described above (eCommerce → OMS via `IDraftInvoiceService` + `ServiceLocator`).                                                                                                                                                                                                                                                                             |

## Quick reference: where things live now

```
OHFY-eCommerce/force-app/main/default/
├── classes/
│   ├── controllers/              # 5 controllers (Order, Update, Register, Branding, Notification — all @namespaceAccessible)
│   ├── controllers/invoice/      # EcomWrappers — wraps DraftInvoiceController (target of BMS-BBBB soft-dep)
│   ├── controllers/legacy/       # CartController — legacy facade, mostly draft-invoice helpers + SOQL passthroughs
│   ├── batchJobs/notifications/  # AbandonedCart Batch + Scheduler
│   ├── services/notifications/   # OrderConfirmationService
│   ├── services/configuration/   # EcomConfigurationPreferenceMDT + TestSetup
│   └── executables/invoice/      # GetNonEcomDraftInvoiceGroups (Flow-invocable)
├── objects/
│   ├── Notification__c/                  # owned
│   ├── Notification_Log__c/              # owned
│   ├── Contact_Notification__c/          # owned
│   ├── Ecom_Branding__mdt/               # owned
│   ├── Account/fields/                   # ecom-added fields on shared Account
│   ├── Contact/fields/                   # ecom-added fields on shared Contact
│   ├── Invoice__c/fields/                # ecom-added fields on Invoice__c (defined in OHFY-Data-Model)
│   ├── Location__c/fields/               # ecom-added field on Location__c
│   ├── Item__c/fields/                   # ATF_1..4 on Item__c
│   └── Item_Type__c/fields/              # Description on Item_Type__c
└── customMetadata/
    ├── configurationPreferences/         # 3 ecom Configuration_Preference records
    └── ecomBranding/                     # 23 Ecom_Branding records (resource_key → static_resource_name)

OHFY-eCommerce-UI/force-app/main/default/
├── classes/
│   └── Ecom_UI_Wrappers.cls              # single facade — 44 @AuraEnabled methods, all delegate to OHFY-eCommerce
├── lwc/                                  # 24 storefront components
├── staticresources/                      # 28 (Tailwind, branding assets, product images)
├── messageChannels/                      # DraftInvoiceChannel, UserDataChannel (LMS — LWC-only)
└── (no objects/ or customMetadata/ — backend metadata lives in OHFY-eCommerce)

OHFY-PLTFM/force-app/main/default/
├── namedCredentials/Twilio_Named_Cred.namedCredential-meta.xml
├── externalCredentials/Twilio_External_Cred.externalCredential-meta.xml
└── classes/services/notifications/TwilioSMSService.cls   # @namespaceAccessible — callable from OHFY-eCommerce

test-automation/
├── tests/ecom/                           # 5 storefront Playwright specs + CLAUDE.md + README.md
├── support/ecom/                         # cartFlow.ts, orgQuery.ts
└── setup/auth.ecom.setup.ts              # storefront auth setup (reconcile with global auth.setup.ts)

orgScripts/e-commerce/                    # 2 Apex utility scripts (seed-notifications, schedule-abandoned-cart-reminder)
docs/engineering/reference/ecom/          # NOTIFICATION_FRAMEWORK.md, TWILIO_SETUP.md, 19 BMS testing notes, legacy ecom docs
```

## What's *not* changed by this split

- All other packages (`OHFY-OMS`, `OHFY-WMS`, `OHFY-REX`, and their UI peers) are untouched in this PR
- Root `.gitignore`, `.forceignore` got minor adds (`_archive/`, `**/*.ts`, `**/tsconfig.json`)
- The deprecation markers on `lwc/pubsub/pubsub.js` and `lwc/cartService/cartService.js` remain — those LWCs are still active; they're flagged for BMS-XXXX removal

The pre-split `OHFY-eCommerce` standalone repo is archived in-place at `OHFY-Split/_archive/OHFY-eCommerce-pre-split-2026-05-10/` (gitignored). Delete when comfortable.



Big Note - post moving out DRAFTDTO out of oms

Ecom calls OMS via the bulletin board. OMS hands back a DraftInvoiceDTO. For ecom to open the package that OMS just handed it, **ecom needs the definition of what DraftInvoiceDTO** is. Right now that definition lives inside
   OMS — so to understand the response, ecom has to depend on OMS, which is exactly what we're trying to avoid.
  
  Move the definition somewhere both packages can see it without depending on each other.
  
  The REX example didn't have this problem because REX hands back List<Invoice__c> — and Invoice__c is a Salesforce object defined in Data-Model, which everyone already sees. No private vocabulary involved.
  
  Ecom's case involves four custom classes that OMS invented (DraftInvoiceDTO, ConfirmDraftDTO, InvoiceItemDTO, InvoiceItem). Those four need to relocate to a "shared dictionary" — most natural place is
  OHFY-Service-Locator (where the interfaces also live), since that's the package both ecom and OMS already depend on.
  
  That's the whole reason. The 5-arg vs 4-arg signature mismatch I found is a separate bug — orthogonal to the DTO move, but blocks me from writing the interface accurately until we resolve it.


  52 file changes total (21 modified/deleted + 31 new), distributed across 4 packages.

  What landed

| Phase | Package              | Change                                                                                                                |
| ----- | -------------------- | --------------------------------------------------------------------------------------------------------------------- |
| A     | OHFY-Service-Locator | +16 DTO files (4 DTOs × 4 files each) moved from OHFY-OMS                                                             |
| A     | OHFY-OMS             | −16 DTO files                                                                                                         |
| B     | OHFY-Service-Locator | +6 interface files (`DraftInvoiceService`, `DeliveryHelperService`, `InvoiceQueryService`)                            |
| C     | OHFY-OMS             | +6 impl class files (`DraftInvoiceServiceImpl`, `DeliveryHelperServiceImpl`, `InvoiceQueryServiceImpl`)               |
| D     | OHFY-OMS             | +3 `Service_Configuration__mdt` records                                                                               |
| E     | OHFY-eCommerce       | `EcomWrappers` rewritten as ServiceLocator delegators (6 methods, dropped `pricelistId` on `initializeDraftInvoice*`) |
| E     | OHFY-eCommerce       | `CartController`'s 6 inline OMS duplicates deleted, replaced with thin ServiceLocator delegators (−322 net lines)     |
| E     | OHFY-eCommerce-UI    | `Ecom_UI_Wrappers` + `draftInvoiceService.js` updated to drop `pricelistId`                                           |
| F     | `sfdx-project.json`  | OHFY-OMS removed from OHFY-eCommerce + OHFY-eCommerce-UI dependencies — the cross-Tier-3 edge is gone                 |

  Architectural state

  - Zero direct OMS class references in any OHFY-eCommerce or OHFY-eCommerce-UI Apex
  - OHFY-eCommerce depends on: Data-Model, Utilities, Service-Locator, PLTFM (NOT OMS)
  - OHFY-eCommerce-UI depends on: Data-Model, Utilities, Service-Locator, PLTFM, OHFY-eCommerce (NOT OMS directly)
  - Connection to OMS happens only at runtime via ServiceLocator.resolve('DraftInvoiceService' | 'DeliveryHelperService' | 'InvoiceQueryService') looking up the CMDT-registered impl class. If OMS is uninstalled, the
  resolve throws a clear ServiceLocatorException. Loud failure mode, no silent breakage.

  Pre-existing bug fixed in the process

  initializeDraftInvoice was being called by ecom with 5 args (including pricelistId) but the canonical only accepts 4. Per your decision, dropped pricelistId from the entire ecom chain (EcomWrappers, Ecom_UI_Wrappers,
  draftInvoiceService.js). Pricelist is now derived server-side from the customer record.
  