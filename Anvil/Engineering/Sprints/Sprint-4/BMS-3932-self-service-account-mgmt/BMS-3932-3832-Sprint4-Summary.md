# BMS-3932 / BMS-3832: Sprint 4 Summary

**Generated:** 2026-06-08 | **Sprint:** 4 (Jun 1 - Jun 15) | **Assignee:** Alvaro Sanchez

---

## BMS-3932 — Self-Service Account Management (Address, Contacts)

**Status:** Backlog | **Type:** Story | **Epic:** BMS-4995 (REQ-068 Retailer Online Ordering Experience)

[Jira](https://ohanafy.atlassian.net/browse/BMS-3932)

### Summary

Gulf retailers (bars, restaurants, convenience stores) currently rely on phone/email to Gulf ops for every address change or contact update. With hundreds of on-premise accounts across FL and AL, this creates bottlenecks, delays deliveries, and introduces transcription errors. BMS-3932 builds a self-service portal UI where account contacts manage their own delivery addresses and contact details, with approval workflows for changes that impact routes or delivery zones.

### Impact

- **Hundreds of Gulf on-premise accounts** across FL and AL depend on manual ops processing today
- Every address change risks transcription errors into Route__c and Account data
- Address changes can trigger warehouse reassignment, route changes, and pricing code changes across distinct tax jurisdictions
- New retailer onboarding (e.g., 7-Eleven entering Florida) generates bulk data entry that currently falls on Gulf ops staff
- Addresses rep-to-account relationships that must be respected during changes

### Solution

1. **Self-service UI** — LWC components in Gulf's Experience Cloud portal for address editing and contact management
2. **Pending change workflow** — New `Account_Change_Request__c` object (must be created) to store pending changes with Status picklist (Pending/Approved/Rejected)
3. **Address validation** — Callout to USPS or Google Address Validation API before submission (net-new integration — no existing address validation service)
4. **Zone impact detection** — Flag address changes that cross delivery zone boundaries for escalated approval (no delivery zone data model exists — zones are implicit through `Account_Route__c` -> `Route__c` -> `Warehouse__c`)
5. **Contact management** — Direct writes to standard Contact with portal-access toggle via Platform Event for community user activation/deactivation
6. **Approval queue** — Gulf ops review queue for pending changes, with auto-escalation for zone-impacting changes
7. **Change history** — Chronological audit trail of portal-initiated changes, filterable by type and date

### Readiness — Needs Refinement

**Polish review posted 2026-06-08.** Key findings:

- **Wrong dependency:** BMS-3930 (credit terms display) blocking link is incorrect — it doesn't deliver auth, portal infrastructure, or account management. Real dependencies: BMS-3926 (portal login) + BMS-3923 (Experience Cloud setup). The BMS-3930 blocker was bulk-applied to 13 ecom tickets.
- **Net-new infrastructure underestimated:** The auto-generated tech approach reads as if `Account_Change_Request__c`, address validation API, delivery zone model, and portal access management already exist — none of them do.
- **Delivery zone model missing:** ACs reference "delivery zone mapping" and ZIP-based zone detection, but no zone object or mapping exists. Zones are implicit through `Account_Route__c` -> `Route__c` -> `Warehouse__c (Location__c)`.
- **AC gaps:** No rejection notification scenario, no concurrent pending changes scenario, no API failure fallback defined.
- **Open questions (from ticket + polish):**
  1. Auto-approval for non-zone-impacting changes?
  2. Which portal roles can manage addresses/contacts?
  3. Auto-re-evaluate pricing code on zone change?
  4. Contact add limits and approval requirements?
  5. How is "delivery zone" determined from an address — ZIP lookup or manual?
  6. Should community user provisioning be a separate foundational story?

### Comments

No prior comments on ticket. Polish review comment posted 2026-06-08 by Alvaro Sanchez with full validation findings.

---

## BMS-3832 — CTC Suggestion Engine

**Status:** Backlog | **Type:** Story | **Epic:** BMS-5055 (REQ-128 CTC Suggestion Engine)

[Jira](https://ohanafy.atlassian.net/browse/BMS-3832)

### Summary

Gulf distributes perishable beverages across 5 warehouses with thousands of SKUs. Close-to-code (CTC) inventory that isn't moved quickly becomes a direct P&L hit through spoilage write-offs, supplier claim rejections, and customer returns. BMS-3832 builds a suggestion engine that proactively matches aging inventory to high-velocity accounts or promotional opportunities — converting a reactive warehouse problem into a planned sales motion.

### Impact

- **5 Gulf warehouses** each carry distinct product mixes with varying shelf-life profiles
- Beer and fresh beverages (Milton FL, Mobile AL) have tighter code windows than shelf-stable products (McCalla AL)
- Close-to-code product intersects with Gulf's **154+ pricing codes** — promotional pricing can accelerate sell-through
- Code date traceability is a known gap from discovery workshops
- Direct P&L impact: spoilage write-offs, failed supplier claims, customer returns

### Solution

The ticket proposes a scheduled Apex batch job (`CTC_SuggestionBatch`) that:

1. **Scan aging inventory** — Query `Lot__c.Expiration_Date__c` against configurable CTC thresholds per brand/warehouse. The lot tracking infrastructure exists: `Lot__c` (with `Expiration_Date__c`, `Is_Sellable__c`) -> `Lot_Inventory__c` (per location) -> `Inventory__c`
2. **Calculate route velocity** — Use existing `Placement__c.Weekly_Sales__c` (rate-of-sale at Account+Item level, calculated by `B_AccountItem_HistoryTracker` batch) and `Invoice_Item__c` history to match aging inventory to high-velocity routes
3. **Generate suggestions** — Create `CTC_Suggestion__c` records (new object) with: warehouse, SKU, quantity, days-until-code, priority, suggested action (Route Push / Promotional Discount / Interwarehouse Transfer / Supplier Return)
4. **Interwarehouse transfers** — Leverage existing `Transfer__c` + `Transfer_Group__c` objects for cross-warehouse movement recommendations, accounting for transit time
5. **Pricing awareness** — Reference `Price_Record__c` promotional pricing; calculate margin impact vs. spoilage write-off cost
6. **Manager dashboard** — LWC dashboard for warehouse managers to Accept/Reject suggestions with audit trail and reason codes (stored as CMDT)

### How It Connects to Real-Time Inventory Reconciliation (BMS-3825)

BMS-3832 and BMS-3825 share the same inventory data foundation but address different problems:

| Dimension | BMS-3825 (Inventory Reconciliation) | BMS-3832 (CTC Suggestion Engine) |
|-----------|-------------------------------------|----------------------------------|
| **Problem** | Counted quantities don't match system quantities due to concurrent operations | Aging inventory sits in warehouses until it expires |
| **Data layer** | `Inventory__c.Quantity_On_Hand__c` + `Inventory_Adjustment__c` + snapshot mechanism | `Lot__c.Expiration_Date__c` + `Lot_Inventory__c` + `Placement__c.Weekly_Sales__c` |
| **Reads from** | Current inventory state (point-in-time freeze) | Lot expiration dates + historical sell-through velocity |
| **Writes to** | Inventory adjustments (after variance approval) | CTC suggestions -> Draft orders/transfers |
| **Trigger** | Manual (warehouse manager initiates count) | Scheduled batch (configurable cadence) |
| **Shared infrastructure** | `Inventory__c`, `Location__c` hierarchy, `Inventory_Adjustment__c` | `Inventory__c`, `Location__c`, `Transfer__c`, `Lot__c` |

**Key dependency:** BMS-3832 requires reliable lot-level quantities. If BMS-3825's reconciliation reveals that `Lot_Inventory__c.Quantity_On_Hand__c` is inaccurate (which Gulf's current manual process suggests it may be), CTC suggestions built on those quantities will inherit the inaccuracy. The reconciliation work doesn't formally block CTC, but accurate inventory is a quality prerequisite.

**Shared building blocks already in the codebase:**

- `Inventory_Threshold__c` + `SKU_Override__c` with Min/Target/Max DOH and Lead Time — resolved by `S_InventoryThresholds.resolve()` via waterfall: SKU Override -> Account+Warehouse -> Warehouse -> Account
- `Configuration_Preference.Use_Lot_Tracking` and `Configuration_Preference.Close_to_Date_Expiration` — existing CMDT knobs
- `B_Inventory_HistoryTracker` — daily inventory snapshot batch (for historical trending)
- `B_AccountItem_HistoryTracker` — weekly rate-of-sale calculation (populates `Placement__c.Weekly_Sales__c`)
- Pick lifecycle tracking (BMS-4196, Done) — `Pick_Event__c` + `Pick_Performance_Summary__c` for warehouse throughput data

### Readiness — Needs Spike + Team Consensus

**Labels:** high-judgment, spike-recommended, decomposed

Already decomposed into child stories:
- **BMS-4081** — Spike: Algorithm & Data Model (Backlog)
- **BMS-4082** — Ph 1: Suggestion Generation (Backlog)
- **BMS-4083** — Ph 2: Manager Review & Action (Backlog)

**Blockers:**
- Blocked by BMS-4196 (Picking Lifecycle Tracking) — **Done**, blocker resolved
- Blocked by unresolved discovery item: "DOH-Driven Transfer Suggestion Engine" — needs Gulf clarification

**Open questions (from ticket + comments):**
1. CTC threshold windows — configurable by brand, package type, or warehouse?
2. Route velocity data source — historical `Invoice_Item__c` or separate sell-through dataset?
3. Should interwarehouse transfer suggestions factor in transit cost?
4. Execution cadence — nightly batch, real-time on receipt, or on-demand?

### Comments

**Emily Shull (2026-04-15):**
> There needs to be a rate of sale calculation value stored at the Placement (Account Item) level. We need to determine how often that is calculated/re-calculated. An account may be "high velocity" for one SKU but not another. We need to consider that we do not have the threshold for what is considered "high velocity" by Gulf at either an account basis or on a SKU basis. That should not block the ticket, but flexibility needs to be built in to the engine to tell it where that threshold definition lives.

**Bryson Carroll (2026-04-22):**
> I would assume this can just end up being a dashboard once the rate of sales calculation is done.

**Auston Main (2026-04-27):**
> Blocked by BMS-4196 once it's made into a story. *(Note: BMS-4196 "Picking Lifecycle Tracking" is now Done)*

**Thomas Spangler (2026-04-30):**
> Handing off to Leah Schneidereit in Sprint 3.

---

## Cross-Ticket Summary

| Dimension | BMS-3932 (Account Mgmt) | BMS-3832 (CTC Engine) |
|-----------|-------------------------|----------------------|
| **Domain** | eCommerce / Portal (L3 UI) | Inventory / WMS (L2 Business Logic) |
| **Package** | OHFY-eCommerce-UI + OHFY-PLTFM | OHFY-WMS + OHFY-PLTFM |
| **New metadata** | `Account_Change_Request__c`, portal fields | `CTC_Suggestion__c`, threshold CMDTs |
| **External deps** | USPS/Google Address API | None (all internal data) |
| **Ready to develop?** | Needs dependency correction + zone model decision | Needs spike (BMS-4081) + Gulf threshold clarification |
| **Risk** | Medium — net-new infra underestimated in ticket | High — algorithm design, Gulf-specific thresholds undefined |
| **Sprint 4 action** | Polish posted; awaiting PO decisions | Spike recommended before implementation |
