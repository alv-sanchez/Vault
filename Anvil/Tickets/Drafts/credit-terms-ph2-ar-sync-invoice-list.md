---
ticket: (new — to be created)
title: "Retailer credit terms — Ph 2: AR sync, invoice list & payment history (Gulf)"
type: Story
parent_epic: "BMS-3702 — Gulf E-Commerce & Ordering"
status: "Backlog (awaiting Gulf AR integration spike)"
sprint: "Future (after BMS-3930 Ph 1 lands)"
effort: L (likely splittable once sync mechanism is chosen)
package: OHFY-Ecom + OHFY-Data-Model + OHFY-OMS
drafted_on: 2026-05-13
drafted_by: Alvaro Sanchez
blocked_by:
  - "BMS-3930 (Ph 1 read view + Account credit fields)"
related_polish:
  - "[[BMS-3930-credit-terms-polish-2026-05-13]]"
tags: [ticket, ecom, gulf, credit, ph2, draft, integration]
---

# Ph 2 — Retailer credit terms: AR sync, invoice list & payment history (Gulf)

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

## Technical notes

- **Sync mechanism:** depends on Gulf's AR system. Options to evaluate: REST callout (Named Credential + Apex), Salesforce-side scheduled batch pulling, or AR-system-side push via Platform Event / Connected App. **Recommend a separate spike ticket** before this story is started.
- **Picklist alignment:** the AC references `Payment_Status__c ∈ { Not Paid, Partially Paid }` and a derived "Past Due" flag. This matches the actual `Invoice__c.Payment_Status__c` values (`Not Paid, Paid, Partially Paid, Failed`) — no picklist extension required.
- **Derivation:** `Past_Due_Balance__c` becomes a rollup of `Invoice__c` records where `Payment_Due_Date__c < TODAY() AND Payment_Status__c IN ('Not Paid', 'Partially Paid')`. `Outstanding_Balance__c` becomes a rollup of all unpaid/partially-paid `Invoice__c` outstanding amounts for the Account.
- **Multi-Account picker:** if it lands before Ph 2, the invoice list LWC inherits the `accountId` input cleanly.

## Open questions for refinement (when Ph 2 enters the queue)

1. AR-system sync mechanism + cadence — needs Gulf integration team spike.
2. Migration plan for the Ph 1 manually-entered Outstanding_Balance / Past_Due values when Ph 2 takes over.
3. Per-invoice "remaining balance" — does `Invoice__c` already carry a formula for that, or is it derived in the LWC?
4. Does Ph 2 also introduce digital invoice PDF download, or is that another story?

## Readiness

**Cannot be started until** (a) BMS-3930 Ph 1 is in flight or done, and (b) Gulf integration team confirms the AR sync mechanism. Recommend a separate sync-mechanism spike ticket before Ph 2 starts.
