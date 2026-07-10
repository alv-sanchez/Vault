---
ticket: BMS-3742
epic: BMS-5113
question: "Add 30/60/90-day DOI tracking now, or ship single-window and defer 60/90?"
status: Answered            # decided by me-manager best judgment 2026-07-10; PO confirmation pending
po: Elliot Flores
jira_comment_url:           # NOT POSTED — Jira MCP unavailable this run
raised: 2026-07-10
answered: 2026-07-10
tags:
  - manager-engineer
  - open-question
---

# Open Question — BMS-5113 / BMS-3742

> [!question] The question
> Spike §4.2 wants DOI tracked at 30, 60 and 90-day lookbacks so teams pick the lens that fits the SKU. Shipped code has a single configurable window. Add all three in BMS-3742?

## The issue
- Shipped: one window (`Inventory__c.DOI_Velocity_Window_Days__c`, default 30) → one `Current_DOI__c`. No 60/90.
- Spike §4.2: track all three; custom windows (45d, 10 business days) are an explicit future extension, not first build.

## The solution being attempted
BMS-3742 standardization. Multi-window is additive persisted state (new fields or a normalized snapshot child), so it composes cleanly with the source switch.

## Options (with the recommendation first)
1. **[Recommended] Add 30/60/90 in BMS-3742, sequence the source-switch first.** New additive `Inventory__c` fields (or a per-window snapshot row) — no released-field changes (rule 8 safe). Do the invoiced-qty source swap first so all three windows compute on the correct source from day one. — *Tradeoff: 3× the stamped DOI state and slightly heavier nightly batch, but it's exactly what the spike asked and downstream reporting (4545) needs it.*
2. Ship single-window standardization, defer 60/90 to a fast-follow. — *Tradeoff: smaller first PR, but reporting (4545) then can't deliver the multi-window variance the spike calls for, and you re-open `S_InventoryDOI` twice.*

## Resolution
**Option 1 — include 30/60/90 in BMS-3742, source-switch first.** Decided by me-manager (best-judgment) 2026-07-10. Additive and low-regret; keeps the reporting story unblocked. Confirm the exact field shape (three flat fields vs a normalized window-snapshot child) with the reporting story BMS-4545 when its AC is readable. Not yet posted to Jira (no MCP this run).
</content>
