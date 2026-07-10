---
title: BMS-5162 — Minimum Transfer Quantity Thresholds
epic: BMS-5162
build_story: BMS-4665
domain: Transfers & Regulatory Compliance
package_target: OHFY-Data-Model (Tier 0) + OHFY-WMS (Tier 3) + OHFY-WMS-UI (Tier 4)
branch: feat/min-transfer-qty-thresholds-bms-4665
worktree: ~/OHFY-Split-BMS-4665
base: origin/main @ 82336e23
spec: B — Salesforce-native
status: pr-open-ci-green
pr: https://github.com/Ohanafy/OHFY-Split/pull/355
created: 2026-06-22
updated: 2026-06-23
---

# BMS-5162 — Minimum Transfer Quantity Thresholds

> [!abstract] Goal
> Block inter-warehouse transfers below a configured minimum (with layer/pallet rounding) at the **New → In Progress** commit gate, with a planner-facing message and a reportable audit trail. Native (Spec B), built on the shipped `Inventory_Threshold__c` config precedent and the `TransferGroupTriggerService` status machine.

## Children
| Ticket | Type | Status | Role |
|---|---|---|---|
| [BMS-4665](https://ohanafy.atlassian.net/browse/BMS-4665) | Story | Backlog | **Build** — threshold enforcement (this branch) |
| [BMS-4666](https://ohanafy.atlassian.net/browse/BMS-4666) | Spike | Backlog | Reporting spike — sequenced after 4665 data model |
| [BMS-4667](https://ohanafy.atlassian.net/browse/BMS-4667) | Story | Backlog | Reporting build — blocked behind 4666 |

## Polish verdict (2026-06-22)
- **Code-grounded against `main`:** every cited artifact exists — `TransferGroupTriggerService` (New→In Progress→Complete, `Is_Picked__c`-gated), `Inventory_Threshold__c` + `SKU_Override__c` precedent, `Transfer__c` quantity fields, `Use_Pallets_And_Layers__c`, `Pick_Path_Change_Log__c` audit precedent. `Transfer_Threshold__c` correctly does **not** exist yet (net-new). No Draft status (confirmed).
- **4665 is buildable now.** 4666/4667 wait on this data model.

---

## ✅ Done — BMS-4665 build complete, PR #355 open, CI green
- [x] Branch + worktree created off latest `origin/main`
- [x] Polish pass (`/polish-epic`) — children cohesive; epic text issues logged below
- [x] Spec decision: **Spec B (Salesforce-native)** locked
- [x] `Transfer_Threshold__c` config object + 7 fields + positive-min validation rule
- [x] Enforcement `enforceMinTransferQuantity` in `TransferGroupTriggerService` (New→In Progress, gated via CMDT)
- [x] Audit trail: `Transfer_Threshold_Event__c` + `Transfer_Threshold_Block__e` **PublishImmediately** platform event + subscriber service (survives the block's rollback) → feeds BMS-4667
- [x] 21 Apex tests green; coverage **TransferGroupTriggerService 90%**, handler + subscriber **100%**
- [x] `prettier:verify` clean · targeted `deploy validate` (RunSpecifiedTests) **succeeded** (19 tests)
- [x] Self code-review vs `CODE-REVIEW.md` — no raw SOQL/DML in non-test, SYSTEM_MODE rule-4 commented, conventions followed
- [x] PR [#355](https://github.com/Ohanafy/OHFY-Split/pull/355) opened vs `main` — **all CI checks pass** (Apex, Deploy Delta, Jest, Playwright, Prettier, Hex Lint)

## ⏭️ Remaining (not blocking the PR)
- [ ] **PO sign-off** on the v1 defaults below, then **merge** PR #355 (left unmerged per instruction)
- [ ] `/document` customer docs (package-affecting) — to follow
- [ ] Live anonymous-apex smoke hit an org describe-cache quirk (field provably exists; behaviour fully exercised by the 21-test suite against the real org) — re-run post-merge if desired
- [ ] Release org `ohfy-4665` **only after merge** (per [[feedback_keep-orgs-until-merge]])

## ⚠️ To finalize / call out (decisions not yet confirmed — building on documented defaults)
> These are assumed for v1 so the build can proceed; **confirm with PO (@Elliot Flores) before release.**

1. **Threshold grain** — *assumed:* per **item + lane** (origin/destination `Location__c` lookups, nullable = global fallback), mirroring `Inventory_Threshold__c`. *Alt:* per-warehouse only. **Who maintains it?** assumed Gulf admins via native record UI.
2. **Hard-block vs override** — *assumed:* **hard-block for v1**, no override path yet. The AC mentions "obtain an override per configured policy" — **override mechanism deferred to phase 2** unless PO wants it now. ← biggest open call.
3. **Rounding** — *assumed:* enforce full-layer/full-pallet multiples **only when `Use_Pallets_And_Layers__c` = true**; loose-case minimums otherwise.
4. **Audit events** — *adding* a `Transfer_Threshold_Event__c` (or equivalent) row on each block so BMS-4667 has data. Confirms polish finding #3 (4665's AC didn't promise this).

## 🧹 Epic hygiene fixes still owed on Jira (text-only, non-blocking)
- [ ] **Epic 5162 description** says enforce "at **draft finalization**" — stale; contradicts 4665, BMS-5159, and code (no Draft status). Fix to "New→In Progress gate."
- [ ] **Epic 5162** calls 4665 "a **placeholder** pending scope refinement" — 4665 is fully specced + `polished`. Fix Scope paragraph.
- [ ] Add the block/override **audit-event** line to 4665's AC.

## Build plan (Spec B)
1. **OHFY-Data-Model** — `Transfer_Threshold__c`: `Item__c`, `Origin_Location__c`, `Destination_Location__c` (nullable), `Min_Case_Quantity__c`, rounding-mode field(s), `Is_Active__c`, `External_Id__c` + one-liner trigger. Add to `sample-data-plan.json`. Mirror naming/quantity standards.
2. **OHFY-WMS** — extend `TransferGroupTriggerService` New→In Progress path: resolve applicable thresholds via `QueryService`, compute shortfall, block with item/min/shortfall message; respect `Use_Pallets_And_Layers__c`. Keep out of `TransferTriggerService` adjustment logic. Persist block audit event.
3. **OHFY-WMS-UI** — surface the block message through `WMS_UI_Wrappers`.
4. **Tests** — `TransferGroupTriggerService` `_T` (all contexts), `Transfer_Threshold__c` trigger `_T`, ≥90% coverage.

## Log
- **2026-06-22** — Branch + worktree created; polish complete; note opened; starting data-model object.
- **2026-06-23** — Build complete. Object + enforcement + PublishImmediately audit subsystem; 21 tests @ ≥90%; deploy-validate passed; prettier + self code-review clean. PR [#355](https://github.com/Ohanafy/OHFY-Split/pull/355) opened, **all CI green**. Left unmerged + org `ohfy-4665` retained pending PO sign-off.
