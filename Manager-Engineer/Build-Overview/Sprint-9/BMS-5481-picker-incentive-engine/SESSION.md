# 📦 Session Kickoff — Picker Incentive Engine (BMS-5481)

> Paste this whole file into a fresh Claude Code session as the first message,
> or tell the session: "Read this file first." It is the context seed.
> Last updated: 2026-07-13 (manager audit — pre-build).

**Sprint:** Sprint 9, 2026-07-13 → active.

## Scope of THIS session
BMS-5481 — Picker Incentive Engine (epic). The one implementable story is **BMS-5529 — Picker incentive engine and bonus visibility**. Do not touch other tickets/streams.

## Where the work lives
- **Branch:** `feat/picker-incentive-engine-bms-5481` (off latest origin/main) — currently checked out.
- **Dedicated org:** `bms-5481-picker-incentive` (claimed via `utilityScripts/claim-dev.sh`; verified Active, expires 2026-08-12). Verify: `sf org display -o bms-5481-picker-incentive`.
- **Repo:** OHFY-Split · packages: `OHFY-Data-Model` (bonus config + biweekly rollup object), `OHFY-WMS` (formula service + self-scoped controller), `OHFY-WMS-UI` (picker device view + manager bonus lookup LWC).
- **Docs (this folder):** `overview.md`, `orientation.md`, `SESSION.md`.
- **Jira:** https://ohanafy.atlassian.net/browse/BMS-5481 (epic) · https://ohanafy.atlassian.net/browse/BMS-5529 (story).

## What it is (one line)
A picker bonus = pick rate × accuracy multiplier, shown as a running "total possible payout" — pickers see ONLY their own on-device, managers get a per-picker lookup, biweekly rollups feed pay. Hard HR rule: never broadcast one picker's pay to another.

## The finding that changes everything
**The scan task model the epic says is a V1 prerequisite (#36) already exists and is LIVE on `main`.** Do not rebuild it. Both bonus operands are already computed per picker per day.

Stand on (already shipped, cited, verified @ `2cba9324c`):
- `Pick_Event__c` — live scan/labor event log; `Picker__c` → **User**; `Event_Type__c` (PICK_COMPLETE/SHORT_PICK/MIS_PICK/SESSION_START/END/scans); timestamps, `Case_Quantity__c`/`Unit_Quantity__c`, `Breakage_Quantity__c`. Written by `E_PickPath`/`E_PickPathFulfillment`/`E_ScanValidation`/`E_TransferDockScan` → `S_PickEvent.recordEvent`. — `OHFY-Data-Model/.../objects/Pick_Event__c`, `OHFY-WMS/.../services/pickPerformance/S_PickEvent.cls`
- `Pick_Performance_Summary__c` — daily per-picker rollup; `Cases_Per_Hour__c` (= pick rate), `Pick_Accuracy__c` = `(Total_Picks − Total_Mis_Picks)/Total_Picks` (= accuracy multiplier input), `Short_Pick_Rate__c`, `Picker__c`, `Date__c`. Nightly re-agg by `B_PickPerformanceSummary`. — `OHFY-Data-Model/.../objects/Pick_Performance_Summary__c`, `OHFY-WMS/.../batchJobs/B_PickPerformanceSummary.cls`
- Manager UI + service layer already exist: `E_PickPerformance`/`S_PickPerformance`, `pickPerformanceDashboard` (manager leaderboard), `pickPerformanceLeaderboard`, `pickPerformanceKpiCards`, etc. — `OHFY-WMS-UI/.../lwc/pickPerformance*`

## The delta to build (BMS-5529)
1. **Bonus-formula config** — CMDT mapping rate × accuracy → payout. (None exists.)
2. **Biweekly payroll-period rollup** per picker — only a daily summary exists; grep `biweekly|payroll|pay.period` → 0 hits. (New.)
3. **Self-scoped picker device view** — own bonus ONLY (HR crux). (New.)
4. **Manager per-picker bonus lookup** — extend existing manager UI with bonus $.
5. **Biweekly bonus report/export → payroll** — likely fast-follow; scope = Bryson's call.

## HARD build rule — HR pay privacy (do not skip, do not defer)
The existing `E_PickPerformance` is built the OPPOSITE way: `getPickerRanking` = cross-picker leaderboard; `getPickerSummaries`/`getPickerDetail`/`getPickerEvents` take an **arbitrary `pickerId`** with no self-scoping. **Do NOT reuse these on the picker device.** Build a NEW controller for the picker view that:
- forces `UserInfo.getUserId()` server-side and ignores any caller-supplied picker Id;
- has NO path to the ranking/leaderboard method;
- enforces sharing + FLS so a picker cannot query a peer's bonus/pay.
Any design where a picker can reach another's bonus is a **blocker**.

## Wrong-object warning
`Incentive__c` is the REX **sales-rep goal** incentive (Attainment/Revenue/Supplier/Billback/Goal_Template) — NOT warehouse labor. Do not overload it for picker bonuses.

## Proposed acceptance criteria (DRAFT — not yet in Jira; apply if you agree)
1. **Picker running bonus (self-only):** Given a logged-in picker, when they open the bonus view on their device, then they see their own current-period running bonus ("total possible payout") computed from their pick rate × accuracy — and no data for any other picker (verified: a second picker's Id supplied to the controller returns the caller's own record, never the other picker's).
2. **Formula config:** Given a configurable bonus curve (CMDT), when pick rate and accuracy change, then the payout recomputes per the configured mapping without a code deploy.
3. **Manager lookup:** Given a warehouse manager, when they look up a picker, then they see that picker's current-period bonus $ and the underlying rate/accuracy.
4. **Biweekly rollup:** Given a payroll period (biweekly), when the period closes, then a per-picker bonus total is available for payroll (report/export), aggregated from the daily summaries.
5. **Privacy regression:** A picker (non-manager) has no UI or API path to another picker's bonus, pay, or the leaderboard.
Suggested tests: Apex `_T` asserting the picker controller self-scopes even when passed a foreign Id; Jest for the device view; Playwright for the picker→own-bonus flow (chromium only).

## Open questions / blockers (answers in overview.md + feedback doc)
- **Q1 cutover (Bryson):** rollout timing only — build is NOT blocked; scan model exists. Recommend build now, gate turn-on.
- **Q2 bonus curve (Bryson/HR):** comp policy — recommend CMDT-configurable + placeholder for demo.
- **Q3 payroll integration (Bryson):** recommend V1 = manager-reviewed biweekly report/export; automated feed = fast-follow.
- **Q4 pay privacy:** RESOLVED in code (self-scoped controller) — not a Bryson question.
- **Q5 team vs individual (PO):** recommend individual-only V1.
- **UI gate:** picker device view + manager lookup are Tier 4 → mockup + PO sign-off before building the real LWC.

## Definition of Done (from CLAUDE.md + proposed AC)
- Apex tests ≥90% on touched files; privacy self-scope test present and green.
- No raw SOQL/DML outside QueryService/DmlService; SYSTEM_MODE cited; no explicit USER_MODE; no hardcoded `ohfy__` prefix.
- No cross-package concrete type refs violating rule 8 (bonus config CMDT + rollup object live in Data-Model Tier 0).
- `/ohfy-design` for the LWC; Playwright (chromium) for the picker flow; `/document`.
- `/code-review` clean; PO sign-off on the picker-view mockup before the real component ships.
