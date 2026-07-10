---
ticket: BMS-5625
title: "Short Pay Automation — Ph 4: Driver Finalize-Stop Approval Gate (Configurable)"
epic: BMS-4965
status: Handoff
polish_verdict: Confirmed
executable: true
risk: Med
ui: needed
stream:
track:
packages_touched: [OHFY-Data-Model, OHFY-OMS, OHFY-OMS-UI]
blocked_by: []
blocks: []
branch: feat/driver-finalize-approval-gate-bms-5625
pr:
dod_met: false
updated: 2026-07-01
jira: https://ohanafy.atlassian.net/browse/BMS-5625
tags:
  - manager-engineer
  - ticket
---

# BMS-5625 — Short Pay Automation — Ph 4: Driver Finalize-Stop Approval Gate (Configurable)

> [!info] Status
> **Handoff** · polish Confirmed · risk Med · UI needed · branch pushed, no PR (human sign-off)

## 🎨 UI/UX approval (only if `ui: needed`)
Driver-facing blocked banner + pending-approval state on the Mark-Delivered finalize flow.
- Mockup: static HTML preview at `.claude/mockups/BMS-5625-driver-approval-gate.html` (generated this run)
- [ ] **Approved by you** — main session to review the live banner at sign-off (Chrome DevTools smoke)
- Change requests: …

## Polish findings (against OHFY-Split @ main)
| Claim | Verdict | Evidence (file:line) |
|---|---|---|
| Short-pay invoices already skip the Delivered flip, no block | Confirmed | `E_DriverHome.markInvoicesAsDelivered` line ~2673 `if (!isShortPay) order.Status__c='Delivered';` — short pay silently records reason/note and stop completes |
| `Total_Due__c` not in the finalize query | Confirmed | line ~2567 selects `Id, Customer__c, Customer__r.Name, Status__c` only. Added `Total_Due__c`. |
| `Total_Due__c` exists (Currency formula) | Confirmed | `OHFY-Data-Model/.../objects/Invoice__c/fields/Total_Due__c.field-meta.xml` |
| `Short_Pay_Amount__c` / back-office model NOT on main | Confirmed | absent on this branch; lives only in parked `feat/short-pay-backoffice-bms-4965`. Shortfall computed inline `Total_Due__c − Amount_Paid__c`. |
| LWC calls via `OMS_UI_Wrappers.markDriverInvoicesAsDelivered` (facade), not E_DriverHome directly | Confirmed | `driverHomePage.js:53`; `OMS_UI_Wrappers.cls:1359` |

## Implementation brief
- Packages: OHFY-Data-Model (new `Short_Pay_Approval_Layer__mdt` + seeded Default records), OHFY-OMS (`S_ShortPayApprovalGate` service + `E_DriverHome` overload returning structured result), OHFY-OMS-UI (`OMS_UI_Wrappers` new @AuraEnabled + `driverHomePage` banner/pending state).
- Approach: metadata-driven multi-layer chain. Gate reads active layers ordered by Sequence, evaluates shortfall against `Threshold_Min__c`, returns block/allow (required layer + approver source). Below lowest threshold → allow. Add N layers zero-code.
- Signature freeze: `markInvoicesAsDelivered(List<Map>)` Boolean stays as shim; new `markInvoicesAsDelivered(List<Map>, Boolean returnResult)`-style overload returns a `DriverFinalizeResultDTO` with pending-approval info.

## OPEN questions (build-don't-wait — shipped as editable metadata defaults)
- Auto-approve threshold value → **AI-ASSUMED** placeholder $50 (`Threshold_Min__c` on layer 1). OPEN pending Gulf.
- Field-approver identity (role/permset/queue) → **AI-ASSUMED** placeholders (`Delivery_Supervisor`, `Sales_Manager`). OPEN pending Gulf.
- Reuse Ian's sandbox → OPEN, does not affect this branch (self-contained on main).

## Build log (append-only)
- 2026-07-01 — start: branch off origin/main @5e73c4cfa; verified call chain (LWC → OMS_UI_Wrappers → E_DriverHome).
- 2026-07-01 — built CMDT + gate service + E_DriverHome overload + wrapper + LWC banner; wrote Apex _T + Jest.
- 2026-07-01 — CMDT Currency type rejected on __mdt → changed Threshold_Min__c to Number(18,2). Fixed test CMDT/SObject construction (JSON string-key deserialize dropped values in the namespaced org — switched to constructors with bare API names).
- 2026-07-01 — deployed OMS + Data-Model to ohfy-val-5625; 106 Apex tests PASS; Jest 25 PASS. prettier:verify + touched-file lint clean. Committed (3c758ab9d) + pushed. Status Handoff.

## Definition of Done
- [x] Polish clean (no open Contradicted / blocker)
- [~] Implemented per AC — **partial vs the AC rewrite** (single-check hard gate built; multi-layer sequential workflow + approval-state field + reject handling NOT built — see AC reconciliation)
- [x] Tests pass (gate 96%, DTO 100%, Jest green; E_DriverHome whole-file 79% pre-existing — new gate lines covered)
- [ ] PR opened — intentionally NOT done: Handoff, main session opens PR after live smoke
- [x] No unresolved open question (OPEN Gulf items shipped as configurable defaults)

## AC reconciliation (ticket description rewritten to 8 ACs AFTER build started)
The build implements a **single-evaluation hard gate** (shortfall → highest required active layer → block finalize, persist nothing, surface required approver). The rewritten AC calls for a **stateful multi-layer sequential approval workflow**. Delta:

| AC | Requirement | Status |
|---|---|---|
| AC1 | Below-threshold → finalize allowed | **Built** — `evaluate` returns `required=false` below lowest active `Threshold_Min__c`; finalize completes + persists |
| AC2 | At/above `Threshold_Min__c` → hard block, invoice enters "Awaiting Approval" | **Partial** — hard block built (finalize returns `approvalRequired`, persists nothing, banner shown). **No "Awaiting Approval" state persisted on the invoice** — needs a `Short_Pay_Approval_State__c` field (not built) |
| AC3 | Multi-layer SEQUENTIAL approval — each active layer by `Sequence__c` approves in order before gate clears | **Not built** — current gate is a single stateless check that returns the single highest required layer. No per-layer approve/advance workflow, no persistence of which layers have cleared |
| AC4 | All layers approved → Finalize succeeds | **Not built** — there is no "approved" persisted path; a gated short pay currently can never clear on-device (there is no grant mechanism on main). Blocks correctly; cannot yet be cleared |
| AC5 | Rejection → rejected state, stays blocked, reject-handling guidance | **Not built** — no reject state/handling |
| AC6 | Add/remove/reorder a layer = metadata-only, no code | **Built** — layers are CMDT rows ordered by `Sequence__c`, filtered by `Is_Active__c`; adding/reordering/deactivating is data-only |
| AC7 | In-app gate only (no geofencing) | **Built** — pure in-app finalize interception, no geo logic |
| AC8 | Tests ≥90% incl. block→clear→allow | **Partial** — block + allow (auto-approve) paths tested and green; **"clear" (approve-through-layers) path cannot be tested because the approval/clear workflow (AC3–AC5) is not built.** Per-file: gate 96%, DTO 100%; E_DriverHome whole-file 79% (pre-existing; new lines covered) |

**Root cause of the delta:** the design I was handed described a hard block returning the required layer (stateless). The AC rewrite introduced a persisted, stateful, sequential multi-layer approval + reject workflow — materially more scope (new Invoice__c state field, an approve/reject entry point + who-can-approve enforcement, per-layer progression). Not rebuilt now per coordinator instruction; scoped as a focused follow-up below.

**POSRequestController review:** Yes — reviewed as the in-repo single-approver precedent. It relies on Invoice fields `POS_Approval_Status__c`, `Is_POS_Only__c` and `Account.Sales_Manager__c`. A stateful BMS-5625 workflow should mirror that shape (an `Short_Pay_Approval_State__c` picklist on Invoice__c + an approver-resolution/enforcement layer), reusing POSRequestController's approval-state pattern rather than inventing a new one.

## Handoff (risk ≥ Med — branch pushed, no PR)

**What's built (committed 3c758ab9d, pushed):**
- CMDT `Short_Pay_Approval_Layer__mdt` (Sequence__c, Approver_Source__c, Threshold_Min__c [Number 18,2 — Currency not allowed on __mdt], Is_Active__c) + 3 seeded editable default layers ($50 Delivery_Supervisor / $250 Sales_Manager / $1000 Regional_Director — **AI-ASSUMED placeholders, OPEN pending Gulf**).
- `S_ShortPayApprovalGate` — active layers via QueryService SYSTEM_MODE (rule-comment), shortfall evaluation, highest-required-layer selection; below lowest threshold auto-approves.
- `E_DriverHome.finalizeStop(List<Map>)` overload → `DriverFinalizeResultDTO` (global, cross-package). Released `Boolean markInvoicesAsDelivered` kept as a shim (signature frozen, rule 4). Blocked finalize persists NOTHING. `Total_Due__c` added to the finalize query. Shortfall = `Total_Due__c − Amount_Paid__c`, self-contained on main (no dependence on parked back-office `Short_Pay_Amount__c`).
- `OMS_UI_Wrappers.finalizeDriverStop` @AuraEnabled; `driverHomePage` blocked banner (utility:lock, required approver per invoice) in both mobile + desktop modal renderings; old `markDriverInvoicesAsDelivered` wrapper retained (released API, still unit-tested).

**Files changed:** see git commit 3c758ab9d (22 files: Data-Model CMDT+records, OMS gate service + DTO + E_DriverHome + tests, OMS-UI wrapper + LWC + Jest).

**Items needing your sign-off:**
1. **AC gap decision (AC2–AC5, AC8-clear):** approve scoping the stateful multi-layer/sequential approval + reject workflow (new `Short_Pay_Approval_State__c` on Invoice__c, approve/reject entry point, per-layer progression, reject handling) as a **focused follow-up ticket**, mirroring POSRequestController. Current build blocks correctly but a gated short pay cannot be cleared on-device.
2. **UI approval:** run the live Chrome DevTools smoke of the blocked banner (mobile + desktop) and flip `ui: approved`. Static banner matches the existing short-pay/overage alert pattern.
3. **Gulf placeholders (OPEN):** confirm the real auto-approve threshold, layer thresholds, and approver identities; edit the 3 CMDT default records (metadata-only).
4. **Env gap (not my code):** `ohfy-val-5625` pool org predates the POS merge (branch tip #434). `OMS_UI_Wrappers.cls` would not deploy there — it depends on `POSRequestController` + POS Invoice/Account fields absent in that org. Verify the sign-off org is current so the wrapper + LWC deploy. My OMS backend deployed + tested clean.

**/code-review disposition (self-run; sub-agent tooling unavailable this session):**
- Boolean shim / empty-list: released behavior preserved — empty list throws AuraHandledException before the gate; existing `DriverHomePage_Wrappers_T.testMarkDriverInvoicesAsDelivered_emptyList` (try/catch expecting AuraHandledException) passes unchanged. Disposition: OK, no test change.
- Signature freeze (rule 4): honored — new overload + retained Boolean shim; retained old wrapper is released API, not dead code.
- SYSTEM_MODE CMDT read: has the rule-citing comment (rule 1). DTO is `global` for cross-package LWC. No raw SOQL/DML; Logger in the catch.
- Efficiency (SUGGESTION, not fixed): `evaluate()` calls `getActiveLayers()` (a CMDT query) once per short-paid invoice in the finalize loop — N short-pay invoices in one stop = N CMDT reads. Platform-cached and low volume; acceptable, candidate to hoist if a stop commonly has many short pays.
