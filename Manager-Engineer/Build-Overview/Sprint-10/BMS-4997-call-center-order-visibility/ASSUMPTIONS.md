---
kind: paper-trail
topic: BMS-4997 Call Center Order Visibility — read-only re-scope, best-guess build assumptions
status: deciphered-direction + best-guess assumptions — NOT a committed spec
author: agent, on behalf of Alvaro Sanchez
date: 2026-07-21
backed_by: two repo-grounded Fable research reports (2026-07-21) — surface/embed [S#], data-model [D#]
children_in_scope: ["BMS-3858", "BMS-3922"]
org: ccov-4997 (00Ddh00000ADho9EAD, namespaced ohfy)
---

# Paper trail — best-guess build assumptions, BMS-4997

> [!warning] SUPERSEDED IN PART — read `SESSION.md` "🛑 READ FIRST" first.
> A 2026-07-22 code validation found the **shipped E-Commerce storefront already delivers the core
> asks** (order history, promotions, pricing, account context — see the table in `SESSION.md`). This
> doc's *technical findings are still accurate*, but its framing as a **build** is superseded: most of
> what it specs already exists. Only 4 deltas are genuinely new (consolidated view, pricing-waterfall
> UI, internal-agent audience, supervisor aggregate). A **disposition decision (a vs b) is OPEN** — do
> not treat this as a build spec until that's answered. Use this doc for the grounded data-model / reuse
> facts (`[S#]`/`[D#]`), not as a green light to build.

> This logs **my best-guess answers** to every open question, and the **assumptions** behind each,
> for a **read-only** Call Center / retailer order-visibility surface on the E-Commerce storefront.
> Every answer is backed by two repo-grounded research passes this session: surface/reuse/embed
> (`[S#]`) and data-model/business-logic (`[D#]`). Where research **corrected** a guess or the
> ticket, that's called out. PO-/architecture-level calls are collected at the bottom.

## Decisions already recorded (from the 2026-07-20 polish comment on BMS-4997)
- **Re-scope to READ-ONLY visibility.** The stories' order-creation ACs (New Order / Apply-to-Order / reorder / promo auto-apply) are **deferred** to a later transactional story. This epic surfaces data only.
- **Placement = external E-Commerce community site** (user decision), account-scoped and row-safe.
- **June polish BLOCKERs are stale** — `Promotion__c` and the pricing waterfall now exist on `main`; legacy `Price_Record__c` is gone. Stories reference dead schema (`Order__c`, `Price_Record__c`) — corrections below.

---

## Architecture decision (the biggest one) — wrapper LWC, not an embedded native report

- **A0 — The storefront surface is a read-only wrapper LWC (`ohfy:ecomOrderVisibility`), not a native report.** `[S5 — CORRECTS "auto-place a report on the site"]` LWR Experience sites have **no** native report/analytics/dashboard component (zero `analytics`/`wave`/`report` nodes across all 19 `E_Commerce1` views; the Aura Report Chart is unsupported on LWR). Every storefront component is either a standard layout piece or an `ohfy:*` custom LWC. So order visibility is delivered as a wrapper LWC fed by existing account-scoped Apex, embedded on the existing `Order_History__c` route exactly as `segmentedBanner` was added in #560 `[S6][S7]`.
- **The report type + `My Order History` report still ship** — but for the **internal Salesforce report-builder** need (the BMS-3858 Scenario-4 supervisor multi-warehouse aggregate, exports), not the storefront. Report type deployed clean to `ccov-4997` (namespaced → `ohfy__Ecom_Order_Visibility`).

## ① Order-history panel
- **Q: build new or reuse?** → **Reuse.** `[S1]` `OrderHistoryController.getOrderHistory(customerId, limit)` queries `Invoice__c` + `Invoice_Items__r`, filtered `Customer__c = :customerId AND Status__c != 'Draft'`, ordered `Invoice_Date__c DESC` (`OrderHistoryController.cls:28-76`); `ecomOrderHistory` LWC already renders it with search/status/timeframe filters + pagination. The read-only panel reuses the controller via `Ecom_UI_Wrappers.getOrderHistory`; **strip the reorder/cart write affordances** for the read-only audience.
- **A1 — Fields shown** `[D1]`: `Invoice_Number__c`, `Invoice_Date__c`, `Status__c`, `Invoice_Total__c`/`Total_Due__c`, `Total_Cases__c`, `Total_Invoice_Items__c` (line count), `Delivery_Method__c`, `Route_Name__c`, `Delivery_Pickup_Date__c`, `Payment_Status__c`. All verified real fields.
- **A2 — Ecom filter:** `Invoice__c.E_Commerce__c` (Checkbox) flags storefront-originated orders `[D1]` — available if the panel should show only ecom orders vs all channels (assume **all channels** for a call-center view; make it a toggle).

## ② Active-promotions panel
- **Q: source of active promotions?** → **Reuse `eligiblePromotionsByItem`.** `[S3]` `userDataService.getPromotionsData()` → `Ecom_UI_Wrappers.getEligibleItemPromotions` → `S_PriceResolver.eligiblePromotionsByItem(accountId, fulfillmentLocationId, itemIds)` returns deduped `Promotion__c` (+ `Promotion_Tiers__r`), already account/warehouse/channel-scoped. `itemPromotionsModal` is the existing display precedent.
- **A3 — Eligibility rule** `[D6]`: active + within `Start_Date__c`/`End_Date__c` + account in a linked `Account_Promotion_Group__c` (and/or `Territory__c` match), minus `Promotion_Account_Exclusion__c`. Discount shape from `Discount_Type__c` + `Promotion_Tier__c` (`Min_Quantity__c`, `Discount_Amount__c`).
- Read-only: **display** promotions with name/window/discount/tier-progress; **no** "Apply to Order" button (deferred).

## ③ Pricing-waterfall breakdown
- **Q: does a waterfall UI exist?** → **No — data exists, visualization is net-new.** `[S4]` `S_PriceResolver.resolve()` returns `LineResult` per item with `casePrice` (FLP base), `promotionDiscountPerCase`, `promotionDiscountAmount`, `finalCasePrice`, `flpResolutionPath`, `promotionId`, `promotionTierId` (`LineResult_T.cls:5-46`), exposed via `Ecom_UI_Wrappers.resolveCartPricing`. Today it only stamps a strikethrough + label on cards — no list→base→discount→net rail.
- **A4 — Best guess:** the waterfall visualization is **the one genuinely net-new UI piece**. Render base (`casePrice`) → promo discount (`promotionDiscountPerCase`, labeled from the promo) → net (`finalCasePrice`), sourced from `LineResult`. "List price" is not a separate field — `casePrice` is the FLP-cascade base `[S4]`; the cascade path is `flpResolutionPath`.

## ④ Inventory-availability panel
- **A5 — Source** `[D5]`: `Inventory__c` keyed by `Item__c` + `Warehouse__c`/`Location__c`; show `Quantity_Available__c` / `Cases_Available__c` for the account's fulfillment location.
- **GAP `[D5]`:** there is **no explicit committed/ATP field** — `Quantity_Available__c` is the only availability signal. Best guess: it already nets locked stock (`Inventory_Lock__c` handles reservations). **Assume in/out-of-stock + a case count**, but flag for PO whether to expose raw counts to retailers at all. *(This panel is the lowest-confidence one — first agent didn't locate an inventory surface `[S: unverified]`; treat as best-effort.)*

## ⑤ Delivery / cutoff banner
- **A6 — Cutoff data exists** `[D4]`: `Route__c.Cutoff_Time__c` (Time), `Is_Cutoff_Enforced__c`, `Day_Of_Week__c`; `Delivery__c.Delivery_Date__c`; `Account_Route__c.Frequency__c`; per-order `Route_Cutoff_Override__c`. `userDataService` already carries `warehouseCutoffTime` + `fulfillmentLocation` `[S: best-guess reuse]`.
- **GAP `[D4]`:** **next-delivery date is derived, not stored** — compute from route `Day_Of_Week__c` + account `Frequency__c`, honoring overrides + `Is_Cutoff_Enforced__c`. Best guess: banner shows "Next delivery: {derived date} via {Route_Name__c}; cutoff {Cutoff_Time__c}." Confirm the derivation rule with the route team.

## ⑥ Account scoping / multi-entity isolation (the safety story)
- **A7 — Scoping is server-derived and safe** `[S2][D3]`. `customerId` is **never client-supplied**: `userDataService.initUserDetails` reads `User.Contact.AccountId`; `AccountSwitcherController.getRelatedAccounts()` resolves from `UserInfo.getUserId()` server-side ("never trusts a client-supplied contact or account id … authorization boundary", `AccountSwitcherController.cls:32-107`); switching is gated to that list. `Invoice__c` is master-detail to `Account` with `sharingModel`/`externalSharingModel` = `ControlledByParent`, so a retailer sees only their own account's invoices `[D3]`. Multi-entity isolation (FL vs AL) falls out of this automatically.

## ⑦ Tax / GL (BMS-3922 Scenario 5)
- **A8 — Tax is real, GL-by-entity is real** `[D7 — CORRECTS the June polish "no tax/GL" claim]`. Tax via `CheckoutSummaryDTO` (`taxRate`, `jurisdictionLabel`, `isTaxExempt`); `Tax_Authority__c` (`State_Code__c`, `Tax_Rate__c`). GL mapping via `GL_Mapping_Rule__c` (`Entity__c`, `General_Ledger__c`, `Priority__c`, effective dates) — resolves by entity, matching Scenario 5. **But GL is internal accounting** — best guess: **do not** surface GL on the retailer view; tax/jurisdiction display is optional. → PO call.

## ⑧ Supervisor multi-warehouse aggregate (BMS-3858 Scenario 4)
- **A9 — Native report/dashboard, not a custom panel.** Order counts + $ per warehouse, filter by channel/status = a standard summary report on the `Ecom_Order_Visibility` report type grouped by fulfillment location. Packaged report type upgrades centrally; a subscriber-customized copy drifts (ISV note). This is the internal half the report type serves.

## ⑨ Community permissions
- **A10 — `Invoice__c` is already community-readable** `[D8]`: the `Ohanafy Community User` profile (Customer Community **Plus**) grants `Invoice__c` read (and, notably, write). A read-only surface **must not rely on write**; field-level exposure of sensitive fields (rep/cost/margin) needs a pass. Best guess: gate the surface via a **dedicated read-only perm set**, not the profile's write grant. "Run Reports" on the community profile is **unverified** — needed only for the internal report half, not the LWC. → architecture call.

---

## Corrections applied vs the story text (facts the code disproves)
- `Order__c` / `Order_Line__c` → **`Invoice__c` / `Invoice_Item__c`** (no `Order__c` exists) `[D1]`.
- `Price_Record__c` → **`Front_Line_Price__c` + `S_PriceResolver`** (legacy object gone) `[S4]`.
- `Promotion__c` "may or may not exist" → **it exists** (`OHFY-Data-Model`) `[D6]`.
- "auto-place a **report** on the site" → **wrapper LWC**; LWR has no native report component `[S5]`.

## Decisions needed from PO / architecture (@Elliot Flores)
- **Scope:** confirm read-only (order-creation deferred). *(building read-only under this assumption.)*
- **Inventory:** expose raw available counts to retailers, or in/out-of-stock badge only? Semantics of `Quantity_Available__c` (does it net committed?) `[D5]`.
- **Tax/GL:** show tax/jurisdiction on the retailer view? GL is internal — confirm out of scope `[D7]`.
- **Next-delivery derivation:** confirm the route-day + frequency + override rule for the cutoff banner `[D4]`.
- **Permissions:** dedicated read-only perm set vs the community profile's current write grant; field-level visibility of sensitive Invoice fields `[D8]`.
- **Supervisor view:** native report/dashboard vs custom (recommend native) `[A9]`.
