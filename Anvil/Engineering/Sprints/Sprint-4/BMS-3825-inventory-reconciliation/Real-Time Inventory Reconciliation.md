https://ohanafy.atlassian.net/browse/BMS-3825

# BMS-3825: Inventory Reconciliation

**Status:** In Progress | **Type:** Story | **Assigned:** Alvaro Sanchez

---

## Summary

Gulf's warehouses run continuous operations — drivers loading, receiving putting away, transfers in-flight. When they do a cycle count or full physical inventory, the live quantities keep changing underneath the count, making results unreliable the moment counting starts. Gulf currently relies on Vermont Information Processing for manual keying of discrepancies, which is painful and error-prone. They need a point-in-time snapshot mechanism so counting doesn't require freezing warehouse operations, and Finance can reconcile snapshot-vs-actual variances after counting completes.

## Impact

- **5 Gulf warehouses affected:** Milton FL, Montgomery AL, Mobile AL, Huntsville AL, McCalla AL
- Counts become unreliable immediately because transactions mutate live quantities during the count window
- Manual reconciliation through Vermont Information Processing creates GL discrepancy headaches
- GL/chart-of-accounts adjustments must NOT auto-trigger until variances are formally reviewed and approved
- Blocks reporting work (per Elliot's comment)

## Affected Customer

**Gulf Distributing** — all 5 warehouse locations. Persona: Gulf Inventory Analyst + Warehouse Managers + Finance.

## Proposed Solution (from ticket)

Inventory snapshotting: warehouse managers initiate cycle counts or full physical inventories, the system captures a point-in-time snapshot of quantities, operational activity continues uninterrupted, and Finance reconciles snapshot-vs-actual variances after counting completes.

---

## Readiness Assessment — NOT ready to pick up as-written

### Key blocker from Josh's polish (2026-06-01):

> **A cycle-count subsystem already exists and covers ~70% of the acceptance criteria.** The ticket's technical approach proposes three net-new objects (`Inventory_Snapshot__c`, `Snapshot_Line__c`, `Operational_Delta__c`) plus an "Inventory Count" object — but none of those exist. Meanwhile, a full inventory-count / cycle-count / adjustment subsystem is already built in the codebase.

The ticket needs to be **re-scoped against the existing subsystem** before engineering work starts. The gap is the remaining ~30% (snapshot-at-initiation, operational delta tracking, and Finance reconciliation), not a ground-up build.

### Open questions (Thomas Spangler, 2026-04-16):

1. What exactly is the output of an inventory snapshot? Single record? CSV-like file?
2. How is snapshot data used in GL adjustments?
3. Would users want to import snapshot info into an experience, with GL adjustments pre-populating based on discrepancies?

These questions appear **unanswered** in the ticket comments.

### Leah's note (2026-04-20):

> "This will be different from historical snapshotting and will need a solution for more real-time visibility for cycle/inventory counting. Might have implications on accounting as well."

### Big Kahuna attempted and failed (Josh, 2026-06-01):

Automated agent attempted the ticket, hit a runtime error after 409s, and bailed. Branch `bk/bms-3825-20260601-140941` was saved but no PR was opened.

---

## Before picking this up

1. **Re-scope against the existing cycle-count subsystem** — identify the ~30% gap (snapshot mechanism, delta tracking, Finance reconciliation) vs. what's already built
2. **Get Thomas's questions answered** — specifically the snapshot output format and GL adjustment flow
3. **Clarify Leah's accounting implications** — what exactly changes for the accounting side
