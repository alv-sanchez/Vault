

  
The Twilio account associated with our E-Commerce Notification Framework was used to send unauthorized communications (Coinbase impersonation scam targeting recipients). Twilio's Trust & Safety placed the account on hold due to abuse detection.

This ticket covers **Step 1** of the remediation: rotating the Twilio API credentials to invalidate any leaked secrets and restore secure account access.  
  
Why now

Twilio's account hold blocks further fraudulent use, but the leaked credentials themselves remain valid until rotated. Even with the hold in place, rotating credentials is required before the account can be safely unlocked — otherwise the same attacker can resume the moment access is restored.

#### Approach

Migrate from the primary Auth Token model (currently in use per the [Twilio setup doc](https://ohanafy.atlassian.net/wiki/spaces/ET/pages/904167425/E-Commerce+-+Twilio+Set+up "https://ohanafy.atlassian.net/wiki/spaces/ET/pages/904167425/E-Commerce+-+Twilio+Set+up")) to **scoped API Keys**, which are revocable, rotatable, and don't require account-wide downtime.

#### Before vs After

The change is **only** to the External Credential Principal's Username + Password fields. No code changes. No deploy. Everything else — the Named Credential, the URL, the Apex constants — stays exactly as it was.

| | **Before** (leaked) | **After** (current) |
|---|---|---|
| **Credential type** | Account Auth Token | Restricted API Key |
| **Principal Username** | `ACe4c6b5fae...` (Account SID) | `SK...` (API Key SID) |
| **Principal Password** | Account-level Auth Token | API Key Secret |
| **Authenticates as** | The whole Twilio account | A scoped key belonging to the account |
| **Scope of access** | 🔴 Everything: Messages, **Voice**, Verify, Studio, Billing, Sub-accounts, IAM | 🟢 Only `Messaging → messages → Read, List, Create` |
| **If leaked, attacker can** | 🔴 Place voice calls, send SMS, drain billing, create sub-accounts, impersonate anyone | 🟢 Send SMS from the existing number only — no Voice abuse, no billing access |
| **Revocable independently** | 🔴 No — only 2 token slots (primary/secondary) per account; rotation requires regenerating the account-level token | 🟢 Yes — unlimited keys, delete any one in isolation |
| **Per-environment isolation** | 🔴 One token = whole account; sandboxes inheriting the token inherit full prod access | 🟢 Each env can have its own scoped key |
| **Rotation effort** | Regenerate Auth Token in Twilio → update Principal → coordinate downtime if any other system uses the same token | Create new API Key → update Principal → delete old key. No coordination needed. |
| **Auditable** | 🟡 Twilio logs show "account credential" — can't tell which integration used it | 🟢 Twilio logs show the specific API Key SID — you know exactly which integration acted |
| **Blast radius of this incident's leak vector** | 🔴 Catastrophic — full account compromise (what happened) | 🟢 Limited — attacker could only resend SMS from our existing number, no Voice impersonation possible |

#### Why this approach (not "just rotate the Auth Token")

The Auth Token model has **two failure modes** that this incident exposed:

1. **No scope** — the leaked token authorized Voice calls and SMS. The Coinbase scam used **both channels**. A Messages-only credential would have blocked the Voice half of the abuse outright.
2. **No isolation** — there's exactly one Auth Token per account (plus a secondary slot). Rotating it affects every consumer simultaneously, with no way to deprecate one integration's access without touching others. API Keys are per-integration by design.

"Switch to the secondary Auth Token" was the first suggestion. It would have worked as a credential rotation, but it leaves both failure modes intact: the new token would still have full-account scope, and we'd still be one leak away from the same incident. Migrating to a Restricted API Key fixes the root cause, not just the symptom.

#### What did NOT change

| Component | Status |
|---|---|
| `TwilioSMSService.cls` (Apex) | Untouched. Constants `NAMED_CREDENTIAL`, `ACCOUNT_SID`, `FROM_NUMBER` all stay as-is. |
| Named Credential `ohfy__Twilio_Named_Cred` | Untouched. URL still `https://api.twilio.com`, "Generate Authorization Header" still checked. |
| External Credential `ohfy__Twilio_External_Cred` | Untouched. Protocol still Basic Auth. |
| Permission Set granting access to the External Credential | Untouched. |
| Twilio phone number `+1 866 547 5424` | Untouched. |
| Content Templates (HX… SIDs) | Untouched. |
| `Notification_Log__c` schema | Untouched. |

The **only** thing that changed is the two text fields inside the Principal record. Everything in Apex, every other Setup record, and every Twilio asset is exactly as it was.