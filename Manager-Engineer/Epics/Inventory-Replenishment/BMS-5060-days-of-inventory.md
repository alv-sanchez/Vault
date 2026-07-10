---
epic: BMS-5060
release_phase: crawl
title: "[REQ-133] Days of Inventory (DOI)"
status: In Progress
audit_verdict: Not-Decomposed
score: 1
stream: S5-Inventory
executable_children: []
blockers: []
build_order: []
updated: 2026-06-28
jira: https://ohanafy.atlassian.net/browse/BMS-5060
tags:
  - manager-engineer
  - epic
---

# BMS-5060 — [REQ-133] Days of Inventory (DOI)

> [!summary] Verdict
> **Not-Decomposed** · score 1 · stream S5-Inventory. The only open child (BMS-5566) is a raw Gulf-onsite feature blurb with no acceptance criteria, conflating ~4 distinct features; the other child is a Done discovery spike. Nothing is executable until BMS-5566 is sliced and refined.

## Audit
- **Children:** 2 total · 0 executable
- **Blocked by:** none (no open inbound blocker links on the open child)
- **Shared substrate / overlap:** DOI substrate already exists on `Inventory__c` (`Current_DOI__c`, `DOI_Status__c`, `Average_Daily_Depletion__c`, `DOI_Velocity_Window_Days__c`, `Effective_Target_DOH__c`, `Effective_Min_DOH__c`, `DOI_Calculated_Date__c`) and `Account` (`Target_DOI__c`, `Maximum_DOI__c`), with logic in `OHFY-PLTFM/.../triggerServices/inventoryAdjustment/InventoryAdjustmentTriggerService.cls`. Warehouse-space concepts (pallets) live on `Pallet_Item__c` (`Pallet_Space_Used__c`). ⚠ Any new warehouse-capacity / stackability work overlaps the existing Inventory + Pallet substrate and the InventoryAdjustment trigger path — coordinate to avoid duplicate fields/handlers.

## Executable children — live (auto-updates from ticket notes)
> Replace `BMS-XXXX` below with this epic's key. This is a live query over `Tickets/` — never hand-edit a status here.

```base
filters:
  and:
    - file.inFolder("Manager-Engineer/Tickets")
    - epic == "BMS-5060"
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
| BMS-3817 — Days on Hand / Days of Inventory - Spike | **Done** (status category done) and explicitly a discovery/documentation spike — "not a workable dev ticket." Excluded: done + spike. |
| BMS-5566 — Forecast: warehouse-space constraint | **Backlog**, but description is a raw Gulf on-site backlog blurb ("proposed P2 · tier Go-live") with **no acceptance criteria** and conflates ~4 distinct features (DOH→DOI conversion, per-warehouse pallet-location capacity red-flag, product stackability capture, warehouse CAD/dimension storage). Excluded: not refined / not decomposed. See open question + feedback doc. |

## Open questions for PO
- [[BMS-5566-warehouse-space-decompose]] — How should the warehouse-space constraint story be sliced, and is per-warehouse pallet-location capacity in scope for go-live?

## Run history
- 2026-06-28 — Initial dry-run audit. 2 children pulled; 0 candidates passed the executability gate (1 Done spike, 1 un-refined multi-feature blurb). Verdict Not-Decomposed. Raised one open question + feedback doc.
