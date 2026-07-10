---
tags: [atlas, moc]
---
# 🗺️ Product Atlas — where your work lives
> Every product **area** (OHFY-Split package) ↔ the **tickets/epics** that hit it. The connective tissue of your build — use it to context-switch: pick an area, see everything you've touched there.

## Coverage
**8/12** areas have logged work. Untouched: [[OHFY-PLTFM-UI]], [[OHFY-eCommerce-UI]], [[OHFY-REX]], [[OHFY-REX-UI]]

## Areas
| Area | What it is | Tickets |
|------|------------|---------|
| [[OHFY-Data-Model]] | objects, fields, schema (Tier-0, everything sits on it) | 3 |
| [[OHFY-PLTFM]] | inventory/replenishment, safety stock, thresholds | — |
| [[OHFY-PLTFM-UI]] | inventory config screens | — |
| [[OHFY-OMS]] | orders, delivery, AR / short-pay | 2 |
| [[OHFY-OMS-UI]] | driver & sales-rep screens | 2 |
| [[OHFY-WMS]] | picking, shift-end, breakage, capacity | 1 |
| [[OHFY-WMS-UI]] | supervisor & picker screens | — |
| [[OHFY-eCommerce]] | storefront, cart, notifications | 1 |
| [[OHFY-eCommerce-UI]] | storefront screens | — |
| [[OHFY-REX]] | routing / execution engine | — |
| [[OHFY-REX-UI]] | REX UI | — |
| [[OHFY-Utilities]] | shared services & helpers | — |

## Area → Epic map
```mermaid
graph LR
```

## How to use this (context-switching)
1. **Jumping into an area?** Open its `[[area]]` note — every ticket you've touched there, with status + org + PR.
2. **Graph View** (`tag:#area`) → the visual web. Clusters = where your work concentrates.
3. **[[atlas]]** Base → group/filter all notes by area.
4. Re-weave anytime: `/synapse` (or "connect my work").