# Testing Notes - BMS-4008: Shop Search — Brand Search Returns Products

## Related
- Ticket: [[BMS-4008]]
- Jira: https://ohanafy.atlassian.net/browse/BMS-4008

---

| Ticket | Component | Change Type | Ticket Link |
|--------|-----------|-------------|-------------|
| BMS-4008 | ecomShop | Bug Fix | https://ohanafy.atlassian.net/browse/BMS-4008 |

## Overview
**Component**: `ecomShop` LWC — `checkSearchFilter()`
**Change Type**: Bug Fix
**Ticket Description**: Searching for a brand name returned no products. Fix adds `Item_Type__r.Name` (brand) to the search filter alongside product name and SKU.
**Impact Assessment**: Shop page search only.
**Load Testing Required**: [ ] Yes [x] No

---

## Test Cases

*ID prefix: TC-SS*

### Valid Cases

| Test Case                                                   | Expected Outcome                                          |
| ----------------------------------------------------------- | --------------------------------------------------------- |
| TC-SS-001: Search by product name (e.g., "IPA")             | Matching products displayed                               |
| TC-SS-002: Search by **item number**/SKU (e.g., "PROD-001") | Matching product displayed                                |
| TC-SS-003: Search by brand name (e.g., "Angry Orchard")     | All products under that brand displayed                   |
| TC-SS-004: Search by partial brand name (e.g., "Angry")     | Products with brands containing "Angry" displayed         |
| TC-SS-005: Search term matches both brand and product name  | All matching products displayed (union, not intersection) |
| TC-SS-006: Clear search term                                | All products shown (no filter applied)                    |
| TC-SS-007: Search with mixed case (e.g., "angry orchard")   | Case-insensitive — products found                         |

### Invalid Cases

| Test Case | Expected Behavior |
|-----------|-------------------|
| TC-SS-008: Search for a brand that doesn't exist | No products shown — empty state |
| TC-SS-009: Search with empty string / spaces only | All products shown (filter returns true) |
