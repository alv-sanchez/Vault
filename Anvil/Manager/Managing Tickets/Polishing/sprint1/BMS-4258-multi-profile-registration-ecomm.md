---
ticket: BMS-4258
title: "Multi-profile registration on e-comm (multiple businesses per contact)"
type: Story
parent_epic: "BMS-3702 — Gulf E-Commerce & Ordering"
blocked_by: ""
status: "Backlog"
sprint: "Sprint 2 (2026-05-02 → 2026-05-15)"
repo_scanned: "/Users/alvarosanchez_1/Documents/OHFY-Ecom/force-app/main/default"
polished_on: 2026-04-22
polished_by: Alvaro Sanchez
jira: https://ohanafy.atlassian.net/browse/BMS-4258
tags: [polish, ecom, gulf, registration, multi-account, onboarding]
---

# BMS-4258 — Jira-Ready

**Title:** Multi-profile registration on e-commerce (multiple businesses per contact)

**Description:**

Today's portal registration (`lwc/ecomRegister` + `classes/RegisterController`) is a 3-step wizard that creates exactly one Contact linked to one Account and one Experience Cloud community User. Retailers who own or operate multiple businesses — e.g., a single owner who runs three licensed establishments across Mobile AL and Milton FL — must register each business as a separate email/user pair, fragmenting their login and forcing them to re-enter user details every time.

This story lets a retailer register **multiple businesses against a single Contact / User identity** during the onboarding wizard. After Step 1 locates an initial business, the wizard offers an "Add another business" action that repeats the license-gated business search (Step 1) until the retailer confirms. At submission, one Contact + one User is created, and the Contact is linked to N Accounts via `AccountContactRelation`. The primary Account is stored on `Contact.AccountId`; additional Accounts are related via AccountContactRelation rows with a chosen "primary" for default context.

The downstream portal surfaces (cart, order history, profile, pricing) already run off a single implied account context today, so a post-registration "active business" switcher will be needed. Scope is limited to the **registration flow itself**; the active-business switcher UX is an explicit follow-up unless refinement pulls it in.

**Current State (2026-04-22, per OHFY-Ecom codebase scan):**
- `lwc/ecomRegister/ecomRegister.js` — 3-step wizard: Step 1 business info (businessName, zipCode, stateLicenseNumber) → `RegisterController.searchAccounts`; Step 2 user details (firstName, lastName, email, phone, jobTitle, smsOptIn); Step 3 confirmation.
- `classes/RegisterController.cls` — `searchAccounts` (lines 7-100) returns matching Accounts and throws `RegisterException` if `ohfy__Alcohol_License_Required__c = true` and `ohfy__License_Expiration_Date__c < today`. `registerUser` (lines 130-288) inserts one Contact with `AccountId = selectedAccountId`, then creates one Experience Cloud User with Profile = "Ohanafy Community User" (fallback "Customer Community Login User").
- **No `AccountContactRelation` usage anywhere.** Contact-to-Account is purely standard `AccountId`.
- **No `Account.ParentId` / account-hierarchy logic.**
- Post-registration pricelist + fulfillment location assignment is **not handled in the wizard** — it happens elsewhere (manual AR step or upstream data sync). This story does not alter that.
- `lwc/userDataService` — centralizes the "current user's account" context the rest of the portal reads from. **This service will need a notion of "active account" if multi-account users exist.**
- All downstream LWCs (`ecomShop`, `ecomCartPage`, `ecomOrderHistory`, `ecomProfilePage`, `ecomReviewSummary`) derive account context implicitly from `userDataService`. Today the service exposes a single implied account — no active-business switching exists.

**Out of Scope:**
- Active-business switcher UI in the header / post-registration portal (separate follow-up story; this story ships the data model + registration flow only).
- Merging previously separately-registered Contact/User pairs into one identity (data-migration effort, out of scope).
- Per-business-per-contact pricelist selection during registration (pricelist is still assigned post-registration by ops).
- Cross-account order/cart state mixing — cart remains scoped to the active account.

**Acceptance Criteria:**

```gherkin
Scenario: Add a second business during registration
  Given a retailer is on Step 1 of ecomRegister and has selected an initial Account via searchAccounts
  When  the retailer clicks "Add another business"
  Then  Step 1 re-renders with cleared input fields, keeping the already-selected business in a visible list above the form
  And   the retailer enters a second businessName, zipCode, and stateLicenseNumber
  And   searchAccounts runs with the new inputs and returns matching Accounts
  And   the retailer can confirm the second business, which appends to the selected list

Scenario: License validation is applied per business during the multi-select loop
  Given a retailer has already selected one valid Account
  When  the retailer searches for a second business whose ohfy__Alcohol_License_Required__c = true AND ohfy__License_Expiration_Date__c < today
  Then  searchAccounts throws a RegisterException with message containing "license has expired"
  And   the second business is not added to the selected list
  And   the first business remains selected and the flow does not regress to Step 0

Scenario: Mark one selected business as primary
  Given the retailer has selected 3 businesses in Step 1
  When  Step 1 renders the selected-businesses list
  Then  a "Primary" radio selector appears on each selected row
  And   exactly one row can be chosen as primary (radio, not checkbox)
  And   the primary defaults to the first selected Account
  And   changing the primary updates the UI selection immediately without re-searching

Scenario: Single Contact + User created at submission, linked to N Accounts
  Given a retailer has selected N >= 2 businesses with one marked Primary and has completed Step 2 user details
  When  the retailer submits registration
  Then  exactly one Contact is inserted with AccountId = the primary Account's Id
  And   exactly one Experience Cloud User is inserted with Profile = "Ohanafy Community User" (fallback "Customer Community Login User") and ContactId = the new Contact's Id
  And   (N - 1) AccountContactRelation records are inserted — one per non-primary selected Account — with the new Contact's Id, IsActive = true, and Roles set to a configurable default (e.g., "Portal User")
  And   the transaction is all-or-nothing: any failure rolls back Contact, User, and AccountContactRelation inserts

Scenario: License expiration check runs on every selected business at submission
  Given a retailer has selected 3 businesses during Step 1
  And   one of those Accounts now has an expired license (edge case: license expired after Step 1 selection)
  When  the retailer reaches Step 3 confirmation and clicks Submit
  Then  registerUser re-validates license expiration for every selected Account
  And   if any license is expired, the submission fails with a RegisterException listing the failing Account name
  And   no Contact, User, or AccountContactRelation rows are created

Scenario: Portal user sees a primary account context after first login
  Given a retailer registered with 3 businesses and marked "Acme Beverages (Mobile AL)" as primary
  When  the retailer logs into the portal for the first time
  Then  userDataService resolves the active account as the primary Account
  And   the shop, cart, and order history show data scoped to "Acme Beverages (Mobile AL)"
  And   a UI affordance (badge, dropdown trigger, or banner — exact design out of scope of this ticket) indicates 2 additional businesses are linked to the identity

Scenario: Existing Contact conflict short-circuits registration
  Given an email submitted in Step 2 already has an active Experience Cloud User
  When  the retailer submits registration
  Then  registerUser throws a RegisterException with message containing "already exists" before any Account linking occurs
  And   no AccountContactRelation rows are created
  And   the retailer is shown a "try logging in" message with a link to the login page

Scenario: Single-business registration continues to work unchanged
  Given a retailer selects exactly one business in Step 1 and does not add a second
  When  they complete Step 2 and submit
  Then  registerUser behaves identically to today — one Contact with AccountId, one User — with no AccountContactRelation rows inserted
  And   any existing tests that assert single-account registration continue to pass

Scenario: Audit trail on registration
  Given a multi-business registration has completed successfully
  When  an admin inspects the new Contact in Salesforce
  Then  a Registration_Source__c or similar audit field on the Contact captures the timestamp and the list of Account names registered
  And   the AccountContactRelation rows have CreatedBy = the new User (or the system context, per platform default)
  And   the audit payload is sufficient to reconstruct the registration for support / compliance
```

**Technical Approach:**

1. **Data model confirmation:**
   - Use standard `AccountContactRelation` (Salesforce enables it automatically when Contacts-to-Multiple-Accounts is on at the org level). Confirm the Gulf org has this setting enabled — if not, this ticket is blocked on an org-level toggle.
   - Primary Account is stored on `Contact.AccountId`; additional Accounts hang off `AccountContactRelation` with `IsActive = true` and `Roles = 'Portal User'` (or a configurable picklist).
2. **`ecomRegister` LWC changes:**
   - Step 1 becomes a loop. State: `selectedBusinesses: Array<{accountId, accountName, licenseStatus, isPrimary}>`.
   - "Add another business" action clears the search inputs without advancing the step; selected businesses render as removable chips with a primary radio.
   - Step 3 confirmation displays the full list with primary highlighted.
3. **`RegisterController.cls` changes:**
   - Extend `registerUser` signature (or add `registerUserMultiAccount`) to accept `List<Id> accountIds` and `Id primaryAccountId`.
   - Inside the method: re-validate license expiration on every account; insert Contact with `AccountId = primaryAccountId`; insert User; insert one AccountContactRelation per non-primary Account.
   - Wrap everything in a savepoint for all-or-nothing rollback.
   - Add a `Registration_Source__c` Text or Long Text field on Contact to capture audit payload (timestamp, account names, user agent if available).
4. **`userDataService` changes:**
   - Extend the service to resolve active account via (a) Contact.AccountId default, (b) a session-scoped override once the switcher UI is built. For this story, implement (a) only; expose a stub API for (b) that the follow-up story will wire.
   - Add a property `linkedAccountCount` so downstream UI can show a "You have N linked businesses" affordance without querying itself.
5. **Apex tests:**
   - Single-account path (regression).
   - Multi-account happy path (3 businesses, one primary).
   - Expired-license short-circuit at Step 1 and at submission (edge case).
   - Email-already-exists short-circuit.
   - Rollback on a mid-transaction failure (e.g., AccountContactRelation insert fails).
6. **Playwright E2E:**
   - Walk through the multi-business registration, log in, assert primary account scope.

**Open Questions (carry to refinement):**
- **Org setting** — is "Contacts to Multiple Accounts" enabled on the Gulf production org? If not, this ticket cannot land until that's toggled by an admin (non-reversible).
- **Active-business switcher UX** — refine separately, or pull into this story? Recommendation: separate story so this one doesn't slip.
- **Roles on AccountContactRelation** — default "Portal User", or per-business role picklist (e.g., Owner / Manager / Buyer)?
- **Per-business pricelist / fulfillment location** — confirmed out of scope of registration; where/when does Ops assign them for the non-primary accounts?
- **Regulatory / compliance** — does Gulf need explicit consent per business (license attestation), or is a single attestation at submission sufficient?
- **Limit on the number of businesses** — cap at N (5? 10?) or unlimited?
- **Email collision on existing Contact** — should we offer to *link additional accounts to an existing user* if the email matches a pre-existing Contact with a User? Or refuse and route to login? (MVP: refuse and route.)

**Estimate:** Medium — ~4-5 days.
- 1.5d `ecomRegister` UI loop + primary selector + confirmation render
- 1d `RegisterController` multi-account logic + rollback
- 0.5d `userDataService` active-account stub
- 1d Apex tests + Playwright
- 0.5d refinement buffer

---

# BMS-4258 — Polish Notes

## Verdict at a Glance

**Needs substantial refinement before sprint commit.** The ticket is a one-line description with no ACs, no technical approach, and no business context. The intent is clear — let one retailer identity cover multiple businesses — but the data-model choice (AccountContactRelation vs. Account.ParentId vs. a custom junction) determines most of the implementation scope, and that decision must be made before we commit. There is a genuine org-level prerequisite ("Contacts to Multiple Accounts" must be enabled) that can block the story even after implementation is done.

| Area                                                                             | Verdict                                                                                              |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Story statement (multi-business under one contact)                               | Confirmed in intent, missing in detail                                                               |
| Acceptance criteria                                                              | **None exist** — need to be drafted                                                                  |
| Business justification                                                           | **Missing** — template boilerplate only                                                              |
| Data model choice (AccountContactRelation vs. Account.ParentId vs. custom)       | **Unverifiable** — not specified; recommend AccountContactRelation                                   |
| Current registration flow (single Account)                                       | **Confirmed** — `ecomRegister` + `RegisterController` single-account today                            |
| AccountContactRelation usage in OHFY-Ecom                                        | **Missing** — no existing code references AccountContactRelation                                     |
| Org-level "Contacts to Multiple Accounts" toggle                                 | **Unverifiable from repo** — must confirm on Gulf org before sprint                                  |
| Active-business switcher UI (needed at runtime)                                  | **Missing** — no switcher in any LWC; in-scope or split?                                             |
| Pricelist + fulfillment location per-business assignment                         | **Unverifiable** — not handled at registration today                                                 |

---

## Phase 2 — Business Requirements & ACs

### Structural check
- ⚠️ Purpose is clear in one sentence; no "why it matters" or Gulf context.
- ❌ No acceptance criteria at all.
- ⚠️ Scoped ambiguously — data model could be AccountContactRelation, ParentId hierarchy, or a custom junction. Implementation differs materially.
- ✅ Correct issue type (Story).

### Gaps to plug
- **Why it matters** — who exactly benefits (sample retailer persona that owns 3 businesses)?
- **Data model decision** — AccountContactRelation is the standard Salesforce pattern; ParentId is for corporate hierarchy; a custom junction is needed only if the two prior don't fit. Recommend AccountContactRelation.
- **Full AC set** — 9 scenarios proposed in the Jira-Ready section above.
- **Scope boundary** — does this include an active-business switcher UI at runtime, or only the data foundation?
- **License validation** — confirm it applies per business.
- **Audit trail** — what does the support team need to reconstruct a multi-business registration?

### AC validation
N/A — none exist. Draft proposed in the Jira-Ready section.

---

## Phase 3 — Technical Approach

### Ticket says
Nothing. The ticket has no technical section today.

### Proposed approach (for refinement validation)

**Claim: Use AccountContactRelation (AcR) as the data model**
- **Code shows:** OHFY-Ecom does not reference AccountContactRelation anywhere. This is a net-new use of a standard Salesforce feature. Requires the org-level setting "Contacts to Multiple Accounts" to be enabled (Setup → Account Settings).
- **Assessment:** **Unverifiable until org setting is checked.** Recommended path if enabled.

**Claim: Extend `RegisterController.registerUser` to accept a list of Account IDs**
- **Code shows:** `RegisterController.cls:130-288` currently takes a single `accountId`. Extending the signature is straightforward; the hardening work is (a) re-validating license on every Account at submission, (b) all-or-nothing rollback via savepoint.
- **Assessment:** **Feasible, ~1 day of Apex work.**

**Claim: Extend `userDataService` to expose an "active account"**
- **Code shows:** `userDataService.js` today resolves a single implied account across the portal. No notion of active vs. linked. Every downstream LWC reads from this service.
- **Assessment:** **Real change** — the follow-up switcher UI will depend on this abstraction. Ship the stub API in this story so the follow-up is non-breaking.

**Claim: Loop the existing wizard's Step 1 rather than rebuild it**
- **Code shows:** `ecomRegister.js:81-89` — the 3-step flow is state-driven. Looping Step 1 is a state-machine extension, not a rebuild.
- **Assessment:** **Feasible, ~1.5 days of UI work.**

### Scorecard (proposed approach)

| # | Claim | Verdict |
|---|---|---|
| 1 | AccountContactRelation as data model | Requires org-level setting confirmation |
| 2 | Extend RegisterController for multi-account | Feasible |
| 3 | Extend userDataService for active account | Feasible; non-breaking if stubbed |
| 4 | Loop Step 1 in ecomRegister | Feasible |
| 5 | Active-business switcher UI this sprint | Recommended split into follow-up |

---

## Phase 4 — Dependencies

| Link | Check | Result |
|---|---|---|
| No Jira blocked-by / blocks links today | N/A | Consider linking to BMS-3926 (Registration & Onboarding Flow) as the parent-ish story this extends. |
| Parent BMS-3702 (Gulf ECOM epic) | Parent consistent | Confirmed |
| Org setting "Contacts to Multiple Accounts" | Required before implementation | **External dependency** — must be enabled by an admin before the feature works; not reversible once enabled |
| Downstream LWCs consuming userDataService | Active-account context must flow | Implicit; ship the stub API in this story to avoid a breaking follow-up |

---

## Top Issues (ranked)

1. **No ACs, no tech approach, no business justification** — the ticket is a one-liner. Draft and review before sprint.
2. **Data model decision** — AccountContactRelation recommended; confirm with Gulf stakeholders and an admin on the org setting.
3. **Active-business switcher UI scope** — in this story, or split? Recommendation: split. Ship the data foundation + a stub API now.
4. **Per-business pricelist + fulfillment location** — confirmed out of scope at registration, but someone owns the post-registration assignment; call that out explicitly so a retailer isn't left in a half-configured state after signing up with 3 businesses.
5. **Email-exists collision** — current single-account path throws; confirm the multi-account path behaves the same or add a "link additional accounts to existing user" affordance.

---

## Suggested Revisions

### Proposed title
"Multi-profile registration on e-commerce (multiple businesses per contact)" — clarifies intent without changing scope.

### Proposed description
Use the full description + Current State + Out of Scope block in the Jira-Ready section above. It replaces today's single-line body.

### Proposed ACs
9 scenarios in the Jira-Ready section above.

### Proposed field / metadata additions
- `Contact.Registration_Source__c` (Long Text, optional) — audit payload capturing registration timestamp and registered Account names.
- Optional: `AccountContactRelation.Portal_Role__c` picklist (Owner / Manager / Buyer) if per-business role is a requirement.

### Proposed field updates
- **Labels:** add `registration`, `onboarding`, `fast-trackable`.
- **Blocked By:** potentially link to BMS-3926 (Registration & Onboarding Flow) as the parent story this extends.
- **Sub-task:** admin sub-task "Enable Contacts to Multiple Accounts on Gulf org" — must be done before implementation.

---

## Open Questions for Team Refinement
1. Is "Contacts to Multiple Accounts" enabled on the Gulf production org? (Admin to confirm.)
2. Does "multi-profile" scope include the active-business switcher UI, or data foundation only?
3. AccountContactRelation.Roles — single default or per-business picklist?
4. Cap on the number of linked businesses?
5. How is pricelist + fulfillment location assigned for the non-primary businesses, and when?
6. Email-exists collision: refuse (MVP) or allow linking additional accounts to the existing user?
7. Regulatory / compliance — per-business license attestation required, or one submission attestation covers all?

## Readiness Recommendation
**HOLD until refinement.** The ticket is a one-liner today. With the proposed description + ACs + technical approach above, it becomes a 4-5 day Sprint 2 story. Before committing, confirm the org-level setting and the active-switcher scope split. Otherwise the team will either over-commit or ship a feature nobody can use at runtime.
