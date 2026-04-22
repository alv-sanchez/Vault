---
ticket: BMS-3930
title: "Retailer credit terms display & payment status"
type: Story
parent_epic: "BMS-3702 — Gulf E-Commerce & Ordering"
blocks: "BMS-3920, BMS-3921, BMS-3922, BMS-3923, BMS-3924, BMS-3925, BMS-3926, BMS-3927, BMS-3928, BMS-3929, BMS-3931, BMS-3932, BMS-3980 (most of these links are mis-scoped — see Polish Notes)"
status: "Needs Refinement"
sprint: "Sprint 2 (2026-05-02 → 2026-05-15) — consider deferring to Sprint 3+"
repo_scanned: "/Users/alvarosanchez_1/Documents/OHFY-Ecom/force-app/main/default"
polished_on: 2026-04-22
polished_by: Alvaro Sanchez
jira: https://ohanafy.atlassian.net/browse/BMS-3930
tags: [polish, ecom, gulf, credit, ar, payment, needs-decomposition]
---

# BMS-3930 — Jira-Ready

**Title:** Retailer credit terms display & payment status

**Description:**

Gulf's AR team fields daily calls from retailers asking basic questions about their credit limit, outstanding balance, last payment, and invoice due dates. Surfacing this in the self-service portal lets retailers answer their own questions 24/7 and frees AR to focus on collections and disputes. It also sets the foundation for credit-aware ordering behaviours downstream (cart warnings when a retailer is close to their limit, Cash Only gating, past-due messaging).

However, the current ticket collapses three distinct decisions into one story:
1. **Where does the credit data live** — new fields on Account, a new custom object, or sourced live from Gulf's ERP?
2. **How does data refresh** — manual AR entry, Salesforce rollup off Invoice records, scheduled ERP sync, or on-demand API call?
3. **What does the portal display** — credit summary, outstanding invoice list, aging buckets, invoice PDFs, payment history, payment methods, all of the above?

Each of those decisions has a very different effort profile. The **recommendation** is to split this ticket into a **Ph 1 MVP** (Account-field-based credit display driven by manual AR entry + an Invoice rollup for outstanding balance) shippable in Sprint 2, and a **Ph 2 integration** (live ERP sync, AR aging, invoice PDFs, payment methods) that follows once the ERP contract is defined. The Jira-Ready writeup below is scoped to **Ph 1**.

**Current State (2026-04-22, per OHFY-Ecom codebase scan):**
- **No credit-related fields on Account** today. The only Account custom field in OHFY-Ecom is `ohfy__ECOM_Minimum_Case_Quantity__c`. None of the proposed fields (`Credit_Limit__c`, `Credit_Status__c`, `Available_Credit__c`, `Past_Due_Balance__c`, `Credit_Last_Reviewed__c`) exist.
- **`Order__c.Payment_Terms__c` and `Payment_Due_Date__c`** are referenced in `OrderHistoryController.cls:44-45` SOQL, **but the `Order__c` object metadata is not in the OHFY-Ecom repo** — it lives in a dependency package (likely OHFY-Data-Model or a custom Gulf package). The fields exist in the target org; they are just not owned here.
- **`Invoice__c` object does not exist** in OHFY-Ecom. Proposed ACs that reference `Invoice__c.Payment_Status__c`, `Invoice_Number__c`, `Due_Date__c` have no backing data model.
- **`Receipt__c` / payment-transaction object does not exist.**
- **No existing credit / AR service classes.** Searching for "Credit", "Balance", "AR", "Invoice" in `classes/` returns only `Credits_Applied__c` (an order-level promotional credit, not AR credit).
- **`ecomOrderHistory`** displays order status (Pending / In Transit / Delivered / Cancelled) but **no payment status per order**.
- **No multi-entity / account-hierarchy** support — one Contact points at one Account via `AccountId`. The ticket's "multi-entity retailer" AC (Milton FL + Mobile AL as separate accounts) is possible as separate Accounts but the portal does not switch between them today (related to BMS-4258).
- **`E_Credits` / `QA_CreditController`** referenced in the auto-gen approach live in OHFY-Core, not OHFY-Ecom.

**Out of Scope for Ph 1:**
- Live ERP integration — deferred to Ph 2.
- Invoice PDF generation — deferred to Ph 2.
- Payment method management (Rainforest / Stripe / etc.) — deferred to Ph 2.
- Full AR aging (Current / 30 / 60 / 90+) — Ph 2.
- Payment history detail (per-transaction log) — Ph 2.
- Multi-entity retailer display — depends on BMS-4258 for the multi-account switcher; defer until that lands.

**Acceptance Criteria (Ph 1):**

```gherkin
Scenario: Account credit summary fields exist and are populated
  Given a retailer Account in Salesforce
  When  an admin views the Account detail page
  Then  the following new fields are visible:
        - Credit_Limit__c (Currency)
        - Available_Credit__c (Formula: Credit_Limit__c - Outstanding_Balance__c)
        - Outstanding_Balance__c (Currency — manual or rollup; see next AC)
        - Credit_Status__c (Picklist: Approved, Pending Approval, Suspended, On Hold, Cash Only)
        - Past_Due_Balance__c (Currency — manual in Ph 1; rollup candidate in Ph 2)
        - Credit_Last_Reviewed__c (Date)
  And   each field has a description and inline help text matching the naming conventions in CLAUDE.md

Scenario: Outstanding balance derivation source is explicit
  Given Ph 1 scope is "Salesforce is the system of record for open invoices"
  When  an admin inspects Outstanding_Balance__c
  Then  the field is either (a) a rollup summary from Invoice__c / Order__c with Payment_Status__c != 'Paid', OR (b) a manual currency populated by AR
  And   the chosen mechanism is documented in the field's description
  And   the decision between (a) and (b) is captured during refinement — not after deploy
  # DECISION REQUIRED BEFORE SPRINT COMMIT

Scenario: Portal Payment Status page renders approved-status retailer
  Given a retailer with Credit_Status__c = 'Approved', Credit_Limit__c = $25,000, Outstanding_Balance__c = $8,400
  When  the retailer navigates to /payment-status in the Gulf portal
  Then  the page shows:
        Credit Terms = Account.ohfy__Payment_Terms__c (e.g., 'Net 30')
        Credit Limit = $25,000.00
        Outstanding Balance = $8,400.00
        Available Credit = $16,600.00
        Credit Status badge = Approved (green)
  And   Last Payment line displays most recent payment date + amount if available (from Ph 1 source — TBD)
  And   the page is accessible via a nav link from the account / profile menu

Scenario: Pending credit status renders with guidance
  Given a newly onboarded retailer has Credit_Status__c = 'Pending Approval' and Credit_Limit__c is null
  When  the retailer views /payment-status
  Then  the page displays a "Credit Status: Pending Approval" badge in neutral color
  And   Credit Limit, Available Credit, Outstanding Balance rows show "Not yet assigned" instead of $0
  And   an informational message reads: "Your credit application is under review. Contact your Gulf sales representative for status updates."

Scenario: Suspended / On Hold / Cash Only retailer sees explicit messaging
  Given Credit_Status__c ∈ { 'Suspended', 'On Hold', 'Cash Only' }
  When  the retailer views /payment-status
  Then  the page shows a status-specific banner explaining what it means for their ordering ability
  And   Credit_Status__c drives downstream cart-gating behaviour in later tickets (out of scope here; documented for handoff)

Scenario: Outstanding invoices list (Ph 1 — Salesforce-sourced)
  Given the retailer has open Order__c records whose Payment_Status__c != 'Paid' (if the field exists in the owning package)
        OR Ph 1 uses an Open_Invoices__c related list from whatever order-backed object is authoritative
  When  the retailer expands "Outstanding Invoices"
  Then  each row shows: Order Number (Order__c.Name or external invoice number if present), Order Date, Due Date, Total, and Status
  And   rows past their due date show a "Past Due" red badge and sort to the top
  # NOTE: depends on whether the owning package exposes an invoice-like concept. Alvaro's comment on the ticket flagged this — resolve before committing the AC.

Scenario: Portal respects Credit_Status__c in the navigation
  Given a retailer with Credit_Status__c = 'Pending Approval'
  When  they navigate around the portal
  Then  the /payment-status page remains accessible
  And   cart-submit gating is explicitly out of this ticket (handed to BMS-3928 / BMS-4052)

Scenario: Admin can maintain the new fields with appropriate permissions
  Given the Ohanafy Community User profile and the internal AR profile
  When  permissions are set
  Then  community users have read-only access to the new Account fields required for portal display
  And   AR users have edit access to Credit_Limit__c, Credit_Status__c, Credit_Last_Reviewed__c
  And   Available_Credit__c is a formula (no direct edits)

Scenario: Field-level security audit
  Given the new fields exist
  When  a community user views their own account via the portal
  Then  no field surface leaks credit data for accounts they do not own
  And   the Apex controller returning credit data filters by the current portal user's Contact's AccountId
```

**Technical Approach (Ph 1):**

1. **Data model (Account-based MVP):**
   - Add on Account: `Credit_Limit__c` (Currency), `Outstanding_Balance__c` (Currency — see below), `Past_Due_Balance__c` (Currency), `Credit_Status__c` (Picklist: Approved, Pending Approval, Suspended, On Hold, Cash Only), `Credit_Last_Reviewed__c` (Date), `Available_Credit__c` (Formula: `IF(ISBLANK(Credit_Limit__c) || ISBLANK(Outstanding_Balance__c), null, Credit_Limit__c - Outstanding_Balance__c)`).
   - **Outstanding_Balance__c source decision (BLOCKING):**
     - **Option A — manual:** AR types it in. Simplest. Stale data is the trade-off.
     - **Option B — rollup:** if an order-like invoice object with `Payment_Status__c` + `Balance__c` exists in the owning package, make this a rollup. Accurate but constrained by rollup limits.
     - **Option C — deferred-to-Ph 2 ERP sync:** Ph 1 field is manual; Ph 2 replaces the writer.
     - Recommendation: **Option A for Ph 1**, with a clear note on the field description that Ph 2 will replace the source.
2. **Portal page:**
   - New route `/payment-status` wired via Experience Cloud. New LWC `ecomPaymentStatus` calling a new `@AuraEnabled(cacheable=true)` controller `CreditTermsController.getCreditSummary()`.
   - Controller filters by `UserInfo.getUserId() → User.ContactId → Contact.AccountId → Account` and returns only the fields above. No cross-account query allowed.
   - Add a nav link to `/payment-status` — either on `ecomProfilePage` or the top-level nav menu. UI placement is a 30-min design call during refinement.
3. **FLS + permissions:**
   - Community profile: read on all new fields.
   - AR internal profile: edit on Credit_Limit__c, Credit_Status__c, Credit_Last_Reviewed__c.
   - Unit test the FLS path from portal user context.
4. **Outstanding invoices list (conditional on data model):**
   - If the owning package exposes an invoice-like concept with `Payment_Status__c`: add a controller method `getOutstandingInvoices()` and a child LWC.
   - If not: defer the outstanding-invoice list to Ph 2 alongside the ERP integration.
5. **Apex tests:** field-level permissions, controller filter (user A can't see user B's account), pending-status rendering, suspended/on-hold badge, rollup/manual source.
6. **Playwright E2E:** portal user lands on /payment-status, sees scoped data only.

**Open Questions (carry to refinement — carried forward from Alvaro's Jira comment on 2026-04-14):**
- **Where does the credit data live?** (Answered in proposal: new Account fields for Ph 1.) Confirm.
- **Credit_Limit__c / Past_Due_Balance__c source** — manual (Option A), rollup (Option B), or ERP-sync (Option C, Ph 2)? Recommended: A for Ph 1.
- **Owning package for Invoice / Payment_Status__c** — does the Gulf org have an invoice-like object? If yes, who owns it?
- **Invoices list in Ph 1** — include if backing object exists; defer to Ph 2 if not.
- **Credit_Status__c → cart gating** — out of scope here, but confirm which ticket owns the gating (BMS-3928? BMS-4052?).
- **Multi-entity retailer display** — parked until BMS-4258 lands.
- **Last payment display** — where does "last payment" data come from in Ph 1? Same question as balance source.
- **"Blocks 13 tickets" Jira link** — overstated. Only BMS-3928 / BMS-4052 (cart-submit gating) genuinely depend on Credit_Status__c. Unlink the rest.

**Estimate (Ph 1 only, with Option A / manual balance):** Medium — ~5-6 days.
- 1d field design + metadata (Account fields, picklist, formula)
- 0.5d FLS / profile updates
- 1.5d `CreditTermsController` + `ecomPaymentStatus` LWC
- 0.5d nav link + routing
- 1d Apex + Playwright tests
- 1d refinement buffer for the Outstanding-Balance source decision

**Ph 2 (separate future story, not in this ticket):** ERP sync, Invoice__c (if not already present), AR aging, invoice PDFs, payment methods. Separately scoped.

---

# BMS-3930 — Polish Notes

## Verdict at a Glance

**Substantial refinement needed — recommend decomposition into Ph 1 + Ph 2.** This ticket currently bundles an MVP credit display with a full AR integration, a PDF invoice service, and a payment-method framework. Each of those is a separate sprint-scale commitment. Ship the MVP (Account fields + portal page) in Sprint 2; defer the rest. Separately, the ticket's "Blocks 13 other tickets" link-set is overstated — only cart-gating tickets actually depend on Credit_Status__c.

| Area                                                     | Verdict                                                                                                |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Story statement (retailer self-service credit visibility)| Confirmed                                                                                              |
| Ph 1 scope (credit display + status badge)               | Confirmed — feasible in Sprint 2 with decisions made                                                   |
| Ph 2 scope (ERP sync, aging, PDFs, payment methods)      | **Needs to be split out** — not achievable in one sprint                                               |
| Proposed Account fields                                  | **Missing today** — none exist; net-new metadata                                                       |
| `Invoice__c` data model                                   | **Missing in OHFY-Ecom** — object does not exist in the repo                                           |
| `Order__c.Payment_Terms__c` / `Payment_Due_Date__c`      | **Referenced but not owned here** — lives in a dependency package                                      |
| Credit calculations (Available_Credit, Past_Due_Balance) | **Missing** — no service classes; must be built                                                        |
| Multi-entity retailer display                            | **Depends on BMS-4258** — defer to a later sprint                                                      |
| Auto-gen approach: `E_Credits` in OHFY-Core              | **Contradicted** — E_Credits is order-level promotional credits, not AR credit                         |
| Auto-gen approach: `P_MerchantController` patterns       | **Contradicted** — no such controller referenced in OHFY-Ecom                                          |
| Jira "blocks 13 tickets"                                 | **Mostly mis-scoped** — only cart-submit gating tickets genuinely depend                               |
| Alvaro's 2026-04-14 proposed fields                      | **Directionally right** — used verbatim as the Ph 1 base                                               |
| Elliot's 2026-04-08 canary-test comment                  | Noted — ownership already reassigned to Alvaro                                                         |

---

## Phase 2 — Business Requirements & ACs

### Structural check
- ✅ Clear purpose (reduce AR call volume, retailer self-service)
- ⚠️ Testable ACs, but ACs reference `Invoice__c` fields that don't exist in OHFY-Ecom — must be rebased
- ❌ Scope is too broad — bundles MVP + ERP + PDFs + payment methods
- ✅ Correct issue type (Story), though it should be decomposed into two stories under a sub-epic

### AC validation

| Original AC | Verdict | Note |
|---|---|---|
| 1. Retailer sees Credit Terms / Limit / Balance / Available Credit + Last Payment | Incomplete | Available_Credit formula OK; Last Payment data source undefined in Ph 1. |
| 2. Outstanding invoices list by invoice number / date / due date / status | Contradicted by data model | `Invoice__c` does not exist in OHFY-Ecom. Either defer to Ph 2 or identify the owning package. |
| 3. Pending-approval retailer sees explicit messaging | Confirmed — testable | Good AC; keep. |
| 4. Credit data reflects recent payment within sync cycle | Deferred to Ph 2 | Depends on ERP sync; not in Ph 1. |
| 5. Multi-entity retailer sees per-entity credit | Deferred | Depends on BMS-4258 + Invoice__c. |

### Gaps to plug
- **Missing AC** — FLS / permission boundary (portal user cannot see other accounts' credit).
- **Missing AC** — Available_Credit formula handles null Credit_Limit__c gracefully.
- **Missing AC** — explicit decision on Outstanding_Balance__c source (manual vs. rollup vs. sync).
- **Missing AC** — admin permissions for AR vs. portal user on the new fields.

---

## Phase 3 — Technical Approach

### Ticket says (auto-gen)
> "Build an LWC component (retailerCreditTerms) for the portal Account page that queries credit terms from Account or a related Credit_Terms__c object and aggregates outstanding balances from Invoice__c (filtered by Payment_Status__c). Leverage the existing E_Credits module in OHFY-Core/OMS for balance calculation logic. Use @AuraEnabled(cacheable=true) Apex controller methods with a short cache TTL to balance performance against data freshness. Wire the component to P_MerchantController patterns for portal authentication context and multi-entity account resolution."

### Claim-by-claim validation (honesty protocol)

**Claim 1: Query credit terms from "Account or a related Credit_Terms__c object"**
- **Code shows:** No Credit_Terms__c object in OHFY-Ecom. No credit fields on Account today. Alvaro's 2026-04-14 comment proposes Account fields directly.
- **Assessment:** **Contradicted / Incomplete.** Use Account fields; do not introduce a new custom object unless the refinement surfaces a reason to.

**Claim 2: "Aggregates outstanding balances from Invoice__c"**
- **Code shows:** No `Invoice__c` in OHFY-Ecom. Unverifiable whether the Gulf org has one in a dependency package.
- **Assessment:** **Contradicted.** Either use a rollup on the order-backed object that exists, or make Outstanding_Balance__c manual for Ph 1.

**Claim 3: "Leverage the existing E_Credits module in OHFY-Core/OMS"**
- **Code shows:** `E_Credits` in OHFY-Core is the promotional / order-credits engine, not an AR credit-limit engine. The two share a word but not a domain.
- **Assessment:** **Contradicted.** E_Credits is the wrong reference; do not take it as an implementation baseline.

**Claim 4: "@AuraEnabled(cacheable=true) with a short cache TTL"**
- **Code shows:** Cacheable Apex is the right pattern (matches `OrderHistoryController`, `EcomBrandingController`, etc.). TTL is platform-managed, not tunable in code — the auto-gen language overstates control.
- **Assessment:** **Partially Confirmed.** Keep cacheable; drop the "short cache TTL" assertion.

**Claim 5: "Wire to P_MerchantController patterns for portal authentication context"**
- **Code shows:** `P_MerchantController` is not referenced anywhere in OHFY-Ecom. Portal authentication context is resolved via `UserInfo.getUserId()` + the User → Contact → Account chain (as used in `OrderHistoryController`, `NotificationPreferenceController`, etc.).
- **Assessment:** **Contradicted.** Use the existing portal user → account resolution pattern.

**Claim 6: Multi-entity account resolution**
- **Code shows:** No multi-account resolution in the current portal; `userDataService` resolves a single implied account. Multi-entity depends on BMS-4258.
- **Assessment:** **Contradicted in the near term.** Defer multi-entity to a follow-up story after BMS-4258 ships.

### Scorecard

| # | Auto-gen claim | Verdict |
|---|---|---|
| 1 | Credit_Terms__c related object | Contradicted |
| 2 | Aggregate from Invoice__c | Contradicted (no Invoice__c) |
| 3 | Leverage E_Credits | Contradicted (wrong domain) |
| 4 | Cacheable with short TTL | Partially confirmed |
| 5 | P_MerchantController patterns | Contradicted |
| 6 | Multi-entity resolution | Contradicted in the near term |

---

## Phase 4 — Dependencies

| Link | Check | Result |
|---|---|---|
| Blocks BMS-3920, 3921, 3922, 3923, 3924, 3925, 3926, 3927, 3928, 3929, 3931, 3932, 3980 | Does this ticket actually block them? | **Mostly mis-scoped.** Credit-terms display is a foundational dependency only for cart-submit gating (BMS-3928, BMS-4052). It is not a prerequisite for branding (BMS-3923), registration (BMS-3926), or notifications (BMS-3921). Elliot's automation bulk-linked these; unlink the ones that don't apply. |
| BMS-4258 (multi-profile registration) | Blocks multi-entity display | Real dependency if we do multi-entity in Ph 1 or Ph 2. |
| Dependency package owning `Invoice__c` / `Order__c` | Needed for rollup option | **Must identify during refinement.** |
| ERP contract for AR sync (Ph 2) | Out of Ph 1 scope | Parked. |

---

## Top Issues (ranked)

1. **Decompose into Ph 1 + Ph 2.** Ph 1 = Account fields + portal page + manual or simple rollup balance, shippable in Sprint 2. Ph 2 = ERP sync + Invoice__c + aging + PDFs + payment methods, separately scoped.
2. **Unlink the overstated "blocks" relationships.** Only BMS-3928 / BMS-4052 (cart gating) genuinely depend on Credit_Status__c. Keep those; unlink the rest.
3. **Outstanding_Balance__c source decision is the critical-path blocker.** Manual (Ph 1) vs. rollup (requires invoice object in the owning package) vs. ERP sync (Ph 2). Make the call before sprint commit.
4. **Rebase the auto-gen technical approach.** Drop `E_Credits`, `P_MerchantController`, `Credit_Terms__c`, `Invoice__c` references. Use Alvaro's proposed Account fields + the existing portal-user → account resolution pattern.
5. **Owning package for Order__c / Invoice__c must be identified** before ACs that reference `Payment_Status__c` or `Invoice_Number__c` can be committed.
6. **Multi-entity support defers to BMS-4258** — scope the MVP to single-account retailers explicitly.

---

## Suggested Revisions

### Proposed title (unchanged for Ph 1)
"Retailer credit terms display & payment status (Ph 1 — account-field MVP)" — consider renaming to make the phasing explicit in Jira.

### Proposed description
Replace today's body with the Current State + Ph 1 scope from the Jira-Ready section above. Keep Ph 2 as a follow-up description block so the trade-off is visible, or split into two Jira tickets.

### Proposed replacement ACs
Use the 9 scenarios in the Jira-Ready section. Drop multi-entity + ERP-sync ACs from Ph 1.

### Proposed field additions (on Account)
Per Alvaro's 2026-04-14 comment:
- `Credit_Limit__c` (Currency)
- `Available_Credit__c` (Formula Currency)
- `Outstanding_Balance__c` (Currency — Ph 1 manual or rollup, see decision AC)
- `Credit_Status__c` (Picklist: Approved, Pending Approval, Suspended, On Hold, Cash Only)
- `Past_Due_Balance__c` (Currency)
- `Credit_Last_Reviewed__c` (Date)
Each with description + inline help text per CLAUDE.md naming conventions.

### Proposed field updates
- **Labels:** keep `ecom`, `fast-trackable`, `gulf`, `phase-2`, `roadmap-v2-baseline`; add `needs-decomposition`.
- **Blocks:** unlink BMS-3921, 3923, 3924, 3925, 3926, 3927, 3929, 3931, 3932, 3980 (mis-scoped). Keep links to BMS-3928 / BMS-4052 if those rely on Credit_Status__c for cart gating; verify.
- **Status:** remain "Needs Refinement" until the Ph 1/Ph 2 split is agreed.

---

## Open Questions for Team Refinement
1. Approve the Ph 1 / Ph 2 split?
2. Confirm Ph 1 Outstanding_Balance__c source (manual vs. rollup).
3. Which package owns `Order__c` / any `Invoice__c`? Needed for rollup option.
4. Unlink the mis-scoped "blocks" relationships — which stay?
5. ERP sync timing for Ph 2 — quarter / owner / contract.
6. Last-payment data source in Ph 1 — in scope or defer?
7. Cart gating on Credit_Status__c — BMS-3928 or BMS-4052 ownership?

## Readiness Recommendation
**HOLD + split.** Do not commit Sprint 2 on the current single-ticket form. Create a BMS-3930-Ph1 (Account fields + portal page) and a BMS-3930-Ph2 (ERP + invoices + aging + PDFs). Ph 1 is a clean 5-6 day Sprint 2 story; Ph 2 is a future sprint. The bigger risk isn't the implementation — it's shipping a credit display that AR then overrides because the data source wasn't agreed up front.
