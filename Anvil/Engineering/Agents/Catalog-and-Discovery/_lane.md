# Catalog & Discovery lane — `CAT`

**Org alias**: `ecom-catalog` · **Status**: org claimed — 3 tickets (3927 went MANUAL)

Ticket order (sequential — all rework `ecomShop`, concurrency would collide):
1. `CAT-4053` BMS-4053 — Product Card Ph 1 — PR OPEN https://github.com/Ohanafy/OHFY-Split/pull/293 (polished → To Do; card extracted as c-ecom-product-card + field-set data points; contract in _shared/contracts.md — 4054 MUST consume it; rebase watch vs BMS-3927)
2. `CAT-4054` BMS-4054 — Product Card Ph 2: Grid — Needs Refinement (needs /polish)
3. `CAT-3925` BMS-3925 — Catalog & Availability — Needs Refinement (needs /polish)

NOT in lane: `CAT-3927` BMS-3927 (search) — In Progress, Alvaro developing MANUALLY.
⚠️ Conflict watch: his search work touches ecomShop.checkSearchFilter + navigationMenu —
the same ecomShop this lane reworks. Rebase against his branch/PR before each ticket's
/ecom-done, and coordinate via _shared/contracts.md if the grid (4054) moves the card
markup his search results render.

Gate: a ticket builds only when status = To Do (post-polish). Needs Refinement → /polish → To Do.
