---
ticket: BMS-4054
title: "Retailer Portal Product Card — Ph 2: Grid Layout + Reuse"
type: Story
status: Needs Refinement
sprint: "Sprint 4"
parent: BMS-3924
depends_on: BMS-4053
assignee: Alvaro Sanchez
jira: https://ohanafy.atlassian.net/browse/BMS-4054
tags: [sprint4, ecom, gulf, grid, responsive, needs-refinement]
---

# BMS-4054 — Retailer Portal Product Card — Ph 2: Grid Layout + Reuse

## Summary

Responsive grid layout reusing the Ph 1 card component across catalog browsing, search results, and reorder history. Must work on desktop (warehouse office) and tablet (sales rep in field).

## Requirements

- Responsive: desktop + tablet viewports
- Handle 80-200+ SKUs per warehouse with pagination
- 3-second SLA for load times
- Consistent card rendering across all contexts (catalog, search, reorder)

## Comment Notes (Alvaro)

- [ ] Add screenshot of current shop page layout to ticket
- Default sorting: **promotions first**
- Keep in mind **image sizing** consistency

## Open Question from Description

> "Card placement in search results should prioritize promoted products at the top when default sort is applied — promoted prioritized on default sort? Or in 'Promotions' carousel at the top of the catalog?"

This design question needs resolution before implementation.

## Key Takeaway

**Needs refinement status.** Depends on BMS-4053 (card component) shipping first. The promoted-products sorting vs. carousel question needs a decision. Add the current shop page screenshot for reference.
