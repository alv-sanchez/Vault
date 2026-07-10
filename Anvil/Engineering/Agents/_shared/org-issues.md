# Org issues — shared troubleshooting log

Append-only knowledge base of org-level problems and their fixes. **Check here FIRST when
blocked on anything org-shaped** (deploy errors, perm/FLS failures, site not rendering,
login failures, test-data weirdness, flaky setup steps) — another lane has probably hit it
already. When you solve one, record it immediately, even if the fix was trivial.

Entry format:

```
## <short symptom> — <org alias or ALL> — <date>
- **Symptom**: exact error / behavior observed
- **Cause**: root cause once known (or "unknown" — update later)
- **Fix**: exact commands/steps that resolved it
- **Hit by**: BMS-XXXX (append keys as others hit it)
```

---

## Known from prior work (pre-seeded)

## Twilio ExternalCredential not configured — ALL — 2026-06-11
- **Symptom**: deploy/perm-set assignment referencing Twilio ExternalCredential fails on fresh orgs
- **Cause**: Twilio API credentials must be configured manually per org
- **Fix**: skip/ignore unless the ticket touches SMS; if SMS is needed, escalate to _shared/blockers.md
- **Hit by**: (none yet this run)

## Pool org may lack ecom packages — ALL — 2026-06-11
- **Symptom**: Ecom_UI_Wrappers absent after claim; storefront components missing
- **Cause**: nightly pool snapshot builds from develop; ecom packages live on main lineage
- **Fix**: /ecom-setup step 2 — deploy OHFY-eCommerce + OHFY-eCommerce-UI on top of the claim
- **Update (BMS-4258, 2026-06-11)**: no manual deploy needed when your worktree HEAD is on main lineage — `claim-dev.sh` reports the pool's baseline SHA and auto-runs an sfdx-git-delta deploy baseline→HEAD, which carried both ecom packages onto `ecom-account` (~5 min, Status: Succeeded). Manual deploy only needed if the delta step fails or you claimed with `--skip-deploy`.
- **Hit by**: BMS-4258 (auto-resolved by claim delta)

## AccountContactRelation "not supported" despite AccountSettings deploy succeeding — ALL pool orgs — 2026-06-12
- **Symptom**: `SELECT ... FROM AccountContactRelation` → "sObject type 'AccountContactRelation' is not supported"; `sf sobject describe` → 404. Meanwhile `AccountSettings.enableRelateContactToMultipleAccounts` deploys with Status: Succeeded / changed=True AND the Setup-UI checkbox (Setup → Account Settings → Contacts to Multiple Accounts) shows CHECKED.
- **Cause**: pool snapshot scratch def lacks the `ContactsToMultipleAccounts` scratch-org **feature**. The settings *flag* persists but the ACR object is never provisioned; scratch features can't be added after org creation. A Setup-UI Edit→Save cycle does NOT fix it (verified via Chrome DevTools).
- **Fix**: none org-side. Escalated in _shared/blockers.md — OHFY-CICD must add the feature to the snapshot scratch def. Code touching ACR must reference it dynamically (`Schema.getGlobalDescribe().get('accountcontactrelation')`) or it won't even compile/deploy on these orgs.
- **Hit by**: BMS-4258

## Cart/draft-invoice init 400 for community user on fresh pool org — ecom-account — 2026-06-12
- **Symptom**: storefront console shows `[DraftInvoiceService] Error initializing draft invoice`; the Apex call `Ecom_UI_Wrappers.initializeDraftInvoice` returns 400 with `INSUFFICIENT_ACCESS_ON_CROSS_REFERENCE_ENTITY, insufficient access rights on cross-reference id: 005...` (the Sales Rep **User** id) from `DraftInvoiceController.formDrafts`.
- **Cause**: the community user cannot see the internal admin User referenced as `Account.Sales_Rep__c` when inserting the draft `Invoice__c` (external-user → internal-User lookup visibility; likely needs External Organization-Wide Defaults user visibility / sharing or a role setup that setup-site.sh doesn't do).
- **Fix**: root-caused by CART-4050 (2026-06-12): User external OWD is Private, so external users can't reference internal Users in lookups at insert time. Durable fix = criteria-based User sharing rule (UserType=Standard → Read → AllCustomerPortalUsers); exact metadata + deploy command in _shared/blockers.md (CART-4050 entry) — deploy NEEDS HUMAN APPROVAL (auto-mode denied as security-loosening). Read path is unaffected: seed draft Invoice__c/Invoice_Item__c admin-side (see test-automation/support/ecom/draftCartSeed.ts) and the cart renders fine for the community user.
- **Hit by**: BMS-4258 (observed during smoke test), BMS-4050 (blocked add-to-cart write-path testing on ecom-cart; worked around with admin-side seeding)

## Ecom unauth Playwright spec fails with "url: expected string, got undefined" — ALL worktrees — 2026-06-12
- **Symptom**: `tests/ecom/login-page.unauth.spec.ts` fails at `page.goto(process.env.SF_LOGIN_URL!)` with `url: expected string, got undefined`, while the auth-based specs pass (config resolves creds via `resolveEcomCredentials()` / SF_TARGET_ORG instead).
- **Cause**: that spec dotenv-loads `.env` from the repo root (`../../../.env` relative to the spec). Git worktrees do NOT share the main checkout's untracked `.env`, so it's missing in `.claude/worktrees/<branch>/` — and the main repo's `.env` points at a different org anyway.
- **Fix**: create a worktree-local `.env` (gitignored) with the lane org's values, e.g. for ecom-account: `SF_LOGIN_URL=https://stream-goldengate-508-dev-ed.scratch.my.site.com/vforcesite/login`, `SF_USERNAME=ecomtest_00dek00000igqy7@example.com`, `SF_PASSWORD=Ecomtest1!`, `SF_TARGET_ORG=ecom-account`. Re-run → green.
- **Hit by**: ACCT lane setup (BMS-4995 fleet)

## Abandoned-cart reminder not scheduled despite "site ready" org — ecom-account — 2026-06-12
- **Symptom**: `SELECT ... FROM CronTrigger WHERE CronJobDetail.Name LIKE '%bandoned%'` returns 0 rows on an org recorded as fully set up.
- **Cause**: `setup-site.sh` does not schedule the batch; it's a separate one-time step (ecom-setup skill step 4) that the prior setup pass skipped.
- **Fix**: `sf apex run --file orgScripts/e-commerce/schedule-abandoned-cart-reminder.apex -o ecom-account` → "Abandoned Cart Reminder - Hourly" WAITING.
- **Hit by**: ACCT lane setup (BMS-4995 fleet)

## setup-site.sh finishes but test user lacks Ohanafy_Ecom_Community_Access — ecom-catalog — 2026-06-12
- **Symptom**: create-test-user step logs `Ohanafy_Ecom_Community_Access permission set not found — deploy ecom-perm-sets first.`; query confirms only `Ohanafy_Ecom_Guest_Access` exists in the org. Retrying the deploy directly fails with `Unable to find ExternalCredentialPrincipal: Twilio_External_Cred-Twilio`.
- **Cause**: downstream of the known Twilio ExternalCredential gap (see pre-seeded entry) — setup-site.sh step 6 can't deploy that perm set on a fresh pool org, then step 10 skips the assignment with the warning above. Setup still completes and ecom smoke specs (4/4) pass without it.
- **Fix**: non-blocking unless the ticket touches SMS/Twilio. If needed: configure Twilio API credentials in the org's ExternalCredential, redeploy `orgScripts/e-commerce/ecom-perm-sets/permissionsets/Ohanafy_Ecom_Community_Access.permissionset-meta.xml`, then assign to the test community user.
- **Hit by**: CAT lane setup (BMS-4995 fleet)

## Shared worktree .env contention between lanes — fable-project-as worktree — 2026-06-12
- **Symptom**: the worktree-local `.env` fix for the unauth ecom spec (see 2026-06-12 entry above) only holds one org's creds; ACCT and CAT lanes share the `fable-project-as` worktree, so each lane's setup overwrites the other's values. CAT setup overwrote ecom-account values with ecom-catalog ones.
- **Cause**: `login-page.unauth.spec.ts` dotenv-loads a single repo-root `.env`; multiple lanes run from the same worktree.
- **Fix**: before running the unauth spec, rewrite `.env` with YOUR lane's SF_LOGIN_URL/SF_USERNAME/SF_PASSWORD/SF_TARGET_ORG (creds are in _shared/orgs.md), or export them inline in the test command. Auth-based specs are unaffected (use SF_TARGET_ORG auto-discovery).
- **Hit by**: CAT lane setup (BMS-4995 fleet)

## Package deploy blocked by pending Apex job (abandoned-cart cron) — ecom-catalog (likely ALL ecom orgs) — 2026-06-12
- **Symptom**: `sf project deploy start -d OHFY-eCommerce/force-app` fails on test classes (e.g. `UserTriggerService_T`) with "You can bypass this error by allowing deployments with Apex jobs in the Deployment Settings page in Setup." The scheduled "Abandoned Cart Reminder - Hourly" CronTrigger (ecom-setup step 4) holds references that block whole-package deploys.
- **Cause**: org has a WAITING scheduled job touching ecom classes; the org default disallows deploys of components with pending Apex jobs. Aborting the shared cron or flipping the org-wide ApexSettings is NOT allowed for fleet agents (auto-mode classifier denies both).
- **Fix**: deploy only your changed components instead of the whole package, e.g. `sf project deploy start -d <pkg>/.../classes/MyClass.cls -d <pkg>/.../lwc/myBundle -o <alias> --ignore-conflicts`. Targeted deploys that don't include job-referenced classes go through cleanly. Remember `sf community publish --name "E-Commerce"` afterward for LWC changes.
- **Hit by**: BMS-4053 (CAT lane)

## Fieldset_Customization__mdt: only one record per object deploys — ALL — 2026-06-12
- **Symptom**: deploying a second `Fieldset_Customization` CMDT record for the same Object_Name__c fails with `duplicate value found: ohfy__Object_Name__c duplicates value on <existing record>`.
- **Cause**: `Object_Name__c` shipped with `unique=true`, contradicting the framework's own (Object_Name__c, Fieldset_Purpose__c) lookup key.
- **Fix**: BMS-4053 branch loosens the constraint (`unique=false`, documented in field description). Until that merges/deploys, deploy the field change BEFORE the CMDT records (separate deploys — same-transaction field+record deploys still validate records against the old constraint).
- **Hit by**: BMS-4053 (CAT lane)

## Ecom package deploy fails with "schedulable class has jobs pending" — any org with abandoned-cart scheduled — 2026-06-12
- **Symptom**: `sf project deploy start -d OHFY-eCommerce/force-app ...` fails with ~69 cascading errors; root error on `AbandonedCartReminderBatch/Scheduler`: "This schedulable class has jobs pending or in progress - CronTrigger IDs (08e...)". Deploys are atomic so nothing lands.
- **Cause**: `schedule-abandoned-cart-reminder.apex` (run during lane org verification) leaves a CronTrigger; Salesforce blocks redeploying schedulable/async Apex while its job is scheduled.
- **Fix**: abort → deploy → re-schedule:
  ```
  sf data query -q "SELECT Id FROM CronTrigger WHERE CronJobDetail.Name LIKE '%Abandoned%'" -o <alias>
  sf apex run -o <alias) <<< "System.abortJob('<cronTriggerId>');"   # or a temp .apex file
  sf project deploy start ... (now succeeds)
  sf apex run --file orgScripts/e-commerce/schedule-abandoned-cart-reminder.apex -o <alias>
  ```
  Alternative: Setup → Deployment Settings → "Allow deployments with Apex jobs" (org-wide, one-time; candidate for setup-site.sh).
- **Hit by**: BMS-4258 (ecom-account; job was scheduled by the ACCT-lane verification earlier the same day)
