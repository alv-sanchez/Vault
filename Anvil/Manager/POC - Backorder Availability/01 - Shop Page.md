---
title: "Shop Page — Lovable Prompt"
page: /shop
covers: Product grid, availability badges, filtering, warehouse selector
---

# Shop Page — `/shop`

## Lovable Prompt

Build a product browse/shop page for a B2B beverage distributor portal. This is the main catalog page.

### Layout

- **Top bar**: Warehouse selector dropdown (e.g., "Milton FL Warehouse", "Montgomery AL Warehouse") — changing this filters the entire catalog to show only products stocked at that warehouse.
- **Left sidebar** (desktop) / **Slide-out drawer** (mobile): Filter panel
- **Main area**: Product card grid (3 columns desktop, 2 tablet, 1 mobile)
- **Top of grid**: Result count, sort dropdown, view toggle (grid/list), items-per-page selector

### Filter Panel

Filters with checkboxes and counts:
- **Brand** (multi-select with search): "Gulf Premium Spirits (24)", "Coastal Craft Beer (18)", "Sunshine Wines (15)", "Bay Rum Co (8)"
- **Category**: Spirits, Beer, Wine, Mixers
- **Pack Size**: 6-pack, 12-pack, 24-pack, Case
- **Availability**: In Stock, Low Stock, Backordered, Out of Stock (each with count)
- **Price Range**: Under $25, $25-50, $50-100, Over $100
- **On Promotion** toggle

Active filters show as dismissable chips above the grid.

### Product Cards — Show ALL 4 States

Create **12+ product cards** showing every availability state:

**Card 1 — In Stock (standard)**
```
[Product Image]
Gulf Premium Vodka 750ml
Brand: Gulf Premium Spirits | 12-pack
━━━━━━━━━━━━━━━━━━━━━━━━
🟢 In Stock
$42.99/case  ($3.58/unit)
[- ] 1 [ +]  [Add to Cart]
```

**Card 2 — In Stock with Promotion**
```
[Product Image]
Coastal IPA 12oz
Brand: Coastal Craft Beer | 24-pack
━━━━━━━━━━━━━━━━━━━━━━━━
🟢 In Stock
̶$̶3̶6̶.̶9̶9̶  $31.99/case  SAVE $5.00
🏷️ Buy 3+ cases, save 15%
[- ] 1 [ +]  [Add to Cart]
```

**Card 3 — Low Stock**
```
[Product Image]
Sunshine Chardonnay 2024
Brand: Sunshine Wines | 6-pack
━━━━━━━━━━━━━━━━━━━━━━━━
🟡 Low Stock — Only 4 cases left
$28.50/case  ($4.75/unit)
[- ] 1 [ +]  [Add to Cart]
```

**Card 4 — Backordered (KEY NEW STATE)**
```
[Product Image]
Bay Aged Rum 750ml
Brand: Bay Rum Co | 12-pack
━━━━━━━━━━━━━━━━━━━━━━━━
🔵 Backordered — Ships ~Apr 28
$52.99/case  ($4.42/unit)
[- ] 1 [ +]  [Backorder]
```
The button says "Backorder" not "Add to Cart". Badge is blue/amber.

**Card 5 — Out of Stock**
```
[Product Image]
Gulf Reserve Bourbon 750ml
Brand: Gulf Premium Spirits | 6-pack
━━━━━━━━━━━━━━━━━━━━━━━━
🔴 Out of Stock
$89.99/case
[Notify When Available]
```
Card is slightly muted/opacity. Button is outline style, not primary. Opens email notification signup.

**Card 6 — Backordered with Substitute Suggestion**
```
[Product Image]
Coastal Pale Ale 12oz
Brand: Coastal Craft Beer | 24-pack
━━━━━━━━━━━━━━━━━━━━━━━━
🔵 Backordered — Ships ~May 5
$33.99/case
💡 Similar in stock: Coastal Session Ale →
[- ] 1 [ +]  [Backorder]
```

**Card 7 — In Stock, Already in Cart**
```
[Product Image]
Gulf Silver Tequila 750ml
Brand: Gulf Premium Spirits | 12-pack
━━━━━━━━━━━━━━━━━━━━━━━━
🟢 In Stock
$38.99/case  ($3.25/unit)
[- ] 3 [ +]  ✓ In Cart
```
Button is green/filled to show it's already in cart. Quantity shows current cart amount.

**Card 8 — Low Stock, Quantity Exceeds Available**
```
[Product Image]
Sunshine Rosé 2024
Brand: Sunshine Wines | 6-pack
━━━━━━━━━━━━━━━━━━━━━━━━
🟡 Low Stock — Only 2 cases left
$24.99/case
⚠️ You want 5 — only 2 available now, 3 will be backordered
[- ] 5 [ +]  [Add Mixed]
```

Create at least 4 more cards filling out the grid with varying brands, pack sizes, and prices.

### Interactions
- Clicking a card navigates to `/product/:id`
- Quantity selector is inline on the card
- "Add to Cart" / "Backorder" adds with a subtle toast notification
- Warehouse selector change re-filters the entire grid with a loading skeleton
- "Notify When Available" opens a small modal to confirm email notification

### Empty State
If a filter combination returns no results:
```
No products match your filters.
Try adjusting your filters or switching warehouses.
[Clear Filters]  [Switch Warehouse]
```
