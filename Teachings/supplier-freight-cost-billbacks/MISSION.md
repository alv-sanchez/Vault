# Mission: Supplier Freight Cost Billbacks — the whole picture (Epic BMS-5161)

## Why
You are the manager/assignee on epic **BMS-5161 — Supplier Freight Cost Billbacks**, delivered as three stacked PRs (#511 → #514 → #516) plus a parked UI ticket. You can run the live demo ($480 and $120 billbacks), but you asked for the *technical* whole picture — a **DBML ER diagram** and **flow charts showing the direction of everything**. This set exists so you can, on the spot, (a) draw the data model from memory, (b) trace a freight cost from a completed transfer / reconciled PO all the way into a `Billback_Line__c`, and (c) explain why this is *one ledger with two doors*, not a new subsystem.

## The one thing to internalize
Freight billback is **not a new recovery system** — it is a new `Type__c = 'Freight'` value on the already-shipped BMS-4141 `Billback__c` ledger, fed by **two new source triggers** (a completed cross-state Transfer, and a reconciled PO). Reuse the trunk; add two sources.

## Success looks like
- Can sketch the **ER diagram**: `Account` (3 roles) · `Supplier_Funding_Agreement__c` (coverage %) · `Transfer_Group__c` + `Purchase_Order__c` (the two sources) · `Billback__c` → `Billback_Line__c` (the ledger, with a source FK back to Transfer or PO).
- Can trace both **control flows** end to end: source event → trigger-service gate → Tier-1 Service-Locator interface → queueable → `S_*FreightBillbackCalculation` → idempotent upsert of `Billback__c`/`Billback_Line__c`.
- Can name the **cross-tier rule**: WMS (Tier 3) never references OMS concretely — it goes through a Service-Locator interface (same pattern as `DeliveryUpdaterService`).
- Has a **mnemonic** that recovers the structure and the flow without looking anything up.

## Deliverables in this folder
- `lessons/0001-what-youre-solving.html` — the business hole + the reuse reframe (**start here**).
- `lessons/0002-two-doors-one-ledger.html` — the mechanism, end to end (G·R·E·C).
- `reference/erd-and-flows.md` — DBML ERD + mermaid ER + 4 flow charts (renders natively in Obsidian).
- `reference/erd-and-flows.html` — same content, house style, opens in a browser.
- `RESOURCES.md` — every link (epic, stories, reused rails, new code, live demo).
- `learning-records/0001-…` — where the learner started and what this set targets.

## Constraints
- Every claim traces to real code in `OHFY-Split` (verified against the `integration/bms-5161-validation` worktree). No hypotheticals.
- Time-boxed — this is a reference to reload the picture fast, not a course.

## Out of scope
- Apex-authoring mechanics (trigger framework internals, QueryService/DmlService rules).
- The BMS-5792 LWC (parked at Awaiting-UI) — this set is the backend picture.
- The open design call on whether the PO path should *also* gate on `Status = Complete` (currently fires on the freight-owed reconciliation signal).
