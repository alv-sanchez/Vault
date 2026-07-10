---
ticket: BMS-3742
epic: BMS-5113
question: "Collapse DOI and DOH into a single term across both grains, or keep both?"
status: Answered            # decided by me-manager best judgment 2026-07-10; PO confirmation pending
po: Elliot Flores
jira_comment_url:           # NOT POSTED — Jira MCP unavailable this run
raised: 2026-07-10
answered: 2026-07-10
tags:
  - manager-engineer
  - open-question
---

# Open Question — BMS-5113 / BMS-3742

> [!question] The question
> The BMS-3817 spike (§4.3) flags: the DOI and DOH math is identical, only the grain differs (warehouse vs child location). Should we pick one term and use it across both grains, or keep both vocabularies?

## The issue
Carrying two words for the same math perpetuates the cross-team confusion the epic exists to fix. But the shipped data model has already committed to a split: DOH names the **threshold config** (`Min/Target/Max_DOH`, `Effective_*_DOH__c`, `Inventory_Threshold__c`) and DOI names the **computed actual** (`Current_DOI__c`, `DOI_Status__c`). These are released managed fields.

## The solution being attempted
Standardizing the DOI formula (BMS-3742). The vocabulary choice shapes whether the data model carries one threshold concept or two — so it wants resolving before more fields land.

## Options (with the recommendation first)
1. **[Recommended] Keep both terms; standardize only the time basis + formula.** DOH = the target band a team configures; DOI = the computed actual against it. This already matches `main` and is how the two teams speak. Zero rename cost. — *Tradeoff: two words persist, but with a clean, documented meaning (config vs actual) rather than as synonyms.*
2. Collapse to a single term across both grains. — *Tradeoff: conceptually cleanest, but forces renaming released managed fields (`Current_DOI__c`, `*_DOH__c`) which are frozen (CLAUDE.md rule 8 / signature-freeze); high blast radius, breaks the shipped report type + perm set, for a vocabulary win.*

## Resolution
**Option 1 — keep both terms.** Decided by me-manager (best-judgment, per operator instruction) 2026-07-10. Rationale: the shipped model already encodes a coherent split (DOH=config, DOI=actual); collapsing renames frozen managed fields for marginal benefit. **PO confirmation still wanted** but not blocking — recorded in [[BMS-5113-feedback]]. Not yet posted to Jira (no MCP access this run).
</content>
