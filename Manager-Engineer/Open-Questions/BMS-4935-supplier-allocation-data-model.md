---
ticket: BMS-4935
relates: [BMS-4119, BMS-4120, BMS-4121]
question: "Supplier (Red Bull) allocation — data model: extend Allocation__c or new object? how to model the 5-warehouse split? import keying?"
status: Answered      # Open | Resolving | Answered
decided_by: Alvaro Sanchez (+ SME research, code-grounded)
method: beverage-distribution SME agent + OHFY-Split main code evidence + Gulf input
po: Elliot Flores
jira_comment_url:
raised: 2026-06-29
updated: 2026-06-29
tags:
  - manager-engineer
  - open-question
---

# BMS-4935 — Supplier Allocation Data Model (resolution)

> [!success] Decision
> Build a **new `Supplier_Allocation__c`** object (do **not** extend `Allocation__c`). Model the split as an **aggregate parent (supplier total per SKU/week) + per-warehouse child rows**. Key the weekly import idempotently on a composite `External_Id__c`. Map file rows to `Item__c` via **SKU code** (changeable later). Treat allocations as **inbound/planning only** for v1 (no sell-side enforcement).

## The open question
Red Bull sends Gulf a weekly allocation spreadsheet that must be split across 5 warehouses (Milton FL; Montgomery/Mobile/Huntsville/McCalla AL). The build stories (4119/4120/4121) assumed a supplier-typed `Allocation__c` with a `Supplier_Account__c` lookup, a `Warehouse_Allocation__c` child, and an import framework — **none of which exist on `main`**. So before any build: what is the right data model?

## Decisions (one per sub-question)

| # | Question | Decision | Owner of call |
|---|---|---|---|
| Q1 | Extend `Allocation__c` vs new object? | **New `Supplier_Allocation__c`** | SME + code evidence |
| Q2 | How is the split modeled? | **Aggregate parent + per-warehouse children** (Gulf chose aggregate for scalability) | Alvaro |
| Q2b | Split ratios fixed or variable? | **Configurable % per warehouse, with optional per-SKU override** | Alvaro ✅ |
| Q3 | File→Item key | **SKU code** (mapped to `Item__c`; changeable to UPC later with no rework) | Alvaro ✅ |
| Q4 | Feed sell-side enforcement? | **No — inbound/planning only for v1; sell-side cap noted as possible v2** | Alvaro ✅ |

## How we reached the conclusion (the evidence)

**Q1 — why a new object, not an extension (this is the load-bearing decision):**
`Allocation__c` is **not** a generic allocation table — it is a **live order-blocking cap**. `S_AllocationEnforcement.evaluate()` (`OHFY-OMS/force-app/main/default/classes/services/allocation/S_AllocationEnforcement.cls`) queries every `Is_Active__c=TRUE`, in-window `Allocation__c` matching an invoice's `Customer__c`/`Sales_Rep__c`/`Location__c` and **`addError()`s any line over `Allocated_Cases_Remaining__c`**; it's wired into the `InvoiceItem` before-insert/update triggers. A Red Bull supplier allocation is the **inbound** side (what Gulf receives + distributes), not a customer sell cap. If supplier rows were loaded into `Allocation__c` with a warehouse in `Location__c`, the enforcement service's location-tier branch would **block real invoice lines from that warehouse** — a production-breaking side effect. The apparent benefit of reuse (shared automation) is exactly the automation that must NOT fire. → separate object.

**Q2 — aggregate parent + children:** Gulf confirmed the file is a **single aggregate** number Gulf splits, chosen for scalability. So Gulf owns the split logic; modeling a parent (supplier total) + child per-warehouse rows that must sum to the parent gives an integrity guarantee the flat model wouldn't. (If the file had been pre-split per warehouse, a flat per-Item×Location row would have been simpler — that path was rejected by the aggregate choice.)

**Q3 — SKU key, changeable:** the repo already keys imports on stable external-id fields (`Item__c.External_ID__c` / `VIP_External_ID__c`). We map the file's SKU code to the Item; switching to UPC later is additive (new mapping), no rework, because the link is to the Item record, not the SKU string.

**Q4 — inbound/planning only (v1):** keeping supplier allocations out of sell-side enforcement is both safer and the whole point of the separate object. A sales cap can be layered later if Gulf wants it.

**Industry grounding:** supplier/inbound allocation and retail/customer allocation are established as distinct concepts in beverage DSD distribution (DealStream beverage glossary; Solid Innovation DSD). The brand/territory restriction layer (`Product_Market_Restriction__c`, `Territory__c`, `S_MarketRestrictions`) is independent and must be respected for validation but not written to.

## Proposed schema delta (minimal, repo-convention names)
New object **`Supplier_Allocation__c`**:
- `Supplier__c` Lookup→Account · `Item__c` Lookup→Item__c · `Location__c` Lookup→Location__c (filter `Type__c='Warehouse'`)
- `Allocated_Case_Amount__c` Number(18,3) · `Allocation_Week__c` Date/Text(`YYYY-Www`)
- `External_Id__c` Text(255) unique externalId — composite key `redbull:{week}:{itemExtId}:{warehouseCode}`
- `Is_Active__c` Checkbox · `Parent_Supplier_Allocation__c` self-lookup (parent=supplier total, children=warehouse rows)
- **No changes to `Allocation__c` or its picklists** → enforcement untouched.

## v2 / later (noted, not in scope now)
- **Sell-side enforcement (Q4 v2):** a future option to have supplier allocations cap what reps can sell (e.g. block selling more than Red Bull allocated). Deliberately out of v1; revisit if Gulf wants it.

## Only remaining input — from Gulf (not an Alvaro decision)
- The real **sample file** (requested on BMS-4119) to lock the exact file format + the **SKU code field name** the file carries. This is the last thing gating the spike; everything model-side is now decided.

## Unblock — configurable parsing (build now, sample = config later)
The parser is **config-driven**, so the build is **not blocked** on having the real file. Pattern follows the existing `LotIdentifierParser` + `Lot_Identifier_Format__mdt` ("parse-spec-in-CMDT") in `OHFY-PLTFM`.
- **`Allocation_Import_Mapping__mdt`** — one row per source column: `Source_Label__c` / `Source_Index__c` → `Target_Field__c`, `Data_Type__c`, `Is_Required__c`, `Transform__c` (None/Trim/Upper/StripNonNumeric/ParseWeek), `Feed__c` ("RedBull").
- **`Warehouse_Allocation_Split__mdt`** — `Warehouse_Code__c` (→ `Location_Code__c`) · `Percent__c` · `Item_Key__c` (blank = default set, set = per-SKU override) · `Is_Active__c`. Active default rows must sum to 100; each override set sums to 100 (validated → file reject). Explode: `childQty = round(aggregate × pct)`, remainder to largest-% warehouse so Σ = aggregate → 5 `Supplier_Allocation__c` rows.
- **Best-guess file (aggregate weekly CSV):** `Supplier Item (SKU)` · `UPC` · `Description` · `Allocation Qty` · `Week` · `Allocation Type`.
- **Validation rules (all buildable now):** missing required column → reject file; unknown SKU → reject row; bad/zero/neg qty → reject row; duplicate row (SKU+week) → reject; duplicate week (re-import) → idempotent overwrite (warn); Σ splits = aggregate → reject row on mismatch; split config not summing to 100 → reject file.
- **Upsert:** `DmlService.doUpsert(rows, Supplier_Allocation__c.External_Id__c)` on `redbull:{week}:{itemExtId}:{warehouseCode}`. (Raw DML is a repo PR blocker — must use `DmlService`.)
- **Config-only once the sample lands (no code):** exact header labels/order, which Item id the SKU matches (`External_ID__c` vs `GPA_External_ID__c` vs `SKU_Number__c`), week encoding, CSV-vs-XLSX, qty unit.
- Red Bull/VIP/iDIG file specs are partner-gated (non-public) — confirms config-over-code is the right call.

## Risk / guardrail
Biggest risk = contaminating invoice-item enforcement. Any active, in-window `Allocation__c` row referencing a warehouse becomes a live order-blocking cap via `S_AllocationEnforcement`. The separate `Supplier_Allocation__c` object guarantees the import cannot trip invoice-line blocks.

---
<sub>Resolution drafted 2026-06-29 from a beverage-distribution SME research pass + OHFY-Split @ main code evidence + Gulf/Alvaro input. Posts to BMS-4935 once Q2b/Q4 confirmed.</sub>
