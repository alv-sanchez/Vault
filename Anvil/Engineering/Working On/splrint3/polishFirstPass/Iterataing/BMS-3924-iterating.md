---
ticket: BMS-3924
title: "Retailer portal product card & grid components"
type: Story (DECOMPOSED — track only)
parent_epic: "BMS-3702 — Gulf E-Commerce & Ordering"
children: "BMS-4053 (Ph 1 Card), BMS-4054 (Ph 2 Grid + Reuse)"
source_polish: "../BMS-3924-product-card-grid.md"
source_progress: "Anvil/Manager/Managing Tickets/Gulf Retailer Portal Epic Specfic/BMS-3924 — Product Card & Grid Components.md"
iterated_on: 2026-05-05
status: "Track only — execute via children"
tags: [polish, iterating, ecom, gulf, decomposed]
---

# BMS-3924 — Iterating (outstanding only)

> The epic-specific note for BMS-3924 already says **"DECOMPOSED — Track Only — Do not execute directly."** This file just confirms that and points at the two children's Iterating files for what's actually outstanding.

## Pulled OUT (resolved)

- **All 7 ACs** on the Jira ticket — already split across BMS-4053 (card behavior) and BMS-4054 (grid + reuse) per the epic note's "Decomposed Into" table.
- **Sprint 3 commitment for the parent itself** — the parent should not consume Sprint 3 capacity; the children carry the work.

## REMAINING (parent-only housekeeping)

- **Convert link types in Jira:** today BMS-4053 / BMS-4054 are linked as `Relates to`. Change to parent/child (or "blocks/is blocked by") so the decomposition shows in the issue tree.
- **Strip the duplicated 7 ACs from the Jira description** so refinement doesn't try to re-estimate them on the parent.
- **Decision:** close BMS-3924 as superseded once 4053+4054 ship, OR convert to an Epic. Don't leave it as an open Story alongside the children.
- **Re-link / clarify BMS-3930 dependency** (title is credit-terms; same issue surfaced on BMS-3925/3927/3923).

## Outstanding work lives in the children

| Child | Outstanding (see Iterating file) |
|---|---|
| **BMS-4053** | Card extraction + Gulf pricing-code display + warehouse badge + pack details + parent-agnostic data contract |
| **BMS-4054** | Reusable grid container + tablet breakpoints + replace inline cards in ecomShop / reorderModal / ecomOrderHistory |

See:
- [[BMS-4053-iterating]]
- [[BMS-4054-iterating]]

## Conflicts to verify

- None at the parent level (parent is administrative).

## Updated estimate

**0 days for the parent itself** — pure ticket hygiene (link-type fix + AC strip + close-or-convert). All build effort lives in the children.
