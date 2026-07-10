---
title: Build Order
project: OHFY / BMS
assignee: Alvaro Sanchez
created: 2026-06-22
related: "[[Quick-Win Epic Prioritization]]"
---

# Build Order — Quick Wins

> [!summary] The order
> Priority-ranked, dependency-respecting. No high-priority item is blocked by a lower one, so priority order holds. Build top to bottom.

| # | Ticket | Epic | Score | Status | Note |
|---|---|---|---|---|---|
| 1 | **[BMS-4490](https://ohanafy.atlassian.net/browse/BMS-4490)** Transfer Dock Optimization | [BMS-5163](https://ohanafy.atlassian.net/browse/BMS-5163) | 4.7 | Backlog | ← start here. Delta on shipped scheduler. ⚠ coordinate w/ [BMS-5154](https://ohanafy.atlassian.net/browse/BMS-5154) Truck Builder |
| 2 | **[BMS-4221](https://ohanafy.atlassian.net/browse/BMS-4221)** Backstock Prioritization | [BMS-5064](https://ohanafy.atlassian.net/browse/BMS-5064) | 4.3 | Backlog | Unblocked — Apr-17 demo Done |
| 3 | **[BMS-4217](https://ohanafy.atlassian.net/browse/BMS-4217)** Safety Stock Controls | [BMS-5068](https://ohanafy.atlassian.net/browse/BMS-5068) | 4.0 | Backlog | Unblocked — Apr-17 demo Done. Confirm replenishment-calc landed in [BMS-4025](https://ohanafy.atlassian.net/browse/BMS-4025) |
| 4 | **[BMS-4222](https://ohanafy.atlassian.net/browse/BMS-4222)** Multi Pick Locations | [BMS-5071](https://ohanafy.atlassian.net/browse/BMS-5071) | 4.0 | Backlog | Unblocked — Apr-17 demo Done |
| 5 | **[BMS-4665](https://ohanafy.atlassian.net/browse/BMS-4665)** Min Transfer Qty Thresholds | [BMS-5162](https://ohanafy.atlassian.net/browse/BMS-5162) | 3.7 | Backlog | Must precede reporting ([BMS-4666](https://ohanafy.atlassian.net/browse/BMS-4666)/[BMS-4667](https://ohanafy.atlassian.net/browse/BMS-4667)). ⚠ coordinate w/ [BMS-5154](https://ohanafy.atlassian.net/browse/BMS-5154) Truck Builder |
| 6 | **[BMS-3783](https://ohanafy.atlassian.net/browse/BMS-3783)** Crane SKU Flag | [BMS-5074](https://ohanafy.atlassian.net/browse/BMS-5074) | 3.7 | Needs Refinement | ⚠ Groom first. Unblocks [BMS-4245](https://ohanafy.atlassian.net/browse/BMS-4245). Scope to flag/badge only |
| 7 | **[BMS-4465](https://ohanafy.atlassian.net/browse/BMS-4465)** Pick Location Capacity demo | [BMS-5083](https://ohanafy.atlassian.net/browse/BMS-5083) | 3.7 | Backlog | Standalone (no links) — slot in anytime |

**Filler win:** **[BMS-5344](https://ohanafy.atlassian.net/browse/BMS-5344)** (reorder-banner CSS bug, epic [BMS-4995](https://ohanafy.atlassian.net/browse/BMS-4995)) — no dependencies, clean one-PR before/after demo. Pick up between any of the above.

## Keep in peripheral vision
- **[BMS-5154](https://ohanafy.atlassian.net/browse/BMS-5154) Inter-Warehouse Truck Builder (In Progress)** — shared transfer-creation flow for #1 and #5. Not a hard block, but sync with its owner so you build validation against the final flow, not a moving one.
- **[BMS-3783](https://ohanafy.atlassian.net/browse/BMS-3783)** — the only item not build-ready as-is; start its grooming early so it's ready by the time you reach #6 (and it unblocks [BMS-4245](https://ohanafy.atlassian.net/browse/BMS-4245) downstream).

## Why this order
1. Sorted by quick-win composite (immediate + visibility + build-ready weighted most).
2. Dependency check (Jira links) applied — `clones` prerequisites are all Done; the only `blocks` links point downstream/out of scope; transfer items `relate to` the in-progress Truck Builder.
3. Result: priority order is dependency-safe top to bottom.

_Full analysis and tier breakdown: [[Quick-Win Epic Prioritization]]_
