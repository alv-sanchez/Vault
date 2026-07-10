---
ticket: BMS-3853
epic: BMS-5129
question: "Where do route cost, driver compensation, and budget data come from — and what object holds them?"
status: Open
po: Elliot Flores
jira_comment_url:
raised: 2026-06-28
answered:
tags:
  - manager-engineer
  - open-question
---

# Open Question — BMS-3853

> [!question] The question
> Route profitability needs budgeted-vs-actual cost, cost-to-serve, margin, and driver compensation per route. None of that data exists in the model today. Where does it come from, and where is it stored?

## The issue
`Route__c` has 19 fields — none financial (`OHFY-Data-Model/.../objects/Route__c/fields/`). `Delivery__c` carries volume primitives (cases, stops, weight, revenue) but no cost, comp, budget, or margin. There is no budget object and no "budgeted routes per warehouse" field. Profitability cannot be computed from what's on main.

## The solution being attempted
A profitability analytics dashboard comparing budget vs actual per route. The whole build hinges on the data model: what cost/comp/budget fields exist, their source system, and whether they live on `Route__c`, a new period roll-up object, or come from the COA/finance side (the epic references the unified COA, BMS-3978, now Done).

## Options (with the recommendation first)
1. **[Recommended]** PO defines a small finance data model: budgeted routes + cost-to-serve + driver comp sourced from the COA/GL (BMS-3978) onto a new `Route_Profitability_Period__c` roll-up. Decompose into a data-model story before any UI.
2. Reuse only operational volume already on `Delivery__c` and drop true margin (utilization/stops only) — but that contradicts the "cost/margin for finance" audience.
3. Pull cost/comp from an external finance system via integration — much larger scope.

## Resolution
_(open)_
