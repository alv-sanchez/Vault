---
ticket: BMS-5902
title: "supplierAgreementTerms LWC — per-charge-type split editor"
epic: supplier-owed-recovery-program
lineage: BMS-5161
status: Awaiting-UI
polish_verdict:
executable: false
risk: Med
ui: needed
stream: S2-Supplier
track: stage-3-b
packages_touched: [OHFY-OMS-UI]
blocked_by: [supplier-owed-02-agreement-terms-coverage-cascade]
blocks: []
branch:
pr:
dod_met: false
updated: 2026-07-15
jira: https://ohanafy.atlassian.net/browse/BMS-5902
tags:
  - manager-engineer
  - ticket
---

# [DRAFT] supplierAgreementTerms LWC

> [!info] Status
> **Awaiting-UI (draft)** · polish — · risk Med · stream S2-Supplier · **UI needed**
> Agreement editor from mockup §1. OMS-UI. Depends #2. Parallel with #3 (disjoint packages). No Jira key yet.

## 🎨 UI/UX approval (ui: needed)
Build stops at the real-component step until approved. **Mockup already exists** — reference it, no new `/mockup-ticket` run required.
- Mockup: `Build-Overview/Sprint-9/BMS-5161-supplier-freight-cost-billbacks/supplier-owed-program/mockup.html` (§1 "Set the agreement once" — Riverbend Brewing FY26 Terms: per-charge-type coverage grid, scope chips, "supplier owes / distributor covers" columns, add-term row).
- [ ] **Approved by you** — note date + any change requests below
- Change requests: …

## Business justification
Child #2 gives the data model for per-charge-type splits, but a supplier agreement can now carry many term rows with optional state/brand scope — there is no way for a user to manage that without a screen. The mockup shows exactly what's needed: an agreement editor where you set each charge type's coverage percent, add scoped terms (e.g. State-Line Tax for AL), and see at a glance what the supplier owes vs what the distributor covers. This story builds that editor.

## Business impact
Makes the per-charge-type model **usable** — without it, terms can only be created via data loader. Delivers the PO's "great experience for the agreements" ask. The effective-coverage preview turns an opaque cascade into a visible, trustable answer ("Pallet Tax in AL → 100% via term X").

## Proposed logic
- LWC `supplierAgreementTerms` on the **Account (supplier) record page**: grid of the supplier's active agreements, expandable to their `Supplier_Agreement_Term__c` rows.
- Inline add / edit / clone of per-charge-type splits: charge-type picker, `Coverage_Percent__c` input with **0–100 validation**, optional state/brand scope pickers. "Distributor covers" column = 100 − coverage (mockup shows Freight 40/60, Pallet Tax 100/0, State-Line AL 100/0, others 50/50, Other Taxes 25/75).
- **Effective-coverage preview** — "Pallet Tax in AL resolves to → 100% via term X" — driven by the #2 resolver so the UI never re-implements the cascade.
- Controller `SupplierAgreementTermController` (all access via `QueryService`/`DmlService`, dynamic `AccessLevelResolver`, no explicit USER_MODE, no `ohfy__` prefix in Apex):
  ```apex
  @AuraEnabled(cacheable=true) static List<AgreementWithTermsDTO> getAgreements(Id supplierId)
  @AuraEnabled                 static void saveTerms(Id agreementId, List<TermDTO> terms)   // DmlService.doUpsert
  @AuraEnabled(cacheable=true) static CoveragePreviewDTO previewResolvedCoverage(Id supplierId, String chargeType, String state, Id brandId)
  ```
- DTOs in `DTOs/billback/`; `global` only if consumed cross-package.

## Acceptance criteria
- Given a supplier with active agreements, when the LWC loads on the Account page, then it shows each agreement expandable to its term rows with charge type, scope, coverage %, and distributor-covers %.
- Given a coverage input, when a user enters a value outside 0–100, then save is blocked with a validation message.
- Given a user adds a scoped term (e.g. State-Line Tax, AL, 100%), when they save, then a `Supplier_Agreement_Term__c` row is upserted via `DmlService` and the grid reflects it.
- Given a charge type + state + brand, when the user requests the preview, then it shows the resolved coverage and which term (or fallback) won — matching what the #2 resolver returns.
- Given a duplicate charge type + scope on the same agreement, when the user tries to save, then the UI surfaces the overlap (recommend: block; see epic Open Question / proposal OQ-4) — final behavior per PO decision.
- **User-perspective happy path:** Given a supplier manager on the Account page, when they set Freight to 40% and save, then the agreement shows Freight 40% / distributor 60% and downstream freight billbacks resolve to 40%.

## Implementation brief
- **Packages:** OHFY-OMS-UI (Tier 4). LWC + Apex controller only; reads the #2 data model + resolver.
- **Approach:** LWC with `data-testid` attributes for Jest/Playwright; `/ohfy-design` skill during build (Tailwind static resource `tailwindCSS_oms`). Controller delegates coverage preview to `S_SupplierFundingAgreement` (never re-implements the cascade). `saveTerms` upserts via `DmlService`.
- **Files expected to change:**
  - `OHFY-OMS-UI/.../lwc/supplierAgreementTerms/` (component + `__tests__/`)
  - `OHFY-OMS-UI/.../classes/controllers/SupplierAgreementTermController.cls` + `_T`
  - `OHFY-OMS-UI/.../classes/DTOs/billback/` (AgreementWithTermsDTO, TermDTO, CoveragePreviewDTO)
  - Account FlexiPage update (both `org-metadata/managed/` and `org-metadata/scratch/` — namespace-prefix rule)
- **Guardrails:** no `ohfy__` prefix in Apex; no raw SOQL/DML; dynamic AccessLevel default; `/ohfy-design` + `/playwright-tests`; Jest per component. Don't remove/rename released `@api` props (Hard Constraint 8) — net-new component, N/A on first build but relevant on later edits.

## Judgment calls
- **On the Account record page, not a net-new app/tab** — the agreement belongs to the supplier Account; the ASSUMPTIONS paper explicitly flagged "app vs Account" as undecided (A6) and the mockup renders it as a supplier-scoped card. Account page is the lower-risk default; app tab can follow.
- **Preview delegates to the #2 resolver** — re-implementing the cascade in JS would drift from the engine that actually creates lines. Single source of truth.
- **Overlap handling surfaced, not silently allowed** — the engine tiebreaks deterministically, but a user creating an accidental duplicate should be warned; final block-vs-warn is a PO call (proposal OQ-4).

## Definition of Done
- [ ] UI/UX approval checkbox signed (mockup referenced).
- [ ] LWC + controller built; `/ohfy-design` applied; Chrome DevTools live smoke.
- [ ] `npm run lint` · `npm test` (Jest) green; Playwright spec for the save flow (chromium).
- [ ] ≥90% Apex coverage on controller; `/polish` clean.
- [ ] Draft PR opened.

## Handoff (risk ≥ Med)
UI approval gate + a product decision embedded (overlap block-vs-warn). Human sign-off on the mockup fidelity and the overlap behavior before the real component is built.

## Build log (append-only)
- 2026-07-15 — Draft authored from proposal.md §5(a) + mockup.html §1 + ASSUMPTIONS A6. No Jira key yet.
