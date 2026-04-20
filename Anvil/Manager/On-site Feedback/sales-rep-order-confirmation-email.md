---
item: "[[sales-rep-order-confirmation-email|Sales rep gets email when their retailer submits an order]]"
link: "[[sales-rep-order-confirmation-email|Sales rep gets email when their retailer submits an order]]"
source: Go-live feedback
priority: High
status: Not Started
type: Config
effort: S
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
  - go-live
  - notifications
  - fight-now
---
%%  %%
# Sales rep gets email when their retailer submits an order

> [!note] 💬 Pitch to Management
> **Sentiment source**: Go-live feedback list. Decision rule #6 — this is visibility/trust for the sales team, who otherwise have zero insight into their own book of business on day 1. Also decision rule #3 — config-only work with zero risk.
>
> **The pitch**: Happy to pick this up — half a day of config work: a record-triggered flow on Order confirmation plus a short email template. Zero risk (additional email, not a behavior change), huge trust win with the sales team pre-launch. Pairs with [[confirmation-email-sales-rep-contact]] since both need the same rep-assignment field lookup — I'd ship them together as one notifications PR. Ready to start whenever you give the word.

## The Ask
> The assigned sales rep should receive an email whenever their retailer submits an order.

## Source
**Who**: Go-live feedback list
**When**: 2026-04-13
**Where**: Feedback document

---

## Classification

**Type**: Config
**Why**: Salesforce already knows the account's assigned rep and already fires order-creation events. This is an email template + a flow/trigger that targets the rep — no new objects, no new UI.

---

## Complexity

**What has to change:**
- New email template (or reuse order confirmation template with a different merge context)
- A record-triggered flow on `Order__c` / draft invoice confirmation that finds the account's sales rep and sends the email
- Confirm the rep assignment field (likely `Account.Owner` or a dedicated `Sales_Rep__c`)

**Rough effort**: S (half a day)

**Risks / unknowns:**
- Which field holds the rep assignment? Account Owner vs custom lookup.
- Does the rep want every order or a daily digest? Default to every-order and iterate.

---

## Is this a go-live blocker?

**Answer**: Yes
**Reasoning**: Without this, sales reps have zero visibility into their own book of business' ecom activity on day 1. That's exactly the kind of "surprise" that erodes trust in the new system. Reps need to feel ecom is FOR them, not against them.

---

## The Case for NOW

- Tiny effort (half a day of config)
- Massive trust payoff with the sales team pre-launch
- Pairs naturally with the other two notification asks on this list — ship them as a single notifications-polish PR
- Zero risk — it's an additional email, not a behavior change

## The Case for LATER

- Only if notification-framework work is already in the sprint and adding this would cause conflicts. That's not the case right now.

---

## Recommendation

**Verdict**: DO NOW

**Justification**: Bundle with the "confirmation-email sales rep contact" and "automated reorder reminders" items into one notification-polish sprint slice. They share infrastructure and should ship together.

---

## Open Questions

- [ ] Which field holds the assigned sales rep — Account Owner or a custom lookup?
- [ ] Every order or daily digest? (Default: every order)
- [ ] Include order detail (line items, total) or just a "new order from X" ping?

---

## Next Action

Confirm rep assignment field with Alvaro, then create the flow + email template in a single PR.

---

## Related

- Ticket: [[BMS-XXXX]] (to be cut)
- Sibling: [[confirmation-email-sales-rep-contact]]
- Sibling: [[automated-reorder-reminders]]
