---
ticket: BMS-5901
title: "Receipt-fee billback source (Inventory_Receipt_Fee__c)"
epic: supplier-owed-recovery-program
lineage: BMS-5161
status: Queued
polish_verdict:
executable: false
risk: Med
ui: na
stream: S2-Supplier
track: stage-3-a
packages_touched: [OHFY-OMS, OHFY-WMS]
blocked_by: [supplier-owed-01-charge-type-dimension, supplier-owed-02-agreement-terms-coverage-cascade]
blocks: [supplier-owed-05-supplier-owed-dashboard-lwc]
branch:
pr:
dod_met: false
updated: 2026-07-15
tags:
  - manager-engineer
  - ticket
jira: https://ohanafy.atlassian.net/browse/BMS-5901
---

# [DRAFT] Receipt-fee billback source

> [!info] Status
> **Queued (draft)** · polish — · risk Med · stream S2-Supplier · UI na
> Third billback source, alongside transfers (BMS-5790) and POs (BMS-5791). OMS + WMS. Depends #1, #2. Runs parallel with #4 (disjoint packages). No Jira key yet.

## Business justification
BMS-5161 captures freight from transfers and POs. Inventory Receipts — where pallet tax, express-processing, storage, and misc. fees actually land as `Inventory_Receipt_Fee__c` rows — are invisible to the recovery ledger even though the PO explicitly named receipts as a source ("include the fees for visibility, show all the lines, roll up the fee"). This story makes receipt fees a first-class billback source so those dollars flow into the supplier-owed rollup, itemized by charge type.

## Business impact
Completes the "across transfers + POs **+ receipts**" coverage the PO asked for. Without it, the dashboard (#5) under-reports what a supplier owes by every receipt-level fee. Enables per-charge-type recovery of pallet tax and non-freight receipt fees that are currently un-recoverable.

## Proposed logic
1. **Source lookup:** add `Billback_Line__c.Inventory_Receipt_Fee__c` (Lookup — one billback line per fee row, line-level provenance), matching the existing per-source Lookup pattern (`Transfer_Group__c`, `Purchase_Order__c`, `Invoice_Item__c`, `Inventory_Adjustment__c`). Optionally `Billback_Line__c.Inventory_Receipt__c` for header drill-down.
2. **Charge-type mapping:** map `Inventory_Receipt_Fee__c.Cost_Type__c` (9 values) → the 5 `Charge_Type__c` values. Freight/Shipping/Fuel Surcharge → `Freight`; Pallet → `Pallet Tax`; Express Processing/Interest/Misc. Charge/Service/Storage → `Receipt Fee`. **Mapping lives in a CMDT shipped in the same package as the engine** (Hard Constraint 8) so customers can re-bucket without a code change.
3. **Detection + generation** mirroring the shipped freight/PO pattern: a `B_ReceiptBillbackDetection` batch walks `Inventory_Receipt_Fee__c` rows for suppliers with active agreements, a `Q_` queueable does real-time generation on receipt completion, and an `S_ReceiptBillbackCalculation` service emits typed billback lines — resolving coverage via the #2 per-charge-type cascade, with deterministic External_Ids, stale-line retraction, and status preservation (idempotent recompute, same as the shipped engines).

## Acceptance criteria
- Given `Billback_Line__c`, when this story deploys, then an `Inventory_Receipt_Fee__c` source lookup exists and follows the released source-lookup pattern.
- Given a receipt fee of `Cost_Type__c = 'Pallet'` for a supplier with a (Pallet Tax, 100%) term, when detection runs, then one billback line is created with `Charge_Type = 'Pallet Tax'`, `Recoverable_Amount__c = fee × 100%`, sourced to that fee row.
- Given a fee whose `Cost_Type__c` maps to a charge type the agreement covers at 0%, when detection runs, then **no** billback line is created (suppression from #2).
- Given the CMDT mapping, when a customer re-buckets a `Cost_Type__c`, then detection honors the new mapping with no code change.
- Given detection re-runs on the same receipt, then it is idempotent — no duplicate lines (deterministic External_Id upsert).
- Given a fee row whose supplier has no active agreement, when detection runs, then no line is created.

## Implementation brief
- **Packages:** OHFY-OMS (detection batch/queueable/service + CMDT, `classes/.../billback/`), OHFY-WMS (receipt-completion trigger hook enqueuing the queueable — mirrors the WMS PO hook from BMS-5791).
- **Approach:** New `S_ReceiptBillbackCalculation` (sibling of `S_FreightBillbackCalculation`/`S_POFreightBillbackCalculation`, not an edit to them) delegating coverage to #2's resolver; `B_ReceiptBillbackDetection` + `S_ReceiptBillbackDetection` scheduler; `Q_ReceiptBillbackGeneration`; a `Cost_Type__c → Charge_Type__c` mapping CMDT. WMS hook via ServiceLocator interface (cross-tier, same pattern as `POFreightBillbackService`). No raw SOQL/DML. Logger + flush in every catch.
- **Files expected to change:**
  - `OHFY-Data-Model/.../objects/Billback_Line__c/fields/Inventory_Receipt_Fee__c.field-meta.xml` (+ optional `Inventory_Receipt__c`)
  - `OHFY-OMS/.../classes/services/billback/S_ReceiptBillbackCalculation.cls`, `B_ReceiptBillbackDetection.cls`, `S_ReceiptBillbackDetection.cls`, `Q_ReceiptBillbackGeneration.cls`, mapping CMDT + records
  - `OHFY-WMS/.../triggerServices/InventoryReceiptTriggerService` hook + ServiceLocator interface/impl
  - `_T` tests (≥90% coverage on touched files)
- **Guardrails:** Hard Constraint 8 (CMDT ships in the engine's package; no cross-package concrete type refs from Utilities). No `ohfy__` prefix in Apex. SYSTEM_MODE only with rule citation. Reuse — do not fork — the #2 coverage cascade.

## Judgment calls
- **Fee → charge-type mapping in a CMDT, not hardcoded** — `Cost_Type__c` is a 9-value taxonomy mapping N:1 onto 5 charge types; customers will re-bucket. CMDT in the engine's package keeps it configurable and 2GP-safe (proposal Open Question 5).
- **Sibling service, not an edit to the freight engines** — keeps the change additive, avoids a released-signature change, and mirrors how BMS-5790/5791 added transfer and PO sources as siblings.
- **Fee-row granularity** — one billback line per `Inventory_Receipt_Fee__c` row (not per receipt) so the dashboard drill-down shows every fee, honoring the PO's "show all the lines."

## Definition of Done
- [ ] Receipt-fee source lookup + mapping CMDT deploy; package-create isolated pass.
- [ ] Detection/generation idempotent, coverage via #2 cascade, 0% suppression honored.
- [ ] WMS receipt-completion hook fires real-time; nightly batch backfills.
- [ ] ≥90% coverage on touched files; `/polish` clean.
- [ ] Draft PR opened.

## Handoff (risk ≥ Med)
Two-package (OMS + WMS) coordination and a new detection batch. Human sign-off on: the `Cost_Type__c → Charge_Type__c` default mapping (which fee kinds are "Receipt Fee" vs "Other Tax"), and confirmation it doesn't double-recover fees already captured as PO/transfer freight (Open Question b on the epic).

## Build log (append-only)
- 2026-07-15 — Draft authored from proposal.md §2 (mapping table) / §4 (detection) / §7 + ASSUMPTIONS A5. No Jira key yet.
