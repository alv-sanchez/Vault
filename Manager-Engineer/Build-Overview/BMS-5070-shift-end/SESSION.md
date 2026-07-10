# 🌙 Session Kickoff — Shift-End Workflow (BMS-4078)

> Paste this whole file into a fresh Claude Code session as the first message,
> or tell the session: "Read this file first." It is the entire context seed.

## Scope of THIS session
Only BMS-4078 (epic BMS-5070). Do not touch Red Bull, Short Pay, or any other ticket.

## Where the work lives
- **Branch:** `feat/shift-end-workflow-bms-4078` (pushed; origin now includes UI fixes `831525e`, `e3b0aed`)
- **Repo:** `/Users/alvarosanchez_1/OHFY-Split` on that branch (use its own worktree)
- **Dev org:** `ohfy-val-4078`
- **Demo path:** open the `shiftEndChecklist` LWC → **Warehouse 1 · Day · Jun 30** → Initiate/Load
  - 4 checklist items, 4 breakage events (named pickers Marcus Lee / Dana Cruz / Sam Ortiz), 2 pass-downs.
- **Docs (this folder):** `overview.html`, `shift-end-overview.html`, `shift-end-explained.html`, `diagram.excalidraw.md`, `seed-data.apex`

## Code
- LWC `OHFY-WMS-UI/.../lwc/shiftEndChecklist/{html,js}` — fixed: dropdown clipping (`tw-overflow-visible`), breakage rows read `ohfy__`-prefixed fields (`ohfy__Breakage_Quantity__c`, `ohfy__Reason__c`, `ohfy__Timestamp__c`), `_reasonLabel()` maps DAMAGED→"Damaged", `_pickerName()` reads `ohfy__Picker__r.Name`, `shiftSelectOptions` de-dupes to distinct Day/Mid/Night.
- `OHFY-WMS/.../services/shiftEnd/S_BreakageReview.cls` — `getDamagedEvents` SELECTs `Picker__r.Name`; `signOff(Set<Id>)` sets `Breakage_Reviewed__c=true` + reviewer + timestamp, idempotent, does NOT modify quantity/reason.

## What "Sign off" does
Marks the listed breakage events reviewed (reviewed flag + reviewer + timestamp). It records that a human checked them — it does not change the breakage numbers.

## State / known gaps (keep honest in demo)
- `Total_Breakage_Cases__c = 0` — the rollup is a **future phase (BMS-4080)**, not built here.
- Warehouse 1 is configured for Day/Night only (no Mid).
- There may be a leftover empty "Warehouse 1 / Night" checklist in the org — safe to delete.

## Likely next work
- Tests; `/code-review` → `/end-ticket` → PR when Low-risk.
- (Future) breakage rollup BMS-4080.

## Build decisions & assumptions (Ph2 BMS-4079 / Ph3 BMS-4080)

Session date: 2026-07-06. Branch `feat/shift-end-ph2-ph3-bms-4079` in worktree
`/Users/alvarosanchez_1/OHFY-Split-BMS-5070`, cut from Ph1 tip `4ab8f443`.

### Stacking assumption (⚠️ carry forward)
- **A0 — This stacks on PR #431, which is mergeable + CI-green but NOT yet formally
  approved** (`reviewDecision = REVIEW_REQUIRED`). If Ph1 gets change requests in review,
  this Ph2/Ph3 work absorbs them (rebase + re-fix). Do not treat Ph1 as frozen.

### Ph2 — BMS-4079 · Cycle Counts & (priority-)categorized Pass-Down Notes

- **A1 — Pass-down categorization already shipped in Ph1** (`Shift_Pass_Down__c.Category__c`
  restricted picklist Safety/Equipment/Replenishment/Other + `addPassDown`). Ph2's "actionable,
  priority-categorized context" is read as **adding a priority dimension** on top of the
  existing category. Built as a new restricted picklist `Priority__c` (High/Medium/Low,
  default Medium) on `Shift_Pass_Down__c`, threaded through `addPassDown` →
  `getPassDowns` → LWC. *Assumed*, not confirmed with PO — priority values are a judgment call.
- **A2 — Pass-down ordering** is now Flagged-for-next-shift DESC → Priority (High→Low) →
  CreatedDate ASC, so the incoming shift sees flagged + high-priority turnover first. Priority
  sort is done in Apex `getPassDowns` via an explicit High/Medium/Low ORDER-BY-safe map (the
  picklist is not alphabetically sortable to that intent), not relying on picklist API order.
- **A3 — Cycle-count verification model.** `Inventory_Log_Group__c` (owned by OHFY-PLTFM,
  the type itself is Tier-0 Data-Model so referencing it from OHFY-WMS is dependency-legal)
  is the cycle-count record. Ph1 already staged the optional `Inventory_Log_Group__c.Shift_End_Checklist__c`
  lookup and the `Shift_End_Checklist__c.Cycle_Count_Groups__c` count field. Ph2 ties existing
  cycle-count groups to a checklist and verifies them:
  - **A3a — Match key = `Is_Cycle_Count__c = true` AND `Log_Date__c = checklist.Shift_Date__c`
    AND `Location__c` resolves to the checklist's warehouse.** `Inventory_Log_Group__c.Location__c`
    is the count-target Location (set by `InventoryCountController` to whatever Location the count
    was run against — could be the warehouse Location or a child). I match by resolving each
    group's `Location__r.Warehouse__c` (Text formula → warehouse Name) against the checklist
    warehouse's own `Warehouse__c` Name — the same warehouse-Name scoping pattern
    `S_BreakageReview.getDamagedEvents` uses. *Assumed*: cycle counts are attributed to a shift
    by **warehouse + calendar date**, NOT by shift-name, because `Inventory_Log_Group__c` has no
    shift field and `Log_Date__c` is date-grain. Consequence: on a multi-shift day, a cycle count
    is claimed by the FIRST shift checklist that runs verification for that date (tie-in is
    idempotent — already-linked groups are not re-linked to another shift). Flagged as an Open
    Question for PO (multi-shift-per-day cycle-count attribution).
  - **A3b — Verification is non-destructive.** Verifying links the group to the checklist
    (sets the lookup if null) and reports each group's approval state (`Is_Approved__c`,
    `Was_Recounted__c`). It does NOT approve, recount, or mutate counts — approval remains the
    Inventory Count workflow's job (mirrors how breakage sign-off never mutates the quantity).
  - **A3c — `Cycle_Count_Groups__c`** is refreshed to the count of groups now tied to the
    checklist, on every verify and on submit. It is a convenience summary, not a rollup field.
- **A4 — Checklist `Item_Type__c` already includes `Cycle Count`** (Ph1 picklist). No item-type
  change needed; the cycle-count section is a distinct verified-groups panel, and supervisors may
  still add a manual "Cycle Count" checklist item for narrative.

### Ph3 — BMS-4080 · Submission & Finance Reporting

- **A5 — Breakage roll-up source & grain.** `Shift_End_Checklist__c.Total_Breakage_Cases__c`
  is populated on submit from `Pick_Performance_Summary__c.Total_Breakage__c` (the per-picker/day
  breakage aggregate — the load-bearing source of truth, unchanged). Because PPS has **no
  warehouse**, shift attribution uses `Picker_Shift_Presence__c` (Picker + Warehouse + Shift_Date):
  sum `Total_Breakage__c` across PPS rows whose `Picker__c` was **present** at this checklist's
  warehouse on `Shift_Date__c` and whose PPS `Date__c` = `Shift_Date__c`.
  - **A5a — *Assumed*: attribution is warehouse+date, not shift-name** — same limitation as A3a,
    because `Picker_Shift_Presence__c` has no shift-name field (Ph1 keyed presence by warehouse+date
    only). On a multi-shift day this over-attributes: each shift checklist for that date rolls up the
    SAME day breakage total for that warehouse. Flagged as an Open Question for PO ($$-adjacent:
    shrinkage GL attribution). Built now with warehouse+date; the rollup service takes shift as a
    param so a future shift-name presence field is a drop-in.
  - **A5b — Fallback when no presence rows exist.** If `Picker_Shift_Presence__c` has no rows for
    the warehouse+date (presence never captured), the rollup falls back to breakage on the
    DAMAGED `Pick_Event__c` set for that warehouse+date (reusing `S_BreakageReview.getDamagedEvents`
    scoping) so finance is never silently handed zero. *Assumed.*
- **A6 — Submit gating.** Ph1 `submit` had no gating (deferred to Ph3). Ph3 adds a **soft**
  gate: submit is blocked only if there are **unreviewed DAMAGED breakage events** for the shift
  (finance cannot post shrinkage a human never checked). Incomplete checklist items and
  un-verified cycle counts do NOT block submit (they are operational, not financial) — instead the
  rollup records what exists. *Assumed* the review-before-submit gate; escalated as an Open
  Question only if PO wants a hard all-items-complete gate.
- **A7 — Idempotent + recomputable submit.** Re-submitting (or submitting an already-Submitted
  checklist) recomputes `Total_Breakage_Cases__c` and `Cycle_Count_Groups__c` and re-stamps
  submitter/timestamp — safe to re-run, mirroring the idempotent style of the rest of the stack.
  Status stays `Submitted` (the `Approved` transition is out of scope; no ticket claims it).
- **A8 — Finance report surface = a Custom Report Type**, not a `.report`. The repo ships
  `reportType` metadata (e.g. `Days_of_Inventory.reportType-meta.xml`) but no `.report`/report
  folders (those live in the org, not the managed package). Ph3 ships
  `Shift_End_Shrinkage.reportType-meta.xml` on base object `Shift_End_Checklist__c` exposing
  warehouse, shift, date, Total Breakage Cases, Cycle Count Groups, status, submitted by/at — the
  finance-facing shift-attributed shrinkage surface for GL posting + variance. Finance builds the
  actual report/dashboard from this type in-org.

### Open questions for PO (not decided — escalate)
- **Q1 (A3a/A5a, $$-adjacent) — Multi-shift-per-day attribution.** Cycle-count groups
  (`Inventory_Log_Group__c`) and picker presence (`Picker_Shift_Presence__c`) are both keyed by
  warehouse + **calendar date**, with no shift-name dimension. On a warehouse that runs >1 shift
  in a day, both cycle-count tie-in and the breakage/shrinkage rollup attribute to the date, not
  the specific shift — so the Night checklist can re-roll the same day's breakage the Day checklist
  already reported. This directly affects **shrinkage GL attribution per shift**. Decision needed:
  add a shift-name field to presence + a shift window to cycle-count attribution, or accept
  day-grain shrinkage. Built day-grain now (services are shift-param-ready).
- **Q2 (A6) — Submit gate strictness.** Currently soft-gated (only unreviewed breakage blocks
  submit). Confirm finance is OK submitting with incomplete checklist items / unverified cycle
  counts, or require a hard "all items complete" gate.
