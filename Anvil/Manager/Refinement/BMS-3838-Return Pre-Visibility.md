---
ticket: BMS-3838
title: Return Pre-Visibility
type: Polish (post-merge audit)
status: Review — shipped against Lovable prototype, AC backfill needed
file_audited: OHFY-WMS-UI/force-app/main/default/lwc/returnPreVisibility/* + WMS_UI_Wrappers (3 methods) + E_Delivery_ReturnPreVisibility
jira: https://ohanafy.atlassian.net/browse/BMS-3838
parent: BMS-3696 (Gulf — Deliveries & Mobile)
sprint: Sprint 2 (also touched Sprint 00, Sprint 1)
fixVersion: April 17, 2026 (Sprint 00)
labels: [DLV, dlv, gulf, phase-1-crawl, refinement-needed, roadmap-v2-baseline, sprint-s3-recommended]
audited_on: 2026-05-05
tags:
  - polish
  - dlv
  - gulf
  - wms-ui
  - manager
---

%%  %%
# BMS-3838 — Return Pre-Visibility

> [!info] Verdict
> **The shipped LWC matches the Lovable prototype (`bay-planner-pro.lovable.app`), which superseded Matt's earlier "lightweight load summary" outline.** The ticket itself has no acceptance criteria and a `refinement-needed` label, so this polish backfills AC against what was actually built and flags the demo scaffolding that still needs real backend wiring before broader rollout. **Substance of every requirement (Matt's UX outline + Lovable feature set) is met.** Outstanding items are scope-clarification (demo data sources) and one missing convention (Jest tests).

## Status legend

- ✅ **Met** — built, behaves as expected
- ⚠️ **Met with caveat** — built, but with demo-only data behind it
- 📝 **Not built — flagged as follow-up**
- ❌ **Not built — out of scope per Lovable / Matt's direction**

---

## What was built

### LWC bundle (`OHFY-WMS-UI/force-app/main/default/lwc/returnPreVisibility/`)
- `returnPreVisibility.js` — 750 lines, single component class
- `returnPreVisibility.html` — two-pane layout: KPI strip + reason chips on top, left filter/truck-list panel + right detail panel below
- `returnPreVisibility.css` — design tokens, KPI/chip/badge/table styling, responsive breakpoint at 1024px
- `returnPreVisibility.js-meta.xml` — exposed for `lightning__AppPage`, `lightning__HomePage`, `lightning__Tab`, Large + Small form factors

### Apex surface (3 wrapper methods → `E_Delivery_ReturnPreVisibility`)
| Wrapper | Underlying | Returns |
|---|---|---|
| `WMS_UI_Wrappers.getReturnPreVisibilityWarehouses` | `E_Delivery_ReturnPreVisibility.getWarehouses` | Top-level active non-truck Locations, ordered by name |
| `WMS_UI_Wrappers.getReturnPreVisibilityTrucks(warehouseId)` | `E_Delivery_ReturnPreVisibility.getActiveTrucks` | `TruckSummary[]` — operational trucks with inventory or active delivery, sorted by status priority |
| `WMS_UI_Wrappers.getReturnPreVisibilityTruckLoad(truckLocationId)` | `E_Delivery_ReturnPreVisibility.getTruckLoadSummary` | `TruckLoadSummary{sellableLines[], unsellableLines[]}` — per-line cases with reason codes |

Data layer reuses `E_Delivery_ItemReturn.getUnsoldInventories` / `getUnsoldLotInventories` / `getItemReturnReasons` / `getSellableItemReturnReasons` — same source of truth as the existing Item Return LWC, per Matt's direction.

---

## Requirements coverage

### From the ticket / Matt's comment (2026-04-15)

| Status | Requirement | Code evidence |
|---|---|---|
| ✅ | Read-only — no edit capability | No mutating Apex called from LWC; bay change is local-only (`returnPreVisibility.js:520-522`) |
| ✅ | Multi-truck lens (all trucks for a warehouse, single experience) | `loadAllTruckLoads` parallel preload (`js:252-275`) |
| ✅ | Warehouse picker → truck list (left) → load summary (right) | `rpv-left-panel` / `rpv-main-panel` (`html:70-399`) |
| ✅ | Reuse product-return data layer | `E_Delivery_ReturnPreVisibility.getTruckLoadSummary` delegates to `E_Delivery_ItemReturn` (`Apex:182-206`); class header docstring documents the design |
| ✅ | Lives on App Page (multi-record context) | `js-meta.xml` targets AppPage / HomePage / Tab |
| ✅ | All inventory currently on the truck | `getTruckLoadSummary` returns sellable + unsellable lines; `marginOfError` (`qty > 1/UPC/2`) drops sub-bottle rounding noise (`Apex:222, 281`) — mirrors Item Return |
| ❌ | Optional sort/group controls (sellable, pack type, reason) | Implicit grouping via row striping + reason pills + pkg column; **no user-driven sort/group control built**. Matt explicitly called these optional. |

### From the Lovable prototype (`bay-planner-pro.lovable.app`)

These features are not in Matt's original bullets but came from the Lovable mock that the description points to as "New requirement". They define what the shipped UI is.

| Status | Lovable feature | Code evidence |
|---|---|---|
| ✅ | 4-KPI strip (Expected Return Cases / Restockable / Non-Restockable / Routes Reporting) | `kpiExpectedReturnCases` / `kpiRestockable` / `kpiNonRestockable` / `kpiRoutesReporting` (`js:721-749`); `rpv-kpi-row` (`html:24-53`) |
| ✅ | REASON BREAKDOWN chips, color-coded by sellability | `reasonChips` getter aggregates across all cached truck loads (`js:693-700`); `rpv-reason-breakdown` (`html:55-65`) |
| ⚠️ | FIELD / RETURN / ARRIVED status filter buttons | `handleFilterChange` + `applyFilter` (`js:356-362, 513-518`); buttons (`html:74-111`). **RETURNING / ARRIVED categories are demo-only** — see Demo Scaffolding below. |
| ⚠️ | BAY dropdown per truck | `bayOptions` getter + `handleBayChange` (`js:520-522, 662-672`). **Bay 1-4 + Unassigned hardcoded; assignment cycles by truck index; selection does not persist.** |
| ✅ | HIGH RETURN VOLUME alert | `showHighReturnAlert` getter (`js:625-629`); `rpv-alert` (`html:285-295`). Threshold = 100 cs (hardcoded). |
| ✅ | LIVE clock (refreshes every 30s) | `refreshClock` (`js:131-153`); `rpv-live` indicator (`html:14-19`) |
| ✅ | Header subtitle: brand · warehouse · day, month date | `headerSubtitle` getter (`js:641-643`) |
| ✅ | Per-row sellable/unsellable color striping + reason pills | `decorateLine` (`js:453-489`); `rpv-detail-table` (`html:323-374`) |
| ✅ | Restockable / Non-Restockable summary boxes (per-truck) | `summaryRestockable` / `summaryNonRestockable` (`js:608-618`); `rpv-summary-row` (`html:376-397`) |
| ✅ | Detail header: truck name, status badge, route, driver, ETA, delivery number | `rpv-detail-header` (`html:229-267`) |
| ✅ | Refresh button preserves selections | `handleRefresh` (`js:524-549`) |

---

## Demo scaffolding (acknowledged in code, pending real backend)

Each of these is needed to render the Lovable lens but does not yet have a real data source. The code self-documents most of them as prototype state.

| Item | Location | Real source needed |
|---|---|---|
| `HARDCODED_ETAS` cycled by truck index | `js:17-25` | Real ETA from delivery / route data — likely `Delivery__c.Estimated_Arrival_Time__c` or route stop schedule |
| `BAY_OPTIONS` (Bay 1-4 + Unassigned) | `js:27-33` | Real Dock/Bay entity + persistence (consider linking to `Dock__c` if the dock-scheduler model already covers it) |
| `ORG_BRAND = "GULF DISTRIBUTING"` | `js:79` | Org / Account / Warehouse-driven brand |
| Random `_demoReturning` / `_demoArrived` truck pick | `js:117-118, 234-250` | Real `Delivery_Status__c` "Returning" picklist value + Delivered detection |
| Filter trucks to `Out For Delivery` only | `js:207-210` | Backend already returns 7 active statuses; widen UI once Returning/Arrived states exist |
| HIGH RETURN VOLUME threshold = 100 cs | `js:625-629` | CMDT or warehouse-level tunable knob |
| `REASON_DEFINITIONS` JS literal | `js:43-77` | Drive from `Reason_Code__mdt.Can_Resell__c`; comment already calls out the sync risk |
| Bay auto-cycle by index | `js:323` | Real bay assignment / planner output |

---

## Other follow-ups

### 📝 No Jest tests
`OHFY-WMS-UI/lwc/returnPreVisibility/` has no `__tests__/` folder. Repo convention (root and package CLAUDE.md): one test file per LWC. Apex side is covered by `E_Delivery_ReturnPreVisibility_T.cls`.

### ⚠️ Description claims breakage photos
Ticket description: *"drivers on route-based delivery already capture return data on handhelds (quantities, reason codes, breakage photos)"*. Photos are not surfaced in the LWC or in `LoadLine`. Either the description overstates the data flow or photos are a deliberate v2 — needs a decision.

### ⚠️ `<option selected={…}>` inside `<template for:each>`
`html:273-281` uses per-option `selected` instead of `<select value={selectedBay}>`. Works in practice because `selectedBay` updates trigger re-render, but non-idiomatic. One-line refactor candidate.

### ⚠️ `customfield_10040` (auto-generated technical approach) was disregarded
The auto-generated approach proposed a new `Return_Previsibility__c` object + `Return_Line__c` + handheld sync pipeline + Platform Event polling. **Correctly disregarded** in favor of Matt's "reuse return data" guidance — the simpler approach was the right call. Worth deleting or annotating that field on the ticket so future readers don't assume it was the implementation plan.

---

# Proposed Jira content (push targets)

Everything below is the content I'd push if you approve. Description is a full rewrite; AC is brand-new; the Open Questions section is new.

## Description (proposed rewrite)

> **Story Statement**
>
> As a **Gulf warehouse supervisor**, I want a single warehouse-wide pre-visibility view of every active delivery truck and its return load, so that **I can staff unloading bays and allocate restocking labor before return trucks arrive — eliminating the current blind-spot where returns show up unannounced and compete with outbound pick operations.**
>
> **Why It Matters**
>
> Gulf warehouses operate on tight cutoff windows (e.g., 10:30 AM pick lock at some locations), and unplanned returns disrupt outbound staging, inventory counts, and restocking workflows. Pre-visibility into what's coming back on each truck lets warehouse leads make labor and bay allocation decisions hours before arrival rather than reacting in real time.
>
> **Gulf Context (from Blueprint Workshops)**
> - Hard pick-lock cutoffs (as early as 10:30 AM); unexpected returns post-cutoff cannot be restocked for next-day orders — pre-visibility allows leads to sequence return intake around outbound operations.
> - Leadership identified chain-of-custody visibility from load to receipt as a critical gap; this experience closes the last-mile blind spot.
> - Drivers on route-based delivery already capture return-relevant signals (quantities and reason codes via `Inventory_Adjustment__c`); this LWC reuses that data, surfaced as a warehouse-wide lens. *(Breakage-photo capture is a separate v2 — not in this scope.)*
>
> **Reference**
> - Lovable prototype: https://bay-planner-pro.lovable.app/ (operative spec)
> - Reuses the same data layer as the existing `itemReturn` LWC, just reorganized for warehouse-wide visibility.

## Acceptance Criteria (proposed)

> **AC1 — Warehouse selection**
> - GIVEN the Return Pre-Visibility page
> - WHEN the page loads
> - THEN the user sees a warehouse picker listing all active, top-level (non-truck) `Location__c` records, ordered by Name
> - AND no truck list renders until a warehouse is selected
>
> **AC2 — Truck list for selected warehouse**
> - GIVEN a warehouse is selected
> - THEN the left panel shows operational delivery trucks (`Equipment__c.Type__c = 'Motorized Vehicle'`, `Status__c = 'Operational'`, `Truck_Location__c` populated) for that warehouse that have either inventory on board OR a non-terminal active delivery
> - AND each truck card displays: equipment name, status badge (IN FIELD / RETURNING / ARRIVED), route, driver, ETA, total cases, restockable cases, non-restockable cases
> - AND trucks are sorted by active-delivery status priority then equipment name
>
> **AC3 — Truck load summary (right panel)**
> - GIVEN a truck is selected from the left panel
> - THEN the right panel shows the truck's total cases, distinct items count, and delivery number
> - AND a row-per-line table displays: product (linked to the Item record), package type, size, reason code (when present), and case quantity, with sellable/unsellable color striping
> - AND lines below the rounding margin (`qty > 1/UPC/2`) are excluded — mirrors the Item Return LWC behavior
> - AND restockable / non-restockable summary boxes show per-truck totals
>
> **AC4 — Status filter buttons**
> - GIVEN the truck list is populated
> - WHEN the user clicks ALL / FIELD / RETURN / ARRIVED
> - THEN the visible truck list filters to that status category
> - *(NOTE: until `Delivery_Status__c` exposes "Returning" and Delivered detection is wired in, RETURN and ARRIVED are sourced from a per-warehouse demo-pick — see Open Questions.)*
>
> **AC5 — Warehouse-wide KPI strip**
> - GIVEN truck loads have finished parallel-loading
> - THEN the top KPI strip displays: Expected Return Cases (sum of all cs across all trucks), Restockable (sum of sellable cs), Non-Restockable (sum of unsellable cs), Routes Reporting (count of trucks with active delivery / total trucks for the warehouse)
>
> **AC6 — Reason breakdown chips**
> - GIVEN the warehouse-wide truck-load cache is populated
> - THEN a horizontal chip list displays each reason code with its case count, color-coded by sellability (red for unsellable; amber/blue/green for sellable variants)
> - AND chips with zero cases are hidden
>
> **AC7 — High return volume alert**
> - GIVEN a truck is selected
> - WHEN the truck's total return volume (sellable + unsellable cases) reaches the threshold
> - THEN a "HIGH RETURN VOLUME — Consider Additional Unloading Staff" alert renders next to the bay dropdown
> - *(NOTE: threshold is currently hardcoded at 100 cs — see Open Questions.)*
>
> **AC8 — Bay selector**
> - GIVEN a truck is selected
> - THEN a bay dropdown shows the truck's auto-assigned bay with options Bay 1-4 + Unassigned
> - *(NOTE: bay assignment is local-only and does not persist; auto-assignment cycles by truck index until a real bay model is wired — see Open Questions.)*
>
> **AC9 — Live header**
> - GIVEN the page is loaded
> - THEN the header shows `BRAND · WAREHOUSE NAME · DAY, MONTH DATE` plus a LIVE indicator with a clock that refreshes every 30 seconds
> - *(NOTE: brand string is currently hardcoded — see Open Questions.)*
>
> **AC10 — Read-only**
> - No interaction in this LWC writes data; all four `@AuraEnabled` reads (warehouses, trucks, truck load) are non-mutating
>
> **AC11 — Refresh**
> - GIVEN any state
> - WHEN the user clicks the refresh button
> - THEN warehouses, trucks for the selected warehouse, and the selected truck's load are re-fetched
> - AND the user's current warehouse, truck, and bay selections are preserved when still valid
>
> **AC12 — App Page targeting**
> - The component is exposed for `lightning__AppPage`, `lightning__HomePage`, and `lightning__Tab`, supporting Large + Small form factors

## Open Questions (proposed new section)

> 1. **Bay model**: should bay assignment persist? Where — `Equipment__c`, `Delivery__c`, an existing `Dock__c`/dock-scheduler entity, or a new `Bay_Assignment__c`? Driving question for AC8.
> 2. **Returning status**: do we add a `Returning` value to `Delivery_Status__c`, or derive it from another signal (e.g., `Out For Delivery` + last-stop completed)? Driving question for AC4 + the demo overlay in `js:117-118, 234-250`.
> 3. **Arrived detection**: same question — explicit picklist value, or derived from `Status__c = 'Delivered'` + recency? Driving question for AC4.
> 4. **ETA source**: which field drives the per-truck ETA? `Delivery__c.Estimated_Arrival_Time__c`, route stop schedule, or computed? Driving question for the demo overlay in `js:17-25`.
> 5. **Brand source**: org-level setting, warehouse-level, or driven by the `OrgInformation__c` / Account brand? Driving question for `js:79`.
> 6. **High Return Volume threshold**: tunable per warehouse? CMDT, picklist, or `Location__c` field? Currently hardcoded at 100 cs (`js:625-629`).
> 7. **Reason list source of truth**: drive `REASON_DEFINITIONS` from `Reason_Code__mdt` (`Can_Resell__c`) instead of the JS literal? Currently a sync risk noted in `js:35-77`.
> 8. **Breakage photos**: in scope for v2? Description claims handheld photo capture exists; not surfaced anywhere. Decision needed.
> 9. **OFD-only filter widening**: backend's `getActiveTrucks` returns 7 active delivery statuses sorted by priority, but the LWC narrows to `Out For Delivery` only (`js:207`). Widen once Returning/Arrived are real, or keep the narrow lens permanently?
> 10. **Jest tests**: per repo convention, every LWC has a `__tests__/` test file. Backfill as a follow-up ticket?
> 11. **Performance ceiling**: parallel-loads N truck loads on warehouse change; what's the expected ceiling for trucks per warehouse? At very large warehouses this may need pagination or lazy-load on truck click.

---

# Audit notes (not for Jira — engineer review only)

## What I'd add to the ticket
- Acceptance Criteria (12 items) — none existed before
- Open Questions section (11 items) — captures every demo-overlay decision the team owes itself
- Description rewrite — keeps the Story Statement / Why It Matters / Gulf Context, adds the Lovable link as the operative spec, walks back the description's breakage-photo claim into "v2"

## What I'd leave alone
- Parent epic, sprint, fixVersion, labels (the `refinement-needed` label can come off once this polish is accepted)
- Status (Review)
- Comments — they're the historical thread; keep as-is

## Suggested label change
- Remove `refinement-needed` if AC backfill is accepted
- Add `polished` (auto-applied by the polish skill on Jira write)

## What I would NOT push
- Anything that turns Open Questions into demands. The Lovable prototype is the build target; the demo overlays exist on purpose. Open Questions is "decisions we owe", not "things that are wrong".

---

**Next step (your call):**
1. Confirm push to Jira → I'll add a single Jira comment with the proposed Description / AC / Open Questions content (option 2 in the polish skill output flow)
2. Confirm push as ticket update → I'll edit the description directly + add an audit-trail comment summarizing the change (option 3)
3. Edits / pushback first — tell me what to revise
