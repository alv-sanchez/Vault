---
ticket: BMS-4049
jira: https://ohanafy.atlassian.net/browse/BMS-4049
status: Ready for Jira (pending final approval)
---

# BMS-4049 — Cart & Checkout with Gulf Pricing — Spike: Architecture Discovery

**Type:** Story (Spike) · **Time-box:** 5 working days · **Output:** design doc + decision log + follow-up tickets

**Story Statement:**

As a Gulf engineering team, we want a time-boxed spike that validates the cart-to-checkout path in OHFY-Ecom (`draftInvoiceService` + `CartController` + `Order__c` from OHFY-CORE) and decides how Gulf's multi-layer pricing and multi-entity tax will be handled, so that BMS-3928 (Cart & Checkout with Gulf Pricing) starts from a validated architecture grounded in existing code.

**Why It Matters:**

Gulf's requirements (multi-layer pricing, multi-entity FL/AL tax, warehouse-scoped catalog) will amplify any ambiguity if we start implementation without resolving these.

**Gulf Context:**
- FL and AL overlapping-but-distinct product catalogs
- Multi-layer pricing (frontline / volume tier / promotional / chain-specific)
- Multi-entity tax (FL vs AL), not just zip-based

**Current State (2026-04-17, per codebase scan):**
- `draftInvoiceService.js` imports `initializeDraftInvoice`, `onInvoiceItemChange`, `updateDraftInvoice`, `confirmDrafts_ECOM` from `@salesforce/apex/EcomWrappers` — **class does not exist in OHFY-Ecom**.
- `CartController.cls` has both `Cart__c`/`Cart_Item__c` (legacy local) and `Order__c`/`Order_Item__c` (OHFY-CORE draft) paths.
- Pricing today = static pricelist lookups via `CartController.getFilteredRecords` + cached in `userDataService.js`. No waterfall, no external callout. Promotions cached but not applied.
- Tax today = state-based via `Tax_Authority__c` by `State_Code__c`. Not entity-aware.
- Fulfillment handle = `Order__c.Fulfillment_Location__c` (no `Warehouse__c` field).
- No pricing-engine Named Credential. Only Twilio exists.

**Out of Scope:**
- Writing production code (prototype + ADR only)
- Front-end refactor of `ecomShop` / `ecomCartPage` / `ecomProductPage`
- OHFY-CORE schema changes (identify, don't implement)

**Acceptance Criteria:**

```gherkin
Scenario: Resolve the EcomWrappers / draft invoice Apex gap
  Given draftInvoiceService.js imports initializeDraftInvoice, onInvoiceItemChange,
        updateDraftInvoice, and confirmDrafts_ECOM from @salesforce/apex/EcomWrappers
  When  the spike owner searches OHFY-CORE for this class
  Then  the design doc captures whether EcomWrappers exists in OHFY-CORE,
        needs to be built in OHFY-Ecom, or should be renamed to match an existing
        class (e.g., QA_DraftInvoiceController)
  And   a follow-up ticket is filed for whichever action is required before
        BMS-3928 can run end-to-end

Scenario: Decide cart data model (Cart__c vs Order__c)
  Given CartController currently uses both Cart__c/Cart_Item__c and Order__c/Order_Item__c
  When  the spike owner documents trade-offs
  Then  a decision is recorded — pick one, deprecate the other — with rationale
        and impact on existing LWCs (ecomCartPage, ecomReviewSummary, etc.)

Scenario: Confirm where Gulf pricing resolution lives
  Given Gulf requires frontline / volume tier / promotional / chain-specific layering
  When  the spike owner audits OHFY-CORE and asks Gulf stakeholders whether
        pricing is in-Salesforce or external
  Then  the doc records one of:
        - "OHFY-CORE has class X that handles the waterfall; extend/reuse"
        - "External service; define API contract (inputs, outputs, SLA, retry)"
        - "Net new in-Salesforce engine; propose design and placement"

Scenario: Tax dispatch strategy for FL vs AL
  Given today's CartController.addDraftItems uses Account.ShippingState +
        Tax_Authority__c(State_Code__c)
  When  the spike owner evaluates dispatch keys
  Then  the doc picks one: Account.ShippingState, Location__c.State__c,
        Territory FK, or a new Entity__c concept
  And   proposes a service boundary (e.g., S_TaxCalculation / TaxService in
        OHFY-CORE) and identifies any new metadata needed

Scenario: Pricing snapshot decision
  Given pricelist values can change after an order is placed
  When  the spike owner compares approaches
  Then  the doc recommends one of:
        - Long-text JSON field (Pricing_Snapshot__c)
        - Relational snapshot (per-line Pricing_Code__c + Promotion__c FK + captured adjustments)
        - No snapshot; rely on invoice/order history
        with rationale + downstream cost

Scenario: Spike output handoff
  Given the design doc is complete in /docs or Obsidian
  When  the architect and BMS-3928 assignee review
  Then  both sign off OR request concrete revisions
  And   every required prerequisite schema/code change is ticketed before
        BMS-3928 is scheduled
```

**Open Questions for Refinement:**
1. Is Gulf pricing waterfall in-Salesforce (OHFY-CORE Apex) or a planned external service?
2. Is OHFY-CORE repo accessible for this spike, or OHFY-Split?
3. Tax dispatch key: state, location, territory, or new `Entity__c`?
4. Gulf stakeholder confirm: is tax truly multi-entity or multi-state in practice?

**Labels:** `spike`, `decision-needed`
