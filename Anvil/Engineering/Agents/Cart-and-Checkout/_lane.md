# Cart & Checkout lane — `CART`

**Org alias**: `ecom-cart` · **Status**: org claimed (2026-06-12 — site ready, smoke 4/4 green; see _shared/orgs.md for creds)

Ticket order (hard phase chain — strictly sequential):
1. `CART-4050` BMS-4050 — Ph 1: Cart + Basic Pricing — DONE 2026-06-12: re-polished (residual scope, 2 pts, To Do→built), draft PR https://github.com/Ohanafy/OHFY-Split/pull/294. ⚠️ For 4051/4052: community add-to-cart WRITE path is broken on pool orgs (User sharing fix pending human approval — see _shared/blockers.md CART-4050); seed cart state via test-automation/support/ecom/draftCartSeed.ts until fixed.
2. `CART-4051` BMS-4051 — Ph 2: Volume Tiers + Promos — Needs Refinement (needs /polish)
3. `CART-4052` BMS-4052 — Ph 3: Checkout + Tax + Order — Needs Refinement (needs /polish)

Gate: a ticket builds only when status = To Do (post-polish). Needs Refinement → /polish → To Do.
