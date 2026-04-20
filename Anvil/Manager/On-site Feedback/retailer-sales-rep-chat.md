---
item: Chat portal between retailer and sales rep
source: Go-live feedback
priority: Low
status: Not Started
type: Code
effort: XL
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
  - post-launch
---
%%  %%
# Chat portal between retailer and sales rep

> [!note] 💬 Pitch to Management
> **Sentiment source**: Go-live feedback list — stakeholder marked it Low themselves. Decision rule #4 — brand-new surface area (real-time communication channel) that needs discovery, not a rush. Decision rule #5 adjacent — this isn't merchandising polish but it's the same "doesn't belong pre-launch" category.
>
> **The pitch**: Recommending we defer and revisit 2–3 months post-launch. This is XL work with licensing implications (Digital Engagement isn't free) and needs real user research with the reps first — launching a chat feature that reps don't actively staff would be worse than not having it at all. Retailers can already call or text their rep today; a lightweight "contact my rep" mailto/tel button would satisfy 80% of the need at 2% of the cost if anyone pushes to accelerate.

## The Ask
> Having a chat portal on ecomm where the retailer can talk to their sales rep.

## Source
**Who**: Go-live feedback list
**When**: 2026-04-13
**Where**: Feedback document

---

## Classification

**Type**: Code (significant new surface area)
**Why**: This is not a field or a template — it's a new real-time communication surface. Either Salesforce Chat/Messaging for In-App (SMS-style session-based), Experience Cloud chat (requires Digital Engagement license), or a custom LWC with a message store. Every option is real engineering + licensing.

---

## Complexity

**What has to change:**
- Decide on the underlying tech: Salesforce Messaging, Experience Cloud Chat, or custom
- Licensing cost (Digital Engagement is not free)
- Agent routing / rep availability logic
- Message store + retention / compliance
- Mobile and desktop responsive design for the chat widget
- Sales rep side — a console or at least an inbox

**Rough effort**: XL (weeks, plus licensing procurement)

**Risks / unknowns:**
- Do Gulf's reps actually want real-time chat, or do they prefer phone? Reps often resist chat tools that add to their queue.
- Licensing — does Gulf's org have Digital Engagement? If not, this is a procurement conversation, not a dev conversation.

---

## Is this a go-live blocker?

**Answer**: No
**Reasoning**: Retailers can already call or text their rep today. This is a channel addition, not a missing feature. Stakeholder marked it Low priority themselves.

---

## The Case for NOW

- None defensible. It's been marked Low by the stakeholder for a reason.

## The Case for LATER

- Massive surface area and licensing implications deserve a proper discovery phase
- No retailer is blocked today
- Launching a chat feature that reps don't staff is worse than not having it — we'd train retailers to expect a response that never comes
- Every hour on this is an hour stolen from the fights above the fold

---

## Recommendation

**Verdict**: DEFER (revisit 2–3 months post-launch)

**Justification**: Wrong shape for pre-launch triage. Needs a discovery phase (user research with reps, licensing conversation, competitive review) before it's even a ticket. Park it and revisit once ecom is live and we have real retailer/rep feedback.

---

## Open Questions

- [ ] Do reps actually want this, or is this a retailer-driven ask?
- [ ] Is there Digital Engagement licensing in place?
- [ ] What's the expected response SLA? (If "whenever," a contact form would satisfy the same need for 10% of the cost.)

---

## Next Action

None pre-launch. Add to post-launch backlog. Consider whether a lightweight "contact my rep" button (mailto/tel link) satisfies 80% of the need at 2% of the cost.

---

## Related

- Ticket: none — not ready to be cut
