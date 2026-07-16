---
ticket: BMS-5899
title: "Charge_Type dimension on Billback_Line__c (foundation)"
epic: supplier-owed-recovery-program
lineage: BMS-5161
status: Queued
polish_verdict:
executable: false
risk: Low
ui: na
stream: S2-Supplier
track: stage-1
packages_touched: [OHFY-Data-Model]
blocked_by: []
blocks: [supplier-owed-02-agreement-terms-coverage-cascade, supplier-owed-03-receipt-fee-billback-source]
branch:
pr:
dod_met: false
updated: 2026-07-15
jira: https://ohanafy.atlassian.net/browse/BMS-5899
tags:
  - manager-engineer
  - ticket
---

# [DRAFT] Charge_Type dimension on Billback_Line__c

> [!info] Status
> **Queued (draft)** · polish — · risk Low · stream S2-Supplier · UI na
> Foundation story of the Supplier-Owed Recovery Program. Data-Model only. No Jira key yet (draft-first).

## Business justification
BMS-5161 shipped a freight-only recovery ledger where every billback line is implicitly "freight." The Supplier-Owed Recovery Program needs to recover **five** distinct charge kinds (freight, pallet tax, state-line tax, other tax, receipt fees) and split coverage **per kind**. None of that is possible until each `Billback_Line__c` knows *what kind of charge it represents*. This story adds that single dimension and backfills existing data so the downstream rollup dashboard is complete on day one. It is a pure schema foundation — no behavior changes.

## Business impact
Unlocks the entire epic (every other child depends on this). Zero customer-visible change on its own; existing freight billbacks keep working exactly as today once backfilled to `Charge_Type = Freight`.

## Proposed logic
1. Create a **global value set** `Charge_Type` (Tier 0, OHFY-Data-Model) with values: `Freight`, `Pallet Tax`, `State-Line Tax`, `Other Tax`, `Receipt Fee`. Global so the same set backs both `Billback_Line__c.Charge_Type__c` and the future `Supplier_Agreement_Term__c.Charge_Type__c` (child #2) — keeping them synced.
2. Add `Billback_Line__c.Charge_Type__c` (Picklist, bound to the global value set). Additive field on a released managed object → 2GP-safe.
3. **Backfill:** a one-time `orgScripts/` Apex script stamps `Charge_Type__c = 'Freight'` on all existing `Billback_Line__c` rows (they are all freight today). DML through `DmlService`.

## Acceptance criteria
- Given the `Charge_Type` global value set, when it is deployed, then it exposes exactly the five values Freight / Pallet Tax / State-Line Tax / Other Tax / Receipt Fee.
- Given `Billback_Line__c`, when the package deploys, then `Charge_Type__c` exists as a picklist bound to the `Charge_Type` global value set and is nullable (no default forced on existing rows at field level).
- Given existing freight billback lines, when the backfill script runs, then every pre-existing `Billback_Line__c` has `Charge_Type__c = 'Freight'` and no other field is mutated.
- Given the shipped freight pipeline, when this story lands, then freight billback generation behaves identically (no calc/coverage change in this story).

## Implementation brief
- **Packages:** OHFY-Data-Model (field + global value set); backfill script under repo-root `orgScripts/`.
- **Approach:** GlobalValueSet metadata + a single picklist field-meta on `Billback_Line__c`. No Apex in the package. Backfill is a standalone Apex script (`QueryService` read, `DmlService` update) — not shipped in the managed package.
- **Files expected to change:**
  - `OHFY-Data-Model/force-app/main/default/globalValueSets/Charge_Type.globalValueSet-meta.xml` (new)
  - `OHFY-Data-Model/force-app/main/default/objects/Billback_Line__c/fields/Charge_Type__c.field-meta.xml` (new)
  - `orgScripts/backfillBillbackLineChargeType.apex` (new)
- **Guardrails:** additive-only on a released managed picklist/object (Hard Constraint 8 — no immutable-attribute change). Naming per `docs/engineering/standards/naming-conventions.md`. `External_Id__c` already present on the object.

## Judgment calls
- **Global value set, not a per-object picklist** — child #2's `Supplier_Agreement_Term__c.Charge_Type__c` must resolve against the *same* values used to tag lines, or coverage lookup by charge type silently misses. A global value set is the one artifact that guarantees they never drift.
- **Backfill in `orgScripts/`, not a package post-install script** — one-time data correction for existing subscribers; keeping it out of the package avoids re-running on every upgrade.

## Definition of Done
- [ ] Global value set + `Charge_Type__c` field deploy clean (isolated package-create per Hard Constraint 8).
- [ ] Backfill script stamps all existing lines Freight, verified by count query.
- [ ] Freight pipeline regression: existing `S_FreightBillbackCalculation` tests green (no behavior change).
- [ ] `/polish` clean before queue.
- [ ] Draft PR opened.

## Build log (append-only)
- 2026-07-15 — Draft authored from proposal.md §2 / §7 (delta table) + ASSUMPTIONS A3. No Jira key yet.
