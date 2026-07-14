# 📦 Session Kickoff — Supplier Freight Cost Billbacks (BMS-5161)

> Paste this whole file into a fresh Claude Code session as the first message,
> or tell the session: "Read this file first." It is the context seed.
> Last updated: 2026-07-13 (mid-session update — see "What's built" for latest).

**Sprint:** Sprint 9, 2026-07-13 → active.

## Scope of THIS session
BMS-5161 — Supplier Freight Cost Billbacks. Do not touch other tickets/streams.

## Where the work lives
- **Per-ticket branch (all 3 code tickets stacked):** `feat/po-freight-billback-bms-5791` (stacks BMS-5789 → BMS-5790 → BMS-5791) → PRs [#511](https://github.com/Ohanafy/OHFY-Split/pull/511) → [#514](https://github.com/Ohanafy/OHFY-Split/pull/514) → [#516](https://github.com/Ohanafy/OHFY-Split/pull/516), all draft, merge in that order
- **Consolidated epic branch:** `integration/bms-5161-validation` → worktree `/Users/alvarosanchez_1/OHFY-Split-integration-5161` (local `target-org` = `bms-5113-5161-integration`). **The BMS-5790 AC4 fix (freight/claim overlap audit) landed here — not yet split into PR #514 or its own PR.** See "What's built" below.
- **Dev org:** `bms-5113-5161-integration` (validated integration org, has all 3 tickets + the AC4 fix deployed, plus live demo data)
- **Per-ticket orgs:** `bms-5789-freight`, `bms-5790-freight-billback`, `bms-5791-po-billback` (this last one has a known field-visibility gap — freight fields not reachable from Apex/SOQL there despite Tooling API showing them deployed; unresolved, don't rely on it for demos — use `bms-5113-5161-integration` instead)
- **Repo:** OHFY-Split · packages: `OHFY-Data-Model`, `OHFY-OMS`, `OHFY-WMS`, `OHFY-Service-Locator`
- **Docs (this folder):** `overview.md`, `overview.html`, `orientation.json`/`.md`/`.html` (strata architecture brief)
- **Jira:** https://ohanafy.atlassian.net/browse/BMS-5161

## What it is (one line)
Captures freight cost on cross-state transfers and PO reconciliations, routing both into Gulf's existing billback pipeline (BMS-4141) rather than a new parallel recovery system.

## History — why this isn't a rebuild
The epic's own 2026-06-12 snapshot claimed `Billback__c` had only 6 fields and no supplier-agreement object existed — **both false on `main`.** Standing on (already shipped, cited):
- `Billback__c` (14 fields, counterparty-generic `Account__c`) + `Billback_Line__c` — `OHFY-Data-Model/force-app/main/default/objects/Billback__c` (BMS-4141)
- `S_BillbackCalculation` idempotent recompute pattern (deterministic External_Id, stale-line retraction, status preservation) — `OHFY-OMS/force-app/main/default/classes/services/billback/S_BillbackCalculation.cls` (BMS-4141)
- `Supplier_Funding_Agreement__c` + `S_SupplierFundingAgreement` coverage cascade — `OHFY-OMS/force-app/main/default/classes/services/billback/S_SupplierFundingAgreement.cls` (BMS-4141)

Delta (this epic's 3 code tickets):
1. **BMS-5789** (build) — 4 new fields on `Transfer_Group__c`, source-agnostic (not coupled to BMS-5154's truck builder)
2. **BMS-5790** (extend) — `S_FreightBillbackCalculation` mirrors `S_BillbackCalculation`; new Tier-1 `FreightBillbackService` (Service-Locator cross-tier hook, same pattern as `DeliveryUpdaterService`); plus a follow-on audit fix (below)
3. **BMS-5791** (extend) — second origination path, `POFreightBillbackService`, freight-scoped only

Full brief with all citations: `orientation.html` in this folder.

## What's built
- **BMS-5789** — draft PR #511, Low risk. All 3 ACs verified live.
- **BMS-5790** — draft PR #514, Med risk, depends on #511. **All 4 ACs now verified**, including AC4 (freight-vs-claim double-recovery audit), which was only partially met when the PR opened and has since been closed this session: added `Billback__c.Has_Related_Claim__c`, stamped nightly by `B_FreightClaimOverlapAudit` (`S_FreightClaimOverlapAudit` schedulable wrapper) whenever a Freight billback's source `Transfer_Group__c` also has a `Claim__c`. Surfaced on the `Freight_Billbacks` list view. Idempotent (flag reflects current state on recompute). 5 tests, 91-100% coverage. **Committed to the consolidated branch `integration/bms-5161-validation`, NOT yet split into PR #514 or its own PR** — do that before merge.
- **BMS-5791** — draft PR #516, Med risk, depends on #514. All 3 ACs verified live.
- **BMS-5792** (Design/Prototype/Demo) — mockup done, 4 design decisions resolved, parked Awaiting-UI pending PO approval.
- **Live end-to-end demo** in `bms-5113-5161-integration`: $1,200 cross-state freight @ 40% coverage → $480 recoverable billback; $300 PO freight @ 40% → $120 recoverable billback — both via real trigger hooks, not direct service calls.

## State / caveats (honest)
- All 3 code PRs are draft and individually tested green; merge order matters (#511 → #514 → #516).
- **No open questions remain on the backend tickets** — the one flagged gap (BMS-5790 AC4) is closed. The only thing still gated is BMS-5792, and that's a legitimate approval gate (no LWC ships without a PO-approved mockup), not an engineering blocker.
- **Unsplit work exists on the consolidated branch** — the freight/claim overlap audit (`Has_Related_Claim__c` + `B_FreightClaimOverlapAudit`/`S_FreightClaimOverlapAudit` + test) is committed on `integration/bms-5161-validation` but has no PR of its own. Per the user's explicit instruction this session ("consolidate the work, finish it all the way through, then split them out appropriately"), split this into its own branch/PR (or fold into #514) before merge.
- `bms-5791-po-billback` (the original per-ticket org) has an unresolved field-visibility gap — root cause not chased down, use `bms-5113-5161-integration` for anything live instead.

## Open questions / blockers
- None on the backend. BMS-5792 needs PO approval of the mockup before any LWC build starts — that's the only outstanding item in the epic.

## Definition of Done (from OHFY-OMS/OHFY-WMS/OHFY-Data-Model CLAUDE.md + ticket AC)
- Apex tests ≥90% coverage on touched files — met (92–100% across BMS-5789/5790/5791; 91%/100% on the AC4 follow-on)
- No raw SOQL/DML outside QueryService/DmlService — met
- No cross-tier concrete dependency (WMS→OMS via Service-Locator, not direct) — met
- No hardcoded `ohfy__` namespace prefix in Apex — met
- Code review — completed this session on all delivered pieces, no unresolved findings
- PO sign-off on BMS-5792 mockup — **outstanding**, blocks the UI build only (not the 3 backend PRs)
