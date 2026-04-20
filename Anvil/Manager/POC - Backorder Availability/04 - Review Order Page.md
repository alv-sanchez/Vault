---
title: "Review Order / Checkout Page — Lovable Prompt"
page: /checkout
covers: Split-shipment summary, tax by jurisdiction, order minimums, pricing lineage
---

# Review Order / Checkout Page — `/checkout`

## Lovable Prompt

Build a checkout/review-order page for a B2B beverage distributor portal. This is the final step before placing an order. It must clearly show **split-shipment breakdown**, **jurisdiction-based tax**, and **backorder terms**.

### Layout

- **Step indicator**: Cart → **Review Order** → Order Placed (current step highlighted)
- **Left column** (65%): Delivery info, shipment breakdown, payment
- **Right column** (35%): Order summary (sticky)

---

### Delivery Information Section

```
┌─ DELIVERY INFORMATION ──────────────────────────────────────────┐
│                                                                  │
│ Delivery Address                              [Edit]            │
│ Lucky's Bar & Grill                                              │
│ 1234 Main Street                                                 │
│ Tampa, FL 33602                                                  │
│                                                                  │
│ Delivery Window                                                  │
│ [Tuesday AM ▼]  (Your route: Tuesday/Thursday)                  │
│                                                                  │
│ Delivery Instructions                                            │
│ [Use back entrance, ask for Mike________________]               │
│                                                                  │
│ Warehouse: Milton FL                                             │
│ Sales Rep: James Rodriguez (james.r@gulfdist.com)               │
└──────────────────────────────────────────────────────────────────┘
```

---

### Shipment Breakdown — Two Shipment Versions

**Shipment 1 of 2 — Ships Today**
```
┌─ 📦 SHIPMENT 1 — SHIPS TODAY ───────────────────────────────────┐
│  Estimated delivery: Tuesday, April 22                           │
│                                                                   │
│  [img] Gulf Premium Vodka 750ml    3 × $42.99        $128.97    │
│        🟢 In Stock                                                │
│                                                                   │
│  [img] Coastal IPA 12oz           5 × $31.99        $159.95     │
│        🟢 In Stock  🏷️ 15% promo applied                         │
│                                                                   │
│  [img] Gulf Silver Tequila 750ml  2 × $38.99         $77.98     │
│        🟡 Low Stock (2 of 6 remaining)                           │
│                                                                   │
│  [img] Sunshine Rosé 2024         2 × $24.99         $49.98     │
│        🟡 Partial — 2 of 5 shipping now                          │
│                                                                   │
│                        Shipment 1 Subtotal:          $416.88     │
│                        FL Sales Tax (7.5%):           $31.27     │
│                        Shipment 1 Total:             $448.15     │
└───────────────────────────────────────────────────────────────────┘
```

**Shipment 2 of 2 — Backordered**
```
┌─ 📦 SHIPMENT 2 — BACKORDER ─────────────────────────────────────┐
│  Estimated ship date: April 28 – May 5                           │
│  ℹ️ You will NOT be charged until this shipment ships             │
│                                                                   │
│  [img] Bay Aged Rum 750ml         2 × $52.99        $105.98     │
│        🔵 Backordered — ETA: Apr 28                               │
│                                                                   │
│  [img] Sunshine Reserve Cab 2022  1 × $45.99         $45.99     │
│        🔵 Backordered — ETA: May 5                                │
│                                                                   │
│  [img] Sunshine Rosé 2024         3 × $24.99         $74.97     │
│        🔵 Backordered remainder — ETA: May 2                      │
│                                                                   │
│                        Shipment 2 Subtotal:          $226.94     │
│                        FL Sales Tax (7.5%):           $17.02     │
│                        Shipment 2 Total:             $243.96     │
│                                                                   │
│  ⚠️ Backorder terms:                                             │
│  • Prices locked at today's rate                                  │
│  • Charged on shipment, not on order                              │
│  • Cancel backordered items anytime before shipment               │
│  • ETAs are estimates and may shift                               │
└───────────────────────────────────────────────────────────────────┘
```

---

### Payment Section

```
┌─ PAYMENT ────────────────────────────────────────────────────────┐
│                                                                   │
│ Payment Terms: Net 30                                             │
│ Account Credit Available: $8,450.00                               │
│ This order: $692.11                                               │
│ Remaining credit after order: $7,757.89                           │
│                                                                   │
│ ○ Pay on Terms (Net 30)                                          │
│ ○ Pay by Credit Card  [Visa ending 4242]  [Manage cards →]      │
│                                                                   │
│ ℹ️ Shipment 2 (backorder) will be invoiced separately on ship    │
└───────────────────────────────────────────────────────────────────┘
```

---

### Order Summary Sidebar (Sticky)

```
┌─ ORDER SUMMARY ────────────────────┐
│                                     │
│ Shipment 1 (today):                │
│   Items (4):            $416.88     │
│   Promo savings:        -$25.00     │
│   FL Tax (7.5%):         $29.39     │
│   Subtotal:             $421.27     │
│                                     │
│ Shipment 2 (backorder):            │
│   Items (3):            $226.94     │
│   FL Tax (7.5%):         $17.02     │
│   Subtotal:             $243.96     │
│   ⏳ Charged on shipment            │
│                                     │
│ ─────────────────────────────       │
│ Due Today:              $421.27     │
│ Due on Backorder Ship:  $243.96     │
│ Order Total:            $665.23     │
│                                     │
│ ✅ Order minimum met ($200)         │
│ 💳 Net 30 — Due May 16, 2026       │
│                                     │
│ □ I agree to the backorder terms    │
│   and split-shipment policy         │
│                                     │
│ [Place Order →]                     │
│                                     │
│ 🔒 Prices locked at time of order   │
└─────────────────────────────────────┘
```

---

### Create a Second Version: Single Shipment (All In Stock)

Show the same page layout but with ALL items in stock — no split-shipment sections, no backorder terms. Simpler, cleaner. This demonstrates the page adapts to cart contents.

### Create a Third Version: Alabama Warehouse

Same cart but fulfilled from Montgomery AL warehouse. Show **AL Sales Tax (4%)** instead of FL (7.5%) to demonstrate jurisdiction-aware tax.
