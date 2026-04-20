---
ticket: BMS-3926
jira: https://ohanafy.atlassian.net/browse/BMS-3926
status: Ready for Jira (pending final approval)
---

# BMS-3926 — Retailer account registration & onboarding flow

> **⚠ Note on scope:** This ticket is intentionally being refined as a single umbrella story for now. It's an epic's worth of scope in practice — **plan to split into children (3926a–e)**: (a) registration form completeness, (b) address validation + territory/location auto-assign, (c) payment method capture (coordinate with BMS-3930), (d) sales rep approval + matching rules, (e) registration drafts + expiry. Keeping as one while we align on payment provider + approval model decisions.

**Story Statement:**

As a Gulf Retailer (e.g., a 7-Eleven FL location), I want a self-service registration & onboarding flow in the Gulf portal, so that I can go from first visit to an active, pricing-code-assigned, route-associated account without manual sales rep setup.

**Why It Matters:**

Gulf's current manual onboarding is the primary source of onboarding error: wrong pricing code selected, wrong payment terms applied, wrong route assigned. With 150+ pricing code structures and multi-entity AR, a self-service flow with validation + approval removes the keying errors and shortens the time-to-first-order.

**Current State (2026-04-17, per codebase scan):**
- A 3-step `ecomRegister` LWC exists: (1) business search by name + zip, (2) user details, (3) confirmation. Backed by `RegisterController.searchAccounts` and `RegisterController.registerUser`. Creates Contact + Community User directly.
- `Account` has a `Payment_Method` picklist field (not a related object). **No `Status__c`, no `Source__c` on Account.**
- No approval process, no matching rules, no registration drafts, no territory/warehouse auto-assign, no address validation.
- OHFY uses `Pricelist__c` / `Pricelist_Item__c` / `Pricelist_Account__c`.
- No payment provider integration exists. Tokenization is net-new.
- `Route__c` association likely lives in OHFY-CORE — to be confirmed.

**Out of Scope:**
- Payment provider selection + integration (decision needed first; coordinate with BMS-3930).
- License / resale-certificate upload (follow-up ticket).
- Dark-mode variant of the registration UI.

**Acceptance Criteria:**

```gherkin
Scenario: Extend ecomRegister from 3 steps to 4 (add payment step)
  Given the existing ecomRegister LWC has 3 steps (search, details, confirm)
  When  the new flow is deployed
  Then  a 4th step "Payment Method" appears between details and confirm
  And   the existing 3 steps continue to function (regression guard)
  And   RegisterController public methods remain backward-compatible

Scenario: Retailer completes registration with required business fields
  Given a retailer accesses the Gulf portal registration page
  When  they submit business details (legal name, DBA, ShippingAddress, phone,
        business type, alcohol license if required)
  Then  a new Account is created with Status__c = 'Pending Approval'
  And   Source__c = 'E-Commerce Portal'
  And   the Contact + Community User are created and linked
  And   the retailer sees a confirmation with expected 2-business-day SLA

Scenario: Data migration for existing Accounts when Status__c / Source__c are added
  Given Accounts exist today without Status__c or Source__c
  When  the new fields are deployed
  Then  existing Accounts default to Status__c = 'Active' and Source__c = 'Direct'
        (or equivalents), preserving current behavior

Scenario: Address validates and auto-assigns Fulfillment_Location__c
  Given the retailer has entered a ShippingAddress
  When  the address is validated against the configured provider/service territory
  Then  the nearest Location__c is auto-assigned as the Account's default
        Fulfillment_Location__c
  And   out-of-territory addresses are rejected with a clear message
        pointing the retailer to a sales contact

Scenario: Payment method captured and tokenized
  Given the retailer is on the payment step
  When  they choose ACH, Check, or Credit Card and submit
  Then  sensitive details are tokenized via the selected provider (never stored raw)
  And   a masked reference is persisted (field or related object — TBD based on
        payment-object decision; see Open Questions)
  And   Is_Default__c = true for the primary method

Scenario: Sales rep approval workflow
  Given an Account is in Status__c = 'Pending Approval'
  When  an approver (territory sales rep) reviews and approves
  Then  Status__c transitions to 'Active'
  And   Pricelist_Account__c junctions are created for the Account's
        assigned pricelist(s)
  And   Route__c association is set
  And   the retailer is emailed that their account is active

Scenario: Out-of-territory rejection
  Given a retailer submits a ShippingAddress outside Gulf's FL/AL territories
  When  territory validation runs
  Then  registration is rejected
  And   the retailer sees a message with a sales contact path
  And   a Registration_Attempt__c record is created with a rejection Reason__c

Scenario: Duplicate retailer detection
  Given a retailer starts registration
  When  the submitted legal name + zip (and/or license number if required) match
        an existing Account within matching-rule tolerance
  Then  the flow surfaces "we may already have an account for you" with a
        sales-contact path instead of creating a duplicate

Scenario: Incomplete registration saved as draft
  Given a retailer abandons registration partway through
  When  they return within 30 days using the same email
  Then  they resume from their last completed step
  And   drafts are purged after 30 days by a scheduled job

Scenario: Existing ecomRegister flow continues to work post-change (regression)
  Given the legacy 3-step entry points are still referenced from the portal
  When  a retailer completes registration without reaching new fields/steps
  Then  the Contact + Community User are still created successfully
  And   no existing consumer of RegisterController breaks
```

**Technical Approach:**
1. **Extend, don't replace:** Build on existing `ecomRegister` LWC + `RegisterController`. Add a 4th step and additional controller methods.
2. **Account schema:** Add `Status__c` (picklist: Pending Approval / Active / Rejected / Inactive) and `Source__c` (picklist incl. 'E-Commerce Portal', 'Direct'). Ship migration script to backfill existing records.
3. **Location auto-assign:** Populate `Account.Fulfillment_Location__c` via territory match (provider TBD). Reject out-of-territory.
4. **Payment method:** Decide object vs. picklist expansion (see Open Questions). Integrate with provider chosen in BMS-3930 alignment.
5. **Approval:** Salesforce Approval Process on Account transition from Pending Approval → Active, with territory-sales-rep routing.
6. **Matching Rules:** Duplicate detection on legal name + zip (+ license if applicable).
7. **Drafts:** New `Registration_Draft__c` with scheduled batch expiring >30 days. Or Platform Cache + localStorage — decide in implementation.
8. **Audit:** `Registration_Attempt__c` captures rejected / abandoned attempts with `Reason__c`.

**Open Questions for Refinement:**
1. **Payment provider**: which (Stripe, Rainforest, Salesforce Payments, NetTerms/Billd)? Is BMS-3930 (https://ohanafy.atlassian.net/browse/BMS-3930) the integration vehicle?
2. **Approval routing**: territory sales rep, regional manager, or centralized onboarding?
3. **`Status__c` / `Source__c`**: add new to OHFY-Ecom, or do they already exist in OHFY-CORE?
4. **Address validation**: third-party (SmartyStreets/Google/Experian) or simple state-code gate?
5. **Pricing code auto-assign vs. manual**: drives whether approval can be fully auto-pilot or always human.
6. **License docs upload**: at registration or deferred? Storage + approval flow?
7. **Multi-entity AR handoff**: what does the downstream AR reconciliation look like concretely (Flow / integration / email)?
8. **Payment method model**: keep `Payment_Method` picklist on Account (expand values) vs. introduce `Payment_Method__c` relational object (enables multiple methods + masked details)?

**Labels:** `refinement-needed`, `scope-concern`

**Estimate:** Not to be pointed until split.
