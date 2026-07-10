---
title: BMS-5163 — Transfer Dock Optimization
epic: BMS-5163
build_story: BMS-4490
domain: Dock Management & Inbound Scheduling / Transfers
package_target: OHFY-WMS (E_DockScheduler) + OHFY-WMS-UI (dockDashboard) + maybe OHFY-Data-Model (Location__c)
branch: feat/transfer-dock-optimization-bms-4490
worktree: ~/OHFY-Split-BMS-4490
org: ohfy-4490 (keep until merged into main)
base: origin/main @ 82336e23
spec: B — Salesforce-native
status: in-progress
created: 2026-06-23
updated: 2026-06-23
---

# BMS-5163 — Transfer Dock Optimization

> [!abstract] Goal
> Add capacity-aware booking to the **already-shipped** dock scheduler: when a Transfer-Group dock appointment can't fit a dock's remaining capacity, block it with an explanation and offer an alternative dock/slot. Pure **delta** on `E_DockScheduler` + the `dockDashboard` LWC suite — no replacement.

## Polish verdict (2026-06-22)
- **Single-story `/polish` + code grounding:** exceptionally clean. Every cited artifact grounds true on `main`:
  - `Shipment__c` + dock fields, `Shipment_Time_Minutes__c` ✅
  - `E_DockScheduler` (`getDockSchedule`/`assignDock`/`updateDockAppointment`/`validateNoConflict`) ✅
  - `ShipmentTriggerService` stamps `Location__c.Dock_Status__c` ✅
  - `Location__c.Dock_Capacity_Minutes__c` ✅ (the build's key dependency — exists)
  - `Is_Dock__c`/`Is_Truck__c`; `dockDashboard`/`dockColumn`/`dockAppointmentTile`/`dockTimeAxis` ✅
  - `Bypass_Dock_Conflict__c` ✅ confirmed **absent** (ticket correctly says never implemented)
  - deprecated per-object dock fields still physically exist — ticket correctly says do not resurrect ✅
- **Buildable now.** No invented nouns, clear AC.

## ✅ Done
- [x] Branch + worktree off latest `origin/main`
- [x] Polish pass (clean — no drift, all nouns grounded)
- [x] Spec decision: **Spec B (native)** — data + UI are 100% on-platform
- [x] Org claimed (`ohfy-4490`)
- [x] **Capacity (slot-fit) guard** `enforceTransferDockCapacity` in `E_DockScheduler`, wired into `assignDock` + `updateDockAppointment` (TG-scoped)
- [x] **Alternative-dock suggestions** in the block message (capacity-fitting; free-at-time first; respects existing appointments)
- [x] **7 tests added; `E_DockScheduler` at 92%** (≥90%); all org tests pass
- [x] prettier ✓; scoped `deploy validate` (RunSpecifiedTests) ✓
- [x] Live AC verified via org-run test (anonymous-apex can't throw `AuraHandledException`)
- [x] Inline self code-review (no raw SOQL/DML, bulk-safe, additive signature)
- [x] **PR [#354](https://github.com/Ohanafy/OHFY-Split/pull/354) opened → all 7 CI checks GREEN**

## 🔵 Remaining
- [ ] **`/document`** (customer docs) — not run by the build fork (avoids subagent spawn); run before/after merge
- [ ] `/code-review` skill (subagent fan-out) — optional; inline review done
- [ ] Decision: UI surfacing kept to the toast message (no `dockDashboard` code change) — richer in-dashboard alternative picker is **phase 2**
- [ ] Merge PR #354, then release `ohfy-4490`

## ⚠️ To finalize / call out (v1 defaults — confirm with PO @Elliot Flores)
1. **Capacity semantics — RESOLVED (Option A, 2026-06-23).** Build hit a real conflict: `Dock_Capacity_Minutes__c` is a **per-operation slot length** (shipped `dockColumn.js` renders it `MIN/SLOT`; field help: "compute the end of a dock assignment window … Dock_Time + Dock_Capacity_Minutes"), **not** a cumulative daily budget as the AC's "remaining capacity" wording implies — and no daily-budget/operating-hours field exists. **Decision: Option A (field-faithful)** — block when a requested shipment duration **exceeds the dock's slot length** (or conflicts), and suggest docks/times that fit. **No new field.** Option B (new cumulative daily-capacity field on `Location__c`) deferred to phase 2 — it's a frozen 2GP schema change. **← confirm with PO; the ticket AC wording should be tightened to match.**
2. **Supervisor conflict-override** — *assumed:* **out of scope v1** (the `Bypass_Dock_Conflict__c` permission was never implemented; don't introduce it now).
3. **Legacy supplier-lane dedication** — *assumed:* **operator judgment**, not modeled as data in v1.
4. **Data prerequisite** — `Dock_Capacity_Minutes__c` must be **populated per dock** for the rule to mean anything; seed/confirm before demo.

## Build plan (Spec B, delta only)
1. **OHFY-WMS** — extend `E_DockScheduler` with capacity-aware method(s) (e.g. `suggestDockSlots`) consuming `Shipment__c` appointments + `Dock_Capacity_Minutes__c`/`Dock_Status__c`; keep `validateNoConflict` as the single conflict authority; distinguish inbound-transfer vs supplier-PO load via parent type + `Dock_Status__c`. Preserve `ShipmentTriggerService` stamping + `getDocksStillInUse()` guard.
2. **OHFY-WMS-UI** — surface block + alternative in the shipped `dockDashboard` suite via `WMS_UI_Wrappers`; ADR-0007 global DTOs if a new cross-package shape is needed. Run `/ohfy-design` for any visible change.
3. **Tests** — `E_DockScheduler` `_T` (capacity block, alternative suggestion, transfer-vs-PO, bulk), ≥90% on touched files. OpenSpec proposal expected.

## Remaining DoD gates (org: ohfy-4490)
- [ ] prettier:verify; `sf project deploy validate` (RunSpecifiedTests)
- [ ] `_T` green, ≥90% on touched files
- [ ] Chrome DevTools smoke test of the block + alternative in dockDashboard
- [ ] `/playwright-tests` (UI package change), `/ohfy-design`, `/code-review`, `/document`
- [ ] Push → PR vs `main` → CI green
- [ ] **Keep `ohfy-4490` claimed until merged into `main`**, then prompt before release

## Log
- **2026-06-23** — Branch + worktree + note created; org claim started; running in parallel with BMS-4665.
- **2026-06-23** — Build hit capacity-semantics conflict → resolved Option A (slot-fit). Implemented `enforceTransferDockCapacity` + alternatives in `E_DockScheduler`; 7 tests, 92% coverage; prettier + scoped deploy-validate green. Commits `407be3ad` (feat), `3afb19f8` (style). Pushed; **PR #354 opened, all CI green.** Org `ohfy-4490` kept claimed (per "hold until merge"). Pending: `/document`, merge, then release org.
