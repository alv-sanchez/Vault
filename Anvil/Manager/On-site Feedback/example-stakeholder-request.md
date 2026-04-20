---
item: "Surface active promos on homepage"
source: "Example stakeholder — customer workshop"
priority: Medium
status: Ticket Cut
type: Code
effort: M
impact: M
go_live_blocker: false
recommendation: DO NOW
ticket: BMS-0000
assignee:
date_added: 2026-04-08
date_decided: 2026-04-09
date_completed:
blocked_by:
tags:
  - manager
  - ecom
---

# Surface active promos on homepage

> [!note] 💬 Pitch to Management
> **Sentiment source**: Customer workshop feedback — multiple retailers said they missed active promos entirely because the shop page is one click away and promos aren't surfaced on land.
>
> **The pitch**: Happy to pick this up — M-effort LWC + small Apex change, low risk (additive, hides cleanly when no data). Ships visible value for retailers who currently don't know our promos exist. No schema risk beyond a new checkbox field on `Promotion__c`.

## The Ask
> "When I log in I want to see what's on sale. Right now I have to go hunt in the shop and by then I've already decided what I'm ordering."

## Source
**Who**: Example Stakeholder (retailer)
**When**: 2026-04-08
**Where**: Customer feedback workshop

---

## Classification

**Type**: Code
**Why**: New LWC + small Apex cached query + one new field on `Promotion__c`.

---

## Complexity

**What has to change:**
- New field `Promotion__c.IsFeatured__c`
- New Apex method `HomePageController.getFeaturedPromotions()` with Platform Cache
- New LWC `homeFeaturedPromotionsBanner`
- Home page Lightning page edit

**Rough effort**: M (1–2 days)

**Risks / unknowns:**
- Cache TTL vs. admin-expectation of immediate propagation — mitigate with docs

---

## Is this a go-live blocker?

**Answer**: No
**Reasoning**: Portal launches without it and retailers can still find promos via shop. But it's high-visibility and low-risk, so DO NOW.

---

## The Case for NOW

- Direct stakeholder ask from workshop
- Low effort, low risk (additive)
- Visible improvement at launch

## The Case for LATER

- Not a functional blocker; portal works without it

---

## Recommendation

**Verdict**: DO NOW

**Justification**: Direct customer ask, clear scope, low risk. Cheap visible win at launch.

---

## Open Questions

- [x] Confirm 3-item cap with stakeholder — confirmed
- [x] Confirm target URL behavior for each promo — goes to product or shop filter depending on promo type

---

## Next Action

Ticket cut as [[BMS-0000-example-feature]] — in engineering now.

---

## Related

- Ticket: [[BMS-0000-example-feature]]
- Slack:
- Screenshots:
