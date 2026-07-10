# Live blockers

Agents append: ticket key + question + interim plan. Alvaro answers inline.

## BMS-4258 — pool scratch orgs cannot provision AccountContactRelation — 2026-06-12

**Blocker:** the storefront account switcher (re-scoped BMS-4258) needs Contacts to Multiple Accounts. On pool org `ecom-account`:
- `AccountSettings.enableRelateContactToMultipleAccounts` deploys "Succeeded / changed=True" and the Setup-UI checkbox shows CHECKED,
- but the `AccountContactRelation` sobject is **never provisioned** ("not supported" in SOQL, describe 404) — even after a manual Setup-UI Edit→Save cycle.
- Root cause: the pool snapshot's scratch-org definition lacks the **`ContactsToMultipleAccounts` feature**, and scratch-org features cannot be added post-creation.

**Ask (Alvaro / OHFY-CICD):** add `"ContactsToMultipleAccounts"` to the pool/snapshot scratch def in OHFY-CICD and rebuild the nightly snapshot. Until then, no pool org can demo/E2E the switcher.

**Interim plan:** all code is feature-gated (dynamic ACR references, controller returns `[]`, switcher hidden) so deploys/tests stay green on feature-less orgs; Apex tests skip-guard the ACR scenarios; single-account regression (AC4/AC5) is verifiable on `ecom-account` now. Multi-account live verification + the ACR-dependent `_T` methods + Playwright multi-account spec need either the snapshot fix or a one-off scratch org created with the feature (needs approval — claim policy says pool-only).

## CAT-4053 — Brand logo/color accent on product card — parked coin-flip — 2026-06-12
Alvaro's comment AC on BMS-4053 asks for "Brand logo or brand color accent rendered
consistently across all cards of the same brand family." No brand color/logo field exists on
Item_Type__c (the brand object) — fields are ABV, Category, Description, Item_Line, Key,
Packaging_Styles, Short_Name, Subtype, Supplier, Supplier_Number, Type — and no UX decision
is recorded. Building it requires either (a) a new packaged field (e.g. Item_Type__c.Brand_Color__c
+ admin UI + FLS) or (b) inventing a deterministic name-hash color — both product decisions.
Card extraction (PR for BMS-4053) ships without the accent; slice parked for human call.
Options: (a) new field, (b) hash-derived accent, (c) drop the AC. Tagged: CAT-4053.

## CART-4050 — community add-to-cart write path broken on pool orgs; sharing-rule fix needs human approval — 2026-06-12

- **What**: On `ecom-cart` (and per BMS-4258, all fresh pool orgs) the community user's
  add-to-cart fails server-side: the draft `Invoice__c` insert 400s with
  `INSUFFICIENT_ACCESS_ON_CROSS_REFERENCE_ENTITY` on the `Account.Sales_Rep__c`
  internal-User lookup (external users can't see internal Users; User external OWD is Private).
  Confirmed on ecom-cart: 0 draft invoices exist; product card renders with price + Add to Cart
  but the click never persists a line.
- **Proposed fix (READY, needs approval)**: deploy a criteria-based **User sharing rule**
  granting Read on internal users to all community users. Exact metadata staged at
  `/tmp/user-sharing/` (mdapi: `sharingRules/User.sharingRules`, rule
  `Ecom_Internal_Users_Visible_To_Community`, criteria `UserType = Standard`,
  sharedTo `allCustomerPortalUsers`, accessLevel Read). Deploy:
  `sf project deploy start --metadata-dir /tmp/user-sharing -o ecom-cart --test-level NoTestRun --wait 10`
  The Claude auto-mode classifier denied the deploy (security-loosening change) — a human
  must run it, then commit it under `orgScripts/e-commerce/user-sharing/` + wire into
  `setup-site.sh` so every fresh org gets it.
- **Impact on CART-4050**: worked around — the BMS-4050 spec seeds cart state admin-side
  (`test-automation/support/ecom/draftCartSeed.ts`); read path (cart page, pricing display,
  popover) is unaffected and fully verified. A write-side add-to-cart parity test should be
  added once the sharing fix lands. CART-4051/4052 (promos at add, checkout) WILL be blocked
  by this — fix before those build.
