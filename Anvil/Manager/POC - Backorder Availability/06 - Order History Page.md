---
title: "Order History Page — Lovable Prompt"
page: /orders
covers: Order list with backorder status, ETA tracking, reorder
---

# Order History Page — `/orders`

## Lovable Prompt

Build an order history page for a B2B beverage distributor portal. Orders must show **per-order availability status** and flag orders with backordered items. Include a **1-click reorder** feature.

### Layout

- **Top bar**: Stats cards row
- **Tabs**: All Orders | Active | Backordered | Delivered | Cancelled
- **Filter row**: Time range dropdown + search box
- **Order list**: Cards or table rows, each expandable

---

### Stats Cards

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Total Orders │ │ Total Spent  │ │   Pending    │ │  Backordered │ │  Avg Order   │
│     47       │ │  $28,450     │ │      3       │ │      2       │ │    $605      │
│  all time    │ │  all time    │ │   awaiting   │ │ items in     │ │   value      │
│              │ │              │ │   delivery   │ │   transit    │ │              │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

The **Backordered** stat card is highlighted amber if > 0.

---

### Order List — Show Multiple States

**Order 1 — Has Backorders (Active)**
```
┌─────────────────────────────────────────────────────────────────┐
│ ORD-2026-04158          April 16, 2026          $665.23        │
│                                                                  │
│ 📦 Shipment 1: Shipped — Delivery Tue Apr 22    ← 🟢 On Track  │
│ 📦 Shipment 2: Backordered — Ships ~Apr 28      ← 🔵 Awaiting  │
│                                                                  │
│ 8 items (5 shipped, 3 backordered)     Net 30 — Due May 16     │
│                                                                  │
│ [View Details]  [Track Delivery]  [Reorder All →]               │
│                                                 ▼ Expand        │
└─────────────────────────────────────────────────────────────────┘
```

**Order 2 — Fully Delivered**
```
┌─────────────────────────────────────────────────────────────────┐
│ ORD-2026-04092          April 8, 2026           $412.50        │
│                                                                  │
│ ✅ Delivered — April 11, 2026                                    │
│                                                                  │
│ 6 items, single shipment              Net 30 — Paid ✓          │
│                                                                  │
│ [View Details]  [Reorder All →]                                  │
│                                                 ▼ Expand        │
└─────────────────────────────────────────────────────────────────┘
```

**Order 3 — Backorder ETA Changed (Notification)**
```
┌─────────────────────────────────────────────────────────────────┐
│ ORD-2026-03987          March 28, 2026          $890.00        │
│                                                                  │
│ 📦 Shipment 1: Delivered — April 1              ← ✅            │
│ 📦 Shipment 2: Backordered — NEW ETA: May 10    ← 🟡 Delayed   │
│                                                                  │
│ ⚠️ ETA updated: Was Apr 25 → Now May 10 (supplier delay)       │
│                                                                  │
│ 10 items (7 delivered, 3 backordered)  Net 30 — Partial paid    │
│                                                                  │
│ [View Details]  [Cancel Backorder]  [Reorder Delivered Items →] │
│                                                 ▼ Expand        │
└─────────────────────────────────────────────────────────────────┘
```

**Order 4 — In Transit**
```
┌─────────────────────────────────────────────────────────────────┐
│ ORD-2026-04140          April 14, 2026          $328.75        │
│                                                                  │
│ 🚚 Out for Delivery — ETA Today (Tuesday AM window)             │
│                                                                  │
│ 4 items, single shipment              Net 30 — Due May 14      │
│                                                                  │
│ [View Details]  [Track Delivery]                                 │
│                                                 ▼ Expand        │
└─────────────────────────────────────────────────────────────────┘
```

**Order 5 — Cancelled Backorder**
```
┌─────────────────────────────────────────────────────────────────┐
│ ORD-2026-03900          March 20, 2026          $156.00        │
│                                                                  │
│ 📦 Shipment 1: Delivered — March 24             ← ✅            │
│ 📦 Shipment 2: Cancelled by you — March 30      ← ❌            │
│                                                                  │
│ 5 items (3 delivered, 2 cancelled)     Net 30 — Paid ✓         │
│                                                                  │
│ [View Details]  [Reorder All →]                                  │
│                                                 ▼ Expand        │
└─────────────────────────────────────────────────────────────────┘
```

---

### Expanded Order Detail (Inline)

When "Expand" is clicked:

```
│ ▲ Collapse                                                       │
│                                                                   │
│ ── Shipment 1 (Shipped) ──────────────────────────────────────── │
│ Gulf Premium Vodka 750ml      3 × $42.99   $128.97   🟢 Shipped │
│ Coastal IPA 12oz              5 × $31.99   $159.95   🟢 Shipped │
│ Gulf Silver Tequila 750ml     2 × $38.99    $77.98   🟢 Shipped │
│                                                                   │
│ ── Shipment 2 (Backordered) ─────────────────────────────────── │
│ Bay Aged Rum 750ml            2 × $52.99   $105.98   🔵 ~Apr 28 │
│ Sunshine Reserve Cab 2022     1 × $45.99    $45.99   🔵 ~May 5  │
│ Sunshine Rosé 2024            3 × $24.99    $74.97   🔵 ~May 2  │
│                                                                   │
│ [Cancel Backordered Items]  [Reorder Shipped Items →]            │
```

---

### Backordered Tab Filter

When "Backordered" tab is active, show ONLY orders that have backordered items, with the backorder details prominently displayed. Add a count badge on the tab: `Backordered (2)`.

---

### 1-Click Reorder Modal

When "Reorder All" is clicked:

```
┌─ REORDER FROM ORD-2026-04092 ───────────────────────────────────┐
│                                                                   │
│  □ Gulf Premium Vodka 750ml      3 cases   $42.99   🟢 In Stock │
│  □ Coastal IPA 12oz              5 cases   $31.99   🟢 In Stock │
│  □ Gulf Silver Tequila 750ml     2 cases   $38.99   🟡 Low (4)  │
│  □ Bay Aged Rum 750ml            2 cases   $52.99   🔵 Backorder│
│  ☐ Sunshine Rosé 2024            5 cases   $24.99   🔴 Unavail  │
│    └── ⚠️ Not available — removed from reorder                   │
│                                                                   │
│  [Select All Available]                                           │
│                                                                   │
│  Selected: 4 items  |  Est. Total: $377.94                       │
│                                                                   │
│  [Cancel]                    [Add Selected to Cart →]            │
└──────────────────────────────────────────────────────────────────┘
```

Unavailable items are greyed out with explanation. Quantities are editable.
