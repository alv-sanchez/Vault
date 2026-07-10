---
ticket: BMS-3929
title: "Order history & two-click reorder"
type: Story
status: To Do
sprint: "Sprint 4"
blocked_by: "BMS-4019, BMS-3719 (pricing architecture)"
assignee: Alvaro Sanchez
jira: https://ohanafy.atlassian.net/browse/BMS-3929
tags: [sprint4, ecom, gulf, order-history, reorder, blocked]
---

# BMS-3929 — Order history & two-click reorder

## Summary

View complete purchase history and rapidly place repeat orders via a two-click reorder flow. Reorders must resolve **current pricing** at the time of reorder (not replay historical invoice price). Order history must be immutable and auditable (10+ year regulatory retention).

## Comment Highlights

- **Elliot Flores (2026-04-16):** "Sanchez will rework this ticket to document actual 2-click journey"
- **Alvaro (2026-05-05):** Blocked by BMS-4019 and BMS-3719 — pricing architecture still being defined. Added blocked links.

## Blockers

- **BMS-4019** — Pricing codes architecture
- **BMS-3719** — Pricing architecture definition

## Open TODOs

- [ ] Rework ticket to document the actual 2-click reorder journey (per Elliot's ask)
- [ ] Pricing architecture must be resolved before reorder can resolve current prices

## Key Takeaway

**Blocked on pricing architecture** (same as BMS-3925). Also needs rework to document the actual two-click journey before it's implementation-ready. Existing `lwc/reorderModal` handles per-item reorder but no bulk "Reorder All" exists yet.
