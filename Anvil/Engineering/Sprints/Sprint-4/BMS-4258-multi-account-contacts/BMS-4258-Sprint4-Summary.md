# BMS-4258 — Multi-Account Contacts on Ecomm

**Sprint 4 · Account & Registration lane · [BMS-4258](https://ohanafy.atlassian.net/browse/BMS-4258)**

## What it does

Lets a single retailer **contact** (and their one ecom login) belong to **multiple businesses**, and switch the active business inside the storefront — so an operator who runs several bars / shops signs in once and moves between their accounts instead of having a separate login per business.

The contact↔account links are created **in Salesforce** using the native **Contacts to Multiple Accounts** feature (`AccountContactRelation`), not during self-registration. The storefront adds an **account switcher** in the nav bar (desktop) and hamburger menu (mobile); switching re-scopes shop pricing, cart, order history, and profile to the selected business.

> **Re-scoped 2026-06-11.** Originally written as "multi-account *registration*." Direction changed: registration stays single-business; the multi-account capability is Salesforce-side linking + an in-storefront switcher.

## Acceptance criteria

1. **Org capability** — "Contacts to Multiple Accounts" is enabled; a contact can relate to N accounts (one primary via `Contact.AccountId`, others via ACR).
2. **Storefront switcher** — a contact related to multiple accounts can see and switch the active business without logging out; the selection persists for the session.
3. **Context propagation** — after switching, shop/pricing, cart/draft orders, order history, and profile reflect the newly selected business.
4. **Single-account regression** — a contact with one account sees the business name but no switching control; existing behavior unchanged.
5. **Registration regression** — the self-registration flow is unchanged (one business, one welcome email).

## How it works

### Data model

- A contact keeps **one primary account** (`Contact.AccountId`) — the "direct" relation.
- Every additional business is an **`AccountContactRelation`** (indirect) row.
- `AccountContactRelation` only exists when the **Contacts to Multiple Accounts** feature is on. The list of related accounts is the authorization boundary for switching.

### Architecture (read → switch → propagate)

```
ecomAccountSwitcher (LWC)
   │  subscribes to userDataService
   ▼
userDataService (singleton, LWC)
   │  getRelatedAccounts()  ── Ecom_UI_Wrappers.getRelatedAccounts()
   │                            └─ AccountSwitcherController.getRelatedAccounts()  (server-derived from UserInfo)
   │  switchAccount(id) → sessionStorage override → full re-init → broadcast ACCOUNT_SWITCHED
   ▼
navigationMenu + all account-scoped surfaces re-query for the new account
```

- **`AccountSwitcherController`** (OHFY-eCommerce) — `getRelatedAccounts()` derives the contact from `UserInfo.getUserId()` (never trusts client input), queries active ACR rows, returns `{id, name, city, state, isPrimary}`. References `AccountContactRelation` **dynamically** so the package still compiles/deploys on orgs without the feature; degrades to an empty list when off.
- **`Ecom_UI_Wrappers.getRelatedAccounts()`** (OHFY-eCommerce-UI) — 1:1 `@AuraEnabled` passthrough (the facade pattern).
- **`userDataService`** — holds `relatedAccounts`; on init applies a valid `sessionStorage["ohfy-ecom-selected-account-id"]` override over the primary account; `switchAccount(id)` validates against the related list, persists, re-runs the full init (account fields, catalog, pricing, promotions), and broadcasts `ACCOUNT_SWITCHED`. Every account-scoped surface already takes the account id as a parameter from this singleton, so the switch propagates everywhere with no per-surface change.
- **`ecomAccountSwitcher`** (new LWC) — the UI. Two variants: `header` (desktop dropdown) and `drawer` (mobile collapsible dropdown). Theme-aware (see below). Hidden entirely when there's no account; shows a static name (no switching) for single-account contacts; switchable for 2+.

### Conditional render

| Contact has… | Desktop | Mobile hamburger |
|---|---|---|
| no account (guest/builder) | nothing | nothing |
| **one** account | business name, static (no switch) | "Business" row, static |
| **multiple** accounts | switcher dropdown | "Switch Business" collapsible dropdown (scrollable) |

### Theming

The switcher pulls colors from the ecom theme tokens (`--ohfy-color-*` via `loadOhfyTheme`) — name/icon use `--ohfy-color-text` to match the cart/profile icons, the active option + avatar use `--ohfy-color-primary`. It follows the admin-configured storefront theme rather than hardcoded colors.

### Nav layout

Desktop nav is a two-row split: logo + full-width search + utilities (switcher → cart → profile) on top, nav links (bold) on a row below.

## Org setup / prerequisites

| Item | Where | Notes |
|---|---|---|
| `ContactsToMultipleAccounts` feature | scratch-org definition (`config/project-scratch-def.json`; CICD snapshot def) | **Provisions AND enables the ACR object at org creation. Cannot be added after creation.** This is the single gating prerequisite — verified that ACR is queryable immediately after `sf org create scratch`, before any settings deploy. |
| (customer orgs only) "Contacts to Multiple Accounts" setting | Setup → Account Settings (manual) | Customer prod/sandbox orgs aren't created from a scratch def; an admin enables the checkbox. Settings metadata isn't packageable, so this is an install-runbook step — not automated by us. |
| External Account OWD = ReadWrite | `setup-site.sh` step 5 (OWD overrides) | **Required** so the community user can read the accounts it switches into — ACR alone does not grant record access. |
| Profile grants | "Ohanafy Community User" profile | `apexClassAccesses: AccountSwitcherController` + `objectPermissions: AccountContactRelation (read)`. |
| Demo data | `setup-site.sh` step 10.5 (`link-test-user-accounts.apex`) | Links the ecom test contact to extra businesses (real seed accounts, or cloned mock businesses when none spare). |

## Testing

- **Jest** (`ecomAccountSwitcher.test.js`) — mocked `userDataService` with fixtures; covers render/switch/single-account-static/no-account.
- **Playwright** (`test-automation/tests/ecom/account-switcher.spec.ts`) — runs against a real org, **discovers** the contact's related accounts at runtime (no hardcoding), asserts dropdown contents + switch + session persistence; multi-account scenarios self-skip when the feature/data isn't present.

## Customer install note

`ContactsToMultipleAccounts` and the Account setting are **not packageable** — they don't install with the `ohfy` managed package. A customer admin must enable "Contacts to Multiple Accounts" (Setup → Account Settings) to activate the switcher. Until then the storefront behaves single-account (switcher hidden). Add this to the install runbook.

## Known constraints

- **Pool scratch orgs cannot demo this.** The shared dev-pool snapshot was built without the `ContactsToMultipleAccounts` feature, so `AccountContactRelation` never provisions on claimed orgs (the setting saves but the object is absent). Fix is a one-line addition to the OHFY-CICD snapshot scratch def + rebuild. Validated on a one-off scratch org (`ecom-acr`) created with the feature.

## Key files

- `OHFY-eCommerce/.../controllers/AccountSwitcherController.cls` (+ `_T`)
- `OHFY-eCommerce-UI/.../classes/Ecom_UI_Wrappers.cls` (+ `_T`)
- `OHFY-eCommerce-UI/.../lwc/ecomAccountSwitcher/` (+ `__tests__`)
- `OHFY-eCommerce-UI/.../lwc/userDataService/userDataService.js`
- `OHFY-eCommerce-UI/.../lwc/navigationMenu/navigationMenu.html`
- `org-metadata/experience-site/profiles/Ohanafy Community User.profile-meta.xml`
- `orgScripts/e-commerce/account-settings/Account.settings`, `link-test-user-accounts.apex`, `setup-site.sh`
- `config/project-scratch-def.json`
- `test-automation/tests/ecom/account-switcher.spec.ts`
