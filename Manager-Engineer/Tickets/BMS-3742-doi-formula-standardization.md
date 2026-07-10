---
ticket: BMS-3742
title: "DOI Formula Standardization — one authoritative calculation"
epic: BMS-5113
status: Building          # Queued | Building | Awaiting-UI | Blocked | Handoff | Done
polish_verdict: Incomplete   # shipped formula partially delivers; diverges from spike on source + windows
executable: true             # buildable — but held on inputs (Jira AC + org), not on code ambiguity
risk: High                   # changes every DOI figure customers see → customer-data risk
ui: na
stream: S5-Inventory
track: inv-doi
packages_touched: [OHFY-Data-Model, OHFY-WMS]
blocked_by: [jira-access-unavailable, dedicated-org-not-claimed]
blocks: [BMS-4543, BMS-4544, BMS-4545]
branch: feat/doi-invoiced-source-bms-3742
pr:
dod_met: false
updated: 2026-07-10
jira: https://ohanafy.atlassian.net/browse/BMS-3742
tags:
  - manager-engineer
  - ticket
---

# BMS-3742 — DOI Formula Standardization

> [!info] Status
> **Blocked** (on inputs, not on code) · polish Incomplete · risk High · stream S5-Inventory · UI na
> The formula is *settled* (BMS-3817 spike). The shipped `S_InventoryDOI` already delivers a single authoritative calc but on a **proxy source**. This ticket replaces the proxy with the canonical **completed-invoiced-quantity** source and adds **30/60/90** tracking. Held pending Jira access (to confirm AC) + the dedicated org (to validate/deploy).

## Polish findings (against OHFY-Split @ main)
| Claim (from BMS-3817 spike / epic intent) | Verdict | Evidence (file:line) |
|---|---|---|
| One authoritative DOI calc, computed once, read everywhere | **Confirmed** | `OHFY-WMS/.../services/inventoryDOI/S_InventoryDOI.cls:79` `calculate()`; nightly `B_InventoryDOI.cls:47` stamps `Inventory__c.Current_DOI__c`/`DOI_Status__c`. Consumers read the stamped field. |
| Calendar-day time basis, standardized | **Confirmed** | `S_InventoryDOI.cls:143` `computeDailyDepletion` divides by observed calendar-day span; `DEFAULT_WINDOW_DAYS=30` (`:40`). |
| Sales-rate source = completed invoiced quantity (spike §4.2) | **Contradicted** | `S_InventoryDOI.cls:187-194` sums day-over-day **on-hand decreases** from `Inventory_History__c` — an on-hand proxy, not invoices. Counts transfers-out/shrink/adjustments as demand; spike warns this distorts DOI (OOS/AR repeat). |
| Track DOI at 30 / 60 / 90-day windows (spike §4.2) | **Contradicted** | Single window only: `Inventory__c.DOI_Velocity_Window_Days__c`, one `Current_DOI__c`. No 60/90 fields (`ls OHFY-Data-Model/.../Inventory__c/fields`). |
| DOI thresholds resolve per spike precedence | **Confirmed** | `S_InventoryThresholds` (BMS-3822, PR #96) + `S_InventoryDOI.resolveThresholds():219`. |

## Implementation brief (proposed — confirm against real Jira AC before build)
- **Packages:** OHFY-Data-Model (new `Inventory__c` fields), OHFY-WMS (`S_InventoryDOI`, `B_InventoryDOI`).
- **Approach:**
  1. Replace the on-hand-decrease depletion proxy with **average daily completed-invoiced quantity** at the location grain (aggregate invoice lines → item × location → base units/day). Keep the observed-span denominator behaviour. Preserve the `No Velocity Data` path when no invoices in window.
  2. Add **60/90-day** tracking alongside the existing 30-day: additive `Inventory__c` fields (`Current_DOI_60__c`, `Current_DOI_90__c` or a normalized snapshot child — decide with the reporting story). Additive only — no change to released field types (rule 8).
  3. Keep `S_InventoryDOI.calculate()` the single writer; do not add a second consumer path (comment at `:23-25` warns against a user-facing FLS bypass — respect it).
- **Files expected to change:** `S_InventoryDOI.cls`, `S_InventoryDOI_T.cls`, `B_InventoryDOI.cls`, new `Inventory__c` field metadata, `Days_Of_Inventory_Report_Access` perm set (FLS for new fields), `Days_of_Inventory.reportType` (surface new fields).
- **Risk = High:** switching the source changes every DOI figure and every `DOI_Status__c` classification customers see. Needs a before/after reconciliation on the dedicated org and a PO heads-up.

## Build log (append-only)
- 2026-07-10 — Polished against `main` (code-grounded, no Jira). Formula settled per spike; shipped calc diverges on source + windows. **Not started** — held on Jira access (AC unconfirmed) + dedicated org (cannot validate/deploy). Ready to hand to me-engineer once both are available.
- 2026-07-10 — Started build. Worktree `OHFY-Split-BMS-3742` off `origin/main`, branch `feat/doi-invoiced-source-bms-3742`. Read BMS-3817 spike doc (`practical-days-on-hand.md` §4.2) — authoritative: DOI=QOH/avg-daily-completed-invoiced-qty, source at warehouse grain, windows 30/60/90. DoD restated below. Note: Atlassian MCP unavailable in this session — Jira transition/worklog/comment must be done by orchestrator/human.

## DoD restated (from spike §4.2 + package CLAUDE.md)
- Sales-rate source = **completed** (`Invoice__c.Status__c='Complete'`, non-credit) invoiced **base units** (`Invoiced_Case_Quantity__c*Units_Per_Case__c + Invoiced_Unit_Quantity__c`) aggregated by (Item, fulfillment-warehouse) / window days. Matches `Inventory__c.Quantity_On_Hand__c` base-unit convention.
- Windows 30/60/90; 30 stays primary (released `Current_DOI__c`/`DOI_Status__c`/`Average_Daily_Depletion__c`); add additive 60/90 fields.
- Rule 4/8: freeze released `calculate()`/`classify()` signatures + released field attributes; only add overloads + additive fields.
- Rule 1: all SOQL via QueryService (GROUP BY supported). SYSTEM_MODE keeps rule-4 comment (batch background).
- Rule 7: no `ohfy__` prefix in Apex.
- **Judgment call (grain):** invoiced qty only exists at fulfillment/warehouse grain → sales rate is warehouse-grain, shared by every inventory record under that warehouse; QOH numerator stays per-record. Aligns with spike "DOI = Item × Warehouse".

## Definition of Done
- [ ] Real Jira AC confirmed (currently unread — no MCP)
- [ ] Polish clean (source + window divergence resolved)
- [ ] Implemented per AC (invoiced-qty source + 30/60/90)
- [ ] Apex + Jest tests pass, ≥90% on touched files
- [ ] `/document` run (package-affecting)
- [ ] Before/after DOI reconciliation on dedicated org
- [ ] PR opened (draft)

## Handoff (risk ≥ Med)
Held before dispatch. Two hard inputs missing: (1) live Jira AC to confirm the invoiced-qty scope and the 60/90 field shape, (2) the `bms-5113-doi` org to run the before/after reconciliation that a High-risk formula change demands. Once both land, this is a clean me-engineer run: start-ticket → implement (Data-Model fields + `S_InventoryDOI` source swap) → tests → `/document` → code-review → set-risk High → end-ticket → draft PR.
</content>
