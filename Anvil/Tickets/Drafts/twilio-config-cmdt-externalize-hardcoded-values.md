---
ticket: BMS-XXXX
title: "Externalize Twilio Hardcoded Values into Configurable Custom Metadata"
type: Story
status: Draft
priority: High
assignee: Alvaro Sanchez
reporter:
epic: BMS-XXXX
sprint:
labels:
  - ecom
  - notifications
  - config
  - twilio
package: E-Commerce
effort: S
components:
  - TwilioSMSService.cls
  - TwilioSMSService_T.cls
  - Twilio_Config__mdt (new)
  - Twilio_Config.Default.md-meta.xml (new)
blocked_by:
blocks:
created:
updated:
jira:
tags:
  - ticket
  - ecom
  - draft
---

# BMS-XXXX: Externalize Twilio Hardcoded Values into Configurable Custom Metadata |ECOM|

## Related
- Testing: [[BMS-XXXX]] (in Testing/)
- Docs: [[BMS-XXXX]] (in Documentation/)
- Source note: [[Twilio New Configurable Workflow]]
- Setup manual: [[E-Commerce - Twilio Set up]]
- Security context: [[E-Commerce - Rotate Twilio API credentials to remediate unauthorized account access]]
- Workflow diagram: [[Twilio Workflow]]

---

**Priority**: High
**Effort**: S (~1 day)
**Components**: `TwilioSMSService.cls`, `TwilioSMSService_T.cls`, new `Twilio_Config__mdt` Custom Metadata Type with `Default` record

## Story Statement

As an **Admin**, I want to change Twilio routing values (Account SID, From Number, Named Credential name) from Salesforce Setup without a code deploy, so that environment swaps, rebrands, and incident response can happen in seconds instead of requiring an engineer, a PR review, and a release window.

## Acceptance Criteria

### SCENARIO: Admin updates Twilio From Number without a deploy
**GIVEN** the `Twilio_Config__mdt` `Default` record exists with valid Account SID, From Number, Named Credential name, and `Is_Active__c = true`
**WHEN** an admin edits the `From_Number__c` field on the `Default` record in Setup and saves
**THEN** the next outbound SMS send uses the new From Number in the Twilio request
**AND** no code deploy is required
**AND** the previous send behavior (success path, error logging, log record creation) is unchanged

### SCENARIO: Admin updates Account SID without a deploy
**GIVEN** the `Twilio_Config__mdt` `Default` record exists
**WHEN** an admin edits `Account_SID__c` on the `Default` record and saves
**THEN** the next outbound SMS send posts to `…/Accounts/{new SID}/Messages.json`
**AND** the call signature for `send()` and `sendAndInsertLog()` is unchanged for existing callers

### SCENARIO: Kill-switch — all SMS sends short-circuit when config is inactive
**GIVEN** the `Twilio_Config__mdt` `Default` record has `Is_Active__c = false`
**WHEN** any caller invokes `send()` or `sendAndInsertLog()`
**THEN** no HTTP callout is fired
**AND** a `Notification_Log__c` record is created/updated with `Status__c = 'Skipped'` and `Error_Message__c = 'Twilio config inactive'`
**AND** no governor limit consumption from a network call

### SCENARIO: Fresh org deploy ships with placeholder config
**GIVEN** a fresh Salesforce org with no prior Twilio config
**WHEN** the package is deployed
**THEN** the `Default` `Twilio_Config__mdt` record is present
**AND** `Account_SID__c` contains the placeholder `REPLACE_WITH_TWILIO_ACCOUNT_SID`
**AND** `From_Number__c`, `Named_Credential_API_Name__c`, and `Is_Active__c` carry the values that are currently hardcoded in `TwilioSMSService.cls`
**AND** the deploy succeeds without errors

### SCENARIO: Admin completes post-deploy configuration before SMS sends
**GIVEN** the package has just been deployed and `Account_SID__c` is still set to the placeholder `REPLACE_WITH_TWILIO_ACCOUNT_SID`
**WHEN** an admin navigates to **Setup → Custom Metadata Types → Twilio Config → Manage Records → Default**
**AND** replaces the placeholder with the real environment-specific Account SID (and any other env-specific values, e.g. sandbox From Number)
**AND** saves
**THEN** the next outbound SMS send uses the real values and succeeds against verified test numbers
**AND** no code deploy is required between placeholder and real value

### SCENARIO: Missing config record — fail loud, not silently
**GIVEN** the `Twilio_Config__mdt` `Default` record is missing or deleted
**WHEN** a caller invokes `send()` or `sendAndInsertLog()`
**THEN** the service does not attempt a callout with null/empty SID or From Number
**AND** the `Notification_Log__c` record records `Status__c = 'Failed'` with an error message identifying the missing config

### SCENARIO: Existing callers unchanged
**GIVEN** `OrderConfirmationService` and `AbandonedCartReminderBatch` call `TwilioSMSService` exactly as they do today
**WHEN** the refactor is deployed
**THEN** both callers compile and run with no signature changes
**AND** outbound order confirmation SMS and abandoned cart reminder SMS continue to fire successfully against verified test numbers

**Out of scope:**
- Moving the Twilio Auth Token out of the External Credential (it's already correctly externalized).
- Replacing the Named Credential / External Credential pair.
- Multi-channel orchestration, multi-vendor routing, or any Tray.io / iPaaS work (documented in source note as a deliberate future-revisit option).
- Per-account / per-environment overrides beyond the single `Default` record (single record is sufficient for current scope).

## Dependencies
- **Cannot Start Until**: None — `Twilio_Config__mdt` is a standalone CMDT and the service refactor is contained to `TwilioSMSService.cls`.
- **This Story Unlocks**: Future iPaaS migration (Tray.io or equivalent) becomes easier because the service is the only abstraction layer to swap.
- **Ships With**: None — can ship independently.

## Testing Notes

### Key fields and records
- `Twilio_Config__mdt.Account_SID__c` — text, holds `AC…` SID. Sensitivity: low (identifier, not a credential).
- `Twilio_Config__mdt.From_Number__c` — text, holds `+1…` E.164 or `MG…` Messaging Service SID. Public-facing.
- `Twilio_Config__mdt.Named_Credential_API_Name__c` — text, holds `ohfy__Twilio_Named_Cred` (no `callout:` prefix — the service prepends it).
- `Twilio_Config__mdt.Is_Active__c` — checkbox, kill-switch.
- `Default` CMDT record — seeded via `force-app/main/default/customMetadata/Twilio_Config.Default.md-meta.xml`.

### Edge cases to verify
- `Default` record present, `Is_Active__c = false` → all sends log `Skipped — Twilio config inactive`, zero callouts.
- `Default` record present, `Is_Active__c = true`, valid values → unchanged behavior vs. today.
- `Default` record missing → `Failed` log with descriptive error; no NPE, no silent drop.
- Admin changes `From_Number__c` mid-batch (e.g. during an `AbandonedCartReminderBatch` run) → batch finishes with the value cached at the start of the transaction; next batch picks up the new value. Document this in the docstring.
- `From_Number__c` set to Twilio magic-invalid `+15005550006` → callout fires, response is HTTP error, `Notification_Log__c` records `Failed` with HTTP `21212`. Validates that the value is actually being read from CMDT.
- `Account_SID__c` set to an invalid SID → callout endpoint URL contains the bad SID; Twilio returns 404. Validates the SID flows into the URL path.

### Error states and validations
- Blank phone number → existing behavior preserved (`Status__c = 'Skipped'`, `Error_Message__c = 'No phone number on Contact'`).
- HTTP non-201 → existing behavior preserved (`Status__c = 'Failed'`, error message includes status code + parsed Twilio message).
- Callout exception → existing behavior preserved (`Status__c = 'Failed'`, error message captures exception text).
- Non-JSON Twilio error body → existing raw-body fallback in `parseErrorMessage` preserved.
- Null `logId` on `send()` → existing no-op behavior preserved.

### Flows to verify end-to-end
0. **Post-deploy admin config (prerequisite for flows 1–4)**: in the target org, open `Twilio Config → Default`, replace `Account_SID__c` placeholder with the real environment SID, verify `From_Number__c` matches a verified sender for that environment, save. Confirm a smoke-test send succeeds before running the rest of the flows.
1. Order confirmation send (real path through `OrderConfirmationService` → `TwilioSMSService.sendAndInsertLog`) → SMS arrives at verified test number, `Notification_Log__c` = `Sent`.
2. Abandoned cart reminder batch (`AbandonedCartReminderBatch`) → SMS arrives, log = `Sent`.
3. Admin smoke test from source note Section 9: change `From_Number__c` → `+15005550006` → confirm `Failed` with HTTP 21212 → restore → confirm `Sent` again.
4. Kill-switch toggle: uncheck `Is_Active__c` → next send logs `Skipped — Twilio config inactive` → re-check → next send logs `Sent`.
5. Apex test suite (`TwilioSMSService_T`) all green with new `@TestVisible` config override hook.
6. **Placeholder guard**: in a fresh sandbox where admin has NOT yet replaced the placeholder, trigger an outbound send → callout fires against `…/Accounts/REPLACE_WITH_TWILIO_ACCOUNT_SID/Messages.json`, Twilio returns 404, log = `Failed`. Confirms the placeholder is loud, not silent.

### Security notes
- None of the four CMDT fields are credentials. The Auth Token remains on the External Credential (Basic Auth password), encrypted, and never appears in CMDT.
- Account SID alone cannot authenticate to Twilio — confirmed by current `E-Commerce - Twilio Set up` doc.
- Admin visibility of these fields is not a risk: From Number is public, Account SID is an identifier, Named Credential name is Setup metadata.

## Implementation Notes

### New metadata
- `force-app/main/default/objects/Twilio_Config__mdt/Twilio_Config__mdt.object-meta.xml` — the CMDT definition.
- `force-app/main/default/objects/Twilio_Config__mdt/fields/Account_SID__c.field-meta.xml`
- `force-app/main/default/objects/Twilio_Config__mdt/fields/From_Number__c.field-meta.xml`
- `force-app/main/default/objects/Twilio_Config__mdt/fields/Named_Credential_API_Name__c.field-meta.xml`
- `force-app/main/default/objects/Twilio_Config__mdt/fields/Is_Active__c.field-meta.xml`
- `force-app/main/default/customMetadata/Twilio_Config.Default.md-meta.xml` — seeded record with placeholder SID; admin populates the real value post-deploy:
  - `Account_SID__c = REPLACE_WITH_TWILIO_ACCOUNT_SID` (placeholder; admin replaces in Setup after deploy)
  - `From_Number__c = +18665475424` (current production value — safe to ship; admin may swap per environment)
  - `Named_Credential_API_Name__c = ohfy__Twilio_Named_Cred`
  - `Is_Active__c = true`

### Post-deploy admin steps (REQUIRED before SMS will send)
1. Navigate to **Setup → Custom Metadata Types → Twilio Config → Manage Records → Default**.
2. Replace `Account_SID__c` placeholder `REPLACE_WITH_TWILIO_ACCOUNT_SID` with the real environment-specific Account SID (sandbox or production as appropriate).
3. Verify `From_Number__c` matches the environment's verified Twilio sender (swap for sandbox if needed).
4. Confirm `Named_Credential_API_Name__c` matches the deployed Named Credential API name.
5. Confirm `Is_Active__c = true`.
6. Save and run the admin smoke test (see Testing Notes, flow #3).

### Modified Apex (`force-app/main/default/classes/notifications/TwilioSMSService.cls`)
Currently lines 23, 27, 31 are private static final String constants. Replace with:
- Remove the three constants.
- Add a cached static config getter:
  ```apex
  @TestVisible private static Twilio_Config__mdt configOverride;
  private static Twilio_Config__mdt cfg;
  private static Twilio_Config__mdt getConfig() {
      if (cfg != null) return cfg;
      if (configOverride != null) { cfg = configOverride; return cfg; }
      cfg = Twilio_Config__mdt.getInstance('Default');
      return cfg;
  }
  ```
- At the top of `send()` and `sendAndInsertLog()`:
  - Call `getConfig()` once.
  - If `cfg == null` → record `Failed` with `'Twilio config missing (Default record not found)'` and return / insert log respectively.
  - If `cfg.Is_Active__c == false` → record `Skipped` with `'Twilio config inactive'` and return / insert log respectively.
  - Otherwise build endpoint as `'callout:' + cfg.Named_Credential_API_Name__c + '/2010-04-01/Accounts/' + cfg.Account_SID__c + '/Messages.json'`.
- In `buildBody`, use `cfg.From_Number__c` instead of the `FROM_NUMBER` constant.

### Modified tests (`TwilioSMSService_T.cls`)
- Use the `@TestVisible configOverride` slot to inject a stub `Twilio_Config__mdt` per test (Apex tests cannot insert CMDT records, so the override slot is the standard pattern).
- Add scenarios:
  - `test_send_configInactive_skipsCallout` — `Is_Active__c = false`, no mock set, assert log = `Skipped` with `'Twilio config inactive'`.
  - `test_send_configMissing_logsFailed` — `configOverride = null` and ensure `getInstance('Default')` returns null in the test context, assert log = `Failed` with the missing-config message.
  - `test_sendAndInsertLog_configInactive_insertsSkippedLog` — same but for the insert-log variant.
  - `test_send_usesConfiguredFromNumber` — inject override with a distinct `From_Number__c`, capture the request body via the mock, assert the body contains the configured number.
  - `test_send_usesConfiguredAccountSID` — inject override with a distinct `Account_SID__c`, capture the request endpoint via the mock, assert the URL contains the configured SID.
- All existing tests need the override populated with the current hardcoded values to keep their behavior intact.

### Untouched
- `OrderConfirmationService.cls` — no signature changes on `TwilioSMSService`, so no edits.
- `AbandonedCartReminderBatch.cls` — same.
- Named Credential `ohfy__Twilio_Named_Cred` metadata — unchanged.
- External Credential `ohfy__Twilio_External_Cred` and its Principal (Auth Token) — unchanged.

### Anything hardcoded, incomplete, or missing
- The seeded `Default` record ships with a **placeholder** Account SID (`REPLACE_WITH_TWILIO_ACCOUNT_SID`). Admin must populate the real SID in Setup post-deploy before SMS will send — see "Post-deploy admin steps" above and the `SCENARIO: Admin completes post-deploy configuration` acceptance criterion.
- No retry / backoff strategy is added — out of scope, behavior unchanged from today.
- No per-environment override mechanism — sandbox vs prod is handled by the single `Default` record being editable per-org. If we ever need per-named-credential or per-sandbox overrides, that's a follow-up.
