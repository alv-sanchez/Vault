---
ticket: BMS-3921
title: "Retailer Engagement Notifications (Gulf)"
type: Story
parent_epic: "BMS-3702 — Gulf E-Commerce & Ordering"
blocked_by: "BMS-3930 — Retailer credit terms display & payment status (link likely mis-scoped — see Polish Notes)"
status: "Backlog"
sprint: "Sprint 2 (2026-05-02 → 2026-05-15)"
repo_scanned: "/Users/alvarosanchez_1/Documents/OHFY-Ecom/force-app/main/default"
polished_on: 2026-04-22
polished_by: Alvaro Sanchez
jira: https://ohanafy.atlassian.net/browse/BMS-3921
tags: [polish, ecom, gulf, notifications, twilio, abandoned-cart]
---

# BMS-3921 — Jira-Ready

**Title:** Retailer Engagement Notifications (Gulf)

**Description:**

Gulf's route-based delivery model depends on retailers placing orders before territory-specific cutoff windows. The OHFY-Ecom notification framework is already substantially built — `Notification__c`, `Contact_Notification__c`, `Notification_Log__c` objects, `NotificationPreferenceController`, `OrderConfirmationService`, `TwilioSMSService` (Twilio Content Templates, ContentSid-based), and `AbandonedCartReminderBatch` + scheduler (which, per the code, also handles the delivery-cutoff case in a unified pass). This story adds the **Gulf-specific delta**:

1. Gulf-branded **email templates** for abandoned cart, delivery cutoff, and promotion activation. (No email templates ship in OHFY-Ecom today.)
2. Gulf **Twilio Content Templates** (ContentSid entries) and matching variable contracts in `TwilioSMSService`.
3. A **sales rep stalled-cart alert** — notify the account's assigned rep when a retailer's cart passes a (separate, higher) threshold. This does not exist today; all notifications target the Contact (retailer).
4. A **promotion-activation notification path** triggered when a `Price_Record__c` (or the OHFY-Ecom-equivalent pricelist promotion record — see Open Questions) becomes active for a territory.
5. Notification **preference respect** verification end-to-end — `Contact_Notification__c.Email_Enabled__c` and `SMS_Enabled__c` already exist; assert the end-to-end path suppresses correctly.
6. A decision on **per-territory cutoff configuration** — today cutoff is sourced from the fulfillment location's `ohfy__Warehouse_Cutoff_Time__c`. If Gulf needs finer-grained per-route cutoffs, add that config; otherwise keep the location-level source.

**Current State (2026-04-22, per OHFY-Ecom codebase scan):**
- `objects/Notification__c/`, `objects/Contact_Notification__c/` (fields `Email_Enabled__c`, `SMS_Enabled__c`, `Contact__c`, `Notification__c`), `objects/Notification_Log__c/` (`Channel__c`, `Status__c`, `Sent_At__c`, `Error_Message__c`, `Contact__c`, `Notification__c`) — all exist.
- `classes/notifications/NotificationPreferenceController.cls` — `initializeContactNotifications`, `getNotificationPreferences`, `saveNotificationPreference` (used by `ecomProfilePage`).
- `classes/notifications/TwilioSMSService.cls` — Twilio Content API via ContentSid; helper builders `abandonedCartVars`, `deliveryCutoffVars`, etc.; `send()` + `sendAndInsertLog()`.
- `classes/notifications/OrderConfirmationService.cls` — confirmation on order submit.
- `classes/notifications/AbandonedCartReminderBatch.cls` + `AbandonedCartReminderScheduler.cls` — **single unified batch handles both abandoned cart and delivery-cutoff cases**. Threshold comes from `Notification__c.Threshold_Hours__c`. Cutoff time comes from `Account.ohfy__Fulfilled_From__r.ohfy__Warehouse_Cutoff_Time__c`. Cutoff date is computed as the last business day before delivery (Mon delivery ⇒ Fri cutoff; otherwise day-before).
- `objects/Delivery__c/` — delivery schedule records queried by the scheduler.
- `ecomProfilePage` — already exposes Email + SMS toggles per notification.
- **Missing:** dedicated `DeliveryCutoffReminderBatch` + scheduler (the ticket stub claims separate classes — it's actually one unified batch). Per-territory cutoff windows. Gulf-branded email templates (no email templates in repo at all). Sales rep stalled-cart alert path. Promotion-activation trigger.

**Out of Scope:**
- In-app / bell-icon notification center — no such component in OHFY-Ecom today; splitting to a follow-up unless explicitly in scope.
- SMS consent collection flow — already handled at registration via `Contact.SMS_Opt_In__c`.
- Payment overdue notifications — follows BMS-3930 if/when AR visibility lands.
- Push notifications / mobile.

**Acceptance Criteria:**

```gherkin
Scenario: Order cutoff reminder sent to retailer via preferred channels
  Given a retailer on the Montgomery AL Tuesday route has an unsubmitted cart
  And   the next Delivery__c for their account is Tuesday 2026-05-12 with Warehouse_Cutoff_Time__c = 14:00 on Monday
  And   the current time is Monday 2026-05-11 02:00
  And   the retailer's Contact_Notification__c for "Delivery Cutoff Reminder" has Email_Enabled__c = true and SMS_Enabled__c = true
  When  AbandonedCartReminderScheduler evaluates the 12-hour-before threshold
  Then  the retailer receives an email referencing the Montgomery AL cutoff time of 14:00 Monday 2026-05-11
  And   the retailer receives a Twilio SMS using the Gulf "DeliveryCutoff" Content Template with vars = {accountName, firstName, deliveryDate, cutoffTime}
  And   a Notification_Log__c row is inserted per channel with Status__c = 'Sent' or 'Failed'
  And   the email includes a deep link to /cart on the Gulf portal

Scenario: Abandoned cart reminder respects channel preferences
  Given a retailer has an unsubmitted cart older than Notification__c.Threshold_Hours__c (default 24) for "Abandoned Cart"
  And   Contact_Notification__c for that retailer has Email_Enabled__c = false, SMS_Enabled__c = true
  When  the batch runs
  Then  no email is sent
  And   a Twilio SMS is sent using the Gulf "AbandonedCart" Content Template
  And   Notification_Log__c reflects Channel__c = 'SMS' only; no Email log row exists

Scenario: Sales rep stalled-cart alert when retailer crosses rep threshold
  Given a retailer's cart has been stalled for more than Notification__c.Rep_Alert_Threshold_Hours__c (new field, e.g. 48)
  And   the retailer has not submitted the order
  When  the batch evaluates the stalled carts
  Then  the Account.OwnerId (sales rep User) receives a single notification listing the retailer, cart item count, cart total, and route cutoff
  And   the notification is delivered via email only (reps are internal users, not Contacts with Twilio opt-in)
  And   a Notification_Log__c row is inserted tying the log to the rep's User record and the retailer's Account
  And   subsequent runs within the same stalled cycle do not re-notify (suppression by Account + open cart)

Scenario: Active promotion notification dispatched to eligible retailers
  Given a pricelist promotion for the Mobile AL and Huntsville AL territories becomes active today
  And   eligible retailers have Contact_Notification__c for "Promotion Active" with Email_Enabled__c = true
  When  the promotion-activation trigger fires
  Then  every eligible retailer's primary Contact receives an email referencing the promotion name, discount description, start date, and end date
  And   retailers outside the eligible territories receive no notification
  And   Notification_Log__c logs one row per recipient; failures are retried per platform standard error handling

Scenario: Notification suppressed when order already submitted for the cycle
  Given a retailer has already submitted an Order__c with Status__c = 'Submitted' for the current delivery cycle
  When  AbandonedCartReminderBatch evaluates the retailer
  Then  no cutoff reminder or abandoned-cart notification is generated
  And   promotion-activation notifications still dispatch if new promotions are published
  And   Notification_Log__c has no duplicate or erroneous rows

Scenario: Gulf-branded email template rendered end-to-end
  Given OHFY-Ecom is deployed with Gulf email templates (AbandonedCart_Gulf, DeliveryCutoff_Gulf, PromotionActive_Gulf)
  When  any notification batch renders an email
  Then  the email header shows the Gulf logo (via the Ecom_Branding__mdt pattern from BMS-3923)
  And   footer and call-to-action styling match Gulf brand tokens
  And   templates render correctly in Outlook desktop, Apple Mail, Gmail web, and the Gulf portal preview

Scenario: Gulf Twilio Content Templates referenced by ContentSid
  Given Gulf Twilio Content Templates are provisioned for AbandonedCart, DeliveryCutoff, and PromotionActive
  When  TwilioSMSService.send is invoked
  Then  the payload references the Gulf ContentSid for the matching notification type
  And   the variable map matches the template's expected positional arguments
  And   a failed dispatch results in Notification_Log__c.Status__c = 'Failed' with Error_Message__c set

Scenario: Preference toggle change takes effect on next run
  Given a retailer disables SMS for "Delivery Cutoff Reminder" on the ecomProfilePage
  When  NotificationPreferenceController.saveNotificationPreference persists the change
  Then  the next scheduler run for that retailer sends only email (if email is enabled) or neither if both disabled
  And   no retroactive re-sending occurs for previously dispatched notifications

Scenario: Per-territory cutoff sourced from Account's fulfillment location (decision-gate AC)
  Given today's implementation sources the cutoff time from Account.ohfy__Fulfilled_From__r.ohfy__Warehouse_Cutoff_Time__c
  When  product decides whether Gulf needs finer per-route cutoffs
  Then  either (a) we confirm location-level cutoff is sufficient for all 5 Gulf warehouses and close the question, or
  (b) we add a Route__c.ohfy__Cutoff_Time__c and route the scheduler to prefer route-level over location-level
  # DECISION REQUIRED BEFORE SPRINT COMMIT
```

**Technical Approach:**

1. **Gulf email templates:** Add Lightning Email Templates (`email/` folder, Enhanced Letterhead or HTML) named `Gulf_AbandonedCart`, `Gulf_DeliveryCutoff`, `Gulf_PromotionActive`. Reference Gulf branding assets via the Ecom_Branding pattern shipped in BMS-3923. Merge fields: `{!Contact.FirstName}`, `{!Account.Name}`, `{!Delivery__c.Scheduled_Date__c}`, `{!cutoffTime}`, `{!promotionName}`.
2. **Gulf Twilio Content Templates:** Provision 3 templates in Twilio Console. Capture the ContentSids in a new `ohfy_Gulf_Twilio_Template__mdt` or extend `Notification__c` with a `Twilio_Content_Sid__c` field so the scheduler picks up the template per notification type. Update `TwilioSMSService` helper var-builders only if new fields are required.
3. **Sales rep stalled-cart alert:**
   - Add `Notification__c.Rep_Alert_Threshold_Hours__c` (Number) OR define a new `Notification__c` record of Type `Rep_Stalled_Cart` with its own threshold.
   - Extend `AbandonedCartReminderBatch.execute` to include a second pass: for carts exceeding the rep threshold, enqueue an email to `Account.OwnerId`'s User.Email.
   - Suppression: record `Notification_Log__c` keyed by Account + current cart id; before enqueueing, check for an existing unresolved log entry in the same cycle.
4. **Promotion-activation trigger:**
   - Identify the OHFY-Ecom pricelist promotion record (not `Price_Record__c` — confirm via BMS-4049 spike). Add a trigger on that record that, when `Is_Active__c` flips true, enqueues a Queueable that enumerates eligible retailers (by territory/warehouse) and dispatches via existing email + SMS services.
5. **Per-territory cutoff decision:** Default implementation stays on the fulfillment location. If product decides per-route cutoffs are required, add `Route__c.ohfy__Cutoff_Time__c` and change the scheduler to `coalesce(Route cutoff, Warehouse cutoff)`.
6. **Testing:** Apex tests for `AbandonedCartReminderBatch` (both paths), stalled-cart suppression, and promotion trigger; Playwright E2E smoke to assert the ecomProfilePage toggle persists and the next run respects it.

**Open Questions (carry to refinement):**
- **Channels for Phase 2** (from Jira): Email + SMS are the confirmed channels today. Is in-app (bell icon + notification center) in scope for this story, a follow-up, or explicitly deferred? Emily's product note on the ticket calls out this ambiguity.
- **Emily's 2026-04-15 comment**: "This feels like this duplicates work that Sanchez already completed for TBM." Confirm which parts of the TBM notification work are reusable vs. need re-implementation for Gulf's scale (154+ pricing codes, 5 warehouses).
- **Cutoff threshold defaults**: ticket implies 12 hours; code defaults to 24. What is the Gulf-approved default per warehouse?
- **Promotion notification trigger semantics**: auto-notify on `Is_Active__c` flip, or require a merchandising manager to explicitly opt in per promotion via a `Notify_On_Activation__c` flag?
- **Rep threshold**: what value does Gulf want (48h default? per-territory)? Does the rep get per-account alerts or a daily digest?
- **BMS-3930 "blocks" link**: credit-terms UI is not a prerequisite for cutoff reminders. Recommend removing the link.

**Estimate:** Medium — ~4-5 days.
- 1d email templates + static assets
- 0.5d Twilio Content Template wiring + ContentSid config surface
- 1.5d rep stalled-cart batch extension + suppression
- 1d promotion trigger + Queueable
- 0.5d Apex + Playwright tests
- 0.5d refinement buffer

---

# BMS-3921 — Polish Notes

## Verdict at a Glance

**Ready for refinement with a handful of corrections.** Most of the heavy plumbing is shipped. The Gulf work is templates, Twilio ContentSid wiring, one new rep-facing notification path, and a promotion-activation trigger. The ticket's auto-gen technical approach re-proposes building infrastructure that already exists and references `Price_Record__c` — neither is accurate for OHFY-Ecom.

| Area                                                          | Verdict                                                                                  |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Story statement (cutoff reminders + rep alerts + promos)      | Confirmed                                                                                |
| Notification objects (Notification__c, Contact_Notification__c, Notification_Log__c) | **Confirmed** — all three exist                                                          |
| Core services (NotificationPreferenceController, TwilioSMSService, OrderConfirmationService) | **Confirmed** — all three exist                                                          |
| Separate DeliveryCutoffReminderBatch / Scheduler             | **Contradicted** — one unified `AbandonedCartReminderBatch` handles both paths          |
| Cutoff time source (per-territory)                            | **Incomplete** — today it's per-location (`ohfy__Warehouse_Cutoff_Time__c`); decide if per-route is needed |
| Sales rep stalled-cart alert path                             | **Missing** — no rep notification logic today                                            |
| Gulf-branded email templates                                  | **Missing** — no email templates ship in OHFY-Ecom                                       |
| Gulf Twilio Content Templates (ContentSid)                    | **Missing** — existing TwilioSMSService uses ContentSid mechanism, Gulf SIDs need provisioning |
| Promotion-activation notification                             | **Missing + dependency** — requires BMS-4049 to define the Gulf pricelist promotion record |
| Emily's "duplicates TBM work" comment                         | **Needs discussion** — reuse vs. re-implement decision                                   |
| Jira "blocked by BMS-3930"                                    | **Mis-scoped** — credit terms UI not a prerequisite for engagement notifications         |

---

## Phase 2 — Business Requirements & ACs

### Structural check
- ✅ Clear purpose (order completion + promo adoption + rep visibility)
- ✅ Testable Gherkin ACs (6 scenarios today)
- ✅ Scoped (notifications only; in-app center is explicitly a follow-up)
- ✅ Correct issue type (Story)

### AC validation

| Original AC | Verdict | Note |
|---|---|---|
| 1. Cutoff reminder to retailer with deep link | Confirmed — testable | Wire to existing AbandonedCartReminderBatch; add Gulf template. |
| 2. Incomplete cart alert to retailer AND assigned rep | Incomplete — rep half is missing | Today's batch only notifies the retailer. Rep alert is net-new. |
| 3. Promotion notification to eligible retailers with banner | Incomplete | Banner is separate UI scope (out of this ticket); trigger + dispatch are net-new. |
| 4. Daily digest to rep of at-risk accounts | Missing | Consolidated digest isn't implemented; either add or drop from MVP. |
| 5. Notification preferences configurable per retailer | Confirmed | Already exists via Contact_Notification__c + ecomProfilePage. |
| 6. Notification suppressed when order already submitted | Confirmed — testable | Existing batch already filters by order status; add explicit assertion. |

### Gaps to plug
- **Missing AC** — Gulf-branded email templates render correctly across mail clients.
- **Missing AC** — Gulf Twilio Content Templates + ContentSid wiring.
- **Missing AC** — preference toggle change takes effect on the next run.
- **Missing AC** — per-territory cutoff decision gate (keep location-level, or add route-level).
- **Decision needed** — daily digest vs. per-account alert for reps.

---

## Phase 3 — Technical Approach

### Ticket says (auto-gen)
> "Implement a Notification_Log__c custom object (lookup to Account, fields: Channel__c, Type__c, Status__c, Sent_At__c, Related_Order__c, Related_Promotion__c). Use Scheduled Flows for cutoff reminders and abandoned cart evaluations, querying Order__c status and Route__c cutoff times. Promotion notifications via Platform Event triggered by Price_Record__c activation. In-app notifications rendered as an LWC component in the e-commerce portal (bell icon + banner pattern already established). Email via Salesforce Email Alerts with merge fields. Retailer preferences stored on a Notification_Preference__c child object under Account…"

### Claim-by-claim validation (honesty protocol)

**Claim 1: Implement `Notification_Log__c`**
- **Code shows:** `objects/Notification_Log__c/` exists with `Channel__c`, `Status__c`, `Sent_At__c`, `Error_Message__c`, `Contact__c`, `Notification__c`. It uses Contact lookup (not Account) and does not have `Related_Order__c` or `Related_Promotion__c` fields today.
- **Assessment:** **Contradicted (already built)** + **Incomplete** — add `Related_Order__c` and `Related_Promotion__c` if analytics needs to tie log rows to the triggering record.

**Claim 2: Use Scheduled Flows for cutoff reminders and abandoned cart**
- **Code shows:** `AbandonedCartReminderScheduler` (Apex Schedulable) + `AbandonedCartReminderBatch` (Apex Batch). Not Flow.
- **Assessment:** **Contradicted.** Keep the Apex path; it handles both cases in one pass.

**Claim 3: Query `Order__c` status and `Route__c` cutoff times**
- **Code shows:** The batch queries `Delivery__c` (not `Route__c`), and cutoff comes from `Account.ohfy__Fulfilled_From__r.ohfy__Warehouse_Cutoff_Time__c` — location-level, not route-level.
- **Assessment:** **Contradicted.** Rewrite the approach to reference `Delivery__c` and the location cutoff field. Decision gate on whether `Route__c.ohfy__Cutoff_Time__c` should be added.

**Claim 4: Promotion notifications via Platform Event triggered by `Price_Record__c` activation**
- **Code shows:** `Price_Record__c` does not exist in OHFY-Ecom. Pricing is pricelist-based. Also, there is no existing promotion-activation trigger.
- **Assessment:** **Contradicted + Missing.** Replace `Price_Record__c` with the Gulf pricelist promotion record (owner TBD via BMS-4049 spike), and add the trigger.

**Claim 5: In-app LWC "bell icon + banner pattern already established"**
- **Code shows:** No such component in OHFY-Ecom. No notification center LWC.
- **Assessment:** **Contradicted.** Either add (net-new scope) or explicitly defer — recommend defer for this story.

**Claim 6: Email via Salesforce Email Alerts**
- **Code shows:** Email dispatch path in `OrderConfirmationService`-style classes; not Email Alerts. And there are no Gulf-branded Lightning Email Templates in the repo.
- **Assessment:** **Partially Contradicted.** Keep the Apex dispatch approach; add Gulf templates via standard Email Template metadata, not Email Alerts.

**Claim 7: Retailer preferences on new `Notification_Preference__c` child under Account**
- **Code shows:** Preferences are already modeled on `Contact_Notification__c` (child of Contact). `Notification_Preference__c` does not exist.
- **Assessment:** **Contradicted.** Use the existing `Contact_Notification__c` — do not introduce a new object.

### Scorecard

| # | Auto-gen claim | Verdict |
|---|---|---|
| 1 | `Notification_Log__c` needs implementing | Contradicted (exists) — small field additions plausible |
| 2 | Scheduled Flows for cutoff + abandoned cart | Contradicted (Apex batch exists) |
| 3 | `Route__c` cutoff times | Contradicted — location-level today; decision needed |
| 4 | `Price_Record__c` activation triggers promos | Contradicted — no `Price_Record__c`; needs Gulf pricelist equivalent |
| 5 | In-app bell-icon notifications already established | Contradicted — no such component |
| 6 | Salesforce Email Alerts | Partial — Apex dispatch; templates net-new |
| 7 | `Notification_Preference__c` child under Account | Contradicted — prefs live on Contact_Notification__c |

---

## Phase 4 — Dependencies

| Link | Check | Result |
|---|---|---|
| Blocked by BMS-3930 (credit terms) | Is credit-terms UI a prerequisite? | **Mis-scoped.** Notifications do not depend on credit UI. Remove the Jira link. |
| BMS-3923 (Gulf branding) | Email templates need brand assets | **Real dependency.** Email templates cannot render Gulf logo/footer until BMS-3923 ships the `Ecom_Branding__mdt` Gulf records. Ticket stub lists this; keep it. |
| BMS-4049 (Pricing spike) | Promotion trigger needs a canonical promotion record | **Real dependency.** The promotion-activation AC cannot be specified tightly until BMS-4049 confirms the pricelist promotion record shape. |
| TBM notification work (Emily's comment) | Does prior work exist that can be reused wholesale? | **Unverified** — needs a 30-min review with Sanchez to confirm what transfers and what doesn't. |

---

## Top Issues (ranked)

1. **Rebase the technical approach on OHFY-Ecom.** Drop `Price_Record__c`, `Route__c` cutoff, Scheduled Flows, "new Notification_Preference__c", and "existing bell icon". All are codebase-inaccurate.
2. **Decision gate: per-territory cutoff.** The code today is location-level. Get a product call on whether 5 warehouses each with one cutoff is enough, or whether Gulf routes need their own.
3. **Sales rep alert is genuinely new.** Give it its own threshold + suppression logic. Decide digest vs. per-account.
4. **Emily's "duplicates TBM work" comment** — schedule a pairing with Sanchez to confirm reuse before sprint commit.
5. **Gulf Twilio ContentSids must be provisioned** in Twilio Console before the scenario tests can pass — this is an out-of-code prerequisite.
6. **Remove or re-scope the BMS-3930 "blocked by" link.**

---

## Suggested Revisions

### Proposed title (unchanged)
"Retailer Engagement Notifications (Gulf)" — keep, tighten to Gulf-specific scope via description.

### Proposed description addition
Prepend the **Current State (2026-04-22)** block so refinement starts from shipped code, not a sales-demo baseline.

### Proposed replacement ACs
Use the 9 scenarios in the Jira-Ready section above. Material changes: add Gulf-template AC, add Twilio ContentSid AC, add rep stalled-cart AC, add preference-toggle-propagation AC, add per-territory cutoff decision-gate AC, tighten cutoff source to `ohfy__Warehouse_Cutoff_Time__c`.

### Proposed field / metadata additions
- `Notification__c.Rep_Alert_Threshold_Hours__c` (Number) — or a new Notification__c record with its own threshold.
- `Notification__c.Twilio_Content_Sid__c` (Text) — or a `ohfy_Gulf_Twilio_Template__mdt` CMDT mapping notification-type → ContentSid.
- Optional: `Notification_Log__c.Related_Order__c` and `Related_Promotion__c` for analytics.

### Proposed field updates
- **Blocked By:** drop BMS-3930, keep BMS-3923 (real branding dependency), add BMS-4049 (promotion record shape).
- **Labels:** keep `fast-trackable`, `gulf`, `phase-2`, `roadmap-v2-baseline`; remove only when refinement closes.

---

## Open Questions for Team Refinement
1. In-app notification center (bell icon) — in scope, follow-up, or deferred?
2. Reuse vs. re-implement TBM notification work (resolve Emily's comment).
3. Per-territory cutoff vs. per-location cutoff — product decision.
4. Rep alert: digest (daily) or per-account immediate?
5. Promotion trigger: auto on `Is_Active__c` flip, or opt-in via merchandising flag?
6. Default cutoff threshold value — 12h or 24h?

## Readiness Recommendation
**GO for Sprint 2** once (a) the technical approach is rebased on the existing framework, (b) the per-territory cutoff decision is made, and (c) Emily's TBM-duplication concern has a resolution. The delta is small — templates, a rep path, a promotion trigger — but only if refinement plants it on the right foundation.
