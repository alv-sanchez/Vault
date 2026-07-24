---
kind: session-handoff
epic: BMS-4996 — Retailer Engagement Notifications
sprint: Sprint 10
org: bms-4996-notif2 (re-claimed; old bms-4996-notif expired)
worktree: /Users/alvarosanchez_1/OHFY-Split-integration-4996
branch: integration/bms-4996-validation
commit: e0914febe
last_updated: 2026-07-24
status: VERIFIED & COMMITTED — all 4 children verified live in bms-4996-notif2 (ACs as test cases), 150 Apex tests green, every touched file ≥90%, consolidated baseline committed e0914febe. See Dry Run Testing/VERIFICATION-RESULTS.md. Second build wave reconciled below. NOT pushed / no PR.
---

# 🤝 Session handoff — BMS-4996 (Retailer Engagement Notifications)

> For a future agent picking this up cold. Read `SESSION.md` (context seed) and `ASSUMPTIONS.md`
> (every decision + best-guess, with research citations) alongside this. This file = what THIS
> Claude session did, the live state, and exactly how to resume.

## Goal (current)
Get the **entire epic** to a **dry-run-ready state** in org `bms-4996-notif`: build the 4 open
children on ONE consolidated branch in ONE worktree, deploy + seed, and demonstrate every path,
without committing/pushing/PR'ing. Method: for every open question, best-guess answer **backed by a
research agent**, logged in `ASSUMPTIONS.md`.

## Where everything lives
- **Org:** `bms-4996-notif` (`00DO200000NJZRTMA5`), claimed from pool. `main` deployed + seed/validation data. It is the worktree's default target-org.
- **Worktree:** `/Users/alvarosanchez_1/OHFY-Split-integration-4996` on branch `integration/bms-4996-validation` (cut from `main`). node_modules symlinked. **Uncommitted working-tree changes only — nothing committed/pushed by design.**
- **Docs (this folder, Sprint-10/BMS-4996-…):** `SESSION.md`, `ASSUMPTIONS.md`, `VALIDATION.md`, this `HANDOFF.md`.
- **Reusable seed/anon scripts:** scratchpad `…/c7e34f43-…/scratchpad/` (`BMS4996_seed_reference.apex`, `md2adf.py`, per-step `.apex`).

## Epic child ledger (live)
| Ticket | State | This session |
| --- | --- | --- |
| BMS-4192 | ✅ Done (pre-existing) | rep order email — shipped |
| BMS-4534 | ✅ Done | Discovery Spike closed (platform ships) |
| BMS-4535 | 🚫 Won't Do | Design/Prototype superseded |
| BMS-4073 | 🟡 Open (validate) | shipped platform **validated live** — see `VALIDATION.md` (both send paths → `Notification_Log__c` Sent) |
| **BMS-3921** | 🔨 **BUILT (dry-run)** | Custom-Notification stalled-cart rep alert — 12/12 tests, 93%/100% cov, live In_App/Sent row. In worktree, uncommitted. |
| **BMS-3931** | 🔨 **BUILT (dry-run)** | `S_OrderStatusNotifier` (OMS) + `InvoiceTriggerService.afterUpdate` hook + CMDT row + `ecomOrderStatusStepper` LWC + `ecomOrderHistory` edits + 2 seed rows. 12/12 Apex (91%), 8/8 Jest. Live: both transitions fired once (Email Sent, SMS Skipped). SYSTEM_MODE cites rule 6. Uncommitted. |
| **BMS-4536** | ✅ Decided | reporting-spike decision posted (feeds 4537) |
| **BMS-4537** | 🔨 **BUILT (dry-run)** | Report Type (packaged, eCommerce) + `Recovered_Invoice__c`/`Error_Code__c`/`Attribution_Window_Hours__c` fields + `S_CartRecoveryAttribution` (hooked in `OrderConfirmationService` confirm path, NOT the OMS trigger). 7/7 Apex (91%). Live: attribution stamped a real `Recovered_Invoice__c`. **Reports/dashboards NOT shipped** (policy: report types only). Uncommitted. |

## Second build wave — reconciled 2026-07-23 (was undocumented drift)

A batch of files landed **after** the 07-21 handoff was written and was not in the ledger. Every file
is now mapped to its ticket. Several ACs previously marked "not built"/"blocked"/"deferred" are, in fact, **built**:

| File(s) | Ticket | Reality vs. old docs |
| --- | --- | --- |
| `navigationMenu.js` | **BMS-3931 AC3** | **Cutoff banner BUILT** (old: "not built"). Cutoff passed → shows next delivery cycle (+7d), doesn't hide. |
| `OrderHistoryController.cls` `stampRouteScheduledDelivery` + `Delivery_Driver_Name__c`/`Date_Completed__c`/`Delivery__r` selects | **BMS-3931 AC1** | **Est-delivery ETA + driver name BUILT** (old: "driver name not built / ETA blocked"). Reads `Delivery__c` in SYSTEM_MODE, stamps in-memory (no DML). |
| `CartController.fixEcomOrderNames` (stub → ~110 lines) | **BMS-4073** | **Order-name fix + split-invoice (`Invoice_Group__c`) BUILT** (old: "needs fixture / not addressed"). Rebuilds order Name + corrects rep attribution across split invoices. |
| `OrderConfirmationService.cls` + `AbandonedCartReminderBatch.cls` | **BMS-4537** | **`Error_Code__c` stamping BUILT** on ecom send paths (old follow-up #3: "deferred"). PLTFM `TwilioSMSService` still not stamped. |
| `TwilioSMSService.cls` + `Twilio_Configuration__mdt` (Data-Model) + PLTFM `Twilio_Configuration.Default` record | **BMS-3931** (folded in as supporting infra, per PO 07-23) | Removes a **hardcoded live Twilio Account SID** (`ACe4c6b5…`) + From number shipping in `main` source → empty per-org CMDT. Security hardening; enables per-org SMS routing. |
| `Related_Invoice__c` (Notification_Log__c lookup) | **BMS-3931** | Per-order dedup window support. |
| `NotificationPreferenceController.cls` (`Portal_Visible__c` filter) | **BMS-3921** | Excludes rep-facing alerts from portal seeding. (`Portal_Visible__c` pre-exists on `main`.) |
| Profile `Ohanafy Community User` → `Delivery__c viewAllRecords/viewAllFields = true` | **BMS-3931** | Broad grant for portal delivery visibility. ⚠️ likely redundant — see follow-up #6. Flag only; NOT touched (07-23 decision). |
| `seed-notifications.apex` (+2 rows) | **BMS-3931** | Seeds `ORDER_OUT_FOR_DELIVERY` / `ORDER_DELIVERED`. |

## Verified: all epic components coexist in `bms-4996-notif`
4 Apex classes present; `Recipient_User__c`/`Recovered_Invoice__c`/`Error_Code__c` (Notification_Log__c) + `Attribution_Window_Hours__c` (Notification__c) all resolve; `Ecom_Stalled_Cart_Rep_Alert` notif type + `Retailer_Engagement_Notifications` report type registered.

## Follow-ups for the eventual PR / code-review (NOT dry-run blockers)
1. **`Notification_Log__c` lacks `External_Id__c`** — the one custom object missing it (190 others have it). Pre-existing gap; forced dropping that column from the report type. Add the field, then re-add the column.
2. **Rule-7 review:** `S_StalledCartRepAlert_T` + `S_CartRecoveryAttribution_T` use `ohfy__`-prefixed **dynamic string literals** in `TestDataFactory.createSObject('ohfy__…')` / `TestService` (matches sibling convention; passes in the namespaced org, but strict rule-7 wants them de-prefixed for the no-namespace snapshot). Verify against the nightly build.
3. **`Error_Code__c` stamping** now done on the **ecom** send paths (`OrderConfirmationService`, `AbandonedCartReminderBatch`); still **NOT** stamped on PLTFM `TwilioSMSService`. Add there for full error-code coverage.
4. **FLS:** new lookup/text fields (`Recipient_User__c`, `Recovered_Invoice__c`, `Related_Invoice__c`, `Error_Code__c`, `Attribution_Window_Hours__c`) need FLS in the install permission sets for subscribers. Throwaway dry-run perm sets in the org are NOT in the repo.
5. **Org staleness:** clean whole-ecosystem deploy needs `OHFY-Data-Model` refreshed to `main` in the org first (see caveat above).
6. **⚠️ Coverage gap (second build wave).** Every modified `_T` is UNTOUCHED — `CartController_T`, `OrderHistoryController_T`, `TwilioSMSService_T`, `OrderConfirmationService_T`, `AbandonedCartReminderBatch_T`. The `fixEcomOrderNames` rewrite (110 lines from a `return;` stub), `stampRouteScheduledDelivery`, `TwilioSMSService.loadConfig()`, and `Error_Code__c` stamping have **no new tests**. Threatens the ≥90%-on-touched-files gate. Add tests before any PR.
7. **⚠️ Profile over-grant.** `Ohanafy Community User` now has `Delivery__c viewAllRecords=true` — every portal user can read ALL deliveries. But `OrderHistoryController.stampRouteScheduledDelivery` was written to read deliveries in SYSTEM_MODE *precisely to avoid* this grant. Likely a redundant over-grant that should NOT ship. Verify (revert profile, confirm ETA still renders) before PR. Flag-only per 07-23 decision — not touched yet; dry run relies on current tree.
8. **Twilio de-hardcode = a real security fix on `main`.** A live Twilio Account SID was shipping in `TwilioSMSService.cls` source. Now folded into BMS-3931's PR set. The empty `Twilio_Configuration.Default` CMDT must be populated per-org (Setup → Custom Metadata Types) for SMS to route; unpopulated → SMS still "Skipped".

> ⚠️ **Org staleness:** `bms-4996-notif`'s Data-Model is BEHIND the worktree's `main`, so a full-package deploy fails on unrelated shipped classes referencing newer fields. **Targeted deploys of the epic's own components work.** A clean whole-ecosystem deploy (for the final dry-run / eventual PR) needs the org's Data-Model refreshed to `main` first (`sf project deploy start -d OHFY-Data-Model/force-app --target-org bms-4996-notif`).

## What's been BUILT in the worktree (uncommitted)
**BMS-3921** (verified live):
- Data-Model: `Notification_Log__c.Recipient_User__c` (Lookup User, NEW); `Channel__c` value set +`In_App`.
- eCommerce: `notificationtypes/Ecom_Stalled_Cart_Rep_Alert.notiftype-meta.xml`; `S_StalledCartRepAlert.cls`(+`_T`); `B_StalledCartRepAlertScheduler.cls`. Custom Notification to `Invoice__c.Sales_Rep__c`→`Account.Sales_Rep__c`, logs `Notification_Log__c` In_App, 24h dedup.
- ⚠️ Follow-up: `Recipient_User__c` needs FLS in the install permission sets for subscribers.

**BMS-3931** (in flight — see the agent report when it lands): `S_OrderStatusNotifier` in OMS + `InvoiceTriggerService.afterUpdate` hook + `Trigger_Configuration` CMDT row; `ecomOrderStatusStepper` LWC + `ecomOrderHistory` edits; 2 seed rows in `orgScripts/e-commerce/seed-notifications.apex`.

## Decisions & assumptions → see ASSUMPTIONS.md
All research-backed. Highlights (full detail + `[R#]`/`[D#]` citations in `ASSUMPTIONS.md`):
- **Rep alert = Salesforce Custom Notification, not Chatter/SMS** (repo-canonical, packages, zero consent). "Chatter" was Alvaro's shorthand for in-platform.
- **Rep SMS deferred** — reps are Users; consent stack is Contact-only. Needs a net-new User-side consent architecture.
- **3931 cutoff source = `Location__c.Warehouse_Cutoff_Time__c`**, NOT `Route__c.Cutoff_Time__c` (WMS pick cutoff). Notifier in **OMS** (ADR-0015).
- **4536 conversion = `Recovered_Invoice__c` lookup**; report type ships in eCommerce; reports/dashboard via `org-metadata/`.
- Best-guess calls logged: 72h last-touch attribution (`Attribution_Window_Hours__c`); add `Error_Code__c` Text(255); notify Out-for-Delivery + Delivered only.

## Open PO decisions (parked on the epic, @Elliot Flores) — none block the dry run
BMS-3921 disposition (merge vs keep) · promotion flagging (unowned) · inbound STOP webhook (TCPA, unowned) · Cancelled/in-transit notifications · attribution window confirm · `Error_Code__c` approval · notify-all-contacts vs ordering-contact · rep-on-Twilio enablement.

## Honest caveats
- **Nothing is committed.** Everything is uncommitted in the worktree for the dry run. Splitting into per-ticket PRs is a later, explicit step (do NOT auto-commit/push/PR).
- **Org-side setup for the dry run** (not code): assigned `ohfy__Legacy_Security_Bypass` per install runbook; new lookup fields need FLS in install perm sets for subscribers.
- **SMS is not demonstrable** on this org — Twilio credential unconfigured (known per-org gap); SMS paths log "Skipped". Email + In-App + logs are the proof.
- Demo/seed data proves mechanism on fixtures, not scale.

## How to resume (next steps, in order)
1. Await/confirm the **BMS-3931** build agent result; verify Apex+Jest green + live `Notification_Log__c` rows for Out-for-Delivery + Delivered.
2. Launch **BMS-4537** build per the 4536 decision (report type in eCommerce, `Recovered_Invoice__c`+`Error_Code__c` on `Notification_Log__c`, attribution stamping, reports/dashboard in `org-metadata/` managed+scratch). Sequence after 3931 (shared `InvoiceTriggerService` + same-org deploy).
3. Full epic **seed + dry-run**: exercise stalled-cart rep alert, order-status notifications, order-confirmation + abandoned-cart (already validated), and the reporting surface. Capture evidence.
4. Write the **Dry Run Testing** doc/folder (mirror Sprint-9 `BMS-4965-short-pay/Dry Run Testing/`): DRY-RUN-TEST.md + screenshots + RESUME-STATE.
5. Only on explicit user sign-off: split the consolidated branch into per-ticket PRs.

## Agents used this session (research + build)
- Fable research: platform code-grounding; BMS-4536 reporting decision; BMS-3931 build decisions.
- Build: BMS-3921 (done); BMS-3931 (running). Seed+validate agent (BMS-4073, done).
Continue an agent with SendMessage if its context is needed; otherwise spawn fresh.
