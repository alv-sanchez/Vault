---
key: BMS-5481
kind: strata-orientation-epic
repo: OHFY-Split
verified_at_sha: 2cba9324c
generated: 2026-07-13
packages_touched: ["OHFY-Data-Model", "OHFY-WMS", "OHFY-WMS-UI"]
children: ["BMS-5529"]
tags: [manager-engineer, strata, orientation, epic]
---

# 🪨 Orientation (epic) — BMS-5481 Picker Incentive Engine

> **Thesis:** The epic's stated V1 prerequisite — "scan task model (#36)" — is **already shipped and live on `main`.** The entire raw-signal layer (`Pick_Event__c`) and the daily per-picker rollup (`Pick_Performance_Summary__c`, with `Cases_Per_Hour__c` = pick rate and `Pick_Accuracy__c` = accuracy multiplier) that the bonus formula "pick rate × accuracy multiplier" needs **both already exist and are computed nightly.** So this epic shrinks from "build a labor-tracking + incentive subsystem" to "add a bonus-formula config + a payroll-period rollup + a self-scoped picker view on top of an existing, populated performance pipeline." The one genuinely new, load-bearing design constraint is HR pay-privacy — and the existing performance layer is built the *wrong* way for it (manager leaderboard, arbitrary-picker queries), so the picker-facing view must be built fresh with hard self-scoping.
> _Code-verified against `OHFY-Split` @ `2cba9324c` · 2026-07-13_

## 🎯 Why now
- Gulf on-site backlog (Day 4 — Ops Demo, on-site #38), proposed P1, tier Go-live. Pickers should see a running bonus to drive throughput/accuracy; managers need per-picker lookup; biweekly rollups feed pay. `[jira]`
- **Hard HR constraint (from the story):** never broadcast pay. A picker may see ONLY their own running bonus. Any design that could leak one picker's pay/bonus to another is a **blocker**, not a nice-to-have. `[jira]`

## 🏛️ Bedrock — what already exists (the stale-premise finding)
The epic frames the incentive engine as gated on first building the scan task model (#36). **That premise is stale.** The scan/labor model is shipped, live, and feeding data:

- **`Pick_Event__c` — the scan-in/scan-out task model (#36), already shipped and populated.** Per-event log with `Picker__c` (→ **User** lookup — the picker→User linkage the engine needs), `Event_Type__c` (restricted picklist incl. `PICK_COMPLETE`, `SHORT_PICK`, `MIS_PICK`, `SESSION_START`/`SESSION_END`, `PRODUCT_SCAN`, `ORIGIN_SCAN`, `DEST_SCAN`, `PAUSE`/`RESUME`), `Timestamp__c`/`Source_Timestamp__c`, `Case_Quantity__c`/`Unit_Quantity__c`, `Breakage_Quantity__c`, `Was_Picked_Late__c`, scan geo + scanned value fields — `OHFY-Data-Model/force-app/main/default/objects/Pick_Event__c/fields/` `[code]`
- **`Pick_Event__c` is written live by the actual scan flows** — sole write path `S_PickEvent.recordEvent(s)` (`OHFY-WMS/.../services/pickPerformance/S_PickEvent.cls`), called from `E_PickPath`, `E_PickPathFulfillment`, `E_ScanValidation`, `E_TransferDockScan`. So the raw signal isn't theoretical — it's flowing today. `[code]`
- **`Pick_Performance_Summary__c` — the daily per-picker rollup already ships with BOTH bonus operands pre-computed.** `Cases_Per_Hour__c` (formula: `Total_Cases_Picked__c / (Total_Pick_Time_Seconds__c/3600)` = **pick rate**), `Pick_Accuracy__c` (formula: `(Total_Picks__c − Total_Mis_Picks__c)/Total_Picks__c` = the **accuracy multiplier input**), plus `Short_Pick_Rate__c`, `Orders_Per_Hour__c`, `Total_Mis_Picks__c`, `Total_Idle_Time_Seconds__c`, `Picker__c` (→ User), `Date__c` — `OHFY-Data-Model/.../objects/Pick_Performance_Summary__c/fields/` `[code]`
- **`B_PickPerformanceSummary` re-aggregates the daily summary nightly** (schedulable batch, 7-day lookback, stale detection, abandoned-session handling) — `OHFY-WMS/.../batchJobs/B_PickPerformanceSummary.cls` `[code]`
- **Service + manager UI layer already exists:** `E_PickPerformance` / `S_PickPerformance` (`getPickerSummaries`, `getPickerRanking`, `getPickerDetail`, `getPickerEvents`) and a full WMS-UI suite — `pickPerformanceDashboard` (self-described "**manager view … with leaderboard**"), `pickPerformanceLeaderboard`, `pickPerformanceKpiCards`, `pickPerformanceTrend`, `pickPerformanceDetail`, `pickAccuracyFunnel` — `OHFY-WMS-UI/force-app/main/default/lwc/pickPerformance*` `[code]`

## ⚠️ The HR crux — the existing performance layer is built for the *opposite* of the HR constraint
- **`E_PickPerformance` exposes a cross-picker leaderboard and takes arbitrary picker IDs.** `getPickerRanking(...)` returns ranked summaries across all pickers; `getPickerSummaries`/`getPickerDetail`/`getPickerEvents` accept a caller-supplied `pickerId`/`pickerIds` and do **not** self-scope to `UserInfo.getUserId()` in non-test code (`OHFY-WMS/.../executables/pickPerformance/E_PickPerformance.cls`). The dashboard is explicitly a **manager leaderboard**. `[code]`
- **Implication (hard build rule, not an open question):** the picker-facing "my running bonus" device view must **not** reuse these methods as-is. It needs a **new self-scoped controller** that forces `UserInfo.getUserId()`, ignores any caller-supplied picker Id, is denied the ranking/leaderboard method, and enforces sharing/FLS so a picker cannot reach a peer's bonus/pay. Reusing `getPickerRanking` on a picker device = pay leak = blocker. `[code]`

## 🧭 Shape (intended)
`Pick_Event__c (live scan feed) → B_PickPerformanceSummary (nightly) → Pick_Performance_Summary__c (daily: Cases_Per_Hour × Pick_Accuracy) → [NEW] bonus-formula config (rate × accuracy → $ payout) → [NEW] biweekly payroll-period rollup per picker → { [NEW] self-scoped picker device view (own bonus only) · manager per-picker bonus lookup (extends existing manager UI) · [NEW] biweekly bonus report/export → payroll }`

## 🧱 The child — understood

### BMS-5529 — Picker incentive engine and bonus visibility  `Backlog · labeled polished`
> **Thesis:** Buildable now. The data rails and both formula operands exist; the delta is the reward mapping, the payroll-period rollup, and a privacy-safe picker view.

**🔨 Delta (what must actually be built):**
- [BUILD] **Bonus-formula config** — maps `Cases_Per_Hour__c` × `Pick_Accuracy__c` → "total possible payout." No reward schedule / bonus-curve config exists on `main` (grep for pay/bonus/wage/payroll objects → only unrelated `Payment__c`). Recommend a **CMDT** so the curve tunes without redeploy. `[code: absent]`
- [BUILD] **Biweekly (payroll-period) rollup per picker** — nothing biweekly/payroll-period exists (grep `biweekly|payroll|pay.period` across WMS + Data-Model → zero hits); only the *daily* summary + nightly batch exist. New period object or aggregate-on-read over `Pick_Performance_Summary__c`. `[code: absent]`
- [BUILD] **Self-scoped picker device view (HR-safe)** — own running bonus only; new controller forcing `UserInfo.getUserId()`; no leaderboard access. `[code: absent]`
- [EXTEND] **Manager per-picker bonus lookup** — the manager performance UI exists; add a bonus-$ lookup surface. `[code: partial]`
- [BUILD, likely fast-follow] **Biweekly bonus report/export → payroll** — "rollups feed picker pay." No payroll integration exists; scope of automation is a Bryson decision (below). `[code: absent]`

**🎯 Why:** Drive picker throughput + accuracy with a visible, privacy-safe bonus. `[jira]`

**⚠️ Watch out:** `Incentive__c` exists but is **the wrong object** — it's the REX/sales-rep goal incentive (`Attainment__c`, `Attainment_Revenue__c`, `Supplier__c`, `Billback__c`, `Goal_Template__c`, `Is_Team_Incentive__c`, `Is_On_Premises__c`), tied to sales goals, not warehouse labor. Do **not** overload it for picker bonuses — picker bonus is a distinct concept. `[code]`

## ⚠️ Watch out (epic-level)
- **The epic's dependency premise ("V1 = scan task model 36") is stale for the incentive engine** — #36's data model is already shipped and live. The incentive engine is **not** technically blocked on building it. What remains is business/rollout, not engineering prerequisite (see feedback doc / open questions).
- **HR pay-privacy is a build blocker enforced in code**, resolvable without a customer decision — do not defer it to Bryson.
- **UI ticket:** the picker device view + manager lookup are `-UI` (Tier 4) work → hard human-approval gate on the real component (mockup → PO sign-off) before build, per project convention.

---
_Honesty: reports only what was searched — packages: OHFY-Data-Model, OHFY-WMS, OHFY-WMS-UI · terms: Pick_Event__c, Pick_Performance_Summary__c, S_PickEvent, B_PickPerformanceSummary, E_PickPerformance, Incentive__c, biweekly/payroll/bonus/pay. Absence = **not searched OR grep-confirmed absent** (noted inline as `code: absent`), not proof of non-existence beyond the searched terms. Every prior-art claim cited to file/SHA. Pinned to `2cba9324c`._
