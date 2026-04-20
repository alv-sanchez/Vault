---
ticket: BMS-0000
title: "Featured Promotions Banner on Homepage"
type: Testing Notes
status: Ready for QA
component: homeFeaturedPromotionsBanner
change_type: New Feature
load_testing: false
package: E-Commerce
jira: https://example.atlassian.net/browse/BMS-0000
tags:
  - testing
  - ecom
---

# Testing Notes - BMS-0000: Featured Promotions Banner on Homepage

## Related
- Ticket: [[BMS-0000-example-feature]] (in Tickets/Created Tickets/)
- Docs: [[example-feature]] (in Documentation/)

---

| Ticket | Component | Change Type | Ticket Link |
|--------|-----------|-------------|-------------|
| BMS-0000 | homeFeaturedPromotionsBanner | New Feature | https://example.atlassian.net/browse/BMS-0000 |

---

## Overview
**Component**: `homeFeaturedPromotionsBanner` LWC + `HomePageController.getFeaturedPromotions()` Apex
**Change Type**: New Feature
**Ticket Description**: Display up to 3 active featured promotions in a banner above the homepage category grid.
**Impact Assessment**: Additive — banner hides when no featured promotions exist, so no visual change for accounts without featured data.
**Load Testing Required**: [ ] Yes [x] No

---

## Configuration Preferences

| Configuration Preference Name | New? | Active / Inactive | Value (if applicable) |
|------------------------------|------|-------------------|------------------------|
| N/A | - | - | - |

*None required*

---

## Pre-existing Data / Preconditions

| Preconditions ID | Object(s) | Fields & Values | Description |
|------------------|-----------|-----------------|-------------|
| PRE-01 | Promotion__c | IsFeatured__c = true, IsActive__c = true, StartDate <= today, EndDate >= today | One qualifying featured promotion |
| PRE-02 | Promotion__c | As PRE-01, ×3 records | Three qualifying featured promotions |
| PRE-03 | Promotion__c | IsFeatured__c = true, EndDate = yesterday | Featured promotion already expired |

---

## UI Component Details

### Setup / Navigation

**Component Location**:
- Homepage (`/s/home`), positioned above the category grid
- Not rendered on any other page

### Input Fields / Interactive Elements

| Input Label/Descriptor | Type | Allowed Inputs/Values |
|------------------------|------|------------------------|
| Banner item click | Link | Navigates to promo target URL |

---

## Test Cases

*ID prefix: TC-0000*

### Valid Cases

#### **Featured Promotions Banner - Valid Cases**

| Test Case | Expected Outcome | Preconditions ID |
|-----------|------------------|------------------|
| TC-0000-01: Load homepage with 1 featured promo | Banner renders with 1 item | PRE-01 |
| TC-0000-02: Load homepage with 3 featured promos | Banner renders with 3 items, most-recent first | PRE-02 |
| TC-0000-03: Click banner item | Browser navigates to promo target URL | PRE-01 |

---

### Invalid Cases

#### **Featured Promotions Banner - Invalid Cases**

| Test Case | Expected Behavior | Preconditions ID |
|-----------|-------------------|------------------|
| TC-0000-04: No featured promos exist | Banner is not rendered (no empty state) | None |
| TC-0000-05: Expired featured promo | Banner omits the expired item | PRE-03 |
