---
title: Big Kahuna — E-Commerce Enablement
status: scoping
created: 2026-05-05
updated: 2026-05-05
labels: [devex, ecom, gulf, big-kahuna, migration, spike]
related_tickets: [BMS-3923, BMS-3926, BMS-4049, BMS-4258, BMS-3921, BMS-3929]
related_notes:
  - "[[Planning to create script to auto enable E-commerce on Org Creation]]"
reference_docs:
  - https://ohanafy.atlassian.net/wiki/spaces/ET/pages/656474113/Experience+Cloud+Site+Resources+-+E-Commerce
  - "[[../../OHFY-Split/docs/engineering/adrs/ADR-0006-consolidate-2gp-packages-into-mono-repo]]"
  - "[[../../OHFY-Split/docs/engineering/adrs/ADR-0007-five-tier-package-dependency-architecture]]"
  - "[[../../OHFY-Split/docs/engineering/adrs/0007-global-dto-pattern-for-cross-package-lwc-access]]"
  - "[[../../OHFY-Split/docs/engineering/adrs/ADR-0008-item-centric-pricing-architecture]]"
  - "[[../../OHFY-Split/docs/engineering/design/2026-02-05-c4-model]]"
decisions:
  - "2026-05-05 — Pitched & accepted: migrate OHFY-Ecom contents into OHFY-Split as a new package. Eliminates cross-repo orchestration; unblocks Big Kahuna parallel agent dispatch."
  - "2026-05-05 — Tier placement corrected to Tier 3 (Group 4) per C4 model + ADR-0007. Prior assumption of Tier 4 was wrong — Ecom has no Tier 3 backend counterpart and C4 diagrams it as Ecom → Platform only."
---

# Big Kahuna — E-Commerce Enablement

> Automate the ~30-step manual Confluence runbook for spinning up the Gulf E-Commerce Experience Cloud site on a scratch org. Single CLI flag on `npm run deploy:full`, single repo, single command for Big Kahuna's parallel agent dispatch.

---

## Why this matters

**Two motivators, one solution:**

### 1. Big Kahuna parallel agent dispatch
Big Kahuna spins up dedicated scratch orgs per ticket so AI agents can work tickets in parallel. Every agent needs:
- A clean scratch from `git clone OHFY-Split` (one repo, one command)
- Deterministic completion signal (machine-parseable output from `fullDeploy.js`)
- Snapshot-bakeable bootstrap (so agents don't pay full deploy cost per scratch)

Cross-repo orchestration kills this. **Single-repo is non-negotiable for Big Kahuna's value proposition.**

### 2. Manual setup tax across the team
Currently, every developer working on Gulf e-commerce (BMS-3923, BMS-3926, BMS-4049, BMS-3921, BMS-3929) burns 2–3 hours per scratch on the manual Confluence runbook. With 5+ engineers + Big Kahuna agents in flight, that's **15+ hours/week** of repeated setup. Automating returns those hours and gives QA/agents reproducible site environments.

---

## Architectural decision (pitched 2026-05-05, accepted)

**Move OHFY-Ecom contents into OHFY-Split as a new package.**

Why this changes everything:
- ❌ Cross-repo `$OHFY_ECOM_PATH` env var plumbing — **eliminated**
- ❌ S0 spike to validate dual-repo scratch coexistence — **eliminated**
- ❌ OHFY-CORE 1.220 dependency conflict risk — **eliminated** (Ecom assets land in OHFY-Split's tier structure, drop CORE dep entirely)
- ❌ API v64 vs v65 ExperienceBundle skew — **eliminated** (bumped to v65 during migration)
- ✅ Single `git clone` → `npm run deploy:full --enable-ecommerce` works for engineers AND agents
- ✅ ExperienceBundle commits beside the LWCs it references, in the same repo
- ✅ Big Kahuna agents get one source of truth

**Cost shifted, not eliminated.** The migration itself becomes the largest body of work in this epic — but it's a one-time cost that every future devex initiative benefits from.

---

## Overall scope of enablement

### In scope

| Surface | What gets automated |
|---|---|
| **OHFY-Ecom → OHFY-Split migration** | Move all 14 LWCs, ~10 Apex classes, static resources, customMetadata, namedCredentials, externalCredentials, messageChannels, triggers, objects from `~/Documents/OHFY-Ecom` into a new `OHFY-Ecom/` package directory in OHFY-Split |
| Scratch def | `Communities`, `Sites` features + `enableNetworksEnabled` + `enableExperienceBundleMetadata` settings (both `project-scratch-def.json` and `snapshot-clone-scratch-def.json`) |
| Cloned Customer Community Plus profile | Read+Edit on every active `__c` object (post-ADR-0008 reconciled list) + every Apex class + every CMDT |
| Guest User Profile delta | RegisterController access, Account RW, Contact RW |
| Org-Wide Defaults | 16 object OWD changes per Confluence (Account, Contract, Customer, Invoice, Invoice Group, Lot Invoice Item, Fee, Location ×2, Location Group, Lot, Lot Adjustment, Lot Inventory, Pricelist, Pricelist Group, Promotion, Route) → public/write external |
| ExperienceBundle | E-Commerce site definition with 10 pages, navigation menu, footer, theme — captured into version control then redeployable |
| Network + CustomSite | Site definition, member assignments, self-registration config |
| Bootstrap Apex | CSP relaxation, profile→site member assignment, self-reg activation |
| **Big Kahuna integration** | Idempotent `--enable-ecommerce` flag, JSON output mode for completion signal, snapshot-bakeable bundle deploy |
| Runbook docs | Two unavoidable manual prereqs (Enable Digital Experiences, Register Domain) |

### Out of scope (defer to follow-up tickets)

- Custom domain (`portal.gulfdistributors.com`) — one-time-per-org, low ROI to automate
- Branding asset swap (Gulf-specific logos, hero banner) — owned by **BMS-3923**
- Customer/account seed data into the site — separate seed-data ticket
- E-commerce LWC code changes — owned by per-feature Gulf tickets
- Login Flow / Self-Registration page custom logic — owned by **BMS-3926**
- Migrating OHFY-Ecom **away from OHFY-CORE schema** to OHFY-Split's reshaped data model — separate refactor (see Risks)

---

## Single-repo architecture (post-migration)

```
OHFY-Split/
├── sfdx-project.json                        ← add OHFY-Ecom as 12th package
├── utilityScripts/
│   ├── fullDeploy.js                        ← modify: add Group 6 + --enable-ecommerce flag
│   ├── enableEcommerceProfile.js            ← NEW
│   ├── deployEcommerceSite.js               ← NEW
│   └── captureEcommerceSite.js              ← NEW
├── orgScripts/
│   └── bootstrapEcommerceSite.apex          ← NEW
├── config/
│   ├── project-scratch-def.json             ← modify (add features)
│   └── snapshot-clone-scratch-def.json      ← modify
└── OHFY-Ecom/                               ← NEW package directory
    └── force-app/main/default/
        ├── lwc/                             ← migrated (14 ecom* bundles)
        ├── classes/                         ← migrated (RegisterController etc.)
        ├── staticresources/                 ← migrated (brand assets)
        ├── customMetadata/                  ← migrated
        ├── namedCredentials/                ← migrated
        ├── externalCredentials/             ← migrated
        ├── messageChannels/                 ← migrated
        ├── objects/                         ← migrated (after conflict reconcile)
        ├── triggers/                        ← migrated
        └── experiences/E_Commerce/          ← NEW (captured ExperienceBundle)
```

### Tier placement

OHFY-Ecom becomes **Tier 3** (domain backend) alongside OHFY-OMS / OHFY-WMS / OHFY-REX. Depends on Platform + Tiers 0–1 only.

**Why Tier 3, not Tier 4:**
- C4 model (`docs/engineering/design/2026-02-05-c4-model.md`) explicitly diagrams `Ecom → Platform` — Ecom depends only on Platform, not on a Tier 3 sibling
- ADR-0007 defines Tier 4 as "depends on exactly one Tier 3 backend counterpart" — Ecom has no Tier 3 backend counterpart, so it cannot be Tier 4
- Ecom's contents (storefront, cart, catalog, `RegisterController`, `OrderHistoryController`) make it a self-contained domain parallel to OMS/WMS/REX, not a UI overlay on top of one of them

```
Tier 3: OMS, WMS, REX, Ecom  ← parallel deploy in Group 4
Tier 4: PLTFM-UI, OMS-UI, WMS-UI, REX-UI  ← unchanged
```

`fullDeploy.js` `DEPLOY_GROUPS` Group 4 grows from 3 packages to 4. Group 5 unchanged.

**Naming note:** despite OHFY-Ecom being primarily LWCs (~19 bundles), the package is Tier 3 because it owns its own domain logic (registration flow, order history controller, ecom branding) and has no Tier 3 backend it overlays. Treating Ecom as "another UI package" would force coupling it to OMS, which is wrong — Ecom is a sibling domain to OMS, not a UI for OMS.

---

## Proposed path to completion

### Story breakdown

| # | Story | SP | Effort | Depends on |
|---|---|---|---|---|
| **S0** | Migrate OHFY-Ecom → OHFY-Split as 12th package | 5 | 2.5d | — |
| **S1** | Scratch def + `--enable-ecommerce` flag wiring | 1 | 0.5d | S0 |
| **S2** | Profile automation (CCP + Guest) | 3 | 1.5d | S0 |
| **S3** | Capture ExperienceBundle from reference org | 3 | 1.5d | S0 |
| **S4** | Deploy ExperienceBundle + bootstrap Apex | 3 | 1.5d | S1, S2, S3 |
| **S5** | Big Kahuna agent integration (idempotency, JSON output, snapshot bake) | 2 | 1d | S4 |
| **S6** | Runbook + manual prereq docs | 1 | 0.5d | S5 |

**Epic total: 18 SP · ~9 working days (~2 sprints) solo · ~5–6 days with parallelism**

### Sequencing

```
S0 ──┬─→ S1 ──┐
     │         │
     ├─→ S2 ──┼─→ S4 ─→ S5 ─→ S6
     │         │
     └─→ S3 ──┘
```

After S0 lands, S1 / S2 / S3 are all parallel-safe.

### Story details

#### S0 — Migrate OHFY-Ecom → OHFY-Split (5 SP · 2.5d) **🟥 BLOCKING**

Largest single body of work in the epic. Sub-checklist:

- [ ] Create `OHFY-Split/OHFY-Ecom/force-app/main/default/` directory
- [ ] Copy LWCs, classes, staticresources, customMetadata, namedCredentials, externalCredentials, messageChannels, triggers from `~/Documents/OHFY-Ecom/force-app/main/default/`
- [ ] **Reconcile `objects/` directory** — diff against OHFY-Data-Model; resolve overlaps (object def lives in Data-Model, layout/recordType/listView lives in Ecom)
- [ ] Update `sfdx-project.json` — add 12th package entry, **dependencies: OHFY-PLTFM + OHFY-Service-Locator + OHFY-Utilities + OHFY-Data-Model only** (per C4 model `Ecom → Platform`; do NOT depend on OHFY-OMS)
- [ ] **Rewire CORE → PLTFM dependency.** OHFY-Ecom currently depends on `OHFY-CORE@1.145.0.RELEASED`. Map every `ohfy.<class>` reference to its OHFY-Split equivalent (most CORE classes now live in OHFY-PLTFM or OHFY-Utilities). If a CORE-only class has no Split equivalent, ticket the gap as a follow-up.
- [ ] Bump source API to v65.0 (from OHFY-Ecom's v64.0); fix any compilation errors surfaced
- [ ] Strip explicit `ohfy.` namespace prefixes from Apex (per existing OHFY-Split pattern, commit `77241e32 refactor(apex): drop hardcoded ohfy__/ohfy. namespace from direct apex references`)
- [ ] **Apply DTO pattern (per ADR-0007 DTO).** Audit every `@AuraEnabled` Apex method in OHFY-Ecom that returns or accepts sObjects (`Account`, `Contact`, `Order__c`, `Item__c` etc.). Replace with DTO classes under `OHFY-Ecom/force-app/main/default/DTOs/<domain>/`. This is the largest hidden-cost task in S0 — likely the dominant time sink.
- [ ] Validate LWC `@salesforce/apex/...` imports resolve to migrated controllers
- [ ] Update `OHFY-Split/utilityScripts/fullDeploy.js` `PACKAGES` and `DEPLOY_GROUPS` (**Group 4 + 1**, not Group 5)
- [ ] Run `sf project deploy validate -d OHFY-Ecom/force-app -l RunSpecifiedTests -t "<all _T classes>"` — green deploy validation
- [ ] Update `OHFY-Split/CLAUDE.md` package inventory table (11 → 12 packages, add to Tier 3 row)
- [ ] Add `OHFY-Ecom/CLAUDE.md` mirroring the per-package guidance pattern
- [ ] Archive `~/Documents/OHFY-Ecom` repo (or mark read-only)

**Two risks inside this story:**

1. **`objects/` reconciliation** — if OHFY-Ecom defined custom objects that OHFY-Split has reshaped (per ADR-0008 dormant Pricelist, etc.), conflicts may require schema decisions. Pad +1 SP if conflicts found in first hour.
2. **CORE → PLTFM dependency rewire** — if OHFY-Ecom Apex calls CORE-only classes that have no PLTFM equivalent, that's a gap that may need a Platform-promotion ticket as prerequisite. Pad +2 SP if gaps found.
3. **DTO conversion scope** — the C4 model notes 19 LWC bundles in Ecom. Each LWC's Apex controllers likely return sObjects today. If conversion is mechanical (1:1 sObject → DTO), ~½ day. If sObjects flow through deeply nested logic, could be 1–2 days alone. **Spike-validate during S0's first hour** by sampling 2–3 controllers.

**Realistic S0 range:** 5 SP optimistic, 8 SP pessimistic. The Big Kahuna ROI still pays back even at the high end.

#### S1 — Scratch def + flag wiring (1 SP · 0.5d)

- Update `config/project-scratch-def.json` per Confluence: features `Communities`, `Sites`; settings `communitiesSettings.enableNetworksEnabled`, `experienceBundleSettings.enableExperienceBundleMetadata`
- Same updates to `config/snapshot-clone-scratch-def.json`
- Add `--enable-ecommerce` flag detection to `fullDeploy.js`
- Add `npm run enable:ecommerce` script to `package.json`

#### S2 — Profile automation (3 SP · 1.5d)

- `utilityScripts/enableEcommerceProfile.js` — pattern mirrors `update-field-level-security.js`
- Walks `sfdx-project.json` (now includes OHFY-Ecom) for objects/fields/classes/CMDTs
- Builds cloned Customer Community Plus profile XML
- Reconciles Confluence object list against ADR-0008:
  - **Drop** dormant: `Pricelist__c`, `Pricelist_Item__c`, `Promotion__c`, `Promotion_Brand__c`, `Promotion_Product__c`, `Promotion_Invoice_Item__c`, `Promotion_Supplier__c`
  - **Add** new: `Placement__c` (canonical customer-specific pricing per ADR-0008)
  - **Resolve** outdated: confirm whether `Invoice__c`/`Invoice_Item__c` survive or are replaced by `Invoice_Group__c`/`Invoice_Adjustment__c`
- Applies Guest Profile delta (RegisterController + Account + Contact only)
- OWD updates as separate `SharingSettings` deploy (16 objects)

#### S3 — Capture ExperienceBundle (3 SP · 1.5d)

**Foundation deliverable — S4 cannot start without the captured artifact.**

- Manual one-time setup of reference org per Confluence (unavoidable upfront cost — coordinate with team to identify if a canonical reference org already exists)
- `utilityScripts/captureEcommerceSite.js` — `sf project retrieve start` for `ExperienceBundle`, `Network`, `CustomSite`, `SiteDotCom`
- Strip namespace where appropriate (mirror `syncOrgMetadata.js`)
- Output commits to `OHFY-Ecom/force-app/main/default/experiences/E_Commerce/` (same repo now — no PR shuffle)

#### S4 — Deploy + bootstrap (3 SP · 1.5d)

- `utilityScripts/deployEcommerceSite.js` — deploys captured bundle from `OHFY-Ecom/force-app`
- `orgScripts/bootstrapEcommerceSite.apex` — post-deploy steps not expressible as static metadata:
  - Relax CSP via `Network` settings update
  - Assign cloned profile to site members
  - Activate self-registration page
- E2E acceptance: fresh scratch → `npm run deploy:full -- --create-scratch ecom-test --enable-ecommerce` → curl portal URL → expect 200 with login form

#### S5 — Big Kahuna agent integration (2 SP · 1d)

This is the differentiator from prior scope — explicitly making the bootstrap agent-friendly:

- **Idempotency**: running `--enable-ecommerce` twice on the same alias completes successfully (skips already-applied steps)
- **JSON output mode**: `--output-format json` flag emits structured completion signal:
  ```json
  {
    "status": "success",
    "alias": "ecom-test",
    "siteUrl": "https://ecom-test-...lightning.force.com/E_Commerce",
    "profileName": "Ohanafy Community User",
    "elapsedSeconds": 487
  }
  ```
- **Snapshot bake**: confirm the captured ExperienceBundle survives a Dev Hub snapshot round-trip via `createScratchOrgFromSnapshot.js`. If yes, agents pay zero deploy cost on spin-up.
- **Failure mode**: structured error output with actionable next-step (e.g. "Manual prereq missing: Register Domain Name in Setup")

#### S6 — Runbook + docs (1 SP · 0.5d)

- `docs/engineering/ci-cd/ecommerce-scratch-bootstrap.md`
- Document the 2 unavoidable one-time-per-org manual prereqs:
  1. Setup → Digital Experiences → Enable Digital Experiences
  2. Setup → Sites and Domains → Register Domain Name
- Document `--enable-ecommerce` flag and JSON output mode
- Update `OHFY-Split/CLAUDE.md` Commands section
- Add `OHFY-Ecom/CLAUDE.md` package overview

---

## Risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | **DTO conversion scope** — every `@AuraEnabled` method returning sObjects must be DTO-ified per ADR-0007 (DTO). 19 LWCs × multiple Apex controllers each. | 🔴 Critical | Spike-sample 2–3 controllers in first hour of S0 to estimate. Pad S0 to 8 SP if non-trivial. |
| 2 | **`objects/` directory conflicts during S0** — OHFY-Ecom may define objects that OHFY-Split has reshaped per ADR-0008 | 🟡 High | Diff in first hour of S0; if non-trivial conflicts, escalate before continuing. Pad +1 SP. |
| 3 | **OHFY-CORE → PLTFM dependency rewire** — Ecom Apex calling CORE-only classes that have no Split equivalent | 🟡 High | Validate during S0 via deploy validation. Worst case: ticket Platform-promotion gap as a prerequisite. |
| 4 | **Reference org for S3 capture** — does a canonical site config exist? | 🟡 Medium | Identify before S3 kickoff. If none, S3 doubles to capture *and* configure (+1 SP). |
| 5 | **API v64 → v65 migration breaks ExperienceBundle deploy** | 🟢 Low | S3 captures bundle on v65 directly; tests in S4 |
| 6 | **Big Kahuna idempotency edge cases** — re-running on a partially-bootstrapped scratch | 🟢 Low | Explicit S5 scope; covered by acceptance criteria |
| 7 | **Confluence object list outdated** | 🟢 Low | S2 reconciles via ADR-0008 |

**Risk severity dropped significantly post-decision.** Previous critical risk (OHFY-CORE coexistence) is gone entirely.

---

## Open questions for refinement

1. **OHFY-Ecom package naming** — keep `OHFY-Ecom` (preserves brand recognition) or rename to `OHFY-ECOM-UI` (matches Tier 4 naming convention)?
2. **`objects/` ownership split** — for objects that exist in both repos today, does the object definition live in OHFY-Data-Model and layouts/recordTypes live in OHFY-Ecom, or does OHFY-Ecom own additional Ecom-specific objects entirely?
3. **Reference org for S3** — production? staging? An engineer's dev scratch?
4. **CSP relaxation** — deploy via `<NetworkSecurityRestriction>` metadata, or post-deploy Apex? (S4 currently assumes Apex)
5. **Members config** — site assigns by Profile or Permission Set? Confluence shows both options; need to pick one for the script
6. **Login form CSS** — the inline `<style>` block in Confluence Head Markup is brittle. Move to `OhfyGlobalStyles.css` static resource (BMS-3923 territory) or keep inline?
7. **OHFY-Ecom repo retirement** — archive immediately after S0 lands, or keep as read-only reference for 1–2 sprints?

---

## Suggested ticket structure

**Parent epic:** `Big Kahuna — Auto-provision E-Commerce site on scratch` · labels `devex`, `ecom`, `gulf`, `big-kahuna`, `phase-1-crawl`

**Children (create together; S0 must land first):**

1. `chore(ecom): migrate OHFY-Ecom contents into OHFY-Split as 12th package` — **S0** (blocking)
2. `feat(devex): scratch def + --enable-ecommerce flag` — S1
3. `feat(devex): auto-configure Customer Community Plus + Guest profiles` — S2
4. `chore(ecom): capture E-Commerce ExperienceBundle into OHFY-Split` — S3
5. `feat(devex): deploy ExperienceBundle + bootstrap Apex on scratch` — S4
6. `feat(devex): Big Kahuna agent integration (idempotency, JSON output, snapshot bake)` — S5
7. `docs(devex): scratch-org E-Commerce bootstrap runbook` — S6

---

## Force multiplier value

**For the human team:**
- **BMS-3923** Branding — token layer + theme work no longer needs manual site setup
- **BMS-3926** Registration — split children developed against consistent dev environments
- **BMS-4049** Cart pricing spike — validation on a real scratch instead of bespoke env
- **BMS-3921** Engagement Notifications — UI development against a real site
- **BMS-3929** Order history & reorder — same
- **QA reproducibility** — ticket validation no longer dependent on engineer's local setup

**For Big Kahuna:**
- Parallel agent dispatch across multiple tickets without scratch-setup serialization
- Snapshot-baked bundles → near-instant scratch availability per agent
- Single repo means agents don't manage cross-repo state
- JSON output gives the dispatcher a deterministic completion signal

This is a **devex force multiplier** — does not deliver direct customer value but eliminates 15+ engineering hours/week AND unblocks AI-driven parallel ticket execution.

---

## Status log

- **2026-05-05** — Note seeded with cross-repo architecture
- **2026-05-05** — Decision pitched & accepted: migrate OHFY-Ecom → OHFY-Split. Note refined; cross-repo plumbing dropped, migration story added as S0 blocking work, Big Kahuna integration story added as S5.
- **2026-05-05** — Grounded against ADR-0006, ADR-0007 (tier), ADR-0007 (DTO), ADR-0008, and C4 model. Tier placement corrected from 4 → 3. DTO conversion identified as the dominant hidden cost in S0. CORE → PLTFM dependency rewire flagged as separate sub-task. Risk severity increased on DTO conversion (Critical).
