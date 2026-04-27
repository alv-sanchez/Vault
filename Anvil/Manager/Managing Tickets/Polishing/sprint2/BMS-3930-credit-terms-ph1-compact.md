---
ticket: BMS-3930
title: "Retailer credit terms display — Ph 1 (Gulf)"
type: Story
parent_epic: "BMS-3702 — Gulf E-Commerce & Ordering"
status: "Needs Refinement"
sprint: "Sprint 2 (2026-05-02 → 2026-05-15)"
polished_on: 2026-04-23
polished_by: Alvaro Sanchez
jira: https://ohanafy.atlassian.net/browse/BMS-3930
tags: [polish, ecom, gulf, credit, ar, ph1, needs-decisions]
---

# BMS-3930 — Jira-Ready (Ph 1 compact)

**Title:** Retailer credit terms display — Ph 1 (Gulf)

## Description

Gulf's AR team fields daily calls from retailers asking three questions: "what's my credit limit", "what's my balance", and "am I past due". Today the e-commerce portal shows none of this — retailers have no self-service window into their own account, so every question routes through AR.

This Ph 1 story ships the thinnest usable credit display and the soft-UX treatment for retailers who are not yet credit-approved. It is deliberately scoped to the smallest deliverable that retires call volume:

- **New credit fields on Account**, populated manually by AR in Ph 1. No ERP integration, no aging buckets, no invoice list, no payment history, no PDFs. Those land in Ph 2 once the ERP contract is signed and the data source for real-time balance is agreed.
- **A dedicated Payment Status page** in the portal surfacing the Ph 1 fields plus a status badge (Approved / Pending Approval / Suspended / On Hold / Cash Only).
- **Soft-UX for retailers not yet credit-approved**. Without real-time payment collection in the portal, there is no meaningful way to hard-gate ordering for pending / cash-only accounts — there will always be a gap between a retailer placing an order and cash being handed to the delivery driver. Ph 1 does not attempt a hard gate. Instead it ships a portal banner and a distinct order-confirmation message that make the credit-review state unmistakable. Hard-gating can be revisited when payment collection exists in the portal.

Ph 2 (ERP sync, aging buckets, invoice list, PDFs, payment methods) is a separate sprint's work and is out of scope here.

## Why it matters

- **AR call volume.** "What's my limit / balance / past-due" is the single most common reason retailers call AR. Surfacing it self-service is the cheapest possible reduction of that volume and puts Gulf on par with the self-service expectation retailers already have from other distributors.
- **New-retailer onboarding lag.** Today a retailer in credit review has no signal in the portal that anything is happening on their account. They either call their rep or silently churn. A banner + distinct confirmation language sets expectations without requiring a payments rebuild.
- **Foundation for credit-aware ordering.** Even without hard-gating in Ph 1, having `Credit_Status__c` on Account and surfaced in the portal is the foundation every downstream credit-aware behaviour (cart warnings, cash-only messaging, past-due reminders) will build on.

## Acceptance Criteria

```gherkin
Scenario: Account carries the credit summary fields
  Given a retailer Account in Salesforce
  When  an admin views the Account detail page
  Then  the Account shows the following new fields (all new, none exist today):
        - Credit Limit  (Currency — manually set by AR)
        - Outstanding Balance  (Currency — manually set by AR in Ph 1)
        - Available Credit  (Formula: Credit Limit − Outstanding Balance)
        - Past Due Balance  (Currency — manually set by AR in Ph 1)
        - Credit Status  (Picklist: Approved, Pending Approval, Suspended, On Hold, Cash Only)
        - Credit Last Reviewed  (Date)
  And   AR users can edit Credit Limit, Outstanding Balance, Past Due Balance, Credit Status, Credit Last Reviewed
  And   Portal users can only read these fields — never write

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

Scenario: Pending / Cash Only / On Hold retailers get a portal-wide banner
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

Scenario: Past-due retailer sees a warning on the Payment Status page
  Given a retailer has Past Due Balance > $0
  When  they view the Payment Status page
  Then  a warning banner shows "You have $X past due" with X = the Past Due Balance value
  And   the styling is distinct from the informational Pending / Cash Only / On Hold banners so retailers can distinguish review state from delinquency

Scenario: Credit data is scoped — one retailer cannot see another's
  Given a retailer is logged into the portal
  When  the Payment Status page loads
  Then  the page only returns credit data for the retailer's own Account
  And   attempting to view another account's credit data (via URL manipulation or API) returns no data
  And   an automated test protects this boundary

Scenario: Admin permissions are explicit
  Given the permission sets for Community User and internal AR
  When  permissions are reviewed
  Then  the Community User permission set grants read-only on all new credit fields
  And   the AR permission set grants edit on Credit Limit, Outstanding Balance, Past Due Balance, Credit Status, and Credit Last Reviewed
  And   Available Credit is a formula — no edit permission needed or granted
```

---

## Open questions to resolve at refinement

1. **Field naming** — align on `Outstanding_Balance__c` vs `Account_Balance__c`. Your earlier proposal said the latter in the formula; polish recommends the former. Pick one so Ph 2 doesn't have to rename.
2. **Balance data source in Ph 1** — manual only, or allow a rollup from the `Order__c` owning package if it exposes `Payment_Status__c`? Leaning **manual only** for Ph 1 so the story doesn't take on a cross-package dependency.
3. **Ph 1 screen trim** — keep or cut "Last Payment" and "Outstanding Invoices" from Ph 1? Leaning **cut both**; Ph 2 hosts them with real ERP data. Today's codebase has no `Payment__c` or `Invoice__c` objects, so either would need net-new plumbing and a questionable data source.
4. **Portal placement** — dedicated Payment Status page vs. section on the profile page vs. widget on the home page. Leaning **dedicated page** so the pending / suspended / on-hold banners have room to breathe.
5. **Exact banner + confirmation-screen copy** for Pending / Cash Only / On Hold / Suspended — needs product + legal sign-off on wording before the story closes.
6. **"Blocks 13 tickets" link set** — mostly mis-scoped on the current Jira. Only cart-submit gating tickets genuinely depend on Credit_Status__c. Unlink the rest at refinement.

## Readiness

**GO for Sprint 2** once questions 1–5 are answered. Ph 1 stays a ~5-6 day story even after integrating the banner + confirmation-screen messaging — those are two small additions on top of the Payment Status page, not a separate workstream. Ph 2 (ERP sync, aging, invoice list, PDFs, payment methods) is a separate future story, not a splittable-right-now chunk of this one.
