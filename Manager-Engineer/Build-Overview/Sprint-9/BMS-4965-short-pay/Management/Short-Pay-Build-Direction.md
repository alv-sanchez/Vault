---
type: build-direction
audience: agent (engineer pipeline)
epic: BMS-4965
epic_url: https://ohanafy.atlassian.net/browse/BMS-4965
prepared_by: Alvaro Sanchez
date: 2026-07-15
grounded_in:
  - "On-site direction: Transcripts/Gulf On-site - Short Pays/Short-Pay-Publix-EFT Extraction.md"
  - "Live BMS-4965 children + comments (54842, 56551, 58613, 58671, 58672, 58678, 58728-58734)"
  - "PR #439 (BMS-5625): live GitHub state + CI + reviews"
pr_439:
  url: https://github.com/Ohanafy/OHFY-Split/pull/439
  ticket: BMS-5625
  state: open
  merged: false
  mergeable_state: blocked
  verdict: ITERATE   # good foundation, not landable as-is
o1_decision: "AL $0 / FL $50 + 2% + 7-day aging (state-aware, configurable)"
tags: [build-direction, short-pay, BMS-4965, BMS-5625]
---

# Short Pay (BMS-4965) — Build Direction

> **The why (on-site):** Gulf wants to **prevent** short pays at the source, but EFT can't hit zero (async; a discount the customer takes at payment time, no in-person moment) → a **back-office handling/approval path is mandatory** for the residual. Full reasoning + line citations: `Short-Pay-Publix-EFT Extraction.md`. This doc is the *what-to-build*.

## PR #439 / BMS-5625 — VERDICT: **ITERATE** (not "good to merge" yet)

Good foundation — Ph-4a scope is correct (stateless hard-gate; engine = custom Apex + `Short_Pay_Approval_Layer__mdt`, the right design per the 07-01 decision), gate boundaries live-smoked ($30 allow · $50/$250/$1000 layer 1/2/3). **But it is blocked and needs a focused iteration pass before it lands.**

**State:** open · not merged · `mergeable_state: blocked` · +1249/−11 · 24 files · last push 2026-07-02.

### Iteration checklist (do these to land it)
1. 🔴 **Green the CI — top blocker.** *Apex Tests* and *Playwright E2E* are **FAILING** in the pipeline, despite the PR body's "106 Apex / 25 Jest pass locally." Reconcile local-vs-CI (likely seed/env skew or the `OMS_UI_Wrappers` staleness-vs-POS-merge noted on the epic). Fix only this branch's failures.
2. 🟠 **Remove leftover debug statements** — `E_DriverHome.cls:2814` (reviewer: thomas-spangler, thread open).
3. 🟠 **Answer the design Q** — *"expand the gate to more workflows?"* (thomas-spangler, thread open). Engine is already generic (`S_ShortPayApprovalGate` + CMDT); recommended reply: yes, reusable by design — coordinate with Bryson's future central-approval component — but keep 5625 scoped to the short-pay gate. Ties to BMS-4396.
4. 🟠 **Visual banner smoke** — AC2 "Awaiting Approval" banner is Jest-covered but never rendered on a staged driver persona. Smoke it on Driver Home before demo.
5. 🟢 **Get an approving review** — only COMMENTED reviews so far; the Claude bot review was **skipped (org spend cap)**. Needs a human approve (or re-trigger the bot once cap resets).
6. ✅ **After green + approved → merge**, then **clear the stale "Needs Refinement" status** and load the O-1 thresholds (below).

### AC coverage (from the PR)
- **AC1** (below-threshold allow) ✅ · **AC6** (metadata-only config) ✅ · **AC7** (in-app only) ✅
- **AC2** (at/above → hard block) ⚠️ partial — blocks, but no persisted approval-state field yet
- **AC3–AC5** (multi-layer sequential approve/reject) → **deferred to BMS-5631 (Ph 4b)** by design
- **AC8** (tests ≥90%) ⚠️ — gate 96% / DTO 100% / `E_DriverHome` **79%** (legacy class; new lines covered, reviewer sign-off flagged)

---

## Build order — what to build, in sequence

### 🟢 NOW (approved, dependency-safe, disjoint)
1. **BMS-5625 (Ph 4a)** — run the iteration checklist above → **land PR #439.** Engineer-owned (confirmed SF screen). Then load O-1 config.
2. **BMS-4059 + BMS-4060 (Ph 2/3)** — finish the parked branch (`feat/short-pay-backoffice-bms-4965`): seed-skew fix + tests + PR. This is the back-office review queue the on-site says is mandatory for the EFT residual.
   - **Load O-1 thresholds** (state-aware, configurable — see below).
   - **Add 2 missing ACs to 4060:** roll short-pay → next invoice (FL 10-day window); sales-rep collection of outstanding balance.

### 🟠 NEXT (after 5625 merges)
3. **BMS-5631 (Ph 4b)** — stateful multi-layer approve/reject (AC3–5): persisted `Short_Pay_Approval_State__c`, sequential per-layer progression role-filtered by `Approver_Source`, modeled on `POSRequestController`.
   - **Add the notification AC (Q4, comment 58672):** how the finalize-short-pay is surfaced + to whom. Default = custom bell/push + review-queue; recipient = configurable group (driver's manager / AR). Channel undecided (Chatter never named) — build configurable, ratify later.
   - Also satisfies Thomas's "reuse across workflows" question (generalized engine).

### 🔵 LATER / GATED (not engineer-buildable now)
4. **BMS-5626 (Ph 5) — 🚩 INTEGRATION-owned.** Engineer builds ONLY the consume slice (`Amount_Paid < Total_Due → Short_Pay_Status = Open` into the 4060 queue) **after** the bank-rec feed lands (I-1). Gated on Product's consume-vs-build + Publix DEX decision. Do not start the Apex slice until the signal exists.
5. **BMS-5627 (Ph 6) — SPLIT.** Short-pay aging already covered by 4059/4060's per-state aging. The general net-30 "not-yet-due" AR view = separate, configurable AR scope (metadata aging buckets, reuse per-state aging-day config) → confirm split w/ Product.

### ⚫ CLOSE / PARK (not work — dispositions posted to Jira)
- **Close:** BMS-4057 (superseded — model decided), BMS-4058 (delivered under BMS-3844).
- **Park (empty):** BMS-4784 (demo live via 5625), BMS-4785 / BMS-4786 (reporting folded into 4060).
- **Needs info (separate lane):** BMS-5561 (returns mismatch + recon credit hold).

---

## O-1 thresholds to load (decided 2026-07-15, comment 58678)

State-aware, dual-cap, driven by alcohol credit law. Configurable — ratify FL numbers w/ Ops.

| State | Auto-accept if short ≤ | Aging escalation | Basis |
|---|---|---|---|
| **AL** | **$0** (always route) | 0 days | Cash/COD by rule — AL ABC Ch. 20-X-8 |
| **FL** | **$50 AND ≤ 2%** (lower-of) | 7 days | §561.42 10-day credit window (escalate before trigger) |

**Where it lands in config:**
- Gate cutoff → `Short_Pay_Approval_Layer__mdt` Layer-1 `Threshold_Min__c` per state (AL $0 / FL $50).
- FL 2% cap → `Threshold_Percent` (noted shipped-dormant in comment 56551 — confirm the field exists on the layer CMDT or add it).
- Aging (FL 7d / AL 0) → escalation CMDT `Short_Pay_Threshold__mdt` by `BillingState` (BMS-4059).
- ⚠️ Reconcile the two CMDTs carry the right per-state values; % + aging are AI-assumed defaults to ratify.

## Open decisions (routed — none block the engineer)
- **Invoice-cut authorization** — can drivers cut/edit a line, who approves → Jimmy/Ashton, Thursday pricing call.
- **Publix DEX build-vs-consume** (scopes 5626) → Product.
- **Notification channel + recipient** → Ops + AR, confirm Product.
- **"Rebill" as a formal outcome** → Product (Emily).
- **Non-deliverable enforcement until paid** — unticketed; keep/drop decision (Gulf flagged caution).
- **FL $50/2%/7d** — ratify vs Gulf's real invoice sizes → Ops.

## Explicitly NOT engineer scope
Publix DEX sync (I-2), bank-rec detection feed (I-1), check-scan/OCR (I-4, epic-excluded). Engineer consumes; does not build the pipe.
