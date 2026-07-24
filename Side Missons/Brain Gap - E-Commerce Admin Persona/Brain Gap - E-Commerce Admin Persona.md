# Brain Gap — E-Commerce Admin Persona

**From:** Alvaro (owns the E-commerce package) → **For:** Brian (Product Suite Catalog)
**Purpose:** fill the missing **E-Commerce Admin** Persona App so it can drop into *Ohanafy Product Suite Catalog v0.3* → **Layer 3 · Persona Apps**.
**Grounded in:** the real `OHFY-eCommerce` + `OHFY-eCommerce-UI` packages (components cited in the traceability table below), following the catalog's existing card pattern (Sales Manager / System Admin were my closest models).

---

## Catalog-ready card — paste into Layer 3

> **E-Commerce Admin Persona App**
> `DRAFT · NEEDS REVIEW`
>
> **E-commerce** (+ shared Invoice from OMS)
>
> The distributor-side owner of the online store. Does **not** shop — stands up the storefront, decides what retailers see, tunes the notifications that chase orders, and approves who gets in. The buyer-facing counterpart (the Retailer) is a separate external persona, added later.
>
> **EXPERIENCES IN THIS PERSONA APP**
> - Storefront Branding & Theme
> - Banners & Merchandising
> - Catalog & Promotion Visibility
> - Notification Setup
> - Account Requests & Access
> - Engagement & Recovery Monitoring
>
> **BACKEND OBJECTS IT READS**
> - Account (retailer entities) · Contact
> - Invoice (shared — carts & orders)
> - Notification · Notification Log · Contact Notification
> - Account Change Request
> - Item / Promotion (read) · Storefront config (branding, banners, Twilio routing)
>
> **DAY IN THE LIFE**
> 1. **Open the admin app.** Storefront configuration surfaces — not the buyer store. One place to run the channel.
> 2. **Let retailers in.** Approve self-service account-change requests, provision community access for new retailer contacts, and map retailers that trade as multiple entities to their accounts.
> 3. **Dress the store.** Set brand colors and logo, schedule banners, and curate which products and promotions appear on the storefront.
> 4. **Tune the notifications.** Choose which notifications are active and portal-visible, set the channel (email / SMS) and template per type, and point SMS at the org's Twilio routing.
> 5. **Watch engagement.** Monitor order confirmations, delivery-status notifications, and abandoned-cart reminders in the notification log; review cart-recovery attribution to see which reminders turned into orders.
> 6. **Close the loop.** Keep support content current and adjust merchandising, promotions, and reminder timing based on what the recovery reporting shows.

---

## Traceability — every experience maps to shipped code

Give this to whoever reviews the card so the persona isn't hand-waved. All references are real classes/LWCs in `OHFY-eCommerce` / `OHFY-eCommerce-UI`.

| Experience | What the admin does | Backed by |
| --- | --- | --- |
| Storefront Branding & Theme | Brand colors, logo, theme | `ecomThemeAdmin`, `ohfyTheme` · `EcomBrandingController` |
| Banners & Merchandising | Configure/schedule storefront banners | `configurableBanner`, `segmentedBanner` · `StorefrontBannerController`, `StorefrontBannerDTO` |
| Catalog & Promotion Visibility | Curate products/promotions shown to buyers | `ecomShop`, `ecomProductPage`, `ecomPromotions` · `ProductDisplayController` (Promotion/Item read) |
| Notification Setup | Active/portal-visible flags, channel, template, Twilio routing | `Notification__c` / `Contact_Notification__c` · `NotificationPreferenceController` · `Twilio_Configuration__mdt` · `OrderConfirmationService` |
| Account Requests & Access | Approve account changes, provision users, map multi-entity retailers | `AccountChangeRequestController` (BMS-3932) · `RegisterController`, `Q_SendEmailVerification` · `AccountSwitcherController` |
| Engagement & Recovery Monitoring | Watch order/delivery/abandoned-cart notifications; read recovery attribution | `Notification_Log__c` · `AbandonedCartReminderBatch`/`Scheduler` · `S_CartRecoveryAttribution` + the `Retailer_Engagement_Notifications` report type · `S_StalledCartRepAlert` (rep alert) |

---

## Decisions & assumptions (so Brian can accept or push back)

- **This is the INTERNAL admin, not the buyer.** Modeled it like *Sales Manager* ("works in configuration experiences, not the rep app"). The **Retailer / Buyer** (external, shops the store) is a distinct persona — flagged below as a related add-later, not folded in here.
- **Pricing & core promotions stay with Sales Manager (OMS).** The E-Commerce Admin controls *storefront visibility* of promotions, not the pricing/promo rules themselves — those already live in the Sales Manager Persona App. Avoided duplicating that experience.
- **Stalled-cart alert recipient is the Sales Rep, not the admin.** The admin *configures and monitors* the program; the bell alert fires to `Account.Sales_Rep__c`. Kept it under "Engagement Monitoring," not as an admin inbox.
- **Marked `DRAFT · NEEDS REVIEW`** — consistent with other freshly-modeled cards; this one is built from the code + my package knowledge, not a transcript.

## Open questions for Brian

1. Is the E-Commerce Admin its own Persona App, or a **surface within an existing admin** (the catalog already has a greyed *System Admin / Implementer* — "stands up the org")? If they merge, this becomes an E-commerce section of that card.
2. Should the external **Retailer / Buyer** persona be modeled now (mirrors the *Supplier / Vendor* external card), or held as `ADD LATER`?
3. Does "Notification Setup" belong to the E-Commerce Admin or to a shared platform/config persona? It touches the cross-package `Notification__c` framework, not just e-commerce.

## Related persona to add later
- **Retailer / Buyer Persona App** — `ADD LATER`, external. Shops the storefront: browse → cart → checkout → track orders → manage account & notification preferences. (Buyer-side counterpart to this card; components: `ecomHomeBody`, `ecomShop`, `ecomCartPage`, `ecomOrderHistory` + `ecomOrderStatusStepper`, `ecomProfilePage`, `ecomRegister`.)
