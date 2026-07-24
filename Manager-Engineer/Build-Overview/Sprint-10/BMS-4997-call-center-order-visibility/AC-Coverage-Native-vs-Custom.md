---
kind: ac-coverage-analysis
topic: BMS-4997 — which ACs are met by native/reports/existing LWC vs required custom build
date: 2026-07-23
verified_against: OHFY-Split branch feat/call-center-order-visibility-reporting-bms-4997 + ccov-4997
---

# BMS-4997 — Capability coverage: native vs. custom

The rule: **build custom only where the data is runtime-computed or runtime-filtered.**
Everything backed by stored records (order history, pricing, supervisor aggregate) stays
native / existing — building it would duplicate a first-class Salesforce surface.

## Covered by NATIVE / existing (deliberately NOT rebuilt)

| Capability (AC) | Delivered by | Native possible? | Argument — why native wins |
|---|---|---|---|
| Order history (3858-1, 3922-1/4) | Invoices related list + list views | Yes | `Invoice__c` is master-detail to Account and `enableReports=true`; the account's orders show natively as a related list, list views handle browse/filter. A custom history panel duplicates a native surface. |
| Supervisor multi-warehouse aggregate (3858-4) | Native Report/Dashboard on `Invoice__c` grouped by fulfillment location | Yes | Aggregation of stored records across accounts/warehouses = Reports & Dashboards' job. `enableReports=true` lets the customer build it; a packaged dashboard would freeze config (violates "don't package dashboards"). |
| Pricing code + resolved account prices (3858-3, 3922-1) | Existing `accountPricingPanel` LWC (BMS-5679) | Yes (existing LWC) | A dedicated shipped component already does price code + list→net + upcoming prices. Rebuilding = duplication. |
| Live price quote / order creation + promo auto-apply (3922-3) | Order-entry modal (`createInvoice`) | Yes (existing) | Transactional pricing/creation already exists; the quote is computed at order entry via `S_PriceResolver`. |
| Credit status, open balances, rep, notes (3858-1) | Account fields + related lists + standard Notes | Yes | Standard record data — no custom widget warranted. |

## Could NOT be done with reports/native → REQUIRED the custom LWC (what we built)

| Capability (AC) | Delivered by | Native possible? | Argument — why custom was necessary |
|---|---|---|---|
| Eligible promotions (per account, runtime) (3858-2, 3922-2) | `accountOrderVisibility` (S_PriceResolver) | No | Eligibility is a runtime computation — audience membership + `Promotion_Account_Exclusion__c` anti-join + item-scope cascade + channel/location/chain rules, most-specific-wins. Reports can't do NOT-IN / conditional cross-object resolution. |
| Not-eligible promotions + reason (3922-2) | `accountOrderVisibility` | No | Requires computing which product-relevant promos the account fails and why. No native surface derives or annotates ineligibility. |
| Inventory availability (orderable catalog @ warehouse, Cases/Units, in/out) (3858-6, 3922-5) | `accountOrderVisibility` | Partial only | A report can list raw `Inventory__c`, but can't apply the per-account sellable + `Product_Market_Restriction__c` anti-join, the assigned-warehouse hierarchy rollup, the lot-aware qty, or the cases/units split — all runtime. |
| Delivery/route banner + next-delivery + cutoff + last-delivery confirmation (3858-5) | `accountOrderVisibility` | No | Next-delivery date is derived (route Day-of-Week + cadence), not stored; cutoff is computed. No native field/report holds it. |
| Top ordered products (frequency + avg cases) (3922-4) | `accountOrderVisibility` | Arguably reportable | Could be a report grouped by item, but as a per-account inline top-5 with avg on the record page, a report-chart embed is clunky; delivered inline for agent UX. (The one borderline item.) |
| Search / filter / pagination on the above | `accountOrderVisibility` | No | These computed panels aren't list views, so they can't inherit native list-view filtering — they need their own. |

## Net
- Custom-built surface = the `accountOrderVisibility` LWC (Account record page, "Order Visibility" tab): delivery banner, promotions (eligible + not-eligible w/ reason), top products, inventory availability — all with search/filter/pagination.
- Everything stored-record-backed stays native: order history (related list), supervisor aggregate (native report), pricing (`accountPricingPanel`), order creation (order modal).
