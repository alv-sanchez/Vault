# Testing Notes - BMS-3400: Navigation Menu — Search, Cart & Profile

## Related
- Jira: https://ohanafy.atlassian.net/browse/BMS-3400

---

| Ticket | Component | Change Type | Ticket Link |
|--------|-----------|-------------|-------------|
| BMS-3400 | navigationMenu | New Feature | https://ohanafy.atlassian.net/browse/BMS-3400 |

## Overview
**Component**: `navigationMenu` LWC
**Change Type**: New Feature
**Ticket Description**: Global navigation menu with product/brand/promotion search, delivery messaging, real-time cart updates, and profile management (view profile, logout).
**Impact Assessment**: All pages — global header component.
**Load Testing Required**: [ ] Yes [x] No

---

## Test Cases

*ID prefix: TC-NM*

### Search

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-NM-001: Type in search bar | Search results dropdown appears after debounce |
| TC-NM-002: Search for product name | Matching products shown in dropdown |
| TC-NM-003: Search for brand name | Matching brands shown in dropdown |
| TC-NM-004: Click a search result | Navigates to shop page filtered by selection |
| TC-NM-005: Press Enter on search | Navigates to shop page with search term |
| TC-NM-006: Click outside search dropdown | Dropdown closes |
| TC-NM-007: Clear search input | Dropdown closes, no filter applied |

### Cart Icon

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-NM-008: View cart icon | Shows current item count badge |
| TC-NM-009: Add item to cart from shop page | Cart badge count updates in real-time |
| TC-NM-010: Remove item from cart | Cart badge count decreases |
| TC-NM-011: Click cart icon | Navigates to cart page |
| TC-NM-012: Empty cart | Badge shows 0 or hidden |

### Delivery Banner

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-NM-013: Account with active route and cutoff time | Banner: "Place order by X PM [day] to receive delivery on [date]" |
| TC-NM-014: After cutoff time has passed | Banner hidden |
| TC-NM-015: No cutoff time on Location | Banner hidden |

### Scheduled Delivery Days

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-NM-016: Account with Monday + Thursday routes | Message: "Scheduled delivery day(s): Monday and Thursday" |
| TC-NM-017: Account with no active routes | Message: "No delivery days scheduled." |

### Profile Dropdown

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-NM-018: Click profile icon/name | Dropdown opens with options |
| TC-NM-019: Click "View Profile" | Navigates to profile page |
| TC-NM-020: Click "Logout" | User logged out, redirected to login page |
| TC-NM-021: Click outside dropdown | Dropdown closes |

### Responsive

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-NM-022: View on mobile | Menu collapses, hamburger menu or compact layout |
| TC-NM-023: View on desktop | Full menu bar with all elements visible |
