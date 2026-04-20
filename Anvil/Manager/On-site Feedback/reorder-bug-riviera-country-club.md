---
item: "[[reorder-bug-riviera-country-club|Reorder fails for Riviera Country Club]]"
link: "[[reorder-bug-riviera-country-club|Reorder fails for Riviera Country Club]]"
source: QA / Slack report
priority: High
status: Not Started
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
  - go-live
  - bug
  - fight-now
---
%%  %%
# Reorder fails for Riviera Country Club

> [!note] 💬 Pitch to Management
> **Sentiment source**: QA report on Slack (video attached). Decision rule #1 — a paying account is blocked from reordering, which is a broken user journey on the marquee ecom feature. Single-account reorder bugs typically indicate a data-shape edge case the code doesn't handle.
>
> **The pitch**: Taking this next after the case minimum lands. Reorder is the workflow Gulf leaned hardest on in the blueprint workshops — it can't be flaky for real accounts pre-launch. I'll reproduce from the Slack video within an hour and triage the root cause; if it's a one-off data fix it's S effort, if it's a code path that affects multiple accounts it's M. Important to diagnose before go-live so we don't get surprised by 5 more "my reorder doesn't work" reports on launch day.

## The Ask
> Found issue on the reordering piece — reorders not working for one account "Riviera Country Club" in TBM sandbox.

## Source
**Who**: QA
**When**: Pre-go-live feedback round
**Where**: Slack — https://ohanafy.slack.com/files/U03LCBEEXEF/F0ARKEH5HPX/img_2890.mov

---

## Classification

**Type**: Code (almost certainly — single-account reorder bugs are usually a data + logic interaction)
**Why**: A reorder path that works for most accounts but fails for one means either (a) the account has unusual data the reorder code doesn't handle, (b) historical order line items point to a product the current pricelist excludes, or (c) a null/missing field on the account. All three are code-fixable once diagnosed.

---

## Complexity

**What has to change:**
- Reproduce in TBM sandbox first — watch the video, then run the same flow against Riviera Country Club
- Check the failing reorder's source order for line items referencing products the account no longer has access to
- Check account fields: `ECOM_*` config, pricelist assignment, warehouse assignment, active status
- Fix is almost certainly in the reorder service (defensive null handling or graceful skip of inaccessible line items)

**Rough effort**: S (few hours once reproduced), M if the root cause is a data shape we haven't seen

**Risks / unknowns:**
- Is this 1-of-1 or the tip of an iceberg? We should regression-check 3–5 other accounts before declaring it a one-off.
- If the cause is "product no longer on pricelist," the fix has a UX question: skip silently, show a warning row, or fail the whole reorder?

---

## Is this a go-live blocker?

**Answer**: Yes
**Reasoning**: Reorder is one of the ecom portal's marquee features. If a single real account can't reorder, the feature is untrustworthy — retailers will call their rep instead, which defeats the point.

---

## The Case for NOW

- Reproduces cleanly (we have a video) — investigation cost is low
- If this is a data-shape bug, we need to know before go-live so we don't get surprised by 5 more accounts on launch day
- Reorder is the workflow Gulf leaned hardest on in the blueprint workshops — this cannot be flaky

## The Case for LATER

- If diagnosis reveals it's truly unique to Riviera (e.g., one corrupted line item), we could fix just that account's data and defer the code hardening. But that's a false economy — ship the code fix.

---

## Recommendation

**Verdict**: DO NOW

**Justification**: Reproduce from the Slack video, find the root cause, ship the fix. Don't start until the video is watched — half the work is understanding what "not working" means here.

---

## Open Questions

- [ ] What exactly fails — error, silent no-op, partial cart, or crash?
- [ ] Is this reproducible for other accounts too?
- [ ] What's the expected behavior when a historical line item references a product no longer on the pricelist?

---

## Next Action

Watch the Slack video, reproduce in TBM sandbox, triage the root cause within 1 hour. Escalate to a ticket if root cause is non-trivial.

---

## Related

- Slack: https://ohanafy.slack.com/files/U03LCBEEXEF/F0ARKEH5HPX/img_2890.mov
- Ticket: [[BMS-XXXX]] (to be cut after diagnosis)
