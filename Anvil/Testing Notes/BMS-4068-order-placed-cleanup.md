# Testing Notes - BMS-4068: Order Placed Page Cleanup

## Related
- Ticket: [[BMS-4068-order-placed-cleanup]] (in Tickets/Created Tickets/)
- Jira: https://ohanafy.atlassian.net/browse/BMS-4068

---

| Ticket | Component | Change Type | Ticket Link |
|--------|-----------|-------------|-------------|
| BMS-4068 | ecomOrderPlaced | Enhancement | https://ohanafy.atlassian.net/browse/BMS-4068 |

## Overview
**Component**: `ecomOrderPlaced` LWC
**Change Type**: UI Cleanup
**Ticket Description**: Remove unimplemented elements from the order confirmation page.
**Impact Assessment**: Order placed page only.
**Load Testing Required**: [ ] Yes [x] No

---

## Test Cases

*ID prefix: TC-OP*

### Valid Cases

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-OP-001: Place an order and land on confirmation page | Page displays order number and delivery date |
| TC-OP-002: Verify order items display | Items show with images, quantities, prices |
| TC-OP-003: Product without Logo_URL__c | Silver can "IMAGE COMING SOON" placeholder shown |
| TC-OP-004: Email confirmation notice | Masked email displayed (e.g., "joh***@example.com") |
| TC-OP-005: Click "Continue Shopping" | Navigates to shop page |
| TC-OP-006: Click "View Order History" | Navigates to order history page |
| TC-OP-007: Place split invoice order | Confirmation page shows correctly for split invoices |

### Invalid Cases

| Test Case | Expected Behavior |
|-----------|-------------------|
| TC-OP-008: Look for "Review or edit your order" link | Not visible — removed |
| TC-OP-009: Look for "What happens next" box | Not visible — removed |
| TC-OP-010: Look for "We'll notify you when your order ships" | Not visible — removed |
| TC-OP-011: Look for "Track your delivery in Order History" | Not visible — removed |
