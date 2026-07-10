---
run: 2026-07-10-BMS-5113-polish-dispatch
scope: BMS-5113 only (operator-scoped)
mode: attended / code-grounded polish-epic + dispatch attempt
tags:
  - manager-engineer
  - run
---

# Run — 2026-07-10 · BMS-5113 DOI Formula Standardization

## Scope
Operator-scoped to **BMS-5113 only** (walk phase). Goal: polish-epic → close open questions with best judgment → drive all five children (BMS-3822, 3742, 4543, 4544, 4545) to draft PRs via me-engineer.

## What I did
- **WIP check** (the epic's "Leah/Gulf" comment): found two branches — `bk/bms-3822-...` (BMS-3822, **already merged as PR #96**) and `refactor/3817-doi-doh-spike` (Leah Schneidereit's DOI/DOH spike, docs-only, unmerged). The spike **is** the authoritative Gulf requirements source for the whole DOI family. No in-flight code branches for 3742/4543/4544/4545 (no commits reference them).
- **Code-grounded polish-epic** against `main`. Found the epic ~70% already shipped:
  - BMS-3822 (Inventory_Threshold__c + S_InventoryThresholds) — **merged**.
  - The single authoritative DOI calc — **shipped** (`S_InventoryDOI.calculate()`, `B_InventoryDOI` nightly stamp, BMS-3779 PR #350).
  - `Days_of_Inventory.reportType` + `Days_Of_Inventory_Report_Access` perm set — **shipped** (covers most of "Reporting Build").
  - Real remaining gap → **BMS-3742**: shipped calc uses an on-hand-decrease *proxy* for demand; spike §4.2 mandates **completed invoiced quantity** + **30/60/90** windows.
- **Made + logged 3 product decisions** (operator empowered best-judgment): keep both DOI/DOH terms; adopt invoiced-qty source as BMS-3742 core; include 30/60/90. Signals were consistent (spike is unambiguous + matches shipped model) — no `fable` second-opinion needed.
- **Wrote papertrail:** epic note, BMS-3742 ticket note, 3 open-question notes, BMS-5113 feedback doc, this run log.

## Epics audited
- BMS-5113 — verdict **Slice** (mostly shipped; one real remaining build).

## Tickets newly executable
- **BMS-3742** — buildable, but **held** (see blocked).

## Tickets blocked / held
- **BMS-3742** — held on inputs, not code: no Jira AC readable + no dedicated org to validate a High-risk formula change.
- **BMS-4543** (Design/Prototype/Demo) — UI, human-approval gate; depends on 3742.
- **BMS-4544** (Reporting Spike) — spike, not a PR; largely answerable from shipped report type.
- **BMS-4545** (Reporting Build) — partly pre-delivered; remaining scope depends on 3742's fields.
- **BMS-3822** — no action, already merged.

## Questions raised
- 3 (vocabulary / sales-rate source / lookback windows) — resolved with best judgment, aggregated in [[BMS-5113-feedback]]. **Not posted to Jira / not tagged to PO** — Atlassian MCP unavailable this run.

## 🚫 Why no PRs shipped (hard blockers)
1. **Atlassian MCP not loaded** — `mcp__claude_ai_Atlassian__*` returns "No such tool available"; no `acli`/`jira` CLI. Cannot read ticket AC, run start/end-ticket (Jira transitions), post comments, or tag the PO.
2. **Dedicated org `bms-5113-doi` never appeared** in `sf org list` across the whole run; no `claim-dev` process running. Org-pool-only rule forbids claiming a second org. No org → me-engineer cannot deploy/smoke/reach DoD.

Dispatching engineers into a no-Jira / no-org state would build unknown AC untested and fabricate DoD — held instead.

## Wavefront
No advance. BMS-5113 remains **Slice / held**. Re-run once (a) Atlassian MCP is loaded and (b) `claim-dev.sh bms-5113-doi` lands an org — then BMS-3742 is a clean single me-engineer run.
</content>
