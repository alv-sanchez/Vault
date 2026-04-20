---
item: Account search should handle missing special characters
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
# Account search should handle missing special characters

> [!note] 💬 Pitch to Management
> **Sentiment source**: Go-live feedback list, High priority with an explicit "need to bulletproof this" instruction. Decision rule #1 — retailers with any punctuation in their account name literally couldn't find themselves. That's a product-breaking defect, not a polish item.
>
> **The pitch**: Already shipped ✅. The bulletproofing ask from the stakeholder is still open — I'd like QA to hammer this edge case before sign-off using real Gulf account names containing apostrophes, ampersands, accented characters, and hyphens. Fix should hold for both the registration account picker AND the admin search; that's worth explicitly verifying in regression.

## The Ask
> Account search is too strict. If a retailer didn't use an apostrophe, the account didn't surface. Search should handle missing special characters gracefully.
>
> Need to bulletproof this.

## Source
**Who**: Go-live feedback list
**When**: 2026-04-13
**Where**: Feedback document

---

## Classification

**Type**: Code (search normalization)
**Why**: Stripping/ignoring punctuation on both query and stored values during search — a normalization pass, typically in the SOSL or SOQL LIKE builder.

---

## Complexity

**What has to change:**
- Normalize both the search query AND the index/target fields: lowercase, strip apostrophes, strip punctuation
- Possibly use SOSL with wildcards instead of SOQL LIKE for better fuzzy matching
- Unit tests with known-painful names (e.g. `O'Brien's`, `Joe & Mike's Bar`, `Señor Frog's`)

**Effort**: S (half a day)

---

## Is this a go-live blocker?

**Answer**: Yes
**Reasoning**: Retailers whose account names contain any punctuation couldn't be found — effectively unusable search for that segment. Day 1 support tickets were guaranteed without this fix.

---

## Recommendation

**Verdict**: DO NOW ✅ (Completed)

**Justification**: Search not finding accounts is a product-breaking defect, not a polish item.

---

## Resolution

✅ **Completed.**

Action items for bulletproofing (pre-launch):
- [ ] Write regression tests with apostrophe, ampersand, accented character, and hyphen cases
- [ ] Test against real Gulf account list — pull 20 account names with punctuation and confirm all are findable with the punctuation-stripped query
- [ ] Confirm the fix holds for both the registration account picker AND the admin search
- [ ] Stakeholder note: "need to bulletproof this" — means QA should explicitly hammer this edge case before sign-off

---

## Related

- Ticket: [[BMS-XXXX]] (if one was cut)
