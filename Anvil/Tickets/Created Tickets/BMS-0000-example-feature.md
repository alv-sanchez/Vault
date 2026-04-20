---
ticket: BMS-0000
title: "Featured Promotions Banner on Homepage"
type: Story
status: In Progress
priority: Medium
assignee:
reporter:
epic: BMS-0001
sprint: Sprint 42
labels:
  - homepage
  - promotions
  - ecom
package: E-Commerce
effort: M
components:
  - homeFeaturedPromotionsBanner (LWC)
  - HomePageController (Apex)
blocked_by:
blocks:
created: 2026-04-10
updated: 2026-04-18
jira: https://example.atlassian.net/browse/BMS-0000
tags:
  - ticket
  - ecom
---

# BMS-0000: Featured Promotions Banner on Homepage |ECOM|

## Related
- Testing: [[BMS-0000-example-feature]] (in Testing Notes/)
- Docs: [[example-feature]] (in Documentation/)
- Engineering notes: [[BMS-0000-example-feature]] (in Engineering/)
- Source ask: [[example-stakeholder-request]] (in Manager/On-site Feedback/)
- Jira: https://example.atlassian.net/browse/BMS-0000

---

**Priority**: Medium
**Effort**: M (1–2 days)
**Components**: `homeFeaturedPromotionsBanner` LWC, `HomePageController.getFeaturedPromotions()` Apex, `Promotion__c.IsFeatured__c` field

## Story Statement

As a Retailer, I want to see active featured promotions the moment I land on the homepage, so that I can take advantage of current deals without hunting through the shop.

## Acceptance Criteria

### SCENARIO: Featured promotions render above the fold
**GIVEN** one or more `Promotion__c` records have `IsFeatured__c = true` and are active today
**WHEN** a retailer loads the homepage
**THEN** up to 3 featured promotions display in a banner above the category grid
**AND** each banner item links to the associated product or shop filter

### SCENARIO: No featured promotions, banner hidden
**GIVEN** no active featured promotions exist
**WHEN** a retailer loads the homepage
**THEN** the banner is not rendered (zero layout impact)

### SCENARIO: Admin toggles featured flag
**GIVEN** an admin unchecks `IsFeatured__c` on a live promotion
**WHEN** a retailer reloads the homepage within 5 minutes
**THEN** the unfeatured promotion no longer appears (cache TTL expected)

## Dependencies

- **Cannot Start Until**: None
- **This Story Unlocks**: Future analytics ticket on banner click-through
- **Ships With**: None

## Testing Notes

- Verify ordering: most-recently-created featured promotion first
- Verify banner hides cleanly when all featured promos expire mid-session
- Verify permission: guest users see the banner same as authenticated retailers
- Verify no regression on home page load time

## Implementation Notes

- New LWC placed above existing `homeCategoryGrid` via Lightning App Builder
- Apex caches results 5 minutes in Platform Cache (`FeaturedPromotions` partition)
- `IsFeatured__c` is a new checkbox on `Promotion__c` — include in deploy manifest
