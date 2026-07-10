---
title: Twilio T&S reply — TCPA / honeypot report on +18665317946
created: 2026-05-27
status: draft
related_did: "+18665317946"
related_report: "[[twilio-investigation-findings-18665317946]]"
twilio_case_ref: "(to be filled in from Twilio's original email)"
recipient: "(to be filled in — Twilio T&S contact name)"
---

# Twilio Trust & Safety reply — impacted MDN +18665317946

## Subject

> Re: TCPA / honeypot report — Investigation findings for impacted MDN +18665317946

## Body

Hi **Twilio Compliance Operations** (Twilio Support),

Thank you for the notification. We have completed our internal
investigation into the activity on the impacted MDN +18665317946.
Findings summary below; the full investigation report and the supporting
call-activity export are attached.

### Summary of findings

The Twilio data corroborates and substantially expands the scope of the
honeypot report:

- The single honeypot-flagged call on 2026-04-25 16:20:31 UTC is one of
  **1,744 outbound calls** originated from the impacted MDN
  +18665317946 over a ~45-hour window (2026-04-23 19:09 UTC →
  2026-04-25 16:53 UTC).
- Direction breakdown: **1,740 of 1,744 calls are "Outgoing API"**
  (authenticated REST POST to `/2010-04-01/Accounts/.../Calls.json`
  with inline TwiML supplied in the request body). The remaining 4
  are "Outgoing Dial", consistent with bridged legs initiated when a
  called party pressed 1.
- The impacted MDN's Voice Configuration in the Twilio Console has
  **no Voice URL, no Fallback URL, and no Status Callback URL** set.
  With no inbound TwiML handler, the "press 1 to cancel" interactive
  **script could not have originated from an inbound flow on this DID** —
  it had to be supplied by the API caller in the outbound
  `Calls.json` request body.
- Destinations: **1,728 unique US numbers across 285 area codes.**
  Most numbers dialed exactly once — the demographic signature of a
  nationwide autodialed sweep, not a customer notification batch.
- Average call duration **17.6 s**, consistent with a short greeting
  → most called parties hang up before pressing any key.
- The Messages Log returns **zero records** for +18665317946; this
  DID has no SMS activity at any point in its lifetime on our
  account.
- Activity ceased on 2026-04-25 16:53:07 UTC, the same calendar day
  the honeypot system detected and reported the campaign.

### Likely bridge / live-agent target

The most-redialed destination across the 1,744 calls is
**+18884461757** (4 redials, also toll-free). In press-1 robocall
flows, the most-redialed number is commonly the live-agent bridge
target reached when a called party presses 1. The 4 "Outgoing Dial"
direction entries in our log are consistent with bridged legs to that
number. We flag +18884461757 for any downstream investigation Twilio
may pursue on its origin.

### "End user" / credential identification

The impacted MDN was not assigned to a customer in our internal
records, was never given a Friendly Name beyond the literal-number
default `(866) 531-7946`, and had no Voice URL, Fallback URL, or
messaging handler configured. The DID was effectively dormant
infrastructure on our account. Because the campaign direction is
100% Outgoing API (1,740 calls) with no inbound handler involved,
the only mechanism that could have produced this traffic is an
authenticated REST POST originated by a party in possession of a
Twilio API credential on our Account SID
(`ACe4c6b5faeb8677fee84ed3ed7148179d`).

The campaign was **not** initiated by our Notification Framework
application code (which sends only SMS via the unrelated +18665475424
DID using templated bodies, with zero outbound voice originations),
by any TwiML handler on the DID, or by any customer's PBX or SIP
trunk. We are treating this as **unauthorized use of a Twilio API
credential against our Account SID**, not as customer-side abuse.
Because the prior account-level Auth Token has already been revoked
and replaced with a Restricted API Key scoped to Messages only (see
Actions Taken), the credential used to originate the campaign is no
longer valid against our Account SID, and remediation is complete
from our side.

### Actions taken

- ✅ **Released the impacted MDN** +18665317946 from our Twilio
  account on **2026-05-27**. The DID is no longer routable through
  our infrastructure and cannot be used to originate further
  outbound traffic on our Account SID.
- ✅ **Rotated our Twilio account credentials.** The previous
  account-level Auth Token has been revoked and replaced with a
  Restricted API Key scoped to **Messages only** (Read, List,
  Create). The new credential is stored in our team password
  manager as the `Password` of an External Credential behind a
  Salesforce Named Credential, with the API Key SID as the
  `Username`. The credential is not embedded in customer
  environments, application code, or CI configuration; exposure is
  bounded to the small set of internal personnel with vault access.
- ✅ Confirmed **zero SMS activity** on the impacted MDN (Messages
  Log returns no records).
- ✅ Confirmed **zero Voice URL / Fallback URL / Status Callback
  configuration** on the impacted MDN, eliminating any
  inbound-handler involvement.
- ✅ Identified **+18884461757** as the likely bridge / live-agent
  target for Twilio's downstream investigation.

### Request

- Confirmation that the release of +18665317946 and the credential
  rotation satisfy the remediation requirements for this case.
- Confirmation of any additional information needed before lifting
  any account-level holds.

### Attachments

- `Twilio_Activity_Investigation_+18665317946.pdf` — full investigation report
- `Twilio_Call_Activity+18665317946.csv` — raw call log (1,744 rows)

Happy to jump on a call if useful.

Thank you,
Alvaro Sanchez
Software Engineer
Ohanafy

---

## Pre-send checklist

- [ ] Twilio T&S contact name filled in for "Hi …"
- [ ] Twilio case / ticket reference added to subject line (if Twilio supplied one)
- [ ] Sender name + title filled in at sign-off
- [ ] +18665317946 confirmed present in **Released Numbers** tab (Console → Phone Numbers → Released numbers)
- [ ] Second pass from manager / director of engineering
- [ ] PDF rendering of the investigation report attached
- [ ] Raw call CSV attached
