---
ticket: BMS-3926
title: "Retailer account registration & onboarding flow"
type: Story
parent_epic: "BMS-3702 — Gulf E-Commerce & Ordering"
blocked_by: "BMS-3930 — Retailer credit terms display & payment status"
status: "Backlog / Needs Refinement"
sprint: "Sprint 1"
repo_scanned: "/Users/alvarosanchez_1/Documents/OHFY-Ecom/force-app"
polished_on: 2026-04-17
polished_by: Alvaro Sanchez
jira: https://ohanafy.atlassian.net/browse/BMS-3926
tags: [polish, ecom, gulf, registration, onboarding]
---

# BMS-3926 — Jira-Ready

> **⚠ Note on scope:** This ticket is intentionally being refined as a single umbrella story for now. It's an epic's worth of scope in practice — **plan to split into children (3926a–e) before it enters a sprint**: (a) registration form completeness, (b) address validation + territory/location auto-assign, (c) payment method capture (coordinate with BMS-3930), (d) sales rep approval + matching rules, (e) registration drafts + expiry. Keeping as one while we align on payment provider + approval model decisions.

**Title:** Retailer account registration & onboarding flow

**Story Statement:**

As a Gulf Retailer (e.g., a 7-Eleven FL location), I want a self-service registration & onboarding flow in the Gulf portal, so that I can go from first visit to an active, pricing-code-assigned, route-associated account without manual sales rep setup.

**Why It Matters:**

Gulf's current manual onboarding is the primary source of onboarding error: wrong pricing code selected, wrong payment terms applied, wrong route assigned. With 150+ pricing code structures and multi-entity AR, a self-service flow with validation + approval removes the keying errors and shortens the time-to-first-order.

**Current State (2026-04-17, per codebase scan):**
- A 3-step `ecomRegister` LWC exists: (1) business search by name + zip, (2) user details, (3) confirmation. Backed by `RegisterController.searchAccounts` and `RegisterController.registerUser`. Creates Contact + Community User directly.
- `Account` has a `Payment_Method` picklist field (not a related object). **No `Status__c`, no `Source__c` on Account.**
- No approval process, no matching rules, no registration drafts, no territory/warehouse auto-assign, no address validation.
- OHFY uses `Location__c` for warehouses (not `Warehouse__c`); Invoice/Order reference `Fulfillment_Location__c`.
- OHFY uses `Pricelist__c` / `Pricelist_Item__c` / `Pricelist_Account__c` (not `Price_Record__c`).
- No payment provider integration exists (only Twilio). Tokenization is net-new.
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
1. **Payment provider**: which (Stripe, Rainforest, Salesforce Payments, NetTerms/Billd)? Is BMS-3930 the integration vehicle?
2. **Approval routing**: territory sales rep, regional manager, or centralized onboarding?
3. **`Status__c` / `Source__c`**: add new to OHFY-Ecom, or do they already exist in OHFY-CORE?
4. **Address validation**: third-party (SmartyStreets/Google/Experian) or simple state-code gate?
5. **Pricing code auto-assign vs. manual**: drives whether approval can be fully auto-pilot or always human.
6. **License docs upload**: at registration or deferred? Storage + approval flow?
7. **Multi-entity AR handoff**: what does the downstream AR reconciliation look like concretely (Flow / integration / email)?
8. **Payment method model**: keep `Payment_Method` picklist on Account (expand values) vs. introduce `Payment_Method__c` relational object (enables multiple methods + masked details)?

**Labels:** `refinement-needed`, `scope-concern`

**Estimate:** Not to be pointed until split.

---

# BMS-3926 — Polish Notes

## Verdict at a Glance
**The ticket is much bigger than it looks — but not because it's greenfield.** A working 3-step registration flow (`ecomRegister` LWC + `RegisterController` Apex) already exists and covers Contact creation + Community User provisioning. What the ticket calls for adds **another ~80% on top**: payment capture, approval routing, address/territory validation, pricing & route assignment, duplicate detection, registration drafts. The right move is to **split this into 3-5 smaller stories** rather than ship one mega-ticket.

| Area | Verdict |
|---|---|
| Story statement (self-service registration → active account) | Confirmed — real pain, right framing |
| Existing 3-step `ecomRegister` LWC | **Confirmed** — not mentioned in ticket or CLAUDE.md |
| Existing `RegisterController` (searchAccounts + registerUser) | **Confirmed** |
| 6 Gherkin scenarios | Well-scoped but collectively too big for one ticket |
| `Account.Status__c = 'Pending Approval'` | **Contradicted** — no `Status__c` field on Account in this repo |
| `Account.Source__c = 'E-Commerce Portal'` | **Contradicted** — no `Source__c` on Account |
| Address validated → nearest `Warehouse__c` auto-assigned | **Contradicted by naming** — no `Warehouse__c`; OHFY uses `Location__c` + `Fulfillment_Location__c` |
| New `Payment_Method__c` object with Type__c, Is_Default__c | Absent — net-new; existing `Payment_Method` is a picklist field on Account, not an object |
| Credit card tokenization | **Unverifiable** — no payment provider integration exists (only Twilio for SMS) |
| New `Registration_Attempt__c` object | Absent — net-new |
| New `Registration_Draft__c` + 30-day expire job | Absent — net-new |
| `Price_Record__c` association | **Contradicted by naming** — OHFY uses `Pricelist__c` / `Pricelist_Item__c` / `Pricelist_Account__c` |
| `Route__c` association | Likely in OHFY-CORE; no local reference found |
| Sales rep approval workflow | Absent — net-new |
| Matching Rules for duplicate detection | Absent — not configured in this repo |

---

## Phase 2 — Business Requirements & ACs

### Structural check
- ✅ Clear purpose (kill manual onboarding; reduce errors in payment method / pricing code / route assignment)
- ✅ Why It Matters is concrete (150+ pricing code structures; multi-entity AR)
- ⚠️ Correct issue type (Story) — but **this is really an epic's worth of scope**, not one story
- ✅ Gherkin ACs are testable in isolation

### AC-by-AC validation
| Scenario | Verdict | Note |
|---|---|---|
| 1. Retailer completes self-registration with required fields | **Partially contradicted** — expects `Status__c = 'Pending Approval'`, `Source__c = 'E-Commerce Portal'`, and address-validated warehouse auto-assignment. None of those fields/logic exist today |
| 2. Retailer selects preferred payment method (ACH/Check/Card) | **Contradicted** — no Payment_Method__c object, no payment provider integration; `ecomRegister` has 3 steps today, no payment step |
| 3. Sales rep approves pending registration | **Absent** — no approval process/queue configured |
| 4. Out-of-territory rejection | **Absent** — no address validation or territory service |
| 5. Duplicate retailer detection | **Absent** — no Matching Rules |
| 6. Incomplete registration saved as draft | **Absent** — `Registration_Draft__c` doesn't exist, no expiry job |

### Gaps and scope issues
- **Missing AC**: "Existing `ecomRegister` 3-step flow continues to work" — regression guard.
- **Missing AC**: Data migration / backfill — what happens to existing Accounts that lack `Status__c` and `Source__c` once those fields are added?
- **Missing AC**: Approval notification channel (email + in-app?) and SLA (2 business days is mentioned in confirmation copy but not in any AC).
- **Scope concern**: 6 scenarios × multiple new objects × net-new approval infra → this is 2-3 sprints of work in one ticket. Split recommended (see below).

---

## Phase 3 — Technical Approach

### Claim-by-claim validation (honesty protocol)

**Claim 1: New Account fields `Status__c`, `Source__c`**
- **Code shows:** No `Status__c` or `Source__c` on Account in OHFY-Ecom. Account has a `Payment_Method` picklist field, but not status/source. OHFY-Core (dependency) might have them — unverifiable from this repo alone.
- **Assessment:** **Contradicted locally / Unverifiable in CORE.** Either add fields (and a migration plan for existing Accounts) or rebase on an existing field.

**Claim 2: Address validation against "Gulf's FL and AL service territories"; nearest `Warehouse__c` auto-assigned**
- **Code shows:** No address validation logic, no territory service. `Warehouse__c` as a lookup field does not exist — OHFY uses `Location__c` for warehouses with `Fulfillment_Location__c` references on Invoice/Order.
- **Assessment:** **Contradicted.** Use `Fulfillment_Location__c` (Location lookup) or introduce a proper `Territory__c` FK; do not create `Warehouse__c`. Address validation is net-new and needs either a provider (SmartyStreets, Google, Experian) or a simpler state-code gate.

**Claim 3: `Payment_Method__c` as a new object with `Type__c`, `Is_Default__c`, masked ACH/credit card fields**
- **Code shows:** `Payment_Method` is a **picklist field on Account** (not an object). No Payment_Method__c object exists. No payment provider Named Credential / External Credential (only Twilio for SMS). No tokenization code.
- **Assessment:** **Contradicted + Unverifiable.** Decisions needed: keep as picklist (expand values) vs. upgrade to relational object (enables multiple methods, masked detail storage). Payment provider choice is a separate architectural decision (Stripe, Rainforest, Salesforce Payments, NetTerms/Billd for Net-X terms?). None are integrated today.

**Claim 4: `Registration_Attempt__c` with `Reason__c`**
- **Code shows:** Does not exist.
- **Assessment:** **Absent — genuinely net-new.** Reasonable scope if we want audit trail for rejected attempts, but small net-new object + trigger.

**Claim 5: `Registration_Draft__c` + scheduled Apex to expire after 30 days**
- **Code shows:** Does not exist.
- **Assessment:** **Absent — genuinely net-new.** Scheduled class + batch deletion pattern is standard. Alternative: rely on Platform Cache + browser localStorage for draft persistence without a new object.

**Claim 6: `Price_Record__c` association**
- **Code shows:** No `Price_Record__c` object in OHFY-Ecom. OHFY uses `Pricelist__c`, `Pricelist_Item__c`, `Pricelist_Group__c`, `Pricelist_Account__c` (junction from previous refinement work). Gulf's "150+ pricing code structures" most likely map to `Pricelist__c` records + a naming/classification scheme.
- **Assessment:** **Contradicted by naming.** Use `Pricelist_Account__c` junction. "Price_Record" is probably a synonym the ticket author used; rename.

**Claim 7: `Route__c` association**
- **Code shows:** Not referenced in OHFY-Ecom. Likely lives in OHFY-CORE. Account-Route association would be a junction or lookup.
- **Assessment:** **Unverifiable from local repo.** Confirm in CORE.

**Claim 8: Sales rep approval workflow**
- **Code shows:** No `approvalProcesses/` directory. No Flow-based approval. `ecomRegister` currently inserts the Contact + User directly — there is no "Pending Approval" state today.
- **Assessment:** **Absent.** Net-new. Options: Salesforce Approval Process, Flow with Approval action, or custom Apex state machine.

**Claim 9: Matching Rules for duplicate detection**
- **Code shows:** No `matchingRules/` directory in OHFY-Ecom. `RegisterController.searchAccounts()` does simple name + zip + optional license matching, which is the current proxy.
- **Assessment:** **Absent.** Net-new. Standard Salesforce Matching Rules are a clean fit.

**Claim 10: Multi-step registration flow (4 steps)**
- **Code shows:** `ecomRegister` LWC currently has 3 steps: (1) business search by name + zip, (2) user details, (3) confirmation. No payment step, no draft save.
- **Assessment:** **Partially correct.** Ticket adds a 4th step (payment) and implicit state changes elsewhere.

**Claim 11: Custom LWC for Experience Cloud**
- **Code shows:** `ecomRegister` LWC exists and is registered for Experience Cloud. Follows the repo's standard pattern: LWC → Apex controller via `@AuraEnabled`, LMS for state broadcast via `UserDataChannel`, Tailwind for styling.
- **Assessment:** **Confirmed — reuse/extend.** Don't build a second registration LWC.

**Claim 12: "Docs uploaded (liquor license, resale certificate)" — in the open questions**
- **Code shows:** `searchAccounts` validates state license number against an Account field (if alcohol license required) and checks expiration. No upload/attachment infrastructure on registration today.
- **Assessment:** **Incomplete.** Partial license check exists for *existing* accounts; no upload-new-license path.

### Scorecard
| # | Claim | Verdict |
|---|---|---|
| 1 | `Status__c`, `Source__c` on Account | Contradicted (locally) |
| 2 | Address validation + `Warehouse__c` auto-assign | Contradicted + Absent |
| 3 | `Payment_Method__c` object + tokenization | Contradicted (field vs. object) + Absent (no provider) |
| 4 | `Registration_Attempt__c` | Absent (net-new) |
| 5 | `Registration_Draft__c` + expiry job | Absent (net-new) |
| 6 | `Price_Record__c` | Contradicted — use `Pricelist_Account__c` |
| 7 | `Route__c` | Unverifiable (likely OHFY-CORE) |
| 8 | Sales rep approval workflow | Absent |
| 9 | Matching Rules | Absent |
| 10 | 4-step registration LWC | Partially correct — 3 steps exist |
| 11 | Custom Experience Cloud LWC | Confirmed — reuse/extend `ecomRegister` |
| 12 | License upload | Incomplete |

**Existing infrastructure roughly covers ~20% of this ticket's scope.**

---

## Phase 4 — Dependencies

| Link | Check | Result |
|---|---|---|
| Blocked by BMS-3930 ("Retailer credit terms display & payment status") | Does upstream deliver payment infra this ticket consumes? | **Plausible this time** — the credit-terms/payment-status title *could* cover payment method setup. Clarify whether BMS-3930 delivers `Payment_Method__c` object + tokenization, and if so, this ticket becomes purely registration/approval |
| Parent BMS-3702 (ECOM) | Parent consistent | Confirmed |
| Implicit: OHFY-CORE | Account/Route schema and CORE business logic | Likely needed; spike (BMS-4049) or a separate pre-read |
| Downstream | Cart/order (BMS-3928), delivery (BMS-3930), invoice lookup | An active account with pricing + route is a precondition for ordering |

---

## Top Issues (ranked)

1. **Scope is an epic, not a story.** Split into:
   - **BMS-3926a: Registration form completeness + Account stateful onboarding** (adds `Status__c`, `Source__c`, expands `ecomRegister` to capture business details, sets Pending Approval).
   - **BMS-3926b: Address validation + territory/warehouse auto-assign.**
   - **BMS-3926c: Payment method capture + tokenization** (dependent on payment provider decision; possibly folds into BMS-3930).
   - **BMS-3926d: Sales rep approval workflow + matching rules.**
   - **BMS-3926e: Registration drafts + 30-day expiry.**
2. **Naming doesn't match the codebase.** `Warehouse__c`, `Price_Record__c`, `Payment_Method__c-object-vs-field` are all mis-named vs. the actual schema. Rewrite before refinement.
3. **Ticket ignores existing `ecomRegister` + `RegisterController`.** Every AC should start from "extend the current flow" rather than "build a new one."
4. **Payment provider is the elephant in the room.** Credit card tokenization requires choosing Stripe / Rainforest Pay / Salesforce Payments / another. No provider exists in the repo today. This decision is not called out anywhere in the ticket.
5. **Approval model is the second elephant.** Salesforce Approval Process vs. Flow vs. custom state machine — each has different implementation cost.

---

## Suggested Revisions

### Option A — Split into smaller tickets (recommended)

Rewrite this as the umbrella story with a scope note:

```markdown
### Story Statement (umbrella)
As a **Gulf Retailer**, I want **a self-service registration & onboarding flow
in the Gulf portal**, so that **new accounts like 7-Eleven FL locations can go
from first visit to active, pricing-code-assigned, route-associated account
without manual sales rep setup.**

### Current State (2026-04-17, per codebase scan)
- A 3-step `ecomRegister` LWC exists: (1) business search, (2) user details,
  (3) confirmation. Backed by `RegisterController.searchAccounts` and
  `RegisterController.registerUser`. Creates Contact + Community User.
- No Account `Status__c`, no `Source__c`, no `Payment_Method__c` object,
  no approval workflow, no matching rules, no draft persistence,
  no territory/warehouse auto-assign, no payment provider integration.

### Scope Decomposition
This umbrella is too large for a single story. Children:
- BMS-3926a: Registration form completeness (business details, Status__c,
  Source__c, Pending Approval state) — extends existing ecomRegister
- BMS-3926b: Address validation + territory/warehouse auto-assign
- BMS-3926c: Payment method capture (coordinate with BMS-3930)
- BMS-3926d: Sales rep approval workflow + matching rules
- BMS-3926e: Registration drafts + 30-day expiry job

Each child has its own testable ACs derived from the umbrella's 6 scenarios.

### Out of Scope
- Payment provider selection and integration (decision needed first;
  separate architectural ticket)
- License/resale-certificate upload (see BMS-XXXX follow-up)
- Dark-mode variant of the registration UI
```

### Option B — If the team insists on one ticket: add these ACs

```gherkin
Scenario: Existing 3-step registration continues to work post-change
  Given the existing ecomRegister LWC flow
  When  the new 4-step flow is deployed
  Then  Users can still complete registration via the same entry point
  And   Existing RegisterController methods remain backward-compatible

Scenario: Data migration for existing Accounts
  Given Accounts exist today without Status__c or Source__c
  When  the new fields are deployed
  Then  Existing Accounts default to Status__c = 'Active' and
        Source__c = 'Direct' (or equivalent), preserving current behavior

Scenario: Rename Warehouse__c and Price_Record__c references
  Given the ticket references Warehouse__c and Price_Record__c
  When  the schema is reviewed against OHFY-CORE
  Then  The ticket's references are rewritten to Fulfillment_Location__c
        (Location__c lookup) and Pricelist_Account__c respectively
```

### Proposed field updates
- **Issue type**: consider converting to Epic if splitting
- **Labels**: add `scope-concern`, keep `refinement-needed`
- **Story points**: should not be pointed until split

---

## Open Questions for Team Refinement
1. **Payment provider**: which one, and who owns integration? Is BMS-3930 the vehicle for it?
2. **Approval routing**: territory sales rep, regional manager, or centralized onboarding? (Already an open question on the ticket — decide before implementation.)
3. **Status__c / Source__c scope**: are these new fields to add, or do they exist in OHFY-CORE?
4. **Address validation**: third-party service (SmartyStreets/Google/Experian) or simple state-code gate?
5. **Pricing code auto-assignment vs. manual**: answer determines whether approval can be fully auto-pilot or always requires a sales rep step.
6. **License docs**: require upload at registration or defer? What's the storage / approval flow?
7. **Multi-entity AR handoff**: Finance uses the default payment method "downstream for AR reconciliation across Gulf's multi-entity structure." What does that handoff look like concretely? (Flow? Integration? Email?)

## Readiness Recommendation
**Hold — split before refinement.** This ticket, as written, would consume multiple sprints and span architectural decisions that have no owner yet (payment provider, approval model). Breaking it into 3-5 children each with a clear decision and a single outcome is the right move. The existing `ecomRegister` + `RegisterController` foundation means we're not starting from zero, but we're also not ready to pull the whole umbrella as a single story.
