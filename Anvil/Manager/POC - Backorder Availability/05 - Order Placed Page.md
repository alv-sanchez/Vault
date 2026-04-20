---
title: "Order Placed / Confirmation Page — Lovable Prompt"
page: /order-placed
covers: Backorder flagging, shipment timeline, next steps
---

# Order Placed / Confirmation Page — `/order-placed`

## Lovable Prompt

Build an order confirmation page for a B2B beverage distributor portal. This page appears immediately after placing an order. It must clearly flag **backordered items** and set expectations for **split shipments**.

### Layout

- **Success banner** at top
- **Shipment timeline** (visual)
- **Order details** split by shipment
- **Next steps / what to expect**

---

### Success Banner

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ✅  Order Placed Successfully!                                  │
│                                                                  │
│  Order #ORD-2026-04158                                           │
│  Placed: April 16, 2026 at 2:34 PM ET                          │
│                                                                  │
│  A confirmation email has been sent to mike@luckysgrill.com     │
│  Your sales rep James Rodriguez has also been notified.          │
│                                                                  │
│  [Print Order]  [Download PDF]                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Shipment Timeline (Visual)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  📦 Shipment 1                    📦 Shipment 2                 │
│  5 items — In Stock               3 items — Backordered         │
│                                                                  │
│  ●━━━━━━━○━━━━━━━○               ●━━━━━━━○━━━━━━━○             │
│  Placed   Shipped  Delivered      Placed   Ships    Delivered   │
│  Today    Apr 17   Apr 22        Today    ~Apr 28   ~May 2     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

The timeline uses a horizontal stepper — first dot filled (placed), remaining dots outline (pending).

---

### Shipment 1 Detail

```
┌─ 📦 SHIPMENT 1 — SHIPPING SOON ─────────────────────────────────┐
│  Status: Processing                                               │
│  Ships: April 17  |  Delivery: Tuesday, April 22 (AM window)    │
│  Charged: $421.27 to Net 30 account                              │
│                                                                   │
│  Gulf Premium Vodka 750ml         3 cases      $128.97  🟢      │
│  Coastal IPA 12oz                 5 cases      $159.95  🟢 🏷️   │
│  Gulf Silver Tequila 750ml        2 cases       $77.98  🟢      │
│  Sunshine Rosé 2024 (partial)     2 cases       $49.98  🟡      │
│                                                                   │
│  Subtotal: $416.88  |  Tax: $29.39  |  Total: $421.27           │
└───────────────────────────────────────────────────────────────────┘
```

### Shipment 2 Detail

```
┌─ 📦 SHIPMENT 2 — BACKORDERED ───────────────────────────────────┐
│  Status: Awaiting Stock                                           │
│  Est. Ship: April 28 – May 5  |  Delivery: TBD                  │
│  Charged: On shipment ($243.96 estimated)                         │
│                                                                   │
│  Bay Aged Rum 750ml               2 cases      $105.98  🔵      │
│    ETA: April 28                                                  │
│  Sunshine Reserve Cab 2022        1 case        $45.99  🔵      │
│    ETA: May 5                                                     │
│  Sunshine Rosé 2024 (remainder)   3 cases       $74.97  🔵      │
│    ETA: May 2                                                     │
│                                                                   │
│  Subtotal: $226.94  |  Tax: $17.02  |  Est. Total: $243.96      │
│                                                                   │
│  ℹ️ You can cancel backordered items anytime before they ship.   │
│  [Manage Backorders →]                                            │
└───────────────────────────────────────────────────────────────────┘
```

---

### What to Expect Section

```
┌─ WHAT TO EXPECT ─────────────────────────────────────────────────┐
│                                                                   │
│  📧 Confirmation email sent to mike@luckysgrill.com              │
│  📱 SMS confirmation sent to (813) 555-0142                      │
│                                                                   │
│  📦 Shipment 1:                                                   │
│     • Ships tomorrow (Apr 17)                                     │
│     • You'll receive a shipping notification by email/SMS         │
│     • Delivery on your Tuesday AM route window                    │
│                                                                   │
│  📦 Shipment 2 (Backorder):                                      │
│     • We'll email you when stock arrives and your order ships     │
│     • You'll only be charged when it ships                        │
│     • If ETAs change, we'll notify you                            │
│     • Cancel anytime before shipment from Order History           │
│                                                                   │
│  🧾 Invoice:                                                      │
│     • Shipment 1 invoice added to your Net 30 account            │
│     • Due: May 16, 2026                                           │
│     • Shipment 2 invoiced separately on ship                      │
│                                                                   │
│  [View Order History →]  [Continue Shopping →]                    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

### Second Version: All In Stock (No Split)

Show a simpler confirmation with a single shipment — no backorder sections, no split timeline. Just:
- Success banner
- Single shipment timeline (Placed → Ships → Delivered)
- One shipment detail table
- Simpler "What to Expect" with just one ship date
