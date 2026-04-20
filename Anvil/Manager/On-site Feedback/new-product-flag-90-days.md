---
item: "\"New\" product flag with 90-day auto-expiry"
source: Go-live feedback
priority: Low
status: Not Started
type: Hybrid
effort: S
impact: Low
go_live_blocker: false
recommendation: DEFER
ticket:
assignee:
date_added: 2026-04-13
date_decided: 2026-04-13
date_completed:
blocked_by:
tags:
  - manager
  - ecom
  - deferred
  - merchandising
---
%%  %%
# "New" product flag with 90-day auto-expiry

> [!note] 💬 Pitch to Management
> **Sentiment source**: Go-live feedback list — stakeholder marked it Low themselves. Decision rule #5 — merchandising polish. Retailers browse products they already know on day 1 and won't notice the absence.
>
> **The pitch**: Recommending we defer to the first post-launch merchandising batch. No retailer is blocked, stakeholder already marked it Low, and two open design questions ("90 days from product creation or pricelist addition?", "badge on tile or filter-only?") mean shipping it pre-launch risks getting the UX wrong. Bundles cleanly with [[seasonal-shop-filter]] as a single merchandising PR — same LWC filter patterns, same post-launch slot.

## The Ask
> Need to add new field on the product called "New" that will retroactively update to unchecked on 90 days after product creation.
>
> Will need to add the field on the Product object and then create a flow to uncheck the box after 90 days. Then add as a filter on eCom.

## Source
**Who**: Go-live feedback list
**When**: 2026-04-13
**Where**: Feedback document

---

## Classification

**Type**: Hybrid (Data/Config + Code filter)
**Why**: New checkbox field + a scheduled flow on the Product object (both config) + adding a filter chip in the Shop LWC (code).

---

## Complexity

**What has to change:**
- `Is_New__c` checkbox field on the Product object
- Scheduled flow that runs daily, finds Products where `CreatedDate < TODAY() - 90` AND `Is_New__c = TRUE`, and unchecks them
- Shop LWC filter: expose "New" as a filter chip when any product has `Is_New__c = TRUE`
- Badging in the product tile (probably — stakeholder didn't ask but every "New" flag implies a visual)

**Rough effort**: S (half a day if the stakeholder doesn't also want a badge in the UI; M if they do)

**Risks / unknowns:**
- Should "New" be retroactively applied to products created in the last 90 days when the field ships? Probably yes — otherwise the feature looks broken on day 1.
- Is the 90-day clock from product creation or from first-pricelist-entry? "Created 6 months ago but just added to my pricelist" feels new to the retailer.

---

## Is this a go-live blocker?

**Answer**: No
**Reasoning**: Merchandising polish. Retailers won't notice its absence — they'll browse the products they know.

---

## The Case for NOW

- Small effort
- Drives discovery of new SKUs, which sells product

## The Case for LATER

- Stakeholder marked it Low themselves
- No retailer is blocked
- The "created vs. added-to-pricelist" question isn't answered, and getting it wrong makes the feature feel broken
- Post-launch we'll have actual merchandising feedback to inform the UX

---

## Recommendation

**Verdict**: DEFER (first post-launch merchandising batch)

**Justification**: Bundle with [[seasonal-shop-filter]] as a single "merchandising polish" post-launch PR. Shares the same filter/badge patterns.

---

## Open Questions

- [ ] 90 days from product creation or from pricelist addition?
- [ ] Visual badge on product tiles, or filter-only?
- [ ] Retroactive check on existing products when the field ships?

---

## Next Action

None pre-launch. Bundle with seasonal filter post-launch.

---

## Related

- Ticket: [[BMS-XXXX]] (to be cut post-launch)
- Sibling: [[seasonal-shop-filter]]
