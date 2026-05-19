# Configuration Preferences
> **Confluence**: https://ohanafy.atlassian.net/wiki/spaces/PD/pages/911048705

## Component
`Configuration_Preference__mdt` (Custom Metadata Type)

## Related Tickets
- [[BMS-3441]] — Show/hide quantity available

---

## 1. Overview

**Purpose:** Centralized feature flag system using Custom Metadata. Controls configurable behaviors across the e-commerce portal without code changes.

**Target Users:** Admins

**How it works:** Each preference is a `Configuration_Preference__mdt` record with `Key__c` (unique identifier) and `Active__c` (boolean toggle). LWCs query on initialization via `CartController.getMetadataActiveStatus(metaKey)`.

---

## 2. Active Preferences

| Key | Type | Default | Pages Affected | Description |
|---|---|---|---|---|
| `ecommerceShowQuantityAvailable` | Boolean | `false` | Shop, Product Page | When active, displays inventory quantity available on product cards and product detail pages. When inactive, quantity is hidden from retailer view. |

---

## 3. How to Add a New Preference

1. Create a `Configuration_Preference__mdt` record in Setup → Custom Metadata Types
2. Set `Key__c` to a unique identifier (e.g., `ecommerceMyNewFeature`)
3. Set `Active__c` to `true` or `false`
4. In the LWC, call on initialization:
```
const isEnabled = await getMetadataActiveStatus({ metaKey: 'ecommerceMyNewFeature' });
```
5. Use `isEnabled` to conditionally render UI elements

---

## 4. Backend Notes

| Apex Method | Description |
|---|---|
| `CartController.getMetadataActiveStatus(String metaKey)` | Queries `Configuration_Preference__mdt` for the given key, returns `true` if matching active record exists |

---

## 5. Changelog

| Date | Ticket | Change |
|---|---|---|
| Dec 2025 | BMS-3441 | Added `ecommerceShowQuantityAvailable` preference for Shop + Product pages |
