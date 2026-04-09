# DRAFT-006: Delivery Cutoff Banner — Dynamic Time & Auto-Hide |ECOM|

## Related
- Testing: [[DRAFT-006]] (in Testing/)
- Docs: [[DRAFT-006]] (in Documentation/)

---

**Priority**: High
**Effort**: M
**Components**: `navigationMenu` LWC, `userDataService` LWC, `ecomReviewSummary` LWC

## Story Statement

As a Retailer, I want the delivery cutoff banner to show the actual warehouse cutoff time from my location (not a hardcoded "5:00 PM"), hide after the cutoff has passed, and only show delivery dates for my active routes, so that I receive accurate ordering guidance.

## Acceptance Criteria

### SCENARIO: Dynamic Cutoff Time
**GIVEN** a retailer's account is fulfilled from a Location with `Warehouse_Cutoff_Time__c = 2:00 PM`
**WHEN** the delivery banner renders
**THEN** the message reads: "Place order by 2:00 PM [today/day] to receive delivery on [delivery date]."
**AND** the time is NOT hardcoded to 5:00 PM

### SCENARIO: Banner Hidden After Cutoff
**GIVEN** a retailer's warehouse cutoff is 2:00 PM today
**WHEN** the current time is 2:01 PM or later
**THEN** the delivery cutoff banner is not displayed

### SCENARIO: Banner Hidden When No Cutoff Time
**GIVEN** a retailer's fulfillment location has no `Warehouse_Cutoff_Time__c` set
**WHEN** the page loads
**THEN** the delivery cutoff banner is not displayed

### SCENARIO: Delivery Date Matches Active Routes
**GIVEN** a retailer has active delivery routes for Monday and Thursday
**WHEN** the review/checkout page loads delivery date options
**THEN** only deliveries on Monday and Thursday routes are shown
**AND** deliveries on inactive routes or routes not assigned to this account are excluded

### SCENARIO: Delivery Dates Exclude Today
**GIVEN** today is Monday and the retailer has a Monday delivery route
**WHEN** the review page loads delivery dates
**THEN** today's delivery is NOT shown (query uses `> TODAY`, not `>= TODAY`)
**AND** the next available delivery is shown

## Dependencies
- **Cannot Start Until**: `Warehouse_Cutoff_Time__c` field exists on Location__c (OHFY-CORE)
- **This Story Unlocks**: None
- **Ships With**: None

## Testing Notes
- Verify `userDataService.js` queries `ohfy__Fulfilled_From__r.ohfy__Warehouse_Cutoff_Time__c` on Account
- Verify `navigationMenu.js` reads `userDataService.warehouseCutoffTime` (milliseconds from midnight)
- Verify `formatCutoffTime()` converts ms to "2:00 PM" format, returns null when no cutoff
- Verify banner hide logic: builds full cutoff DateTime from cutoffDate + cutoffTime, compares against `new Date()`
- Verify `ecomReviewSummary.js` `setDefaultDateToClosestRouteDate()` queries active `Account_Route__c` first, then filters `Delivery__c` by those route IDs
- Verify delivery query uses `> TODAY` not `>= TODAY`

## Implementation Notes
- `userDataService.js`: Added `ohfy__Fulfilled_From__r.ohfy__Warehouse_Cutoff_Time__c` to account fields query, stored as `warehouseCutoffTime`, exposed in `getUserData()` and `getAllData()`
- `navigationMenu.js`: `loadDeliveryMessage()` — guard: `!lockedDelivery && userDataService.warehouseCutoffTime != null`, builds `cutoffDateTime` from cutoff date + time, hides banner if `now >= cutoffDateTime`, `formatCutoffTime()` helper converts ms→string
- `ecomReviewSummary.js`: `setDefaultDateToClosestRouteDate()` — first queries `Account_Route__c` for active delivery routes, then filters `Delivery__c` with `Route__c IN (activeRouteIds)` and `> TODAY`
