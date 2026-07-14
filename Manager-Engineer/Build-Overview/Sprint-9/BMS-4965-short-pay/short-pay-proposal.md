---
ticket: BMS-4965
title: Short Pay Automation — Proposal & Feedback
domain: AR-Finance / Delivery
owner: Alvaro Sanchez
po: Elliot Flores
status: Propose & collect feedback
updated: 2026-07-06
tags:
  - manager-engineer
  - build-overview
  - proposal
---

# 💸 Short Pay Automation — Proposal & Feedback (BMS-4965)

> **In one line:** When a Gulf driver collects **less than the invoice** at delivery, today it's a manual, error-prone chase. This **captures the short pay at the truck, gates big ones behind an approval, escalates by each state's rules, and resolves it to a credit or a collection** — so leaked cash gets recovered and every short pay is auditable.

| Lens | |
|---|---|
| 👤 **Who** | Gulf **delivery drivers** (capture at the stop) + **AR/finance** (back-office resolution) |
| 💥 **Why** | Short pays happen regularly = real money. No back-office flow today → missed collections/credits, no FL/AL compliance trail. Recovers cash at the source, auditable. |
| 🛠️ **Approach** | Extend the shipped capture (no new objects): driver logs it → configurable **approval gate** on big ones → back-office **queue** → auto-**escalation** by state → **resolve** to credit or collected. |
| 🚀 **Next** | Land the driver approval gate (in review), plug in FL/AL threshold numbers, confirm the EFT + AR-aging phases (need your calls). |

## Where it stands today
| Piece | What it does | Status |
|---|---|---|
| Driver capture (BMS-3844) | Driver logs short-pay reason + note at delivery | ✅ shipped |
| Ph4 · Finalize-stop approval gate (BMS-5625) | Configurable N-layer approval — a short pay over threshold can't be finalized without sign-off (CMDT-driven) | 🟣 in review — PR #439 |
| Back-office queue | Worklist of short-paid invoices (amount / age / warehouse / state) | ✅ built |
| Resolve | Resolve-with-credit or mark-collected; status set configurable | ✅ built |
| Auto-escalation | Escalates when large **or** old, per-state — **thresholds empty**, so nothing escalates until Gulf gives numbers | ⚠ needs numbers |
| Ph5 · EFT detection (BMS-5626) | Catch short pays via bank reconciliation | Backlog |
| Ph6 · AR aging / net-30 (BMS-5627) | Surface not-yet-due non-alcohol balances | ⏸ pending confirm |

Built reuse-first: on `Invoice__c` + `Credit__c`, **zero new objects**. **Not** built (were demo seed data): repeat-offender flagging, driver/manager push alerts — decide if you want them.

## Decisions locked (for transparency)
- **Extend, don't rebuild** — build on the shipped capture; reuse `Credit__c`; no new objects.
- **Thresholds configurable per state** (metadata: state → $ + aging-days) — values TBD (ask #1).
- **"Resolved"** = a credit posted (write-off/deduction) or a manual "collected" close; manager approval optional.
- **Drivers see capture only** — resolution/escalation/AR balance hidden from the driver.

## 🟡 We need your input (5 decisions)

**1. FL vs AL escalation thresholds — the actual numbers** · _→ Gulf (via Elliot)_
At what **$ amount** and **days outstanding** should a short pay escalate, per state? And the **legal driver** for Alabama? The engine is built and waiting — nothing escalates without these.

**2. Field approval gate — the cut-off + who approves** · _→ Gulf ops_
Below what **$ (or %)** can a driver finalize a short-paid stop **without** approval? And **who** approves in the field, real-time (supervisor / sales manager / regional)?

**3. Ph5 EFT detection — build or reuse?** · _→ Product_
Does the existing **bank-reconciliation sync already flag** short pays, or must we build detection? (Sizes 5626.)

**4. Ph6 AR aging (net-30) — confirm or kill** · _→ Product (Emily/Elliot)_
Do we want a view of **not-yet-due non-alcohol (net-30)** balances? Floated, not confirmed. Assumed rule of thumb: **alcohol = pay on delivery, non-alc = net-30.**

**5. Ticket framing — ratify reality** · _→ Product / refinement_
Ph2/Ph3 (4059/4060) read **driver-handheld-centric**, but what's built is the **back-office queue** (what AR/EFT needs). OK to re-word the tickets to match?

---
_Deeper detail: `SESSION.md` + `short-pay-explained.html` in this folder. This page is for proposing + collecting feedback — reply on the numbered asks._
