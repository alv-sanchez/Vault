---
ticket: BMS-4073
epic: BMS-4996
question: "Is BMS-4073 already Done (close it), or re-scoped to only un-stubbing fixEcomOrderNames — and is the OHFY-Core field migration that stub depends on resolved?"
status: Open
po:
jira_comment_url:
raised: 2026-06-28
answered:
tags:
  - manager-engineer
  - open-question
---

# Open Question — BMS-4073

> [!question] The question
> Is BMS-4073 already satisfied by what's on `main` (close it), or is the remaining scope only the *Order Name Fix After Confirmation* AC — and if so, is the OHFY-Core field migration that `fixEcomOrderNames` depends on done?

## The issue
The notification system BMS-4073 describes is **already built and tested on `main`**: `AbandonedCartReminderScheduler`, `AbandonedCartReminderBatch`, `OrderConfirmationService` (single + split invoice), `TwilioSMSService`, `NotificationPreferenceController`, and the `Notification_Log__c` / `Contact_Notification__c` objects all exist with `_T` test classes. 5 of 6 AC scenarios are confirmed already-implemented.

The exception is the **Order Name Fix After Confirmation** AC. It claims `CartController.fixEcomOrderNames` rebuilds the order Name via a direct `User` query (to avoid CommunityNickname masking) and corrects `Sales_Rep__c`. On `main`, `fixEcomOrderNames` is a **no-op stub** (`CartController.cls:425-430`) that returns immediately, with a comment that it's deferred "until the post-confirmation rename hook is migrated" because legacy `Invoice_Item__c` / `Invoice__c` field references no longer match OHFY-Core. So the AC is contradicted by reality, and the one piece of genuine remaining work has an out-of-scope dependency.

## The solution being attempted
We need to know what "building BMS-4073" even means before queuing it. If it's already done, it should be closed. If the only gap is the order-name rename, we'd un-stub `fixEcomOrderNames` — but only once the Core field migration it waits on is confirmed complete.

## Options (with the recommendation first)
1. **[Recommended]** PO confirms the notification stack already satisfies BMS-4073 → **close BMS-4073 as Done**, and split the order-name rename into its own ticket gated on the Core field-migration. Cleanest; reflects code reality.
2. Re-scope BMS-4073 to *only* the Order-Name-Fix AC, and confirm the OHFY-Core field migration is resolved so the stub can be lifted. Executable only after that confirmation.
3. Leave as-is → ticket stays not-executable (Contradicted AC, unresolved dependency).

## Resolution
_(filled when answered)_
