
Note - Account SID alone cannot authenticate or make API calls — it's an identifier, not a credential. Without the Auth Token paired with it, it's useless for sending messages.

# Twilio Enablement Guide

Setup steps for both the Twilio console side and the Salesforce side to enable SMS notifications.

---

## Credential Glossary

|             |             |                                |                                                                              |
| ----------- | ----------- | ------------------------------ | ---------------------------------------------------------------------------- |
| Term        | Starts With | Where It Lives                 | What It Does                                                                 |
| Account SID | `AC...`     | Twilio console (top-left)      | Identifies your Twilio account — goes in URL path and as Basic Auth username |
| Auth Token  | _(masked)_  | Twilio console (top-left)      | Basic Auth password — used alongside Account SID                             |
| Content SID | `HX...`     | Content Template Builder       | References an SMS template                                                   |
| From Number | `+1...`     | Twilio console → Phone Numbers | Sender number                                                                |

---

## Part 1 — Twilio Console Setup

### 1.1 — Confirm Account SID and Auth Token

1. Log in to [console.twilio.com](https://console.twilio.com/ "https://console.twilio.com")
    
2. Top-left of the dashboard — copy your **Account SID** (`AC...`) and **Auth Token**
    
3. Go to **Phone Numbers → Manage → Active Numbers** — confirm `+18665475424` is listed and SMS-capable
    

### 1.2 — Build SMS Content Templates

Templates must be built in Twilio **before** the variable maps in `TwilioSMSService.cls` can be finalized.

1. Console → **Messaging → Content Template Builder** → **Create new template**
    
2. Build each template below, note the `HX...` Content SID, and store it on the corresponding `Notification__c` record (`Twilio_Content_SID__c` field)
    

**Templates to build:**

|   |   |   |
|---|---|---|
|Notification|Developer Key|Template Notes|
|Order Confirmation|`ORDER_CONFIRMATION`|Include customer name + order number|
|Abandoned Cart Reminder|`ABANDONED_CART_REMINDER`|Include customer name + link or prompt|

**Variable index rules:**

- Variables are referenced as `{{1}}`, `{{2}}`, `{{3}}` in the template body
    
- Index positions must match the `Map<String,String>` returned by each variable builder method in `TwilioSMSService.cls`
    
- Once a template is approved, **do not reorder variables** — it will break existing sends
    
- All templates require **approval** before sending to non-verified numbers in production
    

### 1.3 — (Production) Register 10DLC or Toll-Free Verification

SMS delivery to US numbers requires carrier registration before going to production.

- **Toll-free numbers** (like `+18665475424`): Console → **Messaging → Regulatory Compliance → Toll-Free Verification**
    
- **10DLC (local numbers)**: Requires Brand + Campaign registration — longer lead time
    
- Unverified sending will result in carrier filtering/blocking
    

---

## Part 2 — Salesforce Setup

### 2.1 — External Credential

1. Setup → search **"Named Credentials"** → **External Credentials** tab → find `ohfy__Twilio` (or create new)
    
2. Settings:
    
    - Label: `Twilio_External_Cred`
        
    - Name: `ohfy__Twilio_External_Cred`
        
    - Authentication Protocol: **Basic Authentication**
        
3. Save
    
4. On the External Credential record → **Principals** section → edit the existing principal (or New)
    
    - Parameter Name: `Twilio`
        
    - Identity Type: `Named Principal`
        
    - Username: `ACe4c6b5faeb8677fee84ed3ed7148179d` _(Account SID)_
        
    - Password: `___________________________` _(Auth Token from step 1.1)_
        
5. Save
    

### 2.2 — Named Credential

1. **Named Credentials** tab → find `ohfy__Twilio_Named_Cred` (or create new)
    
2. Settings:
    
    - Label: `Twilio`
        
    - Name: `ohfy__Twilio_Named_Cred` ← must match `callout:ohfy__Twilio_Named_Cred` in `TwilioSMSService.cls`
        
    - URL: `<https://api.twilio.com`>
        
    - External Credential: `Twilio_External_Cred`
        
3. Check **"Generate Authorization Header"** ← required; Salesforce automatically sends `Authorization: Basic <encoded>` on every callout
    
4. Do **not** add any custom Authorization header formula — the checkbox handles it
    
5. Save
    

### 2.3 — Remote Site Setting

Salesforce may auto-create this. If callouts fail with a network error, add it manually:

1. Setup → **Remote Site Settings** → **New**
    
2. Name: `Twilio`
    
3. URL: `<https://api.twilio.com`>
    
4. Save
    

### 2.4 — Permission Set Access to External Credential

The running user (integration user or community user profile context) must have access to the External Credential principal.

1. (Not tested but would work in theory) Setup → **Permission Sets** → open the permission set used by your integration/service context
    
2. **Dedicated E-Commerce Profile → External Credential Principal Access** → **Edit** → add `Twilio - Twilio`
    
3. Save
    

### 2.5 — Verify `TwilioSMSService.cls` Constants

No secrets are stored in code. The only constants that need to match your org:

`private static final String NAMED_CREDENTIAL = 'callout:ohfy__Twilio_Named_Cred'; private static final String FROM_NUMBER = '+18665475424'; private static final String ACCOUNT_SID = 'ACe4c6b5faeb8677fee84ed3ed7148179d';`

Auth is handled entirely by the Named Credential — no credentials in Apex.

### 2.6 — Seed `Notification__c` Records

`sfdx force:apex:execute -f "scripts/e-commerce/seed-notifications.cls"`

Insert one record per notification type with the Content SID from step 1.2:

|   |   |   |   |
|---|---|---|---|
|Name|Developer_Key__c|Supports_SMS__c|Twilio_Content_SID__c|
|Order Confirmation|`ORDER_CONFIRMATION`|true|`HX...` from Twilio|
|Abandoned Cart Reminder|`ABANDONED_CART_REMINDER`|true|`HX...` from Twilio|

### 2.7 — Fill In Template Variable Maps

Once templates are built and variable positions are confirmed, update the three variable builder methods in `TwilioSMSService.cls`:

- `orderConfirmationVars()` — fill template preview text + variable mapping comments
    
- `deliveryCutoffVars()` — fill template preview text + variable mapping comments
    
- `abandonedCartVars()` — fill template preview text + variable mapping comments
    

---

## Part 3 — Open Items (Not Yet Done)

|   |   |
|---|---|
|Item|What's Needed|
|Null phone guard|Ensure Contact `MobilePhone` or `Phone` is consistently populated upstream|
|Twilio STOP webhook|Console → Messaging → configure webhook URL to call a Salesforce endpoint that sets `SMS_Enabled__c = false` on `Contact_Notification__c`|
|Twilio error handling|Define behavior for bad number (21211), unsubscribed (21610), rate limit (429)|
|Default preferences|Auto-create `Contact_Notification__c` on community user creation|
|Governor limits|Add date scoping + batch sizing to scheduled Apex jobs before production load|

---

## Part 4 — Testing a Send (Sandbox)

Once setup is complete, test a single send from **Anonymous Apex**:

`// Replace with a verified test number in your Twilio account String testPhone = '+1__________'; // Replace with a real HX... Content SID from your Twilio templates String contentSid = 'HX__________'; Map<String, String> vars = new Map<String, String>{ '1' => 'Test User', '2' => '#TEST-001' }; TwilioSMSService.sendAndInsertLog(testPhone, contentSid, vars, null, null);`

Check `Notification_Log__c` for a `Sent` status record after execution.

> During Twilio trial, outbound SMS can only be sent to **verified caller IDs**. Add your test number at Console → Phone Numbers → Verified Caller IDs.