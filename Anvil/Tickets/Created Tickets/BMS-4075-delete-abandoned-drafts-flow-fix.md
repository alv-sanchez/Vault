# BMS-4075: Fix Delete Abandoned Draft Invoices Flow — Exclude E-Commerce Drafts |ECOM|

## Related
- Jira: https://ohanafy.atlassian.net/browse/BMS-4075
- Testing: [[BMS-4075]] (in Testing/)

---

**Priority**: High
**Effort**: S
**Components**: `GetNonEcomDraftInvoiceGroups` Apex (global, @InvocableMethod), "Delete Abandoned Draft Invoices" Flow (TBM Prod)

## Story Statement

As an Retail User, I want the "Delete Abandoned Draft Invoices" flow to only delete non-e-commerce draft invoice groups, so that retailer carts placed through the portal are not wiped out by the cleanup job.

## Acceptance Criteria

### SCENARIO: Flow Uses New Apex Class
**GIVEN** the "Delete Abandoned Draft Invoices" flow runs
**WHEN** it queries for draft invoice groups to delete
**THEN** it calls `GetNonEcomDraftInvoiceGroups.getInvoiceGroups()` instead of the previous query
**AND** only returns `Invoice_Group__c` records where `Is_Draft__c = true`, `Total_Units__c = 0`, and the customer has no active portal users

### SCENARIO: E-Commerce Drafts Preserved
**GIVEN** a retailer has an active portal user and a draft invoice group (cart) in progress
**WHEN** the cleanup flow runs
**THEN** that draft invoice group is NOT deleted
**AND** the retailer's cart remains intact

### SCENARIO: Non-E-Commerce Drafts Deleted
**GIVEN** a sales rep created a draft invoice group for a non-portal account
**WHEN** the cleanup flow runs
**THEN** that draft invoice group IS included in the deletion candidates

## Dependencies
- **Cannot Start Until**: `GetNonEcomDraftInvoiceGroups` class deployed via ECOM package
- **This Story Unlocks**: None
- **Ships With**: Package install + manual flow edit on TBM Prod

## Post-Deployment Steps (TBM Prod)
1. Install the latest ECOM package version (includes `GetNonEcomDraftInvoiceGroups`)
2. Open the "Delete Abandoned Draft Invoices" flow in TBM Prod
3. Replace the existing query/action with the Apex Action: **"Get Non Ecom Draft Invoice Groups"**
4. Wire the returned `invoiceGroups` list into the existing delete logic
5. Save and activate the updated flow

## Implementation Notes
- `GetNonEcomDraftInvoiceGroups.cls`: `global` class with `@InvocableMethod` — accessible in Flow Builder after package install
- Query: `FROM Invoice_Group__c WHERE Is_Draft__c = true AND Total_Units__c = 0 AND Customer__c NOT IN (SELECT AccountId FROM User WHERE IsPortalEnabled = true AND IsActive = true) AND CreatedDate <= TODAY`
- `IsPortalEnabled` on User identifies portal/community users — avoids `IsCustomerPortal` on Account which isn't available in all org types
- Invoice_Group__c is the parent of draft invoices via split criteria
