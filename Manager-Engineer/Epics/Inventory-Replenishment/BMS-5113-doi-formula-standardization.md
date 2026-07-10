---
epic: BMS-5113
release_phase: walk
title: "[REQ-186] DOI Formula Standardization"
domain: "Purchase & Supply Planning / Inventory (Gulf)"
user: "Purchasing/buyers · supply planning (Pete) · warehouse planning (Chandler/Josh) · finance"
impact: "One SKU reads as overstocked to one team and critically low to another because DOI is computed inconsistently across departments"
status: To Do
audit_verdict: Slice          # Build-Now | Slice | Not-Yet | Blocked | Not-Decomposed
score: 3
stream: S5-Inventory
phase: walk
do_not_do: false
do_not_do_reason:
executable_children: [BMS-3742]
blockers: [jira-access-unavailable, dedicated-org-not-claimed]
build_order: [BMS-3822, BMS-3742, BMS-4543, BMS-4544, BMS-4545]
updated: 2026-07-10
jira: https://ohanafy.atlassian.net/browse/BMS-5113
tags:
  - manager-engineer
  - epic
---

# BMS-5113 — [REQ-186] DOI Formula Standardization

> [!summary] Verdict (2026-07-10 audit, code-grounded)
> **Slice** · score 3 · stream S5-Inventory. The epic's outcome — *one authoritative DOI calculation, computed once and read everywhere* — is **already ~70% shipped in `main`** by sibling work (BMS-3779, BMS-3822, BMS-3816). Of the five children, **BMS-3822 is already merged (PR #96)**; the reporting layer (report type + perm set) already ships; the one genuine remaining build is **BMS-3742** — reconcile the shipped DOI formula to the authoritative spike definition (**completed-invoiced-quantity** source + **30/60/90** window tracking). 4543/4544/4545 are downstream and partly pre-delivered.
> **Pipeline could not dispatch engineers this run** — see 🚫 Blockers below (no Jira access, no dedicated org). Everything here is code-grounded; nothing was fabricated.

## 🚫 Blockers this run (why no PRs opened)
| Blocker | Effect | Unblock |
|---|---|---|
| **Atlassian MCP not loaded** (`mcp__claude_ai_Atlassian__*` = "No such tool available"; no `acli`/`jira` CLI) | Could not read exact AC/description/status of BMS-3742/4543/4544/4545, could not run `start-ticket`/`end-ticket` (both transition Jira), could not post PO comments or tag `@Elliot Flores`. All findings below are from **codebase + the BMS-3817 spike doc**, not the live tickets. | Load the Atlassian MCP for this session, then re-run. |
| **Dedicated org `bms-5113-doi` never appeared** (`sf org list` — not present across the whole run; no `claim-dev` process in `ps`) | No org to `validate`/`deploy`/smoke-test against → me-engineer cannot reach Definition-of-Done (deploy + Chrome smoke + CI green). Org-pool-only rule forbids me claiming a second org. | Re-run `bash utilityScripts/claim-dev.sh bms-5113-doi` from the repo root and confirm it lands in `sf org list` before dispatch. |

> Dispatching me-engineer into a no-Jira / no-org state would produce untested code against unknown AC and fabricate DoD — not done. Held. See [[2026-07-10-BMS-5113-polish-dispatch]].

## What already ships in `main` (the epic is mostly built)
- **`S_InventoryDOI.calculate()`** (OHFY-WMS, BMS-3779, PR #350 merged) — the single authoritative DOI service: `DOI = Quantity_On_Hand__c / average daily depletion`, calendar-day window, bulk threshold resolution, `Below Min / In Range / Above Max / No Velocity` classification. Nightly `B_InventoryDOI` batch stamps `Inventory__c.Current_DOI__c` / `DOI_Status__c` / `Average_Daily_Depletion__c`. This IS "compute once, read everywhere."
- **`Inventory_Threshold__c` + `S_InventoryThresholds` resolver** (BMS-3822, PR #96 merged) — Min/Target/Max_DOH baseline at warehouse grain + `SKU_Override__c` overlay, precedence resolved bulk. This is the BMS-3822 deliverable — **done**.
- **`Days_of_Inventory.reportType`** (OHFY-WMS) + **`Days_Of_Inventory_Report_Access`** perm set (BMS-3779/3816) — a custom report type over the stamped DOI fields already ships. Covers most of the "Reporting Build" (4545) intent.
- **Target-vs-actual variance** (`Target_DOH_Variance__c`, `Target_Variance_Status__c`, BMS-3816, PR #481 merged).

## The one real gap → BMS-3742 (the authoritative source of the epic)
The shipped formula diverges from the **BMS-3817 spike** (Leah Schneidereit, 2026-04-28 — the "Leah/Gulf team" WIP the epic comment referenced; docs-only branch `refactor/3817-doi-doh-spike`, unmerged) on two points:
1. **Sales-rate source.** Spike §4.2 mandates **completed invoiced quantity** at the location grain — explicitly to avoid OOS/AR-repeat false-demand distortion. Shipped `S_InventoryDOI` derives depletion from **day-over-day decreases in `Inventory_History__c.Quantity_On_Hand__c`** — an on-hand-drop proxy that also counts transfers-out/shrink/adjustments as "demand" (the BMS-3779 interim: *"no velocity engine exists yet"*). **BMS-3742 is precisely the ticket that replaces the proxy with the canonical invoiced-qty source.**
2. **Lookback windows.** Spike §4.2: track **30, 60, and 90** days. Shipped: a **single** configurable window (`DOI_Velocity_Window_Days`, default 30), one `Current_DOI__c`.

See [[BMS-3742-doi-formula-standardization]] for the ticket note + polish findings.

## Audit
- **Children (5):** BMS-3822 (done/merged), **BMS-3742 (the remaining build — executable pending Jira AC + org)**, BMS-4543 (Design/Prototype/Demo — UI, human-gated), BMS-4544 (Reporting Spike), BMS-4545 (Reporting Build — partly pre-delivered). BMS-4542 is Done (informational, not worked).
- **Cross-epic gating:** the shared Build-Order (2026-06-26) sequences 5113 at the tail of S5 behind 5060 (Days of Inventory) and 5148. Note that BMS-3779's merge means the DOI *foundation* 5060 was to deliver is already in `main` — the nominal gate may be stale; confirm before treating 5060 as a hard blocker.
- **Shared substrate / overlap:** ⚠ soft. `S_InventoryDOI` **reads** invoices + stamps DOI metric fields on `Inventory__c`; it does **not** mutate inventory quantities and does **not** touch `InventoryAdjustmentTriggerService` — so it is **not** a hard INV-LOCK conflict with 5068/5060/5484, but coordinate on `Inventory__c` field additions.

## Executable children — live (auto-updates from ticket notes)
```base
filters:
  and:
    - file.inFolder("Manager-Engineer/Tickets")
    - epic == "BMS-5113"
formulas:
  open: file.asLink(file.name)
views:
  - type: table
    name: Children
    order:
      - status
      - ticket
    columnSize:
      formula.open: 280
      status: 120
      polish_verdict: 110
      risk: 60
      ui: 70
```

## Not-yet-executable / already-delivered children
| Ticket | Disposition | Reason |
|---|---|---|
| BMS-3822 — Inventory Threshold baseline object + resolver | **Already delivered** | `Inventory_Threshold__c` + `S_InventoryThresholds` merged to `main` via PR #96. Nothing to build. |
| BMS-4543 — Design/Prototype/Demo | **Not autonomously executable** | UI-facing (DOI surface in PO Forecasting per spike §4.3/§5.1). `ui: needed` → hard human-approval gate. Depends on BMS-3742's standardized value. Needs UI direction from PO. |
| BMS-4544 — Reporting Spike | **Spike, not a build** | Output is a doc, not a PR. Largely answerable from the shipped `Days_of_Inventory.reportType` + the BMS-3817 spike; recommend descoping to a gap analysis vs the existing report type. |
| BMS-4545 — Reporting Build | **Partly pre-delivered** | Custom report type + perm set already ship. Remaining scope = 30/60/90 variance + historical-threshold reporting, which **depends on BMS-3742's new fields**. Sequence last. |

## Within-epic build order (dependency-safe; `/work-epic` forms PR groups)
1. **BMS-3822** — ✅ done (merged). No action.
2. **BMS-3742** — core standardization: switch sales-rate source to completed invoiced quantity; add 30/60/90 tracking. Tier 0 (new `Inventory__c` fields) + Tier 3 (OHFY-WMS `S_InventoryDOI`). **The unblocker — every downstream child reads its output.**
3. **BMS-4543** — Design/Prototype/Demo of the standardized DOI surface (UI, human-gated) — after 3742.
4. **BMS-4544** — Reporting gap-analysis spike — after 3742 (needs the standardized fields to scope).
5. **BMS-4545** — Reporting build (30/60/90 variance + threshold history) — after 4544.

## Decisions made this run (logged — see Open-Questions/)
Per the operator's instruction to close open questions with best judgment and log them. These are logged locally; they **could not be posted to Jira / tagged to PO** this run (no Jira access).
- **[[BMS-5113-doi-doh-vocabulary]]** — Keep both DOI + DOH terms (do not collapse to one). Shipped model already splits them coherently (DOH = threshold config, DOI = computed actual); collapsing would rename frozen managed fields.
- **[[BMS-5113-sales-rate-source]]** — Adopt the spike's **completed-invoiced-quantity** source as BMS-3742's core scope, replacing the on-hand-decrease proxy.
- **[[BMS-5113-lookback-windows]]** — Track 30/60/90 in BMS-3742 (additive fields), sequence the source-switch first.

## Open questions for PO
- Feedback doc: [[BMS-5113-feedback]] — aggregates the three decisions above for a plain-language PO sign-off. (Awaiting the ability to publish to Jira/Notion.)

## Run history
- 2026-07-10 — Code-grounded polish-epic (no Jira access). Found the epic ~70% shipped; BMS-3822 done; BMS-3742 is the real remaining build (invoiced-qty source + 30/60/90). Made + logged 3 product decisions. **Held engineer dispatch** — no Jira MCP, no dedicated org. See [[2026-07-10-BMS-5113-polish-dispatch]].
</content>
</invoke>
