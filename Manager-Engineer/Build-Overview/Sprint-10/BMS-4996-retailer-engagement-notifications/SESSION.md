# 📦 Session Kickoff — Retailer Engagement Notifications (BMS-4996)

> Paste this whole file into a fresh Claude Code session as the first message,
> or tell the session: "Read this file first." It is the context seed.
> **Read order for a cold pickup:** this file → `HANDOFF.md` (live state + resume steps) →
> `ASSUMPTIONS.md` (every decision, research-cited) → `Dry Run Testing/DRY-RUN-TEST.md` (evidence).
> Last updated: 2026-07-24 — **VERIFIED & COMMITTED: all 4 children verified live (ACs as test cases), 150 Apex tests green, every touched file ≥90%. Consolidated baseline committed `e0914febe`. See `Dry Run Testing/VERIFICATION-RESULTS.md`.**
> ⚠️ **Org changed:** old `bms-4996-notif` expired → re-claimed as **`bms-4996-notif2`**. Second build wave reconciled in HANDOFF.md.

**Sprint:** Sprint 10.

## Scope of THIS session
BMS-4996 — Retailer Engagement Notifications. Do not touch other epics/streams.

## Current state (one line)
The epic is polished, and its 4 open children are **built on one consolidated branch and each
proven live** in org `bms-4996-notif` — nothing committed/pushed/PR'd (dry-run only).

## Where the work lives
- **Epic:** https://ohanafy.atlassian.net/browse/BMS-4996 — polished, `polished` label. Cohesion report + PO decisions + per-child decision comments in Jira.
- **Org:** `bms-4996-notif` (`00DO200000NJZRTMA5`), claimed from pool. All epic components deployed (targeted) + seed/validation data. Worktree's default target-org.
- **Worktree:** `/Users/alvarosanchez_1/OHFY-Split-integration-4996` on branch `integration/bms-4996-validation` (cut from `main`). node_modules symlinked. **26 uncommitted files = all 4 tickets' work. Nothing committed by design.**
- **Repo packages touched:** `OHFY-Data-Model`, `OHFY-eCommerce`, `OHFY-eCommerce-UI`, `OHFY-OMS`, `orgScripts`.
- **Docs (this folder):** `SESSION.md`, `HANDOFF.md`, `ASSUMPTIONS.md`, `VALIDATION.md`, `Dry Run Testing/DRY-RUN-TEST.md`.

## What it is (one line)
Automated retailer notification workflows (order-due/cutoff alerts, cart reminders, order
confirmation, delivery/status updates) that drive order completion without manual rep follow-up —
**extending an already-shipped notification platform, not building one.**

## History — why this isn't a rebuild
The notification platform already ships on `main` (verified by code-grounding). Standing on:
`OrderConfirmationService`, `AbandonedCartReminderScheduler`/`Batch`, `TwilioSMSService` (+ `Twilio_Named_Cred`/`Twilio_External_Cred`), the `Notification__c`/`Notification_Log__c`/`Contact_Notification__c`/`Configuration_Preference__mdt` model, `NotificationPreferenceController` + `ecomProfilePage`, and the rep order email (BMS-4192, Done).

## Child ledger (current)
| Ticket | Status | Notes |
| --- | --- | --- |
| BMS-4192 | ✅ Done | rep order email (shipped) |
| BMS-4534 | ✅ Done | Discovery Spike — resolved (platform ships) |
| BMS-4535 | 🚫 Won't Do | Design/Prototype — superseded |
| BMS-4073 | 🟡 Open (validate) | shipped platform **validated live** (both send paths → `Notification_Log__c` Sent); no new build |
| **BMS-3921** | 🟢 **Built (dry-run)** | stalled-cart rep alert via **Salesforce Custom Notification** (NOT Chatter/SMS). 12/12 tests. Live In_App/Sent. |
| **BMS-3931** | 🟢 **Built (dry-run)** | `S_OrderStatusNotifier` (OMS) + `ecomOrderStatusStepper` LWC + **cutoff banner (AC3, `navigationMenu.js`)** + **ETA/driver-name (AC1, `OrderHistoryController`)** + partial-delivery + `Related_Invoice__c` per-order dedup + **Twilio SID de-hardcode → `Twilio_Configuration__mdt`** (folded in as supporting infra). 12/12 + 8/8 Jest. Both transitions fired live. ⚠️ second-wave files have no added `_T` coverage — see HANDOFF follow-ups #6–8. |
| **BMS-4536** | ✅ Decided | reporting-spike decision posted (feeds 4537) |
| **BMS-4537** | 🟢 **Built (dry-run)** | packaged Report Type + `Recovered_Invoice__c`/`Error_Code__c`/`Attribution_Window_Hours__c` + `S_CartRecoveryAttribution`. 7/7 tests. Live attribution stamp. **Reports/dashboards NOT shipped** (policy: report types only). |

## Key decisions (full detail + research citations in ASSUMPTIONS.md)
- **Rep alert = Salesforce Custom Notification, not Chatter/SMS** (repo-canonical, packages, zero consent). "Chatter" was shorthand for in-platform.
- **Rep SMS deferred** — reps are Users; consent stack is Contact-only (net-new User-side architecture needed).
- **3931 cutoff source = `Location__c.Warehouse_Cutoff_Time__c`**, NOT `Route__c.Cutoff_Time__c`. Notifier lives in OMS (ADR-0015).
- **4536 conversion = `Recovered_Invoice__c` lookup.** Report Type ships in eCommerce.
- **We ship report TYPES, never concrete reports/dashboards** (defeats customer configurability).

## Open decisions parked with PO (@Elliot Flores, on the epic) — none block the dry run
BMS-3921 disposition · promotion flagging (unowned) · inbound STOP webhook (TCPA, unowned) · Cancelled/in-transit notifications · attribution window/`Error_Code__c` confirm · notify-all-contacts vs ordering-contact · rep-on-Twilio enablement.

## Honest caveats
- **Nothing committed** — dry-run branch only. Splitting into per-ticket PRs is a later, explicit step (do NOT auto-commit/push/PR).
- **SMS not demonstrable** here — Twilio credential unconfigured; SMS logs "Skipped".
- **Deploys were targeted** — full-package deploy fails on org Data-Model staleness; a clean deploy needs `OHFY-Data-Model` refreshed to `main` in the org first.
- **PR follow-ups** (see HANDOFF.md #1–8): `Notification_Log__c` lacks `External_Id__c`; rule-7 review of `ohfy__` dynamic-string test literals; FLS for new fields in install perm sets; **⚠️ second-wave coverage gap (untouched `_T` classes, #6); profile `Delivery__c` over-grant to verify+revert (#7); Twilio de-hardcode is a real `main` security fix + empty CMDT must be populated per-org (#8).**

## How to resume (next steps)
1. Consolidated end-to-end walk-through of all paths in one seeded scenario (optional — each is individually proven; see `Dry Run Testing/DRY-RUN-TEST.md` T1–T4).
2. `/ohfy-design` + `/playwright-tests` on the `ecomOrderStatusStepper` / order-history UI (Tier-4).
3. On explicit user sign-off only: refresh the org's Data-Model to `main`, then split the consolidated branch into per-ticket PRs (draft), address the PR follow-ups, run `/code-review`.
