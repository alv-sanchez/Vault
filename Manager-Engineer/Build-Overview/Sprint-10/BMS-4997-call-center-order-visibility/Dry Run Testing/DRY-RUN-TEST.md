---
kind: dry-run-test
topic: BMS-4997 Call Center Order Visibility — manual redundancy validation
purpose: Prove (or disprove) that the SHIPPED storefront fulfills the epic ACs and that ecomOrderVisibility is redundant
status: ready to run — awaiting Alvaro's manual walkthrough
org: ccov-4997 (00Ddh00000ADho9EAD, namespaced ohfy, expires 2026-08-19)
date: 2026-07-22
---

# Dry-run test — is `ecomOrderVisibility` redundant?

> **Goal of this run (your words):** manually walk the built storefront and validate that
> (1) the shipped pages already fulfill the ACs BMS-4997 needs, and therefore
> (2) the new `ecomOrderVisibility` LWC is redundant.
>
> You are the judge. For each ask below, look at the **shipped surface**, decide
> `SHIPPED FULFILLS ✅ / PARTIAL 🟡 / GAP ❌`, and note anything the new LWC adds that shipped does not.

## Login

**Site:** `https://canal-sagittarius-3676-dev-ed.scratch.my.site.com/vforcesite`
**Community test user:** `ecomtest_00ddh00000adho9@example.com` / `Ecomtest1!`
**Seeded account:** *Customer Account 0* (`001dh00000shsR6AAI`) — 4 orders + 8 lines seeded; pricing/inventory/routes pre-existed. Active promotions **not** seeded (promotions panel will show graceful-empty).

> Tip: the order-history page has **both** LWCs stacked on it — the shipped `ecomOrderHistory`
> and the new `ecomOrderVisibility`. That single page is your best side-by-side for the redundancy call.

---

## The comparison — ask → shipped surface → verdict

| # | Epic ask (3858/3922) | Shipped surface (route) | New LWC panel | Your verdict |
| - | --- | --- | --- | --- |
| 1 | **Order history** — recent orders, status, totals, dates | `ecomOrderHistory` on **Order History** route (search/status/timeframe filters + pagination) | `ecomOrderVisibility` order-history panel (read-only, no reorder) | ☐ ✅ ☐ 🟡 ☐ ❌ |
| 2 | **Active promotions** with account/warehouse scoping | `ecomPromotions` + `itemPromotionsModal` on **Promotions** route | promotions panel (display-only) | ☐ ✅ ☐ 🟡 ☐ ❌ |
| 3 | **Account-specific pricing** (154+ code resolution) | product cards on **Product Page** / **Cart** (strikethrough + resolved price via `resolveCartPricing`) | pricing-**waterfall** panel (list→code→promo→net rail) | ☐ ✅ ☐ 🟡 ☐ ❌ |
| 4 | **Account context / credit / multi-entity** | `ecomProfilePage` + `ecomAccountSwitcher` + credit view (BMS-3930) on **Profile** route | account-context header | ☐ ✅ ☐ 🟡 ☐ ❌ |
| 5 | **Reorder** from history | `reorderModal` (shipped) | *(intentionally omitted — read-only)* | ☐ ✅ ☐ 🟡 ☐ ❌ |
| 6 | **Delivery / cutoff context** | *(none shipped as a banner)* | cutoff banner (`DeliveryCutoffController`) | ☐ ✅ ☐ 🟡 ☐ ❌ |
| 7 | **Inventory availability** | *(none shipped on storefront)* | inventory placeholder panel | ☐ ✅ ☐ 🟡 ☐ ❌ |
| 8 | **Supervisor multi-warehouse aggregate** | native report on `ohfy__Ecom_Order_Visibility` report type | *(not a storefront panel)* | ☐ ✅ ☐ 🟡 ☐ ❌ |
| 9 | **Multi-entity isolation** (see only own account) | `Invoice__c` master-detail → Account (ControlledByParent sharing); switcher server-derived | inherits same scoping | ☐ ✅ ☐ 🟡 ☐ ❌ |

---

## Step-by-step

### A. Order history (asks 1, 9)
1. Log in as the community user → open **Order History** from the nav.
2. On the **shipped** `ecomOrderHistory`: confirm the 4 seeded orders show with number/date/status/total, and that filters + pagination work.
3. Scroll to the **new** `ecomOrderVisibility` order-history panel on the same page. Note: does it show anything `ecomOrderHistory` doesn't? (Expected: no — same data, fewer affordances.)
4. **Isolation check:** confirm only *Customer Account 0*'s orders appear (no other accounts' invoices).
5. Verdict → rows 1 & 9.

### B. Promotions (ask 2)
1. Open the **Promotions** route (`ecomPromotions`). Confirm the shipped promotions experience renders (will be empty on this seed — no active promos seeded).
2. Compare against the new LWC's promotions panel (also empty → graceful-empty state).
3. Verdict → row 2. *(Note: to see populated promos you'd need to seed an active promotion group — the demo seed hit an inactive-group validation.)*

### C. Pricing (ask 3) — the key delta
1. Open **Product Page** / add an item and open **Cart**. Confirm shipped cards show the resolved account price (strikethrough + net).
2. Look at the new **pricing-waterfall** panel: does the list→code→promo→net breakdown show something the shipped card does **not**? This is the one genuinely net-new visualization (ASSUMPTIONS A4 / research [S4]).
3. Verdict → row 3. **This is the row most likely to be 🟡/❌ for shipped** — decide if the waterfall is worth keeping.

### D. Account context & credit (ask 4)
1. Open **Profile** route → confirm `ecomProfilePage`, the account switcher, and the credit view render for the account.
2. Verdict → row 4.

### E. Delivery/cutoff + inventory (asks 6, 7)
1. These have **no shipped storefront equivalent** — only the new LWC's cutoff banner and inventory placeholder.
2. Decide: are these in-scope enough to keep as net-new, or defer? (`DeliveryCutoffController` is rule-clean and reusable regardless.)
3. Verdict → rows 6 & 7.

### F. Supervisor report (ask 8)
1. In the org (Salesforce, not the community): Reports → run **My Order History** on the `ohfy__Ecom_Order_Visibility` report type; group by fulfillment location.
2. Verdict → row 8.

---

## Decision this run feeds

After the walkthrough, the disposition is one of:
- **(a) Back out** `ecomOrderVisibility` — if rows 1–5 all come back `SHIPPED FULFILLS ✅`. Keep only genuinely-new pieces (`DeliveryCutoffController`, report type). Write the disposition comment on BMS-4997.
- **(b) Keep the new pieces** — if row 3 (pricing waterfall) and/or a consolidated single-view prove valuable; drop the redundant re-aggregation (rows 1, 2, 4).

## Findings log (fill in as you go)

| Row | Verdict | Notes / screenshot |
| --- | --- | --- |
| 1 |  |  |
| 2 |  |  |
| 3 |  |  |
| 4 |  |  |
| 5 |  |  |
| 6 |  |  |
| 7 |  |  |
| 8 |  |  |
| 9 |  |  |

**Overall call:** ☐ (a) back out  ☐ (b) keep new pieces  ☐ other → _______
