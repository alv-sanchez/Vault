---
title: Lovable Master Prompt — Backorder & Availability POC
created: 2026-04-16
purpose: Hand to Lovable to generate a multi-page B2B e-commerce POC
---

# Lovable Master Prompt

> Copy this into Lovable as the initial project prompt. Then use individual page prompts to add/refine each page.

---

## Prompt

Build a **B2B beverage distribution e-commerce portal** with React + Tailwind CSS. This is a wholesale portal where **retailers** (bars, restaurants, convenience stores) order from a **distributor** with multiple warehouses.

**Brand**: Clean, modern, dark navy (#0d1b2a) primary, white backgrounds, emerald green (#10b981) for in-stock/success, amber (#f59e0b) for warnings/backorder, red (#ef4444) for out-of-stock/errors. Use Inter or similar sans-serif font. Rounded corners (lg), subtle shadows.

**Key concept**: Every product has an **availability status** that is NOT just "in stock" or "out of stock." Products can be:
- **In Stock** — available now, ships immediately (green badge)
- **Low Stock** — limited quantity, shows remaining count (amber badge)
- **Backordered** — not in stock but can be ordered, shows estimated arrival date (amber/blue badge)
- **Out of Stock** — cannot be ordered at all (red badge, disabled add-to-cart)

This availability status must appear consistently on **every page** — shop grid, product detail, cart line items, checkout review, order confirmation, and order history.

**Pages to build** (each is a separate route):
1. `/shop` — Product grid with filters
2. `/product/:id` — Product detail page
3. `/cart` — Shopping cart
4. `/checkout` — Review & place order
5. `/order-placed` — Order confirmation
6. `/orders` — Order history
7. `/orders/:id` — Order detail with tracking
8. `/profile` — Account & notification preferences

Use **mock data** with a mix of in-stock, low-stock, backordered, and out-of-stock products so every state is visible. Include at least 12 products across 3-4 brands. The cart should have a mix of statuses to demonstrate the split-shipment UX.

Do NOT use a component library. Build with raw Tailwind. Make it responsive (desktop + tablet).
