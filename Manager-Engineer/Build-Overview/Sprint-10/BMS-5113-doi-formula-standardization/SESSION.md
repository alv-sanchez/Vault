# 📦 Session Kickoff — DOI Formula Standardization (BMS-5113)

> Paste this whole file into a fresh Claude Code session as the first message,
> or tell the session: "Read this file first." It is the context seed.
> Last updated: 2026-07-13 (mid-session update — see "What's built" for latest).

**Sprint:** Sprint 9, 2026-07-13 → active.

## Scope of THIS session
BMS-5113 — DOI Formula Standardization. Do not touch other tickets/streams.

## Where the work lives
- **Per-ticket branch (BMS-3742 only):** `feat/doi-invoiced-source-bms-3742` → worktree `/Users/alvarosanchez_1/OHFY-Split-BMS-3742` → PR [#513](https://github.com/Ohanafy/OHFY-Split/pull/513) (draft)
- **Consolidated epic branch (all executable children merged):** `integration/bms-5113-validation` → worktree `/Users/alvarosanchez_1/OHFY-Split-integration-5113` (local `target-org` = `bms-5113-doi`). **This is where BMS-4544/4545 follow-on work landed — not yet split back into #513 or a separate PR.** See "What's built" below.
- **Dev org:** `bms-5113-doi` — **RE-CLAIMED 2026-07-24** (fresh pool org, id `00Dcb00000JNAYQEA5`; the prior one expired). Baseline + this branch's DOI delta (fields + `S_InventoryDOI`/`B_InventoryDOI`) deployed, seed data loaded, dry run passed. This worktree's `target-org` now points here.
  - **Field-materialization lag:** the `_60`/`_90` columns deployed as "Created" but aren't in `describe` yet — known BMS-4965 env anomaly (materialize after hours, do NOT re-deploy). Does not affect the dry run (in-memory `DoiResult`), but the nightly `B_InventoryDOI` batch-stamp needs them live first.
- **Repo:** OHFY-Split · packages: `OHFY-WMS`, `OHFY-Data-Model`
- **Docs (this folder):** `overview.md`, `overview.html`, `orientation.json`/`.md`/`.html` (strata architecture brief)
- **Jira:** https://ohanafy.atlassian.net/browse/BMS-5113

## What it is (one line)
A single, authoritative Days-on-Inventory calculation — sourced from completed invoiced quantity, not the old on-hand-decrease proxy — computed once (nightly batch) and read everywhere, with 30/60/90-day windows.

## History — why this isn't a rebuild
Standing on (already shipped, cited):
- `S_InventoryDOI.calculate()` + nightly `B_InventoryDOI` batch already stamp `Current_DOI__c`/`DOI_Status__c` on `Inventory__c` — `OHFY-WMS/force-app/main/default/classes/batchJobs/B_InventoryDOI.cls` (BMS-3779)
- `Inventory_Threshold__c` object + resolver (min/target/max DOH) already ship — `OHFY-Data-Model/force-app/main/default/objects/Inventory_Threshold__c` (BMS-3822, merged)
- `Days_of_Inventory` report type + permission set already ship — `OHFY-WMS/force-app/main/default/reportTypes/Days_of_Inventory.reportType-meta.xml` (BMS-3779)

Delta (BMS-3742):
1. **Sales-rate source swap** (extend) — day-over-day on-hand-decrease → completed invoiced quantity at item×warehouse grain. High-risk: shifts every DOI figure org-wide.
2. **30/60/90-day windows** (extend) — 6 additive `Inventory__c` fields, one aggregate query pass, and it turned out this same PR already extended the `Days_of_Inventory` report type with the 60/90-day columns (see BMS-4545 below).

Full brief with all citations: `orientation.html` in this folder.

## What's built
- **BMS-3822** — merged before this session (nothing to build)
- **BMS-3742** — draft PR #513, 21/21 tests passing, before/after proof (old proxy DOI 24 → new source DOI 48 on identical fixture).
- **DOI DRY RUN — reconciled to the customer's own spreadsheet (2026-07-24).** `orgScripts/seed-doi-bms3742.apex` seeds a fixture built from Pete Teske's `DOH DOI QQ.xlsx` and runs `S_InventoryDOI.calculateStandardWindows` live. **Riverbend IPA reproduces the sheet EXACTLY: DOI 22.5 / 45 / 67.5 for 30/60/90** (2,250,000 on-hand ÷ 3,000,000 units sold, all invoiced in the last 10 days so every window captures the same volume — the sheet's "same units sold, different divisor" mechanic). Band coverage: Harbor Lager 120/240/360 Above Max · Summit Pils 1.5/3.0/4.5 Below Min · Dune Cream Ale No Velocity Data. Seed is re-run-safe (detect-and-reuse; a Completed invoice cannot be deleted — validation rule + master-detail trigger). The **10-day window (DOI 7.5, row 1 of the sheet)** is a confirmed additive delta not yet built; the seed already stages for it.
- **BMS-4544** (Reporting Spike) — investigation complete. Confirmed BMS-3742 resolves the spike's flagged gap (no consumption-rate source existed — `Average_Daily_Depletion__c` now provides it). Made 3 decisions with best judgment (logged on the ticket): (1) warehouse-grain DOI only for this phase, supplier/brand-grain is unscoped future work; (2) use the existing native `Days_of_Inventory` report type as the surface, not a custom LWC; (3) add field history to `SKU_Override__c`'s key override fields (was the flagged audit gap). Status: **In Progress**.
- **BMS-4545** (Reporting Build) — turned out to be **already fully delivered**: the report type's 60/90-day columns shipped as part of BMS-3742's own PR diff, and FLS on the permission set already covers them. The only remaining piece (SKU_Override__c audit history, per BMS-4544's decision) was built and deploy-validated this session — **committed to the consolidated branch `integration/bms-5113-validation`, NOT yet in PR #513 or split into its own PR.** Status: **Review** (but the commit needs splitting out — see caveats).
- **BMS-4543** (Design/Prototype/Demo) — **not started yet**, next up. Not blocked (mockups don't need BMS-3742 merged, just its fields existing in the consolidated branch, which they do).

## State / caveats (honest)
- **High risk on BMS-3742 specifically, not the epic as a whole.** The one real gate left: a live before/after DOI reconciliation against real invoice/inventory data (not seed data) + PO sign-off. Cannot self-serve this — needs either real Gulf data or an explicit call on what synthetic data would be considered representative enough. Everything else in the epic is unblocked and has been worked through with best judgment where PO input wasn't strictly required.
- **Unsplit work exists on the consolidated branch.** The SKU_Override__c history change (BMS-4545) is committed on `integration/bms-5113-validation` but has no PR of its own yet. Per the user's explicit instruction this session ("consolidate the work, finish it all the way through, then split them out appropriately"), this still needs to be split into a proper branch/PR before merge — don't assume it's already reviewable in isolation.
- Don't claim the demo data proves DOI correctness at scale — it's a proof-of-mechanism on one fixture, matching the unit test exactly.

## Open questions / blockers
- None blocking further code work. BMS-3742's reconciliation gate is a verification/business step, not a design question — it needs data and a human decision, not more engineering.

## Definition of Done (from OHFY-WMS/OHFY-Data-Model CLAUDE.md + ticket AC)
- Apex tests ≥90% coverage on touched files — met on BMS-3742 (95%/92%)
- No raw SOQL/DML outside QueryService/DmlService — met
- No hardcoded `ohfy__` namespace prefix in Apex — met
- Live before/after DOI reconciliation with PO sign-off — **outstanding**, blocks BMS-3742 ready-for-review
- Code review — completed this session on all delivered pieces, no unresolved findings
- BMS-4543 mockup — **not yet built**
