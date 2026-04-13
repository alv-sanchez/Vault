# BMS-4070: Default Product Image & TBM Branding Updates |ECOM|

## Related
- Jira: https://ohanafy.atlassian.net/browse/BMS-4070
- Testing: [[BMS-4070]] (in Testing/)
- Docs: [[BMS-4070]] (in Documentation/)

---

**Priority**: High
**Effort**: S
**Components**: `ecomProductPage`, `ecomShop`, `ecomCartPage`, `ecomReviewSummary`, `ecomOrderPlaced`, `ecomRegister`, `ecomHomeBody`, `ecomLogoDisplay` LWCs, Static Resources

## Story Statement

As a Retailer, I want product images to show a professional "Image Coming Soon" placeholder when no image is available, and all branding to reflect The Beverage Market (not Ohanafy), so that the portal looks polished and on-brand.

## Acceptance Criteria

### SCENARIO: Default Product Image
**GIVEN** a product has no `Logo_URL__c` set
**WHEN** the product is displayed on the Shop page, Product page, Cart page, Review Order, or Order Placed page
**THEN** a silver can with "IMAGE COMING SOON" text is shown as the fallback image
**AND** the Ohanafy loading spinner is NOT used as the product fallback

### SCENARIO: Loading Spinner Branding
**GIVEN** a retailer visits any page with a loading state
**WHEN** the page is loading
**THEN** the loading spinner/logo reflects The Beverage Market branding (via `EcomBrandingController`)

### SCENARIO: Registration Page Logo
**GIVEN** a user visits the self-registration page
**WHEN** the page loads
**THEN** the header logo reflects The Beverage Market branding

### SCENARIO: Hero Banner Branding
**GIVEN** a retailer visits the home page
**WHEN** the hero section renders
**THEN** the hero banner image reflects TBM branding (via `retailHeroBanner` static resource or branding override)

## Dependencies
- **Cannot Start Until**: None (Emily provides branding assets)
- **This Story Unlocks**: None
- **Ships With**: Static resource `ecomNoProductImage`

## Testing Notes
- Verify `ecomNoProductImage` static resource is used (not `OhanaLoadingImage`) for product fallbacks
- Verify `ecomOrderPlaced.js` does NOT overwrite `defaultImage` with the loading logo in the `@wire(getBrandingResource)` handler
- Verify each LWC: Shop, Product Page, Cart Page, Review Order, Order Placed — all show the silver can for missing images
- Verify loading spinners still work (they use `OhanaLoadingImage` or branding override, separate from product fallback)

## Implementation Notes
- Static resource: `ecomNoProductImage.png` (silver can with "IMAGE COMING SOON")
- `ecomProductPage.js`: `import defaultProductImage from '@salesforce/resourceUrl/ecomNoProductImage'`
- `ecomOrderPlaced.js`: `defaultImage = defaultProductImage` — wire handler must NOT overwrite this with loading logo
- `ecomHomeBody.js`: `product1Image` import changed to `ecomNoProductImage`
- `EcomBrandingController.getAllBrandingResources` provides org-level logo overrides via wire adapter
