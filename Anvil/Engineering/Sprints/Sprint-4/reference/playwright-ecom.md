# Playwright Skills: *ecom vs Lightning*

## `/playwright-ecom` — what it does

An AI skill that generates and maintains Playwright E2E specs for the **eCommerce Experience Cloud (LWR) storefront**. Given a branch with changed ecom LWCs (or a Jira ticket key), it:

1. **Pre-flights** — verifies ecom credentials resolve, community user has an Account, and TS baseline is clean.
2. **Loads context** — pulls the Jira ticket's acceptance criteria (if a `BMS-XXXX` key is provided) and diffs the branch to identify changed `OHFY-eCommerce-UI` components.
3. **Analyzes the component** — reads the HTML template (`data-testid` map), JS controller (`@api`/`@track`, Apex imports, events), parent/child relationships, Apex dependencies (traces through `Ecom_UI_Wrappers` to the domain method), and Jest mocks.
4. **Maps existing coverage** — surveys `test-automation/tests/ecom/*.spec.ts` to build a gap table (what's already tested vs what isn't), then proposes a scenario outline before writing anything.
5. **Writes/edits the spec** — uses `@playwright/test` (not `sfPage`), runtime data discovery via `orgQuery.ts`, LWR URL routes for navigation, and serial mode with bookend cart cleanup for state-mutating flows. Adds `data-testid` attributes to LWC source if missing.
6. **Runs and iterates** — executes the spec headlessly (up to 3 fix iterations), checks TS compilation, formatting, lint, and anti-pattern grep.
7. **Reports** — AC coverage table, files changed, tests added, `data-testid`s relied on, and the run command.

**Hard rails**: no `waitForTimeout`, no hardcoded IDs/names, only delete `Order_Item__c` (never `Order__c`/`Invoice_Group__c`), workers locked to 1, cart specs are always serial with `beforeEach`+`afterEach` cleanup.

---

Two separate skills for two separate surfaces. Same repo, different everything else.

## What they share

- Both live in `.claude/skills/` and follow the same workflow shape (pre-flight, context, discovery, authoring, verification, reporting)
- Both use `data-testid` as the primary selector strategy
- Both discover test data at runtime via SOQL (no hardcoded IDs)
- Both run against real scratch orgs, not mocks
- Both have a `LEARNINGS.md` that accumulates patterns over time
- Both enforce "no `waitForTimeout`" — use `expect.poll` or assertion-based waits

## Key differences

|                      | `/playwright-tests` (Lightning)                              | `/playwright-ecom` (Experience Cloud)                               |
| -------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------- |
| **Surface**          | Internal Lightning UI (SLDS)                                 | LWR Experience Cloud site (Tailwind)                                |
| **Config**           | `playwright.config.ts`                                       | `playwright.ecom.config.ts`                                         |
| **Auth**             | Admin via `sf org open --url-only` (frontdoor)               | Community user via username/password login form                     |
| **Fixture**          | `sfPage` (augmented Page with helpers)                       | Raw `page` from `@playwright/test`                                  |
| **Navigation**       | Quick actions on record pages (`sfPage.openInvoiceAction()`) | URL routes (`page.goto('/profile')`)                                |
| **Data helpers**     | `sfCli.ts` (`runSfQuery`, `runSfApex`)                       | `orgQuery.ts` (`soql`, `clearTestCartItems`)                        |
| **Cart flow**        | N/A                                                          | `cartFlow.ts` (`makeCartFlow()` factory)                            |
| **Packages covered** | OMS-UI, WMS-UI, PLTFM-UI, REX-UI                             | eCommerce-UI only                                                   |
| **Test folder**      | `tests/oms/`, `tests/wms/`, `tests/pltfm/`, `tests/rex/`     | `tests/ecom/`                                                       |
| **Workers**          | Configurable                                                 | Locked to 1 (SF governor: 25 concurrent requests)                   |
| **Dual layout**      | No                                                           | Yes -- mobile + desktop render in DOM, scope with `:visible`        |
| **Cart cleanup**     | N/A                                                          | Only delete `Order_Item__c`, never `Order__c` or `Invoice_Group__c` |
| **Seed data**        | External IDs (`seed:acct-customer-0`)                        | Runtime SOQL discovery (`resolveEcomCredentials()`)                 |

## How each skill navigates (the core difference)

### Lightning (`/playwright-tests`) — record pages + quick actions

The skill uses the `sfPage` fixture, which wraps Playwright's `page` with Salesforce-aware helpers. Navigation is **record-centric**: go to a record, then trigger a quick action to open the target LWC.

**Navigation discovery (Step 7 of the skill):**
1. Greps existing specs in the target folder for navigation patterns (`openAction`, `getByRole.*button`, `goto`, `goToRecord`)
2. Reads deprecated/fixme'd specs for button labels and entry points (code is dead, but nav knowledge is valid)
3. Greps the fixture file for all available navigation helpers and builds a method→button-regex table
4. If no existing fixture method matches → **creates a new one** following the `openInvoiceAction` pattern before writing the spec

**Available fixture methods:**

| Method | What it does |
|--------|-------------|
| `sfPage.goToRecordByExternalId(sObject, externalId)` | Navigate to record page by external ID |
| `sfPage.resolveRecordIdByExternalId(sObject, externalId)` | Resolve ID without navigating |
| `sfPage.openInvoiceAction()` | Open Invoice quick action (handles overflow menu, waits for component) |
| `sfPage.openOrderAction()` | Open Order quick action |
| Custom fixture methods | Same pattern: navigate → find button via regex → handle overflow → wait for LWC header |

**Navigation flow**: Account record page → quick action button (or tab/related list) → LWC modal/panel → interact

**Hard rule**: Never hardcode raw button clicks in the spec body. Navigation helpers live in the fixture so they're reusable.

### eCommerce (`/playwright-ecom`) — URL routes

No `sfPage` fixture. Uses raw Playwright `page`. Navigation is **URL-route-based** (LWR).

**Known routes (Step 7 of the skill):**

| Route | Component |
|-------|-----------|
| `/` | `ecomHomeBody` (home page) |
| `/shop-page` | `ecomShop` (product catalog, supports `?search=`) |
| `/cart-page` | `ecomCartPage` |
| `/review-summary` | `ecomReviewSummary` |
| `/order-placed` | `ecomOrderPlaced` |
| `/order-history` | `ecomOrderHistory` |
| `/profile-page` | `ecomProfilePage` |
| `/promotions` | `ecomPromotions` |
| `/support` | `ecomSupport` |
| `/login` | Login form (unauthenticated) |

**Navigation flow**: `page.goto('/route')` or click nav links via `page.getByTestId('nav-link-<slug>')`

**Dual-layout gotcha**: Many ecom LWCs render both mobile and desktop markup simultaneously in the DOM and toggle via Tailwind. Tests must scope selectors with `:visible` or container scoping so `.first()` doesn't grab the hidden version.

## Import patterns

### Lightning specs
```ts
import { test, expect } from "../../fixtures/salesforce.fixture";
import { runSfQuery, runSfApex, extractDebugPayload } from "../../support/sfCli";
```

### eCommerce specs
```ts
import { test, expect } from '@playwright/test';
import { soql, getTestUserAccountId, resolveEcomCredentials } from '../../support/ecom/orgQuery';
```

**Never cross the streams**: don't use `sfPage` in ecom specs or `orgQuery.ts` in Lightning specs.

## When to use which

- Changing an LWC in **OMS-UI, WMS-UI, PLTFM-UI, or REX-UI** → `/playwright-tests`
- Changing an LWC in **eCommerce-UI** → `/playwright-ecom`
- Both in the same PR → run each skill separately for its package

## Where to look

| Topic | File |
|---|---|
| Lightning skill definition | `.claude/skills/playwright-tests/SKILL.md` |
| Lightning learnings | `.claude/skills/playwright-tests/LEARNINGS.md` |
| ecom skill definition | `.claude/skills/playwright-ecom/SKILL.md` |
| ecom learnings | `.claude/skills/playwright-ecom/LEARNINGS.md` |
| ecom hard rules + data model | `test-automation/tests/ecom/CLAUDE.md` |
| ecom conventions + pitfalls | `test-automation/tests/ecom/README.md` |
| ecom org setup | `orgScripts/e-commerce/README.md` |
| SF fixture (Lightning) | `test-automation/fixtures/salesforce.fixture.ts` |
| ecom helpers | `test-automation/support/ecom/orgQuery.ts`, `cartFlow.ts` |
