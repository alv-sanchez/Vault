---
title: "Credit terms — Ph 1 + Ph 2 combined drafts (Gulf)"
type: "Story split (2 tickets)"
parent_epic: "BMS-3702 — Gulf E-Commerce & Ordering"
drafted_on: 2026-05-13
drafted_by: Alvaro Sanchez
related_drafts:
  - "[[BMS-3930-credit-terms-ph1-revised]]"
  - "[[credit-terms-ph2-ar-sync-invoice-list]]"
polish_notes:
  - "[[BMS-3930-credit-terms-polish-2026-05-13]]"
  - "[[BMS-3930-credit-terms-ph1-compact]]"
decisions_locked_in:
  - "Multi-entity = multiple Account records per retailer (option B)"
  - "Ph 1 = read view + manual AR entry; Ph 2 = AR sync + invoice list"
  - "Portal placement = dedicated Payment Status page"
  - "Ph 1 cuts Last Payment + Outstanding Invoices (moved to Ph 2)"
  - "Soft-UX banners in Ph 1, never hard-gating ordering"
open_for_refinement:
  - "Field API names (Credit__c collision: Credit_Line_* vs as-is)"
  - "Outstanding_Balance__c vs reuse Account_Balance__c"
  - "Banner + confirmation-screen copy (product + legal sign-off)"
  - "Payment_Status__c picklist treatment in Ph 2"
  - "Unlink BMS-3921 + BMS-3922 from BMS-3930's blocks list"
tags: [ticket, ecom, gulf, credit, draft, split, combined]
---

# Credit terms — Ph 1 + Ph 2 combined drafts

This file holds both halves of the BMS-3930 split in one place — convenient for reading side-by-side, refinement walk-through, or pasting into a single discussion. The split-out single-ticket versions are in:

- [[BMS-3930-credit-terms-ph1-revised]] — Ph 1 (existing BMS-3930, revised)
- [[credit-terms-ph2-ar-sync-invoice-list]] — Ph 2 (new ticket, not yet created in Jira)

---

# Ticket 1 — BMS-3930 (Ph 1, this sprint)

**Title:** Retailer credit terms display — Ph 1 read view (Gulf)
**Type:** Story · **Sprint:** 2 (2026-05-04 → 2026-05-15) · **Effort:** M (revised from L after split) · **Parent:** BMS-3702
**Jira:** https://ohanafy.atlassian.net/browse/BMS-3930
**Blocks (after cleanup):** BMS-3920 conditional · ~~BMS-3921~~ · ~~BMS-3922~~ (unlink at push)

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

## Technical notes (Ph 1)

- **Data model:** all 6 new fields go on `Account` in `OHFY-Data-Model`. No new custom object. Gulf-multi-entity is modelled as multiple `Account` records per retailer (decided 2026-05-13).
- **Adjacent existing fields** (decide reuse vs leave alone at refinement):
    - `Account.Payment_Terms__c` (picklist) → **source of "Credit Terms" display.** Reused as-is. No rename.
    - `Account.Account_Balance__c` → **open Q** whether to repurpose as `Outstanding_Balance__c` or leave alone and add a new field.
    - `Account.Total_Credits_Available__c` / `Total_Remaining_Credits__c` / `Total_Credits_Applied__c` → leave alone; these are rollups of OMS `Credit__c` (credit memos), unrelated to credit-line balance.
- **Field name collision risk:** `Credit__c` already exists as the OMS credit-memo object. The new fields' API names should disambiguate — recommended `Credit_Line_*` prefix. Final names confirmed at refinement.
- **Portal integration point:** extend `OHFY-Ecom/.../lwc/userDataService/userDataService.js` (already exposes `getAccountFields(recordId)` + `getCurrentUserId()`). New LWC for the Payment Status page sits over it. New Apex controller in OHFY-Ecom (`AccountCreditController` or similar) for the `@AuraEnabled` reads.
- **Multi-Account-per-retailer awareness:** build the Payment Status LWC so it accepts an `accountId` input (currently from `userDataService`'s default Account) — later, when a multi-Account picker LWC is built, this page drops underneath it without rework.

## Open questions (Ph 1)

1. Field API names: `Credit_Line_*` prefix (recommended) vs the un-prefixed names in the AC?
2. `Outstanding_Balance__c` (new) vs reuse `Account_Balance__c` (existing)?
3. Final banner copy + confirmation-screen copy for Pending / Cash Only / On Hold / Suspended — needs product + legal sign-off.
4. Confirm portal placement = dedicated Payment Status page (vs profile section / home widget).
5. **Unlink** BMS-3921 + BMS-3922 from the blocks list. Keep BMS-3920 only if Gulf wants ordering-guardrails based on credit; otherwise unlink it too.

## Readiness (Ph 1)

**GO for Sprint 2** once Qs 1–4 are answered. Estimate revises L → likely M after the Ph 2 cut (~5–6 day story).

---

# Ticket 2 — New Ph 2 ticket (future sprint)

**Title:** Retailer credit terms — Ph 2: AR sync, invoice list & payment history (Gulf)
**Type:** Story · **Sprint:** future · **Effort:** L (likely splittable once sync mechanism is chosen) · **Parent:** BMS-3702
**Jira:** *(not yet created)*
**Blocked by:** BMS-3930 (Ph 1)

## Description

Ph 1 (BMS-3930) ships the manual read view of credit terms — AR enters limit, balance, past-due, and status by hand; the portal displays them. **Ph 2 closes the loop** by automating the data flow from Gulf's AR system into Salesforce and expanding the Payment Status page with the invoice-level detail that retailers ask for once they see the summary.

Three workstreams in this story:

1. **AR-to-Salesforce sync.** Land payments and balance updates from Gulf's AR system into `Receipt__c` (object exists today in OHFY-Data-Model with `Account__c`, `Invoice__c`, `Amount__c`, `Date__c`, `Status__c`, `Entity__c`). Drive `Account.Outstanding_Balance__c` and `Account.Past_Due_Balance__c` from `Receipt__c` rollups + `Invoice__c.Payment_Status__c`, replacing the manual AR data entry from Ph 1. Cadence (real-time / hourly / nightly) decided with Gulf's integration team.
2. **Invoice-level breakdown on the Payment Status page.** Add an "Outstanding Invoices" section listing each unpaid invoice (`Invoice_Number__c`, `Invoice_Date__c`, `Payment_Due_Date__c`, `Invoice_Total__c`, derived Past Due flag, originating `Fulfillment_Location__c` name). Past-due invoices sort to the top with a distinct badge. Partially-paid invoices show original + remaining balance.
3. **Last Payment + history.** "Last Payment: $X on YYYY-MM-DD" line above the invoice list, sourced from the most recent `Receipt__c.Date__c` for the Account.

## Why it matters

Ph 1 deflects the three most common AR phone questions ("limit / balance / past-due?"). **Ph 2 deflects the follow-up calls** retailers make once they see the summary: "which invoices am I past due on?", "did my $5,000 wire post yet?", "what was my last payment?". It also retires the manual AR data-entry burden the Ph 1 design temporarily accepts.

## Acceptance Criteria

```gherkin
Scenario: Receipt__c records sync from Gulf's AR system
  Given Gulf's AR system posts a payment for a retailer Account
  When  the sync runs (cadence per integration team agreement)
  Then  a Receipt__c record is created in Salesforce with Account__c, Invoice__c, Amount__c, Date__c, Status__c, and Entity__c populated
  And   the corresponding Invoice__c.Payment_Status__c updates to 'Paid' or 'Partially Paid' as appropriate
  And   the Account's Outstanding_Balance__c and Past_Due_Balance__c recalculate to reflect the new state

Scenario: Outstanding_Balance and Past_Due_Balance are derived, not manually entered
  Given Ph 2 is live and the AR sync is operating
  When  AR staff view the Account detail page
  Then  Outstanding_Balance__c and Past_Due_Balance__c are read-only / system-maintained
  And   AR no longer enters these values manually
  And   a one-time data migration backfills these fields from existing Invoice__c + Receipt__c data on Ph 2 deploy

Scenario: Retailer views individual invoice payment statuses
  Given the retailer has 4 open invoices across the Mobile AL entity
  When  the retailer expands the "Outstanding Invoices" section on the Payment Status page
  Then  each invoice row displays: Invoice_Number__c, Invoice_Date__c, Payment_Due_Date__c, Invoice_Total__c, Payment_Status__c, and the originating Fulfillment_Location__c name
  And   invoices where Payment_Due_Date__c < TODAY() AND Payment_Status__c ∈ { Not Paid, Partially Paid } are flagged with a red "Past Due" badge
  And   past-due invoices sort to the top
  And   partially-paid invoices show both the original Invoice_Total__c and the remaining balance

Scenario: Retailer sees their last payment
  Given the retailer has at least one Receipt__c record on file
  When  they view the Payment Status page
  Then  a "Last Payment" line displays the most recent Receipt__c.Amount__c and Date__c (formatted as "Last Payment: $3,200.00 on 2026-05-28")
  And   if no payments are on file, the line is hidden rather than showing $0

Scenario: Recent payment is reflected within one sync cycle
  Given a retailer makes a $5,000 payment that is posted to Gulf's AR system
  When  the sync cycle completes
  Then  Outstanding_Balance__c decreases by $5,000 and Available_Credit__c increases by $5,000
  And   the corresponding Invoice__c.Payment_Status__c updates from 'Not Paid' to 'Paid' (or 'Partially Paid' for partial)
  And   the Last Payment line updates to reflect the $5,000 payment with the posting date
  And   if past-due invoices were paid off, Past_Due_Balance__c decreases accordingly
```

## Technical notes (Ph 2)

- **Sync mechanism:** depends on Gulf's AR system. Options to evaluate: REST callout (Named Credential + Apex), Salesforce-side scheduled batch pulling, or AR-system-side push via Platform Event / Connected App. **Recommend a separate spike ticket** before this story is started.
- **Picklist alignment:** the AC references `Payment_Status__c ∈ { Not Paid, Partially Paid }` and a derived "Past Due" flag. This matches the actual `Invoice__c.Payment_Status__c` values (`Not Paid, Paid, Partially Paid, Failed`) — no picklist extension required.
- **Derivation:** `Past_Due_Balance__c` becomes a rollup of `Invoice__c` records where `Payment_Due_Date__c < TODAY() AND Payment_Status__c IN ('Not Paid', 'Partially Paid')`. `Outstanding_Balance__c` becomes a rollup of all unpaid/partially-paid `Invoice__c` outstanding amounts for the Account.
- **Multi-Account picker:** if it lands before Ph 2, the invoice list LWC inherits the `accountId` input cleanly.

## Open questions (Ph 2)

1. AR-system sync mechanism + cadence — needs Gulf integration team spike.
2. Migration plan for the Ph 1 manually-entered Outstanding_Balance / Past_Due values when Ph 2 takes over.
3. Per-invoice "remaining balance" — does `Invoice__c` already carry a formula for that, or is it derived in the LWC?
4. Does Ph 2 also introduce digital invoice PDF download, or is that another story?

## Readiness (Ph 2)

**Cannot be started until** (a) BMS-3930 Ph 1 is in flight or done, and (b) Gulf integration team confirms the AR sync mechanism. Recommend a separate sync-mechanism spike ticket before Ph 2 starts.

---

# Pushing to Jira (when ready)

1. **Update BMS-3930 in place** with Ticket 1 above — title rename to "Retailer credit terms display — Ph 1 read view (Gulf)", replace description + ACs, append audit-trail comment referencing these polish notes.
2. **Create new Jira ticket** from Ticket 2 above — title "Retailer credit terms — Ph 2: AR sync, invoice list & payment history (Gulf)", parent BMS-3702, blocked-by BMS-3930.
3. **Unlink** BMS-3921 + BMS-3922 from BMS-3930's blocks list. BMS-3920 conditional on the credit-aware-ordering decision.
4. **Re-estimate** BMS-3930 from L → M after the Ph 2 cut.
