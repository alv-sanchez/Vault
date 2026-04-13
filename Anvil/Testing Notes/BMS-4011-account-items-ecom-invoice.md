# Testing Notes - BMS-4011: Account Items on ECOM Invoice Creation

## Related
- Ticket: [[BMS-4011]] (in Tickets/)
- Jira: https://ohanafy.atlassian.net/browse/BMS-4011
- Related Bug: https://ohanafy.atlassian.net/browse/BMS-4012

---

| Ticket | Component | Change Type | Ticket Link |
|--------|-----------|-------------|-------------|
| BMS-4011 | CartController, draftInvoiceService | New Feature | https://ohanafy.atlassian.net/browse/BMS-4011 |

## Overview
**Component**: `CartController.createAccountItem` Apex, `draftInvoiceService` LWC
**Change Type**: New Feature
**Ticket Description**: Automatically create or re-activate Account Items when items are added to cart or orders are submitted via the e-commerce portal, keeping Account Items in sync with the Order table.
**Impact Assessment**: Affects all cart operations across Shop, Product Page, Cart Page, and Reorder Modal. Downstream impact on Update Invoice functionality.
**Load Testing Required**: [ ] Yes [x] No

## Preconditions

| Preconditions ID | Object(s) | Fields & Values | Description |
|------------------|-----------|-----------------|-------------|
| PRE-01 | Account | Active portal account with pricelist | Test account with portal user |
| PRE-02 | Item__c | Products in the account's pricelist | Items available to add to cart |
| PRE-03 | Account_Item__c | None existing for the test item | Clean state — no prior account items |
| PRE-04 | Account_Item__c | Existing but `Active__c = false` | Inactive account item for reactivation test |

---

## Test Cases

*ID prefix: TC-AI*

### Adding Items — Shop Page

| Test Case | Expected Outcome | Preconditions ID |
|-----------|------------------|------------------|
| TC-AI-001: Add a new product to cart from Shop page | `Account_Item__c` created with `Active__c = true`, `Item__c` = product, `Account__c` = customer | PRE-01, PRE-02, PRE-03 |
| TC-AI-002: Add product that has inactive Account_Item | `Account_Item__c` reactivated (`Active__c` set to `true`), `Sequence__c` updated | PRE-01, PRE-02, PRE-04 |
| TC-AI-003: Add product that already has active Account_Item | No duplicate created — existing record unchanged | PRE-01, PRE-02 |

### Adding Items — Product Page

| Test Case | Expected Outcome | Preconditions ID |
|-----------|------------------|------------------|
| TC-AI-004: Add to cart from Product detail page | `Account_Item__c` created for that product | PRE-01, PRE-02, PRE-03 |
| TC-AI-005: Update quantity on Product page (item already in cart) | No new `Account_Item__c` created (only fires for new items) | PRE-01, PRE-02 |

### Adding Items — Cart Page

| Test Case | Expected Outcome | Preconditions ID |
|-----------|------------------|------------------|
| TC-AI-006: Increase quantity of existing cart item | No new `Account_Item__c` created (update only, not new add) | PRE-01, PRE-02 |

### Reorder Modal — Bulk Add

| Test Case | Expected Outcome | Preconditions ID |
|-----------|------------------|------------------|
| TC-AI-007: Reorder 3 items from Order History | `Account_Item__c` created for each item not already active | PRE-01, PRE-02, PRE-03 |
| TC-AI-008: Reorder items that already have active Account_Items | No duplicates — existing records unchanged | PRE-01, PRE-02 |

### Sequence Numbering

| Test Case | Expected Outcome | Preconditions ID |
|-----------|------------------|------------------|
| TC-AI-009: Add first-ever item for an account | `Sequence__c = 1` | PRE-01, PRE-02, PRE-03 |
| TC-AI-010: Add item when account has existing Account_Items | `Sequence__c = MAX(existing) + 1` | PRE-01, PRE-02 |
| TC-AI-011: Reactivate inactive item | `Sequence__c` updated to `MAX(existing) + 1` | PRE-01, PRE-02, PRE-04 |

### Error Handling

| Test Case | Expected Behavior | Preconditions ID |
|-----------|-------------------|------------------|
| TC-AI-012: `createAccountItem` fails (e.g., validation rule) | Error caught — cart operation still succeeds (fire-and-forget) | PRE-01 |
| TC-AI-013: Blank `lineItemString` passed | Method returns without error (null guard) | — |

### Downstream — Update Invoice

| Test Case | Expected Outcome | Preconditions ID |
|-----------|------------------|------------------|
| TC-AI-014: Submit ECOM order, then open Update Invoice in distro | Account Items exist for all ordered products — Update Invoice works correctly | PRE-01, PRE-02 |

---

## Verification Query

After adding items to cart or placing an order:

```sql
SELECT Id, Item__c, Item__r.Name, Account__c, Active__c, Sequence__c, CreatedDate
FROM Account_Item__c
WHERE Account__c = '<test-account-id>'
ORDER BY Sequence__c DESC
```

## Call Sites

| Where Called | Method | Trigger |
|---|---|---|
| `draftInvoiceService.addOrUpdateInvoiceItem()` | Fire-and-forget after new item add | Shop, Product, Cart pages |
| `draftInvoiceService.addMultipleItems()` | Fire-and-forget per item in bulk add | Reorder Modal |
| `draftInvoiceService.confirmDraft()` | Fire-and-forget per item on order submit | Review/Checkout |
