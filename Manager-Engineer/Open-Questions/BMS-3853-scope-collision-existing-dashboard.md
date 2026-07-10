---
ticket: BMS-3853
epic: BMS-5129
question: "Extend the existing Route Optimization dashboard, or build a separate Profitability dashboard?"
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
> A "Route Analytics" surface already exists on main — the **Route Optimization Opportunities** dashboard. Is BMS-3853 a new Profitability dashboard, or an extension of that one? And how do BMS-3853 and BMS-5551 (Strategic reroute KPI view) relate?

## The issue
`S_RouteAnalytics` / `E_RouteAnalytics` / `RouteAnalyticsDTO`, the `Route_Analytics_Settings__mdt` CMDT, and the `routeOptimizationDashboard` LWC already own the "route analytics" name and namespace — but their intent is consolidation/clustering/cadence, not profit & loss (`OHFY-OMS/.../classes/services/routeAnalytics/S_RouteAnalytics.cls:1-11`). Building "Route Profitability Analytics" as a second analytics surface risks duplicated metric logic and naming confusion. BMS-5551 ("left-pane route list rolling up KPIs … % non-profitable stops … targets on Route record") describes a third, overlapping view.

## The solution being attempted
A profitability dashboard. Need a deliberate decision on surface ownership before any code, or we will fork route-analytics logic three ways.

## Options (with the recommendation first)
1. **[Recommended]** Treat 3853 (profitability) and 5551 (reroute KPI list) as one cohesive analytics workstream; extend the existing `routeAnalytics` service layer with a profitability module rather than a parallel one. PO confirms one surface vs. two.
2. Build a standalone Profitability dashboard separate from Optimization — cleaner audience separation, but duplicated query/metric plumbing.
3. Defer 5551, ship 3853 first, fold reroute KPIs in later.

## Resolution
_(open)_
