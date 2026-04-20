---
item: Empty kegs on ecom order for pickup
source: Go-live feedback
priority: High
status: Not Started
type: Data
effort: S
impact: Medium
go_live_blocker: false
recommendation: INVESTIGATE
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
# Empty kegs on ecom order for pickup

> [!note] 💬 Pitch to Management
> **Sentiment source**: Go-live feedback list, High priority. The stakeholder's own note flagged the pricing-tier risk — that's the signal that makes this NEXT SPRINT instead of DO NOW. Decision rule #3 gates config/data changes that touch pricing.
>
> **The pitch**: Recommending we ship this first post-launch, not pre-launch. The stakeholder's own "need to confirm this will not alter pricing settings/tiers" note is the red flag — touching pricelists the week before go-live is high-blast-radius, and no retailer is blocked today (they can phone in a keg pickup). Post-launch I'll spike against OHFY-Core pricelist utilities to prove $0 SKUs are tier-safe, then add the records — roughly S effort once the pricing risk clears.

## The Ask
> Ability for the rep to add empty kegs to their ecom order, when they know they have some that need to be picked up.
>
> This would just be adding them to pricelists, need to confirm this will not alter pricing settings/tiers.

## Source
**Who**: Go-live feedback list
**When**: 2026-04-13
**Where**: Feedback document

---

## Classification

**Type**: Data (pricelist record creation) — IF it truly doesn't touch pricing logic
**Why**: On the surface, "add empty kegs as a SKU" is just adding records. But the stakeholder explicitly flagged the risk: it might alter pricing settings/tiers. That's the whole investigation — figure out whether this is safe data entry or a hidden pricing change.

---

## Complexity

**What has to change:**
- New product/SKU records for empty kegs (per keg size)
- Pricelist entries on the retailer pricelists
- Pricing = $0 (or negative, if returns are credits)

**Rough effort**: S (hours) — IF the pricing investigation comes back clean. If it doesn't, effort jumps because we'd need a separate "pickup" flag or line-item type.

**Risks / unknowns:**
- **The real risk**: adding a $0 SKU to a pricelist could mess with tier calculations if the tiering logic uses total line count or average unit price. Need to verify against OHFY-Core pricelist logic before touching production data.
- Inventory impact: are empty kegs tracked in `Inventory__c`? If yes, they'll show up in stock counts — not necessarily wrong but worth knowing.
- Case-minimum interaction: does an empty keg count toward the [[ecom-case-minimum]] threshold? Likely no, but needs to be consistent with the keg-bypass rule there.

---

## Is this a go-live blocker?

**Answer**: No
**Reasoning**: Retailers can still phone in a keg pickup on day 1. This is a nice-to-have that removes a phone call, not a feature retailers will miss at launch.

---

## The Case for NOW

- Pure data change if the pricing investigation clears it
- Small delighter for reps who are already swimming in keg tracking pain

## The Case for LATER

- The pricing-tier risk is real. Touching pricelists in the week before go-live is high-risk, low-reward.
- No retailer is blocked today
- Investigating the pricing impact takes as long as doing the work, so the investigation itself is the work — do it post-launch when the blast radius is smaller

---

## Recommendation

**Verdict**: NEXT SPRINT (investigate first, ship after go-live)

**Justification**: The pricing-tier unknown is a red flag for a pre-launch change. Ship it in the first post-launch sprint after we've confirmed that adding a $0 keg SKU to a pricelist doesn't cascade through the tier logic.

---

## Open Questions

- [ ] Does pricelist tier calculation use line count, average price, or something else that a $0 SKU could skew?
- [ ] Inventory tracking for returned empties — yes or no?
- [ ] Interaction with case-minimum rule (from [[ecom-case-minimum]])?
- [ ] Price = $0 or negative credit?

---

## Next Action

Post-launch: spike against OHFY-Core pricelist utilities to prove $0 SKUs are tier-safe, then add the records.

---

## Related

- Ticket: [[BMS-XXXX]] (to be cut post-launch)
- Interaction: [[ecom-case-minimum]]
