---
title: Twilio Activity Investigation — +18665317946
created: 2026-05-27
status: draft
related_did: "+18665317946"
phone_number_sid: PNc80e6197b7e3115143cb73bf3c028924
twilio_report: "TCPA / honeypot — prerecorded autodialed call"
honeypot_call_sid_flagged: "(call placed 2026-04-25 16:20:31 UTC)"
---


# Activity Investigation — +18665317946 (Toll-Free)

## 1. Scope and source data

This investigation responds to Twilio Trust & Safety's notification that
**+18665317946**, a toll-free DID on our account, originated a
prerecorded / autodialed call on **2026-04-25 16:20:31 UTC** that was
flagged by industry honeypot numbers. Twilio's notification cited the
call transcript:

> *"Urgently press 1 to cancel this request and have an agent contact
> you. If this was not you, please press 1 to deny this request and
> have an agent contact you."*

Data analyzed (5/27/2026):

| Source                      | Path                                          | Rows                                                     |
| --------------------------- | --------------------------------------------- | -------------------------------------------------------- |
| Calls export (this DID)     | `Twilio_Call_Activity+18665317946.csv`        | 1,744                                                    |
| Messages log (this DID)     | Twilio Console → Messages Log tab             | **0 rows — no SMS activity ever recorded from this DID** |
| Twilio Console — Properties | Phone Numbers → Active numbers → +18665317946 | n/a                                                      |
| Twilio Console — Configure  | Voice Configuration screen                    | n/a                                                      |


## 2. Headline finding

**The Twilio data corroborates and substantially expands the scope of
the TCPA / honeypot report.** The single honeypot-flagged call on
2026-04-25 16:20:31 UTC is one of **1,744 outbound calls** originated
from the impacted MDN +18665317946 over a ~45-hour window (2026-04-23
19:09 UTC → 2026-04-25 16:53 UTC). The traffic shape is consistent
with a nationwide autodialed press-1 campaign.

Two console-side facts establish how the campaign was placed:

1. The impacted MDN has **no Voice URL, no Fallback URL, and no
   Status Callback URL** configured (Voice Configuration screen
   inspected 2026-05-27). With no inbound TwiML handler, an inbound
   call to this DID would terminate at Twilio's default error
   message and could not produce a "press 1" interactive script.
2. **1,740 of the 1,744 calls have Direction = "Outgoing API"** — i.e.
   they were placed by authenticated POST requests to
   `/2010-04-01/Accounts/.../Calls.json`, with inline TwiML supplied
   in the request body. The remaining 4 calls have Direction =
   "Outgoing Dial", consistent with bridged legs initiated when a
   called party pressed 1.

The combination — no inbound handler + 100% API-initiated direction —
means the campaign was originated by a party in possession of a
Twilio API credential on this Account SID, not by a webhook, not by
a customer integration, and not by inbound traffic.

The impacted MDN was **not assigned to a customer** in our internal
records and was **never given a Friendly Name** beyond its default
literal-number value (`(866) 531-7946`). It had no documented
business use case and no SMS activity. We are treating this as
**unauthorized use of a dormant unassigned DID via credential
misuse**, not as customer-side abuse.

## 3. Time range of the activity

| Metric | UTC | US/Pacific |
|---|---|---|
| First outbound call from +18665317946 | 2026-04-23 19:09:03 | 2026-04-23 12:09 PDT |
| Last outbound call from +18665317946  | 2026-04-25 16:53:07 | 2026-04-25 09:53 PDT |
| Honeypot-flagged call (per Twilio notice) | 2026-04-25 16:20:31 | 2026-04-25 09:20 PDT |
| Campaign duration | ~45 hours, 44 minutes | |

All activity ceased on **2026-04-25**, the same calendar day Twilio's
honeypot system flagged the campaign. No further outbound calls have
been observed from this DID after 2026-04-25 16:53:07 UTC.

## 4. Volume summary

### Voice — outbound from +18665317946

| Bucket | Count | % | Notes |
|---|---:|---:|---|
| **Total outbound calls** | **1,744** | 100.0% | |
| Direction: Outgoing API | 1,740 | 99.8% | Authenticated REST POST to `/Calls.json` |
| Direction: Outgoing Dial | 4 | 0.2% | Likely bridged legs initiated when a called party pressed 1 |
| Status: Completed (answered) | 1,232 | 70.6% | |
| Status: Busy | 284 | 16.3% | |
| Status: No Answer | 157 | 9.0% | |
| Status: Failed | 71 | 4.1% | |
| Total connected duration | 30,727 s (~8 h 32 min) | | |
| Average call duration | **17.6 s** | | Short, consistent with greeting → most called parties hang up before pressing any key |

### Per-day volume

| Date | Outbound calls |
|---|---:|
| 2026-04-23 | 379 |
| 2026-04-24 | **1,224** |
| 2026-04-25 | 141 |
| All other days in retention window | 0 |

The Apr-24 peak (1,224 calls in a single UTC day) and the sharp
cutoff after 2026-04-25 16:53 UTC are consistent with an automated
campaign that ran until detection.

### SMS

| Metric | Value |
|---|---:|
| Total SMS sent or received from/to +18665317946 (Messages Log) | **0** |

There is no SMS activity associated with this DID at any point in
its lifetime on our account. The impacted MDN was used solely for
the outbound voice campaign described above.

## 5. Destinations

All 1,744 calls were placed to US PSTN numbers (`+1` country code).

| Metric | Value |
|---|---:|
| Unique destination numbers | **1,728** |
| Destination US area codes hit | **285** |
| Calls to a single repeated destination | 16 redials across 8 numbers; remaining 1,728 destinations each dialed exactly once |

### Top destination area codes (US NPA)

| NPA | Calls | Region |
|---|---:|---|
| 917 | 29 | New York, NY (mobile) |
| 954 | 26 | Broward County, FL |
| 512 | 26 | Austin, TX |
| 702 | 23 | Las Vegas, NV |
| 310 | 22 | West Los Angeles, CA |
| 818 | 19 | San Fernando Valley, CA |
| 919 | 19 | Raleigh / Durham, NC |
| 347 | 19 | New York City overlay (mobile) |
| 404 | 18 | Atlanta, GA |
| 801 | 18 | Salt Lake City, UT |

The distribution across **285 distinct US area codes**, with most
destinations dialed exactly once, is the demographic signature of a
nationwide autodialed sweep — not a contact list, not a customer
notification batch.

### Likely bridge / live-agent target

The most-redialed destination is **+18884461757** (4 calls, also
toll-free). In press-1 robocall flows, the most-redialed number is
commonly the "live agent" bridge target that a called party reaches
after pressing 1. The 4 "Outgoing Dial" direction entries in the
log are consistent with bridged legs to that number. We flag
**+18884461757** as a likely co-conspirator target for further
investigation on Twilio's side.

## 6. Anomalies

### Volume spike vs. baseline
**Baseline:** zero outbound calls per day from +18665317946 outside the
incident window. The DID had no recorded outbound voice activity prior
to 2026-04-23 19:09 UTC and no activity after 2026-04-25 16:53 UTC.

| Date | Outbound calls |
|---|---:|
| 2026-04-23 | 379 |
| 2026-04-24 | 1,224 |
| 2026-04-25 | 141 |
| Every other day in retention | 0 |

A clean spike from baseline-zero to >1,200 calls/day, then back to
zero on detection — campaign-driven traffic shape, not organic.

### Hour-of-day distribution (UTC)

| Hour (UTC) | Calls | Approx US ET / PT |
|---|---:|---|
| 15:00 |  71 | 11am ET / 8am PT |
| 16:00 | **583** | 12pm ET / 9am PT |
| 17:00 |  18 | 1pm ET / 10am PT |
| 19:00 | 321 | 3pm ET / 12pm PT |
| 20:00 | 356 | 4pm ET / 1pm PT |
| 21:00 | 190 | 5pm ET / 2pm PT |
| 22:00 | 154 | 6pm ET / 3pm PT |
| 23:00 |  51 | 7pm ET / 4pm PT |

All activity is during US business hours across the four contiguous
US time zones — consistent with maximising answer rates on a
consumer-targeted campaign.

### Call-duration distribution
Average duration **17.6 s** across 1,744 attempts. This short
average is consistent with a greeting-then-IVR script: most called
parties hear the opening line and hang up, while a smaller fraction
listen long enough to press 1 and be bridged (the 4 Outgoing Dial
records).

### Account-side configuration of the impacted MDN
The impacted MDN's Twilio Console state, inspected on 2026-05-27,
is inconsistent with any legitimate inbound or outbound business use:

| Property | Observed value |
|---|---|
| Friendly Name | `(866) 531-7946` (default — never customized) |
| Customer assigned (our internal records) | **None** |
| Voice URL (`A call comes in`) | **Blank** |
| Voice Fallback URL | **Blank** |
| Status Callback URL | **Blank** |
| Caller Name Lookup | Disabled |
| Emergency Calling — Address | **Not registered** |
| Messaging configuration | Not configured for inbound webhook |
| SMS / MMS traffic ever recorded | **0** |
| Routing | US1 (active) |
| Phone number type | Toll-Free |
| Capabilities | Voice, SMS, MMS, SIP |

The DID was effectively dormant infrastructure: no customer, no
Friendly Name, no handlers, no SMS history. That dormancy is what
made it a useful target for the unauthorized campaign — outbound API
calls originated from it would not show up on any customer-side
monitoring or our internal Notification Framework dashboards.

## 7. "End user" identification and credential analysis

The TCPA-flagged campaign was originated via authenticated REST
requests to Twilio's REST API on our Account SID
(`ACe4c6b5faeb8677fee84ed3ed7148179d`). Because the impacted MDN
was not assigned to a customer and was never configured with a
Voice URL, there is no customer-facing system or webhook on our
account that could have produced this traffic. The only way the
1,740 Outgoing API calls could have been placed is by a party in
possession of one of the following credentials at the time of the
campaign:

* the account-level Auth Token, or
* an API Key (SID + Secret) authorized for Voice resource creation
  on this Account SID.

Specific credential identification at the per-call level (originating
API Key SID, source IP, and User-Agent for individual Call SIDs in
the campaign) is available on Twilio's side via per-request logging.
Because the prior account-level Auth Token has already been revoked
and replaced with a Restricted API Key scoped to Messages only (see
§8), the credential used to originate the campaign is no longer
valid against our Account SID, and per-call credential identification
is a forensic question rather than a remediation requirement. We are
happy to consume per-call Request data if Twilio is able to share it
as part of this case.

The campaign was **not** initiated by:

* our Notification Framework application code (which sends only SMS
  via the `+18665475424` DID using templated bodies, with zero
  outbound voice originations),
* any TwiML handler on the DID (the Voice URL is blank),
* any customer's PBX or SIP trunk (the DID is not provisioned to a
  customer, has no SIP termination URI, and the direction is
  "Outgoing API" rather than SIP-originated).

This is the basis for our conclusion that the campaign represents
unauthorized API use against our Account SID — not customer abuse
and not abuse of a legitimately configured application.

## 8. Working hypothesis & actions taken

**Hypothesis:** an unauthorized party in possession of a Twilio API
credential associated with our Account SID identified the dormant
unassigned toll-free DID +18665317946 and originated a nationwide
prerecorded "press 1" campaign through it between 2026-04-23 and
2026-04-25, terminating activity on the same day Twilio's honeypot
detected and reported the campaign. The selection of an unassigned,
unmonitored, unnamed DID is consistent with an attacker attempting
to keep abuse traffic off our customer-facing dashboards and
notification pipelines.

### Actions taken

- [x] **Released the impacted MDN** +18665317946 from our Twilio
      account on **2026-05-27** (Twilio Console → Phone Numbers →
      Active Numbers → Release). The DID is no longer routable
      through our infrastructure.
- [x] **Rotated the account-level Twilio credentials** to a
      Restricted API Key scoped to Messages only (Read, List,
      Create). Old primary Auth Token revoked. The post-rotation
      credential is stored in our team password manager as the
      `Password` of an External Credential behind a Salesforce
      Named Credential (Account SID as `Username`, previously the
      Auth Token; now the API Key SID + Secret). The credential is
      not embedded in customer environments, application code, or
      CI configuration.
- [x] **Confirmed zero SMS activity** associated with the impacted
      MDN (Messages Log tab returns no records for +18665317946).
- [x] **Confirmed zero Voice URL / Fallback URL / Status Callback
      URL configuration** on the impacted MDN, eliminating
      inbound-handler involvement.
- [x] **Identified a likely bridge / live-agent target**
      (+18884461757, the most-redialed destination at 4 calls) for
      Twilio's downstream investigation.
