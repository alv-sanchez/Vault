

# LWC Component Overview — OHFY-Ecom Bug Bash Reference

_Generated 2026-04-01_

  

---

  

## Component Index

  

| Component | Type | Purpose |

|-----------|------|---------|

| [ecomShop](#ecomshop) | Page | Product catalog — search, filter, add-to-cart |

| [ecomCartPage](#ecomcartpage) | Page | Shopping cart — review, adjust, checkout |

| [ecomOrderHistory](#ecomorderhistory) | Page | Past order list and reorder support |

| [ecomProductPage](#ecomproductpage) | Page | Single product detail view |

| [ecomProfilePage](#ecomprofilepage) | Page | Customer account info and contact update |

| [ecomOrderPlaced](#ecomorderplaced) | Page | Order confirmation / thank-you screen |

| [ecomHomeBody](#ecomhomebody) | Page | Homepage content body |

| [ecomPromotions](#ecompromtions) | Page | Promotions listing / eligibility view |

| [ecomRegister](#ecomregister) | Page | New user registration flow |

| [ecomReviewSummary](#ecomreviewsummary) | Page | Pre-submit cart/order review |

| [ecomSupport](#ecomsupport) | Page | Support/contact form |

| [ecomFooter](#ecomfooter) | Layout | Site footer nav links |

| [navigationMenu](#navigationmenu) | Layout | Header — search bar, cart badge, user menu |

| [configurableBanner](#configurablebanner) | Layout | Configurable promo/info banner |

| [ecomLogoDisplay](#ecomlogodisplay) | Layout | Brand logo display tile |

| [itemPromotionsModal](#itempromotionsmodal) | Modal | Promotion detail overlay for a product |

| [reorderModal](#reordermodal) | Modal | Reorder items from previous order |

| [userDataService](#userdataservice) | Service | Singleton: user, account, pricelist, promotions data |

| [draftInvoiceService](#draftinvoiceservice) | Service | Singleton: shopping cart as draft invoices |

| [cartService](#cartservice) | Service | Legacy cart wrapper (being deprecated) |

| [pubsub](#pubsub) | Utility | Custom pub/sub (being deprecated, prefer LMS) |

  

---

  

## LMS Channels

  

| Channel | Publishers | Subscribers |

|---------|-----------|------------|

| `UserDataChannel__c` | userDataService | ecomShop, ecomCartPage, navigationMenu, ecomOrderHistory, ecomPromotions, ecomProfilePage |

| `DraftInvoiceChannel__c` | draftInvoiceService | ecomShop, ecomCartPage, navigationMenu |

  

---

  

## Salesforce Object Map

  

### Quick Reference: Who Reads/Writes What

  

| SObject | Readers | Writers |

|---------|---------|---------|

| `Account` | userDataService, ecomProfilePage | ecomProfilePage (via UpdateContactController) |

| `Contact` | userDataService, ecomProfilePage | ecomProfilePage (via UpdateContactController) |

| `User` | userDataService | — |

| `ohfy__Item__c` | userDataService, ecomShop, ecomProductPage | — |

| `ohfy__Pricelist_Item__c` | userDataService, ecomShop | — |

| `ohfy__Item_Type__c` (brand) | userDataService, ecomShop | — |

| `ohfy__Item_Line__c` (brand family) | userDataService, ecomShop | — |

| `ohfy__Invoice__c` (draft cart) | draftInvoiceService | draftInvoiceService |

| `ohfy__Invoice_Item__c` | draftInvoiceService, ecomCartPage | draftInvoiceService, ecomCartPage |

| `ohfy__Order__c` | ecomOrderHistory | ecomCartPage (submit → creates Order) |

| `ohfy__Order_Item__c` | ecomOrderHistory, reorderModal | ecomCartPage (submit) |

| `ohfy__Promotion__c` | userDataService, ecomShop, ecomPromotions | — |

| `ohfy__Territory__c` | userDataService | — |

| `ohfy__Pricelist__c` | userDataService | — |

| `Configuration_Preference__c` | ecomShop, navigationMenu | — |

  

---

  

## Component Details

  

---

  

### ecomShop

  

**Type:** Page

**Purpose:** Product catalog — browse pricelist items, search/filter across 7 dimensions, manage cart quantities with optimistic updates, view promotion eligibility.

  

See [`docs/ecomShop-detail.md`](./ecomShop-detail.md) for full technical reference.

  

**Objects:**

| Object | Access | Via |

|--------|--------|-----|

| `ohfy__Pricelist_Item__c` | READ | userDataService → LMS |

| `ohfy__Item__c` | READ | Nested in Pricelist_Item |

| `ohfy__Item_Type__c` | READ | Nested in Item |

| `ohfy__Item_Line__c` | READ | Nested in Item |

| `ohfy__Invoice_Item__c` | WRITE | draftInvoiceService |

| `ohfy__Promotion__c` | READ | userDataService → LMS |

| `ohfy__Territory__c` | READ | userDataService |

| `Account` | READ | userDataService |

| `Configuration_Preference__c` | READ | Apex: CartController |

  

**Apex:** `CartController.getQuantityAvailableAtFulfillmentLocation`, `CartController.getBrands`, `CartController.getPromotionCriteriaQuantities`

**LMS:** Subscribes to `UserDataChannel__c` + `DraftInvoiceChannel__c`

**Key State:** `cartQuantities`, `cartItemIds`, `cartItemsSet`, `pageList`, `filterHierarchy` maps

  

---

  

### ecomCartPage

  

**Type:** Page

**Purpose:** Shopping cart review — displays draft invoice items grouped by delivery date, allows quantity edits, item removal, promo code entry, and order submission.

  

**Objects:**

| Object | Access | Via |

|--------|--------|-----|

| `ohfy__Invoice__c` | READ/WRITE | draftInvoiceService |

| `ohfy__Invoice_Item__c` | READ/WRITE | draftInvoiceService, direct Apex |

| `ohfy__Promotion__c` | READ | userDataService → LMS |

| `Account` | READ | userDataService → LMS |

| `ohfy__Order__c` | WRITE | Apex on submit |

| `ohfy__Order_Item__c` | WRITE | Apex on submit |

  

**Apex:** `QA_DraftInvoiceController.onInvoiceItemChange`, `QA_DraftInvoiceController.confirmInvoice`

**LMS:** Subscribes to `UserDataChannel__c` + `DraftInvoiceChannel__c`

**Key State:** Cart item list from DTO, split invoice grouping, delivery date per invoice

  

---

  

### ecomOrderHistory

  

**Type:** Page

**Purpose:** Displays paginated past orders for the current account. Allows filtering by date range and launching reorderModal.

  

**Objects:**

| Object | Access | Via |

|--------|--------|-----|

| `ohfy__Order__c` | READ | Apex: OrderHistoryController |

| `ohfy__Order_Item__c` | READ | Apex: OrderHistoryController (nested) |

| `ohfy__Item__c` | READ | Nested in Order_Item |

| `Account` | READ | userDataService → LMS |

  

**Apex:** `OrderHistoryController.getOrdersForCustomer`, `OrderHistoryController.getOrderById`

**LMS:** Subscribes to `UserDataChannel__c` (needs account ID)

**Key State:** `orders[]`, date range filter, pagination state

  

---

  

### ecomProductPage

  

**Type:** Page

**Purpose:** Single product detail view — shows product image, description, pricing, UOM info, and add-to-cart button.

  

**Objects:**

| Object | Access | Via |

|--------|--------|-----|

| `ohfy__Item__c` | READ | Apex or URL param |

| `ohfy__Pricelist_Item__c` | READ | userDataService → LMS |

| `ohfy__Invoice_Item__c` | WRITE | draftInvoiceService |

  

**Apex:** `CartController.getItemById` (if direct nav)

**LMS:** Subscribes to `UserDataChannel__c` + `DraftInvoiceChannel__c`

  

---

  

### ecomProfilePage

  

**Type:** Page

**Purpose:** Customer profile management — view/edit contact info (name, email, phone), view account details.

  

**Objects:**

| Object | Access | Via |

|--------|--------|-----|

| `Contact` | READ/WRITE | Apex: UpdateContactController |

| `Account` | READ | userDataService → LMS |

| `User` | READ | userDataService |

  

**Apex:** `UpdateContactController.getContact`, `UpdateContactController.updateContact`

**LMS:** Subscribes to `UserDataChannel__c` (for account data)

**Key State:** Form field tracked props, `isEditing` toggle, save spinner

  

---

  

### ecomOrderPlaced

  

**Type:** Page

**Purpose:** Order confirmation screen — shown after successful order submission. Displays order number, summary, and CTA to continue shopping.

  

**Objects:**

| Object | Access | Via |

|--------|--------|-----|

| `ohfy__Order__c` | READ | URL param / LMS state |

  

**LMS:** May subscribe to `DraftInvoiceChannel__c` for `DRAFT_CONFIRMED` message

**Key State:** Order number, confirmation details

  

---

  

### ecomHomeBody

  

**Type:** Page

**Purpose:** Homepage body — promotional banners, featured categories, quick-access tiles. Content driven by configurable preferences or static markup.

  

**Objects:**

| Object | Access | Via |

|--------|--------|-----|

| `Account` | READ | userDataService → LMS |

| `Configuration_Preference__c` | READ | Apex (optional) |

  

**LMS:** Subscribes to `UserDataChannel__c`

  

---

  

### ecomPromotions

  

**Type:** Page

**Purpose:** Promotions listing — shows all active promotions with eligibility details, progress toward criteria, and filterable by type.

  

**Objects:**

| Object | Access | Via |

|--------|--------|-----|

| `ohfy__Promotion__c` | READ | userDataService → LMS |

| `ohfy__Pricelist_Item__c` | READ | userDataService → LMS |

| `ohfy__Invoice_Item__c` | READ | draftInvoiceService |

| `Account` | READ | userDataService |

  

**Apex:** `CartController.getPromotionCriteriaQuantities`

**LMS:** Subscribes to `UserDataChannel__c` + `DraftInvoiceChannel__c`

**Key State:** Promotion list, cart quantities for progress bars, pagination

  

---

  

### ecomRegister

  

**Type:** Page

**Purpose:** New user self-registration flow — collects name, email, phone, business info. Submits to create Contact/Account in Salesforce.

  

**Objects:**

| Object | Access | Via |

|--------|--------|-----|

| `Contact` | WRITE | Apex: RegisterController |

| `Account` | WRITE | Apex: RegisterController (may create) |

  

**Apex:** `RegisterController.registerUser`

**LMS:** None (unauthenticated flow)

**Key State:** Form fields, step progress (multi-step registration), validation errors

  

---

  

### ecomReviewSummary

  

**Type:** Page

**Purpose:** Pre-submission order review — final check of cart contents, pricing, and delivery details before confirming.

  

**Objects:**

| Object | Access | Via |

|--------|--------|-----|

| `ohfy__Invoice__c` | READ | draftInvoiceService |

| `ohfy__Invoice_Item__c` | READ | draftInvoiceService |

| `ohfy__Promotion__c` | READ | userDataService |

| `Account` | READ | userDataService |

  

**LMS:** Subscribes to `UserDataChannel__c` + `DraftInvoiceChannel__c`

  

---

  

### ecomSupport

  

**Type:** Page

**Purpose:** Support request form — customer can submit a help request or feedback. May send email or create a Case.

  

**Objects:**

| Object | Access | Via |

|--------|--------|-----|

| `Case` | WRITE | Apex (optional) |

| `Contact` | READ | userDataService |

  

**Key State:** Form fields, submission state

  

---

  

### ecomFooter

  

**Type:** Layout

**Purpose:** Site footer — navigation links organized under category headings (About, Help, Legal, etc.).

  

**Objects:** None

**LMS:** None

**Key State:** None (static nav links, possibly driven by configuration)

  

---

  

### navigationMenu

  

**Type:** Layout

**Purpose:** Site header — logo, search bar, cart badge (live item count), user menu (name, logout). Responsive for mobile.

  

**Objects:**

| Object | Access | Via |

|--------|--------|-----|

| `Account` | READ | userDataService → LMS |

| `ohfy__Invoice_Item__c` | READ (count) | draftInvoiceService |

| `Configuration_Preference__c` | READ | Apex |

  

**LMS:** Subscribes to `UserDataChannel__c` + `DraftInvoiceChannel__c`

**Key State:** `cartItemCount` (badge number), `currentUser` display name, search input

  

---

  

### configurableBanner

  

**Type:** Layout

**Purpose:** Configurable banner slot — displays a dismissable promo/info message. Content driven by a configuration preference or Experience Cloud content.

  

**Objects:**

| Object | Access | Via |

|--------|--------|-----|

| `Configuration_Preference__c` | READ | Apex (optional) |

  

**Key State:** `isVisible`, banner message text

  

---

  

### ecomLogoDisplay

  

**Type:** Layout

**Purpose:** Renders a brand logo tile given a logo URL. Used inside ecomShop product cards and product page.

  

**Objects:** None (data passed as props)

**Key State:** `logoUrl`, fallback placeholder visibility

  

---

  

### itemPromotionsModal

  

**Type:** Modal

**Purpose:** Overlay showing promotion details for a specific product — criteria, discount type, progress toward reward.

  

**Objects:**

| Object | Access | Via |

|--------|--------|-----|

| `ohfy__Promotion__c` | READ | Props from parent (ecomShop) |

| `ohfy__Invoice_Item__c` | READ (quantity) | Props/cartQuantities |

  

**Key State:** `isOpen`, `promotions[]`, `cartQuantity` for progress calc

  

---

  

### reorderModal

  

**Type:** Modal

**Purpose:** Reorder items from a past order — displays previous order items with current pricing, allows bulk add to cart.

  

**Objects:**

| Object | Access | Via |

|--------|--------|-----|

| `ohfy__Order_Item__c` | READ | Props from ecomOrderHistory |

| `ohfy__Item__c` | READ | Nested in Order_Item |

| `ohfy__Pricelist_Item__c` | READ | userDataService (price lookup) |

| `ohfy__Invoice_Item__c` | WRITE | draftInvoiceService |

  

**LMS:** May subscribe to `DraftInvoiceChannel__c`

**Key State:** `isOpen`, `orderItems[]`, selected items, add-to-cart spinners

  

---

  

### userDataService

  

**Type:** Service (Singleton)

**Purpose:** Single source of truth for all user, account, pricelist, and promotion data. Caches with 5-minute timeout. All page components read product/pricing data from here.

  

**Objects:**

| Object | Access | Via |

|--------|--------|-----|

| `User` | READ | Apex: U_UserUtil |

| `Account` | READ | Apex: U_UserUtil |

| `Contact` | READ | Apex: U_UserUtil |

| `ohfy__Pricelist__c` | READ | Apex |

| `ohfy__Pricelist_Item__c` | READ | Apex (bulk, all items) |

| `ohfy__Item__c` | READ | Nested in Pricelist_Item |

| `ohfy__Item_Type__c` | READ | Nested in Item |

| `ohfy__Item_Line__c` | READ | Nested in Item |

| `ohfy__Promotion__c` | READ | Apex |

| `ohfy__Territory__c` | READ | Apex |

  

**LMS:** Publishes to `UserDataChannel__c` (`DATA_INITIALIZED`, `DATA_UPDATED`, `CURRENT_STATE`, `ERROR`)

**Apex:** `CartController.getUserData`, `CartController.getPricelistItems`, `CartController.getPromotions`

**Cache:** 5-minute TTL on pricelist items. Direct subscriber callbacks + LMS for consumers.

  

---

  

### draftInvoiceService

  

**Type:** Service (Singleton)

**Purpose:** Shopping cart as draft invoices. Manages one or more draft invoices (split by subtype), syncs with server on every change.

  

**Objects:**

| Object | Access | Via |

|--------|--------|-----|

| `ohfy__Invoice__c` | READ/WRITE | Apex: QA_DraftInvoiceController |

| `ohfy__Invoice_Item__c` | READ/WRITE | Apex: QA_DraftInvoiceController |

| `Account` | READ | Passed from userDataService |

  

**LMS:** Publishes to `DraftInvoiceChannel__c` (`DRAFT_INITIALIZED`, `DRAFT_UPDATED`, `DRAFT_CONFIRMED`, `CURRENT_STATE`, `ERROR`)

**Apex:** `QA_DraftInvoiceController.getDraftInvoice`, `QA_DraftInvoiceController.onInvoiceItemChange`, `QA_DraftInvoiceController.confirmInvoice`

**Key State:** `draftInvoiceDTO` — the canonical cart state. Handles split invoices by item subtype.

  

---

  

### cartService

  

**Type:** Service (Legacy)

**Purpose:** Legacy cart wrapper. Pre-dates draftInvoiceService pattern. Being deprecated in favor of LMS + draftInvoiceService.

  

> **Note:** Do not add new functionality here. Migrate callers to draftInvoiceService.

  

---

  

### pubsub

  

**Type:** Utility (Legacy)

**Purpose:** Custom pub/sub event bus used before LMS was adopted. Being deprecated.

  

> **Note:** No new components should import pubsub. Use LMS (`UserDataChannel__c` / `DraftInvoiceChannel__c`).

  

---

  

## Architecture Notes for Bug Bash

  

### Where Bugs Most Likely Hide

  

1. **Filter cascade** (ecomShop) — when one filter clears valid options for another and doesn't restore them on deselect

2. **Quantity rollback** (ecomShop) — optimistic update shown, server fails silently, UI shows wrong qty

3. **LMS race on init** — component subscribes to UserDataChannel but misses DATA_INITIALIZED because service already published before subscription

4. **Split invoices** (draftInvoiceService / ecomCartPage) — items going to wrong invoice subtype

5. **Cart badge count** (navigationMenu) — stale after draft confirmed; should reset to 0

6. **Pagination state after filter change** — currentPage not reset → empty page displayed

7. **reorderModal + current pricelist** — item from old order no longer on pricelist → missing price