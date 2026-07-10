---
ticket: BMS-3742
epic: BMS-5113
question: "Switch the DOI sales-rate source from the on-hand-decrease proxy to completed invoiced quantity?"
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
> The shipped DOI calc derives demand from day-over-day drops in on-hand. The BMS-3817 spike mandates completed invoiced quantity. Do we make the switch as the core of BMS-3742?

## The issue
- Shipped: `S_InventoryDOI.computeDailyDepletion()` (`S_InventoryDOI.cls:143-210`) sums positive day-over-day decreases in `Inventory_History__c.Quantity_On_Hand__c`. That proxy counts **transfers-out, shrink, and adjustments** as demand, and — per the spike — is distorted by out-of-stock/AR repeat-order refills that don't represent real sales.
- Spike §4.2: *"V1 source for the average daily sales rate is completed invoiced quantity at the relevant location grain."* Chandler (4/27): *"the rate of sale in the system drops every single day… That does not mean that it has a low rate of sale."*
- The proxy was an explicit BMS-3779 interim (`S_InventoryDOI.cls:14` — *"no velocity engine exists yet"*).

## The solution being attempted
BMS-3742 = make the authoritative formula match the settled definition. Answer changes the entire build: it's the difference between a small field-add and a demand-aggregation over invoice lines.

## Options (with the recommendation first)
1. **[Recommended] Switch to completed-invoiced-quantity.** Aggregate completed invoice lines → item × location → avg base units/day over the window; feed that as the depletion rate. — *Tradeoff: correct per the spike and removes the false-demand distortion, but it changes every DOI figure and `DOI_Status__c` customers see (High risk) → needs a before/after reconciliation on the dedicated org and a PO heads-up before it goes live.*
2. Keep the on-hand proxy, defer the switch. — *Tradeoff: no build, but the epic's whole premise ("one correct DOI") stays unmet and the known distortion persists; BMS-3742 would be a no-op.*

## Resolution
**Option 1 — adopt completed invoiced quantity as BMS-3742's core scope.** Decided by me-manager (best-judgment) 2026-07-10, grounded in spike §4.2 which is unambiguous and authored from the Gulf discovery sessions. Flagged **High risk** on the ticket ([[BMS-3742-doi-formula-standardization]]) — the value shift must be reconciled on-org and surfaced to the PO before release. Build **held** pending the dedicated org + Jira AC confirmation. Not yet posted to Jira (no MCP this run).
</content>
