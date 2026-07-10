---
ticket: BMS-5161
epic: BMS-5161
question: "Where's the line between a freight-cost billback (this epic) and carrier short/damage claims already routed to billback rails by BMS-5118 / BMS-5200?"
status: Open
po: Elliot Flores
jira_comment_url:        # PENDING — Atlassian MCP unavailable this run
raised: 2026-07-10
answered:
tags:
  - manager-engineer
  - open-question
---

# Open Question — BMS-5161 (double-recovery boundary)

> [!question] The question
> Two shipped features already push carrier/transfer claims into the billback rails: **BMS-5118** (Receiving Compliance — carrier short/damage on inbound supplier loads) and **BMS-5200** (Transfer Claims Handling). This epic adds **cross-state freight cost** recovery. What is the boundary so the same dollar isn't recovered twice?

## The issue
- The epic's own coordination note (2026-06-12) flags this: freight claims/billback boundary "should reference BMS-5118 in addition to BMS-5200 so receiving-originated freight claims don't fall between the two."
- All three converge on the same `Billback__c` ledger. Without an explicit rule, a cross-state truck that is *also* short/damaged could generate a freight billback (this epic) AND a claim billback (BMS-5118/5200) for overlapping cost.
- Code confirms a single shared ledger with idempotent, deterministic External_Ids per source — different sources produce different keys, so the system won't *dedupe* across source types automatically. The boundary must be a **business rule**, not a technical guarantee.

## The solution being attempted
Stories B and C carry an explicit AC: a freight billback attributes only the **transportation cost** of a cross-state move; **product loss/damage** on that same shipment stays with BMS-5118/5200's claim path. `Billback__c.Type__c` distinguishes them (`Freight` vs the claim type). Charge_Date/source lookup make overlaps auditable.

## Options (with the recommendation first)
1. **[Recommended]** Type-partition: `Freight` = transportation cost only; short/damage = existing claim types. Document the rule as an AC on B & C; no code dedupe needed. *Tradeoff:* relies on correct Type selection; add a report to surface same-shipment multi-type billbacks for audit.
2. Hard technical guard: block a freight billback on any shipment that already has a claim billback. *Tradeoff:* prevents double-count by construction, but freight and damage are legitimately *both* recoverable on one truck — this would under-recover.
3. Defer — no explicit boundary, revisit if double-recovery is observed. *Tradeoff:* fastest, but risks a supplier dispute over double-billing.

## Resolution
_(pending PO)_
</content>
