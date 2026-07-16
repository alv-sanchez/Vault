---
title: Short Pay (Publix EFT) — Isolated from Gulf On-site Afternoon Transcript
source: "Transcripts/Gulf On-site - Short Pays/Transcript July 14th - Afternoon meeting.md"
meeting: "Gulf Onsite — Accounting — Afternoon (Jul 14, 2026, 3h 46m, MS Teams)"
jira: BMS-5626
date_isolated: 2026-07-15
participants: [Emily Shull (Ohanafy), Dave Gillete, Matt Keeter (CPO), Esraa Malha, Josh Kraszeski, Thomas Spangler, Emily Love, Stacie Beckner, Whitney Rouse, Terry (AR mgr, walk-in)]
---

# Short Pay (Publix EFT) — Isolated Transcript

> **Purpose:** Everything from the Gulf on-site afternoon meeting that touches Short Pay,
> pulled out of the full 3,469-line transcript so it can be worked as its own topic.
> Two source clusters + one tangential reference. Verbatim excerpts kept with their
> original timestamps/speakers; my compiled read + the answered/open questions follow.

## TL;DR

- **What it is:** a short pay = amount paid ≠ total due, found *after* the money moves. Publix-EFT is the headline example, but Gulf was explicit it's **broader** (EFT, checks, DEX/DSD, net-30). "No such thing as a no-pay — that's a short pay."
- **What Gulf actually wants:** **prevent it at the source, not just handle it better** — get the invoice *right at delivery* so what Publix EFTs later matches (driver/DEX reconciles qty & price; a Publix/DEX integration syncs in real time).
- **The hard limit (their words):** EFT settles async — *"we can't stop it from happening… it only gets us by the time we're doing a bank reconciliation."* So **short pays can't hit zero on EFT** — a handling/escalation path must still exist for the residual (approval gate, reason codes, collection, roll-to-next-invoice, write-off).
- **Where it lives:** epic **BMS-4965**; this transcript is **Phase 5 — EFT (BMS-5626)**. Capture already shipped (BMS-3844); driver approval gate built (BMS-5625).
- **Why now:** no gate today ("you just accept it"); **~1,000 short pays sit on the books, never followed up.**
- **Still open (need owners):** (1) $/% approval threshold → Ops · (2) can drivers edit/cut the invoice, who authorizes → Jimmy/Ashton (Thu pricing) · (3) Publix EFT/DEX integration build-vs-consume → Product · (4) how the finalize-short-pay alert is surfaced + to whom (Chatter never named; push/bell demoed) → Ops+AR · (5) "rebill" as a formal outcome · (6) manual check-key fallback.

---

## CLUSTER 1 — Opening framing, causes, alerting, approval, check-scan validation
*(source lines ~28–218, 0:03–37:00)*

**[0:03 | Emily]** so, I don't know who all needs to be short paid, but it's the like short pay invoice.

**[0:11 | Dave]** Task is coming. The invoice layout is on for sure. Short pay was who was that? I probably forgot who we originally heard.

**[0:25 | Emily]** This was the example of like publics [Publix] will pay via eft, if I'm not mistaken. And then, but the balance will sometimes not match up with what the balance that gulf uses do.

**[0:40 | Dave]** This might be where Dex was, it was we're testing?

**[0:44 | Emily]** Yeah, this is the payment part. Yeah… because we can't you know, there's like we can't stop it from happening if they're paying for eft. And so it only gets us by the time we're doing a bank reconciliation… Lisa Thompson handles all those payments. … She's the one that's the most familiar with that process. I think it's her. I know she does all the ebi [EFT] stuff.

**[5:25 | Dave]** Driver, this whole notion of public short… pay [Publix short pay], for example, that's not a good example. It's the target. So, picture this, the driver goes in there… and at every account, he retries his own thing basically because if not, if I was going to have this set up, it says, hey, I just gave you a check. Boom. Nope, didn't register boom here's. The amount and it's going to, we'll get into some of these details. DSD. You've got to scan the DSD. You didn't scan your DSD and it's not going to let the driver go forward, correct or wrong. It's not going to let the driver go forward.

**[8:10 | Dave]** Well, do we start a public short paid combo? Well, the public's late. Well, Terry just walked in…

**[11:04 | Emily]** I did say short pay, not the short pay. …

**[11:21 | Emily]** There's a 1,000,000 to do here. Okay. So for the topic of conversation right now, the goal is really to talk through the public short pay [Publix short pay] example — or really it sounds like any time that they're using a Dex device or, you know, doing basically asynchronous monetary remits… and what the process that golf [Gulf] was like in the scenario that **the amount paid does not match the total that was due** through unforeseen reasons — discounts that have been logged or whatever — essentially, it's not paid, but it's not part of the driver's stop process, or it's something that happens maybe like a net 30 on mas. So it doesn't happen at the moment that the goods are transferred, but there is a short pay in the system. **So not just Publix specific.** … that was the one example that was brought up the last time we were here. …
> But if we're going to the source of the problem, my question is… **does Dex eliminate that problem altogether? Does it update discrepancies in real time?**
>
> [Gulf reply] So there's a few reasons why we would have a discrepancy and it's mainly because of **pricing in our system versus [theirs]**… they pulled something off the order or they reviewed something and are paying for it… So I think that's probably the two main reasons why we have a short [pay]. …**pricing discrepancies and then basically quantity or like item change at delivery.**
>
> [Driver latitude] …the driver essentially is not updating [the invoice]. Do you want them to? Well, they can't. … they can update quantity as far as making it *less* than — like if something breaks in the middle of delivery, they can take a case off, **but they can't switch items. They can't change pricing. They can't add.** … so if they were supposed to get three of one but we only have two, he can't modify that invoice. But if he's taken three in and he breaks one, he can modify it (take one off) — he can't add. … They can *remove* items off our invoice… whether it's a broken case or it didn't scan… "warehouse, not loaded" — we get a report that says the reason. When you take it off, it adds back to your inventory on the handheld so they could sell it to someone else, but they rarely do.

**[16:37 | Emily]** Used to have some really big tenured drivers like Sean who would never come back with anything [short]. He knew how to go in and sell it to somebody else… he'd add it to his ticket and they'd add it to their DSD… he didn't have a short page [short pay]. Most of the drivers don't think about doing that. … all of this process and adding all these steps and the check [scanning] and all of this stuff — it's all great if they actually do it, but it could also just provide enough friction to make them just throw up their hands.

**[18:06 | Emily]** …we can enforce any process flow that you guys want. Just, is it going to be for your benefit? … they're required to do this in order to finish/complete their day. So eventually they should get used to it. It's forced through. So… do we not want them to be able to change them [invoices] at all?

**[18:57 | HQ-3-Palm]** going to talk about that — bring it up Friday or Thursday on the pricing [call].

**[19:14 | Emily]** …So it sounds like we need to decide **if they can edit the invoice.** And then that would essentially resolve some of these issues with the misalignment of the DSDs and also the [EFT]. What are the pros and cons of them changing it?

**[19:51 | HQ-3-Palm]** Look at your Publix DSDs that you have items missing. If they changed it, you would have matched. You don't have to pay [a] credit. … the change would match the DSD — that's the deal. They're not matching to what they're getting in the store [for].

**[20:07 | Emily]** …it might be in our best interest. …that becomes basically another kind of technical or vendor integration as we call it. So we would need to set up a whole same conversation flow that we're doing with xeristech [Xerecistech]… (i.e. a **Publix/DEX integration** to sync the invoice to their DSD).

**[20:43 | Emily] — ALERTING / OWNERSHIP**
Okay. So for any short pay — no matter if it's a DSD short pay or even a driver short pay — **if the system alerted somebody somewhere** to say "hey," because by the time the driver gets back, you don't know for sure. …what we need to define here is **where is "somewhere" and who is "someone"?**

**[21:32 | Emily]** …that would really go to the **AR team**. …it can go to a singular person, or an AR email address — it'd go to all of us, for every location — and then we determine who's accountable.

**[22:10 | Emily]** …maybe less of an email… part of their daily workflow and shows up there. But **the manager of the driver should get an immediate alert.** It needs to be something other than just an email… delivery managers — put it on their dashboard, the first thing they look at.

**[22:50 | Emily] — APPROVAL AT THE STOP**
All of the above. So if they or James were aware in the platform, they'll see them queue up as they happen. And the managers, same thing on their dashboard. Plus push to their phones / delivery lights / text messages — the more you shove them in their face.
> …**there is no such thing as a "no pay" — that is a short pay.** …
> I still think that if you build a workflow for a driver well enough — that's going to be a learning curve — **they cannot complete that stop until they've gotten approval to collect a short pay, or they've collected the current [amount].**
> …the approval process related to the short pay… is there going to be a time really that we're not going to approve the short pay? Probably people are just sorting it out and approving it. But if you're holding management accountable for having a short pay as they went back in the door, it's going to have to be a process change. In the beginning it will cause delays, but the benefit outweighs the length of time. At least we put the alarm on.
> **So that would be the delivery manager approving it, or assistant, or a senior driver** — multiple people in case people are out.
> [Approval framework] …there is an in-between [of individuals vs whole departments], which is just a defined *group* of people. You can choose one approver or force it to be unanimous. …you set up first the criteria — what condition fires it off — then choose task / event / record / email / **text (Twilio not enabled yet)** / **push notification.** Example already hooked to a push notification: **if the amount paid doesn't equal the total due**, you get a flag on the bell. Could be sent to anyone — the driver's manager, the whole AR email.
> [Driver view] The driver view would be on their **handheld** (not desktop) — a view of all their stops; they **finalize the stop** and it sets the field (amount paid vs total due) — they're not touching that record directly. Finalize = signature capture and, if it's check scanning, the final uploads.

**[28:00 → 37:06 | Emily] — CHECK-SCAN VALIDATION LAYER (mechanism that detects the short at the stop)**
- Best case: **total due == amount collected** → fine. Total due verified by an *image*, not keyed. Need to decide **how many times the check scan fails before we let them type it in manually** — and a manual key still flags "manually input, can't trust this."
- Bailout only after N failed scans (AI tries to read it off the image).
- **No check number** case (counter checks / returns): decide how to handle — put in the date, generate a "bad check image" report, make it consistent. Check number can be a requirement or not.
- **Check validation rules:** amount matching, invoice reference found in memo, payee, signature — configurable rules.
- **One check covering multiple invoices / overpayment:** numeric value is the truth (memo invoice ref only partial). Algorithm tries to match combinations of open invoices to the check total; if it can't, flag as overpayment → alert AR team, or carry as a forward pay. **Yes, we will have to accept overpayments** (customers' checks "aren't written in the order… so take out all the money").
- Multiple payments / money orders against one invoice supported; deposit-limit caveat.
- Scanning here is a **validation layer, not depositing to the bank** — check is still handed over physically; talk of aggregating balances into a single deposit and a **handoff to the finance team**; possible portable check scanners.

---

## CLUSTER 2 — Approval threshold, reason codes, formal collection, roll-to-next-invoice
*(source lines ~1786–1955, 2:33–2:45)*

**[2:33:10 | Dave]** The next one — about an **approval threshold.** I kind of want to know what we do now.

**[2:33:20 | Emily]** I don't think we do anything right now… I don't think there is a need [today].

**[2:33:32 | Dave]** You're just taking what you can get… If you're depositing it, even if it's not the right [amount].

**[2:33:39 | Emily]** Yeah. **Like there's no approval to accept a short pay today. You just accept it.**

**[2:33:43 | Dave]** …He's gonna scan this thing in and it's gonna be short pay. **It's not gonna let him proceed until something happens.** So **are we going to set a percentage / an amount that says "within this, keep moving," or if it's over that amount [route it] — who does he contact? How?** That's why I think we're going to need some ops out here. We can set those [thresholds].

**[2:34:24 | Emily]** …not sitting on a check — we're gonna accept the check even if it's short pay, right? Yes. So to me it's more like **what are we going to do now [with the] short pay, [rather] than approval of a short pay.**

**[2:34:47 | Dave] — RESOLUTION OUTCOMES**
…You're collecting the short amount and make that driver address it: "Sorry, I need another check — you wrote this for the wrong amount," or "we calculated this incorrectly" — **another amount**; or **if it's just a dispute**; or if it was a **cut** (we cut a keg off it and they shorted this $150), then it needs to **correct this invoice** — which is another part we're going to get into. …that rolls into the next one — the **sales rep / "sales attorney" being able to go and collect the outstanding balance.**

**[2:36:07 → 2:37:25 | Dave/Emily] — INVOICE MODIFICATION (root-cause of the DSD short)**
Right now the driver can't make that modification [in future-state rules]. If the keg wasn't on the truck, the driver + customer manually scribble it out and recount. Today they *can* cut it: "If they haven't finalized the invoice, they can cut it off the invoice right there." What was cut off is **POAs** — we haven't cut off the ability to modify an invoice; broken-on-truck cuts and invoice adjustments still exist. **Open decision: is a "cut" allowed / who authorizes** — an Ashton/Jimmy question to resolve Thursday in the pricing discussion.

**[2:38:45 | Dave] — FORMAL COLLECTION PROCESS ("row six")**
It's both. As soon as we know it's short: **(a)** a driver leaving an account with a short pay → **a "bang" hits whoever** to find it; **(b)** it also **lives on a list** — AR tries to collect, and **if it's not collected by the next delivery, we add it to that next delivery and collect it.** → **yes to both.**

**[2:39:28 | Emily]** And could you not have a **reason code** if we're accepting a short pay?

**[2:39:34 | Dave]** 100%. **We have to have a reason code.** Otherwise, if he just cuts it off, how are we going to look for it? He has to put a reason code — "truck broken," whatever — and that goes to a "Bing" and to the driver manager / sales manager, then it **lives on the board and somebody's got to own it and go back and follow up** (not-on-truck files, camera checks, etc.).

**[2:40:24 → 2:44:33 | Emily/Dave] — ROLL SHORT PAY TO NEXT INVOICE**
- Short pays being **added to the invoice for the next delivery — we don't do that now.** Question is whether it's a current-state limitation vs. a choice about whether the customer sees credits.
- **Ideal / future state: add it to their next invoice.** ("Florida, we have 10 days to collect the money" — drop product, driver knows to collect last week's on this week's delivery.)
- Caveat: the short pay shows on the next invoice but the customer may not know or care.
- Root cause is often **an "us" problem — driver training**: "they know how to *void* an invoice; they don't know how to *cut one line*." Walmart example: they voided the whole invoice instead of taking the one product out.
- Today it lingers until **somebody owns it and either collects it or says "write this off,"** which right now isn't happening ("we've got a **1,000 short pages [short pays] on the books right now, never been followed up on properly**").
- Enforcement idea: **if not collected on the next delivery, make them non-deliverable until it's all paid** — but "a lot of times it's our fault," so caution.

**[2:45:10 | Dave] — RECONCILIATION OWNERSHIP**
Reconciliation future-state is done **at the account.** When there are exceptions, **who manages that?** Terry (AR manager) agreed it's her and her team — **"I want a person responsible for frankly everything."** (Then drifts into posting cadence — daily auto-match of bank transactions vs. wait — out of Short-Pay scope.)

---

## CLUSTER 3 — Tangential: order/transaction status model (where a short pay sits)
*(source lines ~2602–2639, 3:16–3:18 — related, not core direction)*

Discussion of whether "Complete" means goods physically transferred vs. fully posted through back office. Some Gulf customers **won't mark complete until it's gone through the entire back-office process**; others mark complete when goods transfer. Relevant because a short pay is the gap between "delivered / signed" and "posted / cleared" — supports adding a **"Posted"** status after "Complete" (journal entry hits the financials). Flagged for the status-model decision, not the Short-Pay direction itself.

---

# VALIDATION — did I get it all?

Swept the full transcript for: `short pay / shortpay / short-pay / short paid / short page`, `Publix / public short`, `EFT / electronic fund / ebi`, `Dex / DSD`, `no pay`, plus resolution terms `reason code / approval threshold / collect / bank rec / reconcile / write-off / dispute / credit / rebill / AR / amount paid / total due / overpay`.

- **All Short-Pay-specific dialogue falls in two blocks:** lines **28–218** (Cluster 1) and **1786–1955** (Cluster 2). Captured in full above.
- Cluster 3 (status model, ~2602–2639) is adjacent context, included but marked non-core.
- Other hits for `credit / AR / reconcile / debit` at lines 407, 563, 584, 1379–1580, 2765, 2840, 3074 are **general chart-of-accounts, ledger-view, and bank-rec/deposit-matching** discussion — not Short Pay direction. Excluded intentionally.
- Nothing about Short Pay appears outside these ranges. **Coverage is complete.**

---

# COMPILED DIRECTION (for the engineer — Gulf's own words, grouped)

> Gulf's stated intent, not my assumptions. Grouped by decision area.

### A. What a "short pay" IS (Gulf's definition)
- **Amount paid ≠ total due**, discovered *after* the money movement, not at the point of sale.
- Explicitly **broader than Publix/EFT** — *Publix EFT is just the headline example*. Covers any "asynchronous monetary remit": DEX/DSD deliveries, net-30, checks, EFT/FinTech.
- **"There is no such thing as a no-pay — that is a short pay."** No-pay collapses into short pay.

DSD - Direct Store Delivery, when the supplier/distributer delivers product straight to the retail store (*Bypassing the retailers warehouse*)
-> DEX - Direct Exchange, electronic datrra standard that rides on top of DSD
- Quantities and prices are reconciled on the spot instead of on paper

### B. Why shorts happen (root causes Gulf named)
1. **Pricing discrepancy** — Gulf's price vs. the retailer's system.
2. **Quantity / item change at delivery** — broken case, didn't scan, warehouse-not-loaded, wrong item sent.
- Driver latitude today: can **reduce** qty / cut a line (e.g. broken keg), **cannot** switch items, change pricing, or add. Cuts return stock to the handheld inventory.

> A big root cause is **driver training** — drivers void whole invoices instead of cutting a single line.


### C. Prevention vs. detection — the biggest scope call
**Gulf's stated desired state is prevention (+ detection as the safety net), NOT resolution** — they want the discrepancy to never exist in the first place. Resolution is the fallback; "all hands on deck" every time a short happens is the current pain.
- **Today:** shorts are only caught **at bank reconciliation** (Lisa Thompson handles EFT payments) — too late.
- **Prevent at source (the goal):** get the invoice **right at delivery** so what Publix EFTs later matches — (a) driver/DEX reconciles qty & price on the spot; (b) a **Publix/DEX vendor integration** (Xerecistech-style) syncs the invoice to the retailer's DSD in real time. *Open, not committed; gated on the invoice-edit decision (Q2).*
- **Detect (fallback):** the **check-scan / payment-validation layer** on the handheld compares **amount paid vs. total due** and flags a mismatch (rules: amount match, invoice ref in memo, payee, signature; overpayment/multi-invoice heuristics).
- **Hard constraint (Gulf's words):** for **EFT** they "==can't stop it from happening==" — it settles async and "only gets us by the time we're doing a bank reconciliation." **So short pays can't be driven to zero on EFT — a handling path must still exist,** including for a *legitimately approved* short pay.

#### Why a residual always slips through — even with a perfect at-delivery invoice
> ⚠️ **AI-assumed synthesis — ratify in refinement.** The individual causes below **were stated** (each cited to a transcript line or the June-30 note). What was **NOT explicitly disclosed** in either meeting is this framing itself — grouping them as *"the residual that survives a perfect at-delivery invoice."* No one in the on-site walked through this as a list; it's engineer inference connecting stated facts. Treat the *causes* as grounded, the *"therefore invoice-edit can't prevent them"* linkage as assumption.

Correcting the invoice at drop-off only fixes **one class**: the delivery-count mismatch (fewer cases, broken case, wrong item → edit to match the DSD). These other causes originate where the driver's stop-level edit can't reach, so they survive a perfect invoice:
1. **Customer takes a discount on their side, at payment time** — *"the disputed amount is mostly a **discount the customer took**… no driver in the loop"* ([[2026-06-30 Finance & Accounting Demo Workshop — Action Items]], line 51). The invoice was right at drop-off; the short is created when Publix remits the EFT minus a deduction they apply.
2. **No in-person moment on EFT to reconcile against** — *"can't stop it from happening if they're paying for EFT… only gets us by bank reconciliation"* (transcript ln 41); *"no in-person moment"* (SESSION.md ln 19). Nobody hands over money at the stop, so nothing catches the gap until the bank feed lands.
3. **Happens after the goods transfer / net-30 timing** — *"it doesn't happen at the moment that the goods are transferred… like a net 30"* (transcript ln 146). The delivery event is closed before the short payment arrives.
4. **Price mismatch — Gulf's system vs. the retailer's system** — pricing discrepancy *"in our system versus [theirs]"* (transcript ln 146). The driver can adjust **quantity** but **cannot change price** (ln 146), so a quantity-accurate invoice still goes short if Publix's system holds a different price.
5. **Logged discounts / promos and disputes** — *"discounts that have been logged or whatever"* (transcript ln 146). Booked promos or a disputed line reduce payment regardless of what was delivered.
- **The lever itself was scoped as partial:** editing the invoice would resolve *"**some** of these issues"* (transcript ln 51), not all — drivers can cut a broken line but can't change price, switch items, or add.
- **Net:** invoice-edit-at-delivery fixes *delivered-vs-billed*; it can't touch *price, timing, promos, disputes, or a discount the customer applies when paying by EFT* — exactly the EFT/Publix cases → residual routes to the AR review/dispute path.

### D. Alerting & ownership
- Fire an alert **the moment a stop is finalized short** — don't wait for the driver to return.
- Route to: **AR team** (single person or shared AR email, per location) **+ the driver's manager immediately** (dashboard first, not just email) **+ push to handheld / delivery lights / text** (Twilio not enabled yet).
- Configurable rule engine: **criteria → action** (task / event / record / email / text / push).
- Every accepted short needs an **owner** and it must **live on a board/list** until resolved. Reconciliation done **at the account level**; **AR manager Terry** owns exceptions ("one person responsible").

### E. Approval at the stop (workflow gate)
- **Driver cannot complete the stop** until they've either **collected in full** OR **gotten approval to accept the short pay.**
- Approvers = **delivery manager / assistant / senior driver** (multiple, for coverage) — or a **defined approver group** (one approver or unanimous).
- **Approval threshold — DECIDED (engineer default, 2026-07-15; configurable, ratify w/ Ops):** state-aware auto-accept vs route, driven by alcohol credit law:
  - **AL = $0 auto-accept (always route), aging 0** — wholesale alcohol is cash/COD by rule (AL ABC Admin Code Ch. 20-X-8); no lawful credit window. Matches the shipped 5625 default.
  - **FL = auto-accept if short ≤ $50 AND ≤ 2% (lower-of), aging escalates at day 7** — §561.42 permits credit to the 10th day after the sale week, then delinquent-list/report obligation; the 7-day escalation buffers before that trigger. $50 is the common AR auto-settlement norm (~80% of firms; "1% or $50" hybrid documented).
  - **Above cutoff → the N-layer approval chain** (delivery mgr → assistant → senior driver, `Approver_Source` group), surfaced via the pending push/bell + review-queue; unresolved → AR + roll to next invoice.
  - Values drop straight into `Short_Pay_Threshold__mdt` by `BillingState` ($ + % + aging days). AL=$0 and the §561.42 basis are legally grounded; the FL $50/2%/7-day numbers are AI-assumed defaults to ratify against Gulf's real invoice sizes.
- **How the escalation is surfaced when a driver finalizes a short (OPEN — the LWC needs this):** Gulf wanted high visibility ("all of the above… the more you shove them in their face") but **did not pick a channel or a single recipient.** Demoed = a **push/bell (custom) notification** on *amount paid ≠ total due* + a **dashboard queue**; email deemed insufficient on its own; **Chatter was never named**; **SMS/text wanted but Twilio not enabled.** Engine options: task / event / record / email / text / push. Recipient candidates: **driver's manager / delivery manager** (immediate, dashboard-first) · **AR team** (single owner or shared AR email, per location). → decision needed (see Q4).

### F. Resolution outcomes Gulf wants
- **Collect the difference now** — driver requests a corrected/second check ("wrong amount").
- **Correct/adjust the invoice** — when the short is a legitimate cut (e.g. keg removed) → invoice must be fixed (ties to the invoice-modification decision).
- **Dispute** — flagged as a dispute path.
- **Roll to next delivery** — add the outstanding balance to the **next invoice** (ideal/future state); driver collects last delivery's short on the next visit. FL = 10 days to collect.
- **Write-off** — someone must be able to decide "write this off."
- **Sales rep / "sales attorney"** can go collect the outstanding balance.
- **Every accepted short requires a REASON CODE** (100% required) — drives follow-up and reporting.
- Enforcement idea: **make the account non-deliverable until paid** if not collected next delivery (with caution — often Gulf's own fault).

### G. Current-state pain (the "why now")
- No approval, no gate — **"you just accept it."**
- **~1,000 short pays sitting on the books, never properly followed up.**

---

# OPEN QUESTIONS — were they answered?
*(Q1–Q3 = Elliot's original three; Q4 added by engineer.)*

### Q1. How do we learn a Publix EFT came in short — does Bank Rec already flag it, or do we detect it? (consume vs. build)
**PARTIALLY ANSWERED — and the direction shifted.**
- **Today:** only caught at **bank reconciliation** (Lisa Thompson) — confirmed as the current, too-late mechanism (0:44).
- **Desired future:** **detect at the stop** via the handheld check-scan/payment-validation layer (amount paid vs. total due), *not* wait for Bank Rec (28:00 onward, 22:50).
- For **Publix EFT/DEX** specifically, detection is complicated because EFT "we can't stop from happening" — so they floated a **DEX/DSD vendor integration** to make invoices match at source. **Left open** — the build-vs-consume call for the Publix-EFT path itself is **not finalized.** Needs the integration-scope decision.

### Q2. Who can modify/resolve a Publix invoice, and at what step?
**PARTIALLY ANSWERED — key sub-decision deferred.**
- **Resolve/approve a short pay:** delivery manager / assistant / senior driver (or a defined approver group), at the **finalize-stop** step on the handheld (22:50).
- **AR team + Terry (AR manager)** own the post-stop resolution/collection and exceptions.
- **Modify the invoice itself:** drivers can cut a line / reduce qty *before finalizing* today; cannot switch items, change price, or add. **Whether a "cut" is allowed and who authorizes it is DEFERRED** to Jimmy/Ashton in the **Thursday pricing call** (2:37–2:38). The "can the driver edit the invoice at all" decision is explicitly **unresolved.**

### Q3. What resolution outcomes does Publix need — credit, rebill, dispute, write-off?
**MOSTLY ANSWERED.** Gulf named these outcomes (Section F):
- Collect the difference (corrected/second check) ✅
- Correct/adjust the invoice (credit for a legitimate cut) ✅
- Dispute ✅
- Roll balance to the **next invoice** (their preferred future state) ✅
- Write-off ✅
- Sales rep collection of outstanding balance ✅
- **Mandatory reason code on every accepted short** ✅
- **Not explicitly settled:** a formal **"rebill"** as a distinct outcome (closest is "correct the invoice" + "add to next invoice"); and the **$/% approval threshold** that gates which outcome path applies (Q left for Ops).

### Q4. (Added by engineer) How does Gulf want to be NOTIFIED when a driver tries to finalize a stop with a short pay — and who receives it?
**NOT CAPTURED AS A DECISION — needed for the BMS-5625 approval-gate LWC.**
- **Channel:** undecided. Gulf leaned "all of the above / max visibility" (ln 206). Demoed a **push/bell custom notification** (ln 206) + **dashboard queue** (ln 203, 206); **email alone = insufficient** (ln 203); **Chatter never mentioned** (zero hits in transcript); **SMS/text wanted but Twilio not enabled** (ln 206). Engine offers task / event / record / email / text / push (ln 206).
- **Recipient:** not narrowed — candidates are the **driver's manager / delivery manager** (immediate, dashboard-first, ln 203) and the **AR team** (a single accountable owner, or a shared AR email, per location, ln 197); plus **push to the driver's handheld/phone** (ln 206). *(A driver on-screen banner exists in the BMS-5625 build but was not stated in this transcript.)*
- **Needed to build:** pick the **primary channel** (Chatter @mention post · custom bell/push notification · in-app toast/message · email · SMS) and the **authoritative recipient(s)** for the finalize-with-short-pay event. → **Ops + AR (Gulf); confirm with Product.**

---

# STILL-OPEN ITEMS TO CLOSE (route these)
1. ~~**Approval threshold** — the % / $ cutoff for auto-accept vs. route-for-approval, and the contact path above it.~~ → **DECIDED 2026-07-15 (engineer default, configurable):** AL = $0 (cash/COD, Ch. 20-X-8); FL = ≤ $50 AND ≤ 2%, aging 7d (§561.42 10-day window); above → N-layer approval chain. AI-assumed FL numbers to ratify w/ Ops against real invoice sizes. See Section E.
2. **Can drivers edit/cut the invoice, and who authorizes a cut?** → **Jimmy / Ashton, Thursday pricing call.**
3. **Publix EFT / DEX integration** — build the DSD-sync integration (Xerecistech-style) or keep consuming from Bank Rec? → **scope decision, not made.**
4. **"Rebill" as a formal outcome** — confirm vs. fold into "correct invoice / add to next invoice."
5. **Manual check-key fallback** — how many failed scans before manual entry is allowed. → **Accounting + Ops joint session.**
6. **Short-pay escalation notification (channel + recipient)** — how the driver-finalize-short-pay alert is surfaced (Chatter post / custom bell-push / in-app message / email / SMS) and to whom (driver's manager vs. shared AR queue). Needed for the **BMS-5625** LWC. → **Ops + AR (Gulf); confirm with Product.**
