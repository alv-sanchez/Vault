---
ticket: BMS-4965
title: Short Pay Automation
domain: AR / Finance (OMS)
status: BUILD IN PROGRESS
branch: feat/short-pay-backoffice-bms-4965
relates:
  - BMS-3844
po: Elliot Flores
updated: 2026-06-29
tags:
  - manager-engineer
  - build-overview
---

# BMS-4965 — Short Pay Automation

> [!info] Build status — BUILD IN PROGRESS
> Branch `feat/short-pay-backoffice-bms-4965`. Builds the **back-office half** of short pay on `Invoice__c` + `Credit__c` — **zero new objects**. **Needs an org:** deploy + Apex tests + permset assignment.

- **Domain:** AR / Finance (OMS) · Customer: Gulf Distributing (beverage DSD)
- **User:** Drivers (capture) · AR/finance (resolution) · FL/AL compliance

## New here? Short-pay / AR primer

New to accounts-receivable *and* Salesforce? Read this first.

- **Short pay** — a customer pays **less than the invoice** asks for; the unpaid slice is a *deduction* (damaged goods, promo disputes, etc.). Must be **captured** (why?) then **resolved** (forgive or collect).
- **AR (Accounts Receivable)** — money **customers owe Gulf**. A short pay leaves a balance owed sitting in AR.
- **Invoice** — the bill for one delivery; the `Invoice__c` record. It holds `Total_Due__c` (owed) and `Amount_Paid__c` (collected). The gap **is** the short pay.
- **Credit** — a credit memo / write-off; the `Credit__c` record. Posting one against the invoice (`Credit__c.Invoice__c`) **resolves** the deduction.
- **The driver** — at the door, the driver picks the short-pay **reason**. That capture step already shipped (BMS-3844) in the mobile app. This epic builds what happens **after** the truck leaves.
- **Escalation + FL/AL compliance** — past a $ threshold or aging, route to compliance; rules differ by **state** (FL vs AL beer/credit law), so they're **per-state and configurable** (values pending Gulf).
- **Review queue** — a worklist (Salesforce **list view**) of open short-pays for AR to work.
- **"Drivers see capture only"** — drivers record the reason but can't see resolution status or AR balance (FLS hides it). *Capture, don't chase.*

> [!example] Worked example
> Bar invoiced **$1,000**, three cases broke, bar pays **$880**. Driver taps "Damaged Goods."
> `Total_Due__c` $1,000 − `Amount_Paid__c` $880 = **$120 short pay** → sits in AR (status **Open**) → AR posts a `Credit__c` → **Resolved-Credit**.

### Jargon legend

| Term | Plain meaning |
|---|---|
| Short pay / deduction | Customer paid less than the invoice; the gap. |
| AR | Accounts Receivable — money customers owe Gulf. |
| DSD | Direct Store Delivery — driver delivers *and* collects payment. |
| Resolution | Closing a short pay: post a credit (forgive) or mark collected (paid). |
| Escalation | Routing a large/aged short pay to compliance. |
| Review queue | The AR worklist of open short-pays (a list view). |
| `__c` | Salesforce suffix for a **custom** object/field. |
| CMDT | Custom Metadata Type — config changeable without a code deploy. |
| FLS / permission set | Field-Level Security — controls who sees a field. |
| Rollup | A field summing/counting child records onto a parent. |
| `B_` batch | A scheduled background bulk job (Ohanafy naming). |
| TTM | Trailing Twelve Months — rolling one-year window. |

## Issue · Impact · Proposed solution

- **Issue** — Driver short-pay capture shipped under sibling **BMS-3844** (`Invoice__c.Short_Pay_Reason__c`, `E_DriverHome`, `driverHomePage`), but the promised **back-office approval / escalation / resolution flow was never built**. There is no **review queue**, no escalation, no resolution path, no compliance trail.
- **Impact** — Unexplained shortfalls, manual reconciliation, no compliance trail (FL vs AL), missed claim windows, repeat offenders invisible.
- **Proposed solution** — Extend the already-shipped `Invoice__c` capture and reuse `Credit__c` for resolution. **No new objects.** Add a `Short_Pay_Status__c` review queue, a per-state escalation-threshold CMDT, `Credit__c`-based resolution, `Account` repeat-offender rollups, and an AR-suppression permission set. Close the children that reference invented objects.

## Key framing

Capture is **done** (3844). This epic is strictly **back-office, downstream of capture** — do **not** re-touch the 3844 capture path (duplicate writes risk). The children's `Short_Pay__c` / `Escalation__c` / `Repeat_Offender__c` / `OHFY-Core` **do not exist** — close them. Use a distinct `Short_Pay_Status__c`, **not** `Is_Locked__c` (that is `B_Invoice_LockInvoices`' delivery-prep field — collision risk).

## Closed questions

- ✅ **Extend `Invoice__c`, NOT** the parallel `Short_Pay__c` / `Escalation__c` model — those objects don't exist. Reuse `Credit__c` for resolution. Close the invented-object children.
- 🧠 **Configurable per-state thresholds** — CMDT mapping state → $ amount + aging days.
- 🧠 **Resolution** — a posted `Credit__c` = resolved (write-off / deduction) + a manual **"collected"** close; manager-approval **optional**. Status set + path kept configurable.
- 🧠 **AR suppression** — drivers see capture only; resolution status, escalation, and AR balance hidden from the driver profile (capture, don't chase).

## Still open

- 🟠 **FL vs AL escalation threshold values** + the legal driver (beer-franchise / credit-law differences) — **Gulf, via Elliot**. Build is configurable, so this is a config value, not a code blocker.

## What's being built

- `Invoice__c.Short_Pay_Amount__c` (Currency/formula = `Total_Due__c − Amount_Paid__c`)
- `Invoice__c.Short_Pay_Status__c` (Open / Under Review / Escalated / Resolved-Credit / Resolved-Collected / Written Off) + `Short_Pay_Resolved_Date__c` — **this IS the review queue**
- Per-state escalation-threshold **CMDT** (placeholder values pending Gulf)
- An escalation **`B_` batch** flipping `Short_Pay_Status__c` → Escalated past threshold
- **`Credit__c`-based resolution** (`Credit__c.Invoice__c`) — posted credit closes the deduction
- **`Account` repeat-offender rollups** — `Short_Pay_Count_TTM__c` / `Short_Pay_Amount_TTM__c` (no `Repeat_Offender__c` object)
- **AR-suppression permission set** — FLS hiding `Short_Pay_Status__c` + AR fields from the driver profile
- Native EOD Report / Dashboard on `Invoice__c` by reason / status / date

> [!warning] Needs an org
> Deploy, run Apex tests, assign the AR-suppression permission set. FL/AL CMDT values are placeholders pending Gulf.

---
<sub>Generated 2026-06-29 from `Open-Questions/BMS-4965-short-pay-rescope.md` (code-grounded SME + owner input). Diagram: `diagram.excalidraw.md`.</sub>
