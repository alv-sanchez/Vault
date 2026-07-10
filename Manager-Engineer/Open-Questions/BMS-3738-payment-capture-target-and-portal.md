---
ticket: BMS-3738
epic: BMS-5139
question: "Where does a supplier's captured payment method live, and is there a supplier portal to capture it in? (Target object, entity association, and portal surface are all undefined.)"
status: Open            # Open | Answered
po: Thomas Spangler
jira_comment_url:
raised: 2026-06-28
answered:
tags:
  - manager-engineer
  - open-question
---

# Open Question — BMS-3738

> [!question] The question
> Where should a supplier's captured payment method be stored, and what UI captures it? The ticket says "supplier portal: payment method capture" via the "Ohanafy Payments module," but the repo has no supplier portal and no supplier-keyed payment-method field. We need the target object + the capture surface defined (the BMS-4126 architecture spike is meant to decide this and is still in Backlog).

## The issue
The ticket has no Acceptance Criteria — only a story statement and Gulf context — so the build target is inferred, not specified. Grounding the claims against OHFY-Split @ main (`f1baa32e`):

- **No supplier portal exists.** The only Experience site in the repo is `E_Commerce1` (`org-metadata/experience-site/digitalExperiences/site/E_Commerce1`). There is no supplier-facing community/LWR site to host a "payment method capture" screen.
- **No Supplier object.** "Supplier" is an `Account` lookup — `Supplier_SKU_Cross_Reference__c.Supplier__c` has `<referenceTo>Account</referenceTo>` (`OHFY-Data-Model/.../Supplier_SKU_Cross_Reference__c/fields/Supplier__c.field-meta.xml`). The cross-reference object itself carries no payment fields (only External_Id, Is_Active, Item, Supplier, Supplier_SKU, Supplier_SKU_Key, Notes).
- **Payment infrastructure is Account-centric, not supplier-portal-centric.** `Payment__c` exists with `Account__c`, `Bank_Account__c`, `Entity__c`, GL keys (`OHFY-Data-Model/.../objects/Payment__c/fields/`). `Payment_Method__c` exists on **Account** with an `Ohanafy_Payments_Validation` rule. So "Ohanafy Payments module" = Account + Payment__c back-office, with no supplier-portal entry point.
- **Multi-entity (FL/AL) is modeled** — `Payment__c.Entity__c` → `Entity__c`. The ticket's "associate payment method with specific Gulf entity" is feasible against this, but only once the capture object is chosen.

## The solution being attempted
Capturing a verified supplier payment method so Gulf can auto-disburse billbacks/co-op/promo credits. The build cannot start until we know (a) the storage object/field, (b) the capture UI surface, and (c) entity association — all of which the related spike **BMS-4126 (Backlog)** is chartered to decide.

## Options (with the recommendation first)
1. **[Recommended]** Hold BMS-3738 until BMS-4126 (portal architecture & shared data model) lands; have that spike define: target object (extend `Account` / new `Supplier_Payment_Method__c` / reuse `Payment__c`), the capture surface (new supplier Experience site vs. internal record page), and entity binding. Then re-refine with real AC. — Costs a cycle but avoids building against a guessed model on platform-wide financial objects.
2. Scope to back-office only now: add a supplier payment-method field/validation on `Account` (no portal), defer the portal UI. — Unblocks a thin slice, but contradicts the "supplier portal" intent and may be reworked when the spike decides differently.
3. Build a net-new supplier Experience site + payment LWC now. — Highest risk; no portal substrate exists, no AC, high blast radius on Payment__c/Account; not advisable pre-spike.

## Resolution
_(filled when answered)_ — decision + who decided + date.
