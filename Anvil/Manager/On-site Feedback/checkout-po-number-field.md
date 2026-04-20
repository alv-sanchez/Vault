---
item: PO number input at checkout
source: Go-live feedback
priority: Medium
status: Not Started
type: Code
effort: S
impact: Medium
go_live_blocker: false
recommendation: NEXT SPRINT
ticket:
assignee:
date_added: 2026-04-13
date_decided: 2026-04-13
date_completed:
blocked_by:
tags:
  - manager
  - ecom
  - post-launch
  - next-sprint
---
%%  %%
# PO number input at checkout

> [!note] 💬 Pitch to Management
> **Sentiment source**: Go-live feedback list, Medium priority. Decision rule #7 (tiebreaker) — no retailer is blocked today, and decision rule #1 (retailer blocked) doesn't apply. The field already exists in OHFY-Core so there's no data model change.
>
> **The pitch**: Recommending we ship this first post-launch. It's small (half a day of UI + Apex pass-through) and accounting-friendly for AP teams that need a PO on invoices, but zero retailers are blocked today. The launch sprint is already fighting for case minimum, reorder bug, and notifications — adding checkout UI work risks crowding those out for a pure convenience feature.

## The Ask
> Add a text input for a Purchase Order (PO) number in the checkout section.
>
> This would be the `ohfy__Customer_PO_Number__c` from Ohanafy, make that translate over.

## Source
**Who**: Go-live feedback list
**When**: 2026-04-13
**Where**: Feedback document

---

## Classification

**Type**: Code (UI field + Apex pass-through)
**Why**: A new input on the checkout LWC, plus wiring it through to `ohfy__Customer_PO_Number__c` on the draft invoice/order object. Trivial but genuinely code — not config.

---

## Complexity

**What has to change:**
- Add text input to the checkout LWC (`ecomReviewCheckout` or equivalent)
- Wire the value through `draftInvoiceService` / `CartController` to the draft invoice
- Ensure the field maps to `ohfy__Customer_PO_Number__c` on commit
- Display the PO number in the order confirmation email + order history

**Rough effort**: S (half a day)

**Risks / unknowns:**
- Validation — free text, max length, required or optional? Default to optional free text (max ~50 chars) unless told otherwise.
- Downstream: does the PO number need to appear on invoices/packing slips generated outside ecom? If yes, someone else may need to consume the field too.

---

## Is this a go-live blocker?

**Answer**: No
**Reasoning**: Retailers have placed orders without a self-service PO input forever. Missing it is an inconvenience for their AP team, not a broken ordering experience.

---

## The Case for NOW

- Small effort
- Accounting-friendly; some retailers' AP departments require a PO to pay the invoice
- Field already exists in OHFY-Core — no data model changes

## The Case for LATER

- Zero retailers blocked today
- The launch sprint is already fighting for case minimum, reorder bug, and notifications — adding UI work risks crowding them out
- Post-launch slot is easy to defend because the ask is plainly "add a field"

---

## Recommendation

**Verdict**: NEXT SPRINT

**Justification**: Small enough to be a first-post-launch quick win. Not worth bumping a go-live blocker for.

---

## Open Questions

- [ ] Optional or required?
- [ ] Max length / character allowlist?
- [ ] Should the PO show on the order confirmation email?

---

## Next Action

Slot into first post-launch sprint. No pre-launch action needed.

---

## Related

- Ticket: [[BMS-XXXX]] (to be cut post-launch)
- Field: `ohfy__Customer_PO_Number__c`
