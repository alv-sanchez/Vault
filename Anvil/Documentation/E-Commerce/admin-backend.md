# Admin & Backend

## Components
`GetNonEcomDraftInvoiceGroups` Apex, `CartController.fixEcomOrderNames` Apex, Flows

## Related Tickets
- [[BMS-4075-delete-abandoned-drafts-flow-fix]] — Draft invoice cleanup flow

---

## 1. Overview

**Purpose:** Backend Apex classes and Flow integrations that support the e-commerce portal but aren't tied to a specific page.

**Target Users:** Admins

---

## 2. Features

### Delete Abandoned Draft Invoices (Flow)
- `GetNonEcomDraftInvoiceGroups` — global @InvocableMethod
- Returns draft Invoice_Group__c records where customer has no active portal users
- Preserves e-commerce carts, deletes abandoned non-portal drafts
- Requires manual flow edit on TBM Prod after package install

### Order Name Fix
- `CartController.fixEcomOrderNames()` — corrects Sales_Rep__c post-confirmation
- Uses direct User query (FirstName + LastName) to avoid CommunityNickname masking

---

## 3. Changelog

| Date | Ticket | Change |
|---|---|---|
| 2026-04 | BMS-4075 | `GetNonEcomDraftInvoiceGroups` class, flow edit required on TBM Prod |



