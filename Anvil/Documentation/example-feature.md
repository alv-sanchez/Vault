---
feature: "Featured Promotions Banner"
type: Documentation
component: homeFeaturedPromotionsBanner
package:
status: Published
tickets:
  - BMS-0000
confluence:
last_updated: 2026-04-18
tags:
  - docs
  - ecom
---

# Featured Promotions Banner
> **Confluence**: TBD

## Component
`homeFeaturedPromotionsBanner` LWC + `HomePageController.getFeaturedPromotions()` Apex

## Tickets

| Ticket | Date Added | Engineer | Ticket Type |
|---|---|---|---|
| [[BMS-0000-example-feature]] | 2026-04-10 | _(assignee)_ | Story |

---

## 1. Business Context Overview

**Purpose**:
Surface active featured promotions on the homepage so retailers can act on deals immediately, without navigating to the shop.

**Target Users**:
Retailers

**Key Features**:

- Up to 3 featured promotions render in a banner above the category grid
- Banner auto-hides when no featured promotions are active
- 5-minute Platform Cache TTL for performance

---

## 2. Features

### Homepage Banner Display

- Renders when one or more `Promotion__c` records have `IsFeatured__c = true` and are within their active date range
- Ordered by `CreatedDate DESC`, capped at 3 items
- Each item links to the promo's target URL (product page or shop filter)

### Admin Control

- Admins toggle `Promotion__c.IsFeatured__c` to include/exclude a promotion from the banner
- Changes propagate within 5 minutes (cache TTL)

---

## 3. Known Issues & Workarounds

- Platform Cache TTL means admin changes aren't instant. Workaround: admins can clear the `FeaturedPromotions` partition manually if they need immediate propagation during a launch.

---

## 4. UI Components (Pages)

- Home page (`/s/home`) — placed above the category grid via Lightning App Builder

---

## 5. Backend Notes


| Object / Records Retrieved | Outcome Description |
| -------------------------- | ------------------- |
| `Promotion__c` where `IsFeatured__c = true` and active date range | Up to 3 records, ordered `CreatedDate DESC`, cached 5 min |


---

## 6. Impact & User Considerations

- **Performance**: 5-minute Platform Cache ensures no per-request SOQL on homepage load
- **UX**: Banner is additive — zero layout impact when no featured promotions exist
- **Business Logic**: Ordering by `CreatedDate` means a newly featured promo takes the first slot on its next cache refresh

---

## 7. Change Log

| Date | Ticket | Change |
| ---- | ------ | ------ |
| 2026-04-18 | [[BMS-0000-example-feature]] | Initial release — banner, cache, admin toggle |

