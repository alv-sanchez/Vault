---
ticket: BMS-4192
title: "Sales rep notifications on order confirmation (rep contact in retailer email + new rep-facing email)"
type: Story
status: In Progress — Apex shipped, pending QA
priority: High
assignee: Alvaro Sanchez
reporter: Alvaro Sanchez
epic:
sprint:
labels:
  - ecom
  - go-live
  - notifications
package: E-Commerce
effort: S
components:
  - Order Confirmation Email Template (existing, edit)
  - Sales Rep Order Notification Email Template (new, Salesforce Setup)
  - OrderConfirmationService.cls — new sendRepNotification() method
  - Configuration_Preference__mdt — new record (ecomOrderRepNotificationTemplateId)
  - Account.Sales_Rep__c — existing Core field (rep lookup)
  - Notification_Log__c — audit trail for send attempts
blocked_by:
blocks:
created: 2026-04-13
updated: 2026-04-14
jira: https://ohanafy.atlassian.net/browse/BMS-4192
tags:
  - ticket
  - ecom
---

# BMS-4192: Sales rep notifications on order confirmation |ECOM|

## Related
- Manager note (retailer confirmation side): [[confirmation-email-sales-rep-contact]]
- Manager note (rep notification side): [[sales-rep-order-confirmation-email]]
- Sibling draft: [[DRAFT-XXX-automated-reorder-reminders]] (shares rep-assignment lookup)
- Testing: [[BMS-XXXX]] (once cut)
- Docs: [[notification-services]]

---

**Priority**: High
**Effort**: S (half a day for the Apex + field; template + CMDT record are admin setup)
**Components**:
- Retailer order confirmation email template (edit — Salesforce Setup)
- Sales rep order notification email template (new — Salesforce Setup)
- `OrderConfirmationService.cls` — new `sendRepNotification()` method
- `Configuration_Preference__mdt` — new record (`ecomOrderRepNotificationTemplateId`) for the on/off + template reference
- `Account.Sales_Rep__c` — existing Core field, dereferenced to `User.Email`

## Scope — this story bundles two closely-related asks

Both asks were raised in the go-live feedback list, share the same rep-assignment field lookup, and the manager triage recommended shipping them as one notifications PR:

1. **Retailer-facing change**: The order confirmation email the **retailer** already receives should include the assigned sales rep's name and email so they know who to contact if something goes wrong.
2. **New rep-facing email**: The assigned sales rep should receive a **new** email whenever their retailer submits an order, giving them visibility into their book of business.

Splitting these into two tickets would double the discovery cost (both need the same "which field holds the rep" answer) and risks the two emails drifting apart in tone and merge-field logic.

## Story Statement

As a **Retailer**, I want **my assigned sales rep's name and email to appear in the order confirmation email**, so that **I know exactly who to contact if something goes wrong with my order**.

And as an **Internal Sales Rep**, I want to **receive an email every time one of my assigned retailers submits an order**, so that **I have real-time visibility into my book of business and can proactively support my accounts**.

## Acceptance Criteria

### SCENARIO: Retailer confirmation email includes rep contact (accounts with an assigned rep)
**GIVEN** a retailer's account has an assigned sales rep
**WHEN** the retailer submits an order through the ecom portal
**THEN** the order confirmation email body displays the rep's name and email address
**AND** the rep contact section is clearly labeled (e.g., "Your Sales Rep:")
**AND** the email address renders as a clickable `mailto:` link

### SCENARIO: Retailer confirmation email gracefully falls back when no rep is assigned
**GIVEN** a retailer's account has no assigned sales rep
**WHEN** the retailer submits an order through the ecom portal
**THEN** the confirmation email falls back to a generic support contact address
**AND** no blank line or broken merge field is shown
**AND** the fallback address is configurable (not hardcoded)

### SCENARIO: Sales rep receives an email when their retailer submits an order
**GIVEN** a retailer's account has an assigned sales rep
**WHEN** the retailer submits an order through the ecom portal
**THEN** the assigned rep receives an email notification within 1 minute
**AND** the email subject clearly identifies the retailer account and order number
**AND** the email body includes retailer name, account name, order number, submitted date/time, order total, and delivery date
**AND** the email includes a deep link to the Order record in Salesforce

### SCENARIO: No duplicate rep email when an order is edited after submission
**GIVEN** a retailer has submitted an order and the rep has already received the notification email
**WHEN** the retailer (or a rep on their behalf) edits the order
**THEN** a second rep notification email is NOT sent
**AND** the original email remains the single source of truth for the "new order submitted" event

### SCENARIO: No rep email when the account has no assigned rep
**GIVEN** a retailer's account has no assigned sales rep (`Account.Sales_Rep__c` is null)
**WHEN** the retailer submits an order through the ecom portal
**THEN** no rep notification email is sent (rather than failing or sending to a generic address)
**AND** the event is logged to `Notification_Log__c` with status `Skipped` so unassigned accounts can be audited later

### SCENARIO: Rep notifications globally disabled via configuration
**GIVEN** the `Configuration_Preference__mdt` record with `Key__c = 'ecomOrderRepNotificationTemplateId'` has `Active__c = false` (or no record exists)
**AND** the account has an assigned sales rep
**WHEN** the retailer submits an order through the ecom portal
**THEN** no rep notification email is sent
**AND** the event is logged to `Notification_Log__c` with status `Skipped` and a message referencing the inactive config key
**AND** admins can turn the feature back on by flipping `Active__c` to `true` — no code deploy needed

### SCENARIO: Existing retailer confirmation email content is unchanged
**GIVEN** a retailer submits any order
**WHEN** the confirmation email is sent
**THEN** all previously-existing content (order summary, delivery date, total, line items) renders identically to the pre-change version
**AND** the new rep contact section appears as an additive block, not a replacement

## Dependencies

- **Cannot Start Until**: None — rep field confirmed as `Account.Sales_Rep__c` (lookup to `User`, existing Core field)
- **This Story Unlocks**: Automated reorder reminders (reuses the same rep lookup and the same email framework)
- **Ships With**: N/A (self-contained bundle)
- **Admin prerequisites before the Apex can send**: (1) create the new email template in Salesforce Setup, (2) create the `Configuration_Preference__mdt` record with `Key__c = 'ecomOrderRepNotificationTemplateId'`, `Value__c` pointing at the template (DeveloperName or 18-char Id), and `Active__c = true`

## Testing Notes

### Retailer-side testing
- Verify rep name + email appear for accounts WITH an assigned rep
- Verify fallback address appears for accounts WITHOUT a rep assigned
- Verify no blank line or broken merge field when rep is null
- Verify the `mailto:` link opens the default mail client correctly
- Verify the email still renders on mobile clients (Gmail app, Outlook iOS)
- Regression: confirm pre-existing content (order number, delivery date, line items, total) is unchanged

### Rep-side testing
- Submit an order for an account with an assigned rep — verify the rep gets the email within 1 minute
- Submit an order for an account WITHOUT an assigned rep — verify NO email is sent and the unassigned event is logged
- Verify email subject contains retailer account name and order number
- Verify email body contains: retailer name, account name, order number, submitted timestamp, order total, delivery date, Salesforce deep link
- Verify the Salesforce deep link opens the correct Order record
- Submit an order, then edit it within 30 seconds — verify only ONE email is sent to the rep
- Submit orders for two different retailer accounts owned by the same rep — verify the rep gets two separate emails, correctly attributed to each retailer

### Configuration_Preference__mdt gate coverage
- **Feature on** (`Active__c = true`, valid template reference) → rep email fires, `Notification_Log__c` has `Sent` entry with `[ORDER_CONFIRMATION_REP]` prefix
- **Feature off** (`Active__c = false`) → no rep email, `Notification_Log__c` has `Skipped` entry with message referencing the inactive config
- **Config record missing entirely** → no rep email, `Skipped` logged with appropriate message
- **`Value__c` blank** → no rep email, `Skipped` logged; do NOT fall back to a default template (fail-closed)
- **`Value__c` points at a template that doesn't exist** → no rep email, `Notification_Log__c` has `Failed` entry with the template reference in the error message
- **Flip config live** — submit an order with `Active__c = false`, flip to `true`, submit another order → second order triggers the email; no server bounce needed (CMDT reads are cached per transaction, not per session)

### Shared / rep-field resolution
- Confirm `Account.Sales_Rep__c` resolves correctly via `Customer__r.Sales_Rep__r.Email` on the Order
- Confirm the SOQL query bulks correctly when multiple orders are submitted in one `sendOrderConfirmation` call (one query, not N+1)
- Confirm the fallback support address for the RETAILER email (separate from rep notification) is configurable (custom metadata or org-wide email), not hardcoded
- Confirm the flow is idempotent against order status transitions (do not double-fire on Draft→Submitted→Submitted)

### Notification_Log__c audit trail
- Every send attempt produces exactly one log row — no duplicates, no missing rows even on gate failures
- All rep-path entries have the `[ORDER_CONFIRMATION_REP]` prefix in the message so admins can filter
- `Sent` entries include both the `orderId` and the `repUserId` for traceability
- `Skipped` entries include enough context (account id, rep id, or config key) to diagnose why

## Implementation Notes

### Architecture at a glance

```
Order confirmed (LWC)
  → draftInvoiceService.confirmDraft()
    → OrderConfirmationService.sendOrderConfirmation(contactId, recordId, sObjectName)
       ├─ Retailer email path (existing)
       │    Notification__c[ORDER_CONFIRMATION] → Contact_Notification__c → Messaging.sendEmail
       │    (uses the existing per-contact preference framework — unchanged by this ticket)
       │
       └─ Rep notification path (NEW)
            Configuration_Preference__mdt[ecomOrderRepNotificationTemplateId] gate
              → Account.Sales_Rep__c → User.Email → User.IsActive
              → Messaging.renderStoredEmailTemplate(template, null, orderId)
              → Messaging.sendEmail via setToAddresses
              → Notification_Log__c entry ([ORDER_CONFIRMATION_REP] prefix)
```

### Retailer confirmation email (template edit only — no code)

**Scope**: edit the existing order confirmation email template in Salesforce Setup. No new flows, no new Apex, no field changes.

**Merge fields to add** (walks the whatId = `Order__c` chain):
- `{!Order__c.ohfy__Customer__r.Sales_Rep__r.Name}` — rep's full name
- `{!Order__c.ohfy__Customer__r.Sales_Rep__r.Email}` — rep's email as a clickable `mailto:` link

**Null handling**: wrap the rep block in `{!IF(ISBLANK(Order__c.ohfy__Customer__r.Sales_Rep__r.Email), fallback, rep)}` so the section degrades gracefully when an account has no assigned rep. Fallback address should come from an org-wide support alias or a Custom Metadata configuration — not hardcoded in the template.

**Where the template lives**: in the org, not in source. Per the project's convention, Salesforce email templates are not committed as deployable metadata. Admins maintain them in Setup → Classic Email Templates (or Lightning equivalent).

### Sales rep order notification email (new send path)

**New method**: `OrderConfirmationService.sendRepNotification(List<String> orderIds)` — called at the end of the existing `sendOrderConfirmation(...)` method as a fire-and-forget second step. The LWC contract (`sendOrderConfirmation(contactId, recordId, sObjectName)`) does not change.

**Gate (in order — all must pass)**:

| # | Gate | Source | Skip-log message prefix |
|---|---|---|---|
| 1 | Config preference is active | `U_ConfigurationPreferenceMDT.getMetadataActiveStatus('ecomOrderRepNotificationTemplateId')` returns `true` | `[ORDER_CONFIRMATION_REP] Config preference "ecomOrderRepNotificationTemplateId" is not active (or record missing)` |
| 2 | Template key / value present | `U_ConfigurationPreferenceMDT.getMetadataValue('ecomOrderRepNotificationTemplateId')` returns a non-blank string | `[ORDER_CONFIRMATION_REP] Config preference "…" has a blank Value__c — no template configured` |
| 3 | EmailTemplate record exists | SOQL on `EmailTemplate` by Id (if Value__c looks like a 15/18-char alphanumeric) with DeveloperName fallback | `[ORDER_CONFIRMATION_REP] Rep email template not found: "{ref}"` |
| 4 | Rep is assigned | `Account.Sales_Rep__c != null` | `[ORDER_CONFIRMATION_REP] Account {id} has no assigned Sales_Rep__c for order {orderId}` |
| 5 | Rep has an email | `Account.Sales_Rep__r.Email` is non-blank | `[ORDER_CONFIRMATION_REP] Sales rep {userId} has no email address for order {orderId}` |
| 6 | Rep user is active | `Account.Sales_Rep__r.IsActive = true` | `[ORDER_CONFIRMATION_REP] Sales rep {userId} is inactive for order {orderId}` |

Each gate failure writes a `Notification_Log__c` entry with status `Skipped`. Gates 1–3 are global and log once per send batch; gates 4–6 are per-order (checked inside the SOQL result loop).

**Send mechanics** (important Salesforce API caveat): `Messaging.SingleEmailMessage.setWhatId(orderId)` is **not allowed** when `setTargetObjectId` is a User. Because the rep is a User, the code must pre-render the template with `Messaging.renderStoredEmailTemplate(templateId, null, orderId)` and then send the rendered message via `setToAddresses`. This sidesteps the restriction because the rendered message is no longer template-driven from the API's perspective.

```apex
Messaging.SingleEmailMessage rendered = Messaging.renderStoredEmailTemplate(
    templateId,
    null,       // whoId — template uses whatId chain, no who context needed
    order.Id    // whatId — resolves {!Order__c.*} merge fields
);
rendered.setToAddresses(new List<String>{ account.Sales_Rep__r.Email });
rendered.setSaveAsActivity(false);
rendered.setOrgWideEmailAddressId(owa.Id);  // reuse the retailer path's OWA
```

**Template merge fields** (walk the whatId = Order__c chain — no `{!User.*}` because that resolves to the running user, not the target rep):
- Greeting: `{!Order__c.ohfy__Customer__r.Sales_Rep__r.FirstName}`
- Retailer name: `{!Order__c.ohfy__Customer__r.Name}`
- Order number: `{!Order__c.ohfy__Order_Number__c}` (or `{!Order__c.Name}`)
- Delivery date: `{!Order__c.ohfy__Delivery_Pickup_Date__c}`
- Order total: `{!Order__c.ohfy__Order_Total__c}`
- Deep link: `/{!Order__c.Id}` (relative — Salesforce resolves against the recipient's instance at click time)

### Configuration_Preference__mdt record (new)

| Object | Key__c | Value__c | Active__c | Description |
|---|---|---|---|---|
| `Configuration_Preference__mdt` | `ecomOrderRepNotificationTemplateId` | `Ecom_Order_Rep_Notification` (template DeveloperName) or 18-char EmailTemplate Id | `true` | Gates the rep notification feature. Flipping `Active__c` to `false` disables all rep emails org-wide with no code deploy. |

**Why CMDT and not `Notification__c`**: the retailer email path uses `Notification__c` + `Contact_Notification__c` because retailers are Contacts and per-contact opt-out is a real feature. Reps are Users, not Contacts, so per-contact preferences don't apply. A single CMDT key/value + active flag covers everything the rep path needs (on/off + template reference) with less metadata and matches the OHFY-Core convention for global feature switches (e.g. `invoiceEmailTemplateId`).

**Consistency note worth including as an Apex comment**: two different gate patterns in the same `OrderConfirmationService` file is a mild smell. The comment should explain the rationale so anyone reading doesn't assume the inconsistency is accidental:

```apex
// Note: rep path uses Configuration_Preference__mdt (single key/value/active) while
// the retailer path above uses Notification__c + Contact_Notification__c. The rep
// path doesn't need per-contact opt-out (reps are Users, not Contacts), so a
// simpler config key suffices. See BMS-4192 for the design rationale.
```

### Notification_Log__c logging

The existing `writeLog(notificationId, contactId, channel, status, errorMessage)` helper is reused as-is:
- `notificationId` = `null` for rep notifications (no `Notification__c` record to reference)
- `contactId` = `null` for rep notifications (reps are Users, not Contacts)
- `channel` = `'Email'`
- `status` = `'Sent'` / `'Skipped'` / `'Failed'`
- `errorMessage` = prefixed with `[ORDER_CONFIRMATION_REP]` so admins can filter the log by source

Every gate decision writes exactly one log entry. Successful sends log `Sent` with a message like `[ORDER_CONFIRMATION_REP] Rep notification sent for order {orderId} to user {repUserId}`.

**Follow-up improvement (not in V1)**: add a `Source_Config_Key__c` text field to `Notification_Log__c` so admins can filter by the CMDT key directly instead of relying on a message prefix. Left out of this ticket to keep the scope tight — file as a follow-up if audit/compliance pushes back.

### draftInvoiceService.js — no changes

The existing `confirmDraft()` method already passes everything needed to `sendOrderConfirmation(contactId, recordId, sObjectName)` as a fire-and-forget call. Because the rep send happens inside the Apex method (not a second LWC call), the LWC contract stays stable and no frontend changes are required for this ticket.

### Out of scope

- Daily digest option for reps (default is every-order per stakeholder guidance)
- SMS notification to rep (lives in the automated-reorder-reminders story)
- Notification to the retailer that the rep received their order
- Per-rep opt-out (would require a new `User_Notification__c` object or a custom field on User — not in V1)
- Per-account opt-out for rep notifications (removed during implementation — file as a follow-up if any customer ever needs it)
- Adding a `Source_Config_Key__c` field to `Notification_Log__c` (follow-up if needed)

## Open Questions

### Resolved
- [x] **Rep assignment field** → `Account.Sales_Rep__c` (existing Core field, lookup to `User`, dereferenced to `User.Email`)
- [x] **Gate pattern** → `Configuration_Preference__mdt` with a single `ecomOrderRepNotificationTemplateId` key (not a new `Notification__c` record) — matches the OHFY-Core convention for global feature switches, and per-rep opt-out isn't in V1 scope
- [x] **On/off mechanism** → `Active__c` flag on the CMDT record, checked via `U_ConfigurationPreferenceMDT.getMetadataActiveStatus('ecomOrderRepNotificationTemplateId')`
- [x] **Template reference format** → `Value__c` holds the EmailTemplate DeveloperName (portable across sandbox/prod refreshes); the Apex also tolerates an 18-char Id for flexibility
- [x] **Per-account opt-out** → removed during implementation. Rep notifications fire for every account with an assigned, active rep. If a customer ever needs per-account suppression, file a follow-up ticket.
- [x] **Audit logging** → reuse existing `Notification_Log__c` + `writeLog` helper; rep-path entries get `[ORDER_CONFIRMATION_REP]` prefix in the message for filterability

### Still open
- [ ] **Null-rep fallback address for the retailer confirmation email** — org-wide support alias, or a dedicated config? (Retailer side only — does not affect rep send path.)
- [ ] **Rep email content** — summary only, or include full line-item breakdown? Affects template design, not Apex.
- [ ] **Should rep email also fire for orders placed BY the rep on behalf of the retailer?** Probably no — rep already knows they placed it. Could be enforced via a criteria check in `sendRepNotification`, but needs stakeholder confirmation before coding.

## Notes from Manager Triage

Both asks were triaged as **DO NOW** go-live blockers and explicitly recommended for bundling.

### Retailer confirmation (from [[confirmation-email-sales-rep-contact]])
> **Sentiment source**: Decision rule #6 — visibility/trust for a retailer who's flying blind when something goes wrong. Decision rule #3 — config-only change with zero risk.
>
> **Why NOW**: Ships retailer trust at the moment they're most anxious (right after submitting). Template edit is trivial.

### Rep notification (from [[sales-rep-order-confirmation-email]])
> **Sentiment source**: Decision rule #6 — visibility/trust for the sales team, who otherwise have zero insight into their own book of business on day 1. Decision rule #3 — config-only work with zero risk.
>
> **Why NOW**: Massive trust payoff with the sales team pre-launch. Half a day of config work (flow + template). Zero risk — it's an additional email, not a behavior change. Pairs naturally with the retailer-side change since both need the same rep-assignment field lookup — ship them together as one notifications PR.
