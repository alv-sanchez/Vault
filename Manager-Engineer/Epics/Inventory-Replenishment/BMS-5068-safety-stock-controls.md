---
epic: BMS-5068
release_phase: crawl
title: "[REQ-141] Safety Stock Controls"
domain: "Inventory / replenishment planning"
user: "Inventory / demand planners · service levels"
impact: "Stockouts or overstock when supplier lead-time or seasonal demand shifts and static reorder points can't flex"
build_status: "Built · all 6 stories · PR #442 (feat/safety-stock-controls-bms-5068) · CI fully green"
awaiting_ui_direction: false   # backend-heavy; one Tier-4 LWC (safetyStockManager) added under 5640
org: "shortStock4"            # active claimed dev org (LIVE per sf org list, exp 2026-08-01) — replaces shortStock; keep until #442 merges
claimed_orgs:
  - "shortStock4 — ACTIVE (live per sf org list, exp 2026-08-01) — assumed current safety-stock org (shortStock expired); confirm it's the 5068 re-claim"
  - "shortStock — RELEASED/EXPIRED (auto-expired; was orgId 00Dcb00000HrhnaEAB) — replaced ohfy-val-5068"
  - "ohfy-val-5068 — RELEASED 2026-07-02 (orgId 00DO800000UmPhFMAV; CLI+browser sessions expired mid-demo, swapped for a fresh org)"
  - "ohfy-val-4217 — RELEASED 2026-07-01 (schema stuck on new SKU_Override fields; not a code defect — CI green on fresh org)"
pr: "https://github.com/Ohanafy/OHFY-Split/pull/442"
status: In Progress
audit_verdict: Built
polish_verdict: "Resolved — extended existing SKU_Override__c stack (not a new object)"
score: 2
stream: S5-Inventory
phase: 1
locked_down: true
due: 2026-06-30
eod_realistic: false
executable_children: []
blockers: [BMS-4217]
build_order: []
updated: 2026-06-29
jira: https://ohanafy.atlassian.net/browse/BMS-5068
tags:
  - manager-engineer
  - epic
---

# BMS-5068 — [REQ-141] Safety Stock Controls

> [!success] Current state (2026-07-01) — BUILT
> Epic broken out + built on one branch: **PR [#442](https://github.com/Ohanafy/OHFY-Split/pull/442)** (`feat/safety-stock-controls-bms-5068`), **all 7 CI checks green**, 105 Apex tests. Resolution: **extend the existing `SKU_Override__c` stack** (not the fictional `Safety_Stock_Override__c`) — reconciling the 2026-06-29 contradiction below.
> - **Children built:** BMS-4217 (DOH order sizing) · **BMS-5636** (supplier-scope + Scheduled/Manually-Closed lifecycle) · **BMS-5638** (expiry notifications) · **BMS-5639** (freeze effective-DOI + source on task) · **BMS-5640** (planning LWC + impact preview) · **BMS-5641** (report type).
> - **Full breakout + overlap analysis:** [[breakout-and-overlap]] (`Build-Overview/Sprint-8/BMS-5068-safety-stock/`).

## 🖥️ Claimed orgs
| Org | State | Notes |
|---|---|---|
| **shortStock** | **ACTIVE** (claimed 2026-07-02, orgId `00Dcb00000HrhnaEAB`, instance `broth-americano-9694`) | replaces ohfy-val-5068; keep until #442 merges. Needs deploy + `npm run update:fls -- shortStock` before demo. |
| ohfy-val-5068 | RELEASED 2026-07-02 (orgId `00DO800000UmPhFMAV`) | CLI + browser sessions expired mid demo; released back to pool, swapped for `shortStock`. |
| ohfy-val-4217 | RELEASED 2026-07-01 | schema stuck on new `SKU_Override__c` fields (`Account__c`/`Adjustment_Type__c`/`Closed_*`/`Closure_Reason__c` wouldn't materialize despite clean deploys) — org defect, **not code** (CI green on fresh org). Released + reclaimed. |

> [!summary] Verdict (historical — 2026-06-29, pre-build)
> **Blocked / re-scope** · score 2 · stream S5-Inventory. The `polished` Jira label is misleading: `/polish-epic` against main returned **Contradicted**. BMS-4217's entire design (a new `Safety_Stock_Override__c` object + a supplier→SKU→system **DOI-target** hierarchy) does not match main, which ships a **location-based DOH-threshold** framework with no item→supplier link. Build it verbatim and you create a parallel, conflicting system.

## 🎯 Phase-One brief (locked down · due 2026-06-30)
- **The issue:** Static reorder points can't flex. During supplier disruptions, lead-time swings, or seasonal demand, Gulf planners need to **temporarily raise the inventory buffer** for a specific supplier or SKU — without touching system-wide defaults.
- **Who in Gulf is impacted:** **Inventory / demand planners** (need a safe override lever), and **service levels** broadly — stockouts when supply conditions change hurt fill rate and customers.
- **Proposed solution (as written):** configurable safety-stock that elevates DOI targets per supplier / per SKU. Demo shipped as BMS-4025 (Done); production-hardened clone = **BMS-4217**.
- **Polish reality (vs main):** ⛔ `Contradicted`. Main already has the analog: **`SKU_Override__c`** (`Min/Target/Max_DOH_Override__c`, reason, date range, status) + **`Inventory_Threshold__c`**, resolved by `S_InventoryThresholds.resolve()` with precedence *SKU_Override (Item+Location) → Account+Warehouse → Warehouse → Account*. It is **DOH-threshold + location-based**, not the ticket's **DOI-target + supplier-based** model. `S_InventoryDOI.cls` states there is **no item→supplier link** in the data model. (Bonus: this answers the old open question — replenishment qty IS computed, in `E_ReplenishmentTask.cls`.)
- **EOD-realistic? 🟠 No.** Needs a **re-scope decision** first: extend the existing DOH/`SKU_Override__c` pattern, and decide whether supplier-tier resolution is even feasible (no supplier link today). Not a code task yet.

## Audit
- **Children:** 2 total · 0 executable — BMS-4025 (Done, demo), BMS-4217 (Backlog, the intended build).
- **Blocked by:** no open Jira `Blocks`; the real blocker is a **spec-vs-code contradiction** (design decision needed).
- **Shared substrate / overlap:** 🔒 **INV-LOCK** — touches `Inventory__c` / threshold resolution shared with 5060/5113/5484. One inventory-mutating ticket at a time.

## Executable children — live (auto-updates from ticket notes)
```base
filters:
  and:
    - file.inFolder("Manager-Engineer/Tickets")
    - epic == "BMS-5068"
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
| Ticket | Why skipped |
|---|---|
| BMS-4217 — Safety Stock Controls (prod clone) | **Contradicted** by main. Spec names `Safety_Stock_Override__c` + supplier→SKU DOI-target hierarchy; main has `SKU_Override__c` + `Inventory_Threshold__c` (DOH, location-based) and no item→supplier link. Re-scope before build. |
| BMS-4025 — Safety Stock (demo) | **Done** (April-17 demo). Left no matching metadata on main. |

## Open questions for PO / architect
- Re-scope BMS-4217 onto the existing DOH/`SKU_Override__c` framework — and confirm whether a **supplier-tier** override is even buildable without an item→supplier link. (Decision needed before any code.)

## Run history
- 2026-07-02 — **QA dry run** (expert-QA pass): live-verified impact preview math, SKU-vs-supplier precedence, supplier→sibling-SKU cascading, one-active-per-entity uniqueness (both scopes), scope validation, closure-reason requirement, manual close + revert, full lifecycle (Scheduled→Active→Expired), resolver null-fallback, BMS-4217 math — all correct on `ohfy-val-5068`. **Bug found + fixed:** Permanent overrides could carry an End_Date and get silently expired/notified (new validation rule, zero blast radius). **Gaps found, NOT fixed (flagged on Jira, need own tickets):** `Override_Reason__c` not actually mandatory (would break 8 unrelated test classes if fixed here); **BMS-5641** report type has no computed impact-value/delta field, so its AC isn't fully met. **Blocker found:** PR #442 is `REVIEW_REQUIRED` — the org's Claude Code review bot hit its **monthly spend cap** and skipped the real review; needs a human approval or cap reset + new commit. PR body + Jira comments updated with full findings.
- 2026-07-01 — Epic built + shipped on **PR #442**, all CI green. Released stuck `ohfy-val-4217`, claimed **`ohfy-val-5068`** (orgId `00DO800000UmPhFMAV`), deployed epic branch. **Root cause of "fields missing" = field-level security**, not deploy/code: new optional fields deploy but aren't readable until **`npm run update:fls -- <org>`** — required step for any fresh demo org. After FLS, all 7 new fields visible; backend driver (`OHFY-WMS/scripts/safety-stock-demo.apex`) ran clean end-to-end (preview / SKU-beats-supplier resolution / lifecycle batch / manual close). Remaining for demo: LWC reachability (App page/tab) + live smoke.
- 2026-06-29 — `/polish-epic` on main: **Contradicted**. Spec data model fictional vs `SKU_Override__c`/`Inventory_Threshold__c`/`S_InventoryThresholds`. Locked into Phase One; flagged re-scope. Read-only, no writes.
