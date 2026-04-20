---
ticket: BMS-3930
title: Retailer credit terms display & payment status
type: Audit
status: Backlog
file_audited: (no implementation file exists — codebase grep confirmed)
jira: https://ohanafy.atlassian.net/browse/BMS-3930
audited_on: 2026-04-14
tags:
  - audit
  - ecom
  - manager
  - blocker
---
%%  %%
# BMS-3930 — Retailer credit terms display & payment status

> [!warning] Verdict
> **Zero implementation. Five ACs, none addressed.** But the bigger finding isn't the gap — it's that **this ticket blocks 13 other ECOM stories** including theme setup, product cards, search, registration, and order history. None of those have anything to do with credit terms display. **BMS-3930 is being used as a generic "foundation" placeholder, and the dependency graph is wrong.** This is the most consequential ticket-shape problem in the audit set so far because it cascades into every other story we've looked at.

---

## ✅ What IS there

**Nothing.** Codebase grep for `credit`, `Payment_Status`, `Credit_Limit`, `Outstanding_Balance` in `force-app/` returned only:

- `ecomReviewSummary.js:180` — `get paymentMethodCreditCard()` — checkout payment-method radio button (credit card vs. other), totally unrelated to retailer credit terms / AR
- `draftInvoiceService.js` — credit invoice handling for the cart (credit memo concept, not credit limits)

> [!This needs to added to the comment]
> **No payment status page LWC exists. No `Outstanding_Balance` calculation. No credit terms display. No invoice list with past-due badging. No multi-entity credit handling. No pending-credit state.**


---

## ❌ What is NOT there (all 5 ACs)

### AC 1 — Retailer views active credit terms and available balance
- ❌ No payment status page / route
- ❌ No `Credit_Terms` / `Credit_Limit` / `Outstanding_Balance` / `Available_Credit` display
- ❌ No real-time calculation of Available Credit from open `Invoice__c` records
- ❌ No "Last Payment" line

### AC 2 — Retailer views individual invoice payment statuses
- ❌ No outstanding invoices section / list
- ❌ No `Invoice_Number__c` / `Due_Date__c` / `Total Amount` / `Payment_Status__c` / Warehouse columns
- ❌ No "Past Due" badge with sort-to-top behavior
- ❌ No partial-payment display (original amount + remaining balance)

### AC 3 — Pending credit approval state
- ❌ No "Credit Status: Pending Approval" handling
- ❌ No copy: "Your credit application is under review. Contact your Gulf sales representative for status updates."
- ❌ No graceful empty / COD-only state

### AC 4 — Recent payment reflection within sync cycle
- ❌ No refresh / sync hook to reflect newly-posted payments
- ❌ No `Receipt__c` integration referenced anywhere
- ❌ No optimistic-vs-server-state reconciliation logic

### AC 5 — Multi-entity retailer (FL + AL warehouses with separate credit lines)
- ❌ No per-warehouse credit term display
- ❌ No grouping of outstanding invoices under their entity sections
- ❌ No multi-entity schema work

---

## 🚨 Ticket bloat / scope concerns

### 🔥 The big one: this ticket blocks 13 unrelated tickets

`issuelinks` on BMS-3930 shows the following outward "blocks" relationships:

| Blocked ticket                                  | Relationship to credit terms display?                          |
| ----------------------------------------------- | -------------------------------------------------------------- |
| BMS-3920 — Retailer Online Ordering Experience  | Maybe (credit checks at checkout)                              |
| BMS-3921 — Retailer Engagement Notifications    | **None** — notifications don't need credit data                |
| BMS-3922 — Call Center Order Visibility         | **None** — CSR view, separate concern                          |
| BMS-3923 — Experience Cloud theme & brand setup | **None** — theme setup has zero relationship to credit display |
| BMS-3924 — Retailer portal product card & grid  | **None** — product display, no credit data needed              |
| BMS-3925 — Product Catalog & Availability       | **None** — catalog has nothing to do with AR                   |
| BMS-3926 — Retailer account registration        | **None** — registration is a separate workflow                 |
| BMS-3927 — Product search & filtering           | **None** — search has nothing to do with credit                |
| BMS-3928 — Cart & checkout with Gulf pricing    | Possibly (credit limit guardrails on checkout)                 |
| BMS-3929 — Order history & one-click reorder    | **None** — order history is read-only                          |
| BMS-3931 — Order status tracking                | **None** — status display, no credit data                      |
| BMS-3932 — Self-service account management      | **None** — address/contacts editing                            |
| BMS-3980 — E-Commerce: Remaining Pieces         | Catch-all — relationship undefined                             |

**At most 2 of these (BMS-3920 and BMS-3928) have a defensible reason to depend on credit display. The other 11 are wrongly linked.**

### What's actually happening here
Three possibilities:
1. **BMS-3930 was renamed.** It started life as "foundational data model + site provisioning" and got rescoped to "credit terms display" later, but the dependency links from when it was the foundation ticket were never cleaned up. **Likely.** This would explain why it blocks theme setup, product cards, registration, and search — none of which have any reason to depend on AR data.
2. **BMS-3930 is being used as a generic placeholder.** Whoever was triaging the epic added "blocks BMS-3930" to every downstream story as a way of saying "this depends on Phase 2 foundation work being done first," without realizing BMS-3930 is a specific feature ticket.
3. **The author genuinely thinks credit display blocks all 13.** Possible but implausible — there's no schema dependency between "show $25,000 credit limit" and "render a product card."

Whatever the cause, **the dependency graph is misleading every team that reads it**. Anyone planning sprints based on these links would think credit terms display has to ship before they can start theme work or product cards, which is false. That's a serious planning hazard.

### The ACs themselves bundle 4+ distinct features

Even ignoring the dependency issue, the ACs span at least four different work surfaces:

> [!This needs to added to the comment]
> 

| Sub-feature                                            | Suggested split                                                       |
| ------------------------------------------------------ | --------------------------------------------------------------------- |
| Credit terms + available balance display (AC 1)        | **Split #1** — single LWC + Apex                                      |
| Outstanding invoices list with past-due badging (AC 2) | **Split #2** — separate LWC, depends on #1                            |
| Pending credit application state handling (AC 3)       | **Split #3** — UX state machine work, depends on #1                   |
| Multi-entity per-warehouse credit display (AC 5)       | **Split #4** — schema/data model concern, possibly the actual blocker |
| Sync cycle / payment reflection (AC 4)                 | **Split #5** — integration concern, may be out of scope               |

**AC 5 (multi-entity) is the one that actually justifies the "blocking" status** — if Gulf retailers have separate accounts per warehouse with separate credit lines, every downstream feature that touches an Account record needs to handle the multi-account case. **That's a data model concern, not a display concern.** It probably should have been its own ticket about "Account schema for multi-entity Gulf retailers" — and *that* ticket would legitimately block downstream work.

### AC 4 is an integration concern in disguise
"Credit data reflects recent payment within sync cycle" implies:
- An external AR system (probably QuickBooks or similar)
- A sync mechanism that posts `Receipt__c` records to Salesforce
- A polling or push refresh on the portal page
- Some staleness tolerance

**None of that is "display work."** This is integration architecture wearing a UI ticket's clothes. Should be a separate story owned by whoever does integration work, not bundled with a portal LWC.

### Open scope concerns hiding in the language
- **"Real-time calculation of Available Credit"** — does this mean recalculate on page load, or live-refresh while the page is open? Big difference in implementation cost.
- **"Sync cycle"** — undefined cadence. Hourly? Nightly? Real-time webhook?
- **"Pending Approval"** — implies a credit application workflow exists somewhere. Where? Not addressed in this ticket.
- **"Past Due"** — defined as `Due_Date__c < TODAY()`? Or is there a grace period? Or a custom field? Not specified.

### Status mismatch with downstream assumptions
This ticket is in **Backlog**. **It has not started.** Yet two of the tickets I just audited (BMS-3923 and BMS-3929) have either work in progress (3929) or a "Completed" comment (3923) — both of which claim BMS-3930 as a blocker. **Either the blocker links are wrong, or those two tickets shouldn't be in flight yet.** Someone is operating on stale assumptions.

---

## Recommendation

1. **Fix the dependency graph first, before doing any technical work on this ticket.** Audit each of the 13 "blocks" relationships. Keep the ones that genuinely depend on credit data (probably BMS-3920 and BMS-3928 — checkout guardrails). Delete the rest (theme setup, product cards, search, registration, order history, etc.).

2. **Surface this finding at refinement.** The fact that two in-flight tickets (BMS-3923 and BMS-3929) cite BMS-3930 as a blocker that hasn't started is a planning red flag. Either:
   - The blocker is correct and those tickets should not be in flight, OR
   - The blocker is wrong (more likely) and the link should be removed

3. **Split BMS-3930 by work surface**:
   - Account schema + multi-entity data model (the *actual* foundational blocker — probably should be a new ticket entirely)
   - Credit terms + available balance display LWC
   - Outstanding invoices list LWC
   - Pending credit state UX
   - AR sync integration (separate epic candidate)

4. **Get the open scope questions answered**: real-time vs page-load refresh, sync cadence, pending-credit workflow, past-due definition. Without these the implementation is guess-driven.

5. **Don't pull this ticket into a sprint as-is.** It's labeled `fast-trackable` but it isn't — it's a multi-feature bundle with an open integration concern and a broken dependency graph.

---

## 🧭 Refinement questions (for manager conversation)

### Critical context to lead with
> "Before we refine BMS-3930, I want to flag where I think the ticket is currently stuck and ask a few things that'll help me commit to scope. We tried Rainforest and scrapped it because the integration effort was too big for the time we had. That means the original technical path for getting credit and payment data into the portal is gone. Until we decide what replaces it, I can't credibly size any of the 5 ACs on the ticket — they all assume that data exists somewhere accessible. Can we walk through a few decisions?"

The Rainforest scrap isn't currently in the Jira ticket history. Worth adding a comment to BMS-3930 saying: *"Rainforest integration was attempted and dropped due to scope. New technical path TBD before this can move."* That preserves institutional memory for whoever picks this up later.

---

### 🤝 Palatable version — conversation-ready script

> Use this version when actually talking to your manager. Same information as the tiered questions below, but framed as *"help me understand what you're expecting"* rather than *"these are the problems with the ticket."* The goal is alignment on expectations, not a scope debate.

#### Opening (sets the frame)

> *"Hey — before I start sizing BMS-3930 I want to make sure I'm aligned with what you're actually expecting, so the estimate I come back with is useful. A few things from the ticket feel like they'd benefit from a quick conversation before I commit. Got 15 minutes this week?"*

**What this does**: positions you as someone trying to deliver cleanly, not someone trying to avoid work. "Aligned with what you're actually expecting" = gives the manager control of the framing. "So the estimate I come back with is useful" = shows you're heading toward commitment, not away from it.

---

#### Question 1 — Data source expectations

> *"On the data side — I know we looked at Rainforest and pulled back from that path. Do you have a sense of where you want the credit and payment data to come from now? I'm trying to figure out if we're looking at a different integration, a manual AR-team process, or building the V1 against what's already in Salesforce today. Each path has pretty different scoping implications, so I want to get that locked in before I size the rest."*

**Tone moves**:
- "We looked at Rainforest and pulled back" — neutral, no blame, no "scrapped"
- "Do you have a sense of where you want…" — gives the manager authorship of the answer
- Three concrete options — makes it easy to answer with a single word ("the second one") instead of having to invent the solution
- "I want to get that locked in" — shows engineering intent, not scope-dodging

---

#### Question 2 — V1 success definition

> *"On scope — I want to ship something useful early rather than wait until the whole thing is perfect. Would a V1 that just shows retailers their credit terms from the Account record be a meaningful win for you? Or is the live-balance + multi-entity experience table stakes for day one? I can go either way, but I want to aim at the right target."*

**Tone moves**:
- "Ship something useful early" — frames you as delivery-focused, not lazy
- "Meaningful win for you" — lets the manager define success in their own terms
- "Table stakes for day one" — gives them a way to say "no, we need the whole thing" without feeling challenged
- "I can go either way" — you're not pushing an agenda, you're asking for direction
- "Aim at the right target" — outcome-focused language

---

#### Question 3 — Downstream dependencies

> *"One thing I noticed while looking at the downstream tickets — BMS-3930 is listed as a blocker on a bunch of things that don't obviously connect to credit data (theme setup, product cards, order history, a few others). I might be missing some context, but I wanted to flag it because if some of those links are stale, cleaning them up could unblock work the team could pick up sooner. Want me to pull the list and you can tell me which are real?"*

**Tone moves**:
- "I noticed while looking at" — proactive curiosity, not auditing
- "I might be missing some context" — admits your own knowledge gap first
- "Some of those links are stale" — soft, conditional, doesn't say "they're wrong"
- "Unblock work the team could pick up sooner" — frames it as helping the team, not just you
- "Want me to pull the list" — offers to do the work, not dump it on them

---

#### Optional follow-ups (only if there's room)

Keep these in your back pocket. If the conversation has time after the three core questions, raise them one at a time. If not, they can go in a follow-up Slack or the next 1:1.

- **Multi-entity schema**: *"AC 5 talks about showing credit per warehouse entity for multi-entity retailers. Before I start the display work, can we confirm whether the Account schema already handles the FL / AL split, or is that data-model work that'd need to land first?"*
- **Pending credit state**: *"AC 3 mentions a 'Pending Approval' state — is there an existing credit application workflow I'd be reading from, or is that something we're designing fresh?"*
- **Sync cycle (AC 4)**: *"If we go with a simpler data source for V1, can I treat the 'reflects recent payment within sync cycle' AC as out-of-scope, or is it load-bearing for what you're picturing?"*
- **Sandbox + test data**: *"Which sandbox should I build this in, and is there test-account data with realistic credit fields already set up, or do I need to seed it?"*
- **Stakeholder access**: *"Once I have something working, who from the AR team could I show it to for a 15-minute walkthrough? Not for sign-off — just a sanity check before I sink more time in."*

---

#### Closing

> *"Once I have a read on those, I can come back with an estimate and a proposed V1 scope. Appreciate the time."*

**Why this closes well**: commits to a follow-up ("I can come back with an estimate"), signals engineering intent, and thanks the manager without being sycophantic. You're leaving the conversation with a deliverable on your side of the table, not theirs.

---

#### Async / Slack version (when a meeting isn't in the cards)

> *"Hey — before I size BMS-3930 I want to make sure I'm aligned with what you're expecting. Three quick things:*
>
> *1. Where are we thinking the credit/payment data should come from now that Rainforest isn't happening? (Different integration, manual AR process, or V1 = display what's already in Salesforce?)*
>
> *2. What does a useful V1 look like to you? Would showing credit terms from the Account record be a meaningful start, or is the full live-balance experience table stakes?*
>
> *3. BMS-3930 is currently blocking a bunch of downstream tickets that don't obviously depend on credit data (theme setup, product cards, order history). Want me to pull the list and flag which ones might be stale?*
>
> *No rush — but these three will shape the estimate I come back with."*

**Why this version works in Slack**: it's short enough to not feel like a wall of text, ends with "no rush" so it doesn't feel like a demand, and signals that you're blocked on answers (not complaining about it). "Will shape the estimate" makes it clear the manager's input is useful, not optional.

---

### How to use the two versions

- **Palatable version (above)**: what you actually say in a 1:1, standup, or Slack thread. This is the version for the conversation.
- **Tiered version (below)**: your own cheat sheet. More direct, covers every angle, includes the technical specificity that'd be awkward to say out loud. Use it to prepare for the conversation and to make sure you haven't missed anything when answers start coming in.

Both versions cover the same ground. The palatable one is what leaves your mouth; the tiered one is what you have in your notebook.

---

### 🔴 Tier 1 — Must answer before any work can start

#### Q1. Where does credit / payment data come from now that Rainforest is out?
- A different payment / AR processor (Stripe, Plaid, Forte, etc.)?
- **Manual AR-team entry** of credit limits and balances on the Account record?
- A **scheduled batch sync** from another AR system (QuickBooks, NetSuite, internal ERP)?
- Or V1 = **"display only what's already in Salesforce today"** — no integration, just a UI over existing Account fields?

> *Why it matters*: each option has a wildly different effort estimate. Manual entry is days. Real-time sync is months. I need to know which world we're in before I can size anything.

#### Q2. What does V1 actually need to look like?
- Just **"show retailers what their credit terms are"** (a static display from Account fields)?
- Or **"show retailers their live outstanding balance and available credit"** (which requires fresh data from somewhere)?
- Or **the full ticket as written**, with multi-entity, sync-cycle reflection, and pending-credit handling?

> *Why it matters*: the ticket as written is at least 4 features bundled together. If V1 is just "display credit terms from Account," that's a few days of LWC + Apex work and it ships. If V1 is the full ticket, we're talking weeks plus an integration story we don't have a path for yet.

#### Q3. Is BMS-3930 actually a blocker for the 13 tickets currently linked to it?
The Jira graph shows BMS-3930 blocks 13 downstream tickets, including theme setup (BMS-3923), product cards (BMS-3924), search (BMS-3927), order history (BMS-3929), and others. Most have **no real dependency on credit data** — they need things like Account schema, Site provisioning, and pricelists, which are different concerns.
- Are those links accurate, or were they added when this ticket was scoped differently?
- **Can we clean them up before sprint planning** so the team isn't blocked on something that doesn't actually gate them?

> *Why it matters*: if those links are wrong, work that's currently considered blocked might already be ready to pull. That's free progress for the team.

---

### 🟡 Tier 2 — Helps shape scope once Tier 1 is answered

#### Q4. Multi-entity (FL + AL split) — display layer or schema problem?
AC 5 says "credit terms, limits, and balances are displayed separately per warehouse entity." That implies retailers have **separate Account records per warehouse entity** and the portal needs to show both.
- **Does the current Account schema already model multi-entity retailers?** (Is "7-Eleven Milton FL" a separate Account from "7-Eleven Mobile AL"?)
- **If not, is the data-model work in this ticket — or is it actually a separate prerequisite that's hiding inside this story?**

> *Why it matters*: if the schema doesn't support multi-entity yet, **that's the actual blocker, not credit display**. We'd need a schema-shaping ticket before this one. (This may be the real reason BMS-3930 is linked as a blocker on so many tickets — someone may have meant "the multi-entity schema work" and used this ticket as a proxy.)

#### Q5. The "Pending Credit Approval" state — who owns the workflow?
AC 3 says retailers without established credit see a "Pending Approval" state with a message to contact their sales rep. That implies:
- A credit application workflow exists somewhere
- An admin or AR team flips an account to "Approved" at some point
- The portal reads that state somewhere
- **Is any of that workflow built? If not, V1 just hides the section for unapproved accounts and we file the workflow as a separate story, right?**

#### Q6. AC 4's "sync cycle" reflection — is this in scope or not?
AC 4 says "credit data reflects recent payment within sync cycle" — which only matters if there's a sync cycle to reflect. If we're going with manual AR entry or a static Account-field display, **this AC disappears entirely**. If we're going with a scheduled batch import, the sync cadence becomes a hard requirement (hourly? nightly? real-time?).
- **Can we explicitly drop this AC for V1 if there's no integration?**

#### Q7. Definition of "Past Due"
- Is past due simply `Due_Date__c < TODAY()`, or is there a grace period?
- Is there a custom `Payment_Status__c` value the team already uses for this, or do I derive it?

#### Q8. "Real-time" available credit calculation
- Does AC 1's "Available Credit calculated in real time from Invoice__c records" mean:
  - **Recalculate on page load**, OR
  - **Live-refresh while the page is open** (websocket / polling)?
- The two options are an order of magnitude different in effort.

---

### 🟢 Tier 3 — What I need to commit cleanly

#### Q9. What does "Done" look like for V1?
- A clickable demo to a stakeholder?
- Apex test coverage at 75%?
- An admin can configure the credit limit field on Account and it shows in the portal?
- All 5 ACs from the ticket green?

> Concrete acceptance helps me know when to stop building and when to escalate.

#### Q10. Sandbox + test data
- **Which sandbox should I build this in?**
- **Is there test-account data with realistic credit fields populated**, or do I need to seed it myself?
- **Are there 1–2 real Gulf accounts with the multi-entity shape** I should use as my reference cases?

#### Q11. Stakeholder access
- **Who from Gulf's AR team can I show this to** for a 15-minute walkthrough once V1 is up? Not for sign-off — for "does this look right to you" feedback before I sink more time in.

---

### 🚨 Bonus surfacings (raise if time permits)

These are observations from the audit that are worth saying out loud at refinement, not as criticism but as planning hygiene:

1. **The ticket bundles at least 4 distinct features** (credit display, invoice list, multi-entity, pending state, sync-cycle integration). If we tried to ship all of them together, we'd have one mega-PR that touches schema + Apex + LWC + integration. Worth splitting at refinement before any of it gets pulled.
2. **The ticket has been in Backlog since 2026-03-25** with `fast-trackable` and `roadmap-v2-baseline` labels — but the open questions block its own scope. "Fast-trackable" doesn't match "5 unanswered open questions."
3. **The Rainforest scrap should be in the ticket history** — right now it isn't, which means anyone picking this up later will assume the integration path is open.
4. **Two in-flight tickets cite BMS-3930 as their blocker** but BMS-3930 hasn't started. Either the blocker is correct and those tickets shouldn't be in flight, or the dependency graph is stale. **Both of these are problems worth fixing this week.**

---

### 🗒 Slack-ready short version (if manager is in headline mode)

> Hey — I want to refine BMS-3930 but I'm stuck on a few things first. The Rainforest path is gone, so I don't have a data source for credit / payment info anymore. Three things I need before I can scope this:
>
> 1. **Where does the credit data come from now?** (manual AR entry / batch sync from another system / different payment processor / V1 = display Salesforce-only fields with no integration)
> 2. **What does V1 actually need to show?** (just credit terms from Account fields → days of work; or live balances + multi-entity + pending-credit handling → weeks plus an integration story)
> 3. **Are the 13 tickets currently blocked by BMS-3930 actually dependent on it?** Most of them (theme setup, product cards, search, order history) have no real connection to credit data. I think the dependency graph is stale and worth cleaning up before sprint planning.
>
> Once I have those three, I can come back with a real estimate and a proposed scope cut. Got 15 minutes this week?

---

### Tracking — answers as they come in

| # | Question | Status | Answer |
|---|---|---|---|
| Q1 | Data source post-Rainforest | ❌ Open | |
| Q2 | V1 shape | ❌ Open | |
| Q3 | Dependency graph cleanup | ❌ Open | |
| Q4 | Multi-entity schema | ❌ Open | |
| Q5 | Pending credit workflow | ❌ Open | |
| Q6 | Sync cycle in scope | ❌ Open | |
| Q7 | Past Due definition | ❌ Open | |
| Q8 | Real-time vs page-load | ❌ Open | |
| Q9 | "Done" definition | ❌ Open | |
| Q10 | Sandbox + test data | ❌ Open | |
| Q11 | Stakeholder access | ❌ Open | |

Mark each row as it gets answered so the doc becomes a refinement audit trail, not a one-off question dump.

---

## Pattern across all three audited tickets

This is the third ticket I've audited from the Gulf ECOM epic (BMS-3702). All three share the same shape problems:

| | BMS-3923 | BMS-3929 | BMS-3930 |
|---|---|---|---|
| Multiple features bundled into one Story | ✅ 5 surfaces | ✅ 6 features | ✅ 4+ features |
| Open questions block own scope | ✅ 3 unanswered | ✅ 3 unanswered | ✅ 4+ unanswered |
| Marked as ready to work despite refinement gaps | ✅ `refinement-needed` label | ✅ `fast-trackable` label | ✅ `fast-trackable` label |
| Status / completion misrepresented | ✅ "Completed" comment overstates | ✅ Work in flight on partial | ✅ Cited as blocker but never started |
| Bundles different work surfaces (config + code + QA + audit) | ✅ | ✅ | ✅ (display + integration + schema) |

**The common root cause looks like ticket-shaping discipline at refinement time.** Fixing one ticket fixes one problem; fixing the refinement process fixes all three (and probably fixes the other 10 in the epic that I haven't audited yet).

## Related
- Jira: https://ohanafy.atlassian.net/browse/BMS-3930
- Epic: BMS-3702 — Gulf E-Commerce & Ordering (ECOM)
- Sibling audit notes:
  - [[BMS-3923-experience-cloud-branding]]
  - [[BMS-3929-order-history-reorder]]
- Codebase confirmation: grep for `credit|Payment_Status|Credit_Limit|Outstanding_Balance` in `force-app/` returned 0 relevant matches (only checkout payment-method radio, unrelated)
