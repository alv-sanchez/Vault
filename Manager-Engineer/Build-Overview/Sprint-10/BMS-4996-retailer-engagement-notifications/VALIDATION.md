---
kind: validation-log
epic: BMS-4996
org: bms-4996-notif (00DO200000NJZRTMA5)
date: 2026-07-20
status: VALIDATED — both shipped send paths fire live (Notification_Log__c Status=Sent) after seeding
---

# Validation log — BMS-4996 (org `bms-4996-notif`)

Scope: validate the **already-shipped** notification platform (the BMS-4073 surface) and use this
same org as the build org for the open work (BMS-3921 → 4536 → 3931 → 4537). Unbuilt features
(3921 Chatter alert, 3931 stepper/notifier/partial-delivery, 4536/4537 reporting) cannot be
"validated" — there's nothing to run yet; they're build targets.

## Step 1 — deploy + compile ✅
`claim-dev.sh bms-4996-notif` deployed `main` (all packages) clean. Benign warning: pool snapshot
carries `Charge_Type__gvs` global value set not in the local project — unrelated to this epic.

## Step 2 — shipped notification classes present ✅
`OrderConfirmationService`, `AbandonedCartReminderScheduler`, `AbandonedCartReminderBatch`,
`TwilioSMSService`, `NotificationPreferenceController` all present.

## Step 3 — test-green in the org ✅
81 tests across the 5 classes, **100% pass**. `TwilioSMSService` 98% line coverage. Confirms the
mechanism compiles and unit-level behaves in this org.

## Step 4 — live-readiness (WHAT DOESN'T WORK OUT-OF-THE-BOX) ⚠️
The platform is **dormant** — deployed but no config data, so nothing actually sends:
- **`Notification__c` config rows: 0.** No `ORDER_CONFIRMATION`, `ABANDONED_CART_REMINDER`, etc.
  Every send path gates on an active `Notification__c` row → with none, nothing fires.
- **`Contact_Notification__c` preference rows: 0.** No contact is opted into anything.
- **`Notification_Log__c`: 0.** No send has ever happened here.
- **Email templates:** only `CommerceReorderPortalInvitation` exists — **no order-confirmation
  template**, so even a wired `Notification__c` would have no body to render.
- **Twilio credential:** not configured (known per-org gap) — SMS would fail even with config +
  opted-in contacts.
- **Inbound STOP webhook:** absent (registration promises "Reply STOP") — TCPA gap, unowned.

## Verdict
**Code = healthy. Live operation = needs seeding.** To exercise the flow end-to-end this org needs:
1. `Notification__c` config rows (dev keys the shipped classes look up) + `Is_Active__c` + template keys.
2. An order-confirmation `EmailTemplate` (DeveloperName matching the config).
3. A Contact with `Contact_Notification__c` prefs (+ `SMS_Opt_In__c` if testing SMS).
4. A Draft `Invoice__c` (cart) + a confirmable order to trigger the two paths.
5. (SMS only) manual Twilio credential setup — otherwise validate email + in-app only.

## Step 5 — seeded + backend-validated live ✅ (2026-07-20)
After seeding config, **both shipped send paths fired end-to-end and wrote `Notification_Log__c`
Status=Sent** (real emails sent — deliverability is functional on this org, not blocked):

**Path 1 — Order Confirmation email** (`OrderConfirmationService.sendOrderConfirmation(contactId, invoiceId, 'Invoice__c')`)
- Seed: EmailTemplate `Ecom_Order_Confirmation_Val`; `Notification__c` ORDER_CONFIRMATION (email-only, template key set); Account + Contact (w/ email); `Contact_Notification__c` Email_Enabled; Draft `Invoice__c`.
- Result: `Notification_Log__c` — **Channel=Email, Status=Sent, Error=(empty)** ✅
- Also a **Skipped** row on the independent rep path — `"[ORDER_CONFIRMATION_REP] Config preference 'ecomOrderRepNotificationTemplateId' is not active"` — expected (separate `Configuration_Preference__mdt` gate, BMS-4192 path, not seeded).

**Path 2 — Abandoned-cart / delivery-cutoff reminder** (`AbandonedCartReminderScheduler` → `AbandonedCartReminderBatch`)
- Seed: `Notification__c` ABANDONED_CART_REMINDER (Threshold_Hours=24); `Route__c` + `Account_Route__c` + `Delivery__c` (date today+2, unlocked); **a portal/community `User`** on the contact.
- Result: batch **Completed, 0 errors, 1 item**; `Notification_Log__c` — **Channel=Email, Status=Sent** ✅

### Operational dependencies discovered (matter for BMS-4073 / go-live runbook)
- **The reminder scheduler ONLY selects contacts that have an active community/portal `User`** (AccountId+ContactId). No portal user → no reminder. Real operational prerequisite.
- Portal-user creation needed two **org-config** steps (done via Metadata API, not repo edits): `CommunitiesSettings.enableOotbProfExtUserOpsEnable=true`, and a `UserRole` on the account owner.
- MIXED_DML: EmailTemplate/User (setup objects) must be seeded in a separate transaction from custom-object DML.
- Email deliverability was functional here (sends = Sent, not Failed). SMS not tested — Twilio credential still unconfigured (out of scope).

### Reusable seed artifacts (scratchpad)
`BMS4996_seed_reference.apex` (consolidated) + step scripts `seed_template.apex`, `seed_data.apex`,
`run_send.apex`, `seed_cart_A.apex`, `role1/2.apex`, `seed_cart_B_user.apex`, `run_scheduler.apex`.

## Verdict (final)
BMS-4073's shipped platform is **not just deployed/green — it fires live** once the config +
(for reminders) a portal user exist. The "dormant" baseline was purely missing seed data. Remaining
gaps unchanged: rep path needs its `Configuration_Preference__mdt` row; SMS needs the Twilio
credential; inbound STOP webhook still absent. Unbuilt deltas (3921/3931/4536/4537) are next.
