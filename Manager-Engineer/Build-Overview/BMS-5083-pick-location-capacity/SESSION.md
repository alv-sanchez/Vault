# 🗄️ Session Kickoff — Pick Location Capacity (Epic BMS-5083)

> Paste this whole file into a fresh Claude Code session as the first message,
> or tell the session: "Read this file first." It is the context seed.
> Last updated: 2026-07-01.

## ⚠️ Ownership / status (verified 2026-07-01)
- **BMS-5083 (epic) = ✅ DONE** — owned by **Bryson Carroll**, NOT Alvaro.
- **BMS-4467 (Reporting Build story) = In Progress** — owned by **chris**, NOT Alvaro.
- **This is NOT your active ticket.** You did demo/build exploration on it, but Jira ownership sits elsewhere. Treat this brief as **reference / demo-prep only** — don't pick it up as active build work unless reassigned.

## Scope of THIS session
Reference only — epic BMS-5083 (Pick Capacity). Do not treat as active build.

## Where the work lives
- **Branch:** `feat/pick-capacity-reporting-bms-4467` (pushed, in sync with origin)
- **Dev org:** `ohfy-val-4467`
- **Docs (this folder):** `pick-capacity-explained.html` (+ any overview)
- **OpenSpec change:** `openspec/changes/add-pick-capacity-reporting/` (`proposal.md`, `tasks.md`, `specs/pick-capacity-reporting/spec.md`)

## What it is (one line)
Give each pick bin **min/max limits derived from the product's case dimensions**, and **report** on which locations are over/under capacity. **Core engine already DONE in BMS-3785** (capacity rules from case dims); this ticket is the **reporting + surfacing layer**.

## What's built (more than just reports — verified)
- **CMDT:** `Pick_Capacity_Warehouse_Config__mdt` (OHFY-Data-Model).
- **Custom Report Type:** `OHFY-WMS/.../reportTypes/Pick_Location_Capacity.reportType` (also a `Days_of_Inventory.reportType` present).
- **Reports:** `Capacity_Compliance_by_Warehouse`, `Reclassification_Recommended_Queue`, `Override_Rate_by_Reason` (under `reports/Pick_Location_Capacity/`).
- **Dashboard:** `Pick_Location_Capacity/Pick_Location_Capacity_Overview.dashboard`.
- **LWC (yes, there IS a screen):** `OHFY-WMS-UI/.../lwc/pickLocationCapacity/` + a **tab** + **flexipage** (`org-metadata/.../pickLocationCapacity`).
- **Playwright spec:** `test-automation/tests/wms/pick-location-capacity.spec.ts`.
- Trigger config: `Validate_Span_Track_Capacity_BI/BU` (`customMetadata/triggerConfiguration/`).

## State / caveats (honest)
- ❌ **Reports are ENV-BLOCKED** — they render only in a **report-eligible org**; the scratch org / Custom Report Type deploy blocks them. This is the main open issue.
- The **`pickLocationCapacity` LWC exists** and may be demoable even while reports are blocked — worth checking in `ohfy-val-4467`.
- Story **BMS-4467 = In Progress, owned by chris** (not you). Epic **BMS-5083 = Done** (Bryson). Coordinate with them before touching anything.

## ✅ Next steps
1. **Resolve the reporting env block** — get a report-eligible org (or fix the Custom Report Type deploy) so `Capacity_Compliance_by_Warehouse` etc. render.
2. Verify the **`pickLocationCapacity` LWC + tab** in `ohfy-val-4467` — it may demo independently of the blocked reports.
3. Coordinate with **chris** (4467 owner) / **Bryson** (epic owner) before any build — this isn't your ticket.
4. Playwright + `/code-review` → `/end-ticket` → PR if anything remains open.

## ⛔ Blockers / notes
- **Env blocker:** native reports/dashboards need a report-eligible org; scratch org limitation is the thing standing between "built" and "demoable."
- Core capacity engine (BMS-3785) is already done — don't rebuild it; this ticket is reporting/surfacing only.
