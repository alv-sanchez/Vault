# Testing Notes - BMS-3401: Footer — Navigation Items & Company Info

## Related
- Jira: https://ohanafy.atlassian.net/browse/BMS-3401

---

| Ticket | Component | Change Type | Ticket Link |
|--------|-----------|-------------|-------------|
| BMS-3401 | ecomFooter | New Feature | https://ohanafy.atlassian.net/browse/BMS-3401 |

## Overview
**Component**: `ecomFooter` LWC
**Change Type**: New Feature
**Ticket Description**: Global footer with navigation links to Shop, Account, and Support sections. Displays only for authenticated users with dynamic copyright year.
**Impact Assessment**: All pages — global footer component.
**Load Testing Required**: [ ] Yes [x] No

---

## Test Cases

*ID prefix: TC-FT*

### Link Groups

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-FT-001: Verify Shop group links | "All Products" and "Promotions" links visible |
| TC-FT-002: Click "All Products" | Navigates to shop page |
| TC-FT-003: Click "Promotions" | Navigates to promotions page |
| TC-FT-004: Verify Account group links | "Profile" and "Order History" links visible |
| TC-FT-005: Click "Profile" | Navigates to profile page |
| TC-FT-006: Click "Order History" | Navigates to order history page |
| TC-FT-007: Verify Support group links | "FAQ" and "Support" links visible |
| TC-FT-008: Click "FAQ" | Navigates to FAQ/support page |
| TC-FT-009: Click "Support" | Navigates to support page |
| TC-FT-010: Click "Shopping Cart" | Navigates to cart page |

### Authenticated Users Only

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-FT-011: View footer as logged-in user | Footer visible with all links |
| TC-FT-012: View footer as guest/unauthenticated | Footer hidden |

### Mobile Accordion

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-FT-013: View footer on mobile | Link groups collapsed into accordions |
| TC-FT-014: Tap Shop heading on mobile | Shop links expand, chevron rotates |
| TC-FT-015: Tap Account heading on mobile | Account links expand |
| TC-FT-016: Tap Support heading on mobile | Support links expand |
| TC-FT-017: View footer on desktop | All link groups expanded by default |

### Company Info

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-FT-018: Verify copyright year | Shows current year dynamically |
