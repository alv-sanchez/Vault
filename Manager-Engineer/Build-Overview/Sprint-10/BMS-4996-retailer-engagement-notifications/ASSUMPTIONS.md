---
kind: paper-trail
topic: BMS-4996 Retailer Engagement Notifications — open-question decisions for the 4 open children
status: deciphered-direction + best-guess assumptions — NOT a committed spec
author: agent, on behalf of Alvaro Sanchez
date: 2026-07-20
backed_by: Fable research report (repo- + doc-grounded, 2026-07-20) — findings inline as [R#]
children_in_scope: ["BMS-3921", "BMS-3931", "BMS-4536", "BMS-4537"]
---

# Paper trail — open-question decisions, BMS-4996

> This logs **my best-guess answers** to every open question on the 4 open children, and the
> **assumptions** behind each. Every answer is backed by the Fable research report generated this
> session (repo-grounded first, Salesforce docs second); research verdicts are cited as `[R#]`.
> Nothing here is built. Where research **corrected** a guess, that's called out. PO-level calls
> are collected at the bottom.

## Decisions already recorded on Jira (not re-litigated here)
- **BMS-4534** Discovery Spike → **Done** (platform already ships).
- **BMS-4535** Design/Prototype → **Won't Do** (superseded).
- **BMS-4073** → left **open for hands-on validation** (code already ships); not new build.
- **BMS-3921** rep alert → **in-platform, not SMS** (SMS deferred pending rep-on-Twilio consent).

---

## BMS-3921 — rep stalled-cart alert

**Open questions (from the ticket) & best-guess answers:**

- **Q: notification channel?** → **In-platform notification to the assigned rep, now; SMS deferred.**
- **Q: cutoff threshold 12h or 24h (ticket contradicts itself)?** → **24h**, config-driven, not hardcoded.
- **Q: promotion auto-notify?** → **out of scope for 3921** (promotion flagging is unowned — PO item).
- **Q: blocked by BMS-3930 portal notification center?** → **decoupled** — an in-platform rep alert needs no portal UI.

**Assumptions (paper trail):**
- **A1 — Mechanism = Salesforce Custom Notification Type, NOT Chatter.** `[R1/R2 — CORRECTS my earlier "Chatter" guess]` The repo has an entrenched Custom Notification pattern (8 `.notiftype-meta.xml` ship in packaged dirs; `S_TransferAlertNotifier.cls` is the canonical sender) and **zero** `FeedItem`/`ConnectApi` usage. Custom Notification Type **ships in the 2GP package and upgrades centrally**; FeedItem is per-org data that doesn't package and needs Chatter enabled per org. Custom Notifications hit desktop **and** mobile bell with **zero TCPA/consent burden** — which is the whole point of choosing in-platform over SMS. → Ship a new `Ecom_Stalled_Cart_Rep_Alert` notification type; send via `Messaging.CustomNotification` to the rep's User Id; `setTargetId` = the cart's `Invoice__c` so the bell click lands on the cart.
  - **"Chatter" was Alvaro's shorthand for an in-platform alert.** Recorded on the ticket as a refinement, surfaced to him for confirm. If he specifically wants a feed post, that's a legal `Channel__c` picklist addition (`In_App`) + FeedItem, but it won't package and isn't the repo pattern.
- **A2 — Recipient = `Account.Sales_Rep__c`** (Lookup(User), confirmed `[R3]`); per-cart, `Invoice__c.Sales_Rep__c` is the tighter anchor.
- **A3 — Threshold reuses `Notification__c.Threshold_Hours__c`** (Number(5,0), default 24, confirmed `[R3]`) under a new `Notification__c` config row (dev key e.g. `STALLED_CART_REP_ALERT`).
- **A4 — The stalled-cart query is NET-NEW.** `[R3 — CORRECTS my "reuse the scheduler" guess]` Despite its name, `AbandonedCartReminderScheduler` is a **delivery-cutoff** notifier and has no stalled-cart computation (no `LastModifiedDate` logic). Carts = `Invoice__c` with `Status__c='Draft'` (`cartService.js:18`). 3921 writes its own query: Draft invoices idle > threshold, no confirmed sibling order. Reusable pieces: the `Notification__c` config load + the 24h `Notification_Log__c` dedup.
- **A5 — Logging:** log to `Notification_Log__c`. Caveat `[R3]`: that object has only a `Contact__c` lookup (no User lookup), so a rep-facing row can't reference the rep without a **new field** (e.g. `Recipient_User__c`). Decision: add that field, or log with a null Contact + a text marker. → lean **add `Recipient_User__c`** (small additive field).

## BMS-3931 — order status-transition notifier + portal stepper + partial-delivery view

**Open questions & best-guess answers:**
- **Q: cutoff times uniform or per-warehouse/route?** → **Per-route**, derived from `Route__c.Cutoff_Time__c` (+ warehouse fallback) — not hardcoded `[R5]`.
- **Q: notification prefs per account or per contact?** → **Per contact** — reuse the shipped `Contact_Notification__c` model.
- **Q: real-time driver GPS or milestones only?** → **Milestones only** (privacy; no driver GPS).

**Assumptions:**
- **A6 — The order object is `Invoice__c`, there is no `Order__c`.** `[R4 — CORRECTS the ticket's `Order__c.Status__c` references]` Status is `Invoice__c.Status__c`, restricted to the global `Status` value set: Draft, New, Scheduled, In Progress, Picking, Loaded, Out For Delivery, Delivered, Complete, Cancelled, Pre-Order.
- **A7 — Customer-facing status mapping = the 5-state rail already in `ecomOrderHistory.js:725-753`** (`mapOrderStatus()`): New→Pending; Picking/Loaded→In Transit; Out For Delivery→Out For Delivery; Delivered/Complete→Delivered; Cancelled→Cancelled. The stepper LWC renders this rail; **the stepper component itself is net-new** `[R6]`.
- **A8 — Status-transition notifier hooks `InvoiceTriggerService` (afterUpdate).** `[R4]` No transition detection exists there today, but the old-vs-new pattern to copy lives in `InventoryLockTriggerService.cls:259-272`. On a qualifying transition (e.g. → Out For Delivery, → Delivered), dispatch through the shipped `Notification__c` + `Contact_Notification__c` + `TwilioSMSService`/email path. Retailer SMS consent already handled — **no new consent work.**
- **A9 — Estimated-delivery + cutoff derivation reuses `AbandonedCartReminderScheduler.cls:211-316`** (last-business-day cutoff, `Route__c`/`Delivery__c.Delivery_Date__c`) `[R5]` — don't reinvent.
- **A10 — Partial-delivery view reads existing `Invoice_Item__c` fields** `[R6]`: ordered = `Ordered_Case_Quantity__c`/`Ordered_Unit_Quantity__c`; delivered = `Invoiced_Case_Quantity__c`/`Invoiced_Unit_Quantity__c`; plus `Outstanding_*`, `Backorder_*`, `Difference_Case_Quantity__c`. Nothing new needed.

## BMS-4536 — reporting spike (over `Notification_Log__c`)

**Best-guess answer (what to measure):** send / skip / failure rate by channel and notification type, volume over time, and cart-recovery conversion.

**Assumptions:**
- **A11 — Metrics come off existing `Notification_Log__c` fields** `[R7]`: `Status__c` (Sent/Failed/Skipped — restricted picklist), `Channel__c` (Email/SMS), `Sent_At__c`, `Error_Message__c`, `Notification__c`, `Contact__c`. Send/skip/error rate is a direct group-by.
- **A12 — Cart-recovery conversion has a data gap** `[R7 — flag]`: nothing links a log row to a subsequently confirmed `Invoice__c`. Options: add a `Recovered_Invoice__c` lookup on `Notification_Log__c`, or express it as a cross-object (Contact→Account→Invoices) custom report type. → recommend the **lookup** (cleaner metric), decide in the spike.
- **A13 — Surface = native reports/dashboards, not a custom LWC** (build-vs-configure; the WMS `Days_of_Inventory` report type is the precedent).

## BMS-4537 — reporting build

**Assumptions:**
- **A14 — Ship a custom Report Type IN the package** (upgrades centrally) `[R7]` — precedent: 10 report types already ship in packaged dirs (`Days_of_Inventory.reportType-meta.xml` pattern). Base object `Notification_Log__c`.
- **A15 — Ship the concrete reports/dashboards via `org-metadata/`, NOT the package** `[R7]` — repo convention (the only report+dashboard on `main`, `PO_Import_Health`, lives in `org-metadata/managed/` + `scratch/`). Both prefix variants required (namespace-prefix rule).
- **A16 — Gated behind BMS-4536.** Don't build until the spike fixes the metric set + resolves the conversion-tracking gap (A12).

---

## Things I deliberately did NOT assume (flag to PO — @Elliot Flores)
- **BMS-3921 disposition** — keep as rep-alert-only vs merge into 4073/3931. (PO call already on the epic.)
- **"Chatter" vs Custom Notification** — recommending Custom Notification (repo-canonical, packages, zero consent); needs Alvaro's confirm since he said "Chatter" explicitly.
- **Promotion flagging** (epic outcome slice ③) — still unowned; needs its own story + AC.
- **Inbound STOP/opt-out webhook** — TCPA gap, unowned; who owns it and when.
- **Rep-on-Twilio enablement** — the deferred User-side consent architecture `[R8]`: new opt-in/timestamp fields on User (or a User-keyed preference object), a consent-capture UI, STOP routing back to the User, quiet-hours. A parallel consent architecture, not a field add — correctly deferred.
- **Reporting scope** — whether 4536/4537 stay under this epic at all.

## Companion artifacts
- `SESSION.md` — context seed for a fresh session.
- Fable research report (2026-07-20) — the repo-/doc-grounded backing for every `[R#]` above (findings pasted into this session; regenerate via a Fable research agent if needed).
