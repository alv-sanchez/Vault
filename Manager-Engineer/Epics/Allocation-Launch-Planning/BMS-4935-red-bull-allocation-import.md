---
epic: BMS-4935
release_phase: crawl
title: "[REQ-008] Red Bull Allocation Import Automation"
domain: "Allocation & Launch Planning (OMS / Data-Model)"
user: "Purchasing analysts · warehouse teams · downstream drivers/customers"
impact: "Manual weekly entry + error-prone 5-warehouse splits → wrong stock on hand, driver-limit errors, customer complaints"
build_status: "Built · feat/redbull-allocation-import-bms-4120 · needs org deploy+tests"
awaiting_ui_direction: true   # backend artifact built; file-upload UI pending your UX direction + mockup
demo_review: true             # 🎬 in the demo bucket — review to catch a wrong-direction build early
demo_pitch: "No more hand-keying Red Bull's weekly allocation from spreadsheets — bad data is caught and warehouse splits happen automatically."
org:                          # ohfy-val-4120 EXPIRED (auto-expired) — reclaim on resume; branch feat/redbull-allocation-import-bms-4120
status: To Do
audit_verdict: Not-Yet
polish_verdict: Contradicted
score: 2
stream: S3-OMS-Alloc
phase: 1
locked_down: true
due: 2026-06-30
eod_realistic: false
executable_children: []
blockers: []
build_order: []
updated: 2026-06-29
jira: https://ohanafy.atlassian.net/browse/BMS-4935
tags:
  - manager-engineer
  - epic
---

# BMS-4935 — [REQ-008] Red Bull Allocation Import Automation

> [!summary] Verdict
> **Not-Yet** · score 2 · stream S3-OMS-Alloc. All three build/spike children are Backlog with **no acceptance criteria** (Story Statement + boilerplate "Gulf Context" only), and their core data-model claims are **contradicted by `Allocation__c` on main** — there is no supplier-account lookup and `Allocation_Type__c` is `Launch/Ongoing`, not `supplier/retail`. Nothing is executable until the supplier-allocation model is decided and AC are written.

## 🎯 Phase-One brief (locked down · due 2026-06-30)
- **The issue:** Gulf receives Red Bull's weekly allocation spreadsheet and splits it across 5 warehouses (Milton FL, Montgomery/Mobile/Huntsville/McCalla AL) **by hand** — slow, error-prone, no audit trail.
- **Who in Gulf is impacted:** **Purchasing analysts** (manual weekly data entry), **warehouse teams** (bad splits → wrong stock on hand), and downstream **drivers + customers** (wrong driver limits, stockout complaints).
- **Proposed solution:** a typed **supplier** `Allocation__c` (supplier-vs-retail) with a Red Bull supplier-Account link → import the file → validate (reject unknown SKU / bad qty / duplicate) → auto-split across the 5 warehouses → audit log. Phase-1 build = BMS-4120.
- **Polish reality (vs main):** ⛔ `Contradicted`. `Allocation__c` is a **customer/retail** model — `Customer__c → Account`, `Allocation_Type__c` = {Launch, Ongoing}, **no `Supplier__c`**; **no file/CSV import framework** exists. The only "Red Bull" code is pre-sell test strings.
- **EOD-realistic? 🔴 No.** Externally blocked: needs the **Gulf sample file** (requested on BMS-4119) + a **data-model decision** before any code. Spike BMS-4119 must run first.

## Audit
- **Children:** 4 total · 0 executable
- **Blocked by:** none (children carry only `Relates` links to each other / the parent / the epic — no open inbound `Blocks` link). Note: parent story **BMS-3735** `Blocks` six Supplier-Portal tickets (BMS-3737/3739/3740/3743/3744/3745, all Backlog) in epic 5148 — those are downstream of this epic, not blockers of it.
- **Shared substrate / overlap:** `Allocation__c` lives in `OHFY-Data-Model/force-app/main/default/objects/Allocation__c` with fields `Allocation_Type__c` (picklist **Launch/Ongoing**), `Customer__c → Account`, `Item__c → Item__c`, `Location__c → Location__c`, `Sales_Rep__c → User`, `Allocated_Case_Amount__c`, `Allocated_Cases_Remaining__c`, `Allocated_Cases_Sold__c`, `Start/End_Date__c`, `Is_Active__c`, `External_Id__c`. Enforcement logic in `OHFY-OMS/force-app/main/default/classes/services/allocation/S_AllocationEnforcement.cls` + `CreateAllocationsController.cls` + `E_Allocations.cls`, plus trigger configs `Enforce_Allocation_Limit_Invoice_Item_BI/BU`. ⚠ This is a **customer/retail sales-allocation** model; reshaping it into a **supplier-issued** allocation model (the epic's intent) touches the enforcement path that Invoice Item already depends on — coordinate before adding `Supplier__c` / a new `Allocation_Type__c` value. No file/CSV import framework exists in OHFY-OMS or OHFY-PLTFM, and no Red Bull / weekly-allocation import batch exists (presell-conversion batch jobs are unrelated).

## Executable children — live (auto-updates from ticket notes)
> Replace `BMS-XXXX` below with this epic's key. This is a live query over `Tickets/` — never hand-edit a status here.

```base
filters:
  and:
    - file.inFolder("Manager-Engineer/Tickets")
    - epic == "BMS-4935"
formulas:
  open: file.asLink(file.name)
views:
  - type: table
    name: Children
    order:
      - status
      - ticket
    columnSize:
      formula.open: 280
      status: 120
      polish_verdict: 110
      risk: 60
      ui: 70
```

## Not-yet-executable children
> Skipped tickets have no note (nothing to query) — list them here with the reason, by hand.

| Ticket | Why skipped (not refined / blocked / not decomposed) |
|---|---|
| BMS-3735 — Red Bull Allocation Import Automation | **Backlog**, labelled `decomposed` + `refinement-needed` + `phase-2-walk`. This is the umbrella story already split into 4119/4120/4121 — its scope lives in the children, so it is not directly buildable. Excluded: decomposed parent. (It `Blocks` 6 Supplier-Portal tickets downstream.) |
| BMS-4119 — Spike: File Format & Validation Rules | **Backlog** `spike`. Description has Story Statement + "Why It Matters" + boilerplate Gulf Context but **no acceptance criteria / no deliverable definition**. Excluded: spike with no AC — a research task, not a workable dev ticket. |
| BMS-4120 — Ph 1: Import, Validation & Warehouse Split | **Backlog** `build`. **No acceptance criteria.** Core claims contradicted on main: "typed allocation model (supplier vs retail)" — `Allocation_Type__c` is Launch/Ongoing; "supplier account lookup" — `Allocation__c` has no `Supplier__c` (only `Customer__c → Account`); "automated import" — no file/CSV import framework or import batch exists. Excluded: not refined + contradicted substrate. |
| BMS-4121 — Ph 2: Account Mapping, Seasonality & Audit | **Backlog** `build`. **No acceptance criteria.** Depends on the same unbuilt supplier-allocation model + import pipeline as Ph 1; "link to Red Bull supplier account" and "seasonal item changes" have no substrate on main. Logically follows 4120. Excluded: not refined + contradicted substrate + depends on un-built Ph 1. |

## Open questions for PO
- [[BMS-4120-supplier-allocation-model-and-ac]] — Should `Allocation__c` be extended into a supplier-issued allocation model (new `Supplier__c` lookup + new `Allocation_Type__c` value), and where do AC + the import file contract come from?

## Run history
- 2026-06-28 — Initial dry-run audit (S3). 4 children pulled; 0 candidates passed the executability gate (1 decomposed umbrella, 1 spike-no-AC, 2 build stories with no AC and data-model claims contradicted by `Allocation__c` on main). Verdict Not-Yet. Raised one open question + feedback doc. No repo changes, no Jira writes.
