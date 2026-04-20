---
item: Signup uses Shipping zip, not Billing zip
source: Go-live feedback
priority: High
status: Completed
type: Code
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
  - completed
  - audit
---
%%  %%
# Signup uses Shipping zip, not Billing zip

> [!note] 💬 Pitch to Management
> **Sentiment source**: Go-live feedback list — stakeholder flagged "HIGHEST PRIORITY!!!!!" themselves. Decision rule #1 — broken signup path cascades into wrong warehouse assignment, wrong delivery route, wrong tax. That's a blocked user journey, not a polish issue.
>
> **The pitch**: Already shipped ✅. Right call to prioritize immediately — the stakeholder's emphatic framing was accurate, and every new-account signup until the fix was producing wrong downstream routing. Regression checklist is in the note below; recommend QA verifies the full shipping-address group (not just the zip) moved over, and that warehouse/route assignment logic reads from Shipping, not Billing.

## The Ask
> Zip codes need to be Shipping Address (`ShippingPostalCode`) when signing up for accounts, currently it's the billing zip code.
>
> HIGHEST PRIORITY!!!!!

## Source
**Who**: Go-live feedback list
**When**: 2026-04-13
**Where**: Feedback document

---

## Classification

**Type**: Code (field rewiring on the registration LWC/controller)

---

## Complexity

**What has to change:**
- Registration LWC bound the zip input to `BillingPostalCode` — rebind to `ShippingPostalCode`
- Audit whether other fields in the registration form also drifted to the Billing address (city, state, street) — if yes, fix in the same PR

**Effort**: S (hours)

---

## Is this a go-live blocker?

**Answer**: Yes — and was flagged HIGHEST PRIORITY by the stakeholder, meaning downstream routing/tax/delivery logic was wrong every time a new account signed up.

---

## Recommendation

**Verdict**: DO NOW ✅ (Completed)

**Justification**: Wrong zip on signup cascades into wrong warehouse assignment, wrong delivery route, wrong tax. No defensible reason to delay.

---

## Resolution

✅ **Completed.**

Action items for verification pre-launch:
- [ ] Regression test: sign up a new account in sandbox, confirm `ShippingPostalCode` is populated and `BillingPostalCode` is either empty or mirrors shipping
- [ ] Confirm the whole shipping address group moved (not just the zip)
- [ ] Confirm warehouse/route assignment logic reads from Shipping, not Billing

---

## Related

- Ticket: [[BMS-XXXX]] (if one was cut)
