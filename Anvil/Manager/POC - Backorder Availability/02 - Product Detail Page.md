---
title: "Product Detail Page — Lovable Prompt"
page: /product/:id
covers: Availability messaging, backorder ETA, allocation, substitutes
---

# Product Detail Page — `/product/:id`

## Lovable Prompt

Build a product detail page (PDP) for a B2B beverage distributor portal. Create **4 separate versions** of this page showing different availability states — use tabs or a dropdown at the top of the page labeled "Demo State Switcher" so the viewer can toggle between them.

### Layout (All Versions)

- **Breadcrumb**: Shop > Spirits > Gulf Premium Vodka 750ml
- **Left column** (50%): Product image gallery (main image + 3 thumbnails)
- **Right column** (50%): Product info, pricing, availability, add-to-cart
- **Below fold**: Tabs — "Details" | "Pack Info" | "Sales Materials"

### Right Column Structure

```
Brand: Gulf Premium Spirits
Gulf Premium Vodka 750ml
SKU: GPV-750-12  |  UOM: 12-pack  |  ABV: 40%

[AVAILABILITY SECTION — varies by state]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRICING
Your Price: $42.99/case
Unit Price: $3.58/bottle
MSRP: $49.99  (You save: $7.00)

Volume Pricing:
  1-4 cases:   $42.99/case
  5-9 cases:   $40.99/case  ← save 5%
  10+ cases:   $38.99/case  ← save 9%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Quantity: [- ] 1 [ +]
[Add to Cart]  or  [Backorder]

🏷️ Active Promotion: Buy 10+ cases of any Gulf spirit, get 12% off
   Your progress: 6 of 10 cases (4 more to unlock)
   [View Promotion →]
```

---

### Version A — In Stock

**Availability section:**
```
┌─────────────────────────────────────┐
│ 🟢  IN STOCK                        │
│ Available at: Milton FL Warehouse    │
│ 48 cases available                   │
│ Ships same day if ordered by 2pm ET  │
└─────────────────────────────────────┘
```

Button: `[Add to Cart]` — green/primary

---

### Version B — Low Stock

**Availability section:**
```
┌─────────────────────────────────────┐
│ 🟡  LOW STOCK — Only 3 cases left   │
│ Available at: Milton FL Warehouse    │
│                                      │
│ ⚠️ Ordering more than 3?             │
│ Additional units will be backordered │
│ (Est. restock: May 2, 2026)         │
└─────────────────────────────────────┘
```

Button: `[Add to Cart]` — amber/primary
If quantity > 3, button changes to `[Add Mixed — 3 now + X backordered]`

---

### Version C — Backordered

**Availability section:**
```
┌─────────────────────────────────────────────┐
│ 🔵  AVAILABLE FOR BACKORDER                  │
│ Currently out of stock at Milton FL          │
│ Estimated arrival: April 28, 2026            │
│                                              │
│ ℹ️ Your order will ship when stock arrives.   │
│    You will NOT be charged until shipment.    │
│                                              │
│ 📦 Also check: Montgomery AL has 12 in stock │
│    [Switch to Montgomery AL →]               │
└─────────────────────────────────────────────┘
```

Button: `[Backorder — Ships ~Apr 28]` — blue/outline style
Cross-warehouse suggestion is a key B2B feature.

---

### Version D — Out of Stock (No Backorder)

**Availability section:**
```
┌──────────────────────────────────────────────┐
│ 🔴  OUT OF STOCK                              │
│ Not available at Milton FL or Montgomery AL   │
│ No estimated restock date                     │
│                                               │
│ [🔔 Notify me when available]                 │
│                                               │
│ 💡 Similar products in stock:                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│ │Gulf Vodka│ │Bay White │ │Coastal   │      │
│ │1L  $51.99│ │Rum $44.99│ │Gin $39.99│      │
│ │🟢 In Stk │ │🟢 In Stk │ │🟡 Low Stk│      │
│ └──────────┘ └──────────┘ └──────────┘      │
└──────────────────────────────────────────────┘
```

Button: disabled `[Out of Stock]`
Substitute carousel shows 3 similar products that ARE available. Each mini-card is clickable.

---

### Version E — Backordered with Allocation (B2B-Specific)

**Availability section:**
```
┌──────────────────────────────────────────────┐
│ 🔵  BACKORDERED — You Have Allocation         │
│                                               │
│ Your account allocation: 10 cases             │
│ Already ordered: 6 cases                      │
│ Remaining allocation: 4 cases                 │
│                                               │
│ Estimated arrival: April 28, 2026             │
│ Priority shipping for allocated accounts      │
│                                               │
│ ⚠️ Orders beyond your allocation (4 cases)    │
│    are subject to availability at shipment.   │
└──────────────────────────────────────────────┘
```

This is the B2B-native pattern — distributors reserve inventory for their retail accounts. Show the retailer how much of their allocation remains.

---

### Below-Fold Tabs

**Details tab:**
- Origin, storage instructions, best by date, tasting notes
- Product description paragraph

**Pack Info tab:**
- Units per case, case dimensions, case weight
- Pallet configuration (cases per layer, layers per pallet)
- UPC / barcode

**Sales Materials tab:**
- Downloadable shelf talker PDF
- Point-of-sale image assets
- Brand story one-pager
