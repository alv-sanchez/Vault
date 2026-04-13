# Support Page
> **Confluence**: https://ohanafy.atlassian.net/wiki/spaces/PD/pages/746553353

## Component
`ecomSupport` LWC

## Related Tickets
- [[BMS-4066-support-page-overhaul]] — FAQ updates, remove Contact Support & Submit Tickets

---

## 1. Overview

**Purpose:** Self-service support page with organized FAQs covering all aspects of the e-commerce portal.

**Target Users:** Retailers

---

## 2. Features

### FAQ Accordion
- 13 FAQs across 7 categories
- Expandable/collapsible — one open at a time
- Categories: Ordering & Navigation, Cart & Checkout, Promotions, Inventory & Fulfillment, Delivery, Payments, Account & Support

### Removed
- Contact Support section
- Submit Tickets tab

---

## 3. Known Issues & Workarounds
- FAQ content is hardcoded in JS — not admin-editable

---

## 4. Backend Notes

| Data Source | Description |
|---|---|
| N/A | FAQ data hardcoded in `ecomSupport.js` |

---

## 5. Changelog

| Date | Ticket | Change |
|---|---|---|
| 2026-04 | BMS-4066 | 13 FAQs added, Contact Support removed, Submit Tickets removed |
