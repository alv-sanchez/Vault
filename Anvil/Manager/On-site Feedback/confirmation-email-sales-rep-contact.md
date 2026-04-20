---
item: "[[confirmation-email-sales-rep-contact|Include sales rep contact in order confirmation emails]]"
link: "[[confirmation-email-sales-rep-contact|Include sales rep contact in order confirmation emails]]"
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
# Include sales rep contact in order confirmation emails

> [!note] 💬 Pitch to Management
> **Sentiment source**: Go-live feedback list flagged this as High priority. Decision rule #6 applies — this is visibility/trust for a retailer who's flying blind when something goes wrong. Also decision rule #3 — it's a config-only change (email template merge-field addition) with zero risk.
>
> **The pitch**: Happy to pick this up — it's a template-edit-only change (under an hour) with zero risk: just adding `Account.Owner.Name` and `Account.Owner.Email` merge fields to the existing order confirmation email. Pairs naturally with [[sales-rep-order-confirmation-email]] since both need the same rep-assignment lookup, so I can ship them as one notifications PR. Ready to start whenever you give the word.

## The Ask
> Include the assigned sales rep's name and email address in confirmation emails so retailers know who to contact if something goes wrong.

## Source
**Who**: Go-live feedback list
**When**: 2026-04-13
**Where**: Feedback document

---

## Classification

**Type**: Config (email template edit)
**Why**: Pure merge-field addition on the existing order confirmation template. No new flows, no new logic — just exposing data that already exists on the account.

---

## Complexity

**What has to change:**
- Edit the existing order confirmation email template
- Add merge fields for `Account.Owner.Name` and `Account.Owner.Email` (or whichever field holds the assigned rep)
- Handle the null case — what if there's no rep assigned? Fall back to a generic support email rather than showing a blank line

**Rough effort**: S (under an hour)

**Risks / unknowns:**
- Same rep-assignment-field question as [[sales-rep-order-confirmation-email]] — solve it once for both.
- Null-rep fallback — what address? (probably the org-wide "no-reply" or support alias)

---

## Is this a go-live blocker?

**Answer**: Yes
**Reasoning**: The whole point of confirmation emails is to close the loop. A confirmation with no escalation path leaves the retailer stranded when something goes wrong — which is exactly when they need the email to be useful. This is table stakes.

---

## The Case for NOW

- Trivial effort (template edit)
- Ships retailer trust at the moment they're most anxious (just submitted an order)
- Shares the "which field holds the rep" research cost with the sales-rep notification work — do them together

## The Case for LATER

- None.

---

## Recommendation

**Verdict**: DO NOW

**Justification**: Bundle with [[sales-rep-order-confirmation-email]] and [[automated-reorder-reminders]] in a single notifications PR. Template edit is the fastest of the three and unblocks the others' merge fields.

---

## Open Questions

- [ ] Rep assignment field confirmed
- [ ] Null-rep fallback address

---

## Next Action

Wait for rep-field confirmation, then edit the template in the notifications PR.

---

## Related

- Ticket: [[BMS-XXXX]] (to be cut)
- Sibling: [[sales-rep-order-confirmation-email]]
- Sibling: [[automated-reorder-reminders]]
