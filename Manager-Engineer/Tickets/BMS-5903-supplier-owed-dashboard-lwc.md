---
ticket: BMS-5903
title: "supplierOwedDashboard LWC — calculated What This Supplier Owes rollup"
epic: supplier-owed-recovery-program
lineage: BMS-5161
status: Awaiting-UI
polish_verdict:
executable: false
risk: Med
ui: needed
stream: S2-Supplier
track: stage-4
packages_touched: [OHFY-OMS-UI]
blocked_by: [supplier-owed-02-agreement-terms-coverage-cascade, supplier-owed-03-receipt-fee-billback-source]
blocks: []
branch:
pr:
dod_met: false
updated: 2026-07-15
jira: https://ohanafy.atlassian.net/browse/BMS-5903
tags:
  - manager-engineer
  - ticket
---

# [DRAFT] supplierOwedDashboard LWC

> [!info] Status
> **Awaiting-UI (draft)** · polish — · risk Med · stream S2-Supplier · **UI needed**
> The "What This Supplier Owes" rollup from mockup §2. OMS-UI. Depends #2 (coverage) + #3 (receipt rows). Last child. No Jira key yet.

## 🎨 UI/UX approval (ui: needed)
Build stops at the real-component step until approved. **Mockup already exists** — reference it.
- Mockup: `Build-Overview/Sprint-9/BMS-5161-supplier-freight-cost-billbacks/supplier-owed-program/mockup.html` (§2 owed rollup — grand-total hero stat, per-charge-type subtotals, drill-down lines with source-document links).
- [ ] **Approved by you** — note date + any change requests below
- Change requests: …

## Business justification
The PO's headline ask, verbatim: *"a place to go and SEE what a supplier will owe you… across transfers and purchase orders (and receipts), CALCULATED rather than manually input."* Totals exist per billback today, but nothing rolls up per supplier across all open recovery, itemized by charge type. This story is that place — a read-only dashboard that computes the answer from the billback lines the detection batches already created, so the number is never manually keyed.

## Business impact
Delivers the epic's core value proposition: a single, trustworthy, calculated supplier-owed total. Turns a manual reconciliation exercise into a live view. Every dollar traces back to a source document (transfer / PO / receipt / receipt fee) via drill-down, so the supplier conversation is evidence-backed.

## Proposed logic
- LWC `supplierOwedDashboard` on the **Account record page** (and optionally an app tab with a supplier selector).
- **Header grand total** (hero stat, mockup "owed"), then a **per-charge-type breakdown** (amount, line count, % of total) for Freight / Pallet Tax / State-Line Tax / Other Tax / Receipt Fee, then a **drill-down table** of billback lines with source-document links.
- **Status filter** — Accrued / Invoiced (proposal scopes "open/will-owe" = Accrued + Invoiced; Collected + Written_Off excluded). Whether Invoiced is its own band is a PO call (proposal OQ-6).
- **Read-only** — the ledger is system-calculated; no editing.
- Aggregation is **computed on read** (not persisted): `Billback__c.Account__c` is a Lookup, so no native RUS to Account. Controller `SupplierOwedRollupController` aggregates over `Billback_Line__c` grouped by `Charge_Type__c` via `QueryService`:
  ```apex
  @AuraEnabled(cacheable=true) static SupplierOwedSummaryDTO getSupplierOwedSummary(Id supplierId, List<String> statuses)
  @AuraEnabled(cacheable=true) static List<BillbackLineDetailDTO> getLineDetail(Id supplierId, String chargeType, List<String> statuses)
  ```
- Scope: `Billback__c.Account__c = :supplierId AND Status__c IN (selected)`; sum of per-type buckets = grand total. Everything derives from `Recoverable_Amount__c` on detection-created lines → calculated, never keyed.

## Acceptance criteria
- Given a supplier with billback lines across transfers, POs, and receipts, when the dashboard loads, then it shows a grand total equal to the sum of per-charge-type subtotals, and each subtotal equals the sum of its lines' `Recoverable_Amount__c`.
- Given the Accrued/Invoiced status filter, when the user toggles it, then only billbacks in the selected statuses are included; Collected and Written_Off are always excluded.
- Given a per-charge-type row, when the user drills in, then the line-detail table lists each billback line with a link to its source document (transfer group / PO / inventory receipt / receipt fee).
- Given a supplier with claim-linked billbacks (`Has_Related_Claim__c`), when the dashboard totals, then those are handled per PO decision (epic Open Question b) — default: excluded from grand total and flagged.
- Given no open recovery for a supplier, when the dashboard loads, then it shows a zero grand total and an empty-state, not an error.
- **User-perspective happy path:** Given a supplier manager, when they open the Account page, then within one view they see the total the supplier owes, broken down by charge type, with no manual entry.

## Implementation brief
- **Packages:** OHFY-OMS-UI (Tier 4). LWC + aggregate controller; reads lines produced by #2/#3.
- **Approach:** Aggregate SOQL (`SUM(Recoverable_Amount__c) GROUP BY Charge_Type__c`) via `QueryService`; DTOs `SupplierOwedSummaryDTO` / `BillbackLineDetailDTO` in `DTOs/billback/`. `cacheable=true` read-only controller. LWC with `data-testid`; `/ohfy-design` (Tailwind `tailwindCSS_oms`). No `ohfy__` prefix in Apex; no raw SOQL/DML; dynamic AccessLevel default.
- **Files expected to change:**
  - `OHFY-OMS-UI/.../lwc/supplierOwedDashboard/` (component + `__tests__/`)
  - `OHFY-OMS-UI/.../classes/controllers/SupplierOwedRollupController.cls` + `_T`
  - `OHFY-OMS-UI/.../classes/DTOs/billback/SupplierOwedSummaryDTO`, `BillbackLineDetailDTO`
  - Account FlexiPage update (both `org-metadata/managed/` + `scratch/`)
- **Guardrails:** computed-on-read (no persisted field — see judgment call); confirm read-time aggregation volume before committing (proposal OQ-7). `/playwright-tests`; Jest per component; ≥90% Apex coverage.

## Judgment calls
- **Computed on read, not a persisted per-supplier field** — `Billback__c.Account__c` is a Lookup (no native RUS), and converting it to Master-Detail is rejected (cascade-delete semantics + released-field immutability, Hard Constraint 8). A persisted nightly-batch total is explicitly out of scope; add later only if reporting/list-views demand it (proposal §4).
- **Accrued + Invoiced as "owed"** — matches proposal scope; Collected/Written_Off are settled. Whether Invoiced deserves its own band is deferred to PO (proposal OQ-6) — build it as a filter so either interpretation is a config, not a rewrite.
- **Read-only** — the dashboard reflects detection output; editing amounts here would bypass the calculated-not-keyed guarantee the PO asked for.
- **Depends on #3 for completeness** — the dashboard renders without receipt rows, but the grand total under-reports until #3 lands; hence sequenced last.

## Definition of Done
- [ ] UI/UX approval checkbox signed (mockup referenced).
- [ ] Grand total = Σ per-type subtotals = Σ line recoverable amounts, verified live.
- [ ] Drill-down links resolve to source documents (transfer / PO / receipt / fee).
- [ ] Status filter + claim-handling per PO decisions (Open Questions b, OQ-6).
- [ ] `npm run lint` · `npm test` · Playwright (chromium) · Chrome DevTools smoke; ≥90% Apex coverage; `/polish` clean.
- [ ] Draft PR opened.

## Handoff (risk ≥ Med)
UI approval gate + two embedded PO decisions (claim double-recovery netting, Invoiced status band) + a volume confirmation on read-time aggregation. Human sign-off on mockup fidelity and those decisions before the real component is built.

## Build log (append-only)
- 2026-07-15 — Draft authored from proposal.md §4 + §5(b) + mockup.html §2 + ASSUMPTIONS A7/A8. No Jira key yet.
