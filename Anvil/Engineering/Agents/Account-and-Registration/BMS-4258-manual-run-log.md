# BMS-4258 — Manual Run Log
**Ticket:** [BMS-4258 Multi-Account Registration on Ecomm](https://ohanafy.atlassian.net/browse/BMS-4258)
**Branch:** `feat/multi-account-registration-bms-4258`
**Worktree:** `/Users/alvarosanchez_1/OHFY-Split-BMS-4258`
**Purpose:** Document every step of this manual implementation run so the workflow can be replicated for Experience Cloud / eCommerce development.

---

## Ticket Context

**Story:** As a retailer contact who operates multiple businesses, I want to register all my businesses during a single onboarding flow, sign up once, and switch between accounts after login.

**Acceptance Criteria (5 scenarios):**
1. **Multi-business registration** — single Contact + single Experience Cloud User created; welcome email sent once; post-login access to order history/cart/profile for any registered business.
2. **Duplicate contact on one business** — blocks registration, surfaces error naming the conflicting business, no partial records, returns to Step 2 with data preserved.
3. **Expired alcohol license on one selected business** — blocks progression to Step 2, names the specific business, allows deselecting and proceeding.
4. **Username already exists** — blocks registration, existing duplicate-user error, no Contact or Account relationships created for any selected business.
5. **Single-business regression** — existing single-business flow unchanged.

**Out of scope:** post-login account-switcher UI (separate ticket).

---

## Manual Run Log

> **Instructions:** Fill in each step as you go. Note decisions, surprises, and anything that would differ in an Experience Cloud / LWR site vs. internal LEX development.

### Step 1 — Orientation

**Started 2026-06-11 23:07.**

- Worktree `/Users/alvarosanchez_1/OHFY-Split-BMS-4258` on branch `feat/multi-account-registration-bms-4258`, clean, at `e4cc770c` (= `origin/main`). PR will target `main` — ecom packages (`OHFY-eCommerce/`, `OHFY-eCommerce-UI/`) only exist on the main lineage, NOT on develop.
- Repo has `org-metadata/experience-site/digitalExperiences/site/E_Commerce1/` (site bundle), `org-metadata/experience-site/profiles/Ohanafy Community User.profile-meta.xml`, and `orgScripts/e-commerce/setup-site.sh` (10-step idempotent site bootstrap).
- Lane org alias per `_shared/orgs.md`: **`ecom-account`** (Account & Registration lane) — not yet claimed.
- Pre-seeded org-issues to expect: (a) pool snapshot is built from develop → ecom packages will be missing after claim and must be deployed on top; (b) Twilio ExternalCredential is unconfigured on fresh orgs — ignore unless SMS is in scope (it isn't here).

#### Skill gaps

1. **`.claude/skills/ecom-setup/SKILL.md` and `.claude/skills/ecom-done/SKILL.md` do not exist** — not in this worktree, not in the main checkout, not anywhere in git history (`git log --all -- '.claude/skills/ecom-setup*'` is empty). The orchestration prompt and `_shared/org-issues.md` both reference them as if they exist. They need to be authored from scratch; this run log is the source material. Until then, the authoritative recipe is `orgScripts/e-commerce/setup-site.sh` itself plus this log.



### Step 2 — Claim an Org

**Started 2026-06-11 23:08.**

```bash
bash utilityScripts/claim-dev.sh ecom-account
```

- `OHFY_API_TOKEN` was already in env, so the script skipped SSM/AWS SSO entirely — no `aws sso login` needed (orchestration agents should always rely on the env var path).
- Claim returned instantly: alias `ecom-account`, orgId `00DEk00000iGQy7MAG`, org user `test-rzvl6t95l69x@example.com`.
- Org baseline SHA reported by the pool: `d2f1eefe3afe909a2796e5e6760fad6199f94603`. The script then auto-ran an `sfdx-git-delta` deploy from that baseline → our HEAD (`e4cc770c`, main lineage) — this is the mechanism that layers the ecom packages onto the develop-built pool snapshot. Deploy ID `0AfEk00000cf3GzKAI`, running in background.
- **Recipe note for agents:** `claim-dev.sh` output is full of TTY spinner redraws (~100k tokens of noise for one deploy). Agents should not tail the raw output; poll `sf project deploy report --job-id <id> -o <alias>` instead, or the wrapper should gain a `--concise`/CI flag.
- **23:14 — delta deploy `Status: Succeeded`** (~5 min). The ecom packages (Apex + `OHFY-eCommerce-UI` LWCs) are confirmed on the org — the pre-seeded org-issue "pool org may lack ecom packages" is handled automatically by the claim script's baseline-delta sync; no separate package deploy was needed. Instance: `https://stream-goldengate-508-dev-ed.scratch.my.salesforce.com`.
- 23:15 — kicked off site bootstrap:

```bash
bash orgScripts/e-commerce/setup-site.sh ecom-account
```

- **23:48 — setup-site.sh completed** (~30 min wall clock, exit 0). All 10 steps ran clean: Digital Experiences already enabled on the snapshot, site `E-Commerce` created + published, bundle `E_Commerce1` deployed, Ohanafy Community User profile deployed, OWD overrides + ecom perm sets deployed, network membership + guest perms assigned, FLS updated, test user created.
- Storefront test user (the ecomtest_% pattern that `resolveEcomCredentials()` expects):
  - `SF_LOGIN_URL=https://stream-goldengate-508-dev-ed.scratch.my.site.com/vforcesite/login`
  - `SF_USERNAME=ecomtest_00dek00000igqy7@example.com`
  - `SF_PASSWORD=Ecomtest1!`
- **Ecomm divergence:** `create-test-user.apex` must be run TWICE by design (Contact insert and User insert can't share an Anonymous Apex transaction — MIXED_DML). setup-site.sh handles this internally; anyone scripting around it must too.

#### Org prerequisite discovered (new-scope AC1)

- `SELECT Id FROM AccountContactRelation` → **"sObject type 'AccountContactRelation' is not supported"** on the fresh pool org. "Contacts to Multiple Accounts" is OFF by default.
- Fix is pure metadata, no Setup-UI clicks (contradicts the scope report's claim that it's "not deployable metadata"):

```bash
# settings/Account.settings with <enableRelateContactToMultipleAccounts>true</enableRelateContactToMultipleAccounts>
sf project deploy start --metadata-dir <tmp> -o ecom-account --test-level NoTestRun --wait 10   # → Succeeded
```

- Note: the ACR sobject takes a little while to appear in the data API after the settings deploy (same lag pattern as the Communities settings deploy in setup-site.sh step 0). Poll until queryable.
- **→ ecom-setup skill must gain this step** (and the repo should carry the settings file, e.g. under `orgScripts/e-commerce/`, or in a package's `settings/` folder so it deploys with the ecosystem).



### Step 3 — Understand the existing registration flow

**23:10–23:15 (ran in parallel with org claim, via an Explore subagent).**

**Frontend** — `OHFY-eCommerce-UI/force-app/main/default/lwc/ecomRegister/` (JS 623 lines, HTML 701 lines). 3-step wizard:
1. Business search (name + ZIP + optional state license #) → selectable result cards; **single `selectedAccount` only**.
2. User details (first/last/email/phone/jobTitle/smsOptIn) with inline validation; "Change" returns to step 1.
3. Confirmation screen → "Go to Login".

Apex imports: `Ecom_UI_Wrappers.searchAccounts`, `Ecom_UI_Wrappers.registerUser`, `Ecom_UI_Wrappers.getBrandingResource`.

**Apex chain** — `Ecom_UI_Wrappers` (OHFY-eCommerce-UI, facade) → `RegisterController` (OHFY-eCommerce, `controllers/`):
- `searchAccounts(businessName, zipCode, stateLicenseNumber)` → `List<Map<String,String>>` (`id,name,city,state,alcoholLicenseRequired`). License digits-normalized; accounts with `Alcohol_License_Required__c=true` are excluded when no license given; **throws** "Your license has expired…" when required license has `License_Expiration_Date__c < today`.
- `registerUser(accountId, firstName, lastName, email, phone, jobTitle, smsOptIn)` → userId. Sequence: validate inputs → Account exists → duplicate Contact check (Email+AccountId) → duplicate Username check (User.Username = email) → insert Contact (AccountId, SMS opt-in fields) → resolve 'Ohanafy Community User' profile → insert User (ContactId link) → on User-insert failure deletes the Contact (manual compensation, no savepoint).
- Welcome email: User AFTER_INSERT → `UserTriggerService` filters ecom-profile users → enqueues `Q_SendEmailVerification` → `System.UserManagement.sendAsyncEmailConfirmation(userId, null, networkId, '/')` against the Live 'E-Commerce' Network.
- Errors wrapped via `U_ParseErrorMessage.wrapErrorMessage()` → AuraHandledException.

**Data model**: strictly single-account — `Contact.AccountId` + `User.ContactId`. **No AccountContactRelation usage anywhere in the flow.** Relevant Account fields: `State_License_Number__c`, `License_Expiration_Date__c`, `Alcohol_License_Required__c`.

**Site metadata**: route `…/E_Commerce1/sfdc_cms__route/Register/content.json` (`routeType: self-register`) + view `…/sfdc_cms__view/register/content.json` embedding `ohfy:ecomRegister`.

**Permissions**: guest perm set `Ohanafy_Ecom_Guest_Access` (classAccesses: RegisterController, Ecom_UI_Wrappers, …; Contact create=true) — registration runs as **guest user**, an LWR/Experience-Cloud-specific concern with no LEX equivalent. Profile `Ohanafy Community User.profile-meta.xml` carries the post-login classAccesses.

**Existing tests**: `RegisterController_T.cls` (457 lines, good coverage of search/validation/duplicates), `Ecom_UI_Wrappers_T.cls` (delegation). **No Jest tests for ecomRegister; no Playwright registration spec** — both will be net-new for this ticket.

**Implications for multi-account (BMS-4258)**:
- Need multi-select in Step 1 + plural plumbing through wrapper/controller.
- Cross-account linkage requires **AccountContactRelation** (Contact keeps one primary AccountId; additional businesses become ACRs) — requires org setting `AccountSettings.enableRelateContactToMultipleAccounts` (deployable metadata; must be added to org setup recipe for fresh orgs).
- Atomicity across N accounts (AC2/AC4 "no partial records") suggests `Database.setSavepoint`/rollback rather than the existing manual delete-Contact compensation.



### Step 4 — Plan the change

**23:20.** Decisions (with rationale, for the orchestration recipe):

1. **Data model: AccountContactRelation (ACR), no custom junction.** Ticket mandates single Contact + single User; the Contact keeps `AccountId` = first selected business (primary), every other business becomes an ACR row. When "Contacts to Multiple Accounts" is on, Salesforce auto-creates a *direct* ACR for `Contact.AccountId`, so one ACR query covers all of a contact's businesses. Matches the existing memory note: retailer entities are separate Accounts; nothing new in OHFY-Data-Model.
2. **Org prerequisite:** `AccountSettings.enableRelateContactToMultipleAccounts` must be true. This is deployable settings metadata — must be verified/enabled on the claimed org AND added to the ecom-setup recipe, or registration breaks on fresh orgs (ACR sobject doesn't exist until enabled).
3. **Apex API: add a new method, don't mutate the old one.** `Ecom_UI_Wrappers.registerUser(accountId, …)` is a published `@AuraEnabled` managed-package API and `@AuraEnabled` doesn't support overloads — so add `registerUserMultiAccount(List<String> accountIds, firstName, lastName, email, phone, jobTitle, smsOptIn)` in `Ecom_UI_Wrappers` delegating 1:1 to a new `RegisterController.registerUserMultiAccount`. Old single-account method stays untouched (AC5 regression safety + package compat). **→ contract change, log in _shared/contracts.md for the ACCT-3932 agent.**
4. **Expired-license check moves from search-time to selection-time.** Today `searchAccounts` throws on any matched expired-license account, killing the whole search. AC3 requires: block *progression to Step 2*, name the business, allow deselecting. So `searchAccounts` stops throwing and instead returns a per-account `licenseExpired` flag; the LWC blocks Continue while any selected account has it, naming the business(es). Single-business UX still sees the same error text, just at Continue instead of at search → AC5-compatible reading, but **flag to ticket owner: this is a deliberate behavior change to search**.
5. **registerUserMultiAccount sequence:** validate inputs → query all selected Accounts (fail if any missing) → duplicate-contact check via ACR + direct Contact.Email across *all* selected accounts, error names the conflicting business (AC2) → duplicate-username check (AC4) → `Database.setSavepoint()` → insert Contact (primary = first account) → insert ACRs for remaining accounts → insert User → on any failure roll back to savepoint (replaces the old manual delete-Contact compensation; guarantees "no partial records" incl. ACRs). Welcome email stays trigger-driven off the single User insert → sent exactly once (AC1).
6. **Permissions:** registration runs as the **guest user** → `Ohanafy_Ecom_Guest_Access` perm set needs `AccountContactRelation` read+create. No new Apex classes → no new `apexClassAccesses` in profile or perm set needed (RegisterController/Ecom_UI_Wrappers already granted).
7. **Frontend (`ecomRegister`):** `selectedAccount` → `selectedAccounts[]`; card toggle becomes additive multi-select; Step 2 shows the list of selected businesses; Continue blocked w/ named error when a selected business has `licenseExpired`; `registerUserMultiAccount` called with `accountIds`. Run `/ohfy-design` during implementation (UI ticket).
8. **Scope interpretation (AC1 "access for any registered business")**: the ACRs make every business reachable post-login; the account-switcher UI that surfaces them is explicitly out of scope (separate ticket). Smoke test = login lands on primary business experience + ACR rows exist.
9. **Tests:** extend `RegisterController_T` (multi happy path, AC2 dup-contact names business, AC3 flag, AC4 dup username no-partial-records, AC5 single regression) + `Ecom_UI_Wrappers_T` delegation; net-new Jest spec for `ecomRegister` (none exists today); net-new Playwright registration spec via `/playwright-ecom` (none exists today).

#### Skill gaps

2. **Per-package CLAUDE.md files contradict the ecom workflow**: `OHFY-eCommerce/CLAUDE.md` says "Default base branch for PRs: develop" and "Branch naming: story/BMS-####-description" — both wrong for ecom work (PRs target `main`; repo convention is `feat/<name>-bms-<num>`). `OHFY-eCommerce-UI/CLAUDE.md` has the right base (`main`) but the same wrong branch naming, and claims "OHFY-eCommerce-UI does not (yet) have an Ecom_UI_Wrappers facade" — it does (`Ecom_UI_Wrappers.cls` exists there). Autonomous agents reading these will follow the wrong instructions. Fix both files.



### Step 4b — PIVOT: ticket re-scoped (2026-06-11 ~23:30)

**Alvaro re-scoped the ticket mid-run.** Multi-account **registration is dropped** — the wizard stays single-business. New scope:

- Contact↔multi-Account linkage happens **in Salesforce** via native **Contacts to Multiple Accounts** (AccountContactRelation) — created by admin/ops/data load, not by the registration flow.
- The storefront deliverable is the **account switcher**: a logged-in contact related to N accounts can switch their active business in the ecom site, and account-scoped surfaces (shop/pricing, cart, order history, profile) follow.
- Dev direction: link the site-setup ecom test user/contact to multiple Accounts via ACR and build against it.

Actions taken: rewrote BMS-4258 summary + description + 5 ACs in Jira (see ticket). **The Step 4 plan above is obsolete** except for: decision 1 (ACR, no custom junction — now even more central), decision 2 (`enableRelateContactToMultipleAccounts` org-setup prerequisite), and the permissions insight (community user now needs ACR **read** — guest no longer needs ACR create since registration doesn't create ACRs).

**Process note for the orchestration recipe:** mid-flight ticket re-scopes happen; the agent loop must re-read the ticket before each phase rather than caching ACs from kickoff, and must keep the run log's obsolete sections marked rather than deleted (audit trail).

### Step 4c — New-scope plan (account switcher)

**23:55.** Architecture mapping (Explore subagent over userDataService / controllers / channels) found the design practically pre-made:

- **Every account-scoped storefront surface already takes `accountId`/`customerId` as an LWC-supplied parameter** (OrderHistoryController.getOrderHistory/getOrderedProducts, DraftInvoiceController.initializeDraftInvoice + cart ops, Ecom_UI_Wrappers.resolveCatalogPricing → S_FrontLinePricing). None derive the account from `UserInfo.getUserId()` server-side.
- All of them get that id from **one choke point**: the `userDataService` LWC singleton (`userDataService.js:805-822` — `User.Contact.AccountId` → `getAccountFields` → `this.accountId/customerId` → broadcast on `UserDataChannel`). `draftInvoiceService` mirrors `customerId` from it; `navigationMenu` re-inits the draft service off the broadcast.
- **Zero existing multi-account awareness** anywhere (no ACR queries, no sessionStorage, no switcher UI).

**Plan — files:**
1. NEW `OHFY-eCommerce/.../classes/controllers/AccountSwitcherController.cls` + `_T` — `getRelatedAccounts()`: server-side `UserInfo.getUserId()` → `User.ContactId` → ACR query (`IsActive=true`, fields AccountId, Account.Name/BillingCity/BillingState, IsDirect) → `List<Map<String,String>>` (`id,name,city,state,isPrimary`). Server-derived on purpose: the related-accounts list is the *authorization boundary* for switching, so it must not trust client input.
2. `Ecom_UI_Wrappers.cls` — `@AuraEnabled getRelatedAccounts()` passthrough (**additive contract change → _shared/contracts.md**).
3. `userDataService.js` — store `relatedAccounts`; on init, apply `sessionStorage["ohfy-selected-account-id"]` override **only if it's in relatedAccounts**; new `switchAccount(accountId)` (validate → persist → full re-init → broadcast); expose `relatedAccounts` + `hasMultipleAccounts` in `getUserData()` payload.
4. NEW `lwc/ecomAccountSwitcher/` + Jest — header dropdown listing related accounts, active one marked; hidden when ≤1 account (AC4). Self-contained: imports the userDataService singleton directly.
5. `navigationMenu.html` — embed `<c-ecom-account-switcher>` in desktop header (next to profile container) + mobile drawer.
6. `org-metadata/experience-site/profiles/Ohanafy Community User.profile-meta.xml` — `apexClassAccesses` for AccountSwitcherController + `objectPermissions` read on AccountContactRelation (ecom-done contract: every new controller needs the profile grant or it 500s on fresh orgs).
7. `orgScripts/e-commerce/` — commit `Account.settings` (enableRelateContactToMultipleAccounts) + wire into `setup-site.sh`; NEW `link-test-user-accounts.apex` to relate the ecomtest contact to extra seed Accounts via ACR (dev + Playwright fixture).
8. Cart-on-switch semantics: draft invoices are per-Account (`Invoice__c.Customer__c`), so switching re-inits `draftInvoiceService` for the new account — the old account's draft cart simply stays parked on that account (no merge). Decision logged; revisit if PO disagrees.

### Step 5 — Implement



**00:00–00:45 (June 12).** Files implemented (new-scope plan, all items):

| File | Change |
|---|---|
| `OHFY-eCommerce/.../controllers/AccountSwitcherController.cls` (+`_T`, +meta) | NEW — `getRelatedAccounts()`, server-derived from UserInfo; **fully dynamic ACR references** (see gotcha below); Logger-instrumented catch; degrades to `[]` when feature off |
| `OHFY-eCommerce-UI/.../classes/Ecom_UI_Wrappers.cls` | + `getRelatedAccounts()` passthrough |
| `OHFY-eCommerce-UI/.../classes/Ecom_UI_Wrappers_T.cls` | + delegation test |
| `OHFY-eCommerce-UI/.../lwc/userDataService/userDataService.js` | + `relatedAccounts`, sessionStorage override in `initUserDetails`, `switchAccount()`, `loadRelatedAccounts()`, `getStoredAccountOverride()`; payload gains `relatedAccounts`/`hasMultipleAccounts`; new broadcasts `ACCOUNT_SWITCH_STARTED`/`ACCOUNT_SWITCHED` |
| `OHFY-eCommerce-UI/.../lwc/ecomAccountSwitcher/` (+`__tests__/`) | NEW — header dropdown, hidden when ≤1 account; 6 Jest tests |
| `OHFY-eCommerce-UI/.../lwc/navigationMenu/navigationMenu.{html,js}` | embeds switcher; handles `ACCOUNT_SWITCHED` → `draftInvoiceService.reset()` + re-init (cart follows account) |
| `org-metadata/experience-site/profiles/Ohanafy Community User.profile-meta.xml` | + classAccess `AccountSwitcherController`, + objectPermission `AccountContactRelation` (read) |
| `orgScripts/e-commerce/account-settings/Account.settings` | NEW — committed settings file |
| `orgScripts/e-commerce/setup-site.sh` | NEW step 0.5 — idempotent Contacts-to-Multiple-Accounts enablement |
| `orgScripts/e-commerce/link-test-user-accounts.apex` | NEW — links ecomtest contact to 2 extra seed accounts via ACR (dev/Playwright fixture) |

**Key gotchas captured (recipe material):**

1. **Static `AccountContactRelation` references don't compile on orgs without the feature.** Any `new AccountContactRelation(...)` or `List<AccountContactRelation>` cast in package code would break *every other lane's* deploys (their pool orgs don't have the setting). Everything goes through `SObject` + `Schema.getGlobalDescribe().get('accountcontactrelation')` + QueryService dynamic SOQL. Same applies to the test class and the org script.
2. **Ecom Tailwind ≠ skill Tailwind**: OHFY-eCommerce-UI uses **unprefixed** Tailwind classes + `loadOhfyTheme` (customer-theme palette), NOT the `tw-` prefix + `--ohfy-*` token rules the `/ohfy-design` skill mandates (those are for internal Tier-4 packages). Followed package-local conventions (matched navigationMenu's profile-dropdown styling). **→ Skill gap #3: `/ohfy-design` needs an ecom/LWR section.**
3. No portal-user creation in Apex tests (MIXED_DML + role tarpit — no precedent in the codebase either); used `@TestVisible contactIdOverrideForTest` injection instead.
4. Tests green: ecomAccountSwitcher 6/6; **full repo Jest suite 83 suites / 646 tests pass**.

#### Setup-UI investigation (Chrome DevTools MCP, no CLI equivalent)

Navigated to Setup → Feature Settings → Sales → Accounts → **Account Settings** (`/lightning/setup/AccountSettings/home`, classic page in iframe):

- The checkbox **"Allow users to relate a contact to multiple accounts" shows CHECKED** — the AccountSettings metadata deploy *did* persist the flag. Yet `sf sobject describe -s AccountContactRelation` → "resource does not exist" and SOQL → "not supported". **Split-brain: setting flag ≠ object provisioning.**
- Attempted remediation via the UI: clicked **Edit → Save** on the Account Settings page (a full save cycle can trigger provisioning that a metadata deploy skips). Polling the data API for the ACR object after the save.

#### Open question being debugged (org-side)

`AccountSettings.enableRelateContactToMultipleAccounts` deploy reports `Succeeded, changed=True` **but the ACR sobject still isn't queryable ~30 min later**. Suspect: pool scratch-org snapshot lacks the `ContactsToMultipleAccounts` scratch-def feature, making the settings deploy a silent no-op (same class of problem as the Communities setting in setup-site.sh step 0 — but that one CAN be enabled post-hoc). Retrieval of the org's actual AccountSettings in flight. If confirmed: **escalate to _shared/blockers.md** — the OHFY-CICD snapshot builder needs `"ContactsToMultipleAccounts"` added to the pool scratch def, and until then ACR-dependent dev/testing can't happen on pool orgs.

### Step 6 — Test in org



**01:00–01:50 (June 12).**

- Deployed both ecom packages to `ecom-account` — first attempt failed on **source-tracking conflicts** (pool orgs come with tracked state); `--ignore-conflicts` is mandatory, same as claim-dev.sh uses. Second attempt: Succeeded, 123/123 components.
- **Apex tests on org: 74/74 pass** (`AccountSwitcherController_T, Ecom_UI_Wrappers_T, RegisterController_T` — includes full registration regression suite). Note: classes run namespaced (`ohfy.X_T`) on pool orgs.
- **Coverage caveat (DoD item 4):** `AccountSwitcherController` reports **34%** on this org — the ACR query/mapping lines are unreachable while the feature is off (tests skip-guard). Restructured guards (contact-resolution before feature-check) + added a feature-disabled test to maximize what IS coverable here. On a feature-enabled org (packaging/CI), coverage will be ~95%. Flagged for the PR description.
- ESLint/prettier clean after fixing 1 error + 4 warnings in my new/changed files (`document.body.innerHTML` in the Jest spec → node removal loop; unused `catch (error)` params → bare `catch`).
- **Live storefront smoke test (Chrome DevTools MCP)** as `ecomtest_…@example.com`:
  - Login + home page render normally; header shows logo/search/nav/cart/profile and **no account switcher** — AC4 (single-account regression) verified live; screenshot saved next to this log (`bms-4258-storefront-single-account-header.png`).
  - No console errors from the new code path (`getRelatedAccounts` returns `[]` cleanly with the feature off).
  - Pre-existing (NOT caused by this change): draft-invoice init 400 `INSUFFICIENT_ACCESS_ON_CROSS_REFERENCE_ENTITY` on the Sales-Rep User id — community user can't see the internal User. Logged to `_shared/org-issues.md`; the Cart lane will hit this.
- **Multi-account live verification blocked** — see `_shared/blockers.md` (pool snapshot lacks `ContactsToMultipleAccounts` scratch feature; settings deploy + Setup-UI save both fail to provision the ACR object).

### Step 7 — Pre-PR checks



**02:00–02:20 — Playwright (via /playwright-ecom skill)**

- New spec `test-automation/tests/ecom/account-switcher.spec.ts` (3 scenarios + auth setup). **Runtime feature detection**: `beforeAll` probes ACR via `soql()` in try/catch; multi-account scenarios `test.skip` with a reason naming `link-test-user-accounts.apex`; the AC4 absence-assertion runs everywhere.
- **Gotcha applied from LEARNINGS**: re-ran `sf community publish --name "E-Commerce" -o ecom-account` after the LWC deploy — the LWR site serves a stale view bundle otherwise (absence assertions would pass for the wrong reason). Note: publish ran fine non-interactively, contradicting the old LEARNINGS note that auto-mode blocks it (LEARNINGS updated).
- Run result: `2 passed, 2 skipped (35.2s)` — exactly the designed degradation on a feature-less pool org.
- LEARNINGS.md gained 2 entries (runtime feature-skip pattern; publish-after-deploy correction).

### Step 7 — Pre-PR checks (working-tree state — nothing committed yet)

| Check | Result |
|---|---|
| `npm run prettier:verify` | ✅ clean |
| `npm run lint` (changed LWCs) | ✅ clean (fixed 1 error + 4 warnings during dev) |
| Jest full suite | ✅ 83 suites / 646 tests |
| Apex tests on org | ✅ 74/74 (`AccountSwitcherController_T`, `Ecom_UI_Wrappers_T`, `RegisterController_T`) |
| Playwright (chromium, ecom config) | ✅ 2 passed / 2 feature-skipped |
| Stray debug output in diff | ✅ none (link-test-user-accounts.apex `System.debug` is intentional script output) |
| Deploy validation | ✅ both packages deployed to ecom-account (123/123) — formal `sf project deploy validate` to run pre-PR |
| Coverage ≥90% on touched classes | ⚠️ `AccountSwitcherController` 34% **on this org** — ACR lines unreachable while feature off; ~95% expected on feature-enabled org. Needs explicit disposition in the PR. |
| Branch synced with base (`main`) | ✅ cut from `e4cc770c` = current origin/main |
| Commits | ⏳ none yet — awaiting Alvaro's go (no-auto-commit policy) |

Remaining before PR: `/document` skill (customer-facing docs), `/code-review` on the final diff, commit + `gh pr create` (base `main`) — all pending Alvaro.

### Step 6b — Blocker fix validated on a throwaway scratch org (2026-06-12 afternoon)

- Added `"ContactsToMultipleAccounts"` feature + `accountSettings.enableRelateContactToMultipleAccounts` to `config/project-scratch-def.json` (working tree; rides with the PR — this is the reviewable half of the blockers.md ask).
- Created a one-off scratch org `ecom-acr` from it (approved exception to pool-only policy): **`AccountContactRelation` was provisioned and queryable from minute zero.** Fix proven; OHFY-CICD just needs the same feature line in the snapshot scratch def.
- **Gotcha**: `sf org create scratch` from this repo fails with *"The ancestor for ancestorVersion HIGHEST can't be found. Package ID OHFY-eCommerce"* — the ecom packages have no released versions on the dev hub yet. `--no-ancestors` is required for direct scratch creation until ecom 2GP versions exist.
- Org was released immediately on Alvaro's instruction (before deploy:full/site setup — switcher still not yet seen live anywhere). `npm run org:release` 400s on non-pool orgs ("Org was not found in pool"); direct-created scratches need `sf org delete scratch` instead.
- **Design refined per Alvaro**: scratch def carries the *feature only* (capability — cannot be added post-creation); the *setting* is NOT enabled at org creation — `setup-site.sh` step 0.5 activates it at script run, so only ecom-lane orgs get the behavior. ⚠️ Untested assumption (ecom-acr released before we could verify): feature-at-creation + setting-via-script provisions ACR the way it does on prod orgs. Verify on the next feature-enabled org.
- Also this session: `link-test-user-accounts.apex` extended to **self-seed mock businesses** (clones of the primary account, `seed:acct-switcher-N`, idempotent) when the org lacks spare accounts, and wired into `setup-site.sh` as step 10.5 — fresh feature-enabled orgs now come out switcher-ready automatically.

### Step 8 — Open PR



---

## Experience Cloud / Ecomm-Specific Notes

> Things that would differ for LEX-only development — capture as you hit them.

| Observation | Why it matters for Ecomm |
|---|---|
| | |

---

## Commands Run (in order)

```bash
# Worktree setup (already done)
git worktree add ../OHFY-Split-BMS-4258 -b feat/multi-account-registration-bms-4258 origin/main

# Add commands here as you run them
```

---

## Blockers / Questions



---

## Time Log

| Phase | Start | End | Notes |
|---|---|---|---|
| Orientation | 06-11 23:07 | 23:10 | repo/skills/shared-docs survey; skill gap #1 found |
| Org claim + delta deploy | 23:08 | 23:14 | parallel with orientation; delta carried ecom pkgs |
| Flow mapping (registration) | 23:10 | 23:15 | Explore subagent, parallel with claim |
| Site setup (setup-site.sh) | 23:15 | 23:48 | ~30 min wall; test user created |
| Plan v1 (obsolete) | 23:20 | 23:30 | multi-account registration plan |
| **PIVOT — ticket re-scoped** | ~23:30 | 23:40 | Jira rewritten; switcher scope |
| Architecture mapping (account context) | 23:40 | 23:55 | Explore subagent |
| ACR enablement debugging | 23:30 | 02:00 | interleaved; ends in hard blocker (snapshot feature) |
| Implementation | 00:00 | 00:45 | 10 files; Jest green |
| Org deploy + Apex tests + lint | 01:00 | 01:50 | incl. coverage guard restructure + live smoke test |
| Playwright | 02:00 | 02:20 | spec authored + run (2 pass / 2 skip) |
| **Remaining** | — | — | /document, /code-review, commit, PR (awaiting Alvaro) |
