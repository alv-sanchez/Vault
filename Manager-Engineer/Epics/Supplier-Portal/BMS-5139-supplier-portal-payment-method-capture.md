---
epic: BMS-5139
release_phase: run
title: "[REQ-212] Supplier Portal: Payment Method Capture"
status: To Do
audit_verdict: Blocked        # Build-Now | Slice | Not-Yet | Blocked | Not-Decomposed
score: 1                      # quick-win composite 1-5 (build-ready · immediate · visibility · small-scope)
stream: S2-Supplier
executable_children: []
blockers: [BMS-4126]          # ticket keys / spikes that gate this epic
build_order: []               # child ticket keys, dependency-ordered
updated: 2026-06-28
jira: https://ohanafy.atlassian.net/browse/BMS-5139
tags:
  - manager-engineer
  - epic
---

# BMS-5139 — [REQ-212] Supplier Portal: Payment Method Capture

> [!summary] Verdict
> **Blocked** · score 1 · stream S2-Supplier. Single child (BMS-3738) is unbuildable: no Acceptance Criteria, depends on an unfinished architecture spike (BMS-4126, Backlog), and asserts a supplier portal UI that does not exist in the repo (only Experience site is eCommerce).

## Audit
- **Children:** 1 total · 0 executable
- **Blocked by:** [[BMS-4126]] — "Supplier Portal — Spike: Portal Architecture & Shared Data Model" (Backlog). This spike is meant to define the very portal + shared data-model substrate BMS-3738 builds on. Until it lands, the target object/site/relationship model is undecided.
- **Shared substrate / overlap:** Payment capture would touch `OHFY-Data-Model` (objects: `Payment__c`, `Account.Payment_Method__c`, `Entity__c`) and potentially `Supplier_SKU_Cross_Reference__c` (object in OHFY-Data-Model, trigger service in OHFY-WMS). ⚠ `Payment__c` and `Account` are platform-wide financial objects — any field/validation change here is a high-blast-radius coordinate point with eCommerce (S1) and any module that posts payments. There is **no Supplier__c object** (supplier is an `Account` lookup) and **no supplier portal Experience site** (only `E_Commerce1`).

## Executable children — live (auto-updates from ticket notes)
> Replace `BMS-XXXX` below with this epic's key. This is a live query over `Tickets/` — never hand-edit a status here.

```base
filters:
  and:
    - file.inFolder("Manager-Engineer/Tickets")
    - epic == "BMS-5139"
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
| BMS-3738 — Supplier Portal: Payment Method Capture | **No Acceptance Criteria** (description = story statement + "Why It Matters" + Gulf Context only; nothing testable). **Blocked by spike** BMS-4126 (portal architecture & shared data model, Backlog) it relates to. **Polish Contradicted**: ticket assumes a supplier-facing portal UI + payment capture surface that does not exist in repo (no supplier portal Experience site; only `E_Commerce1`). Build target (object? new portal field? Payment__c?) is undecided. |

## Open questions for PO
- [[BMS-3738-payment-capture-target-and-portal]] — Where does captured payment method live, and is there a supplier portal to capture it in? (BMS-4126 spike must land first.)

## Run history
- 2026-06-28-DRY-RUN — DRY-RUN audit. 1 child (BMS-3738, Backlog) verified live; failed GATE (no AC + blocked by spike BMS-4126 + Contradicted polish on non-existent portal). Epic verdict Blocked, 0 executable. No repo/Jira writes.
