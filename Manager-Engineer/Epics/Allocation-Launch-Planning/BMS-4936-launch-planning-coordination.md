---
epic: BMS-4936
release_phase: walk
title: "[REQ-009] Launch Planning Coordination"
domain: "Allocation & Launch Planning"
user: "Purchasing · warehouse readiness · sales activation · marketing"
impact: "Launches coordinated informally; promos can fire before product is in position"
build_status: "Spec only — PARKED (undecomposed, walk-phase)"
status: To Do
audit_verdict: Not-Decomposed
polish_verdict: Not-Decomposed
score: 1
stream: S3-OMS-Alloc
phase:                  # PARKED — not in the Phase-One locked-down set
locked_down: false
parked: true
parked_reason: "walk-phase, undecomposed (1 shell story needs-gulf-input), no substrate on main — cannot complete by EOD. Swapped out for BMS-5083."
updated: 2026-06-29
jira: https://ohanafy.atlassian.net/browse/BMS-4936
tags:
  - manager-engineer
  - epic
---

# BMS-4936 — [REQ-009] Launch Planning Coordination

> [!warning] Parked (not in Phase One)
> Considered for the locked-down set, then **swapped out for [[BMS-5083-pick-location-capacity|BMS-5083]]**. It's `walk`-labeled (not crawl), **To Do**, and effectively undecomposed — it cannot complete by EOD. Kept here for a later phase; flip `parked: false` + set `phase` to re-include.

## 🎯 Brief — Issue · Impact · Solution
- **The issue:** New product launches need alignment across **purchasing, warehouse readiness, POS material deployment, and sales activation** — currently informal and inconsistent, so promos can fire before product is on hand.
- **Who in Gulf is impacted:** **Purchasing**, **warehouse managers**, **sales reps**, **marketing** — and customers (promo with no stock = lost sales + bad experience).
- **Proposed solution:** structured launch-planning tool to sequence activities, confirm supply is in position, and gate promo activation on availability.
- **Polish reality (vs main):** **Not-Decomposed.** One shell story exists — **BMS-5592** "New-Product Launch Plan record + cross-functional readiness checklist" (Backlog, `needs-gulf-input` + `refinement-needed`). The two safeguards it names (supply-in-position gate, promo-timing guard) aren't cut yet. **No launch/readiness/POS object exists on main** — net-new metadata. Adjacent reusable substrate: `Allocation__c` + `S_AllocationEnforcement.cls` (supply gate), the `Promotion__c` family (promo-timing guard).
- **EOD-realistic? 🔴 No.** Needs grooming: confirm the Launch Plan data model (4 track lanes, per-warehouse readiness across 5 sites, owner + lead-time due dates, %-ready rollup) and clear `needs-gulf-input` on BMS-5592.

## Why parked
Undecomposed + `walk` + no substrate = impossible by EOD tomorrow. Replaced in Phase One by BMS-5083 (crawl, In Progress, core already Done) so the locked-down set is all-crawl and actually finishable.
