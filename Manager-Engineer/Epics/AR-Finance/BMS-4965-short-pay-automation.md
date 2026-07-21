---
epic: BMS-4965
release_phase: crawl
title: "[REQ-038] Short Pay Automation"
domain: "AR / Finance (OMS)"
user: "Drivers (capture) · AR/finance (resolution) · FL/AL compliance"
impact: "Unexplained shortfalls, manual reconciliation, no compliance trail, missed supplier claim windows"
build_status: "Bundled + QA'd · PR #582 READY (demo/short-pay-epic-bms-4965) unions 5625+4059+4060+5631, supersedes #439/#557/#561 · validated e2e in ohfy-val-shortPay · awaiting review/merge (repo-verified 2026-07-20)"
awaiting_ui_direction: true   # backend artifact built; AR review-queue screen pending your UX direction + mockup
demo_review: true             # 🎬 in the demo bucket — review to catch a wrong-direction build early
demo_pitch: "Replaces the dead short-pay ticket system — shortfalls escalate by FL/AL rules and repeat offenders surface."
org:                          # all claimed orgs EXPIRED — reclaim on resume; see Dev orgs section
  - "ohfy-val-4965 — RELEASED/EXPIRED (auto-expired) — back-office queue 4059/4060"
  - "ohfy-val-5625 — RELEASED/EXPIRED (auto-expired) — driver approval gate 5625, PR #439"
status: In Progress
audit_verdict: Slice
polish_verdict: Contradicted
score: 3
stream: Finance/OMS
phase: 1
locked_down: false
updated: 2026-07-06
jira: https://ohanafy.atlassian.net/browse/BMS-4965
tags:
  - manager-engineer
  - epic
---

# BMS-4965 — [REQ-038] Short Pay Automation

> [!summary] Verdict
> **Extend, don't rebuild.** Short-pay **capture** already shipped under sibling **BMS-3844** (`Invoice__c.Short_Pay_Reason__c`). This epic builds the **back-office half** (escalation / resolution / reporting) on `Invoice__c` + reuse `Credit__c` — **zero new objects**. The 8 children were paper specs against invented objects (`Short_Pay__c`/`Escalation__c`/`OHFY-Core`) → re-ground / merge / close.

## 🎯 Brief — Issue · Impact · Solution
- **Issue:** drivers receive short payments; capture exists (3844) but there's **no back-office** escalation, resolution, or reporting — the "approval flow that locks the invoice" the docs promise was never built.
- **Who in Gulf is impacted:** **drivers** (capture at the stop), **AR/finance** (resolution + reconciliation), **FL/AL compliance** (escalation trail).
- **Proposed solution (key decision):** **extend `Invoice__c`** + **reuse `Credit__c`** for resolution — `Short_Pay_Status__c` review queue, configurable per-state escalation thresholds, `Account` repeat-offender rollups, AR suppression via FLS/permset, native EOD reporting. **No parallel `Short_Pay__c`/`Escalation__c` model** (those objects don't exist and would orphan the shipped capture).

## Decision record
Full resolution + reasoning: [[BMS-4965-short-pay-rescope]] (Open-Questions). Polish (cohesion + code-grounding): comments on [BMS-4965](https://ohanafy.atlassian.net/browse/BMS-4965).

## Build status
- Branch `feat/short-pay-backoffice-bms-4965` — back-office (4059/4060) built; **parked** 2026-07-01. Seed-skew fix + tests/PR queued in the branch's `tasks.md`.
- Branch `feat/driver-finalize-approval-gate-bms-5625` — **Ph 4 driver Finalize-Stop approval gate (BMS-5625)** building now on `ohfy-val-5625`. Med-risk → Handoff (hard gate on live driver path + `ui: needed`). Configurable N-layer approval via `Short_Pay_Approval_Layer__mdt`; cut fresh from `main`, self-contained (no dependency on the parked back-office model).

## Dev orgs (kept until merge)
| Org | Branch | Ticket(s) | State |
| --- | --- | --- | --- |
| `ohfy-val-4965` | `feat/short-pay-backoffice-bms-4965` | 4059 / 4060 (back-office queue) | Parked — release only after that PR merges |
| `ohfy-val-5625` | `feat/driver-finalize-approval-gate-bms-5625` | 5625 (driver approval gate) | OMS backend deployed + tested; **stale vs POS merge** — can't deploy `OMS_UI_Wrappers`. Release after PR merges |
| `ohfy-val-5625-ui` | `feat/driver-finalize-approval-gate-bms-5625` | 5625 (UI deploy + live smoke) | Fresh pool org (org `00DRt00000SeAADMA3`) for wrapper/LWC deploy + Chrome DevTools smoke. Release after PR merges |

## Ph 4 split (2026-07-01)
- **BMS-5625 (Ph 4a)** — single stateless hard-gate + configurable `Short_Pay_Approval_Layer__mdt` + driver banner. Built, committed `3c758ab9d`, pushed. Satisfies AC1/6/7 (AC2 partial). Pending: UI deploy + live smoke → PR.
- **[[#]] BMS-5631 (Ph 4b)** — stateful multi-layer sequential approve/reject workflow (AC3–5): new `Invoice__c.Short_Pay_Approval_State__c`, approve/reject entry points, per-layer progression modeled on `POSRequestController`. Backlog; depends on 4a merge.

> Release policy (per keep-orgs-until-merge): do **not** run `npm run org:release -- <alias>` until the org's PR is merged into `main`. Confirm with me first.

## Re-scope after BMS-5625 (2026-07-06)
The driver hard-block requirement (BMS-5625) reframed the epic into a phased, **two-entry-point** model. Proposed solutions written into each child ticket as proposals for refinement (labeled AI-assumed / open — nothing committed).

**Two entry points → one hub**
- Driver in-person (Finalize Stop, real-time **hard block**) vs EFT (Bank-Rec sync, **after-the-fact**). Both converge on the back-office Short Pay Review Queue.
- Phases: **4a** driver gate (5625, built) → **4b** approve/reject workflow (5631) → **5** EFT detection (5626) → **6** AR aging (5627, hold-Product).

**Per-ticket proposals (Jira)**
- **BMS-4965** (epic) — consolidated open-question resolutions posted (comment 56551; Elliot mentioned on the 4 true Gulf/Product values).
- **BMS-4059** (Ph 2 escalation) — description re-scoped: per-state compliance escalation engine (`Short_Pay_Threshold__mdt` + `B_Invoice_ShortPayEscalation`); **distinct CMDT** from the 5625 approval-gate; already built on the parked branch.
- **BMS-4060** (Ph 3 resolution/reporting) — description re-scoped: the back-office layer where all short pays close; **reuses** the 5625 approval engine (4b acts here); resolution outcomes + repeat-offender + reporting.
- **BMS-5631** (Ph 4b) — approver approve/reject workflow lives in the back-office queue, **role-filtered by `Approver_Source`**.
- **BMS-4078** (Shift-End · REQ-143 · **cross-epic**) — proposal comment: reuse the 5625 approval-gate pattern for the supervisor sign-off; flagged shared-not-forked + open (multi-layer vs single sign-off).

**Key design decisions (AI-assumed, ratify in refinement)**
- **One shared approval engine** (`Short_Pay_Approval_Layer__mdt` / `S_ShortPayApprovalGate`) — reused by 4b / 4060, proposed for Shift-End; not forked.
- **Two separate CMDTs**: compliance escalation (`Short_Pay_Threshold__mdt`, 4059) ≠ approval-gate (`Short_Pay_Approval_Layer__mdt`, 5625). Do not merge.
- Approver identity via `Approver_Source` per layer (not hardcoded `User.ManagerId`) — generalizes BMS-4396.

**Feedback artifacts**
- One-pager (route + build-now/don't-wait): https://claude.ai/code/artifact/eb2b88d3-617f-4983-8e6e-217bb33e7352
- Lifecycle + gate + Gulf takeaways + Q&A: https://claude.ai/code/artifact/8889da62-c6b2-477e-ba23-cfe0d73f56c5

## Open questions
- 🟠 **FL vs AL compliance threshold values** + legal driver — Gulf, routed to Elliot Flores (mention on BMS-4965). Build is configurable, so this is a config value, not a code blocker.
- 🟠 **Real approver roles per layer** (who approves in the field) — Gulf. Configurable via `Approver_Source`.
- 🟠 **EFT (5626):** does the Bank-Rec sync already flag a short pay, or must Ph 5 build detection? — Product / Bank-Rec owner.
- 🟠 **AR aging (5627):** in scope for this epic at all, and same table vs separate view? — Product (Emily). Recommend separate view; hold build.
- 🟠 **Shift-End (4078):** multi-layer approval vs single supervisor sign-off? — determines how much of the 5625 engine applies.

## Run history
- 2026-06-29 — `/polish-epic` (Contradicted; capture shipped under 3844, children invented-object specs). Re-scope decided (extend `Invoice__c`, zero new objects). Build kicked off. Read-only audit; no Jira/repo writes beyond comments.
- 2026-07-06 — **Re-scope after BMS-5625.** Posted epic-level open-question resolutions (comment 56551, Elliot mentioned). Added Proposed-Solution sections to **4059** + **4060**; proposal comment (56592) on **4078** (cross-epic Shift-End). Ph 4b tracked as **5631**. Built one-pager + lifecycle artifacts for feedback. Ph 4a (5625) built + demoed live on `ohfy-val-5625-ui` (PR #439). Jira writes = descriptions on 4059/4060 + comments on 4965/4078.
