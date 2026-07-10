# E-Commerce Branding
> **Confluence**: https://ohanafy.atlassian.net/wiki/spaces/PD/pages/915963908/Configurable+E-Commerce+Branding

## Component
`Ecom_Branding__mdt` (Custom Metadata Type) + `EcomBrandingController.cls`

## Tickets

| Ticket | Date Added | Engineer | Ticket Type |
|---|---|---|---|
| [[Experience Cloud theme & brand setup (Gulf branding) = BMS-3923]] | 4/10/2026 | Alvaro Sanchez | Story |
| [[BMS-4048]] | 4/8/2026 | Alvaro Sanchez | Bug Fix |
| [[BMS-4072]] | 4/9/2026 | Alvaro Sanchez | Story |

---

## 1. Overview

**Purpose:** Centralized branding system that lets subscriber orgs override default E-Commerce images (logos, loading spinners, category icons, hero banners) without code changes.

**Target Users:** Admins (during subscriber org setup)

**How it works:** Every brandable image in the E-Commerce site is loaded by an LWC via a wired Apex call to `EcomBrandingController.getBrandingResource`, keyed by a stable `Resource_Key__c`. The controller returns the name of the Static Resource to use, and the component renders `/resource/{name}`. Subscribers override branding by editing `Static_Resource_Name__c` on the existing metadata record — no deploy required.

---

## 2. Setup Steps (Subscriber Org)

To replace any default image with a company-specific one:

1. **Upload** the new image to **Setup → Static Resources** (e.g. `GulfLoadingSpinner`, Cache Control = Public)
2. Head to **Setup**
3. In the Quick Find box, search for **Custom Metadata Types**
4. Locate the entry with:
   - **Label:** `Ecom Branding`
   - **API Name:** `ohfy__Ecom_Branding__mdt`
5. Click **Manage Records** next to it
6. **Edit** the record you want to override (e.g. `Ohana Loading Image`)
7. **Set** `Static Resource Name` to the API name of your uploaded static resource
8. **Save** — change takes effect immediately on next component load

---

## 3. Available Resource Keys

| Resource Key                                                                                                                                                                                                        | Purpose                              | Used By                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------- |
| `OhanaLoadingImage`                                                                                                                                                                                                 | Default loading/placeholder image    | Most ECOM LWCs (shop, cart, product, order history, review, promotions, profile) |
| `OhanaLogo`                                                                                                                                                                                                         | Primary site logo (header)           | navigationMenu                                                                   |
| `faviconOhana`                                                                                                                                                                                                      | Browser tab favicon                  | navigationMenu                                                                   |
| `ecomNoProductImage`                                                                                                                                                                                                | Fallback for products without a logo | Product/cart/shop tiles                                                          |
| `retailHeroBanner`                                                                                                                                                                                                  | Hero banner on the home page         | ecomHomeBody                                                                     |
| `ecomBeer`, `ecomRTDs`, `ecomAlcoholic`, `ecomOverhead`, `ecomCannabis`, `ecomCider`, `ecomImport`, `ecomKidsBeverages`, `ecomMixers`, `ecomNABeer`, `ecomNonAlc`, `ecomRedBull`, `ecomSportsAndEnergy`, `ecomWine` | Home page category images            | ecomHomeBody only                                                                |


---

## 4. Field Reference

`ohfy__Ecom_Branding__mdt`:

| Field                     | Type                       | Managed                   | Purpose                                                   |
| ------------------------- | -------------------------- | ------------------------- | --------------------------------------------------------- |
| `Resource_Key__c`         | Text(80), Unique, Required | Developer-controlled      | Stable key used by LWC components — never change          |
| `Static_Resource_Name__c` | Text(255), Required        | **Subscriber-controlled** | Static Resource API name to serve — edit this to override |
| `Description__c`          | Text                       | —                         | Human-readable description of the asset                   |

---

## 5. Usage Pattern (LWC)

```js
import { wire } from 'lwc';
import getBrandingResource from '@salesforce/apex/EcomBrandingController.getBrandingResource';

export default class MyEcomComponent extends LightningElement {
    loadingLogo;
    defaultImage;

    @wire(getBrandingResource, { resourceKey: 'OhanaLoadingImage' })
    wiredBranding({ data }) {
        if (data) {
            this.loadingLogo = '/resource/' + data;
            this.defaultImage = '/resource/' + data;
        }
    }
}
```

---

## 6. Backend Notes

| Apex Method | Description |
|---|---|
| `EcomBrandingController.getBrandingResource(String resourceKey)` | Returns `Static_Resource_Name__c` for a single key. Falls back to the key itself if no record is found. Cacheable. |
| `EcomBrandingController.getBrandingResources(List<String> resourceKeys)` | Bulk version — returns a `Map<String, String>` of key → resource name. |
| `EcomBrandingController.getAllBrandingResources()` | Returns all records as a `Map<String, String>`. |

All methods are `@AuraEnabled(cacheable=true)`.

---

## 7. Notes

- **No deploy required** — subscriber edits to `Static_Resource_Name__c` are instant
- **No script required** — all 22 metadata records ship with the package; subscribers only edit, never create
- **Fallback** — if a record is missing for a given key, the controller returns the key itself, so `/resource/{key}` still resolves if a Static Resource with that exact name exists
- **Cache** — changes may take a few seconds to propagate on the client due to `cacheable=true`

---

## 8. Changelog

| Date | Ticket | Change |
|---|---|---|
| Apr 2026 | BMS-3923 | Documented branding override flow for Gulf Distributors (and future subscribers) |
