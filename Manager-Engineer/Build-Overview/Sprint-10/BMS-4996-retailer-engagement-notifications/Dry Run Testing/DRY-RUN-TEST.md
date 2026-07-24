---
kind: dry-run-test
epic: BMS-4996 — Retailer Engagement Notifications
org: bms-4996-notif (00DO200000NJZRTMA5)
worktree: /Users/alvarosanchez_1/OHFY-Split-integration-4996 (branch integration/bms-4996-validation)
date: 2026-07-21
status: DRY-RUN READY — all 4 open children built + each proven live (uncommitted)
---

# Dry Run — BMS-4996 (Retailer Engagement Notifications)

The 4 open children were built on one consolidated branch in one worktree, deployed (targeted) to
`bms-4996-notif`, and each path proven live. Nothing is committed/pushed/PR'd. SMS paths log
"Skipped" (no Twilio credential on this org — expected). All decisions + assumptions: `../ASSUMPTIONS.md`.
Live state + resume steps: `../HANDOFF.md`.

## Coverage matrix

| Child | Built | Tests | Live dry-run evidence |
| --- | --- | --- | --- |
| BMS-4073 (validate shipped) | n/a (shipped) | 81 in-org pass | Order-confirmation email + abandoned-cart reminder → `Notification_Log__c` **Sent** (see `../VALIDATION.md`) |
| BMS-3921 (stalled-cart rep alert) | ✅ | 12/12, 93%/100% | Custom Notification → rep; `Notification_Log__c` **In_App / Sent**, `Recipient_User__c` set |
| BMS-3931 (status notifications + stepper) | ✅ | 12/12 Apex 91%, 8/8 Jest | → Out For Delivery + → Delivered each fired once: Email **Sent**, SMS **Skipped** (no Content SID) |
| BMS-4536 (reporting spike) | ✅ decided | — | decision log on ticket; feeds 4537 |
| BMS-4537 (reporting build) | ✅ | 7/7, 91%/100% | Report Type registered (`ohfy`); attribution stamped real `Recovered_Invoice__c` via prod confirm hook |

## Test scenarios (reproducible in `bms-4996-notif`)

### T1 — Stalled-cart rep alert (BMS-3921)
1. Seed active `Notification__c` `STALLED_CART_REP_ALERT` (Threshold_Hours 0 for demo), Account, Draft `Invoice__c` with `Sales_Rep__c` = a User.
2. Run `S_StalledCartRepAlert.run();` (anon Apex) — or schedule `B_StalledCartRepAlertScheduler`.
3. **Expect:** a Salesforce Custom Notification to the rep (bell, target = the Draft invoice) + `Notification_Log__c` row `Channel=In_App, Status=Sent, Recipient_User__c=<rep>`. Re-run within 24h → no duplicate (dedup).

### T2 — Order status notifications + stepper (BMS-3931)
1. Seed `Notification__c` `ORDER_OUT_FOR_DELIVERY` + `ORDER_DELIVERED` (`orgScripts/e-commerce/seed-notifications.apex`), Account, portal Contact + `Contact_Notification__c` opted-in, an `Invoice__c` seeded at `Loaded` (validation rule needs Loaded before Out For Delivery).
2. Update `Status__c`: Loaded → Out For Delivery → Delivered (DmlService/anon Apex).
3. **Expect:** one `Notification_Log__c` per event: Email **Sent**, SMS **Skipped** ("No Twilio_Content_SID__c"). No duplicate rows through the completion cascade (recursion guard).
4. **UI:** `ecomOrderStatusStepper` in the `ecomOrderHistory` expanded card shows the 4-step rail + estimated delivery + partial-delivery chip (ordered vs delivered) + cutoff banner. (Jest 8/8; portal walkthrough optional.)

### T3 — Cart-recovery attribution (BMS-4537)
1. Seed active `ABANDONED_CART_REMINDER` (`Attribution_Window_Hours__c`=72), Account+Contact, a `Sent` `Notification_Log__c` dated now, a Draft `Invoice__c` for that account.
2. Confirm the draft via `OrderConfirmationService.sendOrderConfirmation(...)` (the production hook).
3. **Expect:** the log's `Recovered_Invoice__c` is stamped with the confirmed invoice (last-touch, within window). Proven: BEFORE null → AFTER = the invoice id.

### T4 — Reporting surface (BMS-4536/4537)
- `Retailer_Engagement_Notifications` Report Type is registered over `Notification_Log__c` — customers build their own reports (we ship the type, not reports). Confirm via Report Builder → new report → the type appears.

## Caveats (honest)
- **SMS never sends** here — Twilio credential unconfigured; SMS = "Skipped" log evidence only.
- **Deploys were targeted** — a full-package deploy fails on org Data-Model staleness (unrelated shipped classes reference newer fields). Clean whole-ecosystem deploy needs `OHFY-Data-Model` refreshed to `main` first.
- **Org-only setup** used for the dry run (not in repo): `ohfy__Legacy_Security_Bypass` assignment + throwaway FLS perm sets for the new fields. Subscribers need FLS in the install perm sets.
- Evidence proves **mechanism on fixtures**, not scale.
- See `../HANDOFF.md` "Follow-ups" for the External_Id__c gap, rule-7 test-string review, and the deferred PLTFM `Error_Code__c` stamping.

## Not done on purpose
- No commit/push/PR (per instruction). Splitting the consolidated branch into per-ticket PRs is a later, explicit step.
- No `ORDER_CANCELLED` / in-transit notifications, no promotion-flagging, no inbound STOP webhook — parked as PO decisions on the epic.
