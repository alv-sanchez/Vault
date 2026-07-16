---
ticket: BMS-5900
title: "Supplier_Agreement_Term__c + per-charge-type coverage cascade"
epic: supplier-owed-recovery-program
lineage: BMS-5161
status: Queued
polish_verdict:
executable: false
risk: Med
ui: na
stream: S2-Supplier
track: stage-2
packages_touched: [OHFY-Data-Model, OHFY-OMS]
blocked_by: [supplier-owed-01-charge-type-dimension]
blocks: [supplier-owed-03-receipt-fee-billback-source, supplier-owed-04-supplier-agreement-terms-lwc, supplier-owed-05-supplier-owed-dashboard-lwc]
branch:
pr:
dod_met: false
updated: 2026-07-15
jira: https://ohanafy.atlassian.net/browse/BMS-5900
tags:
  - manager-engineer
  - ticket
---

# [DRAFT] Supplier_Agreement_Term__c + per-charge-type coverage cascade

> [!info] Status
> **Queued (draft)** · polish — · risk Med · stream S2-Supplier · UI na
> The modeling heart of the epic. Data-Model + OMS. Depends on #1. No Jira key yet.

## Business justification
Today `Supplier_Funding_Agreement__c` carries **one** `Coverage_Default__c` percent, applied flatly to freight. The PO's core requirement: a supplier fronts 100% of pallet tax and the Alabama state-line tax but only 50% of freight — "split 50/50, or any percent, per charge type." A single number cannot express that. This story adds a child config object so one agreement holds **many** per-charge-type splits, and extends the coverage resolver to pick the right split for each line — while leaving existing freight agreements resolving to exactly today's answer.

## Business impact
Turns the recovery program from "one blunt percent" into "arbitrary, per-charge-type, optionally state/brand-scoped coverage." Directly models the PO's Riverbend example (mockup §1: Freight 40% / Pallet Tax 100% / State-Line Tax AL 100% / others 50% / Other Taxes 25%). Must be a **behavioral no-op** for every existing customer — the whole epic's "safe to ship" claim rests on this.

## Proposed logic
1. **New object `Supplier_Agreement_Term__c`** (Tier 0, OHFY-Data-Model), Master-Detail child of `Supplier_Funding_Agreement__c`:
   - `Supplier_Funding_Agreement__c` (Master-Detail) — terms die with the agreement; agreement dates/active flag gate all terms.
   - `Charge_Type__c` (Picklist, the #1 global value set).
   - `Coverage_Percent__c` (Percent 0–100) — **0 is meaningful**: "supplier owes nothing for this type" → suppresses the billback line.
   - `State__c` (Picklist, optional) — narrows the term (e.g. State-Line Tax @ 100% only for AL).
   - `Brand__c` (Lookup, optional) — mirrors existing agreement brand scoping.
   - `Is_Active__c`, `External_Id__c` — repo standard.
2. **Extend `S_SupplierFundingAgreement`** to resolve coverage **per charge type**, layering on the existing most-specific-wins logic (deterministic highest-Id tiebreak, unchanged):
   ```
   1. term matching Charge_Type + State + Brand      (most specific)
   2. term matching Charge_Type + (State OR Brand)
   3. term matching Charge_Type only
   4. Supplier_Funding_Agreement__c.Coverage_Default__c   (today's behavior)
   5. Account.Funding_Default_Coverage__c                 (today's behavior)
   → cap 100%.  Explicit 0% at any term level → NO billback line.  Null all the way → no line (unchanged).
   ```
3. **Signature discipline (Hard Constraint 4):** the released `@namespaceAccessible` resolver method gets a **new charge-type-aware overload**; the old signature becomes a thin shim that calls the new one with `Charge_Type = 'Freight'`. Never change the released signature in place.

## Acceptance criteria
- Given an agreement with no term rows, when coverage resolves for any charge type, then the result equals today's `Coverage_Default__c → Account default → 100%` cascade **exactly** (no-op proof).
- Given an agreement with a term (Pallet Tax, 100%) and `Coverage_Default__c = 50%`, when a pallet-tax line resolves, then coverage = 100%; when a freight line resolves with no freight term, then coverage = 50%.
- Given terms (State-Line Tax, AL, 100%) and (State-Line Tax, all-others, 50%), when a State-Line Tax line for AL resolves, then the AL-scoped term wins (100%); for TN, the general term wins (50%).
- Given a term with `Coverage_Percent__c = 0`, when a line of that charge type resolves, then **no billback line is created** for it.
- Given two active terms with identical charge type + scope, when coverage resolves, then the highest-Id term wins deterministically (matches shipped tiebreak).
- Given the floor-price path, when per-type terms exist, then `Floor_Price__c` resolution is **unaffected** — terms carry coverage only (regression: `S_PriceResolver.applyFloorMakeWhole` callers green).

## Implementation brief
- **Packages:** OHFY-Data-Model (new object + fields, M-D to the agreement), OHFY-OMS (extend `S_SupplierFundingAgreement` in `classes/services/billback/`).
- **Approach:** New M-D object; add a `resolveCoverage(..., String chargeType, ...)` overload on the resolver that queries `Supplier_Agreement_Term__c` via `QueryService`, applies the 5-step cascade, and clamps ≤100. Old method → shim delegating with `Freight`. No raw SOQL/DML. Logger in every catch + flush.
- **Files expected to change:**
  - `OHFY-Data-Model/.../objects/Supplier_Agreement_Term__c/` (new object + fields)
  - `OHFY-OMS/.../classes/services/billback/S_SupplierFundingAgreement.cls` (+ new overload, old→shim)
  - `_T` test classes for the new object + resolver (≥90% coverage on touched files)
- **Guardrails:** Hard Constraint 4 (signature freeze — overload + shim). Hard Constraint 8 (M-D child references only Tier-0 types; keep test refs to owned/standard types). No `ohfy__` prefix in Apex. Naming/quantity conventions checked before field creation.

## Judgment calls
- **Master-Detail, not Lookup** — terms are meaningless without their agreement and should cascade-delete with it; M-D also gives the agreement date/active gating for free. Matches the proposal (§3).
- **`Coverage_Default__c` retained as fallback, not migrated into terms** — a term-less agreement must resolve to today's answer; this is what makes the story a no-op and requires **zero data migration** for existing freight agreements.
- **0% ≠ null** — an explicit 0% term means "distributor-funded, suppress the line," distinct from "no opinion, fall through." The engine already treats null-coverage as no-line; 0% reuses that suppression deliberately.
- **Overload + shim over in-place change** — the resolver is released `@namespaceAccessible` and shared with the freight engines and the pricing floor; in-place signature change is a PR blocker (Hard Constraint 4) and a floor-path regression risk.

## Definition of Done
- [ ] `Supplier_Agreement_Term__c` deploys; package-create passes in isolation (Hard Constraint 8).
- [ ] Per-charge-type cascade implemented as a new overload; old signature shimmed.
- [ ] No-op proof: existing `S_SupplierFundingAgreement` / `S_FreightBillbackCalculation` tests green unchanged.
- [ ] Floor-price regression suite (`S_PriceResolver.applyFloorMakeWhole` callers) green.
- [ ] ≥90% coverage on touched files; `/polish` clean.
- [ ] Draft PR opened.

## Handoff (risk ≥ Med)
Shared-resolver change touching both billback coverage and the pricing floor. Human sign-off needed on: (a) the no-op proof for term-less agreements, (b) confirmation the floor path is untouched (Open Question c on the epic), (c) the deterministic tiebreak behavior when a customer creates overlapping terms (UI-block vs silent-resolve deferred to #4).

## Build log (append-only)
- 2026-07-15 — Draft authored from proposal.md §3 + §6 + ASSUMPTIONS A3/A4/A8/A9. No Jira key yet.
