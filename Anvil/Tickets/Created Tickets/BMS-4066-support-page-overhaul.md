# BMS-4066: Support Page Overhaul — FAQ Updates, Remove Contact Support & Submit Tickets |ECOM|

## Related
- Jira: https://ohanafy.atlassian.net/browse/BMS-4066
- Testing: [[BMS-4066]] (in Testing/)
- Docs: [[BMS-4066]] (in Documentation/)

---

**Priority**: Medium
**Effort**: S
**Components**: `ecomSupport` LWC

## Story Statement

As a Retailer, I want the support page to show comprehensive, up-to-date FAQs organized by category, so that I can self-serve common questions without needing a support ticket or direct contact form.

## Acceptance Criteria

### SCENARIO: FAQ Content Displays Correctly
**GIVEN** a retailer navigates to the Support page
**WHEN** the page loads
**THEN** FAQs are displayed grouped by category: Ordering & Navigation, Cart & Checkout, Promotions, Inventory & Fulfillment, Delivery, Payments, Account & Support
**AND** each FAQ is expandable/collapsible
**AND** only one FAQ is expanded at a time

### SCENARIO: Contact Support Section Removed
**GIVEN** a retailer navigates to the Support page
**WHEN** the page loads
**THEN** the "Contact Support" section is no longer visible
**AND** the "Submit Tickets" tab is no longer visible

### SCENARIO: Updated FAQ — "Who do I contact if I need help?"
**GIVEN** a retailer expands the "Who do I contact if I need help?" FAQ
**WHEN** the answer is displayed
**THEN** it reads: "For any questions or support, please contact your account manager directly."

### SCENARIO: Updated FAQ — "How do I browse and find products?"
**GIVEN** a retailer expands the "How do I browse and find products?" FAQ
**WHEN** the answer is displayed
**THEN** it reads: "Use the search bar at the top of the page to find products by product name, brand, or promotions, or navigate to the Shop page to browse using filters in the sidebar. You can filter by brand, package type, size, and availability."

### SCENARIO: Updated FAQ — "What if an item cannot be fulfilled?"
**GIVEN** a retailer expands the "What if an item cannot be fulfilled?" FAQ
**WHEN** the answer is displayed
**THEN** it reads: "Items marked with the 'In Stock' indicator are available and can be fulfilled. If an item cannot be fulfilled, it will not be included on your final invoice."

### SCENARIO: New FAQs Added
**GIVEN** a retailer views the Support page
**WHEN** the page loads
**THEN** the following new FAQs are present:
- "How do I place an order?" (Ordering & Navigation)
- "How do I reorder products?" (Ordering & Navigation)
- "How do I review my cart and checkout?" (Cart & Checkout)
- "How do promotions work?" (Promotions)
- "What happens if a product is out of stock?" (Inventory & Fulfillment)
- "How do I know my delivery days?" (Delivery)
- "When do I need to place an order for next-day delivery?" (Delivery)
- "What payment terms are available?" (Payments)
- "How do I update my contact information?" (Account & Support)

## Dependencies
- **Cannot Start Until**: None
- **This Story Unlocks**: None
- **Ships With**: None

## Testing Notes
- Verify all 13 FAQs render with correct copy
- Verify "Contact Support" section is fully removed (not just hidden)
- Verify "Submit Tickets" tab is fully removed
- Verify expand/collapse behavior — only one open at a time
- Verify mobile responsiveness of FAQ accordions

## Implementation Notes
- Component: `ecomSupport` LWC (`ecomSupport.js`, `ecomSupport.html`)
- FAQ data is hardcoded in JS — categories: ordering, cart, promotions, inventory, delivery, payments, account
- `expandedFaqId` state controls accordion behavior
- Remove any routing or handlers tied to Contact Support / Submit Tickets
