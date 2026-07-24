# 📦 Session Kickoff — Call Center Order Visibility (BMS-4997)

> Paste this whole file into a fresh Claude Code session as the first message,
> or tell the session: "Read this file first." It is the context seed.
> Last updated: 2026-07-22 (validated that the shipped storefront already covers most of the epic; surface was built+deployed to ccov-4997; DISPOSITION DECISION OPEN).

**Sprint:** Sprint 10, 2026-07-20 → active.

## 🛑 READ FIRST — the epic is mostly already built (2026-07-22 finding)
A code validation on `main` showed the **existing E-Commerce storefront already delivers the core BMS-4997 asks** for the logged-in retailer, as shipped pages/components:

| Ask (BMS-4997 / 3858 / 3922) | Already shipped |
| --- | --- |
| Account order history | `Order_History__c` route → `ecomOrderHistory` (`OrderHistoryController`) |
| Active promotions | `Promotions__c` route → `ecomPromotions` + `itemPromotionsModal` |
| Account-specific pricing | `Product_Page__c` / `Cart_Page__c` product cards + `resolveCartPricing` |
| Account context / credit / multi-account | `Profile_Page__c` → `ecomProfilePage`, `ecomAccountSwitcher`, credit view (BMS-3930 Done) |
| Reorder | `reorderModal` |

**Only 4 genuine deltas remain** (not yet shipped):
1. A **single consolidated view** (today these are separate routes, not one dashboard).
2. The **pricing-waterfall breakdown** (list→code→promo→net) — no such UI exists (research [S4]); genuinely net-new.
3. The **internal call-center *agent* audience** — if truly for agents, the storefront is external-retailer; that surface belongs in **OMS-UI**, not the community site.
4. The **supervisor multi-warehouse aggregate** (native report/dashboard).

### ⚠️ DISPOSITION DECISION — OPEN, ask Alvaro before building more
Alvaro was asked to choose and has **not answered yet**:
- **(a)** Write this up as the epic disposition (already-covered vs the 4 deltas) and **back out the redundant `ecomOrderVisibility` LWC**, or
- **(b)** Keep only the genuinely-new pieces (**pricing waterfall + consolidated view**).
Do NOT continue the full build until this is answered — most of what a naive build would produce already exists.

## Scope of THIS session
BMS-4997 — Call Center Order Visibility. Do not touch other epics/streams.

## Where the work lives
- **Epic:** https://ohanafy.atlassian.net/browse/BMS-4997 — polished on `main`, carries `polished` label. Full re-scope + 3 PO decisions in the epic comment (2026-07-20).
- **Stories:** BMS-3858 and BMS-3922 (both **Backlog**, un-groomed) — carry rich Gherkin ACs and stale June polish reviews (pre-pricing-engine). Corrections listed in `ASSUMPTIONS.md`.
- **Repo:** OHFY-Split · packages in play: `OHFY-eCommerce`, `OHFY-eCommerce-UI`, `OHFY-OMS`, `OHFY-Data-Model` · worktree `~/OHFY-Split-BMS-4997` on branch `feat/call-center-order-visibility-reporting-bms-4997`.
- **Docs (this folder):** `SESSION.md`, `ASSUMPTIONS.md` (best-guess answers to open questions, backed by the Fable research report), `VALIDATION.md`, `overview.md/.html`, `Dry Run Testing/`.
- **Dedicated org:** `ccov-4997` (`00Ddh00000ADho9EAD`, namespaced `ohfy`, expires 2026-08-19) — claimed from the pool, `main` deployed. **Held until this epic merges.** No new scratch, no generated password.

## What it is (one line)
A **read-only order-visibility surface** for the E-Commerce storefront — a retailer/agent sees their account's order history, active promotions, resolved pricing breakdown, inventory availability, and delivery/cutoff context in one place — **built on the already-shipped ecom + pricing platform, not a new ordering system.**

## History — why this isn't a rebuild
The data and services already ship on `main` (Ecom Phase 2 / BMS-5576 merged 2026-07-20; pricing engine BMS-5097 Done). Standing on (already shipped):
- `OrderHistoryController` (`@namespaceAccessible`) + `ecomOrderHistory` LWC — retailer order history on the storefront.
- `S_PriceResolver.resolve(CartResolutionRequest)` + `eligiblePromotionsByItem(...)` (`OHFY-OMS`) — pricing waterfall + promotion eligibility.
- `CheckoutSummaryDTO` (taxRate, jurisdictionLabel, minimumOrderValue) + `CartController` — tax/checkout context.
- `Promotion__c` / `Promotion_Tier__c` / `Promotion_Group__c` / `Account_Promotion_Group__c` (`OHFY-Data-Model`) — the promotions model that the June polish reviews said "doesn't exist" (now it does).
- `Invoice__c` (order-of-record; master-detail to `Account`, so community-scoped by sharing) + `Invoice_Item__c`.
- The LWR Experience site `E_Commerce1` with an existing `Order_History__c` route + `segmentedBanner` embed precedent (BMS-5576).

## Re-scope decision (this epic)
The two stories as written include **order creation** (New Order / Apply-to-Order / reorder / promo auto-apply). This epic is scoped to **read-only visibility only** — that half is deferred to a later transactional story. Read-only is what makes it buildable now and safe on the community site (account-scoped by `Invoice__c` sharing).

## Child ledger (as of 2026-07-21)
| Ticket | Status | Work |
| --- | --- | --- |
| BMS-3858 | 🟡 Backlog (un-groomed) | agent/account context + promotions + pricing waterfall + supervisor filter + delivery/inventory — **read-only slice in scope; transactional ACs deferred** |
| BMS-3922 | 🟡 Backlog (un-groomed) | account dashboard + promotions + reorder + multi-entity isolation + graceful-empty — **read-only slice in scope; order-creation ACs deferred** |

## Open decisions parked with PO (@Elliot Flores, on the epic)
- **Scope:** confirm read-only visibility (drop order creation). *(building read-only under best-guess assumption)*
- **Surface:** internal OMS-UI vs external community storefront — **user chose the external E-Commerce site**; built account-scoped, row-level safe.
- **Supervisor aggregate view:** native report/dashboard vs custom panel.

## What was actually built + deployed (2026-07-21/22) — NOTE: largely redundant with shipped storefront
All on branch `feat/call-center-order-visibility-reporting-bms-4997` (worktree `~/OHFY-Split-BMS-4997`), **deployed to `ccov-4997`, not committed/pushed, no PR:**
- **`ecomOrderVisibility` LWC** (`OHFY-eCommerce-UI/.../lwc/`) — 5 read-only panels (order history, promotions, pricing-waterfall, inventory placeholder, cutoff banner), account-scoped via `userDataService`. Jest 4/4 pass incl. a read-only-guarantee test. **This duplicates existing storefront surfaces — pending the disposition decision above, it may be backed out.**
- **`DeliveryCutoffController` + `DeliveryCutoffDTO`** (`OHFY-eCommerce`) + **`Ecom_UI_Wrappers.getDeliveryCutoffInfo`** passthrough — rule-clean, deployed. (The genuinely-reusable new bit.)
- **`ohfy__Ecom_Order_Visibility` report type** + `My_Order_History` report (managed + scratch mirror) — deployed. Serves the internal supervisor-aggregate delta.
- **Embedded** `ohfy:ecomOrderVisibility` on the `Order_History__c` route's `content.json`; experience bundle deployed; community **republished**.
- **Seeded** on test account **Customer Account 0** (`001dh00000shsR6AAI`): 4 orders + 8 lines (`Dry Run Testing/seed-data.apex`). Routes/pricing/inventory already existed. Active promotions **not** seeded (demo seed hit an inactive-promotion-group validation) → promotions panel shows its graceful-empty state.
- **Community test user for dry-run:** `ecomtest_00ddh00000adho9@example.com` / `Ecomtest1!` · site `…canal-sagittarius-3676-dev-ed.scratch.my.site.com/vforcesite` → `/order-history`.

## What's NOT done
- **Visual dry-run** (log in as the community user, screenshot each panel) — not yet run; would go in `Dry Run Testing/DRY-RUN-TEST.md`.
- **`VALIDATION.md` + `overview.md/.html`** — not yet written (the sibling folders have them).
- **The disposition decision** (a vs b) — blocking further build.
- Nothing committed/pushed; no Jira status change; no PR.

## Next step for a new session
1. **Get Alvaro's disposition answer (a vs b) first.** Don't build more until then.
2. If **(a)**: write the epic-disposition comment on BMS-4997 (already-covered table + 4 deltas), back out `ecomOrderVisibility` from the branch + the `content.json` embed, keep only what's genuinely new if anything.
3. If **(b)**: keep the pricing-waterfall panel + a consolidated view; drop the redundant order-history/promotions re-aggregation; re-confirm audience (retailer storefront vs internal OMS-UI agent page).
4. Either way, the `DeliveryCutoffController` and report type are reusable; the org `ccov-4997` is live with the surface embedded for eyeballing.
