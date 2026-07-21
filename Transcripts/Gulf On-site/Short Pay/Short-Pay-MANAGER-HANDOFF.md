---
type: handoff
audience: manager + manager's agent
topic: Short Pay (Publix EFT)
prepared_by: Alvaro Sanchez
date: 2026-07-15
source: "Transcripts/Gulf On-site - Short Pays/Transcript July 14th - Afternoon meeting.md"
source_meeting: "Gulf Onsite — Accounting — Afternoon (Jul 14, 2026, 3h 46m, MS Teams)"
detail_ref: "Transcripts/Gulf On-site - Short Pays/Short-Pay-Publix-EFT Extraction.md"
epic: BMS-4965
phase_ticket: BMS-5626
jira:
  epic: https://ohanafy.atlassian.net/browse/BMS-4965
  ph5_eft: https://ohanafy.atlassian.net/browse/BMS-5626
  ph4a_gate: https://ohanafy.atlassian.net/browse/BMS-5625
  ph4b_workflow: https://ohanafy.atlassian.net/browse/BMS-5631
  ph6_aging: https://ohanafy.atlassian.net/browse/BMS-5627
model: "prevent-primary + handle the residual (EFT can't be driven to zero — it settles async)"
status:
  in_pipeline: true
  direction_captured: true
  open_decisions: 6
  new_build_committed: false
tags: [handoff, short-pay, gulf-onsite, BMS-4965, BMS-5626]
---

# Short Pay (Publix EFT) — Manager Handoff

> **TL;DR** — Compiled Gulf's direction on **Short Pay** from the July 14 on-site. It's the
> **Publix-EFT** problem (payment ≠ invoice), and it's **broader than Publix**: any time amount paid ≠ total
> due *after* the money moves (EFT, checks, DEX/DSD, net-30). **Gulf's real ambition is to prevent short pays
> at the source — not just handle them better.** But by their own statement they **can't eliminate them on EFT**
> (it settles asynchronously through the bank), so a handling path still has to exist for the residual. The work
> already lives in our pipeline as epic **BMS-4965**, with **BMS-5626 = Phase 5**. **Several decisions still need owners.**

## The core ask: prevent first, handle the rest

Gulf's framing was **"go to the source of the problem"** — make the discrepancy never happen, not get better at cleaning it up. But that hits a hard limit they stated themselves, so the honest model is two tracks:

- **① Prevent at source (the goal).** Make the invoice correct **at delivery** so what Publix EFTs later **matches**: (a) driver/DEX reconciles qty & price at the stop; (b) a **Publix/DEX integration** that syncs the invoice in real time. *Aspirational — gated on the still-undecided "can drivers edit the invoice" question.*
- **② Handle the residual (unavoidable).** EFT settles async — **can't be reconciled at the stop** — so some shorts always land at bank rec (late discounts, disputes, Publix-side adjustments). Approval gate, reason codes, collection, roll-to-next-invoice, write-off. *This is where most of the concrete discussion actually was.*

> **Constraint, in Gulf's words:** *"we can't stop it from happening if they're paying for EFT — it only gets us by the time we're doing a bank reconciliation."* → target is **minimize + handle the rest**, not zero.

## Where it sits in the build

Phased epic **BMS-4965** — two entry points, one back-office review queue:

| Phase | Ticket | State |
|---|---|---|
| Ph 4a — Driver approval gate | BMS-5625 | **Built & demoed** (PR #439) |
| Ph 4b — Approve/reject workflow | BMS-5631 | Backlog |
| Ph 5 — EFT | **BMS-5626** | **This on-site's topic.** Currently scoped "detection"; on-site pushes it toward **prevention** + residual net — scoping |
| Ph 6 — AR aging | BMS-5627 | Hold, pending Product |

- Capture already shipped under **BMS-3844**; back-office escalation/resolution built on a parked branch.
- Design decision: **extend `Invoice__c` + reuse `Credit__c`** — no parallel objects.

## Gulf's direction (grouped)

- **Definition:** amount paid ≠ total due, found *after* the sale. "No such thing as a no-pay — that's a short pay." Not Publix-only.
- **Root causes:** (1) pricing mismatch Gulf vs retailer; (2) qty/item change at delivery (broken case, didn't scan, wrong item). Plus driver-training gaps.
- **Prevent, not just detect:** today caught only at **bank reconciliation** (too late) → Gulf wants the invoice **right at delivery** so it matches what Publix pays; detection is the fallback.
- **Alert & own:** fire when a stop finalizes short → **AR team + driver's manager**, on the dashboard (not just email). Every short needs an owner; AR manager (Terry) owns exceptions.
- **Gate the stop:** driver can't complete until they collect in full **or** get approval. Approver = delivery mgr / assistant / senior driver (configurable group).
- **Resolution outcomes:** collect difference · correct/credit invoice · dispute · **roll balance to next invoice** (preferred) · write-off · sales-rep collection. **Mandatory reason code** on every accepted short.
- **Why now:** no gate today ("you just accept it"); **~1,000 short pays on the books, never properly followed up.**

## The open questions — answered?

1. **How do we learn a Publix EFT came in short — Bank Rec vs detect? (consume vs build)** — *Partial.*
   Today = bank rec only (confirmed too late). Real want = **prevent** (invoice right at delivery + Publix/DEX sync). Caveat Gulf stated: EFT is async → **can't be fully prevented**; a bank-rec catch stays as the residual net. **Build-vs-consume on the integration is still open.**
2. **Who can modify/resolve a Publix invoice, and at what step?** — *Partial.*
   Resolve/approve = delivery mgr / assistant / senior driver at finalize-stop; AR + Terry own post-stop. **Who authorizes an invoice line "cut" is deferred** to Jimmy/Ashton (Thursday pricing call).
3. **What resolution outcomes does Publix need?** — *Mostly answered.*
   Named all of the above. **Not settled:** a formal **"rebill"** outcome, and the **$/% approval threshold** that routes which path applies.
4. **(Engineer-added) How does Gulf want to be notified when a driver finalizes with a short pay, and to whom?** — *Not captured.*
   Needed for the **BMS-5625** approval-gate LWC. Gulf leaned max-visibility but **picked no channel and no single recipient**; demoed a **push/bell notification + dashboard queue**, email alone deemed insufficient, **Chatter never named**, SMS wanted but Twilio off. Recipient candidates: **driver's manager/delivery manager** vs. **shared AR queue**.

## Open decisions that need an owner

| Decision | Why it matters | Owner |
|---|---|---|
| Approval threshold ($/% for auto-accept vs route) | Gates which shorts stop the driver | Ops (Josh / Dom / Ashton) |
| Can drivers cut/edit the invoice — who authorizes? | **Critical path for prevention** — without it, discrepancies can't be fixed at delivery | Jimmy / Ashton — Thu pricing call |
| Publix EFT/DEX integration — build or consume? | **Central scope call** — the real-time sync that stops shorts at source | Product / Bank-Rec owner |
| Short-pay escalation notification — channel + recipient | BMS-5625 LWC needs how to surface a finalize-with-short-pay, and to whom (Chatter never named; push/bell demoed) | Ops + AR · confirm Product |
| "Rebill" as a formal outcome? | Confirm vs fold into correct-invoice / next-invoice | Product (Emily) |
| Manual check-key fallback (# failed scans) | Bailout when scan illegible | Accounting + Ops |

## Recommended next steps

1. Route the open decisions to their owners (threshold → Ops; invoice-cut → Jimmy/Ashton Thu; EFT integration → Product; notification → Ops+AR).
2. **Reframe BMS-5626 from "EFT detection" to "EFT prevention + residual net"** and fold this direction into the **BMS-4965** epic so it can be sized for build.
3. Design is **configurable** (thresholds, approver roles, reason codes, notification channel) → we can **build past the open values** and let the team ratify in refinement. **No hard blocker on starting Phase 5.**

---
*Full isolated transcript + compiled direction: `Transcripts/Gulf On-site - Short Pays/Short-Pay-Publix-EFT Extraction.md`. Bracketed terms in that file are cleanups of an auto-generated recording (e.g. "public"→Publix, "golf"→Gulf).*
