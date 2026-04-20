---
ticket: BMS-3929
title: Order history & one-click reorder
type: Audit
status: In Progress (partial)
file_audited: force-app/main/default/lwc/ecomOrderHistory/ecomOrderHistory.js
jira: https://ohanafy.atlassian.net/browse/BMS-3929
audited_on: 2026-04-14
tags:
  - audit
  - ecom
  - manager
---
%%  %%
# BMS-3929 — Order history & one-click reorder

> [!warning] Verdict
> **The current LWC covers the View half of the ticket reasonably well, but the Reorder, Pricing Recalculation, Audit Immutability, and Reorder Gating halves are largely missing or live in unverifiable adjacent components.** This ticket is also a 6-feature mega-story that should have been split before any code was written.

---

## ✅ What IS there

### Order history view (most of AC 1)
- Reverse chronological list rendered via `processOrders` (sort order depends on Apex query, not verifiable from JS alone)
- Columns rendered: **Order Date** (`orderDate`), **Order Number** (`autoNumber`), **Warehouse-ish** (`fulfillmentLocation`), **Delivery Date** (`deliveryDate`), **Total** (`totalAmount`), **Status** (`status`)
- **Date range filter** (`selectedTimeframe` with All Time / Last 30 Days / Last 3 Months / Last 6 Months / This Year / Last Year)
- **Status filter** (`selectedStatus`)
- **Free-text search** that hits order number + product name + product type/category (functional but not the dedicated brand filter the AC asks for)
- **Pagination machinery** (clearPages / pushOrder / repaginate / page navigation buttons)
- **Expandable rows** via `toggleOrderCollapse` for line item detail
- **Line items rendered with**: name, quantity, unit price, line total, discounted price, savings, packaging
- **Status-to-color mapping** via `getStatusClass`
- **Reorder modal hand-off** via `c-reorder-modal` (the actual reorder logic lives outside this file)
- **Stats tiles**: total orders, total spent, pending orders, completed orders, total items, average order value
- **Ordered Products tab** (bonus feature, separate UX for repeat-buy patterns)
- **Tailwind + branding loader** wired
- **Pubsub + LMS subscription** for user data context

---

## ❌ What is NOT there

### AC 1 — View with filtering
- ❌ **Default page size is 10, not 20** (line 74). Ticket explicitly says 20.
- ❌ **No SKU field** in line item display. Item map (lines 587–615) has product name, qty, price — no `sku`.
- ❌ **No top-level total count indicator**. There's a per-page range (`ordersRangeText`) but no "X total orders" header.
- ❌ **No dedicated brand filter**. Brand is searchable via the free-text input but isn't a separate filter the AC explicitly asks for.
- ❌ **`Invoiced` status missing from filter dropdown** (lines 140–147). Ticket lists "Delivered, Invoiced, Cancelled" — code has Pending, In Transit, Out For Delivery, Delivered, Cancelled.
- ❌ **`Voided` status not handled** in `mapOrderStatus` (lines 677–705). AC 5 explicitly references Voided orders.

### AC 2 — One-click reorder
- ❌ **Reorder action shows on every order regardless of status** (`getOrderActions`, lines 732–749). Ticket scenario reorders from a *delivered* order; no current restriction.
- ❌ **No discontinued / out-of-stock flagging** in this LWC. Worse — the current code *silently filters out* items not on the current pricelist via `validPricelistItemIds.has(...)` (lines 556, 1356). Ticket says items should be **flagged with a warning icon and message**, not removed.
- ❌ **Current pricing recalculation not visible here.** Line items map historical `ohfy__Unit_Price__c` and `ohfy__Discounted_Unit_Price__c`. Whether `c-reorder-modal` re-resolves against `Price_Record__c` is unverifiable from this file.

### AC 3 — Pricing code changes since original order
- ❌ **No price-difference comparison logic** in this LWC. No "original price (struck through) and current price" rendering.
- ❌ **No "X items have updated pricing" cart summary message** anywhere here.
- ❌ Could live in `c-reorder-modal` or the cart page but **needs to be verified** — currently invisible.

### AC 4 — Partial reorder
- ❌ **`Reorder_Source__c` traceability lookup is not referenced anywhere in this file.** When a reorder is initiated, the original Order ID is not stamped on anything visible from here. Whether the create-order Apex stores it is unverifiable.

### AC 5 — Audit immutability
- ❌ **Pricelist filter conflicts with immutability.** The `validPricelistItemIds.has(...)` filter (lines 556, 1356) excludes items from display when they're no longer on the account's current pricelist. AC 5 says "Order data matches the corresponding Order__c and Invoice__c records in Salesforce with no discrepancies." A historical 12-line order would render as 10 lines if 2 SKUs were since removed. **This is arguably a compliance bug, not just missing scope.**
- ❌ **No cancellation reason field displayed** for cancelled orders. Status badge exists but no reason.
- ❌ **`Voided` status branch missing** from `mapOrderStatus`.

### AC 6 — Reorder gating
- ❌ **No `Price_Record__c` / `Warehouse__c` precondition check on the Reorder button.** `getOrderActions` (line 736) unconditionally adds Reorder.
- ❌ **No "Reorder is not yet available for your account — please contact your sales representative" message** anywhere in the file.
- ❌ Note: the ticket is **blocked by BMS-3930** (linked "is blocked by"). Implementation should not assume those data points exist yet.

### Stale TODOs left in the file
- Line 618: `tracking: null, // TODO: Add tracking field if available`
- Lines 1029–1032: `handleTrackPackage` is a stub showing "will be implemented soon"
- Lines 1034–1037: `handleDownloadInvoice` is a stub showing "will be implemented soon"
- Lines 1065–1070: `navigateToOrderDetail` is a stub showing "will be implemented soon"
- Lines 900–901: code comment notes the post-add-to-cart toast "gets displayed twice"

---

## 🚨 Ticket bloat / scope concerns

### This is six tickets disguised as one
The ticket bundles six distinct features into one Story. Each could (and arguably should) be its own scoped ticket so engineering can ship and demo incrementally:

| Sub-feature | Suggested split |
|---|---|
| Order history view: filtering, columns, pagination, expandable rows | **Split #1** — pure read-only display, ships standalone |
| One-click reorder happy path (clone items into cart) | **Split #2** — depends on #1 |
| Current price re-resolution + strikethrough display + "X items updated pricing" notice | **Split #3** — pricing logic, depends on #2 |
| Partial reorder + `Reorder_Source__c` traceability | **Split #4** — order creation logic, depends on #2 |
| Audit immutability handling (cancellation reason, Voided status, no-edit guarantee) | **Split #5** — read-only audit concerns, can ship parallel to #1 |
| Reorder gating when prerequisites missing | **Split #6** — guard logic, depends on #2 |

A single PR that satisfies all 6 ACs would touch the LWC, the reorder modal, the cart page, an Apex service for current-price resolution, the order-creation Apex, and possibly the Account schema. That's well beyond a Story-shaped scope.

### Over-prescriptive AC items
- **"Pagination displays 20 orders per page"** — the literal number 20 is over-prescription. Should be configurable (or the ticket should specify "configurable, default 20").
- **"An informational message is displayed: 'Reorder is not yet available for your account — please contact your sales representative'"** — exact UX copy in AC is bloat. Copy should live in a content style guide or be flexible.
- **References to specific accounts** (`Order #ORD-28741`, `Riviera Country Club`-style examples, `Mobile AL retailer`, `Montgomery AL`) — these read like illustrative test data, not acceptance criteria. They should be in test notes, not ACs.
- **"40+ historical orders spanning the last 18 months"** — also test data, not AC.

### Open questions still unanswered on the ticket
The ticket has three open questions in the enriched section that the team never resolved:
- How far back should order history be visible? (Compliance retention is 10+ years per Iowa/state — does the portal show all of it?)
- Reorder routing — same warehouse as original, or re-evaluate against current Account.Warehouse__c?
- Reorder availability for partial deliveries / BOL variances, or only fully delivered orders?

**These are blocking scope decisions disguised as "details to nail down later".** Until they're answered, the engineering team can't credibly say "we built what was asked for" because the ask is undefined in three places.

### Ambiguous "audit compliance" requirement
AC 5 promises that displayed order data matches the corresponding Order__c and Invoice__c records with no discrepancies. The current implementation actively violates this with the pricelist filter. Either:
- The pricelist filter should be removed (and the AC 2 "out of stock flagging" implemented properly)
- OR AC 5's "no discrepancies" clause should be relaxed in writing

This is a **product decision**, not an engineering tradeoff to silently make.

### Cross-component scope
A real implementation of this ticket touches **at minimum**:
- `ecomOrderHistory` LWC (this file)
- `c-reorder-modal` LWC
- `OrderHistoryController` Apex
- A new or extended pricing service in Apex
- The cart / checkout flow
- The order-creation Apex (for `Reorder_Source__c`)

A single Jira Story claiming all of this is a planning failure, not just a sizing one.

---

## Recommendation

1. **Don't close BMS-3929 against the current code.** Even the View half has gaps (page size, SKU column, Invoiced/Voided statuses, total count indicator).
2. **Push back on the ticket shape** — propose splitting into the 6 sub-features above, scoped and prioritized independently.
3. **Get the 3 open questions answered in writing** before engineering commits to AC 2/4/5 work.
4. **Fix the audit-immutability bug now, separately from this ticket** — the pricelist filter silently dropping line items is a real compliance issue regardless of whether BMS-3929 ever ships in its current form.

## Related
- Jira: https://ohanafy.atlassian.net/browse/BMS-3929
- Blocked by: BMS-3930
- File audited: `force-app/main/default/lwc/ecomOrderHistory/ecomOrderHistory.js`
