---
title: Quick-Win Epic Prioritization
project: OHFY / BMS
assignee: Alvaro Sanchez
created: 2026-06-22
source: Jira (project=BMS, issuetype=Epic, label=sf-tracker, assignee=Alvaro)
scope: 30 active epics (Done excluded), 102 child stories analyzed
---

# Quick-Win Epic Prioritization

> [!tldr] Bottom line
> Of the 30 active epics, the work that can be **built immediately**, **demoed for feedback**, and stays **small/low-risk** clusters almost entirely around features whose **core story is already Done/demoed** and that **extend already-shipped Salesforce primitives** rather than build net-new infrastructure.
>
> **Start here → `BMS-5163` Transfer Dock Optimization** (ticket **BMS-4490**). It's a pure delta on the *already-shipped* dock scheduler + `dockDashboard` LWC, has a crisp acceptance criterion, the capacity field already exists, and the result (a "slot blocked — try this dock/time instead" message) demos in the existing UI on day one.

## How this was scored

Each epic's child stories were read in full. Scored 1–5 (5 = best) on four axes, then a weighted composite (immediate + visibility + build-ready weighted most):

| Axis | What earns a high score |
|---|---|
| **Build-ready** | Clear ACs, spec decided, stories broken down, few open blocking questions |
| **Immediate** | No external/integration dependency; *extends shipped primitives* ("delta that extends — not replaces") rather than net-new infra/auth/object |
| **Visibility** | Produces something demoable for feedback — UI views, dashboards, validation messages, generated docs, notifications |
| **Small scope** | Little real remaining work (Done stories discounted); few net-new pieces |

---

## 🟢 Tier 1 — Build now (true quick wins)

These have a shipped/demoed foundation, extend existing platform code, and surface something a user can see.

| Rank | Epic                                          | Score | Starter ticket                 | Why it's a quick win                                                                                                                                                                                                                  |
| ---- | --------------------------------------------- | ----- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | BMS-5163 Transfer Dock Optimization           | 4.7   | BMS-4490 Build                 | Pure delta on the *shipped* `E_DockScheduler` + `dockDashboard`; capacity field (`Dock_Capacity_Minutes__c`) already exists; block-over-capacity + suggest-alternative message demos in existing UI. Lowest risk, highest visibility. |
| 2    | BMS-5064 Backstock Prioritization             | 4.3   | BMS-4221 [Production Ready]    | Concept already demoed Apr 17; remaining work productionizes a picker-facing priority sequence on shipped backstock logic.                                                                                                            |
| 3    | BMS-5068 Safety Stock Controls                | 4.0   | BMS-4217 (clone)               | Core Done & demoed Apr 17; remainder is incremental override-management UI + expiry notifications. *Watch:* confirm replenishment-calc integration actually landed in BMS-4025.                                                       |
| 4    | BMS-5071 Multi Pick Locations                 | 4.0   | BMS-4222 [Production Ready]    | Parallel-pick concept demoed Apr 17; extends shipped location hierarchy. Reporting spike/build adds tail scope — defer it.                                                                                                            |
| 5    | BMS-5162 Minimum Transfer Quantity Thresholds | 3.7   | BMS-4665 Build                 | SF-native, builds on shipped `Inventory_Threshold__c`/`SKU_Override__c` pattern + existing transfer status machine; planner sees a real block-at-commit message. Decide hard-block vs override (default hard-block for v1).           |
| 6    | BMS-5074 Crane SKU Flagging                   | 3.7   | BMS-3783 [Design]              | Additive flag/badge on existing SKU/location data, visible during receiving/putaway/order-build. Scope to the flag only — resist truck-builder integration creep.                                                                     |
| 7    | BMS-5083 Pick Location Capacity               | 3.7   | BMS-4465 Design/Prototype/Demo | Core capability shipped; the design/prototype/demo child is purpose-built to get eyes on for feedback.                                                                                                                                |

> [!tip] Recommended first sprint
> **BMS-4490 (dock optimization)** then **BMS-4665 (min-transfer threshold)** — both are SF-native validation/optimization deltas on shipped objects with visible user messages, no design/spike gate, and a one-PR demo. Pair them with productionizing **BMS-4221 / BMS-4222** (already-demoed picker features) for fast warehouse-user feedback.

## 🟡 Tier 2 — Quick win only if scoped (big epic, small demoable slice)

Don't take the whole epic — carve the slice noted.

| Epic                                           | Score         | Take this slice                                                                                                                                                                                       | Defer / blocker                                                                                                                                            |
| ---------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BMS-4995** Retailer Online Ordering          | 4.3 *(slice)* | **BMS-5344** — CSS bug: reorder pricing banner blue-on-blue, unreadable in themed storefronts. Documented root cause + repro + sibling pattern to copy. One-PR before/after demo to every themed org. | Whole epic is large; Cart Ph1–3, catalog, allocation, account-mgmt v2 are Needs-Refinement w/ TBD ACs + deps on PRC pricing waterfall, FL/AL tax, AR sync. |
| **BMS-4996** Retailer Engagement Notifications | 3.3           | **BMS-4073** email order-confirmation slice — reuses shipped `OrderConfirmationService` / `Notification_Log__c`. Customer-facing, demoable.                                                           | SMS (Twilio) + abandoned-cart scheduler add infra dependency.                                                                                              |
| **BMS-5063** Inventory Snapshotting            | 3.3           | **BMS-3825** via **Spec B (SF-native)** — count-baseline snapshot extending shipped `B_Inventory_HistoryTracker`; reconciliation LWC is the demo. v1 = on-hand/available only.                        | Spec A (off-platform) = net-new infra, no SF write path → avoid. Settle spec choice + 3 scope questions first.                                             |

## 🟠 Tier 3 — Not yet (blocked, low-visibility, or data-immature)

| Epic | Score | Why it waits |
|---|---|---|
| BMS-5061 Inventory Historical Snapshot | 3.0 | Core Done; leftover is a V2 spike pending Gulf cadence decision. Low remaining surface, low visibility. |
| BMS-4966 Short Pay Exposure Dashboard | 2.7 | Very demoable, but upstream short-pay pipeline (ePOD → invoice → adjustment) likely not ready → premature. |
| BMS-5129 Route Profitability Analytics | 2.7 | Demoable but data-assembly heavy (cost, utilization, budget) + role-based security; needs decomposition + data foundation. |
| BMS-5067 Practical Days on Hand | 2.3 | The "target/practical" layer the DOI spike explicitly deferred; depends on threshold foundation + new-item benchmarks. |
| BMS-5070 Shift-End Workflow | 2.3 | Large multi-phase; gated on schema spike (BMS-4077); net-new breakage tracking. |
| BMS-5113 DOI Formula Standardization | 2.0 | Well-defined slice already shipped; remainder is invisible backend math with undecided formula spec. |
| BMS-5060 Days of Inventory (DOI) | 2.0 | Only child is a Done spike; real build lives in sibling tickets (3742/3822) outside this epic. |

## 🔴 Tier 4 — Blocked on spikes or external integration (avoid for now)

| Epic | Score | Hard blocker |
|---|---|---|
| BMS-5160 AL Transfer Certificate Automation | 1.9 | Greenfield behind spike BMS-4088; legally-required PDF-at-departure → hardest infra (doc-gen + event-driven), no repo precedent. |
| BMS-5158 Variance Gating on Transfers | 1.8 | Greenfield variance object + received-count capture dep; unresolved status-machine design; gated by design demo BMS-4729. |
| BMS-4935 Red Bull Allocation Import | 1.7 | Blocked on external Red Bull file format + spike BMS-4119; net-new import pipeline. |
| BMS-5156 State Reporting Automation (AL/FL) | 1.7 | Gated behind spike BMS-4093; undecided build-vs-native; net-new infra; hard phase chain. |
| BMS-5139 Supplier Portal: Payment Method Capture | 1.7 | External Payments-module integration, multi-entity GL, PCI-sensitive verification. |
| BMS-5148 Supplier Portal: Order Recommendations | 1.7 | Needs not-yet-built supplier-push workflow + unfinished Red Bull allocation pipeline. |
| BMS-5155 DOT-Aware Transfer Scheduling | 1.4 | Hard blocker on HOS data-source decision; fully greenfield compliance logic; gated by design BMS-4738. |

## ⚪ Tier 5 — Not decomposed (groom before you can build)

These active epics have **zero child stories** — nothing to build immediately until they're broken down:

- **BMS-5161** [REQ-234] Supplier Freight Cost Billbacks
- **BMS-5164** [REQ-237] FL Transfer Certificate Automation *(likely mirrors the AL spike in BMS-5160 — sequence after it)*
- **BMS-4936** [REQ-009] Launch Planning Coordination
- **BMS-5124** [REQ-197] UKG Labor Availability Integration *(external UKG dependency — not a quick win even once groomed)*

---

## Why the winners win (the pattern)

Every Tier-1 epic shares the same three traits:
1. **A core story already Done or demoed** (Apr 17 demos recur: backstock, multi-pick, safety stock) → the risk was already retired.
2. **Remaining work extends shipped Salesforce primitives** — existing objects, triggers, LWCs — instead of net-new infrastructure, off-platform modules, or external integrations.
3. **The output is user-visible** — a validation message, a badge, a picker sequence, a dashboard — so it generates feedback the moment it ships.

The losers invert this: greenfield objects, blocking spikes, off-platform Spec-A builds with no SF write path, or dependencies on external systems (Red Bull files, UKG, payment processors, state e-filing).

## Dependency-aware build order

> [!info] Rule applied
> Build **prerequisites before their dependents**, then sort by priority. Verified against Jira issue links. Key finding: **no high-priority quick win is blocked by a lower-priority one**, so the priority order holds — with three annotations below.

### Dependency map (verified links)

| Ticket | Link type | Target | Implication |
|---|---|---|---|
| BMS-4221 / 4222 / 4217 | `clones` | Apr-17 demo stories **(Done)** | Prerequisite complete → fully unblocked to productionize |
| BMS-4665 | **`blocks`** | BMS-4666 reporting spike | Build 4665 before its reporting (reporting is out of quick-win scope) |
| BMS-3783 | **`blocks`** | BMS-4245 Data Governance Productize | 3783 is a *foundation* — has downstream pull — **but is Needs-Refinement**, groom before coding |
| BMS-5163 (BMS-4490) | `relates to` | BMS-5154 Truck Builder *(In Progress)* | Shared transfer-creation flow → land on its stabilized model |
| BMS-5162 (BMS-4665) | `relates to` | BMS-5154 Truck Builder *(In Progress)* | Same — coordinate so validation sits on final transfer flow |

### Build sequence

1. **BMS-4490** — Transfer Dock Optimization *(start here, 4.7)*. Foundation shipped; ⚠ coordinate with in-progress **BMS-5154 Truck Builder** (shared transfer flow).
2. **BMS-4221** — Backstock Prioritization (4.3). Unblocked — Apr-17 demo Done.
3. **BMS-4217** — Safety Stock Controls (4.0). Unblocked — Apr-17 demo Done. *Watch:* confirm replenishment-calc landed in BMS-4025.
4. **BMS-4222** — Multi Pick Locations (4.0). Unblocked — Apr-17 demo Done.
5. **BMS-4665** — Min Transfer Qty Thresholds (3.7). Unblocked; **must precede** its reporting (BMS-4666/4667); ⚠ coordinate with BMS-5154 Truck Builder.
6. **BMS-3783** — Crane SKU Flag (3.7). ⚠ **Groom first** (Needs Refinement). Prioritize the grooming because it *unblocks* BMS-4245 downstream; scope the build to the flag/badge only.
7. **BMS-4465** — Pick Location Capacity prototype/demo (3.7). Fully standalone (no links) — slot in anytime as a feedback artifact.

**Parallel-track aside:** **BMS-5344** (reorder-banner CSS bug) has no dependencies and is a clean one-PR before/after demo — pick it up between any of the above when you want a fast, visible win.

### Two things that genuinely gate, not just relate
- **BMS-3783** is the only Tier-1 item not build-ready as-is — it needs a design/refinement pass before code. Start that grooming early since it has downstream dependents (BMS-4245).
- **BMS-5154 Truck Builder (In Progress)** is the shared upstream for the two *transfer* deltas (dock optimization, min-qty). Neither is hard-blocked, but sync with its owner so you build validation against the final transfer-creation flow rather than reworking it.
