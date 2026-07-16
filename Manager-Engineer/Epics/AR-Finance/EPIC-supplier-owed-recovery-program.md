---
epic: BMS-5161           # stories live UNDER the existing freight epic (not a separate epic)
initiative: supplier-owed-recovery-program   # design-grouping slug (children query on `epic == slug` still — see note)
title: "Supplier-Owed Recovery Program (multi-charge-type generalization — stories under BMS-5161)"
status: To Do
audit_verdict: Decomposed        # decomposed + PUSHED to Jira 2026-07-15 as 5 stories under BMS-5161
score: 3
stream: S2-Supplier
do_not_do: false
do_not_do_reason:
executable_children: []          # none — drafts only, no Jira keys, not polished, not queued
blockers: []
build_order:                     # child stories in Jira under BMS-5161, dependency-ordered
  - BMS-5899  # charge-type-dimension (foundation)
  - BMS-5900  # agreement-terms-coverage-cascade
  - BMS-5901  # receipt-fee-billback-source        (parallel w/ 5902)
  - BMS-5902  # supplier-agreement-terms-lwc        (parallel w/ 5901)
  - BMS-5903  # supplier-owed-dashboard-lwc
lineage: BMS-5161                 # generalizes the shipped freight epic — and now lives under it
updated: 2026-07-15
jira: https://ohanafy.atlassian.net/browse/BMS-5161   # parent epic; stories BMS-5899..BMS-5903
tags:
  - manager-engineer
  - epic
---

# Supplier-Owed Recovery Program — [DRAFT epic, no Jira key]

> [!summary] Verdict
> **Decomposed on paper (draft-first — no Jira push).** score 3 · stream S2-Supplier. This is the **successor to BMS-5161** (Supplier Freight Cost Billbacks, shipped freight-only, one flat %). It generalizes that recovery pipeline into a **multi-charge-type program**: freight becomes one `Charge_Type__c` value among five (Freight · Pallet Tax · State-Line Tax · Other Tax · Receipt Fee), coverage resolves **per charge type** via a new agreement-term child object, Inventory Receipts join transfers + POs as a third billback source, and a calculated per-supplier rollup answers "what does this supplier owe me, itemized." Reuses the `Billback__c` / `Billback_Line__c` ledger unchanged — **behavioral no-op for every existing freight agreement**. Five dependency-ordered children below.

> [!note] Jira status — PUSHED 2026-07-15
> The 5 stories are now live in Jira as **children of BMS-5161** (extending that epic from freight-only to the full supplier-owed program), with dependency **Blocks** links set. Keys: **BMS-5899 → 5900 → {5901 ∥ 5902} → 5903.** Child notes carry their real `ticket:` + `jira:` now. Still **not polished, not queued** — `/polish` each against `main` before build. Design source of truth: `Build-Overview/Sprint-9/BMS-5161-supplier-freight-cost-billbacks/supplier-owed-program/{proposal.md, ASSUMPTIONS.md, mockup.html}`.

## Audit

- **Children:** 5 total · 0 executable yet (drafts; not in Jira, not polished).
- **Lineage:** generalizes [[BMS-5161-supplier-freight-cost-billbacks]] (shipped A→BMS-5789, B→BMS-5790, C→BMS-5791, D→BMS-5792). Everything BMS-5161 built is **reused**, not replaced — freight folds into the charge-type model as one value.
- **Verified against source:** `Supplier_Funding_Agreement__c` (`Coverage_Default__c`, `Floor_Price__c`, `Supplier__c`, `Brand__c`, `State__c`), `Billback__c` (14 fields incl. `Type__c`, `Status__c`, `Total_Recoverable_Amount__c` RUS), `Billback_Line__c` (source lookups + `Recoverable_Amount__c`), calc engines `S_FreightBillbackCalculation` / `S_POFreightBillbackCalculation` + `S_SupplierFundingAgreement` cascade — all on `main` per proposal.md §1.

### Shared substrate / overlap (⚠ coordinate)
- **`Billback__c` / `Billback_Line__c` ledger** (OHFY-Data-Model, Tier 0) — ⚠ **coordinate with the shipped BMS-5161 path.** This epic adds `Charge_Type__c` + an `Inventory_Receipt_Fee__c` source lookup to `Billback_Line__c`, and a `Supplier Recovery` value to `Billback__c.Type__c`. All additive/2GP-safe, but the same released managed objects BMS-5161's children (5789/5790/5791) touch. Sequence after those PRs land to avoid metadata collision.
- **`S_SupplierFundingAgreement` coverage cascade** (OHFY-OMS) — this epic *extends* the resolver to be per-charge-type. It is **shared with `S_PriceResolver` floor-price resolution** (Floor_Price__c lives on the same agreement). ⚠ regression risk — terms carry coverage only, never floor (see Open Question c).
- **Freight calc engines** (`S_FreightBillbackCalculation` / `S_POFreightBillbackCalculation`) — child #2 swaps their direct `Coverage_Default__c` read for the term-aware resolver; must be a no-op absent term rows. Hard Constraint 4: released `@namespaceAccessible` signatures get overloads + shims, never in-place changes.
- **`Inventory_Receipt_Fee__c` / `Inventory_Receipt__c`** (OHFY-WMS domain) — child #3's new source. No inventory-mutation lock (recovery touches receivables/cost, not `Inventory__c`).

## Executable children — live (auto-updates from ticket notes)
> Draft slug used in place of a Jira key. Live query over `Tickets/`.

```base
filters:
  and:
    - file.inFolder("Manager-Engineer/Tickets")
    - epic == "supplier-owed-recovery-program"
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

## Build order (dependency-safe — this IS the build order)
```
Stage 1:  #1 Charge_Type dimension (Tier 0 Data-Model)           ── foundation, unblocks all
Stage 2:  #2 Supplier_Agreement_Term__c + per-type cascade        ── depends #1
Stage 3:  #3 Receipt-fee billback source   (depends #1, #2)  ─┐
          #4 supplierAgreementTerms LWC     (depends #2)      │  #3 (OMS/WMS backend) and #4
          #3 and #4 are package-disjoint → PARALLEL           ┘  (OMS-UI) can run in parallel
Stage 4:  #5 supplierOwedDashboard LWC     (depends #2, and #3 for receipt rows)
```
- **#1** `supplier-owed-01-charge-type-dimension` — Data-Model only. Add `Charge_Type__c` global value set to `Billback_Line__c`; backfill freight lines → Freight. Risk Low, ui na. No deps.
- **#2** `supplier-owed-02-agreement-terms-coverage-cascade` — Data-Model + OMS. New `Supplier_Agreement_Term__c` M-D child; per-charge-type cascade in `S_SupplierFundingAgreement`. Risk Med, ui na. Depends #1.
- **#3** `supplier-owed-03-receipt-fee-billback-source` — OMS + WMS. New `Inventory_Receipt_Fee__c` billback source + detection batch. Risk Med, ui na. Depends #1, #2.
- **#4** `supplier-owed-04-supplier-agreement-terms-lwc` — OMS-UI. Per-charge-type split editor (mockup §1). Risk Med, **ui needed**. Depends #2.
- **#5** `supplier-owed-05-supplier-owed-dashboard-lwc` — OMS-UI. Calculated "What This Supplier Owes" rollup (mockup §2). Risk Med, **ui needed**. Depends #2 (+#3 for receipt rows).

> Hand-off to `/work-epic`: children #3 + #4 are the only within-epic parallel pair (disjoint packages). Everything else is linear. Let `work-epic` form PR groups from this.

## Not-yet-executable children
> All 5 are drafts — no Jira keys, not polished, not queued. Nothing is executable until created in Jira and polished clean against `main`.

| Ticket | Why skipped |
|---|---|
| #1–#5 | Draft-first: no Jira key, `/polish` not run. Specs complete + grounded in proposal.md. #1 is immediately executable once created + polished (self-contained Tier-0 schema); #2 follows #1; #3+#4 parallel after #2; #5 last. |

## Open questions for PO
> Must be raised before #2/#3 build. Granular notes + Jira comments deferred until the epic is created in Jira (draft-first).

- **(a) Transfer-tax provenance — likely a 6th story or explicit out-of-scope.** Transfers expose only `Transfer_Group__c.Total_Transfer_Tax__c` (a single Currency) + `Is_Cross_State__c` — tax is **NOT itemized by kind**. So Pallet Tax vs State-Line Tax vs Other Tax **cannot be split on the transfer side** from shipped data. Receipt side is fine (`Inventory_Receipt_Fee__c.Cost_Type__c` is itemized). Decision: (i) accept a heuristic — "State-Line if `Is_Cross_State__c`, else Other Tax" — and only itemize taxes on receipts, OR (ii) fund a 6th story adding an itemized tax-type field on `Transfer_Group_Adjustment__c`, OR (iii) declare transfer-tax splitting out of scope for this epic. **Recommendation: (i) heuristic now, (ii) later if customers demand transfer-level tax detail.**
- **(b) Claim double-recovery interaction.** `Billback__c.Has_Related_Claim__c` exists but nothing structurally prevents the same freight/tax dollars being recovered via BOTH a billback and a supplier claim (BMS-5118 Receiving Compliance / BMS-5200 Transfer Claims routed claims to billback rails). Does the supplier-owed rollup **exclude** claim-linked billbacks, **flag** them, or **net** them? Affects #5's aggregation scope. **Recommendation: flag + exclude from the grand total by default, with a toggle.**
- **(c) Floor-price / coverage shared-resolution regression risk.** `Floor_Price__c` and coverage both resolve through `S_SupplierFundingAgreement`. Adding per-type terms must not perturb floor resolution (terms carry coverage only, never floor). Requires regression tests on `S_PriceResolver.applyFloorMakeWhole` callers. **Recommendation: hard requirement on #2 — floor path untouched, term rows coverage-only, regression suite green.**

Secondary (from proposal §8, lower urgency): overlapping-term UI block, fee-taxonomy CMDT mapping, "Invoiced" status band on the dashboard, read-time aggregation volume.

## Decisions made this run (logged)
- **DD-1 — Reuse the ledger, don't rebuild.** `Charge_Type__c` is a line dimension; no new billback object. Inherits lifecycle + RUS. (proposal §2, A1/A2.)
- **DD-2 — Per-type coverage → new M-D child `Supplier_Agreement_Term__c`.** `Coverage_Default__c` stays as fallback → zero migration for existing freight agreements. (proposal §3, A3.)
- **DD-3 — Supplier rollup is CALCULATED on read** (Apex aggregate), not persisted — `Billback__c.Account__c` is a Lookup, native RUS to Account impossible, M-D conversion rejected (cascade-delete + released-field immutability, Hard Constraint 8). (proposal §4, A7.)
- **DD-4 — Freight folds in as `Charge_Type = Freight`** — behavioral no-op for existing customers; a one-time backfill stamps existing lines. (proposal §6, A10.)
- **DD-5 — Transfer tax split deferred to PO (Open Question a)** — did not silently pick a heuristic; the itemization limit is a real data gap flagged as a possible 6th story.

## Run history
- 2026-07-15 (draft-first decomposition) — Turned `proposal.md` + `ASSUMPTIONS.md` + `mockup.html` into an epic note + 5 dependency-ordered child drafts under `Tickets/`. No Jira push (no keys assigned). Lineage recorded to shipped BMS-5161. Three PO open questions staged (transfer-tax provenance, claim double-recovery, floor-price regression) — granular notes + Jira comments pending epic creation in Jira.
- 2026-07-15 (Jira push) — Created the 5 stories in Jira as **children of BMS-5161** (per PO: "they need to live in here"): BMS-5899 (charge-type-dimension), BMS-5900 (agreement-terms-coverage-cascade), BMS-5901 (receipt-fee-billback-source), BMS-5902 (supplier-agreement-terms-lwc), BMS-5903 (supplier-owed-dashboard-lwc). Added dependency **Blocks** links (5899→5900→{5901,5902}; 5900,5901→5903). Backfilled `ticket:`/`jira:` into each child note and renamed to `BMS-XXXX-slug.md`. Parent linkage verified (BMS-5903.parent = BMS-5161). Not polished/queued yet.
