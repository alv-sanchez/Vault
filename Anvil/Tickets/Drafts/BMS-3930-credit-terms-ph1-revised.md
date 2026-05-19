---
ticket: BMS-3930
title: "Retailer credit terms display — Ph 1 read view (Gulf)"
type: Story
parent_epic: "BMS-3702 — Gulf E-Commerce & Ordering"
status: "Ready for refinement"
sprint: "Sprint 2 (2026-05-04 → 2026-05-15)"
effort: M
package: OHFY-Ecom + OHFY-Data-Model
drafted_on: 2026-05-13
drafted_by: Alvaro Sanchez
jira: https://ohanafy.atlassian.net/browse/BMS-3930
polish_notes:
  - "[[BMS-3930-credit-terms-polish-2026-05-13]]"
  - "[[BMS-3930-credit-terms-ph1-compact]]"
blocks:
  - "BMS-3920 (conditional — only if credit-aware ordering is decided)"
unlink_at_push:
  - "BMS-3921"
  - "BMS-3922"
tags: [ticket, ecom, gulf, credit, ph1, draft]
---

# BMS-3930 — Retailer credit terms display — Ph 1 read view (Gulf)

## Description

Gulf's AR team fields daily calls from retailers asking three questions: "what's my credit limit," "what's my balance," and "am I past due." The e-commerce portal today shows none of this — every question routes through AR.

This **Ph 1** story ships the thinnest usable read view: new credit fields on `Account`, populated manually by AR; a Payment Status page in the portal surfacing those fields plus a status badge; and soft-UX messaging for retailers who are not yet credit-approved.

Gulf operates as multiple legal entities (Milton FL, Mobile AL, etc.) — a single retailer can trade with more than one. The e-commerce model represents each retailer-entity pair as **its own `Account` record**, so the new credit fields live on `Account` directly. A retailer's Contact / portal user may be tied to multiple `Account` records; the multi-Account picker UX is downstream of this story and out of scope. Ph 1's Payment Status page renders the **currently-selected Account's** credit data.

**Out of Ph 1 (lands in Ph 2):**

- AR-to-Salesforce sync into `Receipt__c` — Ph 1's `Outstanding_Balance__c` is entered manually by AR
- Outstanding invoices list on the Payment Status page
- "Last Payment" line
- Per-invoice past-due derivation
- Real-time balance refresh
- Payment methods / PDFs

## Why it matters

- **AR call deflection.** "What's my limit / balance / past due" is the most common AR phone question. A self-service view retires it immediately and puts Gulf on par with retailers' self-service expectations from other distributors.
- **New-retailer onboarding visibility.** Today a retailer in credit review has no portal signal that anything is happening on their account — they either call their rep or silently churn. A banner + distinct order-confirmation message sets expectations without a payments rebuild.
- **Foundation for credit-aware ordering.** Even without hard-gating in Ph 1, having `Credit_Status__c` and `Credit_Limit__c` on `Account` (and surfaced in the portal) is the foundation that downstream credit-aware behaviors (cart warnings, cash-only messaging, past-due reminders) will all build on.

## Acceptance Criteria

```gherkin
Scenario: Account carries the credit summary fields
  Given a retailer Account in Salesforce
  When  an admin views the Account detail page
  Then  the Account shows the following new fields (all new, none exist today):
        - Credit Limit  (Currency — manually set by AR in Ph 1)
        - Outstanding Balance  (Currency — manually set by AR in Ph 1)
        - Available Credit  (Formula: Credit Limit − Outstanding Balance)
        - Past Due Balance  (Currency — manually set by AR in Ph 1)
        - Credit Status  (Picklist: Approved, Pending Approval, Suspended, On Hold, Cash Only)
        - Credit Last Reviewed  (Date)
  And   AR users can edit Credit Limit, Outstanding Balance, Past Due Balance, Credit Status, Credit Last Reviewed
  And   Portal users can only read these fields — never write
  And   the field API names are confirmed at refinement (recommendation: prefix with Credit_Line_* to disambiguate from the existing OMS Credit__c object)

Scenario: Existing Account.Payment_Terms__c is the source for displayed credit terms
  Given a retailer Account has Payment_Terms__c = 'Net 30'
  When  the Payment Status page renders
  Then  the page displays Credit Terms = 'Net 30' sourced from Account.Payment_Terms__c
  And   no new picklist is introduced for credit terms in Ph 1

Scenario: Approved retailer sees their credit summary on the Payment Status page
  Given a retailer with Credit Status = Approved, Credit Limit = $25,000, Outstanding Balance = $8,400
  When  they visit the Payment Status page in the portal
  Then  the page shows Credit Terms, Credit Limit, Outstanding Balance, Available Credit, Past Due Balance, and an Approved status badge
  And   Available Credit displays as $16,600
  And   the page is reachable from the account / profile menu in the portal nav

Scenario: Pending Approval retailer sees guidance, not numbers
  Given a retailer has Credit Status = Pending Approval and no Credit Limit set yet
  When  they visit the Payment Status page
  Then  a neutral "Pending Approval" badge is shown
  And   Credit Limit, Available Credit, and Outstanding Balance rows display "Not yet assigned" rather than $0
  And   a message reads "Your credit application is under review. Contact your Gulf sales representative for status updates."

Scenario: Pending / Cash Only / On Hold / Suspended retailers get a portal-wide banner
  Given a retailer has Credit Status ∈ { Pending Approval, Cash Only, On Hold, Suspended }
  When  they land on any page in the portal
  Then  a persistent banner displays status-appropriate messaging
  And   the banner never blocks navigation — the retailer can still browse and place orders
  And   clicking the banner deep-links to the Payment Status page for full context

Scenario: Order placed by a retailer in credit review carries distinct confirmation messaging
  Given a retailer has Credit Status ∈ { Pending Approval, Cash Only, On Hold }
  When  they complete the checkout flow and reach the order-confirmation screen
  Then  the confirmation screen shows the retailer their order was received
  And   an explicit message reads "Your account is under credit review — your Gulf sales representative will confirm terms before your order is released for delivery"
  And   the same messaging is preserved in any order-confirmation email that is sent

Scenario: Past-due retailer sees a warning on the Payment Status page (Ph 1)
  Given a retailer has Past_Due_Balance__c > $0
  When  they view the Payment Status page
  Then  a warning banner shows "You have $X past due" with X = the Past_Due_Balance__c value
  And   the styling is distinct from the informational Pending / Cash Only / On Hold banners
  And   no per-invoice breakdown is shown in Ph 1 — that ships with the Ph 2 invoice list

Scenario: Credit data is scoped — one retailer cannot see another's
  Given a retailer is logged into the portal and their Contact is tied to one or more Account records
  When  the Payment Status page loads for an Account
  Then  the page only returns credit data for that Account
  And   attempting to view another Account's credit data (via URL manipulation or API) returns no data unless the Contact is also tied to that Account
  And   an automated test protects this boundary

Scenario: Admin permissions are explicit
  Given the permission sets for Community User and internal AR
  When  permissions are reviewed
  Then  the Community User permission set grants read-only on all new credit fields
  And   the AR permission set grants edit on Credit Limit, Outstanding Balance, Past Due Balance, Credit Status, Credit Last Reviewed
  And   Available Credit is a formula — no edit permission needed or granted
```

## Technical notes

- **Data model:** all 6 new fields go on `Account` in `OHFY-Data-Model`. No new custom object. Gulf-multi-entity is modelled as multiple `Account` records per retailer (decided at refinement 2026-05-13).
- **Adjacent existing fields** (decide reuse vs leave alone at refinement):
    - `Account.Payment_Terms__c` (picklist) → **source of "Credit Terms" display.** Reused as-is. No rename.
    - `Account.Account_Balance__c` → **open Q at refinement** whether to repurpose as `Outstanding_Balance__c` or leave alone and add a new field.
    - `Account.Total_Credits_Available__c` / `Total_Remaining_Credits__c` / `Total_Credits_Applied__c` → leave alone; these are rollups of OMS `Credit__c` (credit memos), unrelated to credit-line balance.
- **Field name collision risk:** `Credit__c` already exists as the OMS credit-memo object. The new fields' API names should disambiguate — recommended `Credit_Line_*` prefix. Final names confirmed at refinement.
- **Portal integration point:** extend `OHFY-Ecom/.../lwc/userDataService/userDataService.js` (already exposes `getAccountFields(recordId)` + `getCurrentUserId()`). New LWC for the Payment Status page sits over it. New Apex controller in OHFY-Ecom (`AccountCreditController` or similar) for the `@AuraEnabled` reads.
- **Multi-Account-per-retailer awareness:** build the Payment Status LWC so it accepts an `accountId` input (currently from `userDataService`'s default Account) — later, when a multi-Account picker LWC is built, this page drops underneath it without rework.

## Open questions for refinement

1. Field API names: `Credit_Line_Limit__c` / `Credit_Line_Status__c` / `Credit_Line_Available__c` / `Credit_Line_Last_Reviewed__c` (recommended) vs the un-prefixed names in the AC?
2. `Outstanding_Balance__c` (new) vs reuse `Account_Balance__c` (existing)?
3. Final banner copy + confirmation-screen copy for Pending / Cash Only / On Hold / Suspended — needs product + legal sign-off.
4. Confirm portal placement = dedicated Payment Status page (vs profile section / home widget).
5. **Unlink** BMS-3921 + BMS-3922 from the blocks list (unrelated to credit display). Keep BMS-3920 link only if Gulf wants ordering-guardrails based on credit; otherwise unlink it too.

## Readiness

**GO for Sprint 2** once Qs 1–4 are answered. Estimate revises from L → likely M after the Ph 2 cut (~5–6 day story).
