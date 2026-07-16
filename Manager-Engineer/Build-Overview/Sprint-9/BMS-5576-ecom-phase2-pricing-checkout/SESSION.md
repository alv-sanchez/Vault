# 📦 Session Kickoff — Ecom — Phase 2: Pricing/Promo Completion & Checkout (BMS-5576)

> Paste this whole file into a fresh Claude Code session as the first message,
> or tell the session: "Read this file first." It is the context seed.
> Last updated: 2026-07-14.

**Sprint:** Sprint 9 (2026-07-13 → 2026-07-20) — active. Re-stamp on next pickup.

## Scope of THIS session
BMS-5576 — Ecom — Phase 2: Pricing/Promo Completion & Checkout. Do not touch other tickets/streams.

## Where the work lives
- **Branch:** `feat/ecom-phase2-pricing-checkout-bms-5576` (21 commits ahead of main; cut from main + merged the closed-PR-#293 / BMS-4053 branch forward).
- **Dev org:** `ohfy-5576` → currently maps to scratch `canal-lagoon-5885` (the first claim `ocean-coffee-9584` was released + reclaimed).
- **Repo:** OHFY-Split · packages touched: **OHFY-Data-Model** (Location field, Storefront_Banner__c), **OHFY-OMS** (S_PriceResolver merge, DraftInvoiceController gate), **OHFY-eCommerce** (CartController, StorefrontBannerController, DTOs), **OHFY-eCommerce-UI** (Ecom_UI_Wrappers, ecomReviewSummary/ecomCartPage/ecomProductPage, segmentedBanner). Read each package's `CLAUDE.md` for the DoD first.
- **Docs (this folder):** `overview.md`, `overview.html`, `front-line-pricing.md` (pricing precedence tables).
- **Jira:** https://ohanafy.atlassian.net/browse/BMS-5576

## What it is (one line)
Phase 2 of the Gulf retailer storefront: server-resolved promo/volume pricing on cart+PDP, real checkout (warehouse-jurisdiction tax + draft-Invoice order + minimum-order gate), and segmented promotional banners.

## What's built (all committed, review-clean, green on the org)
- **BMS-4052** checkout: `CartController.getCheckoutSummary` → global `CheckoutSummaryDTO`; new `Location__c.Minimum_Order_Value__c`; min-order gate in `DraftInvoiceController.confirmDrafts` (single + split, ecom-scoped via `Invoice__c.E_Commerce__c`, surfaced as `AuraHandledException`); `ecomReviewSummary` real tax + total-includes-tax + gate. Tests green. Commits `044e1885b`,`c8d85b3a1`.
- **BMS-4051** cart/PDP reactive pricing via `resolveCartPricing` (finalCasePrice, Volume/Promo labels, request-seq guard, base-price-persist). Jest 9/9. Commits `5a2a09cb7`,`eadf9283a`.
- **BMS-5321** `Storefront_Banner__c` + `StorefrontBannerController.getSegmentedBanner` + `segmentedBanner` LWC. Apex 11/11 (97%), Jest 5/5. Commits `7f2f6f9c2`,`9caec73bb`.
- **BMS-4053** merged forward (base); product card shipped. Rule-8 Fieldset-config flaw deferred + logged on the ticket (comment 58172).
- **BMS-3932** in **open PR #388** (approval model, plan-of-record) — review + merge off this branch.
- **BMS-3926** disregarded (login already merged, PR #458).
- Pricing precedence documented in `front-line-pricing.md` (FLP waterfall + promo "best-for-customer").

## State / caveats (honest)
- Code is **done + review-clean + test-green**; **not yet PR'd/merged**.
- Live storefront (`…canal-lagoon-5885…my.site.com/vforcesite`, retailer `ecomtest_00drt00000t5buf@example.com` / `Ecomtest1!` → Customer Account 0): FLP pricing + checkout tax render live; **demo Post-off + tiered QD promos seeded Active this session** (Wave Splitter 1/6 $69→$59; Boats Float 1/2 BBL QD 10+→−$3/50+→−$6).
- **Not live-demoable on this pool clone:** the **min-order gate** — `Location__c.Minimum_Order_Value__c` is absent from the runtime global-describe (in-namespace Apex/tests see it fine → feature works, just can't set a value from outside the namespace via CLI/anon-apex); and the **segmented banner** (built, not yet placed on a login/home FlexiPage).
- Promo activation workaround: insert `Upcoming` (Start = today) then `S_Promotion_Maintenance.run()` — direct `Active` insert is blocked by the BMS-5206 lifecycle guard. `seed-promo-demo.apex` / `link-test-user-accounts.apex` fail as-is (stale vs current guards/dup-rule).

## Open questions / blockers (→ PO / infra)
- **PO (@Elliot Flores):** BMS-5321 open items — "retailer group" = promotion group (chosen); `Storefront_Banner__c` custom object (chosen); login=global/home=segmented (chosen); seasonality = date windows (chosen). BMS-4052 suggestion-panel deferred; BMS-3932 PR-#388 disposition = adopt.
- **OHFY-CICD (infra):** (a) `setup-site.sh` publishes but doesn't **activate** the Network (manual Setup activation needed); (b) source-deployed new fields on managed objects missing from runtime global-describe on pool clones; (c) stale seed scripts.

## Definition of Done (from package CLAUDE.md + ticket AC)
Per touched package: no raw SOQL/DML (QueryService/DmlService), no explicit USER_MODE, SYSTEM_MODE only with rule citation, Logger in every catch, global DTOs cross-package (ADR-0007), no hardcoded `ohfy__` in Apex, released-signature/field freeze (rule 4/8), Apex ≥90% on touched files + Jest, `/code-review` findings fixed. Remaining to reach ticket-Done: PRs (per-domain split), `/playwright-tests`, `/document`, live smoke, CI green.

## Next actions
1. Per-domain split → per-package PRs (Data-Model → OMS → eCommerce → eCommerce-UI).
2. `/code-review` PR #388 (BMS-3932) + merge.
3. `/playwright-tests` + `/document`; wire `segmentedBanner` onto login/home FlexiPages.
4. Escalate the 3 infra items to OHFY-CICD.
