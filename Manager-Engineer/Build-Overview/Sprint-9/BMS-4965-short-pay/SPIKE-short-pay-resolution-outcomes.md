---
title: "Spike — Short-Pay Resolution Outcomes (rep collection, audit, roll vs write-off)"
epic: BMS-4965
type: spike-outcome
date: 2026-07-21
status: direction-set
---

# Spike — Short-Pay Resolution Outcomes

> **Purpose:** validation spike on the AR-side short-pay resolution flow. Explored what a full
> resolution loop should do, prototyped several pieces against a dev org (`ohfy-val-shortPay-2`),
> and set direction on what ships in **v1** vs. what is **deferred**. This note is the paper trail:
> what was done, what was decided, and what's left.

## TL;DR
- **v1 resolution options: Post Credit · Mark Collected · Assign to Rep · Write Off.**
- **Roll-to-next-invoice was removed from v1** — it only *tracks* a carry-forward, it does **not**
  re-bill the customer. That's the unsettled "rebill" question; deferred until Gulf ratifies intent.
- **Write Off replaced Roll** in the resolve modal (terminal, functional, Gulf-named outcome).
- Built + validated this session (kept): rep-collection **loop-close**, a **durable resolution
  audit** object, a **configurable task message**, the **CMDT rename**, and the **Rep Home
  visibility** fix. All covered by Apex + Jest (+ a new Playwright spec).

---

## The resolution options Gulf wants (Jul 14 on-site, §F + Q3)

| # | Gulf-wanted outcome | v1 status |
| --- | --- | --- |
| 1 | **Collect the difference now** (corrected/second check) | ✅ **Mark Collected** |
| 2 | **Correct / adjust the invoice** (credit for a legit cut) | ✅ **Post Credit** (credit path; true invoice-correct/rebill deferred) |
| 3 | **Sales rep collection** ("sales attorney" collects the balance) | ✅ **Assign to Rep** |
| 4 | **Write-off** (uncollectible) | ✅ **Write Off** |
| 5 | **Roll to next delivery/invoice** (their *preferred* future state, FL 10-day window) | ⏸️ **Deferred** — tracks, doesn't re-bill (see below) |
| 6 | **Dispute** (as a resolution path) | ❌ **Not built** — only a driver-capture reason code |
| 7 | **Rebill** (formal) | ❌ **Open** — never settled by Gulf |
| — | **Mandatory reason code** on every accepted short | ✅ (driver capture) |

**Summary of the resolution:** v1 lets AR *credit it, collect it, hand it to a rep, or write it
off*. Each moves `Short_Pay_Status__c` to a terminal/queue state, stamps `Short_Pay_Resolved_Date__c`,
and writes an immutable audit row. Roll/rebill and dispute are parked.

---

## Why roll-to-next-invoice was pulled from v1
`rollToNextInvoice` incremented the **target invoice's `Carried_Forward_Short_Pay__c`**, which flows
into the read-only `Short_Pay_Amount__c` formula (`Total_Due − Amount_Paid + Carried_Forward`).

**It does not re-bill:**
- `Total_Due__c` is a formula off the **line-item rollup** — the roll never touches it and adds no line item.
- Live proof (org): rolled INV-Q3 ($310.75) onto INV-Q4 → Q4 `Total_Due = 0`, `Carried_Forward = 435.75`,
  `Short_Pay_Amount = 435.75`. The **billed** total didn't move.
- Consequence: if the customer pays Q4's visible `Total_Due` in full, the carried balance **still
  shows as owed** — nothing customer-facing charges it.

So "roll" today = an AR **tracking overlay**, not a re-bill. That's exactly the open **"rebill"**
question (§Q3). Rather than ship a half-feature, v1 removes it. Direction below.

---

## What was built this session and KEPT for v1
| Piece | What it does | Coverage |
| --- | --- | --- |
| **Write Off** resolution | Replaces roll in the modal; `S_ShortPayResolution.writeOff` → `Written Off`; audit row | Apex + Jest + Playwright |
| **Rep-collection loop-close** | Completing the rep's Sales-Rep-Home task resolves the invoice to `Resolved-Collected` (via new `Activity.Short_Pay_Invoice__c` link + `E_SalesRepHome.completeTask` hook) | Apex e2e (9/9 earlier), validated live |
| **Rep Home visibility** | `assignToRepForCollection` now dates the task **today** and ensures the account is a stop on the rep's route today, so the collection task actually shows on Sales Rep Home | Apex + live |
| **Durable resolution audit** | New `Short_Pay_Resolution__c` (Action / Amount / Resulting Status / Resolved By / audit link). One immutable row per Credit / Collected / Rep Collection / Write Off | Apex e2e + queries |
| **Configurable task message** | `Short_Pay_Task_Template__mdt` (tokens `{customer} {amount} {invoice}`) drives the rep-collection task wording; built-in fallback | Apex |
| **Scalable audit-action mapping** | Status **and** audit-action label both derive from one transition key via `S_ShortPayConfig` (`Audit_Action__c` on the config CMDT) — no parallel literals to drift | Apex |
| **CMDT rename** | `Short_Pay_Threshold__mdt` → `Short_Pay_State_Threshold__mdt` (clearer; groups with the family) | Apex 27/27 earlier |

### Tracking queries (audit object)
```sql
-- Resolution history feed
SELECT Name, ohfy__Invoice__r.Name, ohfy__Invoice__r.ohfy__Customer__r.Name, ohfy__Action__c,
       ohfy__Amount__c, ohfy__Resulting_Status__c, ohfy__Resolved_By__r.Name, CreatedDate
FROM ohfy__Short_Pay_Resolution__c ORDER BY CreatedDate DESC LIMIT 200
-- Per-invoice (child subquery)
SELECT Name, ohfy__Short_Pay_Status__c,
       (SELECT ohfy__Action__c, ohfy__Amount__c, ohfy__Resolved_By__r.Name, CreatedDate
        FROM ohfy__Short_Pay_Resolutions__r ORDER BY CreatedDate DESC)
FROM ohfy__Invoice__c WHERE Id = :invoiceId
```
The object is Report-enabled → AR can build a "Short Pay Resolutions" report/dashboard instead of SOQL.
It's also a native **related list** on the Invoice record (place it on the page layout to surface).

---

## DEFERRED / open direction (for refinement)
1. **Roll-to-next-invoice / rebill (§Q3).** Decide the intent:
   - *Track-and-chase* (current roll behavior) — resurrect roll as-is, documented as tracking-only, or
   - *True re-bill* — add a **"Carried short pay" line item** on the target invoice so `Subtotal → Total_Due`
     actually charges it (cleanest; keeps the rollup honest). Do **not** edit the released `Total_Due` formula.
2. **Dispute** as a resolution action (Gulf-named, not built). Likely: park at a `Under Review`/dispute
   state pending investigation, then route to credit/collect/write-off.
3. **Bill-back to supplier** for supplier-funded deductions (the dominant EFT/Publix short). Infra exists
   (`Billback__c` / `B_BillbackDetection`). Logged as its own refinement note.
4. **Idempotency guard** on Assign-to-Rep — repeated clicks create duplicate collection tasks.
5. **`Under Review` status** has zero automation — decide keep-as-manual-marker vs. cut (see the field
   analysis: it's never written by code).
6. **Managed-tab parity** — `Short_Pay_Approvals` lacks a `managed/` CustomTab twin (only `scratch/`).
7. **Inert roll orphans left in metadata** (safe, documented): `Invoice__c.Short_Pay_Rolled_To__c` field
   and the `Rolled-Forward` value on `Short_Pay_Status__c` — kept because they may hold historical data;
   remove in a dedicated cleanup if roll is not resurrected.

---

## Test coverage (this spike's kept work)
- **Apex** — `S_ShortPayResolution_T` 8/8 (write-off covered; roll tests removed; due-date fixed).
- **Jest** — `shortPayReviewQueue.test.js` 5/5 (write-off + a guard that Roll is absent).
- **Playwright** — `test-automation/tests/oms/short-pay-review-queue.spec.ts` (write-off flow + Roll-absent assertion).

## Notes
- Dev org used: `ohfy-val-shortPay-2` (branch `demo/short-pay-epic-bms-4965`).
- Demo-only permission sets (`Delivery_Supervisor`, `Sales_Manager`, `Regional_Director`,
  `Short_Pay_Demo_Driver_Fields`) exist for the dry-run org and must be **stripped before the PR** —
  they are org-setup, not product.
