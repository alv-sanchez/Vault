# 📦 Session Kickoff — Retailer Engagement Notifications (BMS-4996)

> Paste this whole file into a fresh Claude Code session as the first message,
> or tell the session: "Read this file first." It is the context seed.
> Last updated: 2026-07-20 (epic polished on `main`; 4 children open for work).

**Sprint:** Sprint 10, 2026-07-20 → active.

## Scope of THIS session
BMS-4996 — Retailer Engagement Notifications. Do not touch other epics/streams.

## Where the work lives
- **Epic:** https://ohanafy.atlassian.net/browse/BMS-4996 — polished on `main`, carries `polished` label. Full cohesion report + 6 PO decisions in the epic comments (2026-07-20).
- **Repo:** OHFY-Split · packages in play: `OHFY-eCommerce`, `OHFY-eCommerce-UI`, `OHFY-PLTFM`, `OHFY-Data-Model`
- **Docs (this folder):** `SESSION.md`, `ASSUMPTIONS.md` (best-guess answers to open questions, backed by the Fable research report), companion artifacts as generated.
- **Dedicated org:** none claimed yet — claim from the pool (`bash utilityScripts/claim-dev.sh <alias>`) when build starts. Twilio credential needs manual per-org setup (SMS sends fail on a fresh org until then).

## What it is (one line)
Automated retailer notification workflows (order-due/cutoff alerts, cart reminders, order confirmation, delivery/status updates) that drive order completion without manual rep follow-up — **extending an already-shipped notification platform, not building one.**

## History — why this isn't a rebuild
The notification platform already ships on `main` (verified by the 2026-07-20 code-grounding pass). Standing on (already shipped, cited):
- `OrderConfirmationService` — order confirmation email/SMS, single + split (`Invoice_Group__c`) — `OHFY-eCommerce/force-app/main/default/classes/services/notifications/OrderConfirmationService.cls`
- `AbandonedCartReminderScheduler` / `AbandonedCartReminderBatch` — delivery-cutoff / abandoned-cart reminder — `OHFY-eCommerce/.../classes/batchJobs/notifications/`
- `TwilioSMSService` + `Twilio_Named_Cred` / `Twilio_External_Cred` — outbound SMS — `OHFY-PLTFM/.../classes/services/notifications/TwilioSMSService.cls`
- Data model: `Notification__c`, `Notification_Log__c`, `Contact_Notification__c`, `Configuration_Preference__mdt` — `OHFY-Data-Model`
- `NotificationPreferenceController` + `ecomProfilePage` LWC — per-contact email/SMS preference UI
- Rep-facing order **email** — BMS-4192 (Done), inside `OrderConfirmationService`

## Child ledger (as of 2026-07-20)
| Ticket | Status | Work |
| --- | --- | --- |
| BMS-4192 | ✅ Done | rep order email (shipped) |
| BMS-4534 | ✅ Done | Discovery Spike — resolved (platform ships) |
| BMS-4535 | 🚫 Won't Do | Design/Prototype — superseded |
| BMS-4073 | 🟡 Open (validate) | confirmation + abandoned-cart services already ship; **open for hands-on validation walkthrough**, not new build |
| **BMS-3921** | 🟡 Open (build) | rep stalled-cart alert — **channel decided: Chatter/in-platform now, rep-SMS deferred** |
| **BMS-3931** | 🟡 Open (build) | order status-transition notifier + portal stepper + partial-delivery view (the real greenfield delta) |
| **BMS-4536** | 🟡 Open (build) | reporting spike over `Notification_Log__c` |
| **BMS-4537** | 🟡 Open (build) | reporting build, gated behind BMS-4536 |

## Open decisions parked with PO (@Elliot Flores, on the epic)
- BMS-3921 disposition (merge into 4073/3931 vs keep as rep-alert-only)
- Rep alert channel long-term: Chatter now, **SMS → deferred** pending a User-side consent/terms-of-use/carrier-rate mechanism
- **Promotion flagging** (epic outcome slice ③) — unowned, needs a story
- **Inbound STOP/opt-out webhook** — TCPA compliance gap, unowned
- Whether reporting (4536/4537) stays under this epic

## State / caveats (honest)
- Nothing new built yet this sprint — this session polished the epic, recorded the Chatter decision, and closed the stale scaffold tickets (4534/4535).
- Best-guess answers to every open question are in `ASSUMPTIONS.md`, each backed by the Fable research report (repo- + doc-grounded).
- No product code changed. Ticket descriptions were updated to reflect the shipped-platform reality + the recorded decisions.

## Build order when work starts (zero-blocker first)
1. **BMS-3921** (Chatter rep alert) — cleanest, no Twilio/consent blocker
2. **BMS-4536** (reporting spike) — small, decides metrics over `Notification_Log__c`
3. **BMS-3931** (status notifier + stepper + partial delivery) — larger greenfield delta
4. **BMS-4537** (reporting build) — after 4536
