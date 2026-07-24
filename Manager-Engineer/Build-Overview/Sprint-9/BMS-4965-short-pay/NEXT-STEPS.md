---
title: "Next Steps — Short Pay (BMS-4965) after the resolution-outcomes spike"
epic: BMS-4965
pr: 582
branch: demo/short-pay-epic-bms-4965
date: 2026-07-22
---

# Next Steps — Short Pay (BMS-4965)

Snapshot of what's done and what's left after the resolution-outcomes spike + the
roll→write-off swap. PR: **#582** (open) · branch `demo/short-pay-epic-bms-4965`.

## Shipped in this pass (v1)
- Resolution options: **Post Credit · Mark Collected · Assign to Rep · Write Off**.
- Durable **`Short_Pay_Resolution__c`** audit trail (one row per resolution).
- **Rep-collection loop-close** — completing the rep's task resolves the invoice.
- **Sales Rep Home** shows the collection task (due-today + route-stop ensured).
- **Configurable** rep-collection task wording (`Short_Pay_Task_Template__mdt`).
- CMDT rename → **`Short_Pay_State_Threshold__mdt`**.
- Tests: Apex 8/8 · Jest 5/5 · Playwright 2/2 (live) / skips where the org-metadata tab is absent.

## Immediate (to merge #582)
1. **Get CI green.** After the CI-fix commit, watch `gh pr checks 582`:
   - Prettier Verify — fixed (3 `Short_Pay_Decision__c` fields reformatted).
   - Hex Lint — fixed (`shortPayApprovals.html` skeleton `#f4f2f0` → `rgb(var(--ohfy-skeleton, …))`).
   - Playwright E2E — my spec now **skips** when the `Short_Pay_Review_Queue` tab isn't deployed
     (CI org has no org-metadata). ⚠ Note: the shared WMS Playwright suite can still fail #582 on
     other teams' flaky specs — check the failure is actually ours before touching anything.
2. **Deploy org-metadata to the CI/pool org** (optional, to make the review-queue Playwright run
   instead of skip): tabs + flexipages for `Short_Pay_Review_Queue` / `Short_Pay_Approvals` live in
   `org-metadata/scratch/` — CI doesn't apply them by default. Either add a per-spec deploy helper
   (like the WMS specs) or accept the skip.
3. **Release the dry-run org** once merged: `npm run org:release -- ohfy-val-shortPay` (needs a
   working AWS SSO — was broken in the agent shell). Keep `ohfy-val-shortPay-2` until merge.
4. **PR is currently "ready" (not draft)** — CI runs on every push. Flip to draft if you want to
   pause CI while iterating.

## Deferred — needs refinement / PO direction
| Item | Why parked | Direction |
| --- | --- | --- |
| **Roll-to-next-invoice / rebill** | Roll only *tracks* a carry-forward (`Carried_Forward_Short_Pay__c` → `Short_Pay_Amount__c`); it does **not** re-bill (`Total_Due` unchanged, no line item) | Decide track-vs-rebill. True rebill = add a "Carried short pay" **line item** on the target so `Subtotal→Total_Due` actually charges it. Never edit the released `Total_Due` formula. |
| **Dispute** resolution action | Gulf-named, never built as an action (only a capture reason code) | Park at a dispute/under-review state pending investigation, then route to credit/collect/write-off |
| **Bill-back to supplier** | Right answer for supplier-funded deductions (dominant EFT/Publix short); infra exists (`Billback__c`, `B_BillbackDetection`) | Logged on BMS-4965 comment (AI-surfaced/open). Needs short-pay→program mapping + status decision |
| **BMS-5626 EFT ingestion** | Nothing opens EFT shorts into the queue yet (bank-rec consumer) | Integrations hand-off note written (`INTEGRATIONS-HANDOFF-eft-short-pay.md`); build the consumer that sets `Amount_Paid < Total_Due` + `Short_Pay_Status = 'Open'` |
| **Assign-to-Rep idempotency** | Repeated clicks create duplicate collection tasks | Guard: reuse the open collect task for the invoice instead of inserting a new one |
| **`Under Review` status** | Zero automation writes it (manual-only marker) | Keep as a manual "AR is on it" flag *or* cut it — decide with AR |
| **Managed-tab parity** | `Short_Pay_Approvals` has only a `scratch/` CustomTab, no `managed/` twin | Add the managed tab + flexipage before customer-prod release (org-metadata rule) |
| **Inert roll orphans in metadata** | Left on purpose (may hold historical data) | If roll isn't resurrected: remove `Invoice__c.Short_Pay_Rolled_To__c` and the `Rolled-Forward` value on `Short_Pay_Status__c` in a dedicated cleanup |
| **Rep collections surface** | Sales Rep Home is route-driven; auto-adding the account to the rep's route is a pragmatic hack | Consider a dedicated non-route "My Collections" section on Sales Rep Home |

## Watch-outs for whoever picks this up
- `org-metadata/` is a **separate deploy target** from the package `force-app` dirs — tabs/flexipages
  won't reach an org via a package source deploy. This bit us twice (Driver Home / review-queue tabs).
- New custom fields deploy **FLS-hidden**; grant via permset or the running user won't see them.
- `Legacy_Security_Bypass` must be assigned or `DmlService` runs USER_MODE and triggers throw on FLS.
- The 4 dry-run permsets (`Delivery_Supervisor`, `Sales_Manager`, `Regional_Director`,
  `Short_Pay_Demo_Driver_Fields`) were **stripped** from the PR — they're org setup, not product.
