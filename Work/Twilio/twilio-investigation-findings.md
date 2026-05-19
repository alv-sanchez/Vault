---
title: Twilio Activity Investigation — +18885461347
created: 2026-05-19
status: draft
related_did: "+18885461347"
sip_endpoint: "sip:+18885461347@non-profit-org.3cx.miami"
youmail_report: "Coinbase impersonation callback"
---


# Activity Investigation — +18885461347 (sip:+18885461347@non-profit-org.3cx.miami)

## 1. Scope and source data

This investigation responds to Twilio Trust & Safety's follow-up report
identifying **+18885461347** (routed on our account as
`sip:+18885461347@non-profit-org.3cx.miami`) as a callback number in
SMS phishing campaigns impersonating Coinbase, reported to Twilio by
YouMail.

The reference phishing SMS body from the YouMail report is:

> *"Coinbase: 940572 is your password change verification code. If
> this wasn't initiated by you call +1(888)546-1347 at once.
> Ref: CB90575"*

The phishing SMS in the screenshot was sent **from `(585) 296-1387`**,
which is **not** a number on our Twilio account. Our account's only role
in the scheme is hosting the toll-free DID that scam victims are
instructed to call back.

Data analyzed:

| Source          | Path                                             | Rows  |
| --------------- | ------------------------------------------------ | ----- |
| Calls export    | `twilio-calls.csv` (Current Date Call Log)       | 2,500 |
| Messages export | `twilio-messages.csv` (Current Date Message Log) | 315   |
| TBM Salesforce production org | Manual audit (see §6a)             | 0 hits |
| Audit events    | not available in console export                  | n/a   |

Note on the audit-events CSV: it was not available in our export window
and is not included below. We will request login / API-key / configuration
events for the incident window directly from Twilio Console → Audit Events
if T&S require them.

## 2. Headline finding

**The Twilio data fully corroborates the Trust & Safety / YouMail
characterization.** On our account `+18885461347` is a **receive-only**
DID (Direct Inward Dialing) — every call observed in the export is inbound PSTN (Public Switched Telephone Network) traffic
terminated to the SIP endpoint at `non-profit-org.3cx.miami`. We have
**zero outbound voice originations** from this DID.

The DID was provisioned for our customer **The Beverage Market (TBM)**
on **2026-04-08** and routed to their hosted 3CX PBX at
`non-profit-org.3cx.miami`. First observed abuse was **2026-04-30** — a
**22-day gap** between TBM's onboarding and the first abuse, which is
more consistent with an external compromise of TBM's PBX than with TBM
themselves running the campaign.

The DID was used by a third party as the call-back destination in an
external Coinbase-impersonation SMS campaign during the **April 30, 2026**
window. Victims who dialed +18885461347 were terminated to the 3CX-hosted
PBX `non-profit-org.3cx.miami` where an attacker (or an agent of one)
answered impersonating Coinbase fraud support.

## 3. Time range of unauthorized activity

| Metric | UTC | US/Pacific (export local) |
|---|---|---|
| First inbound call to +18885461347 | 2026-04-30 17:26:13 | 2026-04-30 10:26:13 PDT |
| Last inbound call to +18885461347 | 2026-05-01 14:50:54 | 2026-05-01 07:50:54 PDT |
| Concentrated burst | 2026-04-30 17:26 – 19:39 UTC | 2026-04-30 10:26 – 12:39 PDT |
| First outbound call from +18885461347 | — | — (none observed) |
| Last outbound call from +18885461347 | — | — (none observed) |

**Active window: ~21.5 hours total**, but 20 of 21 calls (95%) landed in a
**~2.25-hour burst on the afternoon of 2026-04-30 (UTC)**. One straggler
call appeared the next morning (2026-05-01 14:50:54 UTC) and traffic then
stopped completely.

No "unauthorized SMS" window applies — see §4 below; the SMS DID
`+18665475424` shows no phishing content during the export window
(2026-03-22 → 2026-05-18).

## 4. Volume summary

### Voice — only via target DID

| Bucket | Count | Total duration | Spend |
|---|---:|---:|---:|
| Outbound from +18885461347 | **0** | 0 s | $0.00 |
| Inbound to +18885461347 → SIP | **21** | 2,947 s (49 min 7 s) | **$0.7540** |
| of which: completed | 17 | 2,947 s | $0.7540 |
| of which: failed (no answer / unanswered) | 4 | 0 s | $0.00 |

Average completed-call duration: **173 s (~2 min 53 s)** — short
conversational length consistent with a brief social-engineering pitch
before the victim hangs up.

### Voice — entire account (sanity check)

| Metric | Value |
|---|---:|
| Total calls in export | 2,500 |
| Total outbound voice (account-wide) | 21 (all → `sip:+18885461347@non-profit-org.3cx.miami`) |
| Total inbound voice (account-wide) | 13 |
| Total voice spend (export window) | $26.16 |

Every outbound origination Twilio billed us for in this dataset is the
Twilio→SIP leg that terminates inbound calls to the 3CX PBX. There is no
voice traffic on this account that is not part of this inbound→SIP forward.

### SMS

| Bucket | Count | Notes |
|---|---:|---|
| Total SMS (export window 2026-03-22 → 2026-05-18) | 315 | All from `+18665475424` |
| Notification Framework — Order Confirmation / Abandoned Cart | **275** | Legitimate template traffic |
| Twilio default auto-reply (outbound-reply) | 18 | System-generated replies to inbound SMS hitting the DID without a configured webhook — see §6 |
| Internal QA / test traffic | 22 | "Testing", "Ahoy 👋", "asdf", trial-account placeholders, etc. — non-business but **non-malicious** |
| **Phishing / Coinbase / +18885461347 callback** | **0** | No SMS in the export contains "coinbase", "888-546-1347", or any callback-style payload |
| Total SMS spend | $4.8386 | |

**Incident-window spend: $0.7540 (voice) + ~$0 (SMS)** — only the voice
termination fees Twilio billed us for connecting victims to the 3CX PBX.

## 5. Destinations — every call from the inbound-spike window

All 21 calls terminate to the same destination on our side
(`sip:+18885461347@non-profit-org.3cx.miami`). The variation is in
the **calling party** (the scam victim).

| # | Start (UTC) | Caller (From) | Dur (s) | Price | Status |
|---:|---|---|---:|---:|---|
|  1 | 2026-04-30 17:26:13 | +16506698398 |  21 | $0.013 | Completed |
|  2 | 2026-04-30 17:38:27 | +16506698398 |  25 | $0.013 | Completed |
|  3 | 2026-04-30 17:39:00 | +16506698398 |  31 | $0.013 | Completed |
|  4 | 2026-04-30 17:52:46 | +14697805209 |   7 | $0.013 | Completed |
|  5 | 2026-04-30 17:58:04 | +16506698398 |  42 | $0.013 | Completed |
|  6 | 2026-04-30 18:51:22 | +18324926238 | 185 | $0.052 | Completed |
|  7 | 2026-04-30 18:52:03 | +18137782234 | 518 | $0.117 | Completed |
|  8 | 2026-04-30 18:52:18 | +14076305825 | 162 | $0.039 | Completed |
|  9 | 2026-04-30 18:53:35 | +17277354121 |  21 | $0.013 | Completed |
| 10 | 2026-04-30 18:54:50 | +17132990844 | 859 | $0.195 | Completed |
| 11 | 2026-04-30 18:55:15 | +18187380737 |  47 | $0.013 | Completed |
| 12 | 2026-04-30 18:57:27 | +18187380737 |  49 | $0.013 | Completed |
| 13 | 2026-04-30 19:00:52 | +18137782234 |  16 | $0.013 | Completed |
| 14 | 2026-04-30 19:01:11 | +18137782234 |  78 | $0.026 | Completed |
| 15 | 2026-04-30 19:02:39 | +18137782234 |   0 |      — | Failed |
| 16 | 2026-04-30 19:02:39 | +18137782234 |   0 |      — | Failed |
| 17 | 2026-04-30 19:03:32 | +18137782234 |   0 |      — | Failed |
| 18 | 2026-04-30 19:03:32 | +18137782234 |   0 |      — | Failed |
| 19 | 2026-04-30 19:24:11 | +17033467433 | 535 | $0.117 | Completed |
| 20 | 2026-04-30 19:38:51 | +13108946938 | 342 | $0.078 | Completed |
| 21 | 2026-05-01 14:50:54 | +18187320018 |   9 | $0.013 | Completed |

### Unique callers (11) — area-code geography

| Caller | Calls | NPA → location (US) |
|---|---:|---|
| +18137782234 | **7** | 813 — Tampa, FL |
| +16506698398 | **4** | 650 — San Mateo / Peninsula, CA |
| +18187380737 | 2 | 818 — San Fernando Valley, CA |
| +13108946938 | 1 | 310 — West Los Angeles, CA |
| +14076305825 | 1 | 407 — Orlando, FL |
| +14697805209 | 1 | 469 — Dallas, TX |
| +17033467433 | 1 | 703 — Northern Virginia |
| +17132990844 | 1 | 713 — Houston, TX |
| +17277354121 | 1 | 727 — Pinellas / St. Petersburg, FL |
| +18187320018 | 1 | 818 — San Fernando Valley, CA |
| +18324926238 | 1 | 832 — Houston, TX |

**100% US callers (+1 country code).** Distribution across multiple
unrelated US metros, with no pre-existing business relationship to any
of them. This is the demographic signature of an SMS phishing blast that
sprays many unrelated US consumer numbers and harvests whoever calls
back.

### Coinbase / scam pattern indicators

* The destination DID matches the callback number embedded in the
  YouMail-reported phishing SMS verbatim (**888-546-1347**).
* The phishing SMS in the screenshot brands itself "Coinbase" and uses
  a fake reference code (`CB90575`) and verification-code social-
  engineering pretext — a known Coinbase impersonation playbook.
* Caller `+18137782234` made 4 *failed* immediate retries
  (2026-04-30 19:02:39–19:03:32) — consistent with the PBX rejecting
  or de-prioritizing repeat callers after the operator hung up,
  not a victim placing legitimate retries.

## 6. Anomalies

### Volume spike vs. baseline
**Baseline:** zero inbound calls per day to +18885461347 outside the
incident window. The export covers Mar 22 – May 18, 2026; the only
days with any inbound voice traffic to this DID are:

| Date | Inbound calls |
|---|---:|
| 2026-04-30 | 20 |
| 2026-05-01 | 1 |
| Every other day in the window | 0 |

That is a **clean ~∞× spike** above baseline, then back to zero — a
campaign-driven traffic shape, not organic.

### Unusual destination
The single SIP destination — `sip:+18885461347@non-profit-org.3cx.miami`
— is the **only SIP endpoint** anywhere in the call export
(account-wide). The host `non-profit-org.3cx.miami` is a tenant on the
3CX hosted PBX platform's Miami POP, provisioned for our customer
**The Beverage Market (TBM)** on 2026-04-08. See §6a for the
customer-side audit.

### Off-hours
Calls clustered between **10:26 AM – 12:39 PM US/Pacific** (17:00–19:00
UTC) on 2026-04-30, which is normal US business hours across all four
US time zones — consistent with a scam playbook timed to maximise the
chance victims pick up their phones and call back during business hours.
No after-hours / weekend / overnight traffic was observed.

### Repeat callers
| Caller | Calls | Pattern |
|---|---:|---|
| +18137782234 | 7 | 3 completed (16 s, 78 s, 518 s) then 4 immediate failures within ~1 min — looks like a victim that re-engaged then was cut off |
| +16506698398 | 4 | 4 short completed calls (21–42 s) over ~32 min — likely repeated reconnect attempts during the social-engineering script |
| +18187380737 | 2 | Two short completed calls 2 min apart |

Repeat-caller behaviour from the same victim within minutes is consistent
with a scam call that drops mid-conversation (deliberately or
accidentally) and the victim trying to reconnect.

### SMS anomalies
None directly related to this incident. The SMS DID `+18665475424` shows
no Coinbase-branded content, no references to `888-546-1347`, no
unauthorized template variants. The 22 non-template messages are
internal QA/test traffic to a small set of internal phone numbers
(`+19102828662`, `+19802973031`, `+18048740545`, `+18777804236`,
`+16782136463`) and are non-malicious.

The 18 outbound-reply messages are Twilio's stock auto-reply
*"Thanks for the message. Configure your number's SMS URL to change
this message…"* generated automatically when inbound SMS hits the DID
without a configured messaging webhook. They are system-generated,
not application-generated, and are not phishing.

## 6a. Customer-side data audit — TBM Salesforce production org

To assess whether the affected DID had any legitimate internal use at
the customer, we queried TBM's production Salesforce org for any
records referencing `1347` in phone-number fields. The query pattern
`LIKE '%1347%'` matches the number `+18885461347` regardless of
formatting conventions (e.g. `(888) 546-1347`, `888.546.1347`,
`+18885461347`).

### SOQL queries executed

```sql
-- Contact records (Phone + MobilePhone)
SELECT Id, Name, Phone, MobilePhone
FROM Contact
WHERE Phone LIKE '%1347%' OR MobilePhone LIKE '%1347%'

-- Account records
SELECT Id, Name, Phone
FROM Account
WHERE Phone LIKE '%1347%'

-- Contact Notification preferences (Notification Framework)
SELECT Id, ohfy__Contact__r.Name, ohfy__Contact__r.Phone
FROM ohfy__Contact_Notification__c
WHERE ohfy__Contact__r.Phone LIKE '%1347%'
```

### Results

| Object | Hits |
|---|---:|
| Contact | **0** |
| Account | **0** |
| ohfy__Contact_Notification__c | **0** |

**Finding: zero footprint.** The DID `+18885461347` had no recorded
usage in TBM's Salesforce instance — no Contacts assigned to it, no
Accounts referencing it, no Notification Framework registrations.

The DID's only operational purpose on our infrastructure was the
inbound Voice termination to TBM's 3CX-hosted PBX at
`non-profit-org.3cx.miami`. This is consistent with the inbound-only
voice traffic pattern observed in §4 (zero outbound originations from
this DID) and reinforces that the DID's function on our account was
strictly as a Voice routing entry point — not as a notification sender
or part of any documented customer use case at TBM.

## 7. Audit-event findings

The Audit Events CSV was **not available** in the console export we
pulled. We have not yet identified login events or credential changes
from console data. The voice + messaging logs above do not, on their
own, indicate a credential compromise:

* The DID was used for **inbound** call termination — terminating an
  inbound call to a configured SIP endpoint does **not** require an
  authenticated API request, so a leaked API key is not necessary to
  produce the traffic pattern we observed.
* No outbound calls or outbound API-initiated SMS deviate from the
  Notification Framework's known templates.
* No new SIP endpoints or destinations appear in the account beyond
  the single, pre-existing `non-profit-org.3cx.miami` host.

**Implication:** the evidence is most consistent with misuse of the
legitimate DID configuration of +18885461347 by the party assigned to
it (TBM, or a third party operating through TBM's compromised 3CX
tenant) — not with an external compromise of our Twilio account
credentials. We are continuing to investigate Audit Events as a
precaution to rule out external credential compromise.

We will still pull console Audit Events for 2026-04-29 → 2026-05-02 and
attach login IPs / API-key changes to this report as Appendix A as soon
as that export is available.

## 8. Working hypothesis & next steps

**Hypothesis:** the DID `+18885461347` was provisioned for our
customer **The Beverage Market (TBM)** on **2026-04-08** and routed
to their 3CX-hosted PBX (`non-profit-org.3cx.miami`). Either:

1. TBM is themselves operating (or knowingly allowing) the
   Coinbase impersonation callback line; or
2. TBM's 3CX PBX tenant has been compromised and a third party is
   running the scam through it.

The **22-day gap** between TBM's onboarding (2026-04-08) and the first
observed abuse (2026-04-30) is more consistent with **hypothesis (2)** —
post-onboarding compromise of TBM's PBX — than with hypothesis (1).
Scammers typically begin abuse activity immediately upon provisioning
rather than waiting three weeks. The customer-side data audit (§6a)
also shows TBM had no internal usage of this DID, which is consistent
with their not knowing the DID was actively in use for the scam.

### Actions taken

- [x] **Released** `+18885461347` from our Twilio account on
      2026-05-19 [TIME — fill in] (Twilio Console → Phone Numbers →
      Active Numbers → Release). The DID is no longer routable
      through our infrastructure and no further calls can terminate
      to `non-profit-org.3cx.miami` via us.
- [x] **Identified** the customer assigned to the affected DID:
      The Beverage Market (TBM), onboarded 2026-04-08.
- [x] **Audited** TBM's Salesforce production org for any internal
      usage of the DID — zero records found across Contact, Account,
      and Notification Framework objects (see §6a).
- [x] **Rotated** the account-level Twilio Auth Token to a Restricted
      API Key scoped to Messages only (Read, List, Create). Old
      primary Auth Token revoked. Tracked under: *E-Commerce - Rotate
      Twilio API credentials to remediate unauthorized account access*.

### Pending actions 

- [ ] **Customer outreach to TBM** to assess whether their 3CX PBX
      was compromised, and what (if any) intended use they had for
      `+18885461347`.
- [ ] **Pull Twilio Console Audit Events** for 2026-04-25 → 2026-05-05
      and attach login IPs and any API-key/credential changes as
      Appendix A.
- [ ] **Reply to Twilio T&S** with this document, the release
      confirmation for +18885461347, and the customer identification.

### Open questions for TBM

1. Was `+18885461347` knowingly provisioned for the `non-profit-org`
   tenant on `non-profit-org.3cx.miami` for a specific business
   use case? If so, what was it?
2. Who at TBM administers the 3CX PBX tenant?
3. Has that PBX been audited for unauthorized inbound routing rules,
   queue agents, or call-forward targets in the last 90 days?
4. Was any change made to the SIP termination URI or the Voice URL
   of `+18885461347` shortly before 2026-04-30 17:26 UTC?

---

*Prepared 2026-05-19 from Twilio Console exports `twilio-calls.csv`
(2,500 rows) and `twilio-messages.csv` (315 rows). TBM Salesforce
audit executed 2026-05-19 (zero hits across Contact, Account,
ohfy__Contact_Notification__c). DID +18885461347 released
2026-05-19. Audit-events export pending; Appendix A to be added
when available.*