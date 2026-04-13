# Testing Notes - BMS-4072: Delivery Cutoff Banner

## Related
- Ticket: [[BMS-4072-delivery-banner-cutoff-fix]] (in Tickets/Created Tickets/)
- Jira: https://ohanafy.atlassian.net/browse/BMS-4072

---

| Ticket | Component | Change Type | Ticket Link |
|--------|-----------|-------------|-------------|
| BMS-4072 | navigationMenu, userDataService, ecomReviewSummary | Enhancement | https://ohanafy.atlassian.net/browse/BMS-4072 |

## Overview
**Component**: `navigationMenu` LWC, `userDataService` LWC, `ecomReviewSummary` LWC
**Change Type**: Enhancement
**Ticket Description**: Dynamic cutoff time from Location, auto-hide after cutoff, delivery dates filtered by active routes.
**Impact Assessment**: Delivery banner on all pages + delivery date selection on checkout.
**Load Testing Required**: [ ] Yes [x] No

---

## Test Cases

*ID prefix: TC-DB*

### Valid Cases — Banner

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-DB-001: Location has Warehouse_Cutoff_Time__c = 4:30 PM | Banner: "Place order by 4:30 PM..." |
| TC-DB-002: Monday delivery, cutoff 4:30 PM | Banner: "Place order by 4:30 PM Friday..." |
| TC-DB-003: Tuesday delivery, cutoff 4:30 PM | Banner: "Place order by 4:30 PM Monday..." |
| TC-DB-004: Cutoff is today | Banner says "today" instead of day name |
| TC-DB-005: Current time is after cutoff | Banner is hidden |
| TC-DB-006: Current time is before cutoff | Banner is visible |

### Valid Cases — Delivery Dates

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-DB-007: Account with Monday + Thursday active routes | Only Mon/Thu deliveries shown on checkout |
| TC-DB-008: Today is a delivery day | Today's delivery NOT shown (uses > TODAY) |

### Invalid Cases

| Test Case | Expected Behavior |
|-----------|-------------------|
| TC-DB-009: Location has no Warehouse_Cutoff_Time__c | Banner is NOT displayed |
| TC-DB-010: Account has no active delivery routes | No delivery dates shown, falls back to free-form date |
| TC-DB-011: Banner shows "5:00 PM" hardcoded | Should NOT happen — pulls from Location field |
| TC-DB-012: Banner shows "Sunday" for Monday delivery | Should NOT happen — shows "Friday" |
