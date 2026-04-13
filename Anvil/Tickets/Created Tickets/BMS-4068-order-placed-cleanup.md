# BMS-4068: Order Placed Page Cleanup — Remove Unimplemented Elements |ECOM|

## Related
- Jira: https://ohanafy.atlassian.net/browse/BMS-4068
- Testing: [[BMS-4068]] (in Testing/)
- Docs: [[BMS-4068]] (in Documentation/)

---

**Priority**: Medium
**Effort**: S
**Components**: `ecomOrderPlaced` LWC

## Story Statement

As a Retailer, I want the order confirmation page to only show accurate, actionable information, so that I'm not misled by features that don't exist yet (like shipment tracking or order editing).

## Acceptance Criteria

### SCENARIO: Clean Order Confirmation Display
**GIVEN** a retailer has successfully placed an order
**WHEN** the order confirmation page loads
**THEN** the "Review or edit your order" link is not visible
**AND** the "What happens next" box is not visible
**AND** the bullet "We'll notify you when your order ships" is not visible
**AND** the bullet "Track your delivery in Order History" is not visible

### SCENARIO: Remaining Content Intact
**GIVEN** a retailer views the order confirmation page
**WHEN** the page loads
**THEN** the order number is displayed
**AND** the expected delivery date is displayed
**AND** the order items with quantities, prices, and images are displayed
**AND** the email confirmation notice is displayed
**AND** "Continue Shopping" and "View Order History" buttons work correctly

## Dependencies
- **Cannot Start Until**: None
- **This Story Unlocks**: None
- **Ships With**: None

## Testing Notes
- Verify removed elements are not in the DOM (not just `display:none`)
- Verify page still works for both single and split invoice confirmations
- Verify order items display with the `ecomNoProductImage` default when no Logo_URL__c

## Implementation Notes
- Component: `ecomOrderPlaced` LWC (`ecomOrderPlaced.html`)
- Remove the "What happens next" section entirely from the template
- Remove the "Review or edit your order" link
- Remove shipping/tracking bullet points
