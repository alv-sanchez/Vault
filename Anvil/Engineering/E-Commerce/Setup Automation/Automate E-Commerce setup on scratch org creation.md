---
title: "Automate E-Commerce Setup on Scratch Org Creation"
status: done
updated: 2026-05-27
branch: chore/ecom-org-setup
tags: [ecom, scratch-org, automation, experience-cloud]
---

# Automate E-Commerce Setup on Scratch Org Creation

Goal: reduce the manual steps needed to stand up a dev org for eCommerce work. This doc tracks what can be automated vs what stays manual.

Reference: [Experience Cloud Site Resources (Confluence)](https://ohanafy.atlassian.net/wiki/spaces/ET/pages/656474113)

---

## Order of Execution

### Route A: Pool Org (fast — for day-to-day ecom dev)

Pool orgs come pre-built from snapshots with all core packages deployed. Only ecom-specific setup needed.

| #   | Command / Action                                                                  | Type   | Time    |
| --- | --------------------------------------------------------------------------------- | ------ | ------- |
| 1   | `bash utilityScripts/claim-dev.sh <alias>`                                        | Script | ~30s    |
| 2   | `sf config set target-org <alias>`                                                | CLI    | instant |
| 3   | `bash orgScripts/e-commerce/setup-site.sh <alias>`                                | Script | ~2min   |
|     | ↳ Creates E-Commerce site (idempotent)                                            |        |         |
|     | ↳ Waits for site provisioning + initial publish                                   |        |         |
|     | ↳ Deploys DigitalExperienceBundle (all 11 pages, navigation, CSP, head markup)    |        |         |
|     | ↳ Deploys community user profile                                                  |        |         |
|     | ↳ Publishes site (applies bundle changes)                                         |        |         |
|     | ↳ Seeds Notification__c records (idempotent)                                      |        |         |
|     | ↳ Runs OWD sharing audit                                                          |        |         |
| 4   | Set OWD: Setup → Sharing Settings → Public Read/Write (External) for ecom objects | Manual | 2min    |
| 5   | Add "Ohanafy Community User" profile to site members                              | Manual | 30s     |
| 6   | Create Contact → Enable Customer User → assign profile                            | Manual | 1min    |

Steps 1–3 are copy-paste. OWD, member assignment, and customer user creation remain manual.

### Route B: Fresh Scratch Org (slower — full deploy from zero)

For when no pool org is available, or for building the golden snapshot org.

| #   | Command / Action                                                                 | Type   | Time   |
| --- | -------------------------------------------------------------------------------- | ------ | ------ |
| 1   | `npm run deploy:full -- --create-scratch <alias> -v <devhub> --ignore-conflicts` | Script | ~15min |
|     | ↳ Creates scratch org with Communities + Sites + ExperienceBundle features       |        |        |
|     | ↳ Deploys all 11 packages (including eCommerce) in tier order                    |        |        |
|     | ↳ Grants FLS                                                                     |        |        |
|     | ↳ Seeds sample data + backfills External_Id__c                                   |        |        |
|     | ↳ Deploys org-metadata (layouts, FlexiPages, tabs)                               |        |        |
| 2   | `bash orgScripts/e-commerce/setup-site.sh <alias>`                               | Script | ~2min  |
|     | ↳ Creates E-Commerce site + waits + initial publish                              |        |        |
|     | ↳ Deploys bundle (pages, nav, CSP) + profile                                    |        |        |
|     | ↳ Publishes site + seeds notifications + OWD audit                               |        |        |
| 3   | Set OWD: Sharing Settings → Public Read/Write for ecom objects                   | Manual | 2min   |
| 4   | Add "Ohanafy Community User" profile to site members                             | Manual | 30s    |
| 5   | Create Contact → Enable Customer User → assign profile                           | Manual | 1min   |

---

## Scripts Reference

| Script | What it does | When to use |
|---|---|---|
| `bash utilityScripts/claim-dev.sh <alias>` | Claims a pre-built org from the pool | Every new org |
| `npm run deploy:full -- --target-org <alias> --ignore-conflicts` | Full 11-package deploy + seed data + FLS + org-metadata | Fresh scratch orgs only |
| `bash orgScripts/e-commerce/setup-site.sh <alias>` | Creates site + deploys bundle + profile + publishes + notifications + OWD audit | Every new ecom org (post-claim or post-deploy:full) |
| `sf apex run --file orgScripts/e-commerce/seed-notifications.apex -o <alias>` | Seeds Notification__c records (standalone) | If setup-site.sh wasn't used |
| `npm run update:fls` | Grants Admin FLS on all fields | After deploying new fields |

### Standalone CLI Commands

```bash
# Create the Experience site manually (if setup-site.sh wasn't used)
sf community create \
  --name "E-Commerce" \
  --template-name "Build Your Own (LWR)" \
  --url-path-prefix ecommerce \
  -o <alias>

# Publish the site (makes it accessible to community users)
sf community publish --name "E-Commerce" -o <alias>

# Deploy only ecom packages (skip full deploy — already handled by deploy:full)
sf project deploy start \
  -d OHFY-eCommerce/force-app \
  -d OHFY-eCommerce-UI/force-app \
  -o <alias> --ignore-conflicts

# Seed notification records standalone
sf apex run --file orgScripts/e-commerce/seed-notifications.apex -o <alias>

# Grant FLS standalone
npm run update:fls

# Retrieve Experience Bundle (if you changed pages in Builder and want to update the repo)
sf project retrieve start --metadata "DigitalExperienceBundle:site/E_Commerce1" --target-metadata-dir /tmp/ecom-bundle -o <alias>
```

---

## Automation Status

### Automated (via `deploy:full` + `setup-site.sh` — zero clicks)

| Step | How |
|---|---|
| Scratch org features (Communities, Sites, ExperienceBundle) | `project-scratch-def.json` |
| Package deploy (all 13 packages incl. eCommerce) | `deploy:full` groups 1–6 |
| FLS grant (all fields editable on Admin) | `deploy:full` runs `update-field-level-security.js` |
| Seed data (accounts, items, inventory, routes) | `upsertSeedData.js` via `deploy:full` (idempotent) |
| Org metadata (layouts, FlexiPages, tabs) | `org-metadata/scratch/` deployed by `deploy:full` |
| Domain auto-generation | Scratch orgs auto-generate `*.scratch.my.salesforce-sites.com` |
| Permission sets (Ecom_Theme_Reader, Bypass_Enhanced_Security) | Already in package source |
| Create E-Commerce site (LWR template) | `sf community create` via `setup-site.sh` |
| Wait for site provisioning + initial publish | `setup-site.sh` polls Site object, then publishes |
| All 11 pages with LWC components | `DigitalExperienceBundle` deployed by `setup-site.sh` |
| Navigation menu (header + footer) | `ohfy:navigationMenu` + `ohfy:ecomFooter` in bundle theme layout |
| CSP → Relaxed | `isRelaxedCSPLevel: true` in bundle `mainAppPage` |
| Head markup CSS | Embedded in bundle `mainAppPage.headMarkup` |
| Community user profile | `setup-site.sh` deploys `Ohanafy Community User.profile-meta.xml` |
| Site publish (applies bundle) | `sf community publish` via `setup-site.sh` |
| Notification seed (Notification__c records) | `seed-notifications.apex` via `setup-site.sh` |
| OWD sharing audit | `setup-sharing-owd.apex` via `setup-site.sh` (reports what needs manual change) |

### Manual (cannot automate via Metadata API / CLI)

| Step | Why | Manual Path |
|---|---|---|
| **OWD / Sharing rules** | Metadata API cannot set org-wide defaults | Setup → Sharing Settings → Public Read/Write for: Account, Invoice, Invoice Group, Fee, Location, Lot, Lot Inventory, Pricelist, Promotion, Route |
| **Add profile to site members** | Workspace admin UI only | Digital Experiences → Workspaces → Administration → Members → add "Ohanafy Community User" |
| **Enable Customer User** | Contact record button | Create Contact on Account → Enable Customer User → assign "Ohanafy Community User" profile |

### Implementation Notes

The DigitalExperienceBundle (`org-metadata/scratch/digitalExperiences/site/E_Commerce1/`) uses the `DigitalExperienceBundle` metadata type (not `ExperienceBundle`) because the site uses the LWR template. Retrieved from `may21EcomTest` on 2026-05-26, with 8 additional page view+route pairs generated programmatically following the same pattern as the retrieved Home and Shop pages.

The bundle deploy is isolated from the rest of `org-metadata/scratch/` to prevent pre-existing FlexiPage failures (from undeployed upstream packages) from blocking the bundle deploy.

To update the bundle after making changes in Builder:
```bash
sf project retrieve start --metadata "DigitalExperienceBundle:site/E_Commerce1" --target-metadata-dir /tmp/ecom-bundle -o <alias>
# Unzip and copy to org-metadata/scratch/digitalExperiences/
```

---

## Page Routes Reference

| Page | URL | LWC Component |
|---|---|---|
| Home | `/` (auto-created) | E-commerce Home Body |
| Login | `/login` (auto-created) | Ecom Logo Display + Login Form (class: `custom-login-form`) |
| Shop | `/shop-page` | E-commerce Shop |
| Product | `/product-page` | E-commerce Product Page |
| Promotions | `/promotions` | E-commerce Promotion |
| Order History | `/order-history` | E-Commerce Order History |
| Cart | `/cart-page` | E-Commerce Cart Page |
| Review | `/review-summary` | E-Commerce Review Summary |
| Order Placed | `/order-placed` | E-Commerce Order Placed Page |
| Support | `/support` | E-commerce Support Page |
| Profile | `/profile-page` | E-commerce Profile Page |

Each page: **Navigation Menu** (top) + **Component** (middle) + **E-commerce Footer** (bottom)
