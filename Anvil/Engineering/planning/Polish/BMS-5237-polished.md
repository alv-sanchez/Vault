# BMS-5237 — Automate remaining manual e-commerce org setup steps in setup-site.sh

## Context

`orgScripts/e-commerce/setup-site.sh` automates 7 of the e-commerce org setup steps (site creation, Experience Bundle deploy, community profile deploy, publish, notification seeding, OWD audit). Four steps still require manual Setup UI interaction. The goal is to automate these so a freshly claimed org can go from `setup-site.sh` to Playwright tests passing with zero manual clicks.

### What's already automated
- Experience Cloud site creation + wait + publish (`sf community create/publish`)
- Experience Bundle deploy (pages, routes, navigation, CSP, head markup) from `org-metadata/scratch/digitalExperiences/site/E_Commerce1`
- "Ohanafy Community User" profile deploy from `org-metadata/scratch/profiles/`
- `Notification__c` seed records (upsert on `Developer_Key__c`)
- OWD sharing audit (read-only — reports which objects need attention)
- `AbandonedCartReminderScheduler` scheduling (separate script)
- Digital Experiences pre-enabled via `config/project-scratch-def.json` (`Communities` + `Sites` features, `communitiesSettings.enableNetworksEnabled`)

### What's still manual

#### 1. Guest User Profile permissions

After the Experience site is created, Salesforce auto-generates a guest user profile (e.g., `E-Commerce Profile`). That profile must be configured within the same org where the site was created.

The guest profile must grant:
- **Apex class access**: `RegisterController`, `EcomBrandingController` (login page branding), and all other ecom Apex classes the guest page invokes
- **Object access**: `Account` (Read), `Contact` (Read/Create)

To discover the guest profile:
```sql
SELECT Id, Name, UserType, UserLicense.Name, Description
FROM Profile
WHERE Name LIKE '%Commerce%'
ORDER BY Name
```

`RegisterController` methods the guest profile calls:
- `searchAccounts(businessName, zipCode, stateLicenseNumber)` — queries Account by name + zip, filters by license fields (`State_License_Number__c`, `License_Expiration_Date__c`, `Alcohol_License_Required__c`)
- `registerUser(accountId, firstName, lastName, email, phone, jobTitle, smsOptIn)` — creates Contact + User, assigns "Ohanafy Community User" profile
- `loginUser(username, password, startUrl)` — delegates to `Site.login()`

**Approach**: After `setup-site.sh` creates the site (step 1-2), query the org for the auto-generated guest profile by name pattern, then update its permissions via Anonymous Apex or Metadata API deploy. Reuse the bundle-name discovery technique at `setup-site.sh:72-89` to derive the guest profile name dynamically — do not hardcode `E-Commerce Profile`, since it follows the site name (e.g., a site named "E-Commerce 2" produces "E-Commerce 2 Profile").

#### 2. "Ohanafy Community User" profile — missing Apex Class Access and External Credential Principal Access

The deployed `Ohanafy Community User` profile (`org-metadata/scratch/profiles/Ohanafy Community User.profile-meta.xml`) is missing:
- **External Credential Principal Access** for `Twilio_External_Cred - Twilio` (required for SMS notifications — order confirmation, abandoned cart reminders)
- **Apex Class Access** for the following 15 classes the storefront invokes (directly or transitively):

| Package | Class | Role |
|---|---|---|
| OHFY-eCommerce-UI | `Ecom_UI_Wrappers` | Single `@AuraEnabled` facade for all LWC calls |
| OHFY-eCommerce | `CartController` | Draft-invoice helpers, promotion/product queries |
| OHFY-eCommerce | `EcomBrandingController` | Branding resource lookups from `Ecom_Branding__mdt` |
| OHFY-eCommerce | `NotificationPreferenceController` | SMS/email notification preference management |
| OHFY-eCommerce | `OrderConfirmationService` | Order confirmation email + SMS dispatch |
| OHFY-eCommerce | `OrderHistoryController` | Invoice/order history retrieval |
| OHFY-eCommerce | `RegisterController` | Self-registration + Site.login wrapper |
| OHFY-eCommerce | `UpdateContactController` | Contact profile updates |
| OHFY-OMS | `DraftInvoiceController` | Draft invoice creation, updates, confirmation |
| OHFY-OMS | `E_Delivery_Items` | Locked delivery check, next available date |
| OHFY-OMS | `E_Invoicing_Items` | Inventory and territory exclusion lookups |
| OHFY-OMS | `E_Invoicing_TableMessages` | Delivery message utilities |
| OHFY-PLTFM | `E_ConfigurationPreferenceMDT` | Ecom configuration preference reader |
| OHFY-Utilities | `U_ObjectUtility` | Generic SOQL helpers (filtered records, grouped sums) |
| OHFY-Utilities | `U_UserUtil` | Current user data retrieval |

These must be added to the profile XML so they deploy automatically in `setup-site.sh` step 4.

#### 3. OWD Sharing Settings — Public Read/Write for ecom objects

Current `setup-sharing-owd.apex` is audit-only. OWD cannot be set via Anonymous Apex.

Objects requiring External Access = Public Read/Write:
- `Account`
- `Invoice__c`
- `Invoice_Group__c`
- `Fee__c`
- `Location__c`
- `Lot__c`
- `Lot_Inventory__c`
- `Pricelist__c`
- `Promotion__c`
- `Route__c`

**Note**: The `setup-sharing-owd.apex` header comment (lines 12-25) also lists `Contract` and `Lot_Invoice_Item__c`, but the executable array (lines 28-39) only has the 10 objects above. The header is out of sync with the array. Confirm whether `Contract` and `Lot_Invoice_Item__c` are actually needed for the ecom flow before implementing.

**Approach**: Investigate `objectSettings.<obj>.sharingModel: ReadWrite` in `config/project-scratch-def.json` as the primary path — this would set OWD at scratch-org creation time, eliminating this step from `setup-site.sh` entirely. Fall back to deploying `<sharingModel>ReadWrite</sharingModel>` overrides via a metadata bundle if `objectSettings` doesn't accept namespaced API names (e.g., `ohfy__Invoice__c`). Salesforce docs are inconsistent on whether namespaced names work in non-namespaced scratch org definitions — needs a spike against a live scratch org.

**Do NOT use `SharingRules` metadata type** — that's for criteria-based and ownership-based sharing rules, not Org-Wide Defaults.

#### 4. Add "Ohanafy Community User" profile to site members

After the site is created and the profile is deployed, it must be added as a member of the Experience site.

**Approach**: Deploy a `Network` metadata file containing `networkMemberGroups` (`<networkMemberGroups><profile>Ohanafy Community User</profile></networkMemberGroups>`). `NetworkMemberGroup` is a child of `Network`, not a standalone metadata type — `sf data create record -s NetworkMemberGroup` is unlikely to work.

#### 5. Create Contact + Enable Customer User + assign UserRole

Playwright tests need an authenticated community user. The test auth setup (`test-automation/setup/auth.ecom.setup.ts`) logs in via the Experience Cloud login form using `SF_USERNAME` + `SF_PASSWORD` env vars.

The test user requires:
- An Account (can use seed data — `seed:acct-customer-0` or similar)
- A Contact on that Account
- A User record with "Ohanafy Community User" profile
- The Account owner **must have a UserRole assigned** — without this, creating a community user fails with "portal account owner must have a role"

**Approach**: Anonymous Apex script that:
1. **Assigns a UserRole to the admin user** — query for an existing role; if none exist, create one (e.g., "CEO") and assign it to the running user
2. Queries a seed Account
3. Creates a Contact on that Account
4. Creates a User with `ProfileId` = "Ohanafy Community User", `ContactId` = the new Contact
5. Sets the password via `System.setPassword()` (requires `EnableSetPasswordInApi` feature — already in scratch def)

**Username/password provenance**: Not fixed yet. Options: (a) accept as script inputs, (b) generate and echo at the end, (c) use a deterministic convention (e.g., `ecomtest@<org-domain>` + static password). Approach (c) is cleanest for CI but approach isn't locked.

### Why setup-site.sh builds from scratch

Each scratch org gets a unique URL endpoint for the Experience site, so the site configuration can't be 100% replicated from a snapshot. That's why `setup-site.sh` exists — it creates and configures everything dynamically per-org.

## Acceptance Criteria

- [ ] `setup-site.sh` completes all steps without manual intervention
- [ ] A freshly claimed org + `setup-site.sh` produces a working e-commerce site with a test community user
- [ ] `npm run test:playwright:chromium -- tests/ecom/login-page.unauth.spec.ts` passes (guest access works — login page renders with branding)
- [ ] `npm run test:playwright:chromium -- tests/ecom/logged-in.spec.ts` passes (authenticated access works — homepage loads without redirect to /login)
- [ ] Guest user can call `RegisterController.searchAccounts` without "Insufficient privileges" error
- [ ] "Ohanafy Community User" profile includes Apex Class Access for all ecom/OMS classes and External Credential Principal Access for `Twilio_External_Cred`
- [ ] All new steps in `setup-site.sh` are idempotent — if data already exists (site, profile, user), skip; if a prior run failed partway, re-running picks up where it left off
- [ ] OWD object list is reconciled between `setup-sharing-owd.apex` header and executable array
- [ ] `orgScripts/e-commerce/README.md` updated to reflect the new automation

## Key Files

| File | Role |
|---|---|
| `orgScripts/e-commerce/setup-site.sh` | Main script to extend |
| `orgScripts/e-commerce/setup-sharing-owd.apex` | Current audit-only script — replace or supplement |
| `orgScripts/e-commerce/README.md` | Update when done |
| `org-metadata/scratch/profiles/Ohanafy Community User.profile-meta.xml` | Community user profile — needs Apex Class Access + External Credential Principal Access added |
| `config/project-scratch-def.json` | Scratch org definition — investigate `objectSettings` for OWD |
| `OHFY-eCommerce-UI/force-app/main/default/classes/RegisterController.cls` | Guest profile needs access to this |
| `OHFY-eCommerce-UI/force-app/main/default/classes/EcomBrandingController.cls` | Guest profile needs access for login page branding |
| `test-automation/setup/auth.ecom.setup.ts` | Playwright auth setup — consumes SF_USERNAME/SF_PASSWORD |
| `test-automation/tests/ecom/README.md` | Documents test constraints and env vars |
| `test-automation/support/ecom/orgQuery.ts` | SF CLI wrappers for test data queries |
