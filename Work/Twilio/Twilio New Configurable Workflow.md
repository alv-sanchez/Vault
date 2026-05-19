# Twilio — New Configurable Workflow

> **Goal**: Lift the three hardcoded Twilio values out of `TwilioSMSService.cls` (Account SID, From Number, Named Credential name) into admin-editable Salesforce configuration. Keep all existing send behavior intact.
>
> **Recommended solution**: Native Salesforce `Twilio_Config__mdt` Custom Metadata Type with a single `Default` record. Tray.io kept as a documented alternative.

## Related
- [[E-Commerce - Twilio Set up]] — current setup manual (the doc this workflow replaces parts of)
- [[E-Commerce - Rotate Twilio API credentials to remediate unauthorized account access]] — why getting secrets out of code matters
- [[Twilio Workflow]] — original workflow diagram
- Plan file (local): `~/.claude/plans/id-like-to-remove-stateless-coral.md`

---

## 1 — Current State (Problem)

Three values are hardcoded in `TwilioSMSService.cls`. Every environment swap (sandbox → prod, dev → QA) or rebrand requires editing Apex and redeploying.

```mermaid
flowchart LR
    subgraph Apex["TwilioSMSService.cls"]
        direction TB
        C1["NAMED_CREDENTIAL<br/>'callout:ohfy__Twilio_Named_Cred'<br/><i>line 23</i>"]
        C2["FROM_NUMBER<br/>'+18665475424'<br/><i>line 27</i>"]
        C3["ACCOUNT_SID<br/>'ACe4c6b5fae...'<br/><i>line 31</i>"]
        SEND["send() / sendAndInsertLog()"]
        C1 --> SEND
        C2 --> SEND
        C3 --> SEND
    end

    SEND -->|"POST /2010-04-01/Accounts/{SID}/Messages.json"| TW["Twilio API"]

    EC["External Credential<br/>ohfy__Twilio_External_Cred<br/><i>Auth Token (Basic Auth password)</i>"] -.-> SEND

    style C1 fill:#ffe4e1,stroke:#c0392b
    style C2 fill:#ffe4e1,stroke:#c0392b
    style C3 fill:#ffe4e1,stroke:#c0392b
    style EC fill:#e8f5e9,stroke:#27ae60
```

| Symbol | Meaning |
|---|---|
| 🟥 Red boxes | Hardcoded — require code edit + deploy to change |
| 🟩 Green boxes | Already correctly externalized |

**Auth Token is fine** — it lives on the External Credential Principal (Basic Auth password) and never appears in code. The problem is the three URL/routing values that *should* be config but aren't.

---

## 2 — Proposed State (Solution)

Introduce `Twilio_Config__mdt` as a thin config layer between the service and the API. The service reads it once per transaction (cached) and proceeds exactly as before.

```mermaid
flowchart LR
    subgraph Setup["Salesforce Setup (Admin)"]
        CMDT["Twilio_Config__mdt<br/>Record: 'Default'<br/>━━━━━━━━━━━━<br/>Account_SID__c<br/>From_Number__c<br/>Named_Credential_API_Name__c<br/>Is_Active__c"]
    end

    subgraph Apex["TwilioSMSService.cls"]
        GET["config getter<br/><i>cached static</i>"]
        SEND["send() /<br/>sendAndInsertLog()"]
        GET --> SEND
    end

    CMDT -->|"getInstance('Default')"| GET

    EC["External Credential<br/>ohfy__Twilio_External_Cred<br/><i>Auth Token</i>"] -.->|Basic Auth header<br/>via Named Credential| SEND

    SEND -->|"POST"| TW["Twilio API"]

    style CMDT fill:#e3f2fd,stroke:#1976d2
    style EC fill:#e8f5e9,stroke:#27ae60
    style GET fill:#fff8e1,stroke:#f57c00
```

| Symbol | Meaning |
|---|---|
| 🟦 Blue | New admin-editable config layer |
| 🟩 Green | Unchanged — still owns the secret |
| 🟨 Yellow | New cached getter inside the service |

### Why Custom Metadata Type
- **No deploy to change a value** — admin edits in Setup UI.
- **Deployable defaults** — the `Default` record ships in `force-app/main/default/customMetadata/` so fresh orgs get sensible values on first deploy.
- **No SOQL cost** — `getInstance()` doesn't count against query limits.
- **Test-friendly** — `@TestVisible` override slot lets tests inject fakes without inserting CMDT records (which Apex tests can't do anyway).
- **Auth stays put** — Account SID is *also* the Basic Auth username on the External Credential. We're not duplicating the secret; we're storing the SID separately because it's *also* needed in the URL path, not just for auth.

---

## 3 — Send Sequence (Before vs After)

Side-by-side of an order confirmation send. The only difference is the orange step — a cached config read at the top.

### 3a — Current

```mermaid
sequenceDiagram
    participant OCS as OrderConfirmationService
    participant TSS as TwilioSMSService
    participant NC as Named Credential<br/>(Basic Auth)
    participant TW as Twilio API
    participant LOG as Notification_Log__c

    OCS->>TSS: sendAndInsertLog(phone, contentSid, vars, notifId, contactId)
    Note over TSS: Reads hardcoded constants<br/>(NAMED_CREDENTIAL, ACCOUNT_SID,<br/>FROM_NUMBER) from class fields
    TSS->>TSS: buildBody(toPhone, contentSid, vars)
    TSS->>NC: POST /Accounts/{SID}/Messages.json
    NC->>TW: + Authorization: Basic <encoded>
    TW-->>NC: 201 Created (or 4xx)
    NC-->>TSS: HttpResponse
    TSS->>LOG: insert Notification_Log__c (Sent/Failed)
```

### 3b — Proposed

```mermaid
sequenceDiagram
    participant OCS as OrderConfirmationService
    participant TSS as TwilioSMSService
    participant CMDT as Twilio_Config__mdt
    participant NC as Named Credential<br/>(Basic Auth)
    participant TW as Twilio API
    participant LOG as Notification_Log__c

    OCS->>TSS: sendAndInsertLog(phone, contentSid, vars, notifId, contactId)
    rect rgb(255, 243, 224)
        TSS->>CMDT: getInstance('Default')
        CMDT-->>TSS: {Account_SID, From_Number, NC_Name, Is_Active}
        Note over TSS: Cached for the rest of the transaction
    end
    alt Is_Active__c == false
        TSS->>LOG: insert Notification_Log__c (Skipped — config inactive)
    else Is_Active__c == true
        TSS->>TSS: buildBody(toPhone, contentSid, vars)
        TSS->>NC: POST /Accounts/{config.SID}/Messages.json
        NC->>TW: + Authorization: Basic <encoded>
        TW-->>NC: 201 Created (or 4xx)
        NC-->>TSS: HttpResponse
        TSS->>LOG: insert Notification_Log__c (Sent/Failed)
    end
```

**No signature changes.** `OrderConfirmationService` and `AbandonedCartReminderBatch` call the service exactly as they do today.

---

## 4 — Admin Edit Workflow

What an admin does when the Twilio account changes (e.g., new From Number purchased, or sandbox uses a different Account SID).

```mermaid
flowchart TD
    A["Admin needs to change<br/>From Number or Account SID"] --> B["Setup → Custom Metadata Types"]
    B --> C["Twilio Config → Manage Records"]
    C --> D["Edit 'Default' record"]
    D --> E["Update field(s),<br/>Save"]
    E --> F{"Next SMS send<br/>in this org"}
    F --> G["Reads new value<br/>from CMDT cache"]
    G --> H["Send succeeds with<br/>new From/SID"]

    style A fill:#fff
    style D fill:#e3f2fd,stroke:#1976d2
    style H fill:#e8f5e9,stroke:#27ae60
```

**Total time**: ~30 seconds. **Deploy required**: no. **Code change**: none.

Contrast with today: open `TwilioSMSService.cls` → edit lines 27/31 → commit → PR review → merge → deploy → smoke test → done. ~2 hours minimum, longer if a release window is required.

---

## 5 — Kill-Switch Behavior

The `Is_Active__c` flag is a cheap incident-response lever. If Twilio is degraded, a Twilio account is suspended, or the team needs to silence all outbound SMS during a sensitive customer event, an admin can flip one checkbox and *all* sends short-circuit to `Skipped` — no failed callouts, no error noise in `Notification_Log__c`, no governor limit pressure.

```mermaid
stateDiagram-v2
    [*] --> Active: Is_Active__c = true (default)

    Active --> Inactive: Admin unchecks<br/>Is_Active__c

    state Active {
        [*] --> CallTwilio: Send requested
        CallTwilio --> Sent: 201
        CallTwilio --> Failed: 4xx/5xx
    }

    state Inactive {
        [*] --> Skipped: Send requested<br/>(short-circuit before callout)
    }

    Inactive --> Active: Admin re-checks<br/>Is_Active__c
```

When `Inactive`:
- `Notification_Log__c.Status__c = 'Skipped'`
- `Notification_Log__c.Error_Message__c = 'Twilio config inactive'`
- Zero HTTP callouts → zero governor limit consumption → safe to leave off indefinitely.

---

## 6 — Data Model (Unchanged)

The notification framework's object model is untouched. The new `Twilio_Config__mdt` sits next to it, not inside it.

```mermaid
erDiagram
    Notification__c {
        text Developer_Key__c "ORDER_CONFIRMATION, etc."
        text Twilio_Content_SID__c "HX..."
        checkbox Supports_SMS__c
        checkbox Is_Active__c
    }
    Contact_Notification__c {
        lookup Contact__c
        lookup Notification__c
        checkbox SMS_Enabled__c
        checkbox Email_Enabled__c
    }
    Notification_Log__c {
        lookup Notification__c
        lookup Contact__c
        picklist Channel__c "SMS | Email"
        picklist Status__c "Sent | Skipped | Failed"
        datetime Sent_At__c
        longtext Error_Message__c
    }
    Twilio_Config__mdt {
        text Account_SID__c "AC..."
        text From_Number__c "+1... or MG..."
        text Named_Credential_API_Name__c
        checkbox Is_Active__c
    }

    Notification__c ||--o{ Contact_Notification__c : "preferences"
    Notification__c ||--o{ Notification_Log__c : "logs"
    Contact_Notification__c }o--|| Notification_Log__c : "audited via"
```

`Twilio_Config__mdt` is intentionally isolated — it has no relationships to the notification data because it's infrastructure config, not business data.

---

## 7 — Code Changes (Scope)

```mermaid
flowchart LR
    subgraph New["✚ New files"]
        N1["objects/Twilio_Config__mdt/<br/>Twilio_Config__mdt.object-meta.xml"]
        N2["objects/Twilio_Config__mdt/fields/<br/>Account_SID__c<br/>From_Number__c<br/>Named_Credential_API_Name__c<br/>Is_Active__c"]
        N3["customMetadata/<br/>Twilio_Config.Default.md-meta.xml"]
    end

    subgraph Modified["✎ Modified files"]
        M1["classes/notifications/<br/>TwilioSMSService.cls<br/><i>Remove constants, add getter</i>"]
        M2["classes/notifications/<br/>TwilioSMSService_T.cls<br/><i>Inject configOverride</i>"]
    end

    subgraph Untouched["○ Untouched callers"]
        U1["OrderConfirmationService.cls"]
        U2["AbandonedCartReminderBatch.cls"]
        U3["Named Credential metadata"]
        U4["External Credential metadata"]
    end

    style New fill:#e8f5e9,stroke:#27ae60
    style Modified fill:#fff8e1,stroke:#f57c00
    style Untouched fill:#eceff1,stroke:#607d8b
```

---

## 8 — Alternative: Tray.io (Documented, Not Recommended Today)

Captured because it was previously suggested. The engineer who proposed it has since left, so it's preserved here as a deliberate-revisit option rather than tribal knowledge that will get rediscovered later.

```mermaid
flowchart LR
    subgraph SF["Salesforce"]
        SVC["NotificationService<br/>(publishes event)"]
        PE["Platform Event:<br/>NotificationRequested__e"]
        LOG["Notification_Log__c<br/>(written back)"]
        SVC --> PE
    end

    subgraph Tray["Tray.io Workflow"]
        TRIG["Trigger:<br/>Salesforce PE listener"]
        SECRET["Tray secrets:<br/>Account SID, Auth Token,<br/>From Number"]
        BUILD["Build Twilio<br/>request"]
        TRIG --> BUILD
        SECRET --> BUILD
    end

    BUILD -->|HTTPS| TW["Twilio API"]
    BUILD -->|Salesforce connector| LOG

    PE --> TRIG

    style SECRET fill:#e3f2fd,stroke:#1976d2
```

### When Tray would be the right call
- Multi-channel orchestration coming (WhatsApp, push, multiple SMS vendors) — one playbook beats one service per channel.
- Need visual retry/backoff/branching that's painful to express in Apex.
- Compliance requires PII never lands in Salesforce-side logs.
- Team-wide iPaaS strategy already in place.

### Why not now
- **None of the above apply today** — one channel, one vendor, low volume.
- Adds vendor cost + contract.
- Adds a new failure surface (Tray uptime, connector auth refresh, workflow versioning).
- Doesn't solve "hardcoded values" any better than CMDT — Tray secrets are just config in a different system.

### Tradeoff matrix

| Concern | CMDT (recommended) | Tray.io |
|---|---|---|
| Admin can change values without deploy | ✅ Setup UI | ✅ Tray UI |
| New vendor / contract / cost | ❌ none | ⚠️ yes |
| New failure surface | ❌ none | ⚠️ Tray uptime + connector |
| Multi-channel orchestration | ⚠️ one service per channel | ✅ central playbook |
| Time-to-implement | ✅ ~1 day | ⚠️ multi-week |
| PII out of Salesforce logs | ❌ no change | ✅ possible |
| Reversibility | ✅ trivial | ⚠️ migration cost both ways |

**Verdict**: CMDT now. Revisit Tray (or any iPaaS) when a second channel/vendor enters the picture, not before.

---

## 9 — Verification Plan

```mermaid
flowchart TD
    A["Deploy CMDT + Default record<br/>+ refactored TwilioSMSService"] --> B["Run TwilioSMSService_T tests"]
    B --> C{"All green?"}
    C -->|No| FIX["Fix + redeploy"] --> B
    C -->|Yes| D["Anonymous Apex:<br/>send to verified test number"]
    D --> E{"Notification_Log__c<br/>shows 'Sent'?"}
    E -->|No| TROUBLESHOOT["Check CMDT record exists,<br/>NC auth header, From verified"] --> D
    E -->|Yes| F["Admin smoke test:<br/>change From_Number__c to<br/>magic-invalid +15005550006"]
    F --> G{"Next send logs<br/>'Failed' with HTTP 21212?"}
    G -->|Yes| H["Restore real From_Number__c"]
    G -->|No| TROUBLESHOOT
    H --> I["Kill-switch test:<br/>uncheck Is_Active__c"]
    I --> J{"Next send logs<br/>'Skipped — config inactive'?"}
    J -->|Yes| K["Re-enable Is_Active__c"]
    J -->|No| TROUBLESHOOT
    K --> L["Caller regression:<br/>real order confirmation<br/>+ abandoned cart batch"]
    L --> M{"SMS arrives at<br/>verified number?"}
    M -->|Yes| DONE["✓ Ship"]
    M -->|No| TROUBLESHOOT

    style DONE fill:#e8f5e9,stroke:#27ae60
    style TROUBLESHOOT fill:#ffe4e1,stroke:#c0392b
```

---

## 10 — Summary

| Question | Answer |
|---|---|
| Is Tray the only option? | No. Custom Metadata is the recommended path for this scope. |
| Will existing functionality break? | No. Call signatures unchanged; defaults shipped with the CMDT seed record. |
| How long to implement? | ~1 day (object + fields + seed record + service refactor + tests + docs). |
| Future migration to Tray possible? | Yes — the service is the only abstraction layer; swapping it for a Platform Event publisher is contained. |
| What does "hardcoded" really mean today? | Three values in one file. The Auth Token is already correctly externalized; we're finishing the job. |



```
wait wouldnt Twilio_Config__mdt be visible within the 
admin data? wouldnt that pose a risk?


leaving Account_SID__c and From_Number__c             
Named_Credential_API_Name__c and Is_Active__c?   

```     

⏺ Good catch — that's exactly the right question to ask
before shipping. Pausing implementation to address it.
∞
Short answer: the four CMDT fields are not
credentials, so admin visibility is not a security
risk by itself. Here's the breakdown:

Field: Account_SID__c
Sensitivity: Low
Why: An identifier, not a credential. Your own setup
doc says it (line 2): "Account SID alone cannot
authenticate or make API calls — it's an
identifier,
not a credential. Without the Auth  Token paired
with it, it's useless for sending  messages."
────────────────────────────────────────
Field: From_Number__c
Sensitivity: None
Why: A public-facing phone number. Anyone who ever
received an SMS from us already saw it. It's also in

Twilio regulatory filings, the toll-free
verification
record, etc.
────────────────────────────────────────
Field: Named_Credential_API_Name__c
Sensitivity: None
Why: Salesforce metadata API name. Already visible to
anyone with Setup access; not a secret.
────────────────────────────────────────
Field: Is_Active__c
Sensitivity: None
Why: A boolean toggle.

The actual credential — the Auth Token — never enters
the CMDT. It stays where it already is: encrypted on
the External Credential Principal (Basic Auth
password). That separation is the whole point: the SID
is useless without the token, and the token isn't
here.