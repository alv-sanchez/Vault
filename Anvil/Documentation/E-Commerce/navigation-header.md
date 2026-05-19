# Navigation & Header
> **Confluence**: https://ohanafy.atlassian.net/wiki/spaces/PD/pages/744914947

## Component
`navigationMenu` LWC

## Related Tickets
- [[BMS-4048-quick-fixes]] — Delivery banner weekday cutoff
- [[BMS-4072-delivery-banner-cutoff-fix]] — Dynamic cutoff time, auto-hide, active routes

---

## 1. Overview

**Purpose:** Global header/navigation bar across all portal pages. Includes search, cart badge, user menu, delivery banner, and scheduled delivery days message.

**Target Users:** Retailers

---

## 2. Features

### Delivery Cutoff Banner
- Dynamic cutoff time from `Location.Warehouse_Cutoff_Time__c`
- Message: "Place order by [time] [today/day] to receive delivery on [date]."
- Cutoff date skips weekends: Monday delivery = Friday (-3), Tue-Fri = previous day (-1)
- Auto-hides after cutoff passes (`now >= cutoffDateTime`)
- Hidden when no cutoff time on Location

### Search
- Global search bar, navigates to shop page with search query

### Cart Badge
- Item count from `draftInvoiceService.invoiceItemCount`
- Click navigates to cart page

### Scheduled Delivery Days
- "Scheduled delivery day(s): Monday, Thursday" message from active routes

---

## 3. Known Issues & Workarounds
- `Warehouse_Cutoff_Time__c` is timezone-agnostic — value must be set correctly for the org

---

## 4. Backend Notes

| Data Source | Description |
|---|---|
| `userDataService.warehouseCutoffTime` | Cutoff time (ms from midnight) |
| `CartController.getRecordsByMultipleFields` | Active Account_Route__c for delivery calculation |
| `CartController.checkLockedDelivery` | Check if next delivery is locked |
| `CartController.setDeliveryMessage` | Scheduled delivery days string |

---

## 5. Changelog

| Date | Ticket | Change |
|---|---|---|
| 2026-04 | BMS-4048 | Cutoff date skips weekends (Monday = Friday) |
| 2026-04 | BMS-4072 | Dynamic cutoff time from Location, auto-hide, no banner without cutoff |
