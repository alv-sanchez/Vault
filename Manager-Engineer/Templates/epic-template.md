---
epic: BMS-XXXX
title: "[Epic title]"
status: To Do
audit_verdict:        # Build-Now | Slice | Not-Yet | Blocked | Not-Decomposed
score:                # quick-win composite 1-5 (build-ready · immediate · visibility · small-scope)
stream:               # S1-eCommerce | S2-Supplier | S3-OMS-Alloc | S4-OMS-Delivery | S5-Inventory | S6-Warehouse | decomp
do_not_do: false      # YOUR manual override — true = pipeline skips this epic entirely (no audit, no queue, no questions)
do_not_do_reason:     # why you parked it (e.g. "out of scope for go-live", "client deprioritized")
executable_children: []
blockers: []          # ticket keys that gate this epic
build_order: []       # child ticket keys, dependency-ordered
updated:
jira: https://ohanafy.atlassian.net/browse/BMS-XXXX
tags:
  - manager-engineer
  - epic
---

# BMS-XXXX — [Epic title]

> [!summary] Verdict
> **{{audit_verdict}}** · score {{score}} · stream {{stream}}. One-line why.

## Audit
- **Children:** N total · M executable
- **Blocked by:** [[links]] / external keys (status)
- **Shared substrate / overlap:** which package/object/handler this epic touches that others also touch (⚠ coordinate points)

## Executable children — live (auto-updates from ticket notes)
> Replace `BMS-XXXX` below with this epic's key. This is a live query over `Tickets/` — never hand-edit a status here.

```base
filters:
  and:
    - file.inFolder("Manager-Engineer/Tickets")
    - epic == "BMS-XXXX"
formulas:
  open: file.asLink(file.name)
views:
  - type: table
    name: Children
    order:
      - status
      - ticket
    columnSize:
      formula.open: 280
      status: 120
      polish_verdict: 110
      risk: 60
      ui: 70
```

## Not-yet-executable children
> Skipped tickets have no note (nothing to query) — list them here with the reason, by hand.

| Ticket | Why skipped (not refined / blocked / not decomposed) |
|---|---|

## Open questions for PO
- [[BMS-XXXX-question-slug]] — one-line

## Run history
- YYYY-MM-DD-HHMM — what changed this audit
