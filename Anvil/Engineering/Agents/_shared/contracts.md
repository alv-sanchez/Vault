# Cross-ticket contracts

Write the interface BEFORE building it; read before consuming.

## BMS-4258 (Account & Registration lane) — additive, 2026-06-12

**Ecom_UI_Wrappers — NEW method** (OHFY-eCommerce-UI):

```apex
@AuraEnabled
public static List<Map<String, String>> getRelatedAccounts()
// → AccountSwitcherController.getRelatedAccounts() (OHFY-eCommerce, new class)
// Returns the logged-in contact's related accounts (direct + ACR, IsActive=true),
// keys: id, name, city, state, isPrimary ("true"/"false"). Empty list when the
// user has no contact OR Contacts-to-Multiple-Accounts is disabled.
// Server-derived from UserInfo — takes NO params; this list is the authorization
// boundary for account switching.
```

**userDataService (LWC singleton) — NEW surface**:
- `getUserData()` payload now includes `relatedAccounts: [{id,name,city,state,isPrimary}]` and `hasMultipleAccounts: Boolean`.
- New `switchAccount(accountId): Promise<Boolean>` — validates against relatedAccounts, persists to `sessionStorage["ohfy-ecom-selected-account-id"]`, then **`window.location.reload()`**. (Updated 2026-06-14: was an in-memory re-init + `ACCOUNT_SWITCHED` broadcast; switched to a full page reload because some surfaces — e.g. the scheduled-delivery-day banner — didn't re-pull on the broadcast. Reload re-pulls every account-scoped surface cleanly. The `ACCOUNT_SWITCHED`/`ACCOUNT_SWITCH_STARTED` message types no longer fire; don't depend on them.)
- On init, a valid sessionStorage override wins over `User.Contact.AccountId` as the active account — this is what makes the post-reload page show the switched account.

**New LWC**: `ecomAccountSwitcher` (not exposed; embedded in `navigationMenu` — desktop header `variant="header"`, mobile drawer `variant="drawer"`).

**Profile change**: "Ohanafy Community User" gains `apexClassAccesses: AccountSwitcherController` + `objectPermissions: AccountContactRelation (read)`.

**Org prerequisite**: the `ContactsToMultipleAccounts` **scratch-org feature** (in `config/project-scratch-def.json` + the CICD snapshot def) provisions AND enables `AccountContactRelation` at org creation — verified queryable immediately after `sf org create scratch`. (The earlier `setup-site.sh` step 0.5 / `account-settings/Account.settings` AccountSettings deploy was removed 2026-06-14 as redundant — the feature already enables it; settings metadata isn't packageable anyway. Customer prod/sandbox orgs enable the setting manually in Setup → Account Settings as a runbook step.) **Existing registration flow (RegisterController.registerUser / searchAccounts / ecomRegister LWC) is UNCHANGED** — re-scoped ticket dropped multi-account registration.

## BMS-3932 (Account & Registration lane) — additive, 2026-06-12

**Ecom_UI_Wrappers — NEW methods** (OHFY-eCommerce-UI), all delegating 1:1 to NEW class
`AccountManagementController` (OHFY-eCommerce, `controllers/`). All writes are server-scoped:
the target Account is derived from `UserInfo.getUserId() → User.ContactId → Contact.AccountId`;
client-supplied ids are never trusted for writes.

```apex
@AuraEnabled
public static Map<String, String> getDeliveryAddress()
// → caller's Account ShippingStreet/City/State/PostalCode/Country
// keys: street, city, state, postalCode, country (blank-string when null)

@AuraEnabled
public static Map<String, String> updateDeliveryAddress(
    String street, String city, String stateCode, String postalCode, String country)
// Direct-write to caller's Account Shipping* fields (v1: no approval per BMS-3932 scope
// decisions). street/city/state/postalCode required; postalCode must be 5 digits.
// Fire-and-forget email notification to Account.Sales_Rep__c (old → new address);
// notification failure does NOT roll back the save. Returns the saved address map.

@AuraEnabled
public static List<Map<String, String>> getAccountContacts()
// All contacts on the caller's account. keys: id, firstName, lastName, name, email,
// phone, title, isSelf ("true" when Contact.Id == caller's contact)

@AuraEnabled
public static Map<String, String> addAccountContact(
    String firstName, String lastName, String email, String phone, String title)
// Inserts Contact with AccountId = caller's account. first/last/email required;
// duplicate email on the same account blocked with error naming the conflict.
// Returns the created contact map (same keys as getAccountContacts).

@AuraEnabled
public static Map<String, String> updateAccountContact(
    String contactId, String firstName, String lastName, String phone, String title)
// Edits an existing contact ONLY if it belongs to the caller's account (throws otherwise).
// Email immutable. Returns the updated contact map.
```

**Profile change**: "Ohanafy Community User" gains `apexClassAccesses: AccountManagementController`
+ `objectPermissions: Contact (read/create/edit)`.

**No changes** to `UpdateContactController`, `updateContact`, registration flow, or any
BMS-4258 surface (4258's `getRelatedAccounts` / `AccountSwitcherController` untouched; names
chosen to not collide).

## BMS-4053 (Catalog & Discovery lane, CAT-4053) — card extraction contract — 2026-06-12

**New LWC `ecomProductCard`** (OHFY-eCommerce-UI, NOT exposed) — the atomic product card
extracted from `ecomShop`. **CAT-4054 (grid) and CAT-3925 (catalog) consume this** instead of
re-rendering inline card markup. Presentational only: it owns markup, theme load
(`loadOhfyTheme(this)`), image-error fallback, promo-progress-bar widths, and quantity-input
validation/reset; ALL data fetching, cart mutations, and the promotions modal stay in the parent.

```
@api item                    // decorated catalog item (the object ecomShop.processItems builds).
                             // Read keys: Id, Name, defaultImage, productType, packInfo, isKegged,
                             // price, saveAmount, callForPricing, Quantity_Available__c, isOutOfStock,
                             // hasPromotions, promotionsCount, promotionText, firstPromotion{...},
                             // isInCart, cartQuantity, toDelete, addingSpinner, removingSpinner.
                             // Parent mutates these on its tracked items array; card re-renders reactively.
@api showQuantityAvailable   // Boolean — raw "<n> in stock" vs "In stock" badge (ecommerceShowQuantityAvailable pref)
@api displayFields           // [{apiName,label,type}] from Ecom_UI_Wrappers.getProductDisplayFields('Ecom Product Card');
                             // card renders item[apiName] per entry as label/value rows (checkbox→Yes/No,
                             // currency→$x.xx). Empty/undefined → section not rendered.
```

**Events** (CustomEvent, non-bubbling; `detail = { itemId }` unless noted):
- `productview` — image or product-name click → parent navigates to product page
- `promotionview` — promo % badge click → parent opens itemPromotionsModal
- `addtocart` — Add to Cart click
- `quantityincrease` / `quantitydecrease` — plus/minus in In-Cart state
- `quantitychange` — `detail = { itemId, quantity }`; only fired with a valid (int >= 1) parsed
  value; invalid input is reset + toasted inside the card
- `removerequest` — trash icon (parent sets item.toDelete=true)
- `removecancel` / `removeconfirm` — delete-confirmation buttons

**data-testids preserved inside the card** (Playwright contract): `product-card`,
`add-to-cart-button`, `call-for-pricing-badge`, `call-for-pricing-price`.

**Ecom_UI_Wrappers — NEW method**:
```apex
@AuraEnabled(cacheable=true)
public static List<Map<String, Object>> getProductDisplayFields(String purpose)
// → ProductDisplayController.getProductDisplayFields (OHFY-eCommerce, new class)
// purpose in {'Ecom Product Card','Ecom Product Detail'} (Fieldset_Purpose__c picklist values).
// Resolves Fieldset_Customization__mdt(Object_Name__c='ohfy__Item__c', purpose) → Item__c field set,
// returns ordered [{apiName,label,type}] of accessible, non-reference fields.
// Returns [] when no CMDT record / field set is configured (zero-config storefront stays clean).
```

**Data-Model additions**: Fieldset_Purpose__c picklist values `Ecom Product Card` +
`Ecom Product Detail`; Item__c field sets `Ecom_Product_Card` + `Ecom_Product_Detail`
(default content: UPC__c); CMDT records `Fieldset_Customization.Item_Ecom_Product_Card` /
`Item_Ecom_Product_Detail`.

**Profile change**: "Ohanafy Community User" gains `apexClassAccesses: ProductDisplayController`.

## BMS-4050 (Cart & Checkout lane) — additive, 2026-06-12

**userDataService pricing provenance — NEW surface** (OHFY-eCommerce-UI):
- `resolveAccountPricing()` now stamps `_resolutionPath` + `_frontLinePriceId` on the
  `pricelistItems` entries AND their nested `ohfy__Item__r` shims (previously only on
  `itemIdToItemMap` entries). Same three-clone stamping rule as `_callForPricing`.
- Consumers (e.g. BMS-4051 volume-tier/promo breakdown) can rely on
  `getPricelistData().pricelistItems[n]._resolutionPath` being one of
  ITEM | ITEM_TYPE_PKG | ITEM_LINE_PKG | ITEM_DEFAULT (never NONE — NONE items get
  `_callForPricing = true` instead and skip the price stamp).

**ecomOrderItemUtils — NEW export** (`c/ecomOrderItemUtils`):
```js
buildPriceProvenance(resolutionPath, listCasePrice, lineCasePrice) → {
  sourceLabel, isFrontLine, hasListPrice, listPrice,
  hasAdjustment, adjustment, adjustmentClass, finalPrice
} | null   // null when resolutionPath is NONE/unknown or line price unusable
```
Ph-1 only: no promo/volume-tier rows. BMS-4051 should EXTEND this view-model
(additive keys) rather than fork it, so the cart popover stays one component.

**Cart popover test-ids** (ecomCartPage, per visible layout): `price-breakdown-trigger`,
`price-breakdown-popover`, `price-breakdown-source`, `price-breakdown-list-price`,
`price-breakdown-adjustment`, `price-breakdown-final-price`.

## BMS-4054 (Catalog & Discovery lane, CAT-4054) — additive, 2026-06-12

**ecomShop sort contract** (OHFY-eCommerce-UI):
- Sort value `default` is now **"Promotions First"**: comparator
  `(b.hasPromotions === true) - (a.hasPromotions === true) || b.isInCart - a.isInCart`,
  stable otherwise. Initial catalog load and search results both render in this order.
- NEW sort value `cart` = legacy "Cart Items First" behavior (`b.isInCart - a.isInCart`).
- `price-asc` / `price-desc` / `name` unchanged. CAT-3925 (promo prominence) should build
  on the `default` comparator rather than adding a parallel promo sort.

**ecomProductCard — additive testids/behavior** (extends the BMS-4053 contract):
- NEW `data-testid="promotion-badge"` on the % promo button (Playwright contract).
- NEW `data-testid="product-card-image"` on the image frame; `<img loading="lazy">`.
- `handleImageError` now falls back to `ecomNoProductImage` / `defaultKeggedProductImage`
  static resources (reads `item.isKegged`) with a one-shot `data-fallback-applied` guard —
  no longer sets `src=""`. Parents need no changes.
