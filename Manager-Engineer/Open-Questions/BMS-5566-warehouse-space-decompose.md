---
ticket: BMS-5566
epic: BMS-5060
question: "How should the warehouse-space constraint story be sliced, and is per-warehouse pallet-location capacity in scope for go-live?"
status: Open
po:
jira_comment_url:
raised: 2026-06-28
answered:
tags:
  - manager-engineer
  - open-question
---

# Open Question — BMS-5566

> [!question] The question
> BMS-5566 bundles four distinct capabilities into one Backlog story with no acceptance criteria. How should it be sliced, and which slices are in scope for Gulf go-live?

## The issue
BMS-5566 ("Forecast: warehouse-space constraint") is a raw Gulf on-site backlog capture (Day 5 — Forecasting · on-site #118 · proposed P2 · tier Go-live). Its description conflates at least four separable features and provides **no acceptance criteria**, so it cannot pass the executability gate:

1. **DOH→DOI conversion with sales/depletion trends; min/max days-on-hand.** Much of this substrate already exists on `Inventory__c` — `Current_DOI__c`, `DOI_Status__c`, `Average_Daily_Depletion__c`, `DOI_Velocity_Window_Days__c`, `Effective_Target_DOH__c`, `Effective_Min_DOH__c` (`OHFY-Data-Model/force-app/main/default/objects/Inventory__c/fields/`), plus Account-level `Target_DOI__c` / `Maximum_DOI__c`. So this slice is largely "wire up / surface existing fields," not net-new.
2. **Per-warehouse pallet-location capacity → turn the order number red when an order exceeds capacity (warn, not block — intentional over-order for transfers is valid).** No per-warehouse pallet-location-capacity field exists today; `Pallet_Item__c.Pallet_Space_Used__c` is per-pallet, not a warehouse capacity ceiling. This is net-new data model + a UI red-flag (likely an `*-UI` / LWC surface).
3. **Product stackability capture on the item profile / new-item intake.** Net-new field on the item/product profile and an intake-form change.
4. **Warehouse CAD / dimension data as stored data points.** Net-new storage; unclear grain, source, and consumer.

The four slices have different data models, different packages, and very different sizes; (1) is mostly additive surfacing while (2)–(4) are net-new with UI implications. Bundled and AC-less, the story is not buildable.

## The solution being attempted
Before any build, split BMS-5566 into separate stories with acceptance criteria and confirm go-live scope. The "red number" capacity warning (slice 2) is the headline ask and is the one with real UI + new data model — it needs its own ticket and a mockup.

## Options (with the recommendation first)
1. **[Recommended]** Split into 4 child stories — (1) DOH→DOI surfacing over existing Inventory fields, (2) per-warehouse pallet-location capacity + red-flag warning (UI, needs mockup), (3) stackability capture on item intake, (4) warehouse CAD/dimension storage. Add AC to each. For go-live, scope **only** slices (1) and (2); defer (3) and (4) as P2/P3. — Tradeoff: more grooming up front, but each slice becomes independently executable and disjoint by package.
2. Refine BMS-5566 in place with AC covering all four, build as one epic-sized story. — Tradeoff: large, mixed-risk, mixed-UI, hard to parallelize, slow to go-live.
3. Defer the whole story past go-live. — Tradeoff: simplest, but drops the capacity red-flag the on-site flagged as a go-live ask.

## Resolution
_(filled when answered)_ — decision + who decided + date.
