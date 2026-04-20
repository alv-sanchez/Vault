---
ticket: BMS-3925
title: Product Catalog & Availability for Retailers
status: Backlog
type: Story
priority: TBD
phase: 2a
execution_order: 4
labels: [ecom, gulf, phase-2, refinement-needed]
jira: https://ohanafy.atlassian.net/browse/BMS-3925
---

# BMS-3925 — Product Catalog & Availability for Retailers

> [Jira](https://ohanafy.atlassian.net/browse/BMS-3925) | Phase 2a | Execution Order: 4

## Summary

Gulf retailers need to browse a product catalog with real-time warehouse-specific availability, account-specific pricing, and promotional offers. FL may carry 80 SKUs while AL carries 150+ with partial overlap.

## Jira Links

- Blocked by: [[BMS-3930 — Credit Terms & Payment Status]] (credit terms)
- Related: [[BMS-3927 — Product Search & Filtering]] (search & filtering), [[BMS-3924 — Product Card & Grid Components]] (product cards)

## What Already Exists in the Codebase

| Component | Status | Path |
|-----------|--------|------|
| ecomShop (product browsing grid) | **COMPLETE** | `lwc/ecomShop/` |
| ecomProductPage (product detail) | **COMPLETE** | `lwc/ecomProductPage/` |
| CartController.getQuantityAvailable | **COMPLETE** | `classes/experienceSite/CartController.cls` |
| userDataService (product caching) | **COMPLETE** | `lwc/userDataService/` |
| Pricelist item loading | **COMPLETE** | `CartController.getFilteredRecords()` |
| Territory exclusion support | **COMPLETE** | `CartController.getTerritoryExclusions()` |
| Stock status display (In/Low/Out) | **COMPLETE** | ecomShop + ecomProductPage |
| Configuration MDT (show qty toggle) | **COMPLETE** | `Configuration_Preference.EcommerceShowQuantityAvailable` |
| Multi-warehouse filtering | MISSING | Single fulfillment location only |
| Account-specific pricing display | MISSING | Shows pricelist price, not Gulf pricing codes |
| Warehouse-specific catalog | MISSING | No FL vs AL catalog filtering |

## What Needs to Be Done

1. Extend `getQuantityAvailableAtFulfillmentLocation()` to support multi-warehouse queries
2. Filter product catalog by retailer's assigned warehouse (FL or AL)
3. Display account-specific pricing (resolved from Gulf pricing codes)
4. Add warehouse indicator on product cards (which warehouse stocks this item)
5. Handle partially overlapping catalogs (same product, different warehouses)

## Effort Estimate

**Medium** — the catalog UI is fully built. Work is extending the data layer to support multi-warehouse and Gulf pricing.

## Dependencies

- **Blocks**: [[BMS-4053 — Product Card Ph 1 — Card Component]] (product card needs catalog data), [[BMS-3927 — Product Search & Filtering]] (search filters catalog)
- **Blocked by**: [[BMS-3923 — Experience Cloud Theme & Brand Setup]] (theme), [[BMS-4049 — Gulf Pricing Spike — Architecture Discovery]] (spike — pricing approach)
