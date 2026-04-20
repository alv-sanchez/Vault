---
ticket: BMS-4049
title: "Cart & Checkout with Gulf Pricing — Spike: Architecture Discovery"
type: "Story (Spike)"
parent_epic: "BMS-3702 — Gulf E-Commerce & Ordering"
relates_to: "BMS-3928 — Cart & checkout with Gulf pricing integration"
status: "Backlog"
sprint: "Sprint 1"
repo_scanned: "/Users/alvarosanchez_1/Documents/OHFY-Ecom/force-app"
polished_on: 2026-04-17
polished_by: Alvaro Sanchez
jira: https://ohanafy.atlassian.net/browse/BMS-4049
tags: [polish, ecom, gulf, cart, checkout, spike]
---

# BMS-4049 — Jira-Ready

**Title:** Cart & Checkout with Gulf Pricing — Spike: Architecture Discovery

**Type:** Story (Spike) · **Time-box:** 5 working days · **Output:** design doc + decision log + follow-up tickets

**Story Statement:**

As a Gulf engineering team, we want a time-boxed spike that validates the cart-to-checkout path in OHFY-Ecom (`draftInvoiceService` + `CartController` + `Order__c` from OHFY-CORE) and decides how Gulf's multi-layer pricing and multi-entity tax will be handled, so that BMS-3928 (Cart & Checkout with Gulf Pricing) starts from a validated architecture grounded in existing code.

**Why It Matters:**

The current checkout path is incomplete: `draftInvoiceService.js` imports from an Apex class (`EcomWrappers`) that does not exist in OHFY-Ecom. A second cart implementation (`Cart__c` / `Cart_Item__c` local objects vs. `Order__c` / `Order_Item__c` in OHFY-CORE) coexists in the same `CartController`. Gulf's requirements (multi-layer pricing, multi-entity FL/AL tax, warehouse-scoped catalog) will amplify any ambiguity if we start implementation without resolving these.

**Gulf Context:**
- FL and AL overlapping-but-distinct product catalogs
- Multi-layer pricing (frontline / volume tier / promotional / chain-specific)
- Multi-entity tax (FL vs AL), not just zip-based

**Current State (2026-04-17, per codebase scan):**
- `draftInvoiceService.js` imports `initializeDraftInvoice`, `onInvoiceItemChange`, `updateDraftInvoice`, `confirmDrafts_ECOM` from `@salesforce/apex/EcomWrappers` — **class does not exist in OHFY-Ecom**.
- `CartController.cls` has both `Cart__c`/`Cart_Item__c` (legacy local) and `Order__c`/`Order_Item__c` (OHFY-CORE draft) paths.
- Pricing today = static pricelist lookups via `CartController.getFilteredRecords` + cached in `userDataService.js`. No waterfall, no external callout. Promotions cached but not applied.
- Tax today = state-based via `Tax_Authority__c` by `State_Code__c`. Not entity-aware.
- Fulfillment handle = `Order__c.Fulfillment_Location__c` (no `Warehouse__c` field).
- No pricing-engine Named Credential. Only Twilio exists.

**Out of Scope:**
- Writing production code (prototype + ADR only)
- Front-end refactor of `ecomShop` / `ecomCartPage` / `ecomProductPage`
- OHFY-CORE schema changes (identify, don't implement)

**Acceptance Criteria:**

```gherkin
Scenario: Resolve the EcomWrappers / draft invoice Apex gap
  Given draftInvoiceService.js imports initializeDraftInvoice, onInvoiceItemChange,
        updateDraftInvoice, and confirmDrafts_ECOM from @salesforce/apex/EcomWrappers
  When  the spike owner searches OHFY-CORE for this class
  Then  the design doc captures whether EcomWrappers exists in OHFY-CORE,
        needs to be built in OHFY-Ecom, or should be renamed to match an existing
        class (e.g., QA_DraftInvoiceController)
  And   a follow-up ticket is filed for whichever action is required before
        BMS-3928 can run end-to-end

Scenario: Decide cart data model (Cart__c vs Order__c)
  Given CartController currently uses both Cart__c/Cart_Item__c and Order__c/Order_Item__c
  When  the spike owner documents trade-offs
  Then  a decision is recorded — pick one, deprecate the other — with rationale
        and impact on existing LWCs (ecomCartPage, ecomReviewSummary, etc.)

Scenario: Confirm where Gulf pricing resolution lives
  Given Gulf requires frontline / volume tier / promotional / chain-specific layering
  When  the spike owner audits OHFY-CORE and asks Gulf stakeholders whether
        pricing is in-Salesforce or external
  Then  the doc records one of:
        - "OHFY-CORE has class X that handles the waterfall; extend/reuse"
        - "External service; define API contract (inputs, outputs, SLA, retry)"
        - "Net new in-Salesforce engine; propose design and placement"

Scenario: Tax dispatch strategy for FL vs AL
  Given today's CartController.addDraftItems uses Account.ShippingState +
        Tax_Authority__c(State_Code__c)
  When  the spike owner evaluates dispatch keys
  Then  the doc picks one: Account.ShippingState, Location__c.State__c,
        Territory FK, or a new Entity__c concept
  And   proposes a service boundary (e.g., S_TaxCalculation / TaxService in
        OHFY-CORE) and identifies any new metadata needed

Scenario: Pricing snapshot decision
  Given pricelist values can change after an order is placed
  When  the spike owner compares approaches
  Then  the doc recommends one of:
        - Long-text JSON field (Pricing_Snapshot__c)
        - Relational snapshot (per-line Pricing_Code__c + Promotion__c FK + captured adjustments)
        - No snapshot; rely on invoice/order history
        with rationale + downstream cost

Scenario: Spike output handoff
  Given the design doc is complete in /docs or Obsidian
  When  the architect and BMS-3928 assignee review
  Then  both sign off OR request concrete revisions
  And   every required prerequisite schema/code change is ticketed before
        BMS-3928 is scheduled
```

**Open Questions for Refinement:**
1. Where does `EcomWrappers` live? Or should it be built in OHFY-Ecom? (Highest-priority unknown.)
2. Is Gulf pricing waterfall in-Salesforce (OHFY-CORE Apex) or a planned external service?
3. Keep `Cart__c`/`Cart_Item__c` legacy or consolidate on `Order__c` draft? Which LWCs break under each option?
4. Is OHFY-CORE repo accessible for this spike?
5. Tax dispatch key: state, location, territory, or new `Entity__c`?
6. Gulf stakeholder confirm: is tax truly multi-entity or multi-state in practice?

**Labels:** `spike`, `decision-needed`

---

# BMS-4049 — Polish Notes

## Verdict at a Glance
**Significant rewrite recommended.** The spike's framing invents new objects and a "PRC engine" that don't reflect the codebase. The **real spike target** is already defined for us: **the cart-as-draft-invoice pattern in OHFY-Ecom is half-built and broken** (`draftInvoiceService` calls an `EcomWrappers` Apex class that doesn't exist, and the corresponding `confirmDrafts_ECOM` method is missing). That's the genuine architectural discovery this spike should own — not hypothetical Cart/Order schemas.

| Area | Verdict |
|---|---|
| Story statement (de-risk BMS-3928 before implementation) | Confirmed — spike is warranted |
| Gulf business context (FL/AL catalogs, multi-layer pricing, multi-entity tax) | Confirmed — real constraints |
| AC #1: "PRC engine integration contract" | **Contradicted** — no "PRC engine" exists; `EcomWrappers` class referenced by the service also doesn't exist |
| AC #2: "Prototype PRC callout with error handling" | **Contradicted** — pricing today is in-Salesforce static pricelist lookups, not a callout |
| AC #3: "Define Order__c schema" | **Contradicted** — `Order__c` is in OHFY-CORE (external package); cart writes go through `CartController.addDraftItems` to `Order__c` + `Order_Item__c` already |
| Classes `E_Credits`, `QA_CreditController` | Partially wrong — naming isn't consistent with this repo's inventory |
| New objects `Cart__c`, `Cart_Item__c` | **Already exist** locally in OHFY-Ecom (legacy); coexist with the draft-invoice/Order flow |
| `Warehouse__c` lookup | Contradicted — no such field; orders use `Fulfillment_Location__c` |
| `Pricing_Snapshot__c` | Absent — genuinely net-new idea |
| Entity-aware tax (FL vs AL) | Incomplete — tax today is state-based via `Tax_Authority__c`, not entity-aware |

---

## Phase 2 — Business Requirements & ACs

### Structural check
- ✅ Clear purpose (de-risk an XL sibling ticket)
- ✅ Correct issue type (Spike)
- ⚠️ ACs are grammatically well-formed but reference entities (PRC engine, Order__c schema from scratch) that don't match reality — so "passing" them would validate a fiction
- ❌ No output deliverable named (design doc? ADR? diagram?)
- ❌ No time-box

### Missing / implied ACs
- **Spike output**: a concrete artifact (design doc + decisions) reviewed by architect + BMS-3928 assignee
- **Time-box**: 5 working days max
- **Decision log**: name the forks (reuse `draftInvoiceService` pattern vs. introduce new Cart/Order objects; pricing in-Salesforce vs. external; tax dispatch strategy)
- **Risk register**: known pricing/tax edge cases feed BMS-3928 refinement
- **Prerequisite ticket list**: any schema changes identified are ticketed before BMS-3928 starts

---

## Phase 3 — Technical Approach

### Claim-by-claim validation (honesty protocol)

**Claim 1: "PRC engine resolves prices through multi-layer waterfall"**
- **Code shows:** In OHFY-Ecom, pricing is **static lookup only** — `userDataService.js` caches `itemToUnitPriceMap` / `itemToIndUnitPriceMap` from `CartController.getFilteredRecords` (pricelist items). No runtime waterfall, no volume-tier/promo/chain-specific resolution logic in this repo. Promotions are only *cached* (`itemToPromotionsMap`), not *applied*. Actual resolution may live in OHFY-CORE (external dependency, not in this repo).
- **Assessment:** **Contradicted by name / Unverifiable by location.** No "PRC" naming anywhere. If the waterfall lives in OHFY-CORE, the spike should validate it *there* — but that repo isn't available locally; may need a CORE code review.

**Claim 2: `QA_DraftInvoiceController` and "EcomWrappers" are the Apex backing**
- **Code shows:** `draftInvoiceService.js` imports from `@salesforce/apex/EcomWrappers`: `initializeDraftInvoice`, `onInvoiceItemChange`, `updateDraftInvoice`, `confirmDrafts_ECOM`. **`EcomWrappers` class does not exist in OHFY-Ecom**. `CartController.cls` (in `experienceSite/`) has comments referencing `QA_DraftInvoiceController` as a source for moved methods (`clearDraftItems`, `createAccountItem`). `QA_DraftInvoiceController` itself is not in this repo either — presumably in OHFY-CORE.
- **Assessment:** **Contradicted / Critical gap.** The draft-invoice checkout path is **broken today**: the LWC service calls Apex methods that aren't reachable. This needs to be named as the primary spike target.

**Claim 3: New `Cart__c`, `Cart_Item__c`, `Order__c`, `Order_Line_Item__c`**
- **Code shows:**
  - `Cart__c` and `Cart_Item__c` **already exist locally** in OHFY-Ecom with fields like `User__c`, `Total_Cart_Items__c`, `Total_Amount__c`, `Total_Savings__c` (Cart__c) and `Cart__c`, `Product__c`, `Ordered_Quantity__c`, `Unit_Price__c` (Cart_Item__c). Used by `CartController.retrieveOrCreateCart`, `addToCart`, `getCartItems`, etc. — **legacy pattern**.
  - `Order__c` + `Order_Item__c` are in **OHFY-CORE** and referenced by `CartController.addDraftItems` — the modern draft-invoice path.
  - Two cart implementations coexist in the same `CartController` file.
- **Assessment:** **Contradicted + Incomplete.** The spike should not propose new Cart/Order objects. It should **decide which of the two existing paths to keep** and deprecate the other. This is arguably the most important architectural decision.

**Claim 4: `Warehouse__c` lookup on Order**
- **Code shows:** No `Warehouse__c` field on `Order__c` locally. `draftInvoiceService.fulfillmentLocationId` is the existing handle. `CartController.addDraftItems` references `Order__c.Fulfillment_Location__c` (field likely defined in OHFY-CORE).
- **Assessment:** **Contradicted.** Use `Fulfillment_Location__c` (Location lookup), not invent `Warehouse__c`.

**Claim 5: `Pricing_Snapshot__c` — long-text JSON for traceability**
- **Code shows:** No such field today. The motivation (preserve waterfall resolution at order time) is legitimate. Alternatives exist (per-line preserved `Pricing_Code__c`, Promotion FK + adjustment rows).
- **Assessment:** **Incomplete (genuinely net-new).** Should be evaluated in the spike, not assumed.

**Claim 6: Tax "entity-aware, not just zip-code-based" (FL vs AL)**
- **Code shows:** `CartController.addDraftItems` queries `Account.ShippingState` and `Account.Tax_Exempt__c`, then `Tax_Authority__c` records by `State_Code__c`, setting `Order_Item__c.Sales_Tax_Rate__c`. This is **state-based, not entity-aware**. No routing by distributor entity, no multi-entity tax configuration.
- **Assessment:** **Incomplete.** The gap is real. The spike should propose a dispatch key (Account billing state vs. Location state vs. Territory FK vs. a new `Entity__c` concept) and a service boundary.

**Claim 7: "sub-500ms per callout" SLA**
- **Code shows:** No external pricing callout exists today. Twilio is the only Named Credential (`Twilio_Named_Cred.namedCredential-meta.xml`). No pricing-engine Named Credential or External Credential. Pricing is Apex-in-org.
- **Assessment:** **Unverifiable / likely contradicted.** If pricing is in-Salesforce, the SLA framing is wrong. If Gulf actually wants an external pricing service, that's a major scope decision the spike should surface.

**Claim 8: `CartPricingService` prototype class**
- **Code shows:** No such class exists. Pricing resolution today is static pricelist lookups in `userDataService` and `CartController`. Promotion application logic is not present here (potentially in OHFY-CORE, or simply missing).
- **Assessment:** **Unverifiable.** If the spike wants to prototype, it should reuse the existing `CartController.getFilteredRecords` + `userDataService` patterns, and extend rather than start from scratch.

**Claim 9: Pricing code `AL-VOL-TIER1`**
- **Code shows:** No references to pricing codes by that format anywhere.
- **Assessment:** **Unverifiable.** Ask whoever owns Gulf seed data / pricelist mastering.

### Scorecard
| # | Claim | Verdict |
|---|---|---|
| 1 | "PRC engine" with waterfall | Contradicted by name / Unverifiable in local repo |
| 2 | `EcomWrappers` / `QA_DraftInvoiceController` backing | Contradicted — `EcomWrappers` referenced but missing |
| 3 | New Cart/Order objects | Contradicted — Cart__c + Cart_Item__c exist locally; Order__c in CORE |
| 4 | `Warehouse__c` lookup | Contradicted — use `Fulfillment_Location__c` |
| 5 | `Pricing_Snapshot__c` | Incomplete — genuinely net-new |
| 6 | Entity-aware tax | Incomplete — today is state-based |
| 7 | Sub-500ms callout SLA | Unverifiable — no external pricing callout exists |
| 8 | `CartPricingService` prototype | Unverifiable — no such class |
| 9 | `AL-VOL-TIER1` pricing code | Unverifiable |

---

## Phase 4 — Dependencies

| Link | Check | Result |
|---|---|---|
| Relates to BMS-3928 (Cart & Checkout) | Spike is meant to de-risk BMS-3928 | Confirmed |
| Parent BMS-3702 (ECOM) | Parent consistent | Confirmed |
| Implicit: OHFY-CORE (Order__c, pricing waterfall, `QA_DraftInvoiceController`) | Does the spike need OHFY-CORE code access? | **Yes — flag this.** Without OHFY-CORE access, the spike can only partially validate. Scope should call out "spike requires read access to OHFY-CORE repo." |
| Downstream | BMS-3928 implementation should depend on spike sign-off | Add a handoff AC |

---

## Top Issues (ranked)

1. **The biggest unknown is already named: the checkout path is broken.** `draftInvoiceService.js` imports from `@salesforce/apex/EcomWrappers` — that class doesn't exist in OHFY-Ecom. `confirmDrafts_ECOM()` is never called from any Apex in this repo. The spike's #1 job is to confirm whether `EcomWrappers` lives in OHFY-CORE (and is just not exposed locally) **or** whether it needs to be built in this repo. This deserves to be AC #1.
2. **Decide: Cart__c/Cart_Item__c legacy pattern vs. Order__c draft pattern.** Both exist in the same `CartController` today. Keeping both creates dual sources of truth. Spike must pick one and plan the other's deprecation.
3. **Confirm where Gulf pricing resolution will live.** If in OHFY-CORE, the spike reads and documents it. If external, the spike defines API contract + SLA + retry. Today's local code has *none* of this; it's static lookups.
4. **Tax dispatch strategy.** Current `Tax_Authority__c`-by-state-code approach is not entity-aware. Spike decides the key (state? location? territory FK? new Entity__c?).
5. **No output deliverable or time-box.** Spikes without these balloon. Name the artifact and cap the days.

---

## Suggested Revisions

### Proposed title (unchanged)
"Cart & Checkout with Gulf Pricing — Spike: Architecture Discovery"

### Proposed replacement description
```markdown
### Story Statement
As a **Gulf engineering team**, I want **a time-boxed spike to validate the
cart-to-checkout path in OHFY-Ecom (draftInvoiceService + CartController +
Order__c from OHFY-CORE) and decide how Gulf's multi-layer pricing and
multi-entity tax will be handled**, so that **BMS-3928 (Cart & Checkout with
Gulf Pricing) starts from a validated architecture grounded in existing code.**

### Why It Matters
The current checkout path is incomplete: `draftInvoiceService` imports from
an Apex class (`EcomWrappers`) that does not exist in OHFY-Ecom. A second
cart implementation (`Cart__c` / `Cart_Item__c` local objects vs.
`Order__c` / `Order_Item__c` in OHFY-CORE) coexists in the same `CartController`.
Gulf's requirements (multi-layer pricing, multi-entity FL/AL tax, warehouse-
scoped catalog) will amplify any ambiguity if we start implementation without
resolving these.

### Gulf Context (unchanged — keep)
- FL and AL overlapping-but-distinct product catalogs
- Multi-layer pricing (frontline / volume tier / promotional / chain-specific)
- Multi-entity tax (FL vs AL), not just zip-based

### Out of Scope for this spike
- Writing production code (only prototype / ADR)
- Front-end refactor of ecomShop / ecomCartPage / ecomProductPage
- OHFY-CORE schema changes (can be *identified* but not *implemented* here)

### Time-box: 5 working days
Output: one design doc + decision log committed to /docs, plus follow-up tickets.
```

### Proposed replacement ACs
```gherkin
Scenario: Resolve the EcomWrappers / draft invoice Apex gap
  Given draftInvoiceService.js imports initializeDraftInvoice, onInvoiceItemChange,
        updateDraftInvoice, and confirmDrafts_ECOM from @salesforce/apex/EcomWrappers
  When  the spike owner searches OHFY-CORE for this class
  Then  The design doc captures whether EcomWrappers exists in OHFY-CORE,
        needs to be built in OHFY-Ecom, or needs to be renamed (e.g., to
        QA_DraftInvoiceController) to match an existing class
  And   A follow-up ticket is filed for whichever action is required before
        BMS-3928 can run end-to-end

Scenario: Decide cart data model (Cart__c vs Order__c)
  Given CartController currently uses both Cart__c/Cart_Item__c and Order__c/Order_Item__c
  When  the spike owner documents the trade-offs
  Then  A decision is recorded (pick one, deprecate the other) with rationale
        and impact on existing LWCs (ecomCartPage, ecomReviewSummary, etc.)

Scenario: Confirm where Gulf pricing resolution lives
  Given Gulf requires frontline / volume tier / promotional / chain-specific layering
  When  the spike owner audits OHFY-CORE for an existing pricing engine and
        asks Gulf stakeholders whether pricing is in-Salesforce or external
  Then  The doc records one of:
        - "OHFY-CORE has class X that handles the waterfall; extend/reuse"
        - "External service; define API contract (inputs, outputs, SLA, retry)"
        - "Net new in-Salesforce engine; propose design and placement (OHFY-CORE vs OHFY-Ecom)"

Scenario: Tax dispatch strategy for FL vs AL
  Given today's CartController.addDraftItems uses Account.ShippingState +
        Tax_Authority__c(State_Code__c)
  When  the spike owner evaluates dispatch keys
  Then  The doc picks one: Account.ShippingState, Location__c.State__c,
        Territory FK, or a new Entity__c concept
  And   Proposes a service boundary (e.g., S_TaxCalculation or TaxService in
        OHFY-CORE) and identifies any new metadata needed

Scenario: Pricing snapshot decision
  Given pricelist values can change after an order is placed
  When  the spike owner compares approaches
  Then  The doc recommends one of:
        - Long-text JSON field (Pricing_Snapshot__c)
        - Relational snapshot (per-line Pricing_Code__c + Promotion__c FK +
          captured adjustment rows)
        - No snapshot; rely on invoice/order history
        and gives rationale + downstream cost

Scenario: Spike output handoff
  Given the design doc is complete in /docs or the Obsidian vault
  When  the architect and BMS-3928 assignee review
  Then  Both sign off OR request concrete revisions
  And   Every required prerequisite schema/code change is ticketed
        before BMS-3928 is scheduled
```

### Proposed field updates
- Labels: keep `spike`, add `decision-needed`
- Story points: this is a spike — time-box 5 days rather than pointing

---

## Open Questions for Team Refinement
1. Where does `EcomWrappers` live? Or is it expected to be built in OHFY-Ecom? (Highest-priority unknown.)
2. Is the Gulf pricing waterfall in-Salesforce (OHFY-CORE Apex) or a planned external service?
3. Do we keep `Cart__c`/`Cart_Item__c` legacy or consolidate on `Order__c` draft? Which LWCs break under each option?
4. Is OHFY-CORE repo accessible for this spike? (Large chunks of the answer live there.)
5. Tax dispatch key: state? location? territory? new Entity__c?
6. Gulf stakeholder confirmation: is tax truly multi-entity or just multi-state in practice?
7. What does "PRC" refer to in Gulf's internal vocabulary — a specific internal system, or a Gong-transcript inference?

## Readiness Recommendation
**Hold — rewrite before refinement.** The business need is sharp and the timing is right, but the current description would send the team hunting for things that don't exist (PRC engine, Cart__c greenfield, Warehouse__c lookup). A 30-minute rewrite using the suggested description + ACs, then bring to team. Ideal outcome: this spike completes in Sprint 1, so BMS-3928 can run with confidence in Sprint 2.
