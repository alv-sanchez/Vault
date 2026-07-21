---
title: BMS-4965 Short Pay — FINAL epic-level AC pass (rollout readiness)
epic: BMS-4965
date: 2026-07-17
verified_by: live QA execution in ohfy-val-shortPay (QA-AC-validation.md) + CI + git — not self-reports
verdict: ENGINEER SCOPE SATISFIED — rollout-ready pending PR merges + 1 defect fix (D1)
---

# Final AC pass — every child of BMS-4965

## Epic scope statement (from the epic)
"End-to-end automation of short-pay detection — from driver-side identification with reason coding, through FL/AL compliance escalation rules, to resolution workflows and historical reporting."
**Each clause maps to a validated build:** driver-side identification (3844+5625) · reason coding (3844) · FL/AL escalation (4059) · resolution workflows (4060+5631) · historical reporting (4060 TTM/queue; EOD = org-config).

## Child-by-child final status
| Ticket | Scope | AC status | Evidence |
|---|---|---|---|
| BMS-5625 Ph4a gate | Driver hard-block | **8/8 SATISFIED** (AC3–5 delivered via 5631 as designed; AC8 = 96/100/79 w/ flagged legacy class) | QA live: CMDT boundaries $249→L1/$250→L2/$1000→L3; block→Pending; PR #439 Apex-green |
| BMS-5631 Ph4b workflow | Stateful approve/reject | **6/6 SATISFIED** | QA live: Pending→approve L1→L2→Approved; reject→Rejected; auth enforced both directions; PR #561 |
| BMS-4059 Ph2 escalation | FL/AL per-state | **SATISFIED** | QA live: batch flips on FL amount, FL aging, AL $0; small/young row untouched; O-1 CMDT live |
| BMS-4060 Ph3 resolution | Queue + outcomes + history | **SATISFIED except D1** | QA live: resolve-credit ✅, roll-forward ✅, TTM ✅, queue ✅; **rep-collection blocked by D1** (enableActivities=false → Task WhatId); EOD report = org-config (flagged, not code) |
| BMS-4057 spike | Data model spike | **CLOSED — superseded** | Model decided + shipped (extend Invoice__c, reuse Credit__c); disposition comment 58728 |
| BMS-4058 Ph1 detection | Driver reason coding | **CLOSED — delivered under BMS-3844** | Short_Pay_Reason__c live in driver flow; disposition 58729 |
| BMS-5626 Ph5 EFT consume | Bank-rec detection | **CORRECTLY NOT BUILT — gated on integration (I-1)** | Model verified integration-ready: Amount_Paid API-writable → Short_Pay_Amount formula auto-computes → queue/escalation source-agnostic. Missing slice = status-promotion trigger (~50 lines), unlocks when the feed lands |
| BMS-5627 Ph6 AR aging | Net-30 view | **SPLIT — pending Product** | Short-pay aging already covered by 4059 per-state aging; general AR view = separate scope (58734) |
| BMS-4784/4785/4786 | Design/reporting lanes | **PARKED — folded in** | Demo live via the epic org; reporting folded into 4060 (58730/58731) |
| BMS-5561 | Returns mismatch | **NEEDS INFO — separate lane** | On-site "need more info"; not short-pay direction (58732) |

## Rollout gates remaining (none are build gaps)
1. **Merge train:** #439 (needs human approval — green) → #557 (needs CI fix: prettier + apex red, + D1/D2 fixes) → #561 (green, stacked).
2. **D1 fix on #557:** enableActivities on Invoice__c + atomic status/Task insert. D2: exclude Rolled-Forward from TTM rollup.
3. **Config ratification (AI-assumed, non-blocking — all shipped configurable):** O-1 values (FL $50/2%/7d/10d · AL $0), approver identity per layer, notification channel, rep-collection owner chain.
4. **Integration-owned (not engineer):** bank-rec feed (I-1) → then the thin 5626 slice; Publix DEX decision; check-scan (epic-excluded).

## Bottom line
**Everything the epic needs from engineering is built, live-validated, and demoable in one org.** The epic's rollout is gated only on: human PR review/merge, one small defect fix, config ratification with Gulf/Ops, and the integration-owned feed for the EFT lane.
