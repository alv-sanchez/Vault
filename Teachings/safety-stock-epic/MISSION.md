# Mission: Safety Stock Controls — the whole picture (Epic BMS-5068)

## Why
You are the assignee on epic **BMS-5068 — [REQ-141] Safety Stock Controls**, delivered as a single merged PR (#442, ~4.4k lines, 69 files, 6 stories). You can run the feature, but you told the teacher plainly: *"I just haven't fully confidently known what is going on in the whole picture."* This teaching set exists to close that gap — so you can (a) explain how a planner's safety-stock decision actually changes a purchase order, end to end, and (b) explain *why* the epic was broken into the six stories it was, and why that breakdown is "tidy" rather than arbitrary. You should be able to defend both to a teammate, a PO, or in a review, on the spot.

## Success looks like
- Can trace the **safety-stock data flow** from memory: planner sets an override → resolver waterfall picks the effective target DOH → order-sizing converts it to a case quantity → the number and its source get frozen on the replenishment task.
- Can name **what "safety stock" actually is in this system** in one sentence: an *upward adjustment to the target Days-on-Hand (DOH)*, not a separate stored quantity — it rides the existing threshold-resolution path.
- Can explain the **one design decision that makes the epic tidy**: it *extended* the already-shipped `SKU_Override__c` / `S_InventoryThresholds` stack instead of building the net-new `Safety_Stock_Override__c` object the demo (BMS-4025) had proposed.
- Can map each of the **six stories to the single existing component it extends** (one seam per story, no rebuilds, additive + fallback-safe).
- Has a **mnemonic** that recovers both the runtime flow and the "reuse-don't-rebuild" principle without looking anything up.

## Constraints
- Time-boxed between real EM work — lessons must be short, single-sitting, one tangible win each.
- Anchor to *your own* merged epic and the real class/field names in the repo, never hypotheticals.
- Every mechanical claim must trace to a real file (`S_InventoryThresholds`, `S_ReplenishmentOrderSizing`, `Replenishment_Task__c` fields) or to the ticket/PR text — no hand-waving.

## Out of scope
- Apex-authoring mechanics (trigger framework, QueryService/DmlService rules) — that's *how to build in this repo*, not *what this feature does*.
- The open Q4 product decision (pick-face vs inbound-PO wire-in) — real, but it's a future call, not part of understanding what shipped.
- Deep Salesforce notification/FLS plumbing — mentioned only where it explains an operational gotcha (the `update:fls` step).

## Open questions to revisit
- Does the learner want a third lesson on the **known gaps that shipped** (mandatory-reason not enforced, no independent live smoke of the LWC, un-reviewed merge) — i.e. reading the PR's own honesty section as a skill? Decide after lessons 1–2 land.
