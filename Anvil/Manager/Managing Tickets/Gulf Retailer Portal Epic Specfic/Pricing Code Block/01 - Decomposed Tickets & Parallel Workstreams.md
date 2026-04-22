---
title: Decomposed Tickets & Parallel Workstreams
created: 2026-04-22
updated: 2026-04-22
epic: Gulf Retailer Portal
owner: Alvaro Sanchez
status: proposed
tags: [gulf, pricing, decomposition, tickets, parallel]
---

# Decomposed Tickets & Parallel Workstreams

> **Context**: See [[00 - README - Pricing Code Block & New Sprint Flow]] for why this decomposition exists.

> **Goal**: Replace the serial `BMS-4049 → BMS-4050 → BMS-4051 → BMS-4052` dependency chain with four parallel tracks, each owning concrete sprint-scoped deliverables. Ticket keys are **proposed** — real Jira keys will be allocated when created.

---

## Track A — Pricing Data Model

**Owner**: Engineering (data model) + Ops stakeholder for review
**Rationale**: Before a resolver can run, we need to agree on where the 154+ pricing codes live in Salesforce. OHFY-Ecom already has pricelist items with `ohfy__Discounted_Item_Price__c`. The question is whether that's sufficient, or whether Gulf needs a richer model (per-route, per-volume-tier, per-promotional-window).

### A1 — Confirm pricing object topology (Sprint 2 — 1 day)
- **Deliverable**: A one-page decision record: "Gulf pricing uses `[X]` object(s), with these fields and these relationships to Account/Item/Route/Warehouse."
- **Options**:
  - **A1.a** Reuse existing OHFY `Pricelist__c` + `Pricelist_Item__c` (simpler, but may not cover volume/promo).
  - **A1.b** Extend with `Pricing_Rule__c` (junction: Account/Pricelist × Item × Tier × Promotional Window).
  - **A1.c** Use Custom Metadata Types (CMDT) — fast read, slow write, org-limit risk at 154+ records per account.
- **Recommendation**: A1.a for Sprint 2, extended with A1.b if Sprint-3 volume-tier requirements can't fit in the existing model. CMDT ruled out due to per-record org limits.
- **Acceptance**: Matt Keeter sign-off on the chosen topology; updated ERD in `docs/`.

### A2 — Add missing fields to the pricing objects (Sprint 2 — 1 day)
- **Deliverable**: Field additions to whichever pricing object was chosen in A1.
- Example fields (contingent on A1): `Valid_From__c`, `Valid_Through__c`, `Volume_Tier_Min_Qty__c`, `Promotional_Code__c`, `Warehouse_Scope__c`.
- All fields follow the CLAUDE.md naming conventions (`Is_`/`Was_` for booleans, Title Case labels, description + inline help text).

### A3 — Populate with sample Gulf pricing data (Sprint 3 — 1 day)
- **Deliverable**: `data/gulf-pricing-seed.json` covering 10-20 representative SKUs × 5-10 accounts. Idempotent loader hooked into `utilityScripts/upsertSeedData.js` pattern.
- **Acceptance**: A Playwright test can navigate to a cart page, add a sample item, and see a Gulf-specific price.

---

## Track B — Resolution Algorithm (contract-first)

**Owner**: Engineering lead
**Rationale**: The hardest part of the block is the *interface*, not the implementation. An agreed-upon contract unblocks portal consumers before the real logic is written.

### B1 — Define the PricingResolver interface (Sprint 2 — 0.5 day)
- **Deliverable**: An Apex interface:
  ```apex
  public interface PricingResolver {
      PricingResult resolve(Id accountId, Id itemId, Decimal quantity, Datetime asOf);
      Map<Id, PricingResult> resolveBulk(Id accountId, Map<Id, Decimal> itemIdToQty, Datetime asOf);
  }
  ```
  plus a `PricingResult` wrapper: unitPrice, tier, appliedCodeName, sourceRecordId, explanation (human-readable).
- **Acceptance**: Published to repo; approved by engineering + product.

### B2 — Ship a mock resolver (Sprint 2 — 0.5 day)
- **Deliverable**: `MockPricingResolver implements PricingResolver` that returns the current pricelist price with `appliedCodeName = 'Mock (pricelist passthrough)'`.
- **Acceptance**: Can be wired into portal LWCs so Sprint-2 UI work proceeds without waiting for real logic.

### B3 — Ship the real basic resolver (Sprint 3 — 2 days)
- **Deliverable**: `GulfPricingResolver implements PricingResolver`. Handles single pricelist + base price. No volume tiers or promos yet.
- **Acceptance**: Replaces the mock behind a `Service_Configuration__mdt` flag. Apex tests cover: account with pricelist, account without pricelist, item not priced, asOf = now.

### B4 — Volume tiers (Sprint 4 — 1-1.5 days)
- **Deliverable**: Extend resolver to pick the correct volume tier for the requested quantity.
- **Acceptance**: Unit tests across tier boundaries; Playwright E2E confirms UI updates when qty crosses a tier.

### B5 — Promotional overrides (Sprint 4 — 1 day)
- **Deliverable**: Resolver respects `Valid_From__c` / `Valid_Through__c` and applies the overriding promotional record when active.
- **Acceptance**: Apex tests for time-window edges (exactly at start, exactly at end); Playwright E2E confirms expired promo falls back to base price.

---

## Track C — Portal Consumers (wire it into the UX)

**Owner**: Frontend engineer
**Rationale**: The OHFY-Ecom portal already renders prices — it just does so via `userDataService.getPricelistData()` directly. Rerouting through the PricingResolver decouples UI from the data model and lets us swap the resolver without touching LWCs.

### C1 — Add `pricingService` LWC module (Sprint 2 — 1 day)
- **Deliverable**: A new LWC service module `pricingService` (parallel to `userDataService`, `draftInvoiceService`) that calls `PricingResolver` via an Apex controller. Exposes:
  - `resolvePrice(itemId, quantity)`
  - `resolveBulk(items)` for cart totals
  - Caches results keyed by `accountId × itemId × quantityTier` with short TTL.
- **Acceptance**: Service unit-tested in Jest; calls the mock resolver from B2.

### C2 — Migrate `ecomShop` product grid to `pricingService` (Sprint 2 — 1 day)
- **Deliverable**: Product grid price column reads from `pricingService.resolvePrice` instead of pricelist item directly.
- **Acceptance**: No visual regression; existing Jest tests pass with a mocked pricingService; Playwright smoke confirms the shop page renders prices.

### C3 — Migrate `ecomCartPage` + `draftInvoiceService` to `pricingService` (Sprint 3 — 1.5 days)
- **Deliverable**: Cart line items re-resolve price via the service when quantity changes. Total recalculates through the bulk API.
- **Acceptance**: Cart totals match the resolver output; existing cart Jest tests still pass.

### C4 — Show which pricing code applied (Sprint 4 — 0.5 day)
- **Deliverable**: Product grid and cart display the `PricingResult.appliedCodeName` (e.g., "Promo — Summer 2026", "Volume Tier 25-49 cases") as a small label next to the price.
- **Acceptance**: Visible in the portal; Playwright E2E asserts the label text matches the resolver's explanation.

### C5 — Migrate `ecomReviewSummary` (checkout) (Sprint 5 — 1 day)
- **Deliverable**: Checkout review shows the resolved prices and the applied codes side-by-side with a "re-price" call on mount so stale cart values are corrected.
- **Acceptance**: Any mismatch between cart and checkout prices raises a clear warning rather than silently submitting.

---

## Track D — Ingestion & Authoring

**Owner**: Ops + an engineer for the pipeline
**Rationale**: Even with a perfect data model and resolver, Gulf needs a way to load the 154+ pricing codes and maintain them. This cannot wait until Sprint 5.

### D1 — Sample pricing data template (Sprint 2 — 0.5 day)
- **Deliverable**: A CSV template + data dictionary Ops can fill. Columns mirror Track A fields.
- **Acceptance**: Ian / Emily / AR lead signs off on the format.

### D2 — Idempotent loader script (Sprint 3 — 1-1.5 days)
- **Deliverable**: A `utilityScripts/loadGulfPricing.js` script (or `sf data import tree` plan) that:
  - Upserts Pricing records by `External_Id__c` (the `seed:` or `gulf:` prefix convention).
  - Validates referenced Accounts/Items exist.
  - Produces a report of inserted / updated / skipped / failed.
- **Acceptance**: Running it twice produces no duplicates. Running it with a bad row surfaces a clear error.

### D3 — Admin authoring UI (Sprint 5, optional) — 1-2 days
- **Deliverable**: A simple Lightning page or flow that lets AR edit an individual pricing record without exporting/importing CSVs.
- **Acceptance**: AR can change a Credit_Limit__c and a pricing rule without an engineer.
- **Note**: Optional — if CSV + Data Loader is enough for Gulf's initial rollout, defer this indefinitely.

---

## Dependency Matrix

| Track / Ticket | Depends on | Blocks | Sprint |
|---|---|---|---|
| A1 (object topology) | — | A2, B3, D1 | 2 |
| A2 (fields) | A1 | B3, D1 | 2 |
| A3 (seed data) | A2, D2 | Playwright Sprint 3 demos | 3 |
| B1 (interface) | — | B2, C1 | 2 |
| B2 (mock) | B1 | C1, C2 | 2 |
| B3 (real basic) | B1, A2 | C3 | 3 |
| B4 (volume tiers) | B3 | C4 | 4 |
| B5 (promos) | B3 | C4 | 4 |
| C1 (pricingService) | B2 | C2, C3 | 2 |
| C2 (shop wiring) | C1 | — (value delivered) | 2 |
| C3 (cart wiring) | C1, B3 | C4 | 3 |
| C4 (applied-code UX) | C3, B4, B5 | — | 4 |
| C5 (checkout) | C3 | — | 5 |
| D1 (CSV template) | A1 | D2 | 2 |
| D2 (loader) | A2, D1 | A3 | 3 |
| D3 (admin UI) | A2 | — | 5 (optional) |

---

## Mapping to Existing Jira Tickets

| Existing ticket | New status |
|---|---|
| BMS-4049 — Gulf Pricing Spike | **Reframe** as umbrella for this decomposition. Deliverable = the plan in this folder. Closes EOS2 once A1, B1, B2, C1, D1 are done. |
| BMS-4050 — Cart Ph 1: Cart + Basic Pricing | Becomes Track C3 + B3 combined. Sprint 3. |
| BMS-4051 — Cart Ph 2: Volume Tiers + Promos | Becomes Track B4 + B5 + C4. Sprint 4. |
| BMS-4052 — Cart Ph 3: Checkout + Tax + Order | Becomes Track C5 + tax handling. Sprint 5. |
| (new) | A1, A2, A3, B1, B2, B3, B4, B5, C1, C2, C3, C4, C5, D1, D2, D3 — sub-tasks under BMS-4049 umbrella or standalone stories, Elliot's call. |

---

## Ticket-writing pass

Each of the tracks above is sized to become either (a) a Jira sub-task under the relevant parent (BMS-4049 / BMS-4050 / ...) or (b) a standalone story. Recommendation: create them as standalone stories labelled `pricing-code-block` + `sprint-SN` so they show up in sprint filters independently. Run `/polish` on each before refinement to rebase on the OHFY-Ecom codebase (the auto-gen "Price_Record__c" patterns will appear again; suppress them during polish).
