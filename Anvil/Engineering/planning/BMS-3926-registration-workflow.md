# BMS-3926 — Registration & Onboarding Workflow Planning

> **Ticket**: [BMS-3926](https://ohanafy.atlassian.net/browse/BMS-3926)
> **Epic**: BMS-3702 (Gulf — E-Commerce & Ordering)
> **Sprint**: Sprint 1 (2026-04-20 to 2026-05-02)
> **Status**: To Do | Labels: `refinement-needed`, `phase-2`, `gulf`
> **Comment from Leah (2026-04-20)**: Pricing code assignment depends on pricing architecture landing in the package first.

---

## How to Use This Document

This is a **planning artifact** — not a spec, not a ticket. Its purpose is to:

1. **Give Claude (or any engineer) full context** on what exists today, what BMS-3926 asks for, and where those diverge
2. **Force decisions** on the open questions before code starts
3. **Serve as a paper trail** for why things were built the way they were

Feed this file to Claude Code when starting implementation work on any of the BMS-3926 sub-tasks. It replaces the need to re-read the full ticket + scan the codebase from scratch each time.

---

## What Exists Today

### ecomRegister LWC (`force-app/main/default/lwc/ecomRegister/`)

A working 3-step registration flow:

| Step | What it does |
|---|---|
| 1. Business Search | Search by business name + shipping ZIP. Optional state license number. Word-split matching via dynamic SOQL. Expired license blocks registration. |
| 2. User Details | First name, last name, email, phone (US formatted), job title (optional), SMS opt-in checkbox. |
| 3. Confirmation | Success message + "Go to Login" button. User receives welcome email to set password. |

### RegisterController.cls (`force-app/main/default/classes/RegisterController.cls`)

| Method | What it does |
|---|---|
| `searchAccounts` | Dynamic SOQL on Account by name words + ShippingPostalCode. Filters by license (digits-only match) or excludes alcohol-license-required accounts when no license provided. Blocks expired licenses. |
| `registerUser` | Validates inputs. Checks for duplicate Contact (same email + account) and duplicate User (same username). Creates Contact with SMS opt-in fields. Creates Community User with "Ohanafy Community User" profile. Triggers welcome email. Cleans up Contact on failure. |
| `loginUser` | `Site.login()` wrapper (exists but not used by the current LWC flow). |

### Key facts about the current Account model

- `Account.Payment_Method` — **picklist field**, not a related object
- **No** `Status__c` field on Account
- **No** `Source__c` field on Account
- No approval process on Account
- No matching/duplicate rules for registration
- No `Registration_Draft__c` object
- No `Registration_Attempt__c` object
- No payment provider integration (tokenization is net-new)
- Pricelist model exists: `Pricelist__c` / `Pricelist_Item__c` / `Pricelist_Account__c`

### Post-registration behavior (already working)

- Contact created with `SMS_Opt_In__c` and `SMS_Opt_In_Date__c`
- User created with Experience Cloud profile
- `Contact_Notification__c` records seeded (via `NotificationPreferenceController.initializeContactNotifications`)
- Welcome email sent for password setup

---

## What BMS-3926 Requires (Gap Analysis)

The ticket is scoped as an **umbrella story** to be split into children (a–e). Here's what each child needs and what's missing:

### (a) Registration Form Completeness

**What the ticket asks for:**
- Collect: legal name, DBA, full ShippingAddress, business phone, business type, alcohol license (if required)
- Backward-compatible — existing 3 steps keep working

**Decision (2026-04-20):** Build a **net-new Gulf-specific LWC** (e.g. `ecomGulfRegistration`) with its own controller. Do NOT modify `ecomRegister` — that stays as-is for TBM. Experience Cloud handles routing: each site maps its registration page to the appropriate component via `/nav-link`. Two registration paths, two components, zero regression risk.

**Clarification (2026-04-20):** The ticket's AC #2 says "a new Account is created" — this is **incorrect**. The flow does NOT create a new Account. We use two terms to avoid ambiguity:

- **Account-Internal** = the Account record that already exists in the org (created by sales rep / data migration)
- **Account-Contact** = the Contact record created under Account-Internal during registration

The retailer searches for their Account-Internal, selects it, and the flow creates an **Account-Contact** under it. The Community User is created later, after approval. Same search-then-match pattern as existing `ecomRegister`, but Gulf-flavored with additional steps (payment placeholder, approval).

**Gap from current state:**
- This is greenfield — new component, new controller, but follows the same search-then-match-then-create-Account-Contact pattern as `ecomRegister`
- Can reference patterns from `ecomRegister` (phone formatting, validation UX, Tailwind styling, search results UI) but not extend it
- `RegisterController` stays untouched; new controller handles the Gulf flow
- Key difference from existing flow: Account-Contact is created but Community User is NOT created until after approval

### (b) Address Validation + Territory/Location Auto-Assign

**What the ticket asks for:**
- Validate ShippingAddress against a provider or service territory
- Auto-assign `Account.Fulfillment_Location__c` to nearest `Location__c`
- Reject out-of-territory addresses with a sales contact message

**Gap from current state:**
- No address validation exists
- No territory matching logic
- `Fulfillment_Location__c` field may or may not exist on Account (lives in OHFY-CORE, not OHFY-Ecom)

**Decision needed**: Third-party validation (SmartyStreets/Google/Experian) or simple state-code gate for FL/AL?

### (c) Payment Method Capture (coordinate with BMS-3930)

**What the ticket asks for:**
- New step 4: "Payment Method" between User Details and Confirmation
- ACH, Check, or Credit Card options
- Tokenization via selected provider (never store raw)
- Masked reference persisted
- `Is_Default__c = true` for primary method

**Gap from current state:**
- `Account.Payment_Method` is a picklist — not structured for tokenization
- No payment provider integration exists at all
- No `Payment_Method__c` related object

**Decision needed**: Which provider? (Stripe, Rainforest, Salesforce Payments, NetTerms/Billd) — blocked on BMS-3930 alignment. Leah's comment suggests pricing architecture needs to land first.

### (d) Sales Rep Approval + Matching Rules

**What the ticket asks for:**
- Account starts at `Status__c = 'Pending Approval'`
- Approval Process routes to territory sales rep
- On approval: Status → Active, `Pricelist_Account__c` junctions created, `Route__c` set, retailer emailed
- Duplicate detection via Salesforce Matching Rules (legal name + zip + license)
- Rejected registrations logged to `Registration_Attempt__c` with `Reason__c`

**Gap from current state:**
- No `Status__c` or `Source__c` on Account — need to add + backfill existing records
- No Approval Process
- No Matching Rules
- No `Registration_Attempt__c` object
- Current flow creates Contact + User immediately — with approval, the user creation may need to be deferred until approval (or created in a limited state)

**Decision needed**: Approval routing — territory sales rep, regional manager, or centralized onboarding team? Auto-assign pricing code or manual selection by approver?

### (e) Registration Drafts + Expiry

**What the ticket asks for:**
- Incomplete registrations saved as drafts
- Resume from last completed step within 30 days (same email)
- Scheduled batch job purges stale drafts

**Gap from current state:**
- Nothing exists for this
- Options: `Registration_Draft__c` custom object vs Platform Cache + localStorage

**Decision needed**: Custom object (auditable, queryable, reportable) vs localStorage (simpler, no schema, but no server-side visibility)?

---

## Proposed Implementation Phases

Based on the gaps, dependencies, and Leah's comment about pricing architecture timing:

### Phase 1 — Foundation (can start now)
> New Gulf registration component + schema groundwork

- Scaffold new LWC (e.g. `ecomGulfRegistration`) + new Apex controller (e.g. `GulfRegistrationController`)
- Borrow patterns from `ecomRegister`: Tailwind loading, phone formatting, step indicator, validation UX
- Build Step 1: business details form (legal name, DBA, ShippingAddress, phone, business type, license)
- Build Step 2: user details (reuse field set from existing `ecomRegister` Step 2)
- Add `Registration_Attempt__c` custom object for audit trail
- `Status__c` / `Source__c` on Account — parked (WIP), but design the controller to set them when ready

### Phase 2 — Address + Territory (can start now, no payment dependency)
> State-code gate + location auto-assign

- Implement state-code validation for FL/AL territories (simple picklist/set check)
- Out-of-territory rejection with sales contact message + `Registration_Attempt__c` logging
- `Fulfillment_Location__c` auto-assignment logic (nearest Location by state/zip)
- Future upgrade path: swap state-code gate for third-party address service (SmartyStreets, Google Places, Experian) when supporting more distributors

### Phase 3 — Approval Workflow (can start now)
> Account approval process + duplicate detection

- Create Salesforce Approval Process on Account (routing to territory sales rep — mechanism WIP: SF approval screen vs email link)
- Implement Matching Rules for duplicate detection (legal name + zip + license)
- New controller sets `Status__c = 'Pending Approval'` on Account creation (`RegisterController` untouched)
- Community User created **after approval only** — no login before approval
- Build approval action: create `Pricelist_Account__c` junctions (WIP — auto-assign, pending pricing architecture), set `Route__c`, send activation email

### Phase 4 — Payment Method (blocked on BMS-3930)
> Placeholder now, real integration later

- Build a **placeholder Step 3** in the LWC — fictitious payment UI, no validation, saves nothing
- Swap in real provider integration when BMS-3930 decision lands
- Future: `Payment_Method__c` object, tokenization, `Is_Default__c` logic

### Phase 5 — Drafts (lowest priority)
> Save + resume incomplete registrations

- Create `Registration_Draft__c` custom object
- Save draft on each step completion
- Resume logic keyed by email
- Scheduled batch for 30-day expiry + purge

---

## Open Questions — Decisions Log (2026-04-20)

| # | Question | Decision | Notes |
|---|---|---|---|
| 1 | Search-then-select vs always-create-new Account flow? | **Net-new component** | Do NOT modify `ecomRegister`. Build a separate Gulf-specific registration LWC (e.g. `ecomGulfRegistration`). The existing component stays as-is for TBM. Experience Cloud site routing handles which component a retailer sees based on the `/nav-link`. Two registration paths, two components, zero regression risk. |
| 2 | Payment provider (Stripe, Rainforest, SF Payments, etc.)? | **WIP** | Blocked on BMS-3930. For now, build a placeholder payment step in the LWC — fictitious UI component, no validation, saves nothing. Swap in real integration when provider decision lands. |
| 3 | Approval routing: territory rep, regional mgr, or centralized? | **WIP — leaning territory sales rep** | Direction is territory sales rep, but the mechanism is unresolved: Salesforce approval screen? Email approval link? Something else? Needs final say from Gulf ops. |
| 4 | Pricing code: auto-assign or manual by approver? | **WIP — gut says auto-assign** | Parked until pricing architecture lands in the package (per Leah's comment 2026-04-20). |
| 5 | Address validation: third-party or state-code gate? | **State-code gate** | Simple state-code validation for FL/AL territories. Future upgrade path: third-party service (SmartyStreets, Google Places, Experian) for real address normalization + geocoding when the platform needs to support more distributors or do fulfillment location matching by proximity. |
| 6 | `Status__c` / `Source__c` in OHFY-Ecom or OHFY-CORE? | **WIP — parked** | Fields don't exist in CORE today. Part of user creation flow but package home TBD. |
| 7 | Community User created at registration or after approval? | **After approval** | Per the ticket: Account starts at `Pending Approval`, retailer gets emailed when approved, user created at that point. No login before approval. |
| 8 | Document uploads (license, resale cert) — this ticket or follow-up? | **Out of scope** | Follow-up ticket. Confirmed per ticket description. |

---

## File References (Current Codebase)

| File | Role |
|---|---|
| `force-app/main/default/lwc/ecomRegister/ecomRegister.js` | LWC controller — 3-step flow, search, validation, phone formatting |
| `force-app/main/default/lwc/ecomRegister/ecomRegister.html` | LWC template — step indicator, forms, confirmation screen |
| `force-app/main/default/classes/RegisterController.cls` | Apex — `searchAccounts`, `registerUser`, `loginUser` |
| `force-app/main/default/classes/RegisterController_T.cls` | Apex test class |
| `force-app/main/default/classes/EcomBrandingController.cls` | Branding resource loader (used for logo) |

---

*Created 2026-04-20 by Alvaro Sanchez as a planning artifact for BMS-3926. Not a spec — decisions above must be resolved before implementation begins.*
