---
title: Twilio Auth — How It Actually Works
tags: [twilio, salesforce, named-credentials, security, notifications]
updated: 2026-05-11
related:
  - "[[E-Commerce - Twilio Set up]]"
  - "[[Twilio]]"
---

# Twilio Auth — How It Actually Works

A working mental model of how `TwilioSMSService.cls` authenticates against Twilio, why credentials live where they do, and what actually happens when you rotate them.

> **TL;DR** — Your Apex code never sees the Twilio credential. Salesforce reads it from the **Principal** on the External Credential at callout time and builds the `Authorization: Basic <base64>` header itself. Rotating credentials = editing the Principal. No deploy required.

---

## The 4 Layers

There are four distinct things involved. They each do exactly one job. Mixing them up is the #1 source of confusion.

| Layer | What it holds | You touch it when |
|---|---|---|
| **Apex code** (`TwilioSMSService.cls`) | The endpoint path + request body + the string `'callout:ohfy__Twilio_Named_Cred'` | Writing features |
| **Named Credential** (`ohfy__Twilio_Named_Cred`) | The base URL (`https://api.twilio.com`) + the "Generate Authorization Header" flag | Setting up the integration **once** |
| **External Credential** (`ohfy__Twilio_External_Cred`) | The auth protocol (Basic Auth) + which users get access via Permission Sets | Setting up the integration **once** |
| **Principal** (named `Twilio`) | The actual **Username + Password** — i.e. the secret | **Every credential rotation** |

```mermaid
flowchart TD
    A["Apex Code<br/><b>TwilioSMSService.cls</b><br/>references 'callout:ohfy__Twilio_Named_Cred'"]
    B["Named Credential<br/><b>ohfy__Twilio_Named_Cred</b><br/>URL: https://api.twilio.com<br/>☑ Generate Authorization Header"]
    C["External Credential<br/><b>ohfy__Twilio_External_Cred</b><br/>Protocol: Basic Auth<br/>Permission Set: who can use this"]
    D["Principal<br/><b>Twilio</b><br/>🔑 Username = SK... or AC...<br/>🔑 Password = secret/auth token"]

    A -->|"refers to by name"| B
    B -->|"linked to"| C
    C -->|"contains"| D

    style A fill:#1e3a5f,stroke:#4a9eff,color:#fff
    style B fill:#1e3a5f,stroke:#4a9eff,color:#fff
    style C fill:#1e3a5f,stroke:#4a9eff,color:#fff
    style D fill:#5f1e1e,stroke:#ff4a4a,color:#fff
```

The red box (Principal) is the only place the actual secret exists. Everything else is just plumbing pointing at it.

---

## What Happens When `http.send()` Runs

This is the part that's invisible — the auth header gets built inside `http.send()` by Salesforce platform code you can't read. Here's the trace:

```mermaid
sequenceDiagram
    autonumber
    participant Apex as TwilioSMSService.cls
    participant SF as Salesforce Platform<br/>(inside http.send)
    participant NC as Named Credential
    participant EC as External Credential
    participant P as Principal
    participant Twilio as api.twilio.com

    Apex->>Apex: endpoint = 'callout:ohfy__Twilio_Named_Cred/...Messages.json'
    Apex->>Apex: req.setEndpoint(endpoint)
    Apex->>SF: http.send(req)

    Note over SF: Sees 'callout:' prefix —<br/>resolves it before sending
    SF->>NC: Look up "ohfy__Twilio_Named_Cred"
    NC-->>SF: URL = https://api.twilio.com<br/>flag: Generate Auth Header = ON
    SF->>EC: Look up linked External Credential
    EC-->>SF: Protocol = Basic Auth
    SF->>P: Read Principal (matched via user's Permission Set)
    P-->>SF: Username = SK1234...<br/>Password = <secret>

    Note over SF: Build header:<br/>Authorization: Basic base64(SK1234...:secret)
    SF->>Twilio: POST https://api.twilio.com/2010-04-01/Accounts/AC.../Messages.json<br/>Authorization: Basic <base64>
    Twilio-->>SF: 201 Created (or 401 if creds bad)
    SF-->>Apex: HttpResponse
```

Steps 4–9 happen **automatically** because:
- The endpoint string starts with `callout:` (a Salesforce-only protocol that triggers Named Credential resolution).
- The Named Credential has **"Generate Authorization Header"** checked.

If either of those weren't true, no auth header would be attached, and Twilio would return `401`.

---

## What the Code Actually Looks Like

The relevant lines from `TwilioSMSService.cls`:

```apex
// Line 23 — reference to the Named Credential
private static final String NAMED_CREDENTIAL = 'callout:ohfy__Twilio_Named_Cred';

// Line 31 — Account SID for the URL path (NOT auth — see "URL vs Auth" below)
private static final String ACCOUNT_SID = 'ACe4c6b5faeb8677fee84ed3ed7148179d';

// Line 57-58 — build the endpoint
String endpoint = NAMED_CREDENTIAL
    + '/2010-04-01/Accounts/' + ACCOUNT_SID + '/Messages.json';

// Line 63 — attach to request
req.setEndpoint(endpoint);

// Line 70 — fire — auth header is injected HERE by Salesforce
HttpResponse res = http.send(req);
```

**Notice what's missing:**

- No username
- No password
- No `req.setHeader('Authorization', ...)`
- No reading of secrets from a Custom Setting, Custom Metadata, or Protected Custom Setting

That absence is deliberate. Secrets stay in **Setup metadata** (the Principal), never in Apex source. You cannot accidentally:
- `System.debug()` the Auth Token
- Commit it to git
- Leak it in a stack trace
- See it during a code review

---

## URL vs Auth — Two Different Uses of "Account SID"

This trips people up. The Account SID (`AC...`) shows up in two places, doing two completely different jobs:

```mermaid
flowchart LR
    subgraph URL ["URL Path — Routing"]
        U["https://api.twilio.com/2010-04-01/Accounts/<b>AC...</b>/Messages.json"]
        UN["= 'send this under THIS account'"]
        U --> UN
    end

    subgraph AUTH ["Authorization Header — Identity"]
        A["Authorization: Basic base64(<b>SK... or AC...</b>:secret)"]
        AN["= 'I am THIS credential, prove I can act'"]
        A --> AN
    end

    style URL fill:#1e3a5f,stroke:#4a9eff,color:#fff
    style AUTH fill:#5f1e1e,stroke:#ff4a4a,color:#fff
```

The `AC...` in the URL **never changes** — it identifies the account the message belongs to.

The `AC...` (or `SK...`) in the Authorization header **is the credential** — and that's what you rotate.

That's why `TwilioSMSService.cls` line 31 (`ACCOUNT_SID`) **does not change** during a rotation, even when you're moving from an Auth Token to an API Key. The new credential still belongs to the same account, so the URL path is still correct.

---

## Two Valid Credential Types

Twilio's API accepts Basic Auth from **two different kinds of credentials**:

```mermaid
flowchart TB
    subgraph T1 ["Type 1: Account Credential (DEPRECATED for us)"]
        T1U["Username = AC...<br/>(Account SID)"]
        T1P["Password = Account Auth Token"]
        T1S["Scope: <b>EVERYTHING</b><br/>Messages • Voice • Verify • Studio • Billing • Sub-accounts • IAM"]
        T1U --- T1P
        T1P --- T1S
    end

    subgraph T2 ["Type 2: API Key (CURRENT)"]
        T2U["Username = SK...<br/>(API Key SID)"]
        T2P["Password = API Key Secret"]
        T2S["Scope: <b>ONLY WHAT YOU GRANT</b><br/>e.g. Messaging → messages → Read, List, Create"]
        T2U --- T2P
        T2P --- T2S
    end

    Twilio["Twilio API<br/>looks at username prefix"]
    T1U -.-> Twilio
    T2U -.-> Twilio

    Twilio -->|"AC prefix → account credential"| Auth1["✅ Authenticated as full account"]
    Twilio -->|"SK prefix → API Key"| Auth2["✅ Authenticated with restricted scope"]

    style T1 fill:#5f1e1e,stroke:#ff4a4a,color:#fff
    style T2 fill:#1e5f1e,stroke:#4aff4a,color:#fff
    style Auth1 fill:#5f1e1e,stroke:#ff4a4a,color:#fff
    style Auth2 fill:#1e5f1e,stroke:#4aff4a,color:#fff
```

**Both produce the same `Authorization: Basic <base64>` header shape.** Salesforce doesn't know or care which type is in the Principal — it just base64s `Username:Password`. Twilio decides at validation time based on the prefix.

### Why API Keys are strictly better

| Property | Auth Token | API Key |
|---|---|---|
| Scope | Full account | Whatever you grant (Restricted Key) |
| Revocable independently | ❌ Only 2 slots (primary + secondary) | ✅ Unlimited keys, kill any one |
| Survives compromise gracefully | ❌ Full account blast radius | ✅ Limited to granted scope |
| Used per-environment | ❌ One token = whole account | ✅ Issue separate keys per env |

The Coinbase impersonation incident (May 2026) is exactly the failure mode an Auth Token enables: leaked credential → attacker can place Voice calls + send SMS + touch billing. The same leak with a Messages-only Restricted API Key → attacker can only send SMS under the same number, no Voice abuse possible.

---

## Mental Model: Building Keys

```mermaid
flowchart LR
    Building["🏢 Twilio Account<br/>AC e4c6b5fae..."]

    subgraph Doors ["Doors inside the building"]
        D1["📱 Messages"]
        D2["📞 Voice"]
        D3["🛡️ Verify"]
        D4["🎬 Studio"]
        D5["💳 Billing"]
    end

    Master["🗝️ Auth Token<br/>(MASTER KEY)<br/>opens every door"]
    Keycard["💳 Restricted API Key<br/>(SCOPED KEYCARD)<br/>opens only Messages"]

    Master -.->|"opens"| D1
    Master -.->|"opens"| D2
    Master -.->|"opens"| D3
    Master -.->|"opens"| D4
    Master -.->|"opens"| D5

    Keycard -.->|"opens"| D1

    Building --- Doors

    style Master fill:#5f1e1e,stroke:#ff4a4a,color:#fff
    style Keycard fill:#1e5f1e,stroke:#4aff4a,color:#fff
```

Same building (account), same lock mechanism (Basic Auth), different keys with different permissions.

---

## The "Switch to Secondary Auth Token" Confusion

Twilio supports **two simultaneously-valid Auth Tokens** (primary + secondary) for zero-downtime rotation. The intended flow is:

```mermaid
flowchart TD
    S0["Start: Primary token in use<br/>(this is the leaked one)"]
    S1["1. Promote a Secondary token<br/>(now BOTH are valid)"]
    S2["2. Switch Principal to use Secondary"]
    S3["3. Verify SMS still working"]
    S4["4. <b>Regenerate Primary</b><br/>(THIS is the step that revokes the leak)"]
    S5["✅ Leaked token is dead"]

    S0 --> S1 --> S2 --> S3 --> S4 --> S5

    SKIP["⚠️ If you stop at step 2<br/>the leaked Primary is still valid"]
    S2 -.->|"skip step 4"| SKIP

    style S0 fill:#5f1e1e,stroke:#ff4a4a,color:#fff
    style S4 fill:#5f5f1e,stroke:#ffff4a,color:#fff
    style S5 fill:#1e5f1e,stroke:#4aff4a,color:#fff
    style SKIP fill:#5f3a1e,stroke:#ff9a4a,color:#fff
```

**Why "just switch to secondary" feels like it does nothing:** because by itself, it doesn't revoke anything. Step 4 (regenerate Primary) is the actual revocation. And even with full rotation done, you're still using an account-level credential with full blast radius — which is why we moved to an API Key entirely instead.

---

## Credential Rotation Procedure (Current — API Key Model)

This is the procedure to use going forward. **All edits happen in Salesforce Setup — no code changes, no deploy.**

```mermaid
flowchart TD
    Start(["Need to rotate Twilio credentials"])

    A1["1. Twilio Console → Account → API Keys & Tokens<br/>Create new <b>Restricted</b> API Key<br/>Grant: Messaging → messages → Read, List, Create<br/>(no other scopes)"]
    A2["2. Capture SK... + Secret in 1Password<br/>⚠️ Secret is shown ONCE"]
    A3["3. Salesforce Setup → Named Credentials → External Credentials tab<br/>Edit <b>ohfy__Twilio_External_Cred</b> → edit Principal <b>Twilio</b>"]
    A4["4. Set Username = new SK...<br/>Set Password = new Secret<br/>Save"]
    A5["5. Verify with Anonymous Apex (see below)"]
    A6{"SMS arrives?<br/>Notification_Log__c Status = Sent?"}
    A7["6. Twilio Console → delete OLD API Key<br/>(actual revocation)"]
    A8["7. Update [[E-Commerce - Twilio Set up]] in Confluence"]
    Done(["✅ Rotation complete"])

    Fail["Re-check Principal — likely a paste error<br/>(Secret is long, easy to miss a char)"]

    Start --> A1 --> A2 --> A3 --> A4 --> A5 --> A6
    A6 -->|"Yes"| A7 --> A8 --> Done
    A6 -->|"No (401)"| Fail --> A4

    style Start fill:#1e3a5f,stroke:#4a9eff,color:#fff
    style A7 fill:#5f5f1e,stroke:#ffff4a,color:#fff
    style Done fill:#1e5f1e,stroke:#4aff4a,color:#fff
    style Fail fill:#5f3a1e,stroke:#ff9a4a,color:#fff
```

### Verification snippet (Anonymous Apex)

```apex
// Send to YOUR phone first — proves auth + delivery
Map<String,String> vars = TwilioSMSService.abandonedCartVars('Test Account', 'Alvaro');
TwilioSMSService.sendAndInsertLog(
    '+1XXXXXXXXXX',                  // your phone in E.164
    'HXxxxxxxxxxxxxxxxxxxxxxxxxxx',  // an existing Content SID
    vars,
    null,                            // Notification__c Id — null for smoke test
    null                             // Contact Id — null for smoke test
);
```

Then:

```sql
SELECT Id, Status__c, Sent_At__c, Error_Message__c
FROM Notification_Log__c
ORDER BY CreatedDate DESC LIMIT 1
```

Expect: `Status__c = 'Sent'`, `Error_Message__c` empty, SMS on phone.

---

## What NOT to Touch

| Thing | Why not |
|---|---|
| `ACCOUNT_SID` constant in Apex (line 31) | URL path identifier — not auth. Same account, same URL. |
| `FROM_NUMBER` constant in Apex (line 27) | Phone number routing — independent of auth. |
| `NAMED_CREDENTIAL` constant in Apex (line 23) | Setup metadata name — only changes if you rename the Named Credential. |
| The Named Credential record itself | URL + "Generate Auth Header" flag don't change during rotation. |
| The External Credential record itself | Protocol stays Basic Auth. |
| The Principal **name** ("Twilio") | Only the *values inside* the Principal change. |

---

## Common Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| `HTTP 401: Authentication Error` | Bad Username/Password in Principal — usually a paste error in the Secret | Re-paste the Secret carefully. Salesforce doesn't validate on save. |
| `HTTP 401` even with correct creds | The user running the callout doesn't have the Permission Set granting access to the External Credential | Setup → Permission Sets → grant External Credential Principal Access |
| `HTTP 403` with "permission" wording | API Key scope too narrow — missing Messages → Create or similar | Twilio Console → edit Restricted Key → add scope |
| `HTTP 404` with valid-looking URL | `ACCOUNT_SID` constant in Apex doesn't match the account the API Key belongs to | Realign — the URL account must match the credential's account |
| `Unauthorized endpoint, please check Setup` Apex error | The Named Credential name in `NAMED_CREDENTIAL` doesn't match what's in Setup, or the Named Cred doesn't exist in the target org | Deploy the Named Credential metadata or fix the name |
| No `Authorization` header sent at all | "Generate Authorization Header" unchecked on Named Credential | Setup → Named Credential → check the box |

---

## Why the Split Exists (Design Rationale)

Salesforce intentionally splits the four layers so that:

- **Developers** write code referencing `callout:<name>` and never see secrets. Code can be open-sourced, code-reviewed, or shared without leaking credentials.
- **Admins** rotate secrets in the Principal without redeploying or even reading the code. A credential rotation is one Setup edit and zero Apex changes.
- **Secrets** live in encrypted metadata storage, segregated from source code.
- **Permission Sets** gate who can use which Principal — so test users / sandbox refreshes don't accidentally inherit production credentials.

This is why "the code never touches the credential" is a *feature*, not a limitation. It means rotating credentials is fast, low-risk, and auditable — exactly what you want during an incident response.

---

## Related

- [[E-Commerce - Twilio Set up]] — the integration setup doc (needs update to reflect API Key model)
- [[Twilio]] — Twilio account / general notes
- `force-app/main/default/classes/notifications/TwilioSMSService.cls` — implementation
- Twilio docs: [API Keys vs Auth Tokens](https://www.twilio.com/docs/iam/keys/api-key)
- Salesforce docs: [Named Credentials as Callout Endpoints](https://help.salesforce.com/s/articleView?id=sf.named_credentials_about.htm)

---







## Wire-Level: What Actually Goes Over the Wire (Per Principal Type)

The HTTP shape is **identical** between the two principal types. Only the bytes inside the `Authorization` header differ — and that difference is what Twilio uses to decide what the request is allowed to do.

### The request — same for both principal types

```http
POST /2010-04-01/Accounts/ACe4c6b5faeb8677fee84ed3ed7148179d/Messages.json HTTP/1.1
Host: api.twilio.com
Authorization: Basic <base64(username:password)>      ← THIS is the only thing that changes
Content-Type: application/x-www-form-urlencoded
Content-Length: <n>

To=%2B16175551234&From=%2B18665475424&ContentSid=HXxxxxxxxxxxxxxxxxxxxxxxxxxx&ContentVariables=%7B%221%22%3A%22Acme%22%2C%222%22%3A%22Alvaro%22%7D
```

Notes:
- The `AC...` **in the URL path** is the Account SID — it identifies *whose account this Message resource belongs to*. Always present. Never changes during a credential rotation.
- The `Authorization` header is built by Salesforce platform code (the "Generate Authorization Header" flag on the Named Credential). Apex never sees it.
- Body is URL-encoded form data. `ContentSid` references the Twilio Content Template; `ContentVariables` is a JSON object stringified then URL-encoded.

### Case 1 — Principal = Account SID + Auth Token

| Principal field | Value |
|---|---|
| Username | `ACe4c6b5faeb8677fee84ed3ed7148179d` (Account SID, `AC...` prefix) |
| Password | `<32-char Auth Token>` from Twilio Console → Account → API Keys & Tokens |

**Header sent:**

```
Authorization: Basic QUNlNGM2Yj...OmF1dGhfdG9rZW4=
                     └─ base64("ACe4c6b5...:<auth_token>")
```

**How Twilio validates:** sees `AC` prefix → treats credential as **account-level**. Looks up the Auth Token attached to that Account SID. If it matches (primary or secondary), authenticated.

**Access granted — full account, every endpoint:**

| Resource | Operations allowed |
|---|---|
| `/Messages` | send, read, list, redact, delete |
| `/Calls` | place, read, list, modify in-flight, recordings |
| `/IncomingPhoneNumbers` | buy, release, reconfigure (change voice/SMS URLs) |
| `/Verify/v2/Services` | create services, send verification codes |
| `/Studio/v2/Flows` | trigger/modify any flow |
| `/Keys` | **create new API Keys, delete any API Key** (incl. rotating itself) |
| `/Accounts/{sid}` | rename account, change Auth Token, suspend |
| `/Accounts/{sid}/Balance` | read balance, trigger top-ups (if billing configured) |
| Sub-accounts (`/Accounts`) | create, suspend, delete |
| Lookup, Insights, Conversations, TaskRouter, etc. | full access |

In short: **leaking this credential = full account compromise.** An attacker can place premium-rate Voice calls (the actual Coinbase impersonation attack vector), pivot to billing, mint new API Keys with stealth names, and lock you out by rotating the Auth Token themselves.

### Case 2 — Principal = API Key SID + Secret

| Principal field | Value |
|---|---|
| Username | `SK<32 hex chars>` (API Key SID, `SK...` prefix) |
| Password | API Key Secret (shown **once** at creation) |

**Header sent:**

```
Authorization: Basic U0thYmNk...OnNlY3JldA==
                     └─ base64("SKabcd...:<secret>")
```

**How Twilio validates:** sees `SK` prefix → looks up the API Key record. Two checks:
1. The Secret matches what was stored (hashed) at creation.
2. The API Key belongs to the Account SID in the URL path. (An `SK` from a different account → `401 Unauthorized`.)

If valid, Twilio resolves the **policy attached to the key** and applies it to the request.

**Access granted — depends entirely on the key's type:**

| Key type | Scope at creation | What it can hit |
|---|---|---|
| **Main API Key** | Equivalent to an Auth Token — full account | Same table as Case 1. Not what we want. |
| **Restricted API Key** | You explicitly grant per-product, per-action permissions | Only what you ticked. Everything else → `403 Forbidden`. |

For OHFY-Ecom we use a **Restricted Key with only**:

```
Product: Messaging
  └── Resource: messages
        └── Actions: Read, List, Create
```

That grants:

| Endpoint | Allowed? |
|---|---|
| `POST /2010-04-01/Accounts/AC.../Messages.json` (send SMS) | ✅ — Create |
| `GET  /2010-04-01/Accounts/AC.../Messages.json` (list) | ✅ — List |
| `GET  /2010-04-01/Accounts/AC.../Messages/SM.../Media` | ✅ — Read |
| `POST /2010-04-01/Accounts/AC.../Calls.json` (place call) | ❌ `403` |
| `POST /2010-04-01/Accounts/AC.../IncomingPhoneNumbers.json` (buy number) | ❌ `403` |
| `POST /2010-04-01/Accounts/AC.../Keys.json` (mint new key) | ❌ `403` |
| `POST /2010-04-01/Accounts/AC...` (change Auth Token) | ❌ `403` |
| `POST /v2/Services/...` (Verify, Studio, Conversations) | ❌ `403` |
| `GET  /2010-04-01/Accounts/AC.../Balance.json` (billing) | ❌ `403` |

**Leaking this credential = SMS-only blast radius.** Attacker can send SMS from `+18665475424` (could waste credit, could phish your customers from your number — still bad), but cannot place Voice calls, cannot touch billing, cannot mint replacement keys, cannot lock you out. You revoke by deleting the single `SK` in Twilio Console — no other workloads disturbed.

### Quick side-by-side

| Property | Account SID + Auth Token | API Key SID + Secret (Restricted) |
|---|---|---|
| Username sent | `AC...` | `SK...` |
| Twilio routes auth via | Account record | API Key record + attached policy |
| Endpoints reachable | All Twilio products | Only granted resources/actions |
| Revocable independently | ❌ Only 2 slots (primary + secondary), shared by everything | ✅ Unlimited keys, kill any one |
| Per-environment isolation | ❌ One token = whole account | ✅ Issue separate keys per env |
| Blast radius if leaked | Full account (Voice, billing, IAM) | Only what's granted (e.g. SMS-only) |
| Identifies *which* account in URL | n/a — username IS the account | URL still needs `AC...` path; key must belong to it |

### Implication for the Apex code

Zero. `TwilioSMSService.cls` builds the same URL and request body regardless. The only place the difference exists is the **Principal record in Setup** — flip `Username` from `AC...` to `SK...` and `Password` from Auth Token to API Key Secret, and the same Apex will start sending the new header. No deploy.

> If you ever see `403 Forbidden` (not `401`) from Twilio, that's the signature of a **Restricted API Key hitting an endpoint outside its grant** — not a credential problem. Either widen the key's scope in Twilio Console or stop calling that endpoint from Apex.
