---
ticket: BMS-4054
title: "Retailer Portal Product Card — Ph 2: Grid Layout + Reuse"
type: Story
parent: BMS-3924 (decomposed)
depends_on: BMS-4053 (Ph 1)
source_polish: "../BMS-4054-product-card-ph2.md"
source_progress: "Anvil/Manager/Managing Tickets/Gulf Retailer Portal Epic Specfic/BMS-4054 — Product Card Ph 2 — Grid Layout & Reuse.md"
iterated_on: 2026-05-05
phase: 2b
execution_order: 9
status: "Backlog — unify three existing grids + tablet breakpoints"
tags: [polish, iterating, ecom, gulf, grid, reuse, sprint3]
---

# BMS-4054 — Iterating (outstanding only)

> Epic-specific note says **~50% built**. Three grid-like patterns exist (`ecomShop`, `reorderModal`, `ecomOrderHistory`) but each renders its own card markup. This ticket unifies them onto BMS-4053's extracted card.

## Pulled OUT (already complete per epic note)

| Item | Path |
|---|---|
| ecomShop grid layout (Tailwind) | `lwc/ecomShop/ecomShop.html` |
| Pagination (25 / 50 / 100 / 200 page-size selector) | `ecomShop.js` |

→ The polish first-pass concerns about "grid layout + responsive design" are partly redundant. Tailwind + paginated layout + viewport responsiveness exists; what's missing is **unification** and **tablet-specific tuning**.

## REMAINING (what hasn't been done)

### Code work

1. **Reusable grid container component** — accepts any `Item[]`-shaped array, renders a list of `<c-product-card item={...}>` (BMS-4053). Owns layout, pagination, virtualization (if needed), empty-state.
2. **Replace inline card rendering** in three hosts so they share the new grid + Ph 1 card:
    - `lwc/ecomShop/ecomShop.html` (catalog browse)
    - `lwc/reorderModal/` (currently per-item reorder UX)
    - `lwc/ecomOrderHistory/` (currently its own product rendering on the products tab)
3. **Tablet-optimized breakpoints** — sales reps use tablets in the field. Add explicit tablet (≈768px) class set; today is desktop-vs-mobile only via Tailwind defaults.
4. **Cross-viewport testing** — Jest + Playwright passes at desktop / tablet / mobile, including pagination + filter regression in ecomShop.
5. **Search-results host decision** — original AC #2 ("card reused in search results") needs a decision: does navigationMenu search route to ecomShop with a search query (existing path), surface a popover, OR get a dedicated `lwc/ecomSearchResults`? Today there is no dedicated component.
6. **Reorder-All button** — net-new bulk action above the reorder grid that calls cart-write (via `EcomWrappers.onInvoiceItemChange` / `cartService`) for every available previously-ordered item. Confirm cart-merge vs. cart-replace behavior with Gulf.

### Outstanding ACs (from polish first-pass, with completed work removed)

```gherkin
Scenario: Reusable grid container component
  Given a `lwc/productGrid` (or equivalent) accepts an Item[] array
  When  any host (ecomShop, reorderModal, ecomOrderHistory) passes its items
  Then  the grid renders identical pagination + layout
  And   each tile is a <c-product-card item={...}> from BMS-4053

Scenario: Replace inline card rendering across three hosts (regression-safe)
  Given the new grid + card are in place
  When  ecomShop / reorderModal / ecomOrderHistory render
  Then  each renders via the shared components (no host-specific card markup)
  And   pagination + filters + cart-add + pubsub continue to pass regression

Scenario: Tablet breakpoint (sales reps in field)
  Given the grid is hosted on a tablet viewport (~768px)
  When  the page renders
  Then  layout is explicitly tuned for tablet (2-3 cards/row, no horizontal scroll, touch-friendly hit targets on Add-to-Cart and qty selector)
  And   no card content is truncated or overlapping

Scenario: Search-results card reuse (depends on host decision)
  Given a search-results host is wired (popover OR routed ecomShop OR dedicated LWC)
  When  results render
  Then  the same productCard renders identically to the catalog view

Scenario: Reorder-All bulk action
  Given a retailer is on the reorder view with N previously-ordered Item__c records
  When  the retailer clicks 'Reorder All'
  Then  a confirmation modal lists the N items, flagging out-of-stock / discontinued
  And   on confirm, available items are added via EcomWrappers.onInvoiceItemChange (batched)
  And   the cart icon updates without a full page reload
  Note: Depends on OrderHistoryController stub rebuild (see Conflicts)
```

The polish first-pass AC for **keyword highlighting** and **suggested alternative** can be deferred — both are net-new and not flagged in the epic note. Drop unless Gulf explicitly asks for them.

## Conflicts to verify

| Item | Epic note says | Actual code says | Resolution needed |
|---|---|---|---|
| `lwc/reorderModal` "Grid in reorder modal" | PARTIAL | Component exists; per-item reorder via `getQuantityAvailableAtFulfillmentLocation` (live) — but **`OrderHistoryController` is a full stub** post Develop-Split | Decide if reorder unification + Reorder-All in this ticket requires the OrderHistoryController rebuild as a hard prereq (likely yes if order history is the data source) |
| `lwc/ecomOrderHistory` "Grid in order history products tab" | PARTIAL | Component exists; **OrderHistoryController stubbed** | Same — rebuild may be a prereq for reusing the card here |
| Responsive layout | PARTIAL ("Tailwind grid but not tablet-optimized") | Confirmed | This is the smallest gap |

## Hard dependencies (still binding)

- **BMS-4053 — Ph 1 Card Component** — must ship first; this ticket consumes its extracted card.
- **OrderHistoryController stub rebuild** — implicit dependency for reusing the grid in `lwc/ecomOrderHistory` and for "Reorder All". Not a ticket today; either file as prereq OR scope reorder out of this story.
- **BMS-3930** — same title-mismatch.
- (Indirect) **promotion-model rebuild** — inherited via BMS-4053's promo display.

## Updated estimate

**~2–3 days** for grid container + replacing inline rendering in ecomShop + tablet breakpoints + cross-viewport tests, **excluding** OrderHistoryController stub rebuild and **assuming** BMS-4053 ships first. If reorder host swap and Reorder-All are kept in scope AND the OrderHistoryController rebuild lands as a prereq, add 2–3 days for the reorder integration. If the rebuild is in *this* ticket, add another 2–3 days. Aligns with epic note "Medium."
