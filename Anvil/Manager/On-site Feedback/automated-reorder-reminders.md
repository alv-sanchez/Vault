---
item: "[[automated-reorder-reminders|Automated reorder reminders (email to retailer + SMS to rep)]]"
link: "[[automated-reorder-reminders|Automated reorder reminders (email to retailer + SMS to rep)]]"
source: Go-live feedback
priority: High
status: Not Started
type: Hybrid
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
  - notifications
  - fight-now
---
%%  %%
# Automated reorder reminders (email to retailer + SMS to rep)

> [!note] 💬 Pitch to Management
> **Sentiment source**: Go-live feedback list, High priority. Decision rule #6 — revenue protection + visibility for reps who'd otherwise learn about missed orders too late. The stakeholder explicitly carved out a V1 scope-cut (day-of-week only, no frequency analysis) which makes this shippable.
>
> **The pitch**: Biggest revenue-protection win in the notifications bundle. Happy to take the V1 the stakeholder already scoped (day-of-week), not the full frequency modeling. One open question gates effort — does OHFY-Core already have a Twilio SMS utility? If yes, this is M effort and ships email+SMS together. If not, it jumps to L and I'd recommend shipping email-only V1 pre-launch with SMS as a follow-up. Will confirm before committing.

## The Ask
> Automated email to remind retailers to place an order if none has been placed. Sales rep should also receive a text message the day before a delivery letting them know that this specific retailer has not placed an order and they normally do.
>
> We would need to possibly tie in the frequency ability, don't have to do that at the start. We can just look at the day of the week.

## Source
**Who**: Go-live feedback list
**When**: 2026-04-13
**Where**: Feedback document

---

## Classification

**Type**: Hybrid (Code + Config)
**Why**: Needs a scheduled process to scan accounts for "no order placed" against their delivery schedule, an email template, and a Twilio SMS send. The stakeholder explicitly carved out the V1: day-of-week only, not frequency analysis — which keeps it in config-plus-light-code range.

---

## Complexity

**What has to change:**
- Scheduled Apex (or record-triggered + batch) that runs daily
- Logic: "for each account with a delivery tomorrow, does a submitted order exist for this delivery window?"
- Email template to retailer
- Twilio SMS to rep — reuse the existing notification framework if it exists in OHFY-Core
- Configuration preference to enable/disable per-account (so accounts that genuinely ordered by phone don't get spammed)

**Rough effort**: M (2–3 days if the Twilio framework is in place; L if it isn't)

**Risks / unknowns:**
- Does OHFY-Core already have a Twilio SMS send utility? If yes, this is M. If no, this is L — check before committing.
- What's the "day before delivery" calculation — raw calendar day or business day? Reuse the business-day logic from the already-completed [[order-cutoff-business-days]] item.
- False positives: what if the retailer placed an order 3 days ago for this delivery? We need "no order in the current delivery window," not "no order today."

---

## Is this a go-live blocker?

**Answer**: Yes (scoped to day-of-week V1 only)
**Reasoning**: Reps losing visibility on missed orders is a revenue leak at go-live. But the stakeholder explicitly said frequency analysis can wait. Ship the day-of-week V1 and defer frequency modeling.

---

## The Case for NOW

- Revenue protection — reps can intervene with high-value accounts that forgot to order
- Stakeholder already handed us the scope-cut (V1 = day-of-week, V2 = frequency) — take it
- Shares infrastructure with the other two notification items — ship as a bundle
- Business-day logic is already solved thanks to [[order-cutoff-business-days]]

## The Case for LATER

- If the Twilio framework isn't in place, this jumps from M to L and risks crowding out the other go-live fights. That's the one scenario where we defer the SMS half and ship email-only in V1.

---

## Recommendation

**Verdict**: DO NOW (day-of-week V1, email + SMS if Twilio framework exists, else email-only)

**Justification**: Biggest revenue protection in the notification bundle. The scope-cut is already drawn by the stakeholder — we just need to honor it and not scope-creep into frequency analysis.

---

## Open Questions

- [ ] Does OHFY-Core have a Twilio SMS send utility ready to reuse?
- [ ] Delivery-window detection — per order, per account, or per route?
- [ ] Per-account opt-out flag for phone-only retailers?

---

## Next Action

Check OHFY-Core for existing Twilio SMS utility. If present, scope the full V1. If not, scope email-only for V1 and file SMS as a follow-up.

---

## Related

- Ticket: [[BMS-XXXX]] (to be cut)
- Sibling: [[sales-rep-order-confirmation-email]]
- Sibling: [[confirmation-email-sales-rep-contact]]
- Reuse: business-day logic from [[order-cutoff-business-days]]
