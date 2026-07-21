---
title: Build Overview — what's being built & why
generated: 2026-06-29
scope: the 5 locked-down / in-progress epics + their resolved open questions
related: "[[_dashboard]]"
tags:
  - manager-engineer
  - build-overview
---

# Build Overview — what's being built & why

> [!summary] How to read this
> One section per epic: **domain · user · issue · impact · what we're building · the open questions we closed (with the judgment call) · what's still open for refinement.** Decisions were reached from **code evidence on `main` + beverage-distribution SME research + your input**; "best-judgment" items are flagged so the team can ratify them in refinement. Visual: [[Build-Overview.excalidraw]] · skim page: `Build-Overview.html`.

> [!info] Legend
> ✅ confirmed · 🧠 AI best-judgment (ratify in refinement) · 🟠 open (Gulf/PO) · 🔨 building · 🚫 not built

## 📁 Per-epic folders (encapsulated — one folder each)
Each epic has its own self-contained folder: `overview.md` + `overview.html` (styled, screen-shareable) + `diagram.excalidraw.md` (drawable). This page stays the **cross-epic rollup**; open a folder for the deep dive on one epic.
- [[BMS-4935-red-bull-allocation/overview|🟠 BMS-4935 — Red Bull Allocation]]
- [[BMS-5070-shift-end-workflow/overview|🔵 BMS-5070 — Shift-End Workflow]]
- [[BMS-5068-safety-stock/overview|🟢 BMS-5068 — Safety Stock]]
- [[BMS-5083-pick-location-capacity/overview|🔵 BMS-5083 — Pick Location Capacity]]
- [[Manager-Engineer/Build-Overview/Sprint-10/BMS-4965-short-pay/overview|🟣 BMS-4965 — Short Pay]]

---

## 1. BMS-4935 — Red Bull Allocation Import  ·  🔨 build BMS-4120
- **Domain:** Allocation & Launch Planning (OMS / Data-Model).
- **User:** **Purchasing analysts** (do the weekly entry), **warehouse teams** (receive the split), downstream **drivers + customers**.
- **Issue:** Red Bull's weekly allocation spreadsheet is split across Gulf's 5 warehouses **by hand** — slow, error-prone, no audit trail.
- **Impact:** wasted analyst time every week; bad splits → wrong stock on hand → driver-limit errors + customer complaints.
- **What we're building:** a **new `Supplier_Allocation__c` object** (kept separate from `Allocation__c`) + a **configurable CSV importer** (mapping CMDT) → validate → **split one aggregate across the 5 warehouses** (configurable %) → idempotent weekly upsert.
- **Closed questions:**
  - Extend `Allocation__c` or new object? → **New object** ✅ — *why:* `Allocation__c` is a **live order-blocking cap** (`S_AllocationEnforcement` errors any invoice line over the limit); loading supplier rows there would block real orders.
  - Split model? → **aggregate parent + per-warehouse children** 🧠 (you chose aggregate for scale).
  - File→Item key? → **SKU code** ✅ (changeable to UPC later, no rework).
  - Sell-side enforcement? → **inbound/planning only for v1** 🧠 (sell-side cap = possible v2).
  - Blocked on the file? → **No** — parsing is **configurable**, so the real file is a config change, not a rebuild.
- **Still open:** 🟠 the real **Gulf sample file** (exact columns / SKU field) — *config only.*

## 2. BMS-5070 — Shift-End Workflow  ·  🔨 build BMS-4078
- **Domain:** Warehouse Management (WMS picking / inventory).
- **User:** **Warehouse managers** + **incoming shift crews**; **finance/ops** (clean close data).
- **Issue:** shifts close with **no standardized handoff** — breakage noted informally, cycle counts not tied to the shift, pass-down context lost between crews.
- **Impact:** lost context crew-to-crew; dirty data into financial + operational reporting.
- **What we're building:** **reuse** existing breakage (`Pick_Event__c.Breakage_Quantity__c`) + cycle-count flag; build **3 new objects** — `Shift_End_Checklist__c` (the shift anchor) + checklist items + pass-down — plus a shift-config MDT, an optional cycle-count link, and a **separate** breakage-review sign-off field.
- **Closed questions:**
  - New `Breakage__c` object? → **No, reuse** ✅ (a new object would orphan the working pick-performance rollup).
  - First-class `Shift__c` object? → **No** ✅ — keep the existing shift text-key (24 Apex refs); the **checklist is the anchor**.
  - Checklist + pass-down? → **net-new** ✅ (nothing exists).
  - Shifts fixed or ad-hoc? → **fixed named shifts per warehouse** 🧠.
  - Breakage grain? → **per-picker, rolled to shift for finance** 🧠.
  - Checklist grain? → **one close per warehouse per shift** 🧠.
  - Breakage review depth? → **simple sign-off v1** 🧠 (disposition workflow = v2).
  - Pass-down? → **carries forward to next shift** 🧠.
- **Still open:** none blocking.

## 3. BMS-5068 — Safety Stock Controls  ·  🔨 build BMS-4217
- **Domain:** Inventory / replenishment planning.
- **User:** **Inventory / demand planners**; service levels (avoid stockouts).
- **Issue:** static reorder points can't flex when a supplier is slow or demand is seasonal.
- **Impact:** stockouts (or overstock) when supply conditions change.
- **What we're building:** the override **engine already shipped** (BMS-4609) → re-scope to the one genuinely-new thing: make the **DOH target actually size replenishment orders** (`E_ReplenishmentTask`), rounded to **layer/pallet**, clamped to bin capacity, with a safe fallback. Close BMS-4217 (a duplicate clone).
- **Closed questions:**
  - Rebuild the engine? → **No, close 4217 as duplicate** ✅ (it's a byte-identical clone; engine shipped via 4609).
  - Supplier-tier safety stock? → **deferred; v1 = SKU+location** 🧠 (the tier is *feasible* — supplier is reachable via `Item_Line__r.Supplier__r` — just no confirmed demand yet).
  - Order rounding? → **layer/pallet** 🧠 (beverage-DSD standard).
- **Still open:** 🟠 **architectural fork for refinement** — does DOH sizing apply to **pick-face replenishment** (Option A, what we're building) or **inbound PO sizing** (Option B)? Building A as the default; the fork is marked in code + the [[BMS-5068-replenishment-vs-po-brief|decision brief]].

## 4. BMS-5083 — Pick Location Capacity  ·  🔨 build BMS-4467
- **Domain:** Warehouse Management / Master Data.
- **User:** **Slotting / replenishment teams**, **pickers**, warehouse-layout planning.
- **Issue:** pick locations have no system-enforced **min/max stocking** based on each SKU's physical size — it's informal warehouse knowledge.
- **Impact:** over/under-filled bins; replenishment + slotting run on guesswork.
- **What we're building:** the **core already shipped** (`Pick_Location_Assignment__c` + Apex) → build the missing **native reporting** (packaged report type + 2-3 reports + a reference dashboard) + a **configurable per-warehouse min-% config**.
- **Closed questions:**
  - Canonical epic (5083 vs 4463)? → **keep 5083** ✅; flag 4463 to Elliot to close as duplicate.
  - Reporting native vs custom LWC? → **native Reports/Dashboards + packaged report type** 🧠 (ships in the managed package, upgrades centrally; LWC = cost with no payoff).
  - Min default %? → **warehouse-specific** 🧠.
  - 3785 doc drift → fix fake nouns (`Product__c`→`Item__c`, etc.) so reporting doesn't inherit them.
- **Still open:** 🟠 the per-warehouse **% values** (Gulf — config) · **Elliot** to bless closing **BMS-4463**.

## 5. BMS-4965 — Short Pay Automation  ·  🔨 build BMS-4965
- **Domain:** AR / Finance (OMS).
- **User:** **Drivers** (capture at the stop), **AR/finance** (resolution), **FL/AL compliance**.
- **Issue:** drivers receive short payments; **capture** exists (shipped under BMS-3844) but there's **no back-office** escalation, resolution, or reporting — the "approval flow" the docs promise was never built.
- **Impact:** unexplained shortfalls, manual reconciliation, no compliance trail, missed supplier claim windows.
- **What we're building:** **extend `Invoice__c`** (capture shipped) + **reuse `Credit__c`** for resolution — **zero new objects**: `Short_Pay_Status__c` review queue, configurable **per-state escalation thresholds**, `Account` repeat-offender rollups, AR suppression via FLS/permset, native EOD reporting. Close the invented-object children.
- **Closed questions:**
  - Extend vs parallel `Short_Pay__c`/`Escalation__c` model? → **extend `Invoice__c`** ✅ (the parallel model's objects don't exist + would orphan the shipped capture + `Credit__c` resolution path).
  - Thresholds? → **configurable per-state CMDT** 🧠 (values pending Gulf).
  - "Resolution"? → **`Credit__c` posted = resolved** + manual "collected" close; manager-approval optional 🧠.
  - AR suppression? → **drivers see capture only** 🧠.
- **Still open:** 🟠 **Elliot/Gulf** — the FL vs AL threshold **values** + legal driver; "resolution" operational nuance (mostly defaulted).

---

## Connecting the dots (shared substrate)
- **5068 ↔ 5083:** replenishment order-sizing (5068) **clamps to the bin capacity** that Pick Location Capacity (5083) defines (`Max_Capacity__c`). They meet in `E_ReplenishmentTask`.
- **5070 reuses** `Pick_Event__c` breakage + `Inventory_Log_Group__c` cycle-count — it's a layer *over* existing picking data, not new transactions.
- **4935** deliberately **avoids** `Allocation__c` (order-blocking) — a separate `Supplier_Allocation__c` keeps inbound supplier data away from sell-side enforcement.
- **4965** extends `Invoice__c` and reuses `Credit__c` — strictly **downstream of** the shipped 3844 driver capture.
- **The recurring theme:** across all five, the shipped capability often lives under a **sibling ticket**, and the epic's own children were **paper specs against invented objects** — so "build" mostly meant *reuse + extend what's real*, not greenfield.

<sub>Generated 2026-06-29 from the `Open-Questions/` resolutions (code-grounded SME + owner input). See each epic's note in `Open-Questions/` for full evidence.</sub>
