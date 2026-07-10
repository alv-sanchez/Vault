---
ticket: BMS-4120
epic: BMS-4935
question: "Extend Allocation__c into a supplier-issued model (Supplier__c + new type), or build a separate object — and where do the AC + import file contract come from?"
status: Open
po:
jira_comment_url:
raised: 2026-06-28
answered:
tags:
  - manager-engineer
  - open-question
---

# Open Question — BMS-4120 (epic BMS-4935)

> [!question] The question
> The Red Bull import stories assume a "typed allocation model (supplier vs. retail) with a supplier-account lookup" plus warehouse-split and seasonal handling. The `Allocation__c` object on main is a **customer/retail sales-allocation** model and does not support any of that. Do we extend `Allocation__c`, or stand up a separate supplier-allocation object — and what are the actual acceptance criteria + import file contract?

## The issue
What the tickets claim vs. what exists on main (`OHFY-Split`, clean main):

- **"Typed allocation model (supplier vs. retail)"** — `Allocation__c/fields/Allocation_Type__c.field-meta.xml` is a picklist with values **`Launch` / `Ongoing`** only. No supplier/retail typing. **Contradicted.**
- **"Allocation__c records must link to the Red Bull supplier account"** — `Allocation__c` has lookups `Customer__c → Account`, `Item__c → Item__c`, `Location__c → Location__c`, `Sales_Rep__c → User`. There is **no `Supplier__c` lookup** (no supplier field anywhere on the object). **Contradicted.**
- **"Automated import of Red Bull weekly allocation files"** — there is **no file/CSV import framework** in `OHFY-OMS` or `OHFY-PLTFM`, and no weekly-allocation import batch (the presell-conversion batch jobs are unrelated). **Unverifiable / no substrate.**
- **Warehouse split across 5 warehouses / seasonal item handling** — no fields or logic exist for either. **No substrate.**
- **No acceptance criteria** in BMS-4119, BMS-4120, or BMS-4121 — all three carry Story Statement + "Why It Matters" + identical boilerplate "Gulf Context," and nothing testable.

The existing `Allocation__c` enforcement path (`OHFY-OMS/.../services/allocation/S_AllocationEnforcement.cls`, `CreateAllocationsController.cls`, trigger configs `Enforce_Allocation_Limit_Invoice_Item_BI/BU`) is wired to Invoice Item, so reshaping this object is not a free-standing change.

## The solution being attempted
Phase 1 (BMS-4120) wants to import + validate weekly Red Bull files and split allocations across warehouses; Phase 2 (BMS-4121) adds supplier-account mapping, seasonality, and an audit trail. Both are blocked on the same modeling decision: whether the supplier-issued allocation is the same object as the existing retail `Allocation__c` (re-used with a new type + `Supplier__c` lookup) or a new object. The answer determines the data-model package work, whether the enforcement path changes, and the import target — so it gates the entire epic.

## Options (with the recommendation first)
1. **[Recommended]** Treat the supplier-allocation model as a **new object** (e.g. `Supplier_Allocation__c`) decoupled from the customer-facing `Allocation__c`, with its own `Supplier__c → Account` lookup, warehouse (`Location__c`) split lines, and period/season fields. Keeps the Invoice-Item enforcement path untouched and avoids overloading a picklist other logic depends on. Cost: more new metadata up front.
2. **Extend `Allocation__c`** — add `Supplier__c`, add a `Supplier` value to `Allocation_Type__c`, repurpose `Customer__c`. Less new metadata, but it overloads an object the Invoice-Item enforcement already keys on (regression risk) and muddies retail vs. supplier semantics.
3. **Hold the epic** until the PO supplies (a) the real weekly file format/sample, (b) the SKU-validation + warehouse-split rules, and (c) acceptance criteria — i.e. let BMS-4119 (spike) actually run first as a true discovery deliverable. Slowest, but the import contract is currently undefined either way.

## Resolution
_(filled when answered)_ — decision + who decided + date.
