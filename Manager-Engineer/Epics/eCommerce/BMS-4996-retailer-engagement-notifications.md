---
epic: BMS-4996
release_phase: walk
title: "[REQ-069] Retailer Engagement Notifications"
status: In Progress
org: bms-4996-notif
claimed_orgs: [bms-4996-notif]
audit_verdict: Not-Yet
score: 2
stream: S1-eCommerce
executable_children: []
blockers: [BMS-4073]
build_order: []
updated: 2026-07-20
jira: https://ohanafy.atlassian.net/browse/BMS-4996
tags:
  - manager-engineer
  - epic
---

# BMS-4996 — [REQ-069] Retailer Engagement Notifications

> [!summary] Verdict
> **Not-Yet** · score 2 · stream S1-eCommerce. The only child with real AC (BMS-4073) is largely **already built on `main`** with one **Contradicted** AC — nothing here is cleanly buildable until the PO reconciles scope.

## Audit
- **Children:** 6 total · **0 executable**
- **Blocked by:** none external. Internal: BMS-4073 carries a Contradicted AC + an unresolved open question → gates the epic.
- **Shared substrate / overlap:** Touches the **OHFY-eCommerce notification stack** (`AbandonedCartReminderScheduler/Batch`, `OrderConfirmationService`, `TwilioSMSService`, `NotificationPreferenceController`) and the `Notification_Log__c` / `Contact_Notification__c` objects — all already on `main` (delivered under BMS-4390/4352 foundation + Done BMS-4192). ⚠ Any future ecom notification work coordinates here; high risk of re-implementing existing code.

## Executable children — live (auto-updates from ticket notes)
> Replace `BMS-XXXX` below with this epic's key. This is a live query over `Tickets/` — never hand-edit a status here.

```base
filters:
  and:
    - file.inFolder("Manager-Engineer/Tickets")
    - epic == "BMS-4996"
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
| BMS-4192 | **Done** — sales-rep notifications already shipped (status category Done). |
| BMS-4534 | **Spike** (issuetype SPIKE) — discovery/investigation, no AC, no package mapping. Not buildable code. |
| BMS-4535 | **Design/Prototype/Demo** — output is wireframes + clickable demo + decision log, no AC, no buildable package mapping. |
| BMS-3921 | **No AC** — umbrella narrative ("Retailer Engagement Notifications") with Gulf context only; decomposed into BMS-4073 / BMS-3931. Not refined to executable. |
| BMS-3931 | **No AC** — "Order status tracking & delivery notifications" has story statement + Gulf context but no Acceptance Criteria, scenarios, or named components. Blocked-by BMS-3930 is Done (not a live blocker), but fails the AC gate. |
| BMS-4073 | **Candidate but not executable** — has full AC, but 1 AC (*Order Name Fix*) is **Contradicted** by `main` (`fixEcomOrderNames` is a no-op stub), and the rest is already implemented. See [[BMS-4073-order-name-fix-scope]]. |

## Open questions for PO
- [[BMS-4073-order-name-fix-scope]] — Is BMS-4073 already Done (close it) or re-scoped to only the order-name rename, gated on the OHFY-Core field migration?

## Run history
- 2026-06-28 — Initial DRY-RUN audit (Manager auditor). 6 children pulled; 1 candidate (BMS-4073) polished against local `main`. Verdict Not-Yet: candidate largely already-built with 1 Contradicted AC. No repo or Jira writes. NOTE: local main is 13 commits behind origin/main — reconfirm after fast-forward.
