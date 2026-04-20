---
title: "Order Detail & Tracking Page — Lovable Prompt"
page: /orders/:id
covers: Per-line tracking, backorder management, ETA updates, cancel backorder
---

# Order Detail & Tracking Page — `/orders/:id`

## Lovable Prompt

Build an order detail page for a B2B beverage distributor portal. This is a deep-dive into a single order showing **per-shipment tracking**, **backorder management**, and **ETA change history**.

### Layout

- **Breadcrumb**: Orders > ORD-2026-04158
- **Order header** with key info
- **Shipment tracking timeline** (vertical)
- **Line items by shipment**
- **Backorder management actions**

---

### Order Header

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Order #ORD-2026-04158                                           │
│  Placed: April 16, 2026 at 2:34 PM                              │
│                                                                  │
│  Customer: Lucky's Bar & Grill                                   │
│  Warehouse: Milton FL                                            │
│  Payment: Net 30 — Due May 16, 2026                             │
│  Sales Rep: James Rodriguez                                      │
│                                                                  │
│  Order Total: $665.23                                            │
│  ┌────────────────┐ ┌────────────────┐                          │
│  │ Shipment 1     │ │ Shipment 2     │                          │
│  │ 🟢 Shipped     │ │ 🔵 Backordered │                          │
│  │ $421.27        │ │ $243.96        │                          │
│  └────────────────┘ └────────────────┘                          │
│                                                                  │
│  [Print Order]  [Download Invoice]  [Contact Support]            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Shipment 1 — Tracking Timeline

```
┌─ 📦 SHIPMENT 1 — IN TRANSIT ────────────────────────────────────┐
│                                                                   │
│  Tracking #: GD-2026-8847                                        │
│  Route: Milton FL → Tampa (Tuesday AM)                           │
│                                                                   │
│  ● Apr 16, 2:34 PM — Order Placed                               │
│  │                                                                │
│  ● Apr 17, 6:15 AM — Picked & Packed at Milton FL warehouse     │
│  │                                                                │
│  ● Apr 17, 8:00 AM — Shipped — On route truck #T-442            │
│  │                                                                │
│  ○ Apr 22 (est.) — Out for Delivery (Tuesday AM window)         │
│  │                                                                │
│  ○ Apr 22 (est.) — Delivered                                     │
│                                                                   │
│  ── Items in this shipment ──────────────────────────────────── │
│  Gulf Premium Vodka 750ml         3 × $42.99        $128.97     │
│  Coastal IPA 12oz                 5 × $31.99        $159.95     │
│  Gulf Silver Tequila 750ml        2 × $38.99         $77.98     │
│  Sunshine Rosé 2024 (partial)     2 × $24.99         $49.98     │
│                                                                   │
│  Subtotal: $416.88  |  Tax: $29.39  |  Total: $421.27           │
│  💳 Charged to Net 30 account                                    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

### Shipment 2 — Backorder Management

```
┌─ 📦 SHIPMENT 2 — BACKORDERED ───────────────────────────────────┐
│                                                                   │
│  Status: Awaiting Stock                                           │
│  Estimated Ship: April 28 – May 5, 2026                         │
│                                                                   │
│  ● Apr 16, 2:34 PM — Order Placed (backorder created)           │
│  │                                                                │
│  ◐ Awaiting stock arrival at Milton FL warehouse                 │
│  │                                                                │
│  ○ ~Apr 28 – May 5 — Ships when stock arrives                   │
│  │                                                                │
│  ○ TBD — Delivered (route-based, after shipment)                 │
│                                                                   │
│  ── Items in this shipment ──────────────────────────────────── │
│                                                                   │
│  Bay Aged Rum 750ml               2 × $52.99        $105.98     │
│  ETA: April 28  |  Status: Supplier confirmed                    │
│  [Cancel this item]                                               │
│                                                                   │
│  Sunshine Reserve Cab 2022        1 × $45.99         $45.99     │
│  ETA: May 5  |  Status: Awaiting supplier                        │
│  [Cancel this item]                                               │
│                                                                   │
│  Sunshine Rosé 2024 (remainder)   3 × $24.99         $74.97     │
│  ETA: May 2  |  Status: Restock in transit to warehouse          │
│  [Cancel this item]                                               │
│                                                                   │
│  Subtotal: $226.94  |  Tax: $17.02  |  Est. Total: $243.96      │
│  💳 Charged on shipment (not yet charged)                        │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ ⚠️ Manage Backorder                                       │    │
│  │                                                            │    │
│  │ [Cancel All Backordered Items]                             │    │
│  │ [Keep Waiting — Notify Me of Changes]                      │    │
│  │                                                            │    │
│  │ Prices are locked at your April 16 rate.                   │    │
│  │ You will not be charged until shipment.                    │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

### ETA Change History (If applicable)

```
┌─ 📋 ETA CHANGE LOG ─────────────────────────────────────────────┐
│                                                                   │
│  Apr 22 — Bay Aged Rum ETA updated: Apr 25 → Apr 28             │
│           Reason: Supplier production delay                       │
│           📧 Notification sent to mike@luckysgrill.com           │
│                                                                   │
│  Apr 16 — Original ETAs set on order placement                   │
│           Bay Aged Rum: Apr 28                                    │
│           Sunshine Reserve Cab: May 5                             │
│           Sunshine Rosé: May 2                                    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

### Cancel Backorder Confirmation Modal

When "Cancel this item" or "Cancel All" is clicked:

```
┌─ CANCEL BACKORDER ──────────────────────────────────────────────┐
│                                                                  │
│  Are you sure you want to cancel?                                │
│                                                                  │
│  Bay Aged Rum 750ml — 2 cases ($105.98)                         │
│                                                                  │
│  • This item will be removed from your order                     │
│  • You will not be charged for cancelled items                   │
│  • Your order total will be adjusted                             │
│  • This cannot be undone (you can re-order later)               │
│                                                                  │
│  [Keep Item]                [Cancel Item]                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```
