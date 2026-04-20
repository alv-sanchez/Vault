


**Lovable Projects:**
- [Registration Flow](https://lovable.dev/projects/086d8434-3558-4da4-a6bb-3457bfcf314d)
- [Approval Queue](https://lovable.dev/projects/c7d19832-28ad-4809-a3fa-273b41bddd70)

---

# BMS-3926 — Open Questions for Alignment

> **From**: Alvaro Sanchez
> **Re**: Retailer Registration & Onboarding Flow (BMS-3926)
> **Date**: 2026-04-20

I'm working through the Gulf registration flow and need clarity on two things before I build something we'd have to rip out later.

---
Terminology
Account-Internal - Internal Account
Account-Contact - Account user created upon registration


## 1. Payment Method - Is it part of registration?

The ticket includes a payment method capture step during registration (ACH, Credit Card, Check). But looking at the actual flow and our execution order:

- The retailer finds their business (Account-Internal) and registers themselves as a contact (Account-Contact)
- A territory sales rep reviews and approves
- Credit terms and payment infrastructure are BMS-3930 scope (Phase 3, Sprint S5+)

**The question**: Should the retailer provide payment method info during registration — before they're even approved — or does that get handled after approval?

**Three possible answers:**

| Option | What it means | Impact on registration |
|---|---|---|
| **Not at registration** | Payment method is set up post-approval, either by the sales rep or by the retailer once active | Drop the payment step entirely from the registration flow. Simplest path, ship faster. |
| **Preference only** | Ask "how do you prefer to pay?" as a picklist (ACH/CC/Check) — no actual payment details collected | One extra field, no integration work. Informational for the sales rep during approval. |
| **Full capture** | Collect actual payment details and tokenize during registration | Blocked on BMS-3930 + payment provider decision. Cannot ship until that's resolved. |

**My recommendation**: Drop it or make it preference-only (new `ECOM_Payment_Required` Field on Account). Full capture during registration is blocked on decisions we haven't made yet (which integration provider). We can always add it later without breaking the flow for now.

---

## 2. Account-Contact Approval - Is manual approval required?

The ticket says a sales rep must approve each registration before the retailer gets portal access. I've been designing for this, but I want to flag the tradeoff.

**What approval gives us:**
- Quality gate — someone verifies the retailer is real, in-territory, gets the right pricing/route
- Prevents unauthorized access to the ordering portal
- Sales rep can catch duplicates or bad data before it becomes a problem

**What approval costs us:**
- **Bottleneck** — sales reps are in the field, not watching Salesforce. A registration could sit pending for days.
- **No SLA enforcement** — nothing auto-escalates if the rep doesn't act
- **Single point of failure** — if the territory rep is on PTO, registrations queue up
- **First impression** — retailer signs up excited to order, then waits. Every hour of wait is a chance they lose interest or just call AR directly (the thing the portal is supposed to eliminate)

**The question**: Is manual approval a hard requirement, or can we explore alternatives?

**Three possible approaches:**

| Approach | How it works | Risk |
|---|---|---|
| **A. Always approve manually** | Every registration waits for sales rep action. 2-day SLA target. | Bottleneck risk. Needs escalation path for unresponsive reps. |
| **B. Auto-approve, gate checkout** | Retailer gets portal access immediately (browse catalog, see prices). Ordering is blocked until sales rep approves. | Retailer can see data but can't transact. Lower friction but still needs approval for revenue. |
| **C. Auto-approve low-risk, flag edge cases** | If Account-Internal exists, is active, and territory is valid — auto-approve. Only flag new accounts, out-of-territory, or license issues for manual review. | Most registrations flow through instantly. Small risk of bad data, but same data the sales rep created in the first place. |

**My recommendation**: Option B or C. Both unblock the retailer experience while keeping the quality gate where it matters (before money changes hands). Option A works but will feel slow to retailers and creates operational overhead for the sales team.

---

## 3. Account-Internal Lookup — How does the retailer find their business?

The first step of registration is the retailer matching themselves to their existing Account-Internal. The current TBM registration (`ecomRegister`) uses:

- **Business Name** (required, min 3 chars)
- **ZIP Code** (required)
- **State License Number** (optional — required if the business sells alcohol)

This searches Account records by name + ShippingPostalCode via dynamic SOQL with word-split matching (e.g., "Dixie Bar" matches "Dixie's Bar & Grill").

**The question**: Does this search model work for Gulf, or does the retailer need different criteria to find their Account-Internal?

**Things to consider:**

| Criteria | Pros | Cons |
|---|---|---|
| **Business Name + ZIP** (current) | Simple, intuitive, works today | Name typos cause missed matches. Retailers may not know their exact registered name. |
| **Account Number / Customer ID** | Exact match, no ambiguity. Sales rep could hand this to the retailer ("use this code to register"). | Retailer needs to know it. Requires the sales rep to communicate it ahead of time. |
| **Invite Code / Registration Link** | Sales rep sends a unique link or code per Account-Internal. Retailer clicks it, Account-Internal is pre-selected. No search needed. | Requires building invite generation + distribution. More upfront work but cleanest UX. |
| **Email domain matching** | Auto-suggest Accounts where existing Contacts share the same email domain | Only works if the business uses a company email, not gmail/yahoo. |
| **Hybrid** | Keep name + ZIP search as fallback, but also accept an Account Number or invite code as a shortcut | More flexible but more UI to build. |

**My recommendation**: Depends on Gulf's onboarding motion. If sales reps are actively bringing retailers onto the portal, an **invite code or account number** is the cleanest path — zero ambiguity, no search mismatches. If retailers are self-discovering the portal, **name + ZIP** (current approach) is the safe bet. We can support both.

**What I need to know**: How does the retailer learn about the portal? Does a sales rep tell them "go register"? If so, what info does the rep give them to identify their account?

---

---

## 4. License / Resale-Certificate Upload — Is it needed?

The ticket mentions license and resale-certificate upload as a follow-up item. But given the flow we're building, the Account-Internal already exists in Salesforce — meaning the sales rep (or data migration) already set up the account with its license info (`State_License_Number__c`, `License_Expiration_Date__c`, `Alcohol_License_Required__c`).

**What the current flow already does:**
- If the Account-Internal requires an alcohol license, the retailer must enter their license number to find their business (Step 1)
- The system validates the license digits match what's on record
- Expired licenses block registration entirely

**The question**: If the license data already lives on the Account-Internal and is validated during lookup, what's the value of also asking the retailer to upload a photo/PDF of the certificate?

**Possible reasons it might still be needed:**
- **Compliance audit trail** — Gulf needs a copy of the physical document on file, not just the number
- **New accounts** — if we ever support Account creation (not just lookup), we'd need proof of license
- **License renewal** — retailer's license expired, they need to upload a renewed one to unblock registration

**Possible reasons to skip it:**
- The Account-Internal already has the license data — the sales rep verified it when they set up the account
- Uploading documents during registration adds friction and increases drop-off
- File uploads in Experience Cloud have limitations (storage, virus scanning, mobile UX)
- Can always be added post-registration via the profile/account management page (BMS-3932)

**My recommendation**: Skip it for registration. The license number is already validated against what's on the Account-Internal. If Gulf needs physical documents on file for compliance, that's better handled as a post-approval task or through BMS-3932 (account management) where the retailer or sales rep can upload documents at their own pace — not as a gate to registration.

---

## What I need to move forward

1. **Payment**: Drop it, preference-only, or full capture?
2. **Approval**: Always manual (A), auto-access + gate checkout (B), or auto-approve low-risk (C)?
3. **Lookup**: Name + ZIP (current), Account Number, invite code, or hybrid?
4. **License upload**: Needed at registration, post-approval, or not at all?

Once these four are answered I can finalize the registration flow and start building.
