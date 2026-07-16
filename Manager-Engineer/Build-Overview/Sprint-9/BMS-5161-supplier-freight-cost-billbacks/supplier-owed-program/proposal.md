# Design Proposal — Supplier-Owed Recovery Program

**Evolves:** BMS-5161 (Supplier Freight Cost Billbacks)
**Status:** PROPOSAL — not a build. No code changes accompany this document.
**Author:** Solution Architecture · 2026-07-15
**Verified against:** `OHFY-Split-integration-5161` repo (branch source under `OHFY-Data-Model/` and `OHFY-OMS/`)

---

## 1. Problem Statement

BMS-5161 shipped a working but deliberately narrow recovery pipeline: **freight only, one flat percentage per agreement**.

What exists today (all verified in source):

- `Supplier_Funding_Agreement__c` carries a single `Coverage_Default__c` percent, plus `Supplier__c`, `Brand__c`, `State__c`, `Floor_Price__c`, `Start_Date__c` / `End_Date__c`, `Is_Active__c`.
- `Billback__c` is the recovery ledger header: `Account__c` (Lookup → Account), `Type__c` (picklist: Billback, Rebate, Sample, Incentive, Generic, Co-op, MDF, **Freight**), `Status__c` (Accrued / Invoiced / Collected / Written_Off), `Coverage_Percent__c`, `Has_Related_Claim__c`, and `Total_Recoverable_Amount__c` — a **native Roll-Up Summary** of `Billback_Line__c.Recoverable_Amount__c` (possible because `Billback_Line__c.Billback__c` is Master-Detail).
- `Billback_Line__c` already points at three source types via Lookups: `Transfer_Group__c`, `Purchase_Order__c`, `Inventory_Adjustment__c`, `Invoice_Item__c`, carrying `Amount__c`, `Coverage_Percent__c`, `Recoverable_Amount__c`.
- The calc engines `S_FreightBillbackCalculation` / `S_POFreightBillbackCalculation` (OHFY-OMS, `classes/services/billback/`) resolve coverage via a cascade owned by `S_SupplierFundingAgreement`: agreement `Coverage_Default__c` (brand-specific beats supplier-wide, deterministic tiebreak) → `Account.Funding_Default_Coverage__c` → capped at 100%.

**The gap** the product owner has named:

1. **One number covers everything.** A supplier who fronts 100% of pallet tax and the Alabama state-line tax but only 50% of freight cannot be modeled — `Coverage_Default__c` is a single flat percent applied to freight cost only.
2. **Freight is the only charge captured.** Taxes and receipt fees are visible on their source records (`Transfer_Group__c.Total_Transfer_Tax__c`, `Purchase_Order__c.Sales_Tax__c`, `Inventory_Receipt_Fee__c`) but never flow into the recovery ledger.
3. **Inventory Receipts are not a source.** `Inventory_Receipt__c` exists (with `Total_Fees__c`, `Sales_Tax__c`, `Supplier__c`, and child `Inventory_Receipt_Fee__c` rows) but `Billback_Line__c` has no lookup to it.
4. **No supplier-level "what do they owe me" answer.** Totals exist per billback, not per supplier across all open recovery, itemized by charge type. The PO's words: *"a place to go and SEE what a supplier will owe you… CALCULATED rather than manually input."*

---

## 2. Charge-Type Model

Add one dimension — **`Charge_Type__c` (picklist) on `Billback_Line__c`** — and reuse the existing Billback ledger unchanged. No new billback object.

Proposed values, refined from the *actual* charge taxonomy found in source:

| Value | Real-world source it maps to (verified) |
| --- | --- |
| `Freight` | `Transfer_Group__c.Freight_Cost__c`, `Purchase_Order__c.Recoverable_Freight_Cost__c`, `Inventory_Receipt_Fee__c.Cost_Type__c` = Freight / Shipping / Fuel Surcharge |
| `Pallet Tax` | `Inventory_Receipt_Fee__c.Cost_Type__c = 'Pallet'` |
| `State-Line Tax` | Cross-state transfers: `Transfer_Group__c.Is_Cross_State__c` + `Total_Transfer_Tax__c` / `Transfer_Group_Adjustment__c.Tax__c` |
| `Other Tax` | `Purchase_Order__c.Sales_Tax__c`, `Inventory_Receipt__c.Sales_Tax__c`, residual transfer tax |
| `Receipt Fee` | `Inventory_Receipt_Fee__c` rows whose `Cost_Type__c` is not freight-like (Express Processing, Interest, Misc. Charge, Service, Storage) |

**Why reuse the ledger:** `Billback__c` already has the exact lifecycle needed (Accrued → Invoiced → Collected / Written_Off), the claim-linkage flag (`Has_Related_Claim__c`), and the M-D rollup to a header total. A second "Supplier Recovery" object would duplicate all of that plus its invoicing integration for zero modeling gain. The dimension belongs on the **line**, where amounts live; `Billback__c.Type__c = 'Freight'` generalizes to a broader value (see §6).

Also proposed on `Billback_Line__c`: an `Inventory_Receipt_Fee__c` Lookup (line-level provenance — one billback line per fee row) and optionally `Inventory_Receipt__c`, matching the existing per-source Lookup pattern.

---

## 3. Per-Charge-Type Coverage: `Supplier_Agreement_Term__c`

A new **child config object** so one agreement carries many splits:

**`Supplier_Agreement_Term__c`** (Tier 0, OHFY-Data-Model)

| Field | Type | Notes |
| --- | --- | --- |
| `Supplier_Funding_Agreement__c` | Master-Detail | terms die with the agreement; agreement dates/active flag gate all terms |
| `Charge_Type__c` | Picklist | same value set as `Billback_Line__c.Charge_Type__c` (global value set to keep them synced) |
| `Coverage_Percent__c` | Percent (0–100) | **0 is meaningful** = "supplier owes nothing for this type" — suppresses the billback line |
| `State__c` | Picklist, optional | narrows the term (e.g. State-Line Tax @ 100% only for AL) |
| `Brand__c` | Lookup, optional | mirrors the existing agreement brand scoping |
| `Is_Active__c`, `External_Id__c` | | repo standard |

`Supplier_Funding_Agreement__c.Coverage_Default__c` **stays** and remains the fallback — zero migration for existing freight agreements.

**Resolved coverage cascade** (extends the existing `S_SupplierFundingAgreement` "most-specific wins" logic rather than replacing it):

```
1. Agreement term matching Charge_Type + State + Brand      (most specific)
2. Agreement term matching Charge_Type + (State OR Brand)
3. Agreement term matching Charge_Type only
4. Supplier_Funding_Agreement__c.Coverage_Default__c        (today's behavior)
5. Account.Funding_Default_Coverage__c                      (today's behavior)
→ cap at 100%. Explicit 0% at any term level → NO billback line created.
   Null all the way down → no billback line (unchanged from today).
```

Ties within a specificity level break deterministically (highest Id), matching the documented convention already in `S_SupplierFundingAgreement`.

This directly models the PO's example: term (Pallet Tax, 100%) + term (State-Line Tax, AL, 100%) + term (Other Tax, 50%) + `Coverage_Default__c = 50%` for everything else. "Split 50/50 or any percent, per charge type" = arbitrary decimal percent per term row.

---

## 4. The Calculated Supplier-Owed Rollup

**Three-level aggregation, two mechanisms:**

| Level | Mechanism | Why |
| --- | --- | --- |
| Line → Billback | **Native Roll-Up Summary** (already shipped: `Total_Recoverable_Amount__c`) | `Billback_Line__c.Billback__c` is Master-Detail — free, transactional, zero Apex |
| Billback → Supplier | **Apex-calculated** (aggregate `SUM(Total_Recoverable_Amount__c) GROUP BY Charge_Type` via `QueryService`) | `Billback__c.Account__c` is a **Lookup**, not M-D — no native RUS possible. Deliberate: converting to M-D would cascade-delete billbacks with accounts and is a released-field immutability risk (Hard Constraint 8) |

The supplier-owed view is therefore **computed on read** by a controller method, not persisted:

- Scope: `Billback__c.Account__c = :supplierId AND Status__c IN ('Accrued','Invoiced')` (open recovery; Collected and Written_Off excluded — "what they *will* owe you").
- Itemization: aggregate over `Billback_Line__c` grouped by `Charge_Type__c`, showing per-type subtotal + count of source documents, with drill-down to lines and their source records (transfer / PO / receipt / receipt fee).
- Grand total: sum of the per-type buckets. Because everything is derived from `Recoverable_Amount__c` on lines that the detection batches created, the number is **calculated, never manually keyed** — the PO's core ask.
- Detection: extend the existing batch pattern (`B_FreightBillbackDetection`, `B_POFreightBillbackDetection`) with a receipt-scanning sibling (working name `B_ReceiptBillbackDetection`) that walks `Inventory_Receipt_Fee__c` rows for suppliers with active agreements and emits typed billback lines. Idempotency follows the shipped pattern (source-record flag / existing-line check).

If a *persisted* per-supplier total is later required (reporting, list views), add it as a nightly-batch-maintained field — explicitly out of scope here.

---

## 5. LWC Experiences (OHFY-OMS-UI, Tier 4)

Both follow repo conventions: all data access through `QueryService`/`DmlService` in the Apex controller, dynamic `AccessLevelResolver` default (no explicit USER_MODE, no uncommented SYSTEM_MODE), **no hardcoded `ohfy__` prefix anywhere in Apex**, `data-testid` attributes for Jest/Playwright, `/ohfy-design` skill during build.

### (a) `supplierAgreementTerms` — agreement management, on the Account (supplier) record page

Grid of the supplier's active agreements, expandable to their term rows; inline add/edit/clone of per-charge-type splits with percent validation (0–100), state/brand scoping pickers, and an effective-coverage preview ("Pallet Tax in AL resolves to → 100% via term X").

Controller `SupplierAgreementTermController`:

```apex
@AuraEnabled(cacheable=true)
static List<AgreementWithTermsDTO> getAgreements(Id supplierId)

@AuraEnabled
static void saveTerms(Id agreementId, List<TermDTO> terms)   // DmlService.doUpsert

@AuraEnabled(cacheable=true)
static CoveragePreviewDTO previewResolvedCoverage(Id supplierId, String chargeType, String state, Id brandId)
```

### (b) `supplierOwedDashboard` — "What This Supplier Owes", on the Account record page (and optionally an app tab with a supplier selector)

Header grand total; per-charge-type breakdown (amount, line count, % of total); status filter (Accrued / Invoiced); drill-down table of billback lines with source-document links (transfer group, PO, inventory receipt). Read-only — the ledger is system-calculated.

Controller `SupplierOwedRollupController`:

```apex
@AuraEnabled(cacheable=true)
static SupplierOwedSummaryDTO getSupplierOwedSummary(Id supplierId, List<String> statuses)

@AuraEnabled(cacheable=true)
static List<BillbackLineDetailDTO> getLineDetail(Id supplierId, String chargeType, List<String> statuses)
```

DTOs live in `DTOs/billback/` per the repo layout; `global` only if consumed cross-package, else package-local.

---

## 6. The Existing Freight Path Folds In

Freight becomes **just one `Charge_Type__c` value**, not a special case:

- `S_FreightBillbackCalculation` / `S_POFreightBillbackCalculation` stamp `Charge_Type__c = 'Freight'` on the lines they already create; their coverage resolution swaps its direct `Coverage_Default__c` read (line ~200 of `S_FreightBillbackCalculation`) for the new term-aware resolver in `S_SupplierFundingAgreement` — which, absent any term rows, returns exactly today's answer. **Behavioral no-op for every existing customer.**
- `Billback__c.Type__c = 'Freight'` records remain valid; new multi-type billbacks use a broader header type (proposed picklist addition: `Supplier Recovery`) with the type detail on lines. Picklist value *additions* are 2GP-safe.
- Backfill: a one-time script (orgScripts/) stamps `Charge_Type__c = 'Freight'` on existing lines so the rollup dashboard is complete on day one.
- Hard Constraint 4 applies: any released `@namespaceAccessible` signatures in the freight services get new overloads with charge-type awareness; old signatures become shims.

---

## 7. Delta Table — Net-New vs Reused

| Artifact | Status |
| --- | --- |
| `Billback__c` + lifecycle + `Total_Recoverable_Amount__c` RUS | **Reused** as-is |
| `Billback_Line__c` + source lookups + `Recoverable_Amount__c` | **Reused**; + `Charge_Type__c`, + `Inventory_Receipt_Fee__c` (and optionally `Inventory_Receipt__c`) lookups |
| `Supplier_Funding_Agreement__c` (`Coverage_Default__c` as fallback) | **Reused** as-is |
| `Supplier_Agreement_Term__c` (M-D child, per-type splits) | **Net-new** (Tier 0) |
| Global value set for Charge Type | **Net-new** (Tier 0) |
| Coverage cascade (`S_SupplierFundingAgreement`) | **Extended** — term-aware resolution layered on the existing most-specific-wins logic |
| Freight calc engines + detection batches (`S_/B_FreightBillbackDetection`, `S_/B_POFreightBillbackDetection`) | **Reused/extended** — stamp charge type, delegate coverage |
| Receipt detection batch (`B_ReceiptBillbackDetection`) | **Net-new** (OHFY-OMS) |
| Supplier-owed aggregate service + DTOs | **Net-new** (OHFY-OMS) |
| `supplierAgreementTerms` LWC + controller | **Net-new** (OHFY-OMS-UI) |
| `supplierOwedDashboard` LWC + controller | **Net-new** (OHFY-OMS-UI) |
| `Billback__c.Type__c` value `Supplier Recovery` | **Net-new picklist value** (additive, 2GP-safe) |
| `Account.Funding_Default_Coverage__c` fallback | **Reused** as-is |

---

## 8. Open Questions / Risks

1. **Double recovery vs claims.** `Billback__c.Has_Related_Claim__c` exists but nothing structurally prevents the same freight/tax dollars being recovered via both a billback and a supplier claim. Does the rollup exclude claim-linked billbacks, flag them, or net them? PO decision needed.
2. **Tax data provenance.** Transfer tax is split across `Transfer_Group__c.Total_Transfer_Tax__c` and per-row `Transfer_Group_Adjustment__c.Tax__c` (Currency, not itemized by tax kind). Distinguishing *pallet* tax from *state-line* tax from *other* today is only reliable on the receipt side (`Inventory_Receipt_Fee__c.Cost_Type__c`). Transfers may need either an adjustment-level type field or an accepted "State-Line if `Is_Cross_State__c`, else Other Tax" heuristic — confirm which.
3. **Floor price interaction.** `Floor_Price__c` and coverage live on the same agreement and share resolution code (`S_SupplierFundingAgreement` serves both the pricing floor and billback coverage). Adding per-type terms must not perturb floor resolution — terms carry coverage only, never floor. Regression tests on `S_PriceResolver.applyFloorMakeWhole` callers required.
4. **Overlapping terms.** Two active terms with the same charge type/scope for one supplier: the deterministic tiebreak prevents nondeterminism, but should the UI *block* creating the overlap instead? (Recommended: validation in `saveTerms`.)
5. **Fee taxonomy drift.** `Inventory_Receipt_Fee__c.Cost_Type__c` (9 values) maps N:1 onto the 5 proposed charge types; the mapping should live in a CMDT (same package as the engine, per Hard Constraint 8) rather than hardcoded, so customers can re-bucket.
6. **Status scope of "owed."** Proposal counts Accrued + Invoiced as open. Confirm whether Invoiced belongs in "will owe" or should be a separate band on the dashboard.
7. **Volume.** Read-time aggregation across a big supplier's history: aggregate SOQL over `Billback_Line__c` is fine at expected volumes, but confirm row-count expectations before committing to no persisted rollup.

---

## 9. ASSUMPTIONS (paper trail — every assumption made)

1. **This is a proposal, not a build.** No metadata, Apex, or LWC changes are made or implied to exist.
2. **Reuse `Billback__c` / `Billback_Line__c`** as the single recovery ledger; no new billback-like object. Header lifecycle and RUS are inherited.
3. **`Charge_Type__c` is a picklist dimension on `Billback_Line__c`**, backed by a global value set shared with the agreement term object.
4. **A child config object (`Supplier_Agreement_Term__c`, M-D to the agreement)** is the right home for per-type splits; `Coverage_Default__c` remains the fallback and existing data needs no migration.
5. **"Split 50/50, or any percent, per charge type" means arbitrary configurable decimal percentages (0–100) per term row** — not a fixed menu of split ratios.
6. **Inventory Receipts are the third source**, entering via `Inventory_Receipt_Fee__c` rows (verified to exist: `Inventory_Receipt__c`, `Inventory_Receipt_Fee__c` with `Cost_Type__c`, `Amount__c`, `Total__c`); also verified but assumed out of scope as sources: `Receipt__c`, `Lot_Inventory_Receipt_Item__c`.
7. **Supplier-level total is computed on read (Apex aggregate), not persisted** — because `Billback__c.Account__c` is a Lookup, native roll-up to Account is impossible, and converting it to Master-Detail is rejected (cascade-delete semantics + released-field immutability).
8. **"Open/accrued" scope = Status Accrued + Invoiced**, excluding Collected and Written_Off (flagged as open question 6).
9. **Explicit 0% coverage suppresses billback line creation** (consistent with the shipped engine's null-coverage behavior).
10. **State-line tax on transfers is inferred from `Is_Cross_State__c`** absent an itemized tax-type field (flagged as open question 2).
11. **New LWCs live in OHFY-OMS-UI** (billback domain is OMS); term object and value set live in OHFY-Data-Model (Tier 0), services in OHFY-OMS — per the repo's tier rules.
12. **Picklist additions to released fields are packaging-safe; no released field attributes or method signatures are changed in place** (shims/overloads where signatures must grow).
13. The PO's phrase "include the fees for visibility, show all the lines, roll up the fee" is interpreted as: every fee becomes an itemized `Billback_Line__c` visible in the dashboard drill-down, aggregated by charge type up to a supplier grand total.
