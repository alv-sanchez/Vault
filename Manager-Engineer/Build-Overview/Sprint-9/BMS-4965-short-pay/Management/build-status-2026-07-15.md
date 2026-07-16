---
title: Short Pay (BMS-4965) — Build Status (verified)
epic: BMS-4965
date: 2026-07-15
author: Alvaro Sanchez (via Claude orchestration)
verified_against: git + live GitHub CI + sf org list (not self-reports)
---

# Short Pay build status — 2026-07-15

Ran two fable engineer lanes + a demo lane. **Every claim below is verified against git/CI/sf — not agent self-reports** (agents left work stranded/uncommitted twice; caught and recovered by direct verification).

## Verified scoreboard
| Item | State | Evidence |
|---|---|---|
| **BMS-4059** escalation FL/AL | Code + tests **CI-GREEN** | PR #557 Apex Tests = SUCCESS |
| **BMS-4060** resolution + history | Existing scope done; **reporting/history AC = partial by design** (EOD report = org-config, flagged not built) | PR #557 |
| **BMS-4060 new AC** roll→next invoice (FL 10-day) | Implemented + unit-tested, **CI-green** | `S_ShortPayResolution.rollToNextInvoice`; `Carried_Forward_Short_Pay__c`, `Short_Pay_Rolled_To__c`, `Rollover_Window_Days__c` |
| **BMS-4060 new AC** sales-rep collection | Implemented + unit-tested, **CI-green** | `S_ShortPayResolution.assignToRepForCollection`; `Short_Pay_Status_Config.Rep_Collection` |
| **BMS-5625** test/debug fix | Pushed to PR #439; **CI verdict pending** | commit `1e7a57e0c` (config-independent gate test + debug removal + main merge) |
| **BMS-5625** Apex CI root cause | Self-inflicted this-branch staleness (test assumed $50; branch set $0) — fixed | CI log run 28563487699 |
| **BMS-5625** Playwright failures | **NOT ours** — WMS shared-suite (pick-assignment-board, pick-path); branch touches 0 WMS files | `git diff --name-only` |
| **Banner demo in org** | 🔴 **BLOCKED** — org deleted mid-deploy + aws CLI broken | see below |

## PRs (stacked — merge in order 439 → 557 → 561)
- **#439** (BMS-5625 Ph4a) — open, Apex-green, Playwright = not-ours WMS flake. base main. https://github.com/Ohanafy/OHFY-Split/pull/439
- **#557** (BMS-4059+4060) — open, ready-for-review, Apex-green. base main. https://github.com/Ohanafy/OHFY-Split/pull/557
- **#561** (BMS-5631 Ph4b) — open, **stacked on the #439 branch** (reuses gate engine); merge #439 first, then rebases to main. Full build + tests pushed; CI is first green signal. https://github.com/Ohanafy/OHFY-Split/pull/561

## BMS-5631 (Ph4b) — built, pushed, PR #561 (verified via git)
Stateful sequential approve/reject on top of the Ph4a gate. 7 commits on `feat/short-pay-approval-workflow-bms-5631`.
- **Data-Model:** `Short_Pay_Approval_State__c` (None/Pending/Approved/Rejected), `Short_Pay_Approval_Layer__c` (pointer), `Short_Pay_Shortfall_Amount__c`; `Configuration_Preference.Short_Pay_Notification_Recipients`; `Short_Pay_Approval_Request` notif type.
- **OMS:** `S_ShortPayApprovalGate.applicableLayers()` (ordered chain); `S_ShortPayApprovalWorkflow` (submit/approve/reject sequential by Sequence__c); `S_ShortPayApproverResolver` (per-layer auth from Approver_Source__c); `S_ShortPayApprovalNotifier`; `finalizeStop` consults persisted state.
- **OMS-UI:** `shortPayApprovals` LWC + approve/reject wrappers.
- **Tests:** Apex suites (workflow/resolver/notifier/gate-chain) + finalize state paths + Jest — pushed; **not locally org-run**, CI is first signal.
- **Note:** two fable agents built this in parallel (API drops); kept the committed/pushed build, discarded the redundant uncommitted duplicate. Open: approver roles per layer + notification channel = configurable defaults, ratify w/ Ops/Product.

## CMDT config loaded (AI-assumed defaults — ratify with Ops)
- `Short_Pay_Threshold__mdt`: **AL** amount 0 / aging 0 · **FL** amount 50 / percent 2 / aging 7 / rollover-window 10 · **Default `*`** null/inert.
- Added fields: `Escalation_Percent__c` (Number 5,2), `Rollover_Window_Days__c` — neither existed before.
- **Cross-lane dependency:** `Short_Pay_Approval_Layer__mdt` Layer-1 per-state cutoffs (AL $0 / FL $50) load **when 5625 merges** (that CMDT lives on the 5625 branch, not yet on main).

## 🔴 Demo blocker (environmental — needs user action)
- `ohfy-val-5625` **deleted 2026-07-15 mid-deploy** by a bulk scratch-org sweep (DevHub `ScratchOrgInfo` Status=Deleted, record `2SRPX000000w8ej4AA`). Active scratch pool dropped 8→3; the 3 survivors belong to other tickets — do NOT deploy short-pay code into them.
- `aws` CLI is **broken**: `pyexpat` dylib error (Homebrew Python 3.14 symbol mismatch). `claim-dev.sh` needs `aws sso login --profile ohanafy-dev`, which can't run until aws is fixed.
- **No banner has rendered in any org.** AC2 visual proof does NOT exist yet.

### Demo repro recipe (verified against branch code — ~15 min once an org exists)
1. Full-deploy the 5625 branch (delta deploy fails on main-tip OMS symbols — use `deploy:full`).
2. Data: Delivery with `ohfy__Driver__c`=login user, `ohfy__Delivery_Date__c`=TODAY, **and a Delivery-type `ohfy__Route__c` set** (else `DeliveryTriggerService.updateName` NPEs on rename). Invoice: `ohfy__Customer__c` set, `ohfy__Status__c`=Out For Delivery, line items so `Total_Due__c>0` (Total/Subtotal are calculated; only `Credits_Applied__c`/`Amount_Paid__c` writable).
3. Login as driver → Driver Home → stop → Mark as Delivered → Amount Paid < Total Due + a `Short_Pay_Reason__c` → Finalize → `DriverFinalizeResultDTO.approvalRequired=true`, blocked banner (`data-testid="driver-home-approval-block-banner"`) + "Approval Required" toast. Layer-1 ships at $0 active → any shortfall trips it.
- Prior demo dataset (lost with the org): Delivery "Demo Short-Pay Route" with 4 scenario stops ($30 auto / $100 L1 / $500 L2 / $2000 L3) — trivially recreatable.

## Open questions (papertrail — route, none block the code)
1. **O-1 values AI-assumed** (FL $50/2%/7d/10d, AL $0/0d) → ratify vs real Gulf invoice sizes — Ops.
2. **Rep-collection owner fallback** (invoice `Sales_Rep__c` → account `Sales_Rep__c` → account owner) assumed → confirm.
3. **5625 Layer-1 per-state cutoffs** load on merge → cross-lane, tracked.
4. Prior-routed (still open): invoice-cut authorization (Thursday pricing), Publix DEX build-vs-consume, notification channel/recipient, "rebill" outcome, non-deliverable enforcement.

## Org-tracking
- Mark `ohfy-val-5625` **LOST/DELETED 2026-07-15** (bulk sweep, mid-deploy — not released by us) in the epic note Claimed Orgs view.

## DEMO STATE — ohfy-val-shortPay (LIVE, verified 2026-07-15)
Combined branch `demo/short-pay-epic-bms-4965` (main + 5625 + 4965 back-office) deployed to `ohfy-val-shortPay` (all 13 packages, 5782 comp / 0 err). Permset `ohfy__Short_Pay_Back_Office` assigned. Deploy friction resolved: org sweep → new org; `deploy:full` FLS crash (missing `xml2js`) → deployed via `sf project deploy` (no FLS step); org lagged main → full-package deploy; new fields invisible → missing FLS fixed by permset.

**1. Back-office review queue — LIVE ✅** (BMS-4059/4060)
- `E_ShortPayReview.getWorklist` returns **7 rows** (FL=5, AL=2; Open=3 / Under Review=2 / Escalated=2). State filter (AL, FL). Seeded via `seed-data.apex`.
- Demo: Short Pay Review Queue tab / `shortPayReviewQueue` LWC.

**2. Driver approval gate — PROVEN LIVE ✅** (BMS-5625) — server-side against deployed CMDT:
- $0.01/$30 → required, Layer 1 (Delivery_Supervisor) · $250 → Layer 2 (Sales_Manager) · $1000/$2500 → Layer 3 (Regional_Director).

**3. Driver-home stop — STAGED ✅**
- Delivery `a0SEm00000AMx0TMAT` (driver = org login user, today, Route SP-DEMO). 2 invoices Total_Due=$500 (via writable `Credits_Applied__c=-500`), Paid $0, Out For Delivery. `getTodaysRouteStops` returns the stop.
- **Click-path for the banner:** open org → Driver Home → today's stop → Mark as Delivered → Amount Paid `450` + pick a Short Pay Reason → Finalize → "Approval Required" blocked banner (shortfall $50 → Layer 1).

**Honest gap:** the browser banner **screenshot** is not captured (functionally staged + gate proven + Jest-covered, but no visual capture yet). `E_DriverHome.finalizeStop` can't be driven from anon apex (throws Aura-only exception by design) — the render requires the LWC/browser.

## Next actions
- [ ] Confirm PR #439 CI verdict (Apex/Playwright).
- [ ] USER: fix aws CLI (Python 3.14/pyexpat) or otherwise provide a live scratch org → then run the demo recipe.
- [ ] Un-draft #557 for full Playwright + human review when ready.
- [ ] Lane C (BMS-5631 Ph4b) — start after 5625 merges.
- [ ] Post consolidated Jira comment once #439 CI resolves.
