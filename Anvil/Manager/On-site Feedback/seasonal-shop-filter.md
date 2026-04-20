---
item: "\"Seasonal\" filter on Shop page"
source: Go-live feedback
priority: Low
status: Not Started
type: Hybrid
effort: S
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
  - merchandising
---
%%  %%
# "Seasonal" filter on Shop page

> [!note] 💬 Pitch to Management
> **Sentiment source**: Go-live feedback list — stakeholder marked it Low themselves. Decision rule #5 — merchandising polish.
>
> **The pitch**: Recommending we defer to the first post-launch merchandising batch, bundled with [[new-product-flag-90-days]]. The "hide filter when no inventory" requirement adds code complexity we shouldn't sign up for pre-launch, and we still need to verify `Seasonal__c` exists on the Product object before we can even scope it accurately. Zero retailers are blocked — seasonal browsing is a discovery nicety, not a broken workflow.

## The Ask
> Add "seasonal" as a filter on the Shop page.
>
> If "seasonal item" is checked as true on the product, and there's inventory for the product, "seasonal" should pop up on the filters for them to be able to use it.

## Source
**Who**: Go-live feedback list
**When**: 2026-04-13
**Where**: Feedback document

---

## Classification

**Type**: Hybrid (Data + Code filter)
**Why**: Assumes `Seasonal__c` (or similar) already exists on the Product object. If it does, this is a Shop LWC filter chip — pure code. If it doesn't, add the field first (config) then the filter (code).

---

## Complexity

**What has to change:**
- Confirm `Seasonal__c` exists on the Product object (or add it)
- Shop LWC: conditionally show the "Seasonal" filter chip only when at least one in-stock product has `Seasonal__c = TRUE`
- Filter logic that combines with existing brand / type / "New" filters

**Rough effort**: S (half a day)

**Risks / unknowns:**
- Does `Seasonal__c` already exist? Need to check before scoping.
- Inventory check — the stakeholder specifically said "if there's inventory." That means the filter visibility is tied to live inventory, which is a slightly unusual pattern. Is it worth the complexity vs just showing the chip always and letting an empty result set speak for itself?

---

## Is this a go-live blocker?

**Answer**: No
**Reasoning**: Same as [[new-product-flag-90-days]] — merchandising polish. Retailers find what they want via search and brand filters on day 1.

---

## The Case for NOW

- Small effort
- Seasonal product rotation is a real buying pattern for bars/restaurants (e.g. pumpkin beer in fall)

## The Case for LATER

- Stakeholder marked it Low themselves
- The "hide filter when no inventory" requirement adds complexity we shouldn't sign up for pre-launch
- Bundles cleanly with [[new-product-flag-90-days]] in a merchandising polish PR

---

## Recommendation

**Verdict**: DEFER (first post-launch merchandising batch)

**Justification**: Bundle with [[new-product-flag-90-days]] as "merchandising polish." Same patterns, same LWC, same PR.

---

## Open Questions

- [ ] Does `Seasonal__c` (or equivalent) already exist on Product?
- [ ] Filter visibility tied to live inventory, or always visible?
- [ ] Should seasonal items also get a badge on the product tile?

---

## Next Action

None pre-launch. Confirm `Seasonal__c` exists post-launch and bundle into merchandising PR.

---

## Related

- Ticket: [[BMS-XXXX]] (to be cut post-launch)
- Sibling: [[new-product-flag-90-days]]
