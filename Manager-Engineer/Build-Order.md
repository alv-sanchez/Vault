---
title: Build Order
project: OHFY / BMS
assignee: Alvaro Sanchez
generated: 2026-06-26
method: real Jira blocks/blocked-by graph + OHFY-Split @ main file-ownership (not titles)
related: "[[_dashboard]]"
tags:
  - manager-engineer
---

# Build Order — Epic Streams & Stages

> [!summary] How to read this
> **Streams** run in parallel and are internally serial (the no-overlap unit). A **stage** is the wavefront — one epic per disjoint stream at a time. `/conductor` regenerates this from live data each run.

> [!warning] Seed, not gospel
> Stream/overlap calls below come from a one-time audit (2026-06-26). `/conductor` re-confirms `packages_touched` disjointness per ticket before dispatch and re-flows the wavefront as `4245` lands and the undecomposed epics gain children.

> [!check] Plan-only /pulse addendum — 2026-07-21 ~15:30 (DRIFT since 09:31, no topo regen)
> Atlassian MCP still down for this thread → no live `epics_jql`, `/polish`, PO posts, or cross-epic topo regen (needs issuelink graph). Streams/stages table below NOT regenerated. Repo (`gh`/git) is the live source; on `main`, clean.
> **Changes vs the 09:31 pulse (which was zero-drift):**
> - **BMS-4997 To-Do → In Progress** (active epics 4→5, to-do 6→5). Branch `feat/call-center-order-visibility-reporting-bms-4997` exists (no PR yet) — call-center agent dashboards. Reactivates an OMS-Delivery-adjacent stream; check package overlap (OMS/OMS-UI) vs the Pricing-Manager wave and Short Pay before scheduling. No epic note yet (hygiene gap).
> - **Two merges landed on `main`** (HEAD `ad3e48e5`/#560 → **`d9f23ac0a`/#597**): **#554** (BMS-4142/5845/5886 supplier-program reconciliation — previously a draft to-watch, now MERGED; billback/supplier-receivables overlap now resolved into main) and **#597** (BMS-6002 freight-billback perm-set ref fix).
> - **#582 Short Pay still READY, unmerged** — remains the top merge-gate item.
> - **0 new open questions.** BMS-5164→BMS-4088 block unchanged, still un-formalized (needs a Jira-connected run to post).

> [!danger] Dry-run reality check — 2026-06-28
> The Stage 1 audit found **0 of 5 epics executable** — all are gated on direction/decomposition, not code. The "start now" Stage 1 below is **aspirational, not actionable yet**. The *actual* first action is the **decision wave**: answer the 5 Feedback Docs + decide BMS-4245. See [[Daily/2026-06-28]] and [[Runs/2026-06-28-Stage1-dryrun]]. (Ran on stale `main`, then pulled to `a00a3fe5` and verified the 13 commits touched none of the finding-relevant objects — findings stand on current main.)
> - 5139 (S2) is **blocked** by unbuilt spike BMS-4126 — not start-now.
> - 4996 (S1) is **mostly already shipped** — only a contradicted remnant remains.
> - 5060 needs slicing; 4935 & 5129 need a data-model decision before AC exists.

> [!check] Live-state correction — 2026-07-20 (plan-only /pulse rerun; interactive Jira pull)
> The 09:08 addendum below is now partly stale. Two epics **shipped** since:
> - **BMS-5161 Freight Billbacks → DONE.** Merged via **integration PR #574** (`integration/bms-5161-stateLineTransfer-validation → main`, merged 2026-07-20 12:55Z). The 5789→5790→5791 draft stack (#511/#514/#516) was rolled into #574; worktrees + validation branches cleaned up. Remove S2-billback from the active wavefront. (5792 UI/demo was the Awaiting-UI child at ship.)
> - **BMS-5576 Ecom Ph2 → DONE.** Shipped; drop from the isolated eCommerce stream. Its former autonomous candidates (BMS-4051, BMS-5321) are no longer active queue items.
> - **Live in-progress epics are now exactly three: BMS-4965 (Short Pay), BMS-5113 (DOI-Std), BMS-4935 (Red Bull).** Everything below about 5161/5576 fronts is historical.
> - No new topo regen (Atlassian MCP still down → no issuelink graph). No new blockers/open questions this rerun; the BMS-5164→BMS-4088 block is unchanged and still un-formalized.

> [!check] Repo-verified active-work reconciliation — 2026-07-20 (plan-only /pulse)
> Atlassian MCP still down for this thread → **no live `epics_jql`, no `/polish`, no PO Jira posts, no cross-epic topo regen** (needs the issuelink graph). Snapshot (`mission-control.json`) is from 2026-07-16; the repo (`gh`/git) is the independent live source used below. Streams/stages table further down is NOT regenerated this pass.
>
> **Wavefront changes vs 2026-07-13:**
> - **BMS-4965 Short Pay — big advance.** The epic collapsed into ONE ready PR: **#582 (demo/short-pay-epic-bms-4965) READY**, unioning 5625+4059+4060+5631, validated e2e in org `ohfy-val-shortPay`. It **supersedes #439/#557/#561** (close those on merge). `REVIEW_REQUIRED`. This is now the top merge-gate item for the Finance/OMS stream — `/work-epic` owns the merge sequencing (bundle → main). Was "4059/4060 In Progress by hand" last run.
> - **New OMS/supplier-program work landed on `main`:** BMS-5393/5394/5395/5396/5397 (supplier-program GL hand-off, rebate accrual, budgets/UX) + BMS-5836 (CI lint-gate auto-ticket). Adjacent to the billback/supplier streams — check package overlap before scheduling 5161 follow-ons.
> - **BMS-5161 Freight Billbacks — unchanged front:** stack **5789 (#511) → 5790 (#514) → 5791 (#516)** all still DRAFT→main, merge A→B→C; 5792 (D) parked `Awaiting-UI`. New adjacent DRAFTs to watch for overlap: **#554 billback-reconciliation (4142/5845/5886)** and **#566 supplier-receipt-application (5511, oms/oms-ui/data-model, READY)** — coordinate, both touch OMS receivables.
> - **BMS-5113 DOI-Std — unchanged:** **3742 (#513) still DRAFT** (High risk, DOI-reconciliation gate); 4544 spike / 4543 UI-demo backlog.
> - **BMS-4935 Red Bull — unchanged:** still **blocked on Matt** (allocation direction); 4120 built (branch) but epic-gated. Do not advance 3735/4119/4121.
> - **BMS-5576 Ecom Ph2:** #388 (3932 self-service, READY), #576 (5305 e2e), #376 (ecom package build) — isolated eCommerce stream, no overlap with the above.
>
> **Blocked (real, still un-formalized):** **BMS-5164** children 5825/5826/5827 → **BMS-4088** (AL cert-engine spike, Backlog) — no branches exist (repo-confirmed). Needs a formal `Open-Questions/` note once Jira is reachable.

> [!check] Afternoon pulse — 2026-07-20 (plan-only /pulse #2; repo-verified, no topo regen)
> Second plan-only pulse of the day. Epic state unchanged from the interactive pull: **active in-progress = exactly 3 (BMS-4965, BMS-5113, BMS-4935)**; 5161 + 5576 remain Done. **No new open questions.** The change this window is a **large afternoon Pricing-Manager PR wave landing REVIEW_REQUIRED** (17:00–19:00Z), none of which belongs to the 3 active epics or any tracked `Epics/*.md` note:
> - **Pricing Manager cluster (OMS / OMS-UI):** #588 BMS-5972 (supplier×warehouse floor matrix, base `feat/billback-reconciliation-bms-4142` — stacked, not on main), #589 BMS-5967 (GI dollar-per-case default), #590 BMS-5926 (promotions overlay/authoring/calendar), #591 BMS-5970 (pricing audit trail), #593 BMS-5968 (draft bulk pricing actions), #595 BMS-5969 (chains inherit price code). All `REVIEW_REQUIRED`, mostly draft.
> - **Adjacent:** #594 BMS-5989 (OHFY UI-kit component library, ready), #592 BMS-5986 (WMS Playwright de-flake, ready), #556 BMS-5897 (POS Asset registry, oms/oms-ui/data-model), #540 BMS-5612 (ThemeSettings LWC), #536 BMS-3780 (WMS Replenishment Exception Codes, draft).
> - **Overlap watch:** this wave writes heavily into **OHFY-OMS / OHFY-OMS-UI** (pricing resolver, Pricing Manager LWCs) and, via #556/#588, **data-model + billback reconciliation** — the same neighborhood as the Short-Pay (#582) and supplier-receivable (#566/#554) streams. Do NOT schedule any autonomous OMS-touching candidate against these until the next Jira-connected run resolves epic membership + package disjointness. Treat all as in-flight, hand-worked — leave alone.
> - No branches appeared for the **BMS-5164 → BMS-4088** block (still un-formalized). Streams/stages table below NOT regenerated (no issuelink graph — MCP down).

> [!check] Repo-verified active-work reconciliation — 2026-07-13 (plan-only)
> Atlassian MCP was down this pass, so the **cross-epic topo-sort below (streams/stages) was NOT regenerated** — that needs the live `blocks`/`blocked-by` issuelink graph. Instead the repo (`gh`/git) was used as an independent source to pin the *current* wavefront of the 4 active epics. This addendum is repo-derived active state, not a full Jira re-flow.
>
> **Active now (in-flight / open PR — `/work-epic` owns within-epic PR grouping, not this doc):**
> - **BMS-5113 DOI-Std (S5):** BMS-3822 merged (baseline shipped). **BMS-3742** = PR #513 draft, High risk — gated on live DOI reconciliation before ready-for-review (known, not a new blocker). 4544 spike + 4543 UI-demo backlog.
> - **BMS-5161 Freight Billbacks (S2):** decomposed + building. Dependency-safe order **BMS-5789 → 5790 → 5791** (PRs #511 → #514 → #516, all draft to `main`, merge in that order); **BMS-5792** (UI/demo) parked `Awaiting-UI`, build gated on mockup approval. No `Inventory__c` lock involved (touches cost/receivables). ⚠ soft-coordinate 5790/5792 with BMS-5154 (both write `Transfer_Group__c`).
> - **BMS-4965 Short Pay (S-Finance/OMS):** 4059 + 4060 In Progress by hand; 5625 = PR #439 **ready** (12d old); 4785 reporting spike is the only clean autonomous candidate.
> - **BMS-4935 Red Bull (S3):** 4120 In Progress; epic otherwise **blocked on Matt** (allocation direction) — do not advance children 3735/4119/4121.
>
> **Blocked (real, already-logged):** **BMS-5164** children **BMS-5825/5826/5827** are all blocked on **BMS-4088** (shared AL cert-engine spike, Backlog/unstarted under sibling epic BMS-5160) — no branches exist for any of them (repo-confirmed). Cannot enter any stage until 4088 is scheduled.

> [!check] Evening pulse — 2026-07-20 (plan-only /pulse #3; live-Jira deltas + repo-verified, no topo regen)
> Third plan-only pulse. **Active in-progress = exactly 3 (BMS-4965, BMS-5113, BMS-4935)** — unchanged. Newest PR still #595; no new PRs since the afternoon pulse (the Pricing-Manager wave #588–595 is stable, still REVIEW_REQUIRED / mostly draft — leave alone). Tracked front unchanged: **#582 Short Pay READY** (top merge-gate), **#513 DOI-3742 draft**, **4935 Matt-gated** (4120 branch only, no PR).
> **Two live-Jira deltas this pulse (parent-confirmed):**
> - **BMS-5062 has left tracker scope** — to-do epics 8→7 (BMS-5481, 5164, 5768, 4997, 4996, 5577, 5155). No epic note existed for 5062; nothing to archive.
> - **BMS-5161 (Done) children are in "Testing" — validation in flight, not closed.** Authoritative child set = **5789 / 5790 / 5792 / 5909** (paper trail had 5789/5790/5791/5792 → 5791 dropped, 5909 new). Repo still shows draft PRs #511/#514/#516 (5789/5790/5791) open to main + no artifacts for 5792/5909 — status-vs-build gap flagged in the 5161 epic note, reconcile next Jira-connected run.
> **No new open questions.** Streams/stages table below NOT regenerated (Atlassian MCP down → no issuelink graph). BMS-5164 → BMS-4088 block still un-formalized (no branches, repo-confirmed).

> [!check] Late pulse — 2026-07-20 (plan-only /pulse #4; live-Jira delta + repo-verified, no topo regen)
> Fourth plan-only pulse. **Active in-progress = now 4 (was 3): BMS-4996 joins BMS-4965, BMS-5113, BMS-4935.**
> - **BMS-4996 Retailer Engagement Notifications — To-Do → In Progress (picked up).** New dev org **`bms-4996-notif`** claimed; **no PR/branch yet** (repo-confirmed — work just starting). Reactivates **Stream S1 · eCommerce**, which had gone idle when BMS-5576 shipped Done. The notification backbone (`AbandonedCartReminderScheduler/Batch`, `OrderConfirmationService`, `TwilioSMSService`, `Notification_Log__c`) is already on `main`; children remain **Not-Yet** (BMS-4073 has a Contradicted "Order Name Fix" AC — see [[BMS-4073-order-name-fix-scope]]). Nothing autonomously queueable — treat as hand-worked, leave alone. S1 is disjoint (OHFY-eCommerce(-UI)) from the 3 other active streams, so no overlap risk with 4965/5113/4935.
> - **To-do epics 7→6** (4996 left the to-do set): BMS-4997, 5481, 5164, 5768, 5577, 5155.
> - **Done normalized to 15 + 3 done-with-open-children in Testing:** 5161, 5576, **4995** (4995 newly recognized as shipped-with-open-children).
> - **Repo now on `main` and clean** — read-only preconditions pass (prior pulses today were on `chore/gulf-uat-...-bms-4184`, flagged off-main). Newest PR still **#595**; the Pricing-Manager wave (#588–595) is stable, REVIEW_REQUIRED / mostly draft — leave alone.
> - **No new open questions.** BMS-5164 → BMS-4088 (AL cert-engine spike, Backlog) block still un-formalized (no branches, repo-confirmed) — can't post the formal Open-Questions note (MCP down → no PO Jira comment). Streams/stages table below NOT regenerated (no issuelink graph).

> [!check] 2026-07-21 (plan-only /pulse; live-delta + repo-verified, no topo regen)
> **Steady state — no epic drift since the 07-20 late pulse.** Active in-progress = **4** (BMS-4996, BMS-4965, BMS-5113, BMS-4935); to-do = **6** (4997, 5481, 5164, 5768, 5577, 5155); done = **15 + 3 done-with-open-children** (5161, 5576, 4995 — children still `Testing`/`Build` in Jira though their code merged to `main`).
> - **No new merges to `main`** since 07-20 08:57 (HEAD = #560 BMS-5576 Ecom Ph2; #574 BMS-5161 Freight Billbacks merged the same morning — both pre-date the last pulse, no drift). Tracked front unchanged: **#582 Short Pay READY** (top merge-gate, `REVIEW_REQUIRED`), **#513 DOI-3742 draft**, **4935 Matt-gated** (branch `feat/redbull-allocation-import-bms-4120`, no PR). One new untracked draft this window — **#596** (Pricing-Manager crawl BMS-5967-70), joins the stable Pricing wave; not in any tracked epic → in-flight, leave alone.
> - **BMS-4996** still In Progress, hand-worked (org `bms-4996-notif`, still no PR/branch — repo-confirmed). Stream S1 · eCommerce stays reserved to it; nothing autonomously queueable.
> - **Autonomous candidates unchanged** (pending live `/polish` re-confirm, MCP down): BMS-4544 (5113 spike), BMS-4785 (4965 spike), BMS-3788 (5155 DOT core). **0 new open questions.** Repo on `main`, clean. Streams/stages table below NOT regenerated (no issuelink graph — MCP unavailable to this thread).

> [!check] 2026-07-21 09:31 (plan-only /pulse re-run; snapshot + repo-verified, no topo regen)
> **Re-pulse 13 min after 09:18 — zero drift.** Active in-progress = **4** (BMS-4996, BMS-4965, BMS-5113, BMS-4935); to-do = **6** (4997, 5481, 5164, 5768, 5577, 5155); done = **15 + 3 done-with-open-children** (5161, 5576, 4995). Snapshot `mission-control.json` fresh (`generated 2026-07-21 09:18`); repo `main`, clean. **HEAD unchanged** (`ad3e48e5`, #560 Ecom Ph2, 07-20 08:57) — no new merges. **Newest PR still #596** — no new PRs this window. Tracked front unchanged: **#582 Short Pay READY** (top merge-gate), **#513 DOI-3742 draft**, **4935 Matt-gated** (branch only, no PR), **4996** hand-worked (org `bms-4996-notif`, no PR/branch). **0 new open questions.** BMS-5164 → BMS-4088 block still un-formalized (repo-confirmed, no branches). Streams/stages table NOT regenerated (no issuelink graph — Atlassian MCP unavailable to this thread).

> [!check] Plan-only /pulse addendum — 2026-07-23 09:42 (2-day gap since 07-21 15:30; no topo regen)
> Atlassian MCP still unavailable to this thread (verified: `searchJiraIssuesUsingJql` → `No such tool available`, server ✔ Connected at CLI) → no live `epics_jql`, `/polish`, PO posts, or cross-epic topo regen (needs issuelink graph). Streams/stages table below NOT regenerated. Repo (`gh`/git) is the live build-state source; on `main`, clean.
> **No epic drift** vs 07-21 15:30 — active in-progress = **5** (BMS-4996, 4965, 5113, 4935, 4997); to-do = **5** (5481, 5164, 5768, 5577, 5155); done = **15 + 3 done-open** (5161, 5576, 4995). Snapshot (07-21) unchanged; no repo evidence of any tracked-epic transition.
> **Changes vs the 07-21 15:30 pulse:**
> - **HEAD advanced `d9f23ac0a`/#597 → `187bed696`/#596** (~9 merges over the 2-day gap). **None belong to a tracked active epic** — all untracked/in-flight: **#596** (Pricing-Manager crawl BMS-5967-70 + 6005/6006/6007/6057/6058, now HEAD), coverage-auditor/CI cluster (**#598/#548/#545/#547** BMS-5578, **#533** BMS-5824), **#592** (WMS Playwright de-flake BMS-5986), **#609** (docs BMS-6004), **#501** (/productize-demo skill), **#601** (BMS-6009 SupplierProgramControllerException namespace fix). Leave alone.
> - **BMS-4997 Call Center Order Visibility — draft PR #612 opened** (`feat/call-center-order-visibility-reporting-bms-4997`, created 07-23 03:28Z). Was branch-only at last pulse. First build artifact for the newly-active OMS/OMS-UI stream (account promotions + inventory panel). Hand-worked, in-flight → leave alone; still no epic note (hygiene gap).
> - **#582 Short Pay still OPEN / not-draft / `REVIEW_REQUIRED`, unmerged** — remains the top merge-gate item, unchanged.
> - **#513 DOI-3742 still draft OPEN**; **BMS-4935** still branch-only (`feat/redbull-allocation-import-bms-4120`, no PR, Matt-gated) — both unchanged.
> - **New untracked PRs to watch for overlap, do-not-touch:** #610 (BMS-5386 Pricing Floors grid, supersedes 5972), #608 (BMS-6012 Gulf Budget App — new OHFY-BGT pkgs), #607 (BMS-3921 stalled-cart rep alert, ecom), #606 (BMS-6054 OHFY-Accounting import), #599 (BMS-6000 WMS Layer Line), plus package-on-main/coverage bots (#616/615/614/613/611/605/604/603/602).
> - **0 new open questions.** BMS-5164 → BMS-4088 block unchanged, still un-formalized (needs a Jira-connected run to post).

> [!check] Plan-only /pulse addendum — 2026-07-23 15:36 (re-pulse, ~6h after 09:42; no topo regen)
> Atlassian MCP still unavailable to this thread (verified: `searchJiraIssuesUsingJql` → `No such tool available`, server ✔ Connected at CLI) → no live `epics_jql`, `/polish`, PO posts, or cross-epic topo regen. Streams/stages table NOT regenerated. Repo (`gh`/git) is the live build-state source; **local `main` was stale at #596 — fetched `origin/main`, now clean and current.**
> **No epic drift** vs 09:42 — active in-progress = **5** (BMS-4996, 4965, 5113, 4935, 4997); to-do = **5** (5481, 5164, 5768, 5577, 5155); done = **15 + 3 done-open** (5161, 5576, 4995). Snapshot (07-21) unchanged; no repo evidence of a tracked-epic transition.
> **Changes vs the 09:42 pulse:**
> - **origin/main advanced `187bed696`/#596 → `776ed4560`/#566** (6 squash-merges over the window). **None belong to a tracked active epic** — all untracked/in-flight, leave alone: **#566** (BMS-5511 trigger-driven supplier receivable collection + aging — oms/oms-ui/data-model, now HEAD), **#537** (BMS-3854 POS Deployment Visibility), **#610** (BMS-5386 Pricing Floors grid, supersedes 5972), **#614** (BMS-6076/6073 package-on-main unblock), **#536** (BMS-3780 WMS Replenishment Exception Codes), **#555** (BMS-4084/4085/4086/5214 POS Receiving Workflow).
> - **Overlap watch:** #566 (BMS-5511) writes OHFY-OMS / OHFY-OMS-UI / data-model receivables — same neighborhood as Short Pay (#582) and 4997 (#612). Do NOT schedule any autonomous OMS-touching candidate against this until a Jira-connected run resolves package disjointness.
> - **Tracked front unchanged:** **#582 Short Pay** still OPEN / not-draft / `REVIEW_REQUIRED`, unmerged (top merge-gate, no change since 07-22 13:40Z). **#513 DOI-3742** still draft OPEN. **#612 BMS-4997** still draft OPEN. **BMS-4935** still branch-only (`feat/redbull-allocation-import-bms-4120`, no PR, Matt-gated).
> - **BMS-4996 org re-claimed:** the old `bms-4996-notif` org is gone from `sf` auth; a new **`bms-4996-notif2`** org is now claimed. Still In Progress, hand-worked, no PR/branch (repo-confirmed) — leave alone. Update the 4996 epic note's Claimed-Orgs on the next connected run.
> - **New untracked draft/CI PRs opened this window, do-not-touch:** #626 (BMS-5843 Billback one-per-agreement, oms), #627 (BMS-6016 oms-ui coverage), #618 (BMS-6004 WMS multiworker, ready), #617 (BMS-6065 pltfm E2E), plus doc/CI-guard bots #619–625 (BMS-6083-6089) and package-on-main lint bots #615/616.
> - **0 new open questions.** BMS-5164 → BMS-4088 block unchanged, still un-formalized.

> [!check] Plan-only /pulse addendum — 2026-07-23 16:50 (re-pulse, ~1h after 15:36; no topo regen)
> Atlassian MCP still unavailable to this thread (verified: `searchJiraIssuesUsingJql` → `No such tool available`, server ✔ Connected at CLI) → no live `epics_jql`, `/polish`, PO posts, or cross-epic topo regen. Streams/stages table NOT regenerated. Repo (`gh`/git) is the live build-state source; local `main` behind origin by 7 (stale at #596) — read via `origin/main`.
> **No epic drift** vs 15:36 — active in-progress = **5** (BMS-4996, 4965, 5113, 4935, 4997); to-do = **5** (5481, 5164, 5768, 5577, 5155); done = **15 + 3 done-open** (5161, 5576, 4995). Snapshot `mission-control.json` fresh (`generated 2026-07-23 15:35`); no repo evidence of a tracked-epic transition.
> **Changes vs the 15:36 pulse:**
> - **origin/main advanced `776ed4560`/#566 → `794b800b9`/#627** (1 new squash-merge). **Untracked/in-flight, leave alone:** **#627** (BMS-6016 oms-ui supplier-settlement facade coverage, merged 19:56Z — clears a promote coverage gate). No tracked epic shipped.
> - **Tracked front unchanged:** **#582 Short Pay** still OPEN / not-draft / `REVIEW_REQUIRED`, unmerged (top merge-gate, last touched 07-22 13:40Z). **#513 DOI-3742** still draft OPEN (touched 07-23 04:12Z). **#612 BMS-4997** still draft OPEN. **BMS-4935** still branch-only (`feat/redbull-allocation-import-bms-4120`, no PR, Matt-gated).
> - **7 children went In Progress at the 15:05 pulse** (4997: 3858/3922 · 4996: 3921/3931 · 4965: 4057/4058/5625) — all hand-worked / in-flight, so per the executable gate they are **not polished, not queued** (leave alone). No autonomous candidates change.
> - **BMS-4996 org** = `bms-4996-notif2` (re-claim already reflected in the epic note frontmatter). Still In Progress, no PR/branch.
> - **0 new open questions.** BMS-5164 → BMS-4088 block unchanged, still un-formalized (needs a Jira-connected run to post).

## What the audit found (overrides a title-only guess)
1. **Inventory is one serial stream.** DOI, Snapshots, Safety Stock, Returns, and transfers' inventory-writes all go through `InventoryAdjustmentTriggerService.cls` + `Inventory__c`/`Inventory_Adjustment__c` (OHFY-PLTFM) → they collide → serialize.
2. **Keystone blocker unbuilt:** `BMS-4245` (Item Master Data Governance – Productize) is **Backlog** and blocks **5160, 5158, 5074, 5083, 5155**. (3799 Done; 3728 is a stale demo link.) The warehouse cluster can't start until 4245 builds or the link is ruled stale (PO question).
3. **Not executable — zero child stories:** `4936`, `5124`, `5164` → decompose first.
4. **Hidden chain:** `(4935 + 5139) → 5148 → 5113`; plus `5060 → 5113` and `5060 → 5067`.
5. **Jira `components` empty everywhere** — disjointness comes from the codebase.

## Streams (parallel; each internally serial)

| Stream                             | Disjoint package / files                                        | Epics in order                                                     |
| ---------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------ |
| **S1 · eCommerce**                 | OHFY-eCommerce(-UI)                                             | 4996                                                               |
| **S2 · Supplier Portal**           | OHFY-WMS `Supplier_SKU_Cross_Reference__c` + trigger svc        | 5139 → 5148 · 5161                                                 |
| **S3 · OMS-Allocation**            | OHFY-OMS allocation objects/batches                             | 4935 → (4936*)                                                     |
| **S4 · OMS-Delivery**              | OHFY-OMS `Delivery__c`/`Delivery_Stop__c` + route LWCs          | 5129                                                               |
| **S5 · Inventory (LOCK, serial)**  | OHFY-PLTFM `InventoryAdjustmentTriggerService` + `Inventory__c` | 5060 → 5067 → 5061 → 5063 → 5068 → 5484 → 5113†                    |
| **S6 · Warehouse (gated by 4245)** | OHFY-WMS picking/transfer objects; Data-Model flag              | **[4245]** → 5083 ∥ 5074 → 5070; 5160 → 5162 → 5158 → 5155 (5164*) |

\* needs decomposition first  · † 5113 also needs 5148  · ⚠ transfers touch S5's lock only for the *Item Transfer* adjustment — coordinate, not a hard merge.

## Stages — the wavefront (each row = concurrent, zero file overlap)

### Stage 0 — unblock & groom (Manager + you; not autonomous build) — runs alongside Stage 1
- [ ] Build **BMS-4245**, or get a PO ruling that its block on the warehouse cluster is stale. **Highest leverage — frees 5 epics.**
- [ ] Decompose **5164, 5124, 4936** into child stories via `/polish` refinement.

### Stage 1 — start now (5 concurrent, disjoint, no live blockers)
| Epic | Stream | Note |
|---|---|---|
| [BMS-5060](https://ohanafy.atlassian.net/browse/BMS-5060) Days of Inventory | S5 | In Progress; head of serial inventory queue; gates 5067 & 5113 |
| [BMS-4996](https://ohanafy.atlassian.net/browse/BMS-4996) Retailer Engagement Notifications | S1 | isolated eCommerce |
| [BMS-5139](https://ohanafy.atlassian.net/browse/BMS-5139) Supplier Portal — Payment Capture | S2 | base of supplier chain; gates 5148 |
| [BMS-4935](https://ohanafy.atlassian.net/browse/BMS-4935) Red Bull Allocation Import | S3 | OMS allocation; gates 5148 + 4936 |
| [BMS-5129](https://ohanafy.atlassian.net/browse/BMS-5129) Route Profitability | S4 | OMS delivery (disjoint objects from 4935) |

### Stage 2 — deps from Stage 1 cleared; 4245 still pending
| Epic | Stream | Unblocked by |
|---|---|---|
| [BMS-5067](https://ohanafy.atlassian.net/browse/BMS-5067) Practical Days on Hand | S5 | 5060 |
| [BMS-5148](https://ohanafy.atlassian.net/browse/BMS-5148) Supplier Portal — Order Recs | S2 | 5139 + 4935 |

### Stage 3 — first wave needing 4245 done
| Epic | Stream | Unblocked by |
|---|---|---|
| [BMS-5061](https://ohanafy.atlassian.net/browse/BMS-5061) Inventory Historical Snapshot | S5 | 5067 (lock slot) |
| [BMS-5083](https://ohanafy.atlassian.net/browse/BMS-5083) Pick Location Capacity ∥ [BMS-5074](https://ohanafy.atlassian.net/browse/BMS-5074) Crane SKU Flag | S6 | **4245** — disjoint from each other |
| [BMS-5161](https://ohanafy.atlassian.net/browse/BMS-5161) Supplier Freight Billbacks | S2 | portal |

### Stage 4
| Epic | Stream | Unblocked by |
|---|---|---|
| [BMS-5063](https://ohanafy.atlassian.net/browse/BMS-5063) Inventory Snapshotting | S5 | 5061 |
| [BMS-5160](https://ohanafy.atlassian.net/browse/BMS-5160) AL Transfer Cert → [BMS-5162](https://ohanafy.atlassian.net/browse/BMS-5162) Min Qty | S6 | 4245 + transfer base |
| [BMS-5070](https://ohanafy.atlassian.net/browse/BMS-5070) Shift-End Workflow | S6 | 5083 (∥ transfers if files disjoint) |

### Stage 5 — tail
| Epic | Stream | Unblocked by |
|---|---|---|
| [BMS-5068](https://ohanafy.atlassian.net/browse/BMS-5068) Safety Stock → [BMS-5484](https://ohanafy.atlassian.net/browse/BMS-5484) Loss-Prevention → [BMS-5113](https://ohanafy.atlassian.net/browse/BMS-5113) DOI-Std | S5 | DOI + 5148 (5113) |
| [BMS-5158](https://ohanafy.atlassian.net/browse/BMS-5158) Variance Gating → [BMS-5155](https://ohanafy.atlassian.net/browse/BMS-5155) DOT Scheduling | S6 | 5162 |
| [BMS-4936](https://ohanafy.atlassian.net/browse/BMS-4936) Launch Planning · [BMS-5124](https://ohanafy.atlassian.net/browse/BMS-5124) UKG · [BMS-5164](https://ohanafy.atlassian.net/browse/BMS-5164) FL Cert | decomp | only after Stage-0 grooming |

> [!note] Bottleneck
> S5 (Inventory) is a single serial queue (shared trigger handler) — the throughput limiter. Real max concurrency ≈ 4–5 epics/stage, capped by `execution.max_parallel`.

---

## Why the builds are backend *artifacts*, not UIs (yet)

> [!important] Intentional: backend-first, UI after direction
> Every build in this push delivered the **backend artifact** — data model + Apex + automation + config — and **deliberately stopped short of the user-facing UI**. Three reasons, in order of weight:
>
> 1. **The UI/UX approval gate (pipeline rule 5).** Any LWC / screen / FlexiPage / Experience-Cloud surface requires **your mockup sign-off before the real component is built** — even for low-risk work. None of these epics had an approved UI mockup, so building a screen would have violated the gate (and risked building the wrong thing).
> 2. **The builds ran headless (no org at build time).** A UI can't be designed, styled (`/ohfy-design`), or live-verified (Chrome DevTools / Playwright) without an org — so the UI layer wasn't safely buildable in that window. The backend is code-gradeable headless; the UI is not.
> 3. **Direction is the real bottleneck.** The whole initiative confirmed the constraint is *direction/refinement, not engineering*. Building a UI before you've given UX direction would just create rework.
>
> So each "artifact" is the safe, code-verified half. The UI half is **waiting on your direction + a mockup** (the `🎨 UI?` checkbox in [[manager-engineer.base]] flags which epics have a pending UI layer).

**Which epics have a UI layer still pending direction:**

| Epic | Backend artifact built | UI still needing your direction |
|---|---|---|
| **BMS-4935** Red Bull Allocation | configurable CSV importer (Apex, callable) | the **file-upload screen** — how a user picks/uploads the weekly file and sees validation errors / the split result |
| **BMS-5070** Shift-End | checklist objects + breakage-review service | the **shift-close checklist + pass-down screen** the warehouse manager actually uses |
| **BMS-4965** Short Pay | status/escalation/resolution backend on `Invoice__c`+`Credit__c` | the **AR review-queue screen** (today it's just a list view over `Short_Pay_Status__c`) |

**Not awaiting UI direction:** **BMS-5083** (its surface is *native* Salesforce Reports/Dashboards — config, not a custom UI) and **BMS-5068** (pure replenishment automation — no user screen).

**Next step to unblock a UI:** pick an epic, give UX direction, and the engineer runs `/mockup-ticket` → parks it `Awaiting-UI` → builds the real component **only after you approve the mockup**.
