---
item: "[[ecom-case-minimum|eCom-only case minimum (5 cases, keg exception)]]"
link: "[[ecom-case-minimum|eCom-only case minimum (5 cases, keg exception)]]"
source: Theresa (Gulf)
priority: CRITICAL
status: In Progress
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
  - go-live
  - fight-now
---
%%  %%
# eCom-only case minimum (5 cases, keg exception)

> [!note] 💬 Pitch to Management
> **Sentiment source**: Theresa (Gulf lead) raised this directly as CRITICAL. Decision rule #2 — senior stakeholder direct ask pre-launch, political capital matters. Also already in flight, so momentum cost is zero.
>
> **The pitch**: Already in progress — finishing it. Theresa asked for it explicitly as CRITICAL and it shapes every order a retailer will place on day 1; without it, reps go back to manually rejecting small orders by phone. Keg bypass is a small addition on top of the main rule — I'll ship them as one PR, not split them. Need to confirm three open questions with Theresa and Alvaro first (split-invoice aggregation, keg detection field, threshold storage), then land it.

## The Ask
> Theresa asked if we could set a case minimum for ECom only. She requested 5 cases but allow any order with a Keg. When they tried to submit an order, if the minimum is not met, a message should be thrown that lets them know they have not met the minimum requirements for the order.

## Source
**Who**: Theresa (Gulf stakeholder)
**When**: Pre-go-live feedback round
**Where**: Go-live feedback list

---

## Classification

**Type**: Code
**Why**: Requires quantity-summing logic at cart/checkout, an ecom-only flag (so non-ecom orders aren't affected), and a keg-bypass rule. Not just a config value — there's real branching logic.

---

## Complexity

**What has to change:**
- Cart submission path in `draftInvoiceService` (or the equivalent checkout validator) to count total cases
- Keg detection — likely via `Item_Type__c` or an `Is_Keg__c` flag on the product
- UI toast/error banner on the cart/checkout page when the rule fails (not just a silent block)
- An account-level or org-level setting to hold the threshold (5) so it's not hardcoded

**Rough effort**: M (1–2 days)

**Risks / unknowns:**
- How does the minimum interact with split invoices? Is it per-draft or aggregate across splits?
- Is 5 a global number or per-account? Theresa asked for 5 but we should assume it'll become account-specific within a quarter.
- What's the "keg" signal — product type, a checkbox, or SKU pattern? Need to confirm before coding the bypass.

---

## Is this a go-live blocker?

**Answer**: Yes
**Reasoning**: Theresa raised this as CRITICAL and it shapes every order a retailer will place on day 1. If we go live without it, reps have to manually reject small orders — exactly the phone-call workflow ecom is supposed to eliminate.

---

## The Case for NOW

- Direct ask from the lead Gulf stakeholder — pre-launch political capital matters
- Already in progress, so momentum cost is zero
- Without it, retailers learn the wrong lesson on day 1 ("I can submit tiny orders") and unwind the case-quantity discipline Gulf runs on
- Keg bypass is a small addition on top of the main rule — not a separate fight

## The Case for LATER

- None worth taking seriously. The only defensible delay would be if split-invoice interaction is genuinely unsolved, in which case we ship the aggregate-check version first and follow up.

---

## Recommendation

**Verdict**: DO NOW

**Justification**: It's already in progress, Theresa owns the ask, and it shapes the day-1 ordering experience. Finish the main rule first, ship the keg bypass as part of the same PR — do NOT split them.

---

## Open Questions

- [ ] Per-draft or cross-draft (split invoice) aggregation?
- [ ] Keg detection field — `Item_Type__c`, `Is_Keg__c`, or SKU-based?
- [ ] Threshold storage — hardcoded `5`, config pref, or account field?
- [ ] Error UX — toast, inline banner, or disabled submit button?

---

## Next Action

Confirm the three open questions with Theresa and Alvaro, then finish the in-progress PR with keg bypass included.

---

## Related

- Ticket: [[BMS-XXXX]] (to be cut)
- Screenshot: referenced in go-live feedback list (Image #2)
