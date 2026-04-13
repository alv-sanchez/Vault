# Testing Notes - BMS-4066: Support Page Overhaul

## Related
- Ticket: [[BMS-4066-support-page-overhaul]] (in Tickets/Created Tickets/)
- Jira: https://ohanafy.atlassian.net/browse/BMS-4066

---

| Ticket | Component | Change Type | Ticket Link |
|--------|-----------|-------------|-------------|
| BMS-4066 | ecomSupport | Enhancement | https://ohanafy.atlassian.net/browse/BMS-4066 |

## Overview
**Component**: `ecomSupport` LWC
**Change Type**: Enhancement
**Ticket Description**: Remove Contact Support and Submit Tickets sections, add 13 FAQs across 7 categories.
**Impact Assessment**: Support page only — no other pages affected.
**Load Testing Required**: [ ] Yes [x] No

---

## Test Cases

*ID prefix: TC-SP*

### Valid Cases

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-SP-001: Navigate to Support page | Page loads with FAQ accordion visible |
| TC-SP-002: Verify 7 FAQ categories present | Ordering & Navigation, Cart & Checkout, Promotions, Inventory & Fulfillment, Delivery, Payments, Account & Support |
| TC-SP-003: Count total FAQs | 13 FAQs across all categories |
| TC-SP-004: Expand a FAQ | Answer displays, only one FAQ open at a time |
| TC-SP-005: Expand a second FAQ | Previous FAQ collapses, new one opens |
| TC-SP-006: Verify "Who do I contact if I need help?" answer | "For any questions or support, please contact your account manager directly." |
| TC-SP-007: Verify "How do I browse and find products?" answer | Contains "search bar", "product name, brand, or promotions", "filter by brand, package type, size, and availability" |
| TC-SP-008: Verify "What if an item cannot be fulfilled?" answer | Contains "In Stock indicator", "not be included on your final invoice" |
| TC-SP-009: View on mobile | FAQs render correctly, accordion works on touch |

### Invalid Cases

| Test Case | Expected Behavior |
|-----------|-------------------|
| TC-SP-010: Look for "Contact Support" section | Not visible — fully removed |
| TC-SP-011: Look for "Submit Tickets" tab | Not visible — fully removed |
