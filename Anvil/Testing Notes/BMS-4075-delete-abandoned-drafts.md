# Testing Notes - BMS-4075: Delete Abandoned Draft Invoices Flow Fix

## Related
- Ticket: [[BMS-4075-delete-abandoned-drafts-flow-fix]] (in Tickets/Created Tickets/)
- Jira: https://ohanafy.atlassian.net/browse/BMS-4075

---

| Ticket   | Component                          | Change Type | Ticket Link                                   |
| -------- | ---------------------------------- | ----------- | --------------------------------------------- |
| BMS-4075 | GetNonEcomDraftInvoiceGroups, Flow | Bug Fix     | https://ohanafy.atlassian.net/browse/BMS-4075 |

## Overview
**Component**: `GetNonEcomDraftInvoiceGroups` Apex, "Delete Abandoned Draft Invoices" Flow
**Change Type**: Bug Fix
**Ticket Description**: Prevent cleanup flow from deleting e-commerce retailer carts while still cleaning non-portal empty drafts.
**Impact Assessment**: Draft invoice cleanup — affects all accounts with draft invoice groups.
**Load Testing Required**: [ ] Yes [x] No

## Preconditions
- ECOM package installed (includes `GetNonEcomDraftInvoiceGroups`)
- Flow updated to use the new Apex Action

---

## Test Cases

*ID prefix: TC-DAD*

### Valid Cases

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-DAD-001: Apex Action visible in Flow Builder | "Get Non Ecom Draft Invoice Groups" appears under Apex Actions |
| TC-DAD-002: Run flow — portal account has draft invoice group | Draft invoice group NOT deleted (e-commerce cart preserved) |
| TC-DAD-003: Run flow — non-portal account has empty draft invoice group | Draft invoice group IS deleted |
| TC-DAD-004: Run flow — non-portal account has draft with items (Total_Units > 0) | Draft invoice group NOT deleted (has items) |

### Invalid Cases

| Test Case | Expected Behavior |
|-----------|-------------------|
| TC-DAD-005: Flow deletes portal account's cart | Should NOT happen — excluded by IsPortalEnabled check |
| TC-DAD-006: Apex Action not visible after package install | Check permission set assignment for External Credential |

### Verification Query

```sql
SELECT Id, Name, ohfy__Customer__c, ohfy__Total_Units__c, ohfy__Is_Draft__c
FROM ohfy__Invoice_Group__c
WHERE ohfy__Is_Draft__c = true AND ohfy__Total_Units__c = 0
```
