---
ticket: BMS-5161
epic: BMS-5161
question: "Is PO-side 'supplier owes Gulf' billback origination in this epic, or does the general PO-reconciliation engine belong under BMS-4951?"
status: Open
po: Elliot Flores
jira_comment_url:        # PENDING — Atlassian MCP unavailable this run; post on Jira creation
raised: 2026-07-10
answered:
tags:
  - manager-engineer
  - open-question
---

# Open Question — BMS-5161 (Story C boundary)

> [!question] The question
> The user asked for a Purchase Order "optional billback" concept for when a **supplier owes the distributor** (Gulf). Research shows the *schema* for this already exists (`Billback__c.Account__c` is counterparty-generic — any Account can owe). So the real question is a **scope boundary**: does THIS epic own only the freight-flavored PO origination, while the general "PO reconciliation → billback" engine belongs to the billback-rails epic (BMS-4951)?

## The issue
- `Billback__c.Account__c` description (OHFY-Data-Model): *"the party that owes … can be any Account — supplier, retailer, broker, or intercompany"* — "supplier owes Gulf" needs **no new object model**.
- What's missing is only an **origination path** from a PO reconciliation to a billback (a `Billback_Line__c.Purchase_Order__c` source lookup + a trigger/action).
- A *general* PO-reconciliation-to-billback engine (short pay, damage, price variance, freight) is broader than freight and overlaps BMS-4951/4952's stated ownership of the recovery rails. Per Bryson Carroll's 2026-06-12 decision, this epic is a freight-specific **source**, not a parallel engine.

## The solution being attempted
Story C delivers a **thin, freight-scoped** PO origination: when a PO reconciliation flags inbound freight (or a short/damage per BMS-5118) that the supplier owes, originate a `Type=Freight`/`Generic`, `Account=Supplier` billback through the *existing* header+line+coverage pipeline. If C must also cover non-freight PO variances, that's the general engine → belongs to BMS-4951.

## Options (with the recommendation first)
1. **[Recommended]** Story C = freight-scoped PO origination only (inbound freight the supplier owes). Non-freight PO variances → a story under BMS-4951. *Tradeoff:* keeps this epic cohesive and avoids duplicating the recovery engine; a second team touches PO reconciliation later.
2. Story C = full PO-reconciliation-to-billback engine in this epic. *Tradeoff:* one place owns PO origination, but this epic balloons beyond "freight" and competes with BMS-4951's charter.
3. Drop PO-side from this epic entirely; fold into BMS-4951. *Tradeoff:* cleanest ownership, but the user explicitly asked for the PO "optional billback" concept here.

## Resolution
_(pending PO)_
</content>
