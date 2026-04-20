---
ticket: BMS-0000
title: "Featured Promotions Banner on Homepage"
type: Story
status: In Review
priority: Medium
assignee:
reporter:
epic: BMS-0001
sprint: Sprint 42
labels:
  - homepage
  - promotions
repo: example-org/ecom-sf
packages_touched:
  - OHFY-PLTFM-UI
  - OHFY-PLTFM
branch: feature/BMS-0000-featured-promotions-banner
pr: https://github.com/example-org/ecom-sf/pull/1234
commits:
  - abc1234
  - def5678
deploy_status: deployed-sandbox
created: 2026-04-10
updated: 2026-04-18
started: 2026-04-14
completed:
jira: https://example.atlassian.net/browse/BMS-0000
tags:
  - engineering
---

# BMS-0000: Featured Promotions Banner on Homepage

## Related
- Jira: https://example.atlassian.net/browse/BMS-0000
- Epic: [[BMS-0001]]
- PR: https://github.com/example-org/ecom-sf/pull/1234
- Branch: `feature/BMS-0000-featured-promotions-banner`

---

## Story Statement
As a Retailer, I want to see active featured promotions the moment I land on the homepage, so that I can take advantage of current deals without hunting through the shop.

## Why It Matters
Stakeholder feedback (see [[example-stakeholder-request]]) indicated retailers were missing promos entirely because the shop page was one click away. Surfacing 1–3 curated promos on land has a measurable effect on deal uptake in comparable portals.

---

## Scope

### Packages Touched
- [ ] OHFY-Data-Model
- [ ] OHFY-Utilities
- [ ] OHFY-Service-Locator
- [x] OHFY-PLTFM
- [ ] OHFY-OMS
- [ ] OHFY-WMS
- [ ] OHFY-REX
- [x] OHFY-PLTFM-UI
- [ ] OHFY-OMS-UI
- [ ] OHFY-WMS-UI
- [ ] OHFY-REX-UI

### Implementation Plan
1. Add `IsFeatured__c` checkbox to `Promotion__c`
2. Build `HomePageController.getFeaturedPromotions()` Apex with 5-min Platform Cache
3. Build `homeFeaturedPromotionsBanner` LWC (3-item max, hides when empty)
4. Wire into home page via Lightning App Builder
5. Apex + LWC Jest tests, manual sandbox verification

---

## Working Notes
_Append-only log of decisions, gotchas, and direction changes during dev. Date each entry._

### 2026-04-14
- Spun up `feature/BMS-0000-featured-promotions-banner`. Opted for Platform Cache over `@AuraEnabled(cacheable=true)` only — we need server-side cache too so admin changes don't require per-user action.

### 2026-04-16
- Jest flagged banner rendering when query returned `[]`. Fixed by gating the `<template>` on `promotions?.length > 0`.

### 2026-04-18
- Deployed to sandbox, QA verification in progress. See [[BMS-0000-example-feature]] in Testing Notes.

---

## Files Changed
| Path | Change | Why |
|---|---|---|
| `force-app/main/default/objects/Promotion__c/fields/IsFeatured__c.field-meta.xml` | Added | New flag |
| `force-app/main/default/classes/HomePageController.cls` | Added method | Cached query |
| `force-app/main/default/lwc/homeFeaturedPromotionsBanner/*` | Added | New component |
| `force-app/main/default/flexipages/Home.flexipage-meta.xml` | Edited | Place LWC |

---

## Testing
- [x] Apex tests passing locally
- [x] LWC Jest tests passing
- [ ] E2E coverage (if applicable)
- [x] Manual scratch-org verification

**Test notes:**
- Verified 0, 1, 3-promotion states; verified 5-min cache TTL by admin-toggling and refreshing

---

## Deployment
- [x] Deployed to scratch org
- [x] Deployed to sandbox
- [ ] Deployed to UAT
- [ ] Released

---

## End-of-Ticket Summary
_Filled at finalization._

**What shipped:**

**Deferred / follow-up:**

**Lessons / surprises:**
