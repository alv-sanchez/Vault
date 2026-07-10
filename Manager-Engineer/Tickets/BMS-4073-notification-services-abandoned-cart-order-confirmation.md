---
ticket: BMS-4073
title: "E-Commerce - Notification Services: Abandoned Cart Reminder & Order Confirmation"
epic: BMS-4996
status: Queued
polish_verdict: Incomplete
executable: false
risk: Med
ui: na
stream: S1
track: s1-notifications
packages_touched: [OHFY-eCommerce]
blocked_by: []
blocks: []
branch:
pr:
dod_met: false
updated: 2026-06-28
jira: https://ohanafy.atlassian.net/browse/BMS-4073
tags:
  - manager-engineer
  - ticket
---

# BMS-4073 — E-Commerce - Notification Services: Abandoned Cart Reminder & Order Confirmation

> [!info] Status
> **Queued** · polish Incomplete · risk Med · stream S1 · UI na

> [!warning] Headline finding
> The notification stack this ticket describes is **already built and tested on `main`** (delivered under BMS-4390/4352 foundation + the Done BMS-4192 rep story). 5 of 6 AC scenarios are **Confirmed already-implemented**. One AC — *Order Name Fix After Confirmation* — is **Contradicted**: `CartController.fixEcomOrderNames` is a no-op STUB on main, not the described direct-User-query rebuild. Net: a Contradicted finding is present → **not executable** until scope is reconciled (see Open Question).

## 🎨 UI/UX approval (only if `ui: needed`)
N/A — server-side Apex (batch / scheduler / services). No LWC, FlexiPage, or Experience Cloud surface changed by the AC. `ui: na`.

## Polish findings (against OHFY-Split @ main)
| Claim | Verdict | Evidence (file:line) |
|---|---|---|
| `OrderConfirmationService` accepts `(contactId, recordId, sObjectName)` for single + split invoice | Confirmed | `OHFY-eCommerce/.../services/notifications/OrderConfirmationService.cls:26` |
| Split invoice: `sObjectName == 'Invoice_Group__c'` resolves all orders in group | Confirmed | `OrderConfirmationService.cls:27-42` |
| Order confirmation sends email/SMS by `Contact_Notification__c` preferences | Confirmed | `OrderConfirmationService.cls:78-149`; object refs in `OrderConfirmationService.cls`, `NotificationPreferenceController.cls` |
| `Notification_Log__c` record created per send | Confirmed | `OrderConfirmationService.cls:89,126,141,149` (`writeLog`); `AbandonedCartReminderBatch.cls:179,203` |
| Abandoned-cart cutoff window `windowStart <= now < cutoffDateTime` | Confirmed | `AbandonedCartReminderScheduler.cls:277-305` |
| Dedup: contact notified in last 24h is skipped | Confirmed | `AbandonedCartReminderScheduler.cls:138` (`addHours(-24)`) |
| Dedup bypass via `bypassDedup = true` | Confirmed | `AbandonedCartReminderScheduler_T.cls:656,660,777,...` (static flag exercised) |
| Confirmed order (Status NOT IN Draft/Cancelled) excludes account | Confirmed | `AbandonedCartReminderScheduler.cls:325-358` (`Status__c NOT IN ('Draft','Cancelled')` :338) |
| Batch size = 10 | Confirmed | `AbandonedCartReminderScheduler.cls:568` (`executeBatch(..., 10)`) |
| `TwilioSMSService` sends + logs SMS | Confirmed | `OrderConfirmationService.cls:573` (`TwilioSMSService.sendAndInsertLog`); `AbandonedCartReminderBatch.cls` |
| **Order Name Fix: `fixEcomOrderNames` rebuilds Name via direct User query (avoids CommunityNickname masking), corrects `Sales_Rep__c` to `Account.Sales_Rep__c`** | **Contradicted** | `CartController.cls:425-430` — method is a **no-op STUB** (`return;`) "until the post-confirmation rename hook is migrated"; legacy field refs don't match OHFY-Core. No User query, no Name rebuild. |
| `draftInvoiceService` LWC referenced | Confirmed (exists) | `OHFY-eCommerce-UI/.../lwc/draftInvoiceService/draftInvoiceService.js` — no AC asserts behavior here |

## Implementation brief
- Packages: **OHFY-eCommerce** (Apex services/batch jobs only). `OHFY-eCommerce-UI` only carries the unchanged `draftInvoiceService` LWC — no UI work in scope.
- Approach: This is **not green-field**. The story's described system exists. The only real, uncontradicted work is the **Order Name Fix** scenario, which today is a stubbed `fixEcomOrderNames`. But that stub was deliberately deferred during the ecom split because legacy `Invoice_Item__c` / `Invoice__c` field refs no longer map to OHFY-Core — i.e. it depends on a migration that is out of this ticket's stated scope.
- Files expected to change (if Order-Name-Fix is confirmed in-scope): `OHFY-eCommerce/.../controllers/legacy/CartController.cls` (un-stub `fixEcomOrderNames`), its `_T`.
- **Blocker to executability:** Without PO direction we cannot tell whether BMS-4073 is (a) already Done and should be closed, or (b) scoped down to only the Order-Name-Fix un-stub. The AC as written is Contradicted by main.

## Build log (append-only)
- 2026-06-28 — DRY-RUN audit only. No branch, no code. Polished against local `main` (note: local is 13 commits behind `origin/main`; findings should be reconfirmed after fast-forward).

## Definition of Done
- [ ] Polish clean (no open Contradicted / blocker) — **NOT met: 1 Contradicted AC**
- [ ] Implemented per AC
- [ ] Tests pass
- [ ] PR opened
- [ ] No unresolved open question — **NOT met: see [[BMS-4073-order-name-fix-scope]]**

## Handoff (risk ≥ Med)
Built on main already: full ACR scheduler+batch, OrderConfirmationService (single+split), Twilio SMS, preference + log objects, with `_T` coverage. NOT built: `fixEcomOrderNames` (no-op stub, intentionally deferred pending OHFY-Core field migration). Human input needed: confirm whether this story is already satisfied (close it) or re-scope to the order-name-rename only — and if so, confirm the dependency on the Core field migration is resolved.
