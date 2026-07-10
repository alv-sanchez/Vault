# 📦 Session Handoff — Practical Days on Hand (Epic BMS-5067)

> Paste this whole file into a fresh Claude Code session as the first message,
> or tell the session: "Read this file first." It is the context seed / agent handoff.
> **Last updated: 2026-07-07** (reflects the build + deploy + bug-fix that already happened).

## TL;DR — where this actually stands
**BMS-3816 and BMS-5702 are BUILT and committed** on one branch. The remaining work is **finish + ship**, not build or re-scope. Specifically:
- ✅ Built + committed (2 commits, see below) in worktree `/Users/alvarosanchez_1/OHFY-Split-BMS-5067`, branch `feat/practical-doh-variance-bms-3816`.
- ✅ Deployed + validated to `ohfy-val-5067` (4/4, 0 errors) and **seeded 78 Inventory records** across every status state for a live demo.
- ⚠️ **Two uncommitted changes in the worktree** that MUST be committed before the PR (see "Uncommitted" below).
- ⚠️ **Org `ohfy-val-5067` has since EXPIRED** — the live demo/seed is gone; reclaim + redeploy to re-demo.
- ❌ **Not pushed. No PR.** Branch is ~2 commits behind `origin/main`.

## What's on the branch (committed)
- `09cb2b35` **BMS-3816** — 3 formula fields on `Inventory__c` (`Target_DOH_Variance__c`, `Target_DOH_Variance_Pct__c`, `Target_Variance_Status__c`) + variance columns on the **Days of Inventory** report type + docs (`docs/product/wms/days-of-inventory-monitoring/`).
- `47f7c18f` **BMS-5702** — merged the 3 DOH/DOI spike docs (`docs/spikes/practical-days-on-hand*.md`) from `refactor/3817-doi-doh-spike`.
- True PR diff at merge-base: **9 files, +610 / −1** (clean; the two-dot diff looks noisy only because the branch is behind main).

## ⚠️ Uncommitted in the worktree (commit these first)
1. **The Percent-formula bug fix** — `Target_DOH_Variance_Pct__c.field-meta.xml` is **modified but not committed**. The original formula multiplied by `×100`, which is wrong for a Salesforce **Percent** formula field (it double-scaled: showed **11,524%** instead of 115%). Fixed by removing `×100` to match the house convention (every other Percent formula field in the repo uses the raw ratio). **Commit this into the 3816 change** (amend `09cb2b35` or a new `fix(data-model): …(BMS-3816)` commit).
2. **`OHFY-Data-Model/.../permissionsets/DOH_Variance_Demo.permissionset-meta.xml`** — untracked. Created to grant FLS read on the 3 new fields so the org/report could see them (newly deployed fields had no FLS). It's labeled **demo-only, not for release**. Decide: keep it out of the PR (demo artifact), or fold the FLS into the proper package permission set.

## Org / demo state
- `ohfy-val-5067` was ACTIVE (claimed 2026-07-06) — 3816 deployed + validated + **seeded**. It has since **auto-expired** (confirmed via `sf org list`; epic note updated to reflect this).
- **Seed approach** (re-runnable after reclaim): set `Current_DOI__c` + `Effective_Target_DOH__c` on existing `Inventory__c` records across all 5 states (Above/At/Below Target, No Velocity Data, No Benchmark Set), targets keyed to keg format (½/¼/⅙-BBL/Case → 30/28/25/21). Anonymous-Apex loop over `[SELECT Id, Item__r.Name FROM ohfy__Inventory__c]`; leave a slice with null target (No Benchmark) and null DOI (No Velocity) to show those states.
- **Demo assets in this folder:** `demo.html` (interactive report simulation) + `screenshots/` (3 views). These stand on their own — no org needed for a stakeholder walkthrough.

## Immediate next actions (ordered) for the picking-up agent
1. In the worktree, **commit the Pct fix + decide the permset** (keep out of PR or fold into package permset).
2. **Sync the branch** with latest `origin/main` (it's ~2 behind) — `git merge origin/main` or rebase.
3. **Push + open ONE PR** covering **BMS-3816 + BMS-5702** (title lists both keys). Follow OHFY-Split commit/PR conventions (Jira key in commits ✓).
4. **Optional (live demo):** reclaim a dev org (`bash utilityScripts/claim-dev.sh <alias>` from latest main; needs `aws sso login --profile ohanafy-dev`), redeploy the 3 fields + report type, re-run the seed, re-grant FLS.
5. Run `/code-review` on the diff; address findings.

## Package / DoD context
Repo **OHFY-Split**. Fields live in **OHFY-Data-Model** (Tier 0); report type in **OHFY-WMS**. Read those package `CLAUDE.md`s for the DoD. Data-Model is metadata-only (no Apex) — no `_T` coverage needed here since **no Apex was changed** (formula fields only). Epic note: `Epics/Inventory-Replenishment/BMS-5067-practical-days-on-hand.md`. Jira: https://ohanafy.atlassian.net/browse/BMS-5067

## History (why this isn't a rebuild)
The pre-build `/polish` flagged 3816 as "largely already on main" — because the **benchmark storage + DOH/DOI calc** (`Inventory_Threshold__c.Target_DOH__c`, `Inventory__c.Effective_Target_DOH__c`, `S_InventoryThresholds`, `B_InventoryDOI`) had already shipped. 3816 was then **re-scoped** to the remaining gap: **surfacing target-vs-actual variance** (the 3 formula fields + report columns + a "No Benchmark Set" state). That re-scoped slice is what got built here. Do **not** rebuild the shipped benchmark model.

**Code-verified (strata, `origin/main@7e0126f13`, 2026-07-08) — see `orientation.md`/`orientation.html` in this folder:**
- `B_InventoryDOI.cls:63-75` stamps `Current_DOI__c`/`Effective_Target_DOH__c` nightly (BMS-3779) — confirmed unchanged by this PR, zero new batch work.
- `S_InventoryThresholds.resolve` (`.cls:44-79`) — confirmed 4-tier waterfall (SKU override → supplier+warehouse → warehouse → supplier default) is the sole source of `Effective_Target_DOH__c`; this PR reads it, never re-implements it.
- No validation rule anywhere constrains `Target_DOH__c`/`Target_DOH_Override__c` to be positive — confirmed by listing every validation rule on both objects. This is *why* all 3 new formulas defensively treat a target ≤ 0 as "No Benchmark Set" (a real, reachable data state, not a hypothetical).
- No prior permission set in the repo grants narrow field-level FLS on `Inventory__c` reporting fields — renamed/widened to `Days_Of_Inventory_Report_Access`, now covering all 6 fields the report depends on (the 3 new variance fields + the 3 pre-existing DOI fields), closing that gap rather than leaving it for a follow-up.

---
## Build decisions (BMS-3816)

Ticket: BMS-3816 "Practical DOH — target-vs-actual variance at warehouse and location grain" (child of epic BMS-5067). Branch: `feat/practical-doh-variance-bms-3816`.

### 1. Formula fields, not batch stamping
Surfaced variance with three **formula fields** on `Inventory__c`, not by stamping in `B_InventoryDOI`. Both inputs (`Current_DOI__c`, `Effective_Target_DOH__c`) are already stamped nightly by `B_InventoryDOI`, so a formula always has them; a Text formula expresses "No Benchmark Set" cleanly via `ISBLANK(Effective_Target_DOH__c)`. Zero added batch work, always in sync, no second write path. No Apex changed → no `_T` work.

### 2. Field API names & types
- `Target_DOH_Variance__c` — Number, scale 2, label **Target DOH Variance (Days)**. Formula `Current_DOI__c - Effective_Target_DOH__c`.
- `Target_DOH_Variance_Pct__c` — Percent, scale 2, label **Target DOH Variance (%)**.
- `Target_Variance_Status__c` — Text formula, label **Target Variance Status**.

Names mirror the shipped `Effective_Target_DOH__c` / `DOI_Status__c` vocabulary. All three carry `<description>` + `<inlineHelpText>`. Placed in OHFY-Data-Model (Tier 0), same object as their inputs.

### 3. "No Benchmark Set" rendering & precedence
`Target_Variance_Status__c` resolves: `No Benchmark Set` (target blank) → `No Velocity Data` (DOI blank) → `Above Target` / `At Target` / `Below Target`. Note: **`At Target` is exact equality** (`>`/`<`), not a ±band. Numeric variance fields go **blank** (`BlankAsBlank`) when either input is missing, not `0`, so a real zero (`At Target`) is distinguishable from undefined.

### 4. % variance sign convention & divide-by-zero  ⚠️ CORRECTED
Positive variance = holding **more** than target (overstock); negative = understock. Percent guards `ISBLANK` on both inputs and `Effective_Target_DOH__c = 0`, returning `NULL` otherwise.
**The formula returns the RAW RATIO `(Current_DOI__c - Effective_Target_DOH__c) / Effective_Target_DOH__c` — do NOT multiply by 100.** A Salesforce **Percent** formula field scales the result for display itself; an explicit `×100` double-scales it (renders **11,524%** instead of 115%). The original build wrongly included `×100`; seeding the org surfaced it and it was removed to match every other Percent formula field in the repo. **This fix is currently uncommitted** (see "Uncommitted" above).

### 5. Report extension — grouping, no rollup
Added the three fields (`checkedByDefault=true`) to the **Days of Inventory** report type, after `Effective_Target_DOH__c`. Warehouse grain comes from report grouping over per-location rows — no persisted Item×Warehouse rollup (locked decision).

### 6. Docs
Extended `docs/product/wms/days-of-inventory-monitoring/usage.md` (new fields + report recipes) and added `warehouse-vs-location-variance.md` (two grains, grouping vs rollup, sign convention, blank-handling, worked examples).

### Scope confirmation
Did NOT build (out of scope): provisional new-item benchmarks, seasonal/capacity engine, CSV import, supplier-tier resolution, velocity-source changes. Did NOT rebuild the shipped model — only extended it.

### Open question for PO (non-blocking)
`No Benchmark Set` beats `No Velocity Data` in `Target_Variance_Status__c` when both are true. Chose benchmark-missing as the higher-priority signal; flip the outer `IF`s if analysts prefer otherwise. No data/$$ impact.
