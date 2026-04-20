---
item: Order cutoff must use business days, not calendar days
source: Go-live feedback
priority: High
status: Completed
type: Code
effort: M
impact: High
go_live_blocker: true
recommendation: DO NOW
ticket:
assignee:
date_added: 2026-04-13
date_decided: 2026-04-13
date_completed:
blocked_by:
tags:
  - manager
  - ecom
  - completed
  - audit
---
%%  %%
# Order cutoff must use business days, not calendar days

> [!note] 💬 Pitch to Management
> **Sentiment source**: Go-live feedback list, High priority. Decision rule #1 — retailers were seeing "Order by Sunday 4pm" for a Monday delivery, which would have caused guaranteed day-1 warehouse complaints (warehouse doesn't operate weekends). That's a broken promise to the retailer, not a polish item.
>
> **The pitch**: Already shipped ✅. Holiday handling (e.g. Monday federal holiday pushing cutoff back further) is noted as a follow-up question — worth flagging at retro whether that ships pre-launch or lands post-launch. The business-day helper from this fix is reusable by [[automated-reorder-reminders]] when that work starts, so it earned its keep twice.

## The Ask
> For accounts that are on a Monday delivery, currently it's saying that "Sunday at 4pm" is the last time to place an order. This needs to be changed to business days, so for accounts that have a delivery day of Monday, Friday needs to be the last time they can place an order.
>
> They do not work Saturday or Sundays, and they pick trucks on Friday. Business days need to be accounted for, not every day. Otherwise they'll be placing orders on the weekend.

## Source
**Who**: Go-live feedback list
**When**: 2026-04-13
**Where**: Feedback document

---

## Classification

**Type**: Code (business-day calculation)
**Why**: The cutoff calculator needed to walk backward through business days instead of calendar days, skipping Saturday and Sunday.

---

## Complexity

**What has to change:**
- Cutoff calculation in the delivery/cutoff service
- `isBusinessDay(date)` helper (probably already exists somewhere in OHFY-Core)
- The banner/messaging in `ecomDeliveryBanner` or equivalent LWC that shows "last time to order"
- Holiday handling — likely out of scope for this fix but worth noting (e.g. Monday after a federal holiday should push cutoff back further)

**Effort**: M (1–2 days including the messaging update)

---

## Is this a go-live blocker?

**Answer**: Yes
**Reasoning**: Retailers would have seen "order by Sunday 4pm" for a Monday delivery, placed an order on Sunday, and been surprised when the warehouse (which doesn't operate weekends) missed the pick. Guaranteed day-1 complaint.

---

## Recommendation

**Verdict**: DO NOW ✅ (Completed)

**Justification**: Cutoff logic that doesn't match the warehouse's actual working days is a broken promise to the retailer.

---

## Resolution

✅ **Completed.**

Action items for verification pre-launch:
- [ ] Regression test Monday, Tuesday, Wednesday, Thursday, Friday delivery accounts — confirm cutoffs are F, M, T, W, Th respectively
- [ ] Holiday test: pick a federal holiday that falls on a Monday, confirm the cutoff for the Tuesday delivery shifts to the previous Friday (if holiday support is in scope)
- [ ] Banner wording test: confirm the retailer sees "Order by FRIDAY 4pm" not "Order by SUNDAY 4pm"
- [ ] Business-day helper is documented so [[automated-reorder-reminders]] can reuse it

---

## Related

- Ticket: [[BMS-XXXX]] (if one was cut)
- Reused by: [[automated-reorder-reminders]]
