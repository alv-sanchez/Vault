---
run: 2026-06-29 full backlog triage
mode: cheap pre-filter triage (no deep polish, no writes to Jira/repo)
scope: all 17 non-Stage-1 non-Done epics (Stage 1's 5 were full-audited 2026-06-28)
repo_state: main @ a00a3fe5
tags:
  - manager-engineer
  - run
  - triage
---

# Run — 2026-06-29 · Full backlog triage (all 22 non-Done epics)

## Bottom line
**1 genuinely buildable ticket exists right now: BMS-4217** (under epic BMS-5068 Safety Stock) — AC-complete, decomposed, unblocked (but discovery-heavy: 10 open questions). One off-epic build (BMS-5434) is unblocked but mis-parented. Everything else is refinement-gated, undecomposed, or blocked by BMS-4245. The backlog's constraint is **refinement + direction, not engineering capacity.**

## BMS-4245 — confirmed the keystone, still Backlog (OPEN)
Gates the real build stories of 5074, 5158, 5155, 5160 (and historically 5083). Resolving it (build or rule-stale) is the single highest-leverage unblock.

## Full readiness map (22 non-Done epics)

| Epic | Stream | Verdict | Workable now | Blocker / gap |
|---|---|---|---|---|
| 5068 Safety Stock | S5 | **READY** | **BMS-4217** | AC-complete; discovery-heavy (10 Qs, replenishment-calc unknown) |
| 5070 Shift-End | S6 | Needs-refinement (nearest) | 0 | decomposed + unblocked, just needs an AC pass |
| 5162 Min Transfer Qty | S6 | Needs-refinement | 0 (off-epic **BMS-5434** is real) | 4665 merged; follow-on LWC 5434 unblocked but not parented under 5162 |
| 5160 AL Transfer Cert | S6 | Spike-only | BMS-4088 (spike) | build chain blocked; umbrella 3774 Won't Do |
| 5067 Practical DoH | S5 | Needs-refinement | 0 | no AC |
| 5061 Hist Snapshot | S5 | Needs-refinement | 0 | only open child a V2 spike, no AC |
| 5063 Snapshotting | S5 | Needs-refinement | 0 | no AC; 2 competing specs unresolved |
| 5113 DOI-Std | S5 | Needs-refinement | 0 | stubs no AC; 3742 blocked by 6 stories |
| 5074 Crane Flag | S6 | **Blocked** | 0 | BMS-4245 (Backlog) |
| 5083 Pick Capacity | S6 | Build done | 0 | main story 3785 Done; rest spikes/design |
| 5158 Variance Gating | S6 | **Blocked** | spikes only | build 3775 blocked by BMS-4245 |
| 5155 DOT Scheduling | S6 | **Blocked** | spikes only | build 3788 blocked by BMS-4245 |
| 5148 Order Recs | S2 | **Blocked** | 0 | child blocked by ~14 open stories |
| 5484 Loss-Prevention | S5/WMS | Not-decomposed | 0 | single raw ticket, no AC |
| 5161 Freight Billbacks | S2 | Not-decomposed | 0 | 0 children |
| 5124 UKG Labor | int | Not-decomposed | 0 | 0 children |
| 5164 FL Cert | S6 | Not-decomposed | 0 | 0 children |
| 5060 DOI | S5 | Not-decomposed | 0 | 5566 unrefined (Stage 1 audit) |
| 4996 Retailer Notifs | S1 | Already shipped | 0 | close/rescope 4073 (Stage 1 audit) |
| 5139 Supplier Pay | S2 | Blocked | 0 | portal doesn't exist; spike 4126 (Stage 1 audit) |
| 4935 Red Bull Alloc | S3 | Needs-refinement | 0 | data-model decision + AC (Stage 1 audit) |
| 5129 Route Profit | S4 | Needs-refinement | 0 | no financial data model (Stage 1 audit) |

## Corrections to the seed plan
- **5148 is NOT blocked by 5139/4935** — it's gated by ~14 open BMS-39xx forecasting/integration stories. (Build-Order's "hidden chain" line is wrong for 5148.)
- **5162's real follow-on (BMS-5434) is unparented** — won't surface under the epic until re-parented in Jira.
- **5161 is `polished` at the epic level but has 0 children** — refinement claimed, decomposition not done.

## Recommended moves (highest leverage first)
1. **Decide BMS-4245** — unblocks 4 warehouse epics in one stroke.
2. **Full-polish BMS-4217 (5068)** — the one ready ticket; confirm the replenishment-calc unknown isn't a hidden blocker before queueing.
3. **AC pass on BMS-5070 (Shift-End)** — cheapest path to a second workable epic (decomposed + unblocked already).
4. **Re-parent BMS-5434 under 5162** in Jira → instant workable LWC build.
