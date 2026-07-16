---
title: Front-Line Pricing + Promotion Precedence (how the storefront price is chosen)
epic: BMS-5576
domain: e-commerce-ordering
org: ohfy-5576
updated: 2026-07-14
tags: [manager-engineer, pricing, reference]
---

# Front-Line Pricing + Promotion Precedence

How a retailer's **"Your Price"** on the storefront is derived. One cart-aware call — `S_PriceResolver.resolve()` (OHFY-OMS) — computes every line: it resolves the **front-line price (FLP) base** via `S_FrontLinePricing.resolve()`, then layers the **single winning promotion**. Grounded in `S_FrontLinePricing.cls` (ADR-0009) and `S_PriceResolver.cls` (ADR-0010).

```
Your Price (finalCasePrice)  =  FLP base  −  winning-promotion discount
                                  │             │
                    most-specific FLP row   deepest per-case discount among
                    (waterfall below)       qualifying promos (best-for-customer)
```

---

## 1) FLP base — resolution waterfall (most specific wins)

`S_FrontLinePricing` scans the account's `Front_Line_Price__c` rows and picks the **single most specific** match by Specificity Score. First match wins; falls through to the Item's default, else "Call for pricing".

| # | Resolution path (`flpResolutionPath`) | Specificity | Matches on | Beats… |
|---|---|---|---|---|
| 0 | **`ACCOUNT_ITEM`** | 4 (highest) | this **Account** + this **Item** | everything below |
| 1 | **`ITEM`** | 3 | this **Item** (any account) | type/line/default |
| 2 | **`ITEM_TYPE_PKG`** | 2 | **Item Type** + **Package** | line/default |
| 3 | **`ITEM_LINE_PKG`** | 1 | **Item Line** + **Package** | default only |
| 4 | **`ITEM_DEFAULT`** | — | `Item__c.Default_Case_Price__c` (unit price null) | — (fallback) |
| 5 | **`NONE`** | — | no row + no default | → **"Call for pricing"**, Add-to-Cart suppressed |

> Neutral on misses (ADR-0009 §17.8): `S_FrontLinePricing` returns `NONE` with null prices — it never throws/logs; each consumer decides what `NONE` means (ecom → "Call for pricing").

### Demo data on `ohfy-5576` — why the storefront shows what it shows
Seeded by `orgScripts/e-commerce/seed-flp-demo.apex` for *Customer Account 0*:

| Product (storefront) | FLP row that wins | Path | Your Price |
|---|---|---|---|
| Wave Splitter **1/2 BBL** | Beverage + 1/2 BBL Keg = $160 | `ITEM_LINE_PKG` | **$160** |
| Wave Splitter **1/4 BBL** | *(no FLP row)* → Item default | `ITEM_DEFAULT` | **$80** |
| Wave Splitter **1/6 BBL** | Wave Splitter 1/6 BBL = $69 | `ITEM` (beats the $60 line row) | **$69** |
| Boats Float 1/6 sixtel | Beverage + 1/6 BBL Keg = $60 | `ITEM_LINE_PKG` | $60 |
| Can cases (Beverage) | Beverage + Can Case = $22 | `ITEM_LINE_PKG` | $22 |

The 1/6 BBL is the teaching case: an `ITEM` row ($69) **out-ranks** the `ITEM_LINE_PKG` row ($60) because Specificity 3 > 1 — most-specific wins even though it's the higher price. FLP is about *which contract applies*, not *which is cheapest*.

---

## 2) Promotion layer — "best for the customer" (one winner per line)

After the FLP base, `S_PriceResolver` selects **at most one** promotion per line via this precedence (v1 — no cross-promotion compounding, ADR-0010 §2.3):

| Step | Rule | Effect |
|---|---|---|
| 1. **Scope match** | promo's `Item_Scope_Level__c` matches the line: `ITEM` / `ITEM_TYPE` / `ITEM_LINE` / `SUPPLIER` / channel / chain / warehouse | eligible set for the line |
| 2. **Date window** | `Status__c = Active` **and** today ∈ [`Start_Date__c`, `End_Date__c`] | expired/draft/upcoming excluded |
| 3. **QD tier select** | for a **QD** promo, pick the **highest tier** whose `Min_Quantity__c ≤ cart-context qty** (summed across in-scope lines) | one tier per QD |
| 4. **Priority winnow** | if any eligible promo has a non-null `Priority__c`, **drop everything below the max** priority | marketing override |
| 5. **Best-for-customer** | among survivors, the **deepest per-case discount wins** | one winner/line |
| — tiebreak | equal discount → highest `Promotion Id` (determinism) | — |

`finalCasePrice = FLP base − winning discount` (no floor/clamp in v1). The winner's `promotionId` (+ `promotionTierId` for QD) rides back on the `LineResult` and is persisted on the `Invoice_Item__c` as the as-committed pricing snapshot (BMS-3874).

**Label shown (BMS-4051):** `promotionTierId` set → **"Volume Price"**; `promotionId` set without a tier → **"Promo Price"**; neither → plain FLP price.

### Demo promos on `ohfy-5576` (seeded Active this session)
Inserted `Upcoming` (Start = today) then activated via `S_Promotion_Maintenance.run()` — the sanctioned path (direct `Active` insert is blocked by the BMS-5206 lifecycle guard).

| Promo | Type | Scope | Discount | Trigger | Result |
|---|---|---|---|---|---|
| Demo Post-off — Wave Splitter 1/6 BBL | Post-off | `ITEM` | −$10 flat | qty ≥ 1 | $69 → **$59** ("Promo Price") |
| Demo Volume Deal — Boats Float 1/2 BBL | QD | `ITEM` | tiered | qty ≥ 10 → −$3/case; ≥ 50 → −$6/case | $170 → **$167** (10+) / **$164** (50+) ("Volume Price") |

**Worked "best-for-customer" example** — if a hypothetical line had *both* a −$10 Post-off and a QD tier worth −$6 at the current qty, step 5 picks the **−$10** (deeper discount) → that's the single winner; the QD is dropped (no stacking in v1).

---

## 3) End-to-end: how it composes into the checkout total (BMS-4052)

```
per line:   FLP base (§1)  →  − winning promo (§2)  =  finalCasePrice  ×  qty  =  line total
cart:       Σ line totals  =  Subtotal
tax:        Subtotal × rate,  rate = Tax_Authority__c.Tax_Rate__c matched on the
            fulfillment Location__c.Location_State__c  (0 if Account.Is_Tax_Exempt__c)   → "FL Sales Tax"
total:      Subtotal + Tax              (BMS-4052 fix: total now INCLUDES tax)
gate:       block Place Order if Subtotal < fulfillment Location.Minimum_Order_Value__c  (ecom orders only)
```

- **Pricing entry point:** `Ecom_UI_Wrappers.resolveCartPricing(accountId, fulfillmentLocationId, quantitiesByItem)` → `S_PriceResolver.resolve()`. Cart page, PDP, and the product card all call it (consistent price across surfaces).
- **Checkout summary:** `Ecom_UI_Wrappers.getCheckoutSummary(customerId)` → `CheckoutSummaryDTO { taxRate, jurisdictionLabel, isTaxExempt, minimumOrderValue, hasError }`.
- **Order creation:** `DraftInvoiceController.confirmDrafts` finalizes the draft `Invoice__c`; the min-order gate runs on both single and split paths, ecom-scoped via `Invoice__c.E_Commerce__c`.

> Reference classes: `OHFY-OMS/.../services/frontLinePricing/S_FrontLinePricing.cls`, `OHFY-OMS/.../services/priceResolver/S_PriceResolver.cls`, `OHFY-eCommerce/.../controllers/legacy/CartController.cls`, `OHFY-eCommerce-UI/.../classes/Ecom_UI_Wrappers.cls`.
