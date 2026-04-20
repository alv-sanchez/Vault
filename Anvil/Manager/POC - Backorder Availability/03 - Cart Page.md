---
title: "Cart Page — Lovable Prompt"
page: /cart
covers: Per-line availability badges, split-shipment, backorder warnings
---

# Cart Page — `/cart`

## Lovable Prompt

Build a shopping cart page for a B2B beverage distributor portal. The cart must show **per-line-item availability status** and offer a **split-shipment decision** when items have mixed availability.

### Layout

- **Header**: "Your Cart (8 items)" with `[Continue Shopping]` and `[Clear Cart]` links
- **Main area** (70%): Cart line items grouped by availability
- **Right sidebar** (30%): Order summary card (sticky on scroll)

### Cart Line Items — Grouped by Availability

Group items visually with section headers:

**Section 1 — Ready to Ship (green left border)**
```
┌─ 🟢 READY TO SHIP ──────────────────────────────────────────────┐
│                                                                   │
│ [img] Gulf Premium Vodka 750ml          12-pack                  │
│       SKU: GPV-750-12                                             │
│       🟢 In Stock — 48 available                                  │
│       $42.99/case × 3 = $128.97         [- ] 3 [ +]   [🗑️]      │
│                                                                   │
│ [img] Coastal IPA 12oz                  24-pack                  │
│       SKU: CCA-IPA-24                                             │
│       🟢 In Stock — 120 available                                 │
│       ̶$̶3̶6̶.̶9̶9̶ $31.99/case × 5 = $159.95  [- ] 5 [ +]   [🗑️]  │
│       🏷️ Promo: Buy 3+ save 15% (APPLIED)                        │
│                                                                   │
│ [img] Gulf Silver Tequila 750ml         12-pack                  │
│       SKU: GST-750-12                                             │
│       🟡 Low Stock — Only 6 left                                  │
│       $38.99/case × 2 = $77.98          [- ] 2 [ +]   [🗑️]      │
│                                                                   │
│                              Subtotal: $366.90                    │
└───────────────────────────────────────────────────────────────────┘
```

**Section 2 — Backordered Items (amber/blue left border)**
```
┌─ 🔵 BACKORDERED — Est. Ship Apr 28 ─────────────────────────────┐
│                                                                   │
│ [img] Bay Aged Rum 750ml               12-pack                   │
│       SKU: BAR-750-12                                             │
│       🔵 Backordered — ETA: April 28, 2026                       │
│       $52.99/case × 2 = $105.98         [- ] 2 [ +]   [🗑️]      │
│       💡 In stock at Montgomery AL → [Switch warehouse]           │
│                                                                   │
│ [img] Sunshine Reserve Cab 2022         6-pack                   │
│       SKU: SRC-22-6                                               │
│       🔵 Backordered — ETA: May 5, 2026                          │
│       $45.99/case × 1 = $45.99          [- ] 1 [ +]   [🗑️]      │
│                                                                   │
│                              Subtotal: $151.97                    │
└───────────────────────────────────────────────────────────────────┘
```

**Section 3 — Quantity Warning (amber left border)**
```
┌─ ⚠️ PARTIAL AVAILABILITY ───────────────────────────────────────┐
│                                                                   │
│ [img] Sunshine Rosé 2024                6-pack                   │
│       SKU: SR-24-6                                                │
│       🟡 Only 2 of 5 cases available now                         │
│       $24.99/case × 5 = $124.95         [- ] 5 [ +]   [🗑️]      │
│                                                                   │
│       ┌─────────────────────────────────────────────┐            │
│       │ ⚠️ 2 cases ship now, 3 cases backordered    │            │
│       │    (Est. restock: May 2, 2026)              │            │
│       │                                              │            │
│       │ Options:                                     │            │
│       │ ○ Ship 2 now, backorder 3 (two shipments)   │            │
│       │ ○ Wait for all 5 (one shipment ~May 2)      │            │
│       │ ○ Reduce to 2 cases (in stock only)         │            │
│       └─────────────────────────────────────────────┘            │
│                                                                   │
│                              Subtotal: $124.95                    │
└───────────────────────────────────────────────────────────────────┘
```

---

### Split Shipment Decision Banner

At the top of the cart, show a prominent banner when the cart has mixed availability:

```
┌─────────────────────────────────────────────────────────────────┐
│ 📦 Your cart has items with different availability               │
│                                                                  │
│ ○ Ship available items now, backorder the rest (2 shipments)    │
│   → 5 items ship today, 3 items ship when available             │
│                                                                  │
│ ○ Hold entire order until all items are available               │
│   → Estimated complete date: May 5, 2026                        │
│   → Single shipment, single delivery                            │
│                                                                  │
│ [Apply Choice]                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

### Order Summary Sidebar (Sticky)

```
┌─ ORDER SUMMARY ────────────────────┐
│                                     │
│ Items (8):              $643.82     │
│ Promotion Savings:      -$25.00     │
│ Volume Discount (5%):   -$8.60     │
│                         ─────────   │
│ Subtotal:               $610.22     │
│ Tax (estimated):         $53.39     │
│ Shipping:                 TBD       │
│                         ─────────   │
│ Estimated Total:        $663.61     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📦 Shipment Breakdown           │ │
│ │ Shipment 1 (today): $491.85    │ │
│ │   5 items, all in stock         │ │
│ │ Shipment 2 (~Apr 28): $171.76  │ │
│ │   3 items, backordered          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ⚠️ Minimum order: $200 ✅ Met       │
│                                     │
│ [Proceed to Checkout →]            │
│                                     │
│ 💳 Payment: Net 30                  │
│ 🏢 Warehouse: Milton FL             │
└─────────────────────────────────────┘
```

If order minimum is NOT met:
```
│ ⚠️ Minimum order: $200              │
│    Current: $142.50                  │
│    Need $57.50 more to checkout      │
│ [Browse Products →]                  │
│                                      │
│ [Proceed to Checkout →] ← DISABLED   │
```

---

### Interactions
- Quantity changes trigger price recalculation + availability re-check
- If quantity exceeds stock, show the partial availability inline option
- Remove item shows brief undo toast
- "Switch warehouse" link on backordered items navigates to the product page with the alternate warehouse pre-selected
- Split-shipment choice persists and updates the order summary
