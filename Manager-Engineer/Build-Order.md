---
title: Build Order
project: OHFY / BMS
assignee: Alvaro Sanchez
generated: 2026-06-26
method: real Jira blocks/blocked-by graph + OHFY-Split @ main file-ownership (not titles)
related: "[[_dashboard]]"
tags:
  - manager-engineer
---

# Build Order — Epic Streams & Stages

> [!summary] How to read this
> **Streams** run in parallel and are internally serial (the no-overlap unit). A **stage** is the wavefront — one epic per disjoint stream at a time. `/conductor` regenerates this from live data each run.

> [!warning] Seed, not gospel
> Stream/overlap calls below come from a one-time audit (2026-06-26). `/conductor` re-confirms `packages_touched` disjointness per ticket before dispatch and re-flows the wavefront as `4245` lands and the undecomposed epics gain children.

> [!danger] Dry-run reality check — 2026-06-28
> The Stage 1 audit found **0 of 5 epics executable** — all are gated on direction/decomposition, not code. The "start now" Stage 1 below is **aspirational, not actionable yet**. The *actual* first action is the **decision wave**: answer the 5 Feedback Docs + decide BMS-4245. See [[Daily/2026-06-28]] and [[Runs/2026-06-28-Stage1-dryrun]]. (Ran on stale `main`, then pulled to `a00a3fe5` and verified the 13 commits touched none of the finding-relevant objects — findings stand on current main.)
> - 5139 (S2) is **blocked** by unbuilt spike BMS-4126 — not start-now.
> - 4996 (S1) is **mostly already shipped** — only a contradicted remnant remains.
> - 5060 needs slicing; 4935 & 5129 need a data-model decision before AC exists.

> [!check] Repo-verified active-work reconciliation — 2026-07-13 (plan-only)
> Atlassian MCP was down this pass, so the **cross-epic topo-sort below (streams/stages) was NOT regenerated** — that needs the live `blocks`/`blocked-by` issuelink graph. Instead the repo (`gh`/git) was used as an independent source to pin the *current* wavefront of the 4 active epics. This addendum is repo-derived active state, not a full Jira re-flow.
>
> **Active now (in-flight / open PR — `/work-epic` owns within-epic PR grouping, not this doc):**
> - **BMS-5113 DOI-Std (S5):** BMS-3822 merged (baseline shipped). **BMS-3742** = PR #513 draft, High risk — gated on live DOI reconciliation before ready-for-review (known, not a new blocker). 4544 spike + 4543 UI-demo backlog.
> - **BMS-5161 Freight Billbacks (S2):** decomposed + building. Dependency-safe order **BMS-5789 → 5790 → 5791** (PRs #511 → #514 → #516, all draft to `main`, merge in that order); **BMS-5792** (UI/demo) parked `Awaiting-UI`, build gated on mockup approval. No `Inventory__c` lock involved (touches cost/receivables). ⚠ soft-coordinate 5790/5792 with BMS-5154 (both write `Transfer_Group__c`).
> - **BMS-4965 Short Pay (S-Finance/OMS):** 4059 + 4060 In Progress by hand; 5625 = PR #439 **ready** (12d old); 4785 reporting spike is the only clean autonomous candidate.
> - **BMS-4935 Red Bull (S3):** 4120 In Progress; epic otherwise **blocked on Matt** (allocation direction) — do not advance children 3735/4119/4121.
>
> **Blocked (real, already-logged):** **BMS-5164** children **BMS-5825/5826/5827** are all blocked on **BMS-4088** (shared AL cert-engine spike, Backlog/unstarted under sibling epic BMS-5160) — no branches exist for any of them (repo-confirmed). Cannot enter any stage until 4088 is scheduled.

## What the audit found (overrides a title-only guess)
1. **Inventory is one serial stream.** DOI, Snapshots, Safety Stock, Returns, and transfers' inventory-writes all go through `InventoryAdjustmentTriggerService.cls` + `Inventory__c`/`Inventory_Adjustment__c` (OHFY-PLTFM) → they collide → serialize.
2. **Keystone blocker unbuilt:** `BMS-4245` (Item Master Data Governance – Productize) is **Backlog** and blocks **5160, 5158, 5074, 5083, 5155**. (3799 Done; 3728 is a stale demo link.) The warehouse cluster can't start until 4245 builds or the link is ruled stale (PO question).
3. **Not executable — zero child stories:** `4936`, `5124`, `5164` → decompose first.
4. **Hidden chain:** `(4935 + 5139) → 5148 → 5113`; plus `5060 → 5113` and `5060 → 5067`.
5. **Jira `components` empty everywhere** — disjointness comes from the codebase.

## Streams (parallel; each internally serial)

| Stream                             | Disjoint package / files                                        | Epics in order                                                     |
| ---------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------ |
| **S1 · eCommerce**                 | OHFY-eCommerce(-UI)                                             | 4996                                                               |
| **S2 · Supplier Portal**           | OHFY-WMS `Supplier_SKU_Cross_Reference__c` + trigger svc        | 5139 → 5148 · 5161                                                 |
| **S3 · OMS-Allocation**            | OHFY-OMS allocation objects/batches                             | 4935 → (4936*)                                                     |
| **S4 · OMS-Delivery**              | OHFY-OMS `Delivery__c`/`Delivery_Stop__c` + route LWCs          | 5129                                                               |
| **S5 · Inventory (LOCK, serial)**  | OHFY-PLTFM `InventoryAdjustmentTriggerService` + `Inventory__c` | 5060 → 5067 → 5061 → 5063 → 5068 → 5484 → 5113†                    |
| **S6 · Warehouse (gated by 4245)** | OHFY-WMS picking/transfer objects; Data-Model flag              | **[4245]** → 5083 ∥ 5074 → 5070; 5160 → 5162 → 5158 → 5155 (5164*) |

\* needs decomposition first  · † 5113 also needs 5148  · ⚠ transfers touch S5's lock only for the *Item Transfer* adjustment — coordinate, not a hard merge.

## Stages — the wavefront (each row = concurrent, zero file overlap)

### Stage 0 — unblock & groom (Manager + you; not autonomous build) — runs alongside Stage 1
- [ ] Build **BMS-4245**, or get a PO ruling that its block on the warehouse cluster is stale. **Highest leverage — frees 5 epics.**
- [ ] Decompose **5164, 5124, 4936** into child stories via `/polish` refinement.

### Stage 1 — start now (5 concurrent, disjoint, no live blockers)
| Epic | Stream | Note |
|---|---|---|
| [BMS-5060](https://ohanafy.atlassian.net/browse/BMS-5060) Days of Inventory | S5 | In Progress; head of serial inventory queue; gates 5067 & 5113 |
| [BMS-4996](https://ohanafy.atlassian.net/browse/BMS-4996) Retailer Engagement Notifications | S1 | isolated eCommerce |
| [BMS-5139](https://ohanafy.atlassian.net/browse/BMS-5139) Supplier Portal — Payment Capture | S2 | base of supplier chain; gates 5148 |
| [BMS-4935](https://ohanafy.atlassian.net/browse/BMS-4935) Red Bull Allocation Import | S3 | OMS allocation; gates 5148 + 4936 |
| [BMS-5129](https://ohanafy.atlassian.net/browse/BMS-5129) Route Profitability | S4 | OMS delivery (disjoint objects from 4935) |

### Stage 2 — deps from Stage 1 cleared; 4245 still pending
| Epic | Stream | Unblocked by |
|---|---|---|
| [BMS-5067](https://ohanafy.atlassian.net/browse/BMS-5067) Practical Days on Hand | S5 | 5060 |
| [BMS-5148](https://ohanafy.atlassian.net/browse/BMS-5148) Supplier Portal — Order Recs | S2 | 5139 + 4935 |

### Stage 3 — first wave needing 4245 done
| Epic | Stream | Unblocked by |
|---|---|---|
| [BMS-5061](https://ohanafy.atlassian.net/browse/BMS-5061) Inventory Historical Snapshot | S5 | 5067 (lock slot) |
| [BMS-5083](https://ohanafy.atlassian.net/browse/BMS-5083) Pick Location Capacity ∥ [BMS-5074](https://ohanafy.atlassian.net/browse/BMS-5074) Crane SKU Flag | S6 | **4245** — disjoint from each other |
| [BMS-5161](https://ohanafy.atlassian.net/browse/BMS-5161) Supplier Freight Billbacks | S2 | portal |

### Stage 4
| Epic | Stream | Unblocked by |
|---|---|---|
| [BMS-5063](https://ohanafy.atlassian.net/browse/BMS-5063) Inventory Snapshotting | S5 | 5061 |
| [BMS-5160](https://ohanafy.atlassian.net/browse/BMS-5160) AL Transfer Cert → [BMS-5162](https://ohanafy.atlassian.net/browse/BMS-5162) Min Qty | S6 | 4245 + transfer base |
| [BMS-5070](https://ohanafy.atlassian.net/browse/BMS-5070) Shift-End Workflow | S6 | 5083 (∥ transfers if files disjoint) |

### Stage 5 — tail
| Epic | Stream | Unblocked by |
|---|---|---|
| [BMS-5068](https://ohanafy.atlassian.net/browse/BMS-5068) Safety Stock → [BMS-5484](https://ohanafy.atlassian.net/browse/BMS-5484) Loss-Prevention → [BMS-5113](https://ohanafy.atlassian.net/browse/BMS-5113) DOI-Std | S5 | DOI + 5148 (5113) |
| [BMS-5158](https://ohanafy.atlassian.net/browse/BMS-5158) Variance Gating → [BMS-5155](https://ohanafy.atlassian.net/browse/BMS-5155) DOT Scheduling | S6 | 5162 |
| [BMS-4936](https://ohanafy.atlassian.net/browse/BMS-4936) Launch Planning · [BMS-5124](https://ohanafy.atlassian.net/browse/BMS-5124) UKG · [BMS-5164](https://ohanafy.atlassian.net/browse/BMS-5164) FL Cert | decomp | only after Stage-0 grooming |

> [!note] Bottleneck
> S5 (Inventory) is a single serial queue (shared trigger handler) — the throughput limiter. Real max concurrency ≈ 4–5 epics/stage, capped by `execution.max_parallel`.

---

## Why the builds are backend *artifacts*, not UIs (yet)

> [!important] Intentional: backend-first, UI after direction
> Every build in this push delivered the **backend artifact** — data model + Apex + automation + config — and **deliberately stopped short of the user-facing UI**. Three reasons, in order of weight:
>
> 1. **The UI/UX approval gate (pipeline rule 5).** Any LWC / screen / FlexiPage / Experience-Cloud surface requires **your mockup sign-off before the real component is built** — even for low-risk work. None of these epics had an approved UI mockup, so building a screen would have violated the gate (and risked building the wrong thing).
> 2. **The builds ran headless (no org at build time).** A UI can't be designed, styled (`/ohfy-design`), or live-verified (Chrome DevTools / Playwright) without an org — so the UI layer wasn't safely buildable in that window. The backend is code-gradeable headless; the UI is not.
> 3. **Direction is the real bottleneck.** The whole initiative confirmed the constraint is *direction/refinement, not engineering*. Building a UI before you've given UX direction would just create rework.
>
> So each "artifact" is the safe, code-verified half. The UI half is **waiting on your direction + a mockup** (the `🎨 UI?` checkbox in [[manager-engineer.base]] flags which epics have a pending UI layer).

**Which epics have a UI layer still pending direction:**

| Epic | Backend artifact built | UI still needing your direction |
|---|---|---|
| **BMS-4935** Red Bull Allocation | configurable CSV importer (Apex, callable) | the **file-upload screen** — how a user picks/uploads the weekly file and sees validation errors / the split result |
| **BMS-5070** Shift-End | checklist objects + breakage-review service | the **shift-close checklist + pass-down screen** the warehouse manager actually uses |
| **BMS-4965** Short Pay | status/escalation/resolution backend on `Invoice__c`+`Credit__c` | the **AR review-queue screen** (today it's just a list view over `Short_Pay_Status__c`) |

**Not awaiting UI direction:** **BMS-5083** (its surface is *native* Salesforce Reports/Dashboards — config, not a custom UI) and **BMS-5068** (pure replenishment automation — no user screen).

**Next step to unblock a UI:** pick an epic, give UX direction, and the engineer runs `/mockup-ticket` → parks it `Awaiting-UI` → builds the real component **only after you approve the mockup**.
