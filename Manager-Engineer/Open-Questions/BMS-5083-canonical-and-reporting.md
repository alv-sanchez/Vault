---
ticket: BMS-5083
relates: [BMS-4463, BMS-3785, BMS-4465, BMS-4466, BMS-4467]
question: "Pick Location Capacity — which epic is canonical (5083 vs 4463)? reporting native vs custom LWC? 3785 doc drift?"
status: Partially-answered      # decisions locked; closing 4463 awaits Elliot (PO)
decided_by: Alvaro Sanchez (+ SME research, code-grounded)
method: SF solution-architecture SME + OHFY-Split main code evidence + owner input
po: Elliot Flores
po_account_id: "712020:7649b437-ff00-46df-a878-10ad1dfc5d56"
jira_comment_url: https://ohanafy.atlassian.net/browse/BMS-5083?focusedCommentId=54833
raised: 2026-06-29
updated: 2026-06-29
tags:
  - manager-engineer
  - open-question
  - refinement-agenda
---

# BMS-5083 — Canonical Epic + Reporting (resolution)

> [!success] Decision
> **Keep BMS-5083 canonical**; flag **BMS-4463 to Elliot for close-as-duplicate** (done — mentioned on 4463). Reporting = **native Salesforce Reports/Dashboards + a packaged custom report type**, no custom LWC. Min default capacity % = **warehouse-specific**. Fix BMS-3785's doc-only noun drift.

## Decisions

| # | Question | Decision | Status |
|---|---|---|---|
| Q1 | Canonical epic (5083 vs 4463) | **5083 canonical.** 5083 has all 4 children (3785 Done, 4465, 4466, 4467); 4463 has **zero**. Flagged 4463 to Elliot Flores (PO, reporter of 4463) to close as duplicate + port the requirement link/labels. | 🟠 awaiting Elliot |
| Q2 | Reporting native vs custom LWC | **Native Reports/Dashboards + packaged custom report type** on `Pick_Location_Assignment__c`. No LWC. | ✅ confirmed |
| Q3 | Min default capacity % | **Warehouse-specific** (not uniform 25%). | ✅ confirmed |
| Q4 | 3785 doc drift | Fix doc-only fake nouns (table below). | ✅ confirmed |

### AI-assumed vs confirmed (for refinement review)
- **AI-proposed, owner-confirmed:** native reporting (no LWC); warehouse-specific %; flag 4463 to Elliot rather than auto-close.
- **Code-verified facts:** 4463 has 0 children while 5083 holds the work + the Done build (3785); the drift nouns (`Product__c`, `Quantity_Needed__c`, `Replenishment_Request__c`, "velocity tier") don't exist on main.
- **Open for ratification:** Elliot's confirm to actually close 4463.

## How we reached the conclusion (evidence)
- **Q1:** verified in Jira — children 3785/4465/4466/4467 all parent to **5083**; **4463 has zero children**. 4463 is the structured *requirement* epic (Requirement `a3ePX000000Qv89YAC`, "WAREHOUSE LAYOUT/STRUCTURING", `req-156`/`wave:1`, reporter Josh Kraszeski); 5083 is the `sf-tracker` epic with the scope + assignment. → 5083 canonical; close 4463 as dup after porting the requirement link/labels. (Different reporter → PO ownership call → flagged to Elliot.)
- **Q2:** the repo **already ships custom report types** (`OHFY-WMS/.../reportTypes`, `OHFY-Data-Model/.../reportTypes`) → a report type on `Pick_Location_Assignment__c` + a reference dashboard **ship in the 2GP package and upgrade centrally**; customer report instances / dashboard filters / folders are per-org config (drifts, no central patch). Compliance reporting (over-capacity %, override rate by reason, reclassification counts) is aggregate/filter/group → native covers it; LWC = cost with no payoff. Build in 4467: 1 packaged report type + 2-3 reports + 1 reference dashboard; 4466 spike = metric/field list mapped to the real schema.
- **Q3:** warehouse-specific min default → needs a small **per-warehouse min-default config** (a field on `Location__c` or a CMDT keyed by warehouse code) that feeds the compliance thresholds; not a single uniform constant.
- **Q4 — 3785 noun corrections (doc-only; 3785 is Done):**

| AC/Tech says | Real on main |
|---|---|
| `Product__c` | `Item__c` |
| `Quantity_Needed__c` | `Quantity__c` (on `Replenishment_Task__c`) |
| `Replenishment_Request__c` | `Replenishment_Task__c` |
| "velocity tier" (no field) | `Priority__c` / `Replenishment_Rank__c` |

(`Inventory__c` reference is fine — it exists.) Instruction for 4466/4467: report only off the real schema — `Pick_Location_Assignment__c` joined to `Item__c` + `Replenishment_Task__c`.

## Still open
- **Elliot (PO):** confirm closing BMS-4463 as duplicate (mentioned on 4463, comment #54837).
- **Gulf/product:** the warehouse-specific min-default % values themselves (per-warehouse numbers).

---
<sub>Resolved 2026-06-29 (owner + code-grounded SME). 4463 close awaits Elliot. Posted to BMS-5083 (#54833 area) + flag on BMS-4463 (#54837).</sub>
