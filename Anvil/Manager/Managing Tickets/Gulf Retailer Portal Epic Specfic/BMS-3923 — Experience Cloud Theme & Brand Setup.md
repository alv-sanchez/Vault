---
ticket: BMS-3923
title: Experience Cloud theme & brand setup (Gulf branding)
status: Backlog
type: Story
priority: TBD
phase: 1
execution_order: 1
labels: [ecom, gulf, phase-1, refinement-needed, roadmap-v2-baseline]
jira: https://ohanafy.atlassian.net/browse/BMS-3923
---

# BMS-3923 — Experience Cloud theme & brand setup (Gulf branding)

> [Jira](https://ohanafy.atlassian.net/browse/BMS-3923) | Phase 1 | Execution Order: 1

## Summary

Gulf's retailer-facing portal needs a consistent, branded visual identity from day one. Every downstream ECOM component inherits from this theme — if it's not locked in first, components ship with default Salesforce styling or accumulate one-off CSS overrides.

## Jira Links

- Blocked by: [[BMS-3930 — Credit Terms & Payment Status]] (Retailer credit terms)

## What Already Exists in the Codebase

| Component | Status | Path |
|-----------|--------|------|
| EcomBrandingController | COMPLETE | `classes/EcomBrandingController.cls` |
| Ecom_Branding__mdt (23 records) | COMPLETE | `objects/Ecom_Branding__mdt/` |
| Static resources (56 assets) | COMPLETE | `staticresources/` |
| Tailwind CSS | COMPLETE | `staticresources/tailwind.resource-meta.xml` |
| Gulf-specific branding assets | MISSING | No Gulf logos, colors, or theme overrides |
| Experience Cloud site config | MISSING | No `.site-meta.xml` files |
| Theme layouts | MISSING | No Experience Cloud theme customization |

## What Needs to Be Done

1. Create Gulf-branded static resources (logo, favicon, hero banners, category icons)
2. Add Gulf Ecom_Branding__mdt records mapping to new resources
3. Configure Experience Cloud site theme (colors, fonts, header/footer)
4. Ensure all existing LWCs render correctly with Gulf branding
5. No code changes expected — mostly config and design assets

## Effort Estimate

Config + design. The branding infrastructure (controller + MDT) is already built. This is about creating Gulf assets and configuring the Experience Cloud site.

## Dependencies

- **Blocks**: Everything — all components inherit this theme
- **Blocked by**: None (should be first)

---

## Completion — Built vs Wanted

**~50% already built** • **~50% Gulf-specific work remaining**

Progress: `██████████░░░░░░░░░░` (50%)

| Status | Count |
|---|---:|
| Built (COMPLETE) | 3 |
| Partial | 1 |
| Missing | 3 |
| **Total tracked items** | **7** |

**Codebase audit note (2026-04-22):** `Ecom_Branding__mdt` has **only 1 record** in `OHFY-Ecom` (not 23 as assumed in earlier docs). Infrastructure exists; content is thin. Static resources count is 54 (not 56).

**Top gap drivers (what still needs building):**
- Gulf-branded static resources (logo, favicon, hero banners, category icons)
- Populate Gulf `Ecom_Branding__mdt` records mapping to new resources
- Experience Cloud site theme config (colors, fonts, header/footer)
- Experience Cloud site metadata (`.site-meta.xml`)
- Theme layout customization
