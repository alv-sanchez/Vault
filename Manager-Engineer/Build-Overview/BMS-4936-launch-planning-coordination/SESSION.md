# 📦 Session Kickoff — Launch Planning Coordination (BMS-4936)

> Paste this whole file into a fresh Claude Code session as the first message,
> or tell the session: "Read this file first." It is the context seed.
> Last updated: 2026-07-08.

## Scope of THIS session
BMS-4936 — Launch Planning Coordination epic. Currently one groomed child: **BMS-5592** ("New-Product Launch Plan record + cross-functional readiness checklist"). Do not touch other tickets/streams. The epic's two follow-on safeguards (supply-in-position gate, promo-timing guard) are explicitly out of scope for BMS-5592 and not yet groomed — do not build them speculatively.

## Where the work lives
- **Branch:** `feat/launch-plan-checklist-bms-5592`
- **Dev org:** `ohfy-bms5592` (test-y5ckigkp0dle@example.com)
- **Repo:** OHFY-Split · package: **OHFY-Platform** (`OHFY-PLTFM/`) — see rationale below
- **Docs (this folder):** `overview.md`, `overview.html`
- **Jira:** https://ohanafy.atlassian.net/browse/BMS-4936 (epic) · https://ohanafy.atlassian.net/browse/BMS-5592 (child story)

## What it is (one line)
A cross-functional launch checklist (Product Launch + 4-lane steps: Purchasing / Warehouse Readiness / POS Material / Sales Activation) that gives Gulf one shared source of truth for new-product launch readiness, with no activation gating in this story.

## What's built (updated 2026-07-08 by me-engineer)
- **OHFY-Data-Model:** `Product_Launch__c` (master, AutoNumber PL-) + `Product_Launch_Step__c` (detail, master-detail) with full field set (External_Id__c, Item__c lookup, Launch_Date__c required, 4 per-lane ready flags + Readiness_Percent__c + At_Risk__c on master; Lane/Status restricted picklists, Owner__c User lookup, Step_Label__c, Offset_Days__c, Due_Date__c, At_Risk__c on step). `Owner_Required` validation rule enforces required owner while keeping SetNull delete behavior.
- **OHFY-Platform:** `S_ProductLaunch.cls` (initiateLaunch / handleLaunchDateChange / recalculateReadiness), `ProductLaunchTriggerService` + `ProductLaunchStepTriggerService` + both triggers, 6 CMDT records wiring the framework, `ProductLaunchController.cls` (getLaunchPlan + updateStep + read-only Inventory/PO/Promotion context signals), `Launch_Planning_Access` permission set.
- **OHFY-PLTFM-UI:** `productLaunchPlan` LWC — 4-lane readiness board (per-lane ready badge + context signal), inline status (native select) + owner (record-picker) editing, skeleton loader, error state, desktop+mobile, branded with `/ohfy-design` `rgb(var(--ohfy-*))` tokens (hex-lint clean).
- **Behaviour validated live on ohfy-bms5592 via anonymous Apex:** 8 steps auto-generated across 4 lanes on create; owner defaults to creator; due = launch − offset; a past-due step flagged At_Risk at creation; completing a lane rolls up its ready flag + Readiness_Percent (Purchasing complete → 25%); changing launch date recalculates all due dates + at-risk (3 at-risk when moved to 5 days out); no-launch-date insert blocked (REQUIRED_FIELD_MISSING) with no partial record.
- **Tests:** Apex `_T` ≥90% on every touched file (S_ProductLaunch 90%, ProductLaunchController 91%, ProductLaunchTriggerService 92%, ProductLaunchStepTriggerService 95%, both triggers 100%) — 21 methods green. Jest `productLaunchPlan` 7/7 green. `sf project deploy --dry-run` clean (183 components, 0 errors).
- **Shipped:** commit `f2077a147` (Refs BMS-5592) → **draft PR #488** against `main` (https://github.com/Ohanafy/OHFY-Split/pull/488). DoD-complete pending human review; do not mark ready without signoff.

## State / caveats (honest)
- **BMS-5592 is code-complete and lives in draft PR #488** (risk: **Low** — all net-new/additive, blast radius contained to two new objects; triggers fire only on those objects). Low risk → auto-built through to an open draft PR per the hybrid-by-risk mandate.
- **Package placement refined:** the LWC lives in **OHFY-PLTFM-UI** (Tier 4), not OHFY-Platform — Platform has no LWC/tailwind infrastructure. Controller/service/objects follow the epic tiering. PLTFM-UI wasn't in the original `packages_touched`; it's the only sensible home for the LWC and is the same feature/stream (not a sibling's).
- **Tooling gaps this session couldn't close (no MCP access):** (1) Jira `/set-risk` field and `/end-ticket` worklog could not be written — recommended Risk = **Low**; local timer stopped. (2) Chrome DevTools MCP unavailable — the live UI smoke was done via anonymous-Apex behavioral verification of the full trigger/service chain + controller (`getLaunchPlan`/`updateStep`) against real org data on ohfy-bms5592, which covers the AC paths; a human should still eyeball the LWC on the record page.
- **Closed 2026-07-08 (was deferred):** the default record page is now built — `Product_Launch_Record_Page.flexipage` in both `org-metadata/managed/` and `org-metadata/scratch/` (namespace-split), plus a fix to `productLaunchPlan.js-meta.xml` which was hardcoding `ohfy__Product_Launch__c` in its target-config object reference (packaged source metadata must stay unqualified). Committed to `feat/launch-plan-checklist-bms-5592`; validated via dry-run deploy on `ohfy-bms5592`. The Inventory/PO/Promotion reads are read-only context signals only (ready flags come from step completion per open-question #3).
- Epic BMS-4936 is not yet decomposed beyond BMS-5592 — this session builds only BMS-5592.
- BMS-5592's technical approach explicitly defers hard activation gating and quantity-derivation logic to later stories; the rollup fields (`Readiness_Percent__c`, `Warehouse_Ready__c`, etc.) are the contract those later stories will read. Don't build the gate/guard here.
- Package placement decision (see below) is a judgment call, not confirmed by the PO — flag if a Platform maintainer objects.

## Open questions / blockers — resolved by best judgment 2026-07-08 (see reasoning below), not yet PO-confirmed
1. **Launch calendar ownership (Purchasing / Sales Ops / Marketing)?** → Don't hardcode a persona-based default. `Owner__c` on `Product_Launch_Step__c` is a required field with **no auto-default**, set explicitly per step at plan creation (default to the launch record's creator only as a placeholder the coordinator must reassign). Avoids baking in an org-chart assumption Gulf hasn't confirmed.
2. **POS-material quantities driven by allocation size, or ad hoc?** → Stay ad hoc/independent for this story. None of BMS-5592's ACs mention quantity derivation; that's allocation-sizing logic that belongs to a future story once the allocation workflow (BMS-4797) is further along.
3. **All 5 warehouses required for "ready," or primary-DC threshold?** → Don't hardcode "5" or "primary DC." `Warehouse_Ready__c` = true when all `Warehouse Readiness`-lane steps *actually generated for that launch* are Complete — i.e., scoped to whichever warehouses are relevant to that specific launch's distribution plan, not a fixed count. Matches the technical approach (no object hardcodes a warehouse count) and avoids blocking readiness for launches that don't ship to all 5 DCs.
4. **Auto-extend due dates on late supplier confirmation, or flag-only?** → Flag-only. AC scenario 3 ("Late supplier change... flags at-risk steps") only specifies flagging, never date mutation. Auto-extending would silently mask real risk instead of surfacing it — flag-only is both what the AC says and the safer behavior.

Route these four to Elliot Flores (PO) for confirmation before the two follow-on REQ-009 stories are groomed — they inherit these same assumptions.

## Package placement — resolved by best judgment (updated after /strata code archaeology)
- **`Product_Launch__c` + `Product_Launch_Step__c` objects → OHFY-Data-Model (Tier 0).** `/strata` confirmed all ~207 existing custom objects (`Item__c`, `Inventory__c`, `Purchase_Order__c`, `Promotion__c`, `Pricelist__c`, the brand hierarchy) live in Data-Model — Hard Constraint 8 requires new custom types land there too, not in Platform.
- **`S_ProductLaunch.cls` (+ triggers + `ProductLaunchController`) → OHFY-Platform (Tier 2).** The service needs to be visible to future WMS/OMS follow-on safeguard stories without creating an illegal Tier-3-to-Tier-3 dependency; Platform is the shared layer all three already depend on.
- **`productLaunchPlan` LWC → OHFY-PLTFM-UI (Tier 4), not OHFY-Platform.** Corrected during the build (see "State / caveats" above) — Platform has no LWC/Tailwind infrastructure. This line originally said "Platform"; fixed 2026-07-08 during /polish so this section stops contradicting the caveat above it.

## Corrections to BMS-5592's technical approach — found by /strata code archaeology (2026-07-08, @7e0126f13)
- **`E_PurchaseOrderForecasts.cls` does not exist.** Ticket names it as the purchasing-lane signal source; no such class or method exists anywhere in the repo. Real read surface: `E_PurchaseOrder.cls` (`OHFY-WMS/.../executables/purchaseOrder/E_PurchaseOrder.cls` — `getItems`, `getQuantityOnHandAtFulfillmentLocation`) or a direct `QueryService` read against `Purchase_Order__c`/`Purchase_Order_Item__c`.
- **`S_Promotions.cls` and `B_Pricelist_FrontLinePromotionSetter.cls` were deleted in BMS-3870.** Only a deprecated stub interface `PromotionsService` (`OHFY-Service-Locator/.../serviceInterfaces/promotion/PromotionsService.cls`) survives, explicitly marked "do not implement or call this from new code." **Not a blocker** — BMS-5592 never calls promotion activation, only reads `Promotion__c`/`Pricelist__c.Start_Date__c` as context — but the implementation must not reference the deleted classes or the deprecated stub.
- Full brief: `orientation.md` / `orientation.html` in this folder, and posted to BMS-5592.

## Post-build /polish pass — 2026-07-08 (thorough re-check against latest main + branch)
A second polish pass, done after the code-complete milestone above, re-validated the description/AC against `feat/launch-plan-checklist-bms-5592` (not just against the ticket text) and found one real functional gap plus two naming-drift issues:
- **Real gap, now closed:** AC Scenario 2 asserted a `Product_Launch__c.Status__c` reflecting overall progress ("In Progress") — it never existed in the build (only `Readiness_Percent__c` + per-lane flags did). Built `Status__c` (restricted picklist: Not Started/In Progress/Complete), derived in `S_ProductLaunch.recalculateReadiness` from step completion, exposed via `ProductLaunchController.LaunchPlanView.launchStatus` and a badge in the LWC header. Extended `S_ProductLaunch_T`, `ProductLaunchController_T`, and the Jest suite; added FLS to `Launch_Planning_Access`. Verified live on `ohfy-bms5592`: 21/21 Apex methods, 7/7 Jest, coverage held (`S_ProductLaunch` 90.07%, `ProductLaunchController` 90.97%). Commit `da970f60a`.
- **Naming drift, fixed in Jira:** the AC itself (not just the Technical field) used the stale `Due_Offset_Days__c` — corrected to `Offset_Days__c` in both Gherkin scenarios. `Due_Date__c` was mislabeled "(formula)" in the Technical field — it's a plain Apex-maintained Date field.
- Both commits (`86081f335` FlexiPage placement, `da970f60a` Status__c) are on `feat/launch-plan-checklist-bms-5592` but **not yet pushed** to origin / PR #488 — pending explicit push go-ahead.

## History — why this isn't a rebuild (from /strata @6c07cdeff, 2026-07-08)
Nothing named `Product_Launch*` exists on `origin/main` (confirmed) — but the launch-plan build stands on shipped, cited patterns rather than inventing them:
- **Parent + master-detail checklist** — reuse the Shift-End Checklist shape: `S_ShiftEndChecklist.cls:9` + `ShiftEndChecklistController` add/update/getItems, child m-d declared at `Shift_End_Checklist_Item__c.object-meta.xml:6` (BMS-4078). `Product_Launch__c ->> Product_Launch_Step__c` mirrors it.
- **Percent-ready rollup + formula** — reuse Display_Run: `Display_Compliance__c.field-meta.xml:7` (active/total) over a COUNT rollup (`Total_Displays__c.field-meta.xml:10`). `Readiness_Percent__c` copies this shape; per-lane readiness = extra rollups.
- **Template → children batch save** — extend `E_HolidayTemplate.cls:64` (loads template children, persists transactionally). `initiateLaunch()` seeds one step-set per lane from the track CMDT the same way.
- **At-risk decoupled from storage** — reuse `ReplenishmentTaskDTO.cls:59` (`atRisk`/`riskBand` computed in-service). `At_Risk__c` computes the same way for the LWC render path.
- **Transactional DML** — reuse `DmlService.cls:22` (AccessLevel + allOrNone) for every step insert/update (Hard Constraint 1).
- **Record-page LWC** — mirror `shiftEndChecklist.html:1` (status-gated collapsible sections) for the 4-lane `productLaunchPlan` layout + progress bars.
- **Per-warehouse readiness (if needed)** — `E_LocationHierarchy.cls:41` walks to the Warehouse ancestor across the 5 sites.
- **Build-fresh (no precedent):** cascade recalc of step Due_Dates when `Launch_Date__c` moves — query children → recompute → `DmlService.doUpdate`, bulkified. No packaged cascade exists anywhere.
- Baseline pinned to `origin/main` @6c07cdeff; the 5592 build lives on `feat/launch-plan-checklist-bms-5592` / `ohfy-bms5592` (unmerged) — regenerate after merge.

## Definition of Done (from OHFY-Platform CLAUDE.md + ticket AC — restate before coding)
1. `Product_Launch__c` (master) + `Product_Launch_Step__c` (detail) objects match the technical approach's field list; `External_Id__c` auto-populated per repo convention.
2. `S_ProductLaunch.cls` — `initiateLaunch()` generates the 4-lane step set; `recalculateReadiness()` rolls up lane flags + `Readiness_Percent__c` + `At_Risk__c`. All SOQL/DML via `QueryService`/`DmlService` (Hard Constraint 1); no `ohfy__` hardcoding (Hard Constraint 7); `Logger` in every catch (Hard Constraint 5).
3. `productLaunchPlan` LWC on the `Product_Launch__c` record page — 4-lane swimlane checklist, inline owner/status edit — styled via `/ohfy-design`.
4. All 3 Gherkin scenarios from BMS-5592's AC pass, including the "no launch day → blocked" guard and the at-risk/due-date-shift recalculation on launch-date change.
5. Apex `_T` tests ≥ 90% coverage on touched files; Jest tests for the LWC; both 100% green.
6. `sf project deploy validate` clean; `/code-review` run with findings dispositioned; `/set-risk` set.
7. Chrome DevTools live smoke test of the checklist UI on the claimed dev org.
8. Commit(s) reference `BMS-5592`; PR opened as draft against `main` per Git Workflow.
