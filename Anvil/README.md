# Anvil — E-Commerce Workboard

## Structure

```
Anvil/
  Tickets/                          <- Jira ticket write-ups
    Drafts/                         <- Not yet created in Jira
      DRAFT-XXX-description.md
    Created Tickets/                <- Created in Jira, has BMS number
      BMS-XXXX-description.md
  Testing Notes/                    <- QA testing notes (copied into Jira QA tab)
    BMS-XXXX.md
  Documentation/                    <- Living docs per Experience Cloud page/feature
    home-page.md                      (not per ticket — tickets accumulate here)
    shop-page.md
    registration.md
    ...
  Templates/                        <- Reusable templates for each type
    ticket-template.md
    testing-template.md
    documentation-template.md
```

## Naming Convention

- **Drafts**: `DRAFT-XXX-short-description.md` — no Jira ticket yet
- **Created Tickets**: `BMS-XXXX-short-description.md` — has a Jira ticket number
- **Testing Notes**: `BMS-XXXX.md` — ticket number only
- **Documentation**: `feature-name.md` — one file per Experience Cloud page or backend service

## Linking

Tickets and testing notes link to their counterparts:

```
## Related
- Ticket: [[BMS-XXXX-description]] (in Tickets/Created Tickets/)
- Testing: [[BMS-XXXX]] (in Testing Notes/)
- Jira: https://ohanafy.atlassian.net/browse/BMS-XXXX
```

Documentation files link to the tickets that touch them via `## Related Tickets` and track changes in a `## Changelog` table at the bottom.

Obsidian backlinks connect everything automatically.

## Workflow

See [[workflow-diagram]] for the visual flowchart.

### 1. Draft Tickets
1. **Draft ticket** written to `Tickets/Drafts/DRAFT-XXX-description.md`
2. **Review + approve** the draft in Obsidian

### 2. Push Tickets to Jira (First)
3. **Create in Jira** via Atlassian MCP tools — get BMS numbers
4. **Move to Created Tickets** and rename `BMS-XXXX-description.md` with Jira link

### 3. Testing Notes & Documentation
5. **Write testing notes** to `Testing Notes/BMS-XXXX-description.md` referencing real BMS tickets
6. **Update documentation** — find the relevant page doc in `Documentation/` (e.g., `shop-page.md`), add ticket to `## Related Tickets`, update features, add row to `## Changelog`

### 4. Push Notes & Docs
7. **Push testing notes** to Jira QA tab via MCP
8. **Push documentation** to Confluence release notes pages via MCP

### Key Rule
- **Tickets** are per-work-item (one ticket = one `.md` in `Tickets/`)
- **Documentation** is per-experience (one page = one `.md` in `Documentation/`)
- When a new ticket lands, update the existing page doc — don't create a new one

## Documentation Index

| File | Experience / Feature |
|---|---|
| `home-page.md` | Home page — hero, categories, featured products, recent orders |
| `shop-page.md` | Shop page — product grid, search, filters, pagination, promotions |
| `product-page.md` | Product detail — info, images, promotions panel, nudge |
| `cart-page.md` | Cart — items, promotion flags, savings summary |
| `review-checkout.md` | Review & checkout — delivery dates, submit order |
| `order-placed.md` | Order confirmation — order details, email notice |
| `order-history.md` | Order history — orders list, reorder modal, stock check |
| `registration.md` | Self-registration — business search, user details, SMS opt-in |
| `support-page.md` | Support — FAQs |
| `profile-page.md` | Profile/settings — contact info, business details |
| `promotions-page.md` | Promotions listing |
| `navigation-header.md` | Navigation — delivery banner, search, cart badge |
| `notification-services.md` | Backend — ACR, order confirmation, Twilio, preferences |
| `shared-services.md` | Backend — userDataService, draftInvoiceService, utils |
| `admin-backend.md` | Backend — flows, Apex-only features |

## Current Tickets

| BMS | Title | Jira |
|---|---|---|
| BMS-4048 | Quick Fixes: Registration ZIP, Account Search, Delivery Banner | [Link](https://ohanafy.atlassian.net/browse/BMS-4048) |
| BMS-4066 | Support Page Overhaul: FAQ Updates, Remove Contact Support | [Link](https://ohanafy.atlassian.net/browse/BMS-4066) |
| BMS-4068 | Order Placed Page Cleanup: Remove Unimplemented Elements | [Link](https://ohanafy.atlassian.net/browse/BMS-4068) |
| BMS-4069 | Shop by Category Carousel & Pagination Dropdown Fix | [Link](https://ohanafy.atlassian.net/browse/BMS-4069) |
| BMS-4070 | Default Product Image & TBM Branding Updates | [Link](https://ohanafy.atlassian.net/browse/BMS-4070) |
| BMS-4071 | Self-Registration: SMS Opt-In & Conditional License | [Link](https://ohanafy.atlassian.net/browse/BMS-4071) |
| BMS-4072 | Delivery Cutoff Banner: Dynamic Time & Auto-Hide | [Link](https://ohanafy.atlassian.net/browse/BMS-4072) |
| BMS-4073 | Notification Services: Abandoned Cart Reminder & Order Confirmation | [Link](https://ohanafy.atlassian.net/browse/BMS-4073) |
| BMS-4074 | Reorder Modal: Stock Availability Check & Out of Stock Section | [Link](https://ohanafy.atlassian.net/browse/BMS-4074) |
| BMS-4075 | Fix Delete Abandoned Draft Invoices Flow: Exclude E-Commerce Carts | [Link](https://ohanafy.atlassian.net/browse/BMS-4075) |
| BMS-4076 | Promotions v2: Shop, Product Page & Cart Page Integration | [Link](https://ohanafy.atlassian.net/browse/BMS-4076) |


Fixing this issue
![[Screenshot 2026-04-09 at 1.14.47 PM.png]]![[Screenshot 2026-04-13 at 3.50.08 PM.png]]