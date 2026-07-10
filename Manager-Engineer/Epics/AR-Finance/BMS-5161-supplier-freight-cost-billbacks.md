---
epic: BMS-5161
title: "[REQ-234] Supplier Freight Cost Billbacks"
status: To Do
audit_verdict: Not-Decomposed   # decomposed on paper this run; children NOT yet created in Jira (Atlassian MCP unavailable)
score: 3
stream: S2-Supplier
do_not_do: false
do_not_do_reason:
executable_children: []          # none created in Jira yet — see "Proposed decomposition" below
blockers: [BMS-4951, BMS-4952]   # billback rails (In Progress) — but see note: core pipeline has since LANDED on main
build_order: []                  # see "Proposed build order" — keys assigned on Jira creation
updated: 2026-07-10
jira: https://ohanafy.atlassian.net/browse/BMS-5161
tags:
  - manager-engineer
  - epic
---

# BMS-5161 — [REQ-234] Supplier Freight Cost Billbacks

> [!summary] Verdict
> **Not-Decomposed → decomposed on paper this run.** score 3 · stream S2-Supplier. When Gulf moves product cross-state, freight incurred for a supplier's benefit should be recoverable as a **freight-typed billback** that feeds the *existing* billback rails — not a parallel recovery path. Four proposed children below. **Blocked from Jira creation this run: Atlassian MCP not connected** (see Run note).

> [!warning] The epic's 2026-06-12 code snapshot is STALE — re-audit against `main` changed the shape materially
> The paper trail said "`Billback__c` has only 6 fields … no line-detail surface … no supplier cost/agreement object exists … no one owns designing it." **All three are now false on `main`.** The billback automation (BMS-4951/4952, ticket BMS-4141) has largely landed. This shrinks the epic from "build a freight recovery subsystem" to "extend a mature, idempotent billback pipeline with a freight source." Evidence in Audit below.

## Audit

- **Children:** 0 in Jira · 4 proposed (below). Epic has never been decomposed.
- **Blocked by (paper trail):** BMS-4951 (Billback Automation, In Progress), BMS-4952 (Billback Splits, In Progress); transfer-side capture from BMS-5166 (Done), BMS-5154 (In Progress).
- **Blocked by (code reality):** the depended-on rails are **already on `main`**. The freight epic layers on top of shipped, idempotent infrastructure — the In-Progress status of BMS-4951/4952 is a paper-trail lag, not a hard code blocker. Freight generation reuses these classes verbatim.

### Shared substrate / overlap (⚠ coordinate)
- **`Billback__c` / `Billback_Line__c` schema** (OHFY-Data-Model, Tier 0) — additive picklist value + one source lookup. Additive-only on a released managed picklist (safe). ⚠ coordinate with any other billback-source epic.
- **`S_BillbackCalculation` pattern** (OHFY-OMS) — freight generation is a *sibling* service, not an edit to this one. No signature change; no overlap lock.
- **`Supplier_Funding_Agreement__c` + `S_SupplierFundingAgreement`** — reused read-only for coverage resolution. Shared with pricing floor (S_PriceResolver) — do not alter the cascade.
- **`Transfer_Group__c` / `TransferGroupTriggerService`** (OHFY-WMS) — new freight-cost fields + a completion hook. ⚠ coordinate with BMS-5154 (truck builder) which also writes Transfer_Group.

### Code evidence (against OHFY-Split @ main, 2026-07-10)
| Epic claim (2026-06-12) | Code shows @ main | Verdict |
|---|---|---|
| `Billback__c` has only 6 fields, no line-detail surface | 14 fields incl. `Account__c`, `Type__c`, `Status__c`, `Charge_Date__c`, `Coverage_Percent__c`, `Total_Recoverable_Amount__c` (roll-up); **`Billback_Line__c` object exists** (Amount, Recoverable_Amount, Coverage_Percent, source lookups) — `OHFY-Data-Model/.../objects/Billback__c/fields/`, `.../Billback_Line__c/fields/` | Contradicted (stale) |
| No supplier cost/agreement object; no one owns it | **`Supplier_Funding_Agreement__c` exists** (Supplier, Brand, Coverage_Default, Floor_Price, State, date window) + `S_SupplierFundingAgreement` owns the cascade — `OHFY-OMS/.../services/billback/S_SupplierFundingAgreement.cls` | Contradicted (stale) |
| Build on `Promotion__c.Billback__c` is forbidden (deprecating) | Still true — the live path is `Billback__c.Account__c` counterparty-generic header, no promotion coupling — `S_BillbackCalculation.buildHeader` | Confirmed |
| `IncentiveTriggerService.updateBillbacks` accumulates; recompute must replace not augment | Confirmed & already honored: `S_BillbackCalculation` is recompute/idempotent (deterministic External_Id upsert, stale-line retraction, status preservation), sets **no** `Incentive__c` — disjoint from the incentive path — `S_BillbackCalculation.cls:116-131` | Confirmed |
| "supplier owes distributor" needs new modeling | **Already native**: `Billback__c.Account__c` is counterparty-generic ("any Account — supplier, retailer, broker, intercompany"), Type includes `Generic` — `Account__c.field-meta.xml` description | Confirmed (reduces PO-side scope) |

## The extension pattern (how a freight source plugs in)
The shipped pipeline is a clean **source → attribute → coverage → header+lines** template (BMS-4141):
1. **Source lookup on `Billback_Line__c`** — existing: `Invoice_Item__c` (sale line), `Inventory_Adjustment__c` (product movement). Freight adds a **`Transfer_Group__c`** source lookup.
2. **A calculation service** (`S_BillbackCalculation.generateForInvoices`) attributes each source to a counterparty `Account`, resolves `Coverage_Percent__c` via `S_SupplierFundingAgreement.mostSpecific(...)` (agreement → `Account.Funding_Default_Coverage__c` → 100%, clamped ≤100), and upserts one `Billback__c` per (source, counterparty) + one `Billback_Line__c` per qualifying line, with **deterministic External_Ids** (`bb:{srcId}:{acctId}`, `bbl:{lineSrcId}:{acctId}`), stale-line retraction, and status preservation.
3. **Real-time hook** (`InvoiceAfterUpdate → Q_BillbackGeneration`) + **nightly backfill batch** (`B_BillbackDetection`, scheduled by `S_BillbackDetection`).
4. **`Type__c`** picklist value for the money category (`Billback`, `Rebate`, `Sample`, `Incentive`, `Generic`, `Co-op`, `MDF`) — freight adds **`Freight`** (additive to the restricted managed picklist — allowed).

Freight-specific twist: freight is a **cost the supplier owes** (debit-memo/chargeback), incurred **once per cross-state shipment (truck / `Transfer_Group__c`)**, not per SKU line. Precedent for a group-level cost: `Transfer_Group__c.Total_Transfer_Tax__c`. Cross-state derivation: `Origin_Location__r.Location_State__c != New_Location__r.Location_State__c` (`Location__c.Location_State__c` exists).

## Proposed decomposition (4 children — ready to create in Jira)
> Keys are placeholders until created. Full paste-ready specs (description · business justification · proposed logic · testable AC) in the run report. Sizing assumes AI-agent implementation — not pre-split.

| Proposed | Type | Title | Packages | Depends on |
|---|---|---|---|---|
| **A** | Story | Source-agnostic freight cost capture on cross-state transfers | OHFY-Data-Model, OHFY-WMS | — |
| **B** | Story | Freight billback generation — feed cross-state freight into the existing billback rails | OHFY-Data-Model, OHFY-OMS, OHFY-WMS | A |
| **C** | Story | PO-side optional billback — originate supplier-owes-distributor from PO reconciliation | OHFY-Data-Model, OHFY-OMS | B |
| **D** | Design/Prototype/Demo | Freight cost capture + freight-billback visibility UI | OHFY-WMS-UI (+ shared) | A (design), B (build) `ui: needed` |

**A** — `Transfer_Group__c`: add `Freight_Cost__c` (Currency), `Freight_Cost_Source__c` (picklist, source-agnostic — Truck Builder / Manual / Import / API), `Recoverable_Freight_Account__c` (Account lookup = benefiting supplier), `Is_Cross_State__c` (formula: origin state ≠ destination state). Source-agnostic per user direction — **not** coupled to BMS-5154's truck builder; any mechanism that produces a cross-state group can populate these.

**B** — Add `Billback_Line__c.Transfer_Group__c` source lookup + `Billback__c.Type__c` value `Freight`. New `S_FreightBillbackCalculation` mirroring `S_BillbackCalculation` (idempotent, deterministic External_Ids `bb:tg:{groupId}:{acctId}` / `bbl:tg:{groupId}:{acctId}`, coverage via `S_SupplierFundingAgreement`, stale retraction, status preservation, `Type=Freight`, `Account=Recoverable_Freight_Account__c`). Real-time hook in `TransferGroupTriggerService` on group completion + nightly `B_FreightBillbackDetection` backfill. **Reuses**, does not fork, the coverage cascade.

**C** — `Billback_Line__c.Purchase_Order__c` (or `Purchase_Order_Item__c`) source lookup; originate a `Type=Freight`/`Generic`, `Account=Supplier` billback when a PO reconciliation determines the supplier owes Gulf (inbound freight / short / damage). Thin origination only — see Open Question OQ-2 (the general PO-reconciliation engine belongs to BMS-4951).

**D** — Mockup + demo of freight-cost entry on a cross-state shipment and the resulting supplier freight-billback visibility. Human-approval gated (`ui: needed`), matches sibling Design/Prototype/Demo pattern.

## Proposed build order (dependency-safe)
Mostly linear — B and C both touch Data-Model + billback services (not disjoint) so they cannot parallelize:
```
Stage 1:  A (Tier 0 schema + WMS capture)            ── unblocks everything
Stage 2:  B (freight generation service + hooks)      ── depends A
          D-design (mockup) runs in parallel (no code dep)
Stage 3:  C (PO-side origination)                     ── depends B
          D-build (UI) — depends A+B, gated on D-design approval
```
No inventory-mutation lock involved (freight touches cost/receivables, not `Inventory__c`). ⚠ soft-coordinate B & D with BMS-5154 (both write `Transfer_Group__c`).

## Not-yet-executable children
| Ticket | Why skipped |
|---|---|
| A/B/C/D | Not created in Jira this run — Atlassian MCP unavailable. Specs complete; ready to create. Once created + `/polish`'d clean, A is immediately executable (self-contained Tier-0 schema); B follows A; C follows B; D-design can start anytime, D-build gated. |

## Open questions for PO
- [[BMS-5161-po-side-billback-scope]] — Is the PO-side "optional billback" (supplier owes Gulf) in THIS epic's scope, or does the general PO-reconciliation-to-billback engine belong under BMS-4951? (Story C boundary.)
- [[BMS-5161-freight-claims-boundary]] — Where is the boundary between a **freight-cost billback** (this epic) and a **carrier short/damage claim** already routed to billback rails by BMS-5118 (Receiving Compliance, Done) and BMS-5200 (Transfer Claims, Done)? Don't double-recover.

## Decisions made this run (logged)
- **DD-1 — Supplier-agreement-terms object: RESOLVED by code; no new ticket.** The epic's "no one owns designing it" is stale — `Supplier_Funding_Agreement__c` + `S_SupplierFundingAgreement` exist and own the cascade. Freight coverage reuses them. *Did not* spin up a shared-object ticket (would duplicate shipped work).
- **DD-2 — PO-side billback: mostly native.** Counterparty-generic `Account__c` already models "supplier owes Gulf." Story C is a thin *origination link*, not new philosophy. General engine → flagged to PO (OQ-2), not absorbed silently.
- **DD-3 — Freight captured at `Transfer_Group__c` (per-shipment), source-agnostic.** Precedent `Total_Transfer_Tax__c`. Not coupled to BMS-5154.
- **DD-4 — Reuse the BMS-4141 pipeline pattern verbatim** (idempotent recompute, deterministic External_Ids, coverage cascade) — no parallel recovery path, honoring Bryson Carroll's 2026-06-12 PO decision.

## Run history
- 2026-07-10 — First decomposition pass. Audited epic + 4-comment paper trail against `main`; found the depended-on billback rails have LANDED (BMS-4141) → re-shaped epic from "build subsystem" to "extend pipeline with a freight source." Authored 4 child specs, build order, 2 PO open questions, feedback doc. **Blocked:** Jira ticket creation, PO comments, polish-epic-on-children, engineer dispatch, PRs — Atlassian MCP + agent-dispatch tools not available this run. All specs staged for a Jira-connected re-run.
</content>
</invoke>
