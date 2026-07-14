---
key: BMS-5161
kind: strata-orientation-epic
repo: OHFY-Split
verified_at_sha: 97777425c
generated: 2026-07-13 15:30
packages_touched: ["OHFY-Data-Model", "OHFY-OMS", "OHFY-WMS", "OHFY-Service-Locator"]
children: ["BMS-5789", "BMS-5790", "BMS-5791", "BMS-5792"]
tags: [manager-engineer, strata, orientation, epic]
---

# 🪨 Orientation (epic) — BMS-5161 Supplier Freight Cost Billbacks

> **Thesis:** BMS-5161 adds a freight-cost source (from cross-state transfers and PO reconciliation) into the already-shipped, mature billback pipeline (BMS-4141) — because the epic's original premise (that no billback rails existed) was stale, this shrank from 'build a recovery subsystem' to 'extend a pipeline with a source.'
> _Code-verified against `OHFY-Split` @ `97777425c` · 2026-07-13 15:30_

## 🎯 Why now
- When Gulf moves product across state lines, freight costs incurred for supplier benefit should be recoverable through billback so Gulf doesn't absorb costs that contractually belong to suppliers.  `[jira]`
- The epic's 2026-06-12 code snapshot claimed Billback__c had only 6 fields and no supplier-agreement object existed — both false on main; BMS-4141 had already shipped a 14-field counterparty-generic ledger, Billback_Line__c, and Supplier_Funding_Agreement__c.  `[code]`

## 🏛️ Bedrock — what already exists (shared across the epic)
- **Billback__c (14 fields: Account__c counterparty-generic, Type__c, Status__c, Coverage_Percent__c, Total_Recoverable_Amount__c) + Billback_Line__c already ship** (BMS-4141) — `OHFY-Data-Model/force-app/main/default/objects/Billback__c`
- **S_BillbackCalculation idempotent recompute pattern (deterministic External_Id upsert, stale-line retraction, status preservation) already ships** (BMS-4141) — `OHFY-OMS/force-app/main/default/classes/services/billback/S_BillbackCalculation.cls`
- **Supplier_Funding_Agreement__c + S_SupplierFundingAgreement coverage cascade (agreement → account default → 100% cap) already ships** (BMS-4141) — `OHFY-OMS/force-app/main/default/classes/services/billback/S_SupplierFundingAgreement.cls`


## 🧭 Shape
`Transfer_Group__c (Complete + cross-state + freight populated) → TransferGroupTriggerService afterUpdate hook → FreightBillbackService (Tier-1, Service-Locator) → S_FreightBillbackCalculation → Billback__c/Billback_Line__c (Type=Freight) — mirrored for Purchase_Order__c (Supplier_Owes_Freight__c flag transition) via POFreightBillbackService`

## 🧱 The children — understood one by one

### 1. BMS-5789 — Source-agnostic freight cost capture on cross-state transfers  `Review (draft PR #511)`
> **Thesis:** Foundation story — lands the 4 fields everything else builds on.

**🔨 Delta:**
- [BUILD] **4 new fields on Transfer_Group__c** — Low risk, additive schema only

**🎯 Why:** Nothing downstream can exist until this capture point exists. `[jira]`

**🏛️ Child-specific prior art:**
- **Precedent for a group-level cost field: Transfer_Group__c.Total_Transfer_Tax__c** — `OHFY-Data-Model/force-app/main/default/objects/Transfer_Group__c/fields/Total_Transfer_Tax__c.field-meta.xml`


### 2. BMS-5790 — Freight billback generation  `Review (draft PR #514, depends on #511)`
> **Thesis:** Feeds captured freight cost into the existing billback rails via a new generator service.

**🔨 Delta:**
- [EXTEND] **S_FreightBillbackCalculation + Tier-1 FreightBillbackService cross-tier hook** — Med risk — new automation on a shared object, but additive/guarded/idempotent

**🎯 Why:** PO decision (2026-06-12): this epic is a freight-specific source feeding the existing rails, no parallel credit path. `[jira]`

**⚠️ Watch out:** Audit surface for freight-vs-claim overlap shipped as list-view only, not a matched cross-object report — flagged to PO


### 3. BMS-5791 — PO-side optional billback  `Review (draft PR #516, depends on #514)`
> **Thesis:** Second origination path for freight-scoped PO reconciliation (supplier owes Gulf).

**🔨 Delta:**
- [EXTEND] **POFreightBillbackService + Purchase_Order__c.Supplier_Owes_Freight__c/Recoverable_Freight_Cost__c** — Med risk, same proven cross-tier pattern as BMS-5790

**🎯 Why:** Scope resolved: freight-scoped PO origination only — general PO-reconciliation engine belongs to BMS-4951. `[jira]`



### 4. BMS-5792 — Design / Prototype / Demo  `Backlog (Awaiting-UI)`
> **Thesis:** Mockup done, 4 design decisions resolved (quick-action modal, no invented lifecycle stepper, multi-row breakdown, field-locking post-Accrued) — parked pending PO approval before any LWC build.

**🔨 Delta:**
- [BUILD] **Not started (build)** — Blocked on PO sign-off, not on code

**🎯 Why:** No LWC should ship without a PO-approved mockup per project convention. `[inferred]`



## ⚠️ Watch out (epic-level)
- Freight-vs-claim double-recovery boundary (vs. BMS-5118 Receiving Compliance / BMS-5200 Transfer Claims) resolved via Type-partition (Freight = transportation cost only), not a technical dedupe guard — audit list view surfaces overlaps for manual review
- BMS-5792 (UI) is correctly parked at Awaiting-UI pending PO approval of the mockup — no LWC exists yet
- Live-validated end-to-end this session: $1,200 cross-state freight @ 40% coverage → $480 recoverable; $300 PO freight @ 40% → $120 recoverable, both auto-generated by the real trigger hooks (not direct service calls)

---
_Honesty: reports only what was searched — packages: OHFY-Data-Model, OHFY-OMS, OHFY-WMS, OHFY-Service-Locator · terms: Billback__c, S_BillbackCalculation, Supplier_Funding_Agreement, Transfer_Group__c, FreightBillbackService, Purchase_Order__c. Absence = **not searched**, not **doesn't exist**. Every prior-art claim is cited to `file:line`/SHA or flagged uncited. "Why" is tagged by source; `inferred` = not confirmed in code. Regenerate — pinned to `97777425c`._
