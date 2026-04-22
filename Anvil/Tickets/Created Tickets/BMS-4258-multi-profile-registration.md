---
ticket: BMS-4258
title: "Multi-profile Registration on Ecomm (Multiple Businesses belonging to one profile)"
type: Story
status: Backlog
priority: TBD
assignee: Alvaro Sanchez
reporter: elliot.flores
epic: BMS-3702
sprint: Sprint 2
labels:
  - gulf
  - ecom
package: E-Commerce
effort: M
components:
  - ecomRegister (LWC)
  - RegisterController (Apex)
  - Contact
  - AccountContactRelation
blocked_by:
blocks:
created: 2026-04-21
updated: 2026-04-21
jira: https://ohanafy.atlassian.net/browse/BMS-4258
tags:
  - ticket
  - ecom
---

# BMS-4258: Multi-profile Registration on Ecomm (Multiple Businesses belonging to one profile) |ECOM|

## Related
- Testing: [[BMS-4258]] (in Testing/)
- Docs: [[BMS-4258]] (in Documentation/)
- Sibling: [[BMS-4071]] — Registration SMS opt-in / license validation (same registration flow)
- Parent Epic: [[BMS-3702]] — Gulf E-Commerce & Ordering

---

**Priority**: TBD (recommend High — onboarding blocker for multi-location customers)
**Effort**: M
**Components**: ecomRegister (LWC), RegisterController (Apex), Contact, AccountContactRelation

## Story Statement

As a retailer contact who operates multiple businesses (e.g., a hospitality group with several bars, restaurants, or retail locations under one person), I want to register all of my businesses during a single ecom onboarding flow, so that I only sign up once and can switch between my accounts after login instead of creating a separate user per business.

## Acceptance Criteria

### SCENARIO: Retailer selects multiple businesses during registration
**GIVEN** I am on the registration page and have completed the business search on Step 1
**AND** the search returns more than one account that matches my business name, ZIP, and license
**WHEN** I click on additional matching businesses
**THEN** each selected business is visually marked as selected
**AND** a running count of selected businesses is visible (e.g., "3 businesses selected")
**AND** the Continue button remains enabled as long as at least one business is selected

### SCENARIO: Retailer searches again to add businesses from a different ZIP or license
**GIVEN** I have already selected one or more businesses from a prior search
**WHEN** I change the search criteria (business name, ZIP, or license) and re-run the search
**THEN** my previously selected businesses remain selected and are preserved in the running list
**AND** the new search results appear below, where I can select additional businesses
**AND** selected businesses from prior searches are clearly surfaced (e.g., chip list or "Selected Businesses" panel) so I can review and deselect them

### SCENARIO: Retailer removes a business before continuing
**GIVEN** I have selected multiple businesses
**WHEN** I deselect a business (by clicking it again or clicking a remove icon on the selected list)
**THEN** that business is removed from my selection
**AND** if the remaining selection is empty, the Continue button is disabled

### SCENARIO: Retailer completes registration with multiple businesses
**GIVEN** I have selected two or more businesses and completed Step 2 (contact info: first/last name, email, phone, title, SMS opt-in)
**WHEN** I submit the registration
**THEN** a single Contact is created and associated to all selected businesses
**AND** a single Experience Cloud User is created for that Contact
**AND** a welcome email is sent only once (not once per business)
**AND** after login, I can access order history, cart, and profile for any of my registered businesses

### SCENARIO: Duplicate contact exists on one of the selected businesses
**GIVEN** I have selected three businesses to register
**AND** one of the selected accounts already has a Contact with my email address
**WHEN** I submit the registration
**THEN** the system blocks registration and surfaces a clear error naming the conflicting business (e.g., "A contact with this email already exists for [Business Name]")
**AND** no partial records are created (no orphan contact, no orphan account relations, no user)
**AND** I am returned to Step 2 with my entered data preserved so I can correct and retry

### SCENARIO: One selected business has an expired alcohol license
**GIVEN** I have selected multiple businesses during the search step
**AND** at least one selected business requires an alcohol license and that license is expired
**WHEN** I attempt to continue to Step 2
**THEN** registration is blocked
**AND** I see the existing expired-license error message, naming the specific business that is expired
**AND** I can deselect that business and proceed with the remaining valid selections

### SCENARIO: Username already exists in Salesforce
**GIVEN** I have selected one or more businesses and entered my contact details
**AND** a Salesforce User already exists with my email as the username
**WHEN** I submit registration
**THEN** the system blocks the registration with the existing duplicate-user error
**AND** no Contact records or Account relationships are created for any of the selected businesses

### SCENARIO: Single-business registration still works unchanged
**GIVEN** I am registering for exactly one business
**WHEN** I go through the flow
**THEN** the experience is equivalent to today's behavior — I can select one business, continue, enter my info, and submit
**AND** no new required steps are introduced for the single-business path

## Out of Scope
- Account-switching UI after login (the ability to toggle between accounts inside the storefront). This ticket only covers registering a contact against multiple accounts; the post-login switcher is a separate story.
- Allowing a retailer to invite additional users to any of their registered businesses.
- Admin-side tooling for merging existing single-account contacts into a multi-account contact.
- Creating businesses that do not already exist in Salesforce (registration still searches existing Accounts only).

## Dependencies
- **Cannot Start Until**: None (current registration flow is in place)
- **This Story Unlocks**: Account-switching UX post-login (future story — not yet ticketed), multi-account order history filtering
- **Ships With**: None identified

## Testing Notes
- Key fields involved: `Contact.AccountId` (primary), `AccountContactRelation` records for secondary accounts, `Contact.Email`, `User.Username`, `ohfy__SMS_Opt_In__c`, `ohfy__State_License_Number__c`, `ohfy__License_Expiration_Date__c`, `ohfy__Alcohol_License_Required__c`
- Edge cases:
  - Selecting the same account twice across two searches (must dedupe)
  - One of N selected accounts has duplicate contact email — entire transaction must roll back
  - One of N selected accounts has expired license — block with a business-specific message
  - Running Step 1 search, selecting accounts, then navigating back from Step 2 (selections must persist)
  - User hits Register with 0 selected businesses (button must be disabled; if somehow submitted, Apex must reject)
- Error states: duplicate contact (per account), duplicate username (global), expired license (per account), user-creation failure (Site.createExternalUser equivalent) — every error path must clean up so there are no orphan Contact, AccountContactRelation, or User records
- Flows to verify end-to-end:
  1. Search → select one business → complete registration → confirm post-login context shows that business
  2. Search → select three businesses across two searches → complete registration → confirm Contact is linked to all three (one primary via `AccountId`, two via `AccountContactRelation`) and a single User was created
  3. Register with multiple businesses → log in → verify order history, pricelist, and cart are scoped correctly for at least the primary account

## Implementation Notes
- **LWC**: `ecomRegister` (`force-app/main/default/lwc/ecomRegister/ecomRegister.js`) currently uses `@track selectedAccount = null` (single object). Convert to a `selectedAccounts` array (or Map keyed by account Id). Update:
  - `handleSelectAccount` — toggle in/out of the array instead of replacing
  - `isStep1ContinueDisabled` — check `selectedAccounts.length === 0`
  - `selectedAccountName` / `selectedAccountLocation` getters — replace with a "Selected Businesses" panel/chip list in the template
  - Step 2 confirmation view needs to display all selected businesses, not just one
- **Apex**: `RegisterController.registerUser` currently takes a single `accountId`. Refactor to accept `List<String> accountIds` (or JSON payload). Logic changes:
  - Validate every `accountId` exists (not just one)
  - Duplicate-contact check must run per account and fail if any match
  - Expired-license check in `searchAccounts` already filters at search time — but re-validate the selected set on submit in case data changed between search and submit
  - Wrap Contact + AccountContactRelation + User creation in a single logical unit; on any failure, delete the Contact and any inserted relations to avoid orphans. Consider `Database.setSavepoint()` / `rollback()` rather than manual cleanup.
  - Pick which account is "primary" (i.e., `Contact.AccountId`) — recommend first selected, but confirm with stakeholder. Remaining accounts go on `AccountContactRelation`.
- **Data model**: Salesforce requires `AccountContactRelation` for a contact to belong to multiple accounts. Confirm the target org has "Allow users to relate a contact to multiple accounts" enabled in Setup. If not, that's a prerequisite configuration task.
- **Login / session**: current `loginUser` logs the user in against `Site.login`. No change expected, but confirm that the user's effective account context post-login behaves sensibly when they have N accounts (this is where the follow-up account-switcher story will pick up).
- **Tests**: `RegisterController_T` needs new cases for multi-account registration: happy path with 2+ accounts, duplicate-contact-on-one-of-N rollback, expired-license-on-one-of-N block, single-account backward compatibility.

---

## Assumptions Made (Needs Stakeholder Validation)

The Jira ticket is a single-sentence ask with no comments or attachments. The following assumptions were made to produce a reviewable draft:

1. **Multi-account data model**: Assumed one Contact + `AccountContactRelation` for secondary accounts, rather than N separate Contacts. This is the standard Salesforce pattern but should be confirmed.
2. **Single user, not N users**: Assumed one Experience Cloud User is created regardless of how many businesses are selected. If stakeholders want a separate login per business, the story is significantly different.
3. **Primary account designation**: Assumed the first selected business becomes the Contact's primary `AccountId`. May need a UI affordance to let the user pick.
4. **Post-login switching is out of scope**: Assumed this ticket stops at registration and a separate follow-up handles account-switching UX. If switching is expected in the same story, the ticket should be split or expanded.
5. **Search UX**: Assumed the user may run multiple searches (different ZIP or license) and accumulate selections across them. If stakeholders only want multi-select within a single search result, simplify.
6. **Welcome email frequency**: Assumed one welcome email per contact, not one per account. Confirm with notification owner.
7. **Priority**: Ticket is "TBD" — flagged as High because onboarding friction for multi-location retailers is a conversion blocker, but formal priority is stakeholder's call.
