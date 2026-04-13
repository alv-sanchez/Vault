# Testing Notes - BMS-4074: Reorder Modal Stock Check

## Related
- Ticket: [[BMS-4074-reorder-modal-stock-check]] (in Tickets/Created Tickets/)
- Jira: https://ohanafy.atlassian.net/browse/BMS-4074

---

| Ticket   | Component    | Change Type | Ticket Link                                   |
| -------- | ------------ | ----------- | --------------------------------------------- |
| BMS-4074 | reorderModal | Enhancement | https://ohanafy.atlassian.net/browse/BMS-4074 |

## Overview
**Component**: `reorderModal` LWC
**Change Type**: Enhancement
**Ticket Description**: Check stock availability on reorder modal open, show out-of-stock section, block remove on last item.
**Impact Assessment**: Reorder modal (Order History + Home Page).
**Load Testing Required**: [ ] Yes [x] No

---

## Test Cases

*ID prefix: TC-RM*

### Valid Cases

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-RM-001: Open reorder modal on an order | Stock availability fetched, items split into in-stock and out-of-stock |
| TC-RM-002: All items in stock | All items show with quantity steppers, no "Out of Stock" section |
| TC-RM-003: Some items out of stock | Out-of-stock items at bottom with red "Out of Stock" header, greyed out |
| TC-RM-004: Out-of-stock item display | No quantity steppers, "Currently unavailable" label, reorder qty = 0 |
| TC-RM-005: All items out of stock | All under "Out of Stock" header, "Add to Cart" button disabled |
| TC-RM-006: One in-stock item remaining | Remove button visually disabled (greyed out, not clickable) |
| TC-RM-007: Two in-stock items, remove one | Remove button works, one item left — remove button becomes disabled |
| TC-RM-008: Change quantities then close modal | Original order in Order History unchanged |
| TC-RM-009: Add items to cart from modal | Items added via bulk add, toast confirmation |
| TC-RM-010: View on mobile | Out-of-stock section renders correctly in card layout |

### Invalid Cases

| Test Case | Expected Behavior |
|-----------|-------------------|
| TC-RM-011: Stock API fails | Modal still opens, all items shown as in-stock (non-blocking) |
| TC-RM-012: Remove last in-stock item | Should NOT be possible — button is disabled |
| TC-RM-013: Edit quantities mutates order history | Should NOT happen — deep clone on open |
