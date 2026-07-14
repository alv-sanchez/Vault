---
ticket: BMS-5592
epic: BMS-4936
status: open — needs PO input (Elliot Flores) + engineering follow-through before merge
updated: 2026-07-09
---

# Closing Questions — BMS-5592 Launch Plan

Questions raised after the initial build, during manual dry-run / demo walkthrough. None of these block the current PR (#488) — they're follow-ups for the PO before the two REQ-009 safeguard stories (supply-in-position gate, promo-timing guard) get groomed, since those stories will inherit these same assumptions.

## Next steps (engineering — before this can actually merge)

Since PR #488 was flipped to ready-for-review, a second, unreviewed round of work landed on the branch: ad-hoc task create/delete, one-per-row collapsible lane layout, and the offset-days display. None of it has test coverage or a code-review pass yet.

1. **Commit the uncommitted work.** Currently sitting locally in the worktree, not yet committed: `ProductLaunchController.cls` (`createStep`, `deleteStep`, `offsetDays` on `StepView`), `productLaunchPlan.js`/`.html` (collapsible one-per-row layout, "+ New Task", "Delete", offset display), and the two new FlexiPage files (`org-metadata/scratch/` + `org-metadata/managed/flexipages/Product_Launch_Record_Page.flexipage`) plus the LWC namespace-prefix fix — reference BMS-5592 in the commit(s).
2. **Add missing test coverage.** No Apex `_T` tests exist yet for `createStep` or `deleteStep`; no Jest tests exist for the add-task form, delete button, or lane collapse/expand. Required before this can pass the ≥90%-coverage DoD bar — coverage will have dropped below 90% on `ProductLaunchController.cls` with the new untested methods added.
3. **Fix the real (pre-existing) Prettier-blocking bug.** `Product_Launch_Step__c/fields/Step_Label__c.field-meta.xml` has an unescaped `&` in its description ("Confirm supplier & initial PO") — invalid XML, fails `npm run prettier:verify` in CI. Needs `&amp;`. This predates this session's work (from the original build) but still blocks merge.
4. **Confirm the Playwright E2E failures are unrelated, not introduced by us.** The two failing specs (`pick-assignment-board.spec.ts`, `pick-path.spec.ts`, both WMS/BMS-4100/BMS-4341) have nothing to do with Product Launch — likely pre-existing flakiness on `main`, surfaced only because CI didn't run while the PR was draft. Verify against `main` before assuming it's safe to ignore.
5. **Re-run `/code-review` and full `sf project deploy validate`** once 1–4 are done — the last full CI run and review predate all of this session's new capability.
6. **Decide whether to revert PR #488 to draft** until 1–5 are complete, since it's currently sitting ready-for-review with unreviewed, untested functionality on top of what was actually reviewed.
7. **Refresh the stale docs** — `SESSION.md`, `overview.md`, and `data-model.html` in this folder all describe the pre-this-session state (no ad-hoc task CRUD, no collapsible layout, no offset-days display, no seeded PO/Promotion data). Update before calling documentation current.

## New open questions from this session (not yet logged with the PO)

**5. No formal sign-off exists at any level.** A step is "done" only because whoever holds its `Owner__c` flips their own status dropdown — self-attested, no review. There's no launch-level approval action either (no `Approved_By__c`, no approval process) — the coordinator can only watch the readiness % and status badge, not formally sign off a launch as a go. The two planned follow-on gate stories are described as automated (reading these fields), not a human-approval step — so as scoped, nobody's plan currently includes a sign-off moment at all.

**6. No per-owner task view or notification.** There's no Tab, List View, or notification for `Product_Launch_Step__c` — an owner can only see/complete their task by being told which specific `Product_Launch__c` record to open and finding their step inside the embedded board. No "my open tasks across launches" view exists.

**7. Sign-off/lane-ownership rules aren't configurable.** The step template (lanes, labels, offsets) is a hardcoded Apex list (`S_ProductLaunch.TEMPLATE`), not a Custom Metadata Type — unlike other Ohanafy features (`Trigger_Configuration__mdt`, `Picking_Configuration__c`) that let admins tune behavior without a deploy. If different launch types eventually need different sign-off rules or lane structures, that's a real scope expansion (a new approval-tracking layer), not a small tweak.

## 1. Context signals are item-scoped only — no warehouse/supplier/promotion filtering

None of the three read-only context lines (Warehouse Readiness, Purchasing, Sales Activation) filter by anything more specific than `Item__c`:

- **Warehouse Readiness** — `Inventory__c WHERE Item__c = :itemId`, no `Location__c` filter. Counts *any* distinct location with stock for this item, across all of Gulf's warehouses. Doesn't check whether it's the *right* DC for this launch's distribution plan, and doesn't enforce the "all 5 warehouses vs. primary-DC threshold" question already logged (see SESSION.md open question #3) — there's no threshold at all right now, just a raw count.
- **Purchasing** — `Purchase_Order_Item__c WHERE Item__c = :itemId AND Outstanding_Case_Quantity__c > 0`, no `Supplier__c` filter. Any open PO for this item counts, regardless of supplier — a PO with the wrong/backup supplier would still show as "open," same as the intended one.
- **Sales Activation** — `Promotion__c WHERE Item__c = :itemId`, no filter on promotion type, price list, or active/scheduled status. Any promotion tied to the item counts, including stale/inactive ones.

**Open question:** should these signals be scoped tighter (specific supplier, specific warehouse set, active/scheduled promotions only), or is item-level "does anything exist" the intended bar for a purely informational signal? Right now a stale record can make a lane look more ready than it actually is.

## 2. POS Material has no context signal at all

Purchasing, Warehouse Readiness, and Sales Activation each show a live data line above their steps. POS Material shows nothing — no query was wired for it (no clear "POS material" object/source existed to pull from). It's not a bug, just an acknowledged gap from the original build.

**Open question:** is there a POS/marketing-materials object this should pull from, or is POS Material meant to stay purely checklist-driven with no external signal?

## 3. No per-lane access boundary

`Launch_Planning_Access` is a single flat permission set granting full CRUD on `Product_Launch__c` and `Product_Launch_Step__c`. It doesn't scope by lane — anyone holding it can edit any lane's steps, not just their own team's (e.g. a warehouse person could mark a Sales Activation step Complete).

**Open question:** is a single shared permission set acceptable for launch (fast to administer, but no guard rails), or should each lane be restricted to its owning team?

## 4. Carried over from initial build (SESSION.md / Jira comments) — still unconfirmed

1. Launch calendar ownership (Purchasing / Sales Ops / Marketing) — resolved by engineering judgment: no persona default, `Owner__c` required, set explicitly per step.
2. POS-material quantities driven by allocation size, or ad hoc — resolved: stays ad hoc, out of AC scope.
3. All 5 warehouses required for "ready," or primary-DC threshold — resolved: neither hardcoded; scoped to whichever warehouses a launch's steps actually cover (though see #1 above — the *context signal* doesn't even do that scoping; only the step-completion-driven `Warehouse_Ready__c` flag does).
4. Auto-extend due dates on late supplier confirmation, or flag-only — resolved: flag-only, matches AC wording.

All four routed to Elliot Flores (PO) for confirmation before REQ-009's two follow-on stories are groomed.

## Demo records created on `ohfy-bms5592`

For manual dry-run / visual testing. Not real data — created via anonymous Apex to exercise specific states.

| Record | Item | Launch Date | Status | Readiness | At Risk | Why it exists |
|---|---|---|---|---|---|---|
| `PL-00000003` | Wave Splitter: 1/6 BBL | 2026-07-13 | In Progress | 13% | true | Original dry-run record; one Purchasing step marked Complete. |
| `PL-00000007` | Boats Float: 1/2 BBL | 2026-09-22 (+75d) | Not Started | 0% | **false** | Launch date far enough out that nothing is overdue yet — the "healthy, untouched" baseline case. |
| `PL-00000008` | Boats Float: 1/4 BBL | 2026-07-19 (+10d) | Not Started | 0% | **true** | Launch date close enough that most steps are already past-due at creation — heavy at-risk case. |
| `PL-00000009` | Boats Float: 1/6 BBL | 2026-08-08 (+30d) | Not Started | 0% | true | **Sales Activation lane manually deleted** after creation to simulate a "missing lane" state — not reachable through normal use (`initiateLaunch` always generates all 4 lanes/8 steps; see below). |
| `PL-00000010` | Boats Float: Case (4x6 - 120z - Can) | 2026-09-07 (+60d) | **Complete** | **100%** | false | Every step marked Complete — the fully-done end state. |

**Note on `PL-00000009`:** there is no supported way to create a launch missing a lane — `S_ProductLaunch.initiateLaunch` unconditionally inserts all 8 steps across all 4 lanes on every insert. This record's Sales Activation steps were deleted directly via Apex purely to show what the UI looks like if a lane ever ends up empty (e.g. future manual step deletion) — not a state a coordinator can produce through the LWC.

## Hardcoded / ephemeral values — demo-only, not part of the shipped feature

Everything below exists **only** on `ohfy-bms5592` for this session's dry-run and is **not** in the deployed package, not referenced by any Apex/LWC that ships, and not something to carry into a real install. None of it needs cleanup before merge (it's not part of the diff), but it shouldn't be mistaken for real behavior or real data if this org is reused later.

- **The 5 demo `Product_Launch__c` records** (`PL-00000003`, `007`, `008`, `009`, `010`) and their steps — created via one-off anonymous Apex to exercise specific states (healthy / at-risk / missing-lane / fully-complete). See the table above.
- **Hardcoded Item/Account Ids in the seed scripts** — e.g. `a1DEi000005fUtjMAE` (Wave Splitter: 1/6 BBL), `001Ei00002EaQ31IAF` (a pre-existing "Supplier Account 0" sample Account). These Ids are specific to `ohfy-bms5592`'s data and will differ in any other org — never hardcoded anywhere in shipped code, only in throwaway `.apex` scripts run via `sf apex run`.
- **The seeded `Purchase_Order__c` + `Purchase_Order_Item__c` + `Promotion__c` records** for Wave Splitter: 1/6 BBL — created purely so the Purchasing/Sales Activation context-signal queries had something real to return (150 cases outstanding, 1 promotion starting 7/29/26) instead of showing "No open purchase orders" / "No promotions scheduled" in every screenshot.
- **`Legacy_Security_Bypass` permission set assigned to the demo user** (`test-y5ckigkp0dle@example.com`) — this was required to get the seeded `Purchase_Order_Item__c` insert to succeed (a pre-existing WMS trigger needs SYSTEM_MODE-level access this demo user didn't have by default). It's the documented install-runbook permission set, so assigning it isn't wrong, but it was done here purely to unblock seeding — not a statement about what a real launch coordinator's persona should have.
- **The "Platform Integration User" assigned as owner** on the ad-hoc "Confirm dock slot with 3PL" demo task — an arbitrary pick from the owner-picker dropdown to prove the field wires correctly, not a meaningful assignment.
- **All of the above only exist because of manual anonymous-Apex scripts** run from `/private/tmp/.../scratchpad/*.apex` this session — they're not migrations, not seed data shipped with the package, and running `deploy:full` against a fresh org will not recreate any of it.
