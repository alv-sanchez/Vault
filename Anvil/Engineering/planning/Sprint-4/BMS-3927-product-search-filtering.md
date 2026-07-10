---
ticket: BMS-3927
title: "Product search & filtering (category, brand, pack size)"
type: Story
status: To Do (nearly complete)
sprint: "Sprint 4"
assignee: Alvaro Sanchez
jira: https://ohanafy.atlassian.net/browse/BMS-3927
tags: [sprint4, ecom, gulf, search, filtering, near-complete]
---

# BMS-3927 — Product search & filtering (category, brand, pack size)

## Remaining Work

One AC left — fuzzy matching with abbreviated/partial input:

- Search bar must handle partial terms like `bud lt 12` and return Bud Light 12-pack variants
- Results ranked by relevance: exact brand matches first, then partial pack-size matches
- No error thrown for abbreviated or special character input

## Key Takeaway

Lowest effort Sprint 4 ticket. Close out day 1.
