---
title: E-Commerce — Isolated from Gulf On-site (Jul 15 Afternoon / Sales Day 1)
source: "Transcripts/Gulf On-site/E-Commerce/Transcript July 15th - Afternoon meeting.md"
meeting: "Gulf Onsite — Sales — Day 1 (Jul 15, 2026, 3h 11m, MS Teams)"
jira: none (discovery only — no epic/ticket yet)
date_isolated: 2026-07-20
owner_sme: Alvaro Sanchez (E-Commerce)
gulf_side: [Olivia Boutwell (Marketing), Cameron Koorangi (web orders), Mindy/Mandy (heads web-order dept), "Jules", "Taska"/"Jeremy" (referenced)]
ohanafy_side: [Emily Shull, Emily Love, Brian Beach, Esraa Malha, Hogan Hagy (CCO), Ian Padrick (CEO), Mackenzie Fenn (CSM), Matt Keeter (CPO), "Dave" (presenter)]
note_on_attribution: "Raw diarization is unreliable — most turns labeled 'Dave' are the Ohanafy presenter demoing the platform ('our system / our solution'), NOT Gulf's Dave Gillete. Verbatim speaker tags preserved as-is; read for content, not attribution."
---

# E-Commerce — Isolated Transcript

> **Purpose:** Everything from the Jul-15 Gulf on-site that touches the B2B E-Commerce platform,
> pulled out of the 1,624-line transcript so it can be worked as its own topic. This is a
> **discovery/expectations** read — what Gulf expects, what was answered live, what's open,
> and the alignments the E-Comm owner needs to know. No epic exists yet.
> Verbatim excerpts kept with original `[timestamp | speaker]` tags; compiled read + Q&A follow.

## TL;DR

- **What Gulf runs today:** a **B2B e-commerce (web order) platform** for retailers to place orders online. It's **~11–12% of total revenue**, and only **~20–25% of web-order accounts are ever seen by a salesperson** — the other ~75% never see a Gulf employee. Olivia's framing: *"this has got to be our salesperson."* (ln 1341)
- **What they want it to become:** not just an order pad — a **selling engine**. Suggestive/upsell at checkout tied to **MBOs / distribution drives** (e.g. push Modelo, Red Bull), promotions, dynamic per-account banners, QD nudges, plus **full e-comm analytics they have zero visibility into today** (traffic, click-through, cart abandonment, product views). (ln 1269, 1329, 1341)
- **Ohanafy's core architectural pitch:** the storefront is **just a lens into Gulf's core Salesforce environment** — items, pricing, promotions, MBOs surface automatically by eligibility (start/end date + account). *"You're not having to come into the E-commerce side and change anything, you're managing all that from within the core environment."* (ln 1350) This is the single most important alignment.
- **Big themes raised:** notifications/reminders (order cutoffs, abandoned cart) via email/text/chatter; self-registration w/ alcohol-license verification; modify-order-until-cutoff; suggestive selling from MBOs; per-account dynamic banners; e-comm analytics; product images via supplier feeds + a **supplier portal** for asset intake; POS/resale items — should they be orderable on e-comm (**answered: not yet, keep with sales team**).
- **Homework Gulf owes (Olivia to send):** examples of MBO/promo/upsell scenarios + where they should surface; POS inventory-depth decision; tap-handle inventory sheet. She closed with *"I've got my list of items to send to you."* (ln 1623)

---

## CLUSTER 1 — POS / resale items: should they be orderable on E-Comm?
*(source lines ~640–885, 1:25–2:03 — groundwork that feeds the e-comm scope decision)*

**[1:27:03 | Olivia]** Most POS/resale items are for **on-premise accounts (bars/restaurants), who place all their orders on our B2B e-commerce platform.** They **do not have access to add these [resale] items to their orders** — "that would be a nightmare." Salespeople *can* order resale items for an account on the iPad; it generates a **separate invoice** from the product order. (ln 648)

**[1:28:54 | "Dave"]** From our side the resale side is "easy enough… just a different price book." Asks Olivia to clarify — *"I heard you say that if you allow them to order on E-commerce, it'd be a nightmare."* (ln 651)

**[1:29:42 | Olivia]** The nightmare = brand granularity. If retailers could order buckets on e-comm, **they can't see which brands are actually available** ("I'd love a Coors Light bucket — what if we don't have it?"). Inventorying every brand-variant bucket is *"totally unrealistic."* So it's left with the sales team who know what's in stock. (ln 654)

**[1:33:33 | "Dave"] — KEY SCOPE ANSWER:** *"there's no limitation on our side… if you guys ever said hey, we do want to have a whole point-of-sale section in eCom… that can all be there. It's just really a matter… a function of process for Gulf to decide."* You can **turn it on whenever you want**; nothing forces it day one. (ln 690)

**[1:56:59 / 1:57:54 | Olivia] — future idea:** a **"shop" for the sales team** (not retailers) — POS admin snaps a photo of a new piece, it posts to an online shop w/ quantity, reps browse & request for a specific store, inventory decrements. Recalls a distributor that *"worked through Shopify"* to do exactly this. (ln 837, 849)

**[2:05:00 | "Dave"] — RECAP DECISION:** *"for now, hold off on the resale items on E-comm."* Olivia does want reps able to **request signage** through it (not truck-delivered; a salesperson follows up). (ln 909, 912)

---

## CLUSTER 2 — The E-Commerce platform session (the core)
*(source lines ~887–1554, 2:03–3:01 — Mindy/web-order dept joins; live demo + Q&A)*

### Notifications, reminders & order cutoffs
**[2:06:41 → 2:13 | "Dave"/Cameron/Olivia]** Retailers get a reminder **2 days prior** to place their order (ln 933). Asks/answers:
- Reps should also get notified when an assigned account **hasn't ordered** → call them ("4–8 hrs in advance… create less off-day deliveries"). Wanted as **a table on the rep homepage** (eCom status per account), *not* email. (ln 963)
- **Abandoned-cart alert** already exists — *"we actually had that alert today… like if they have an item in a cart… it will alert them"* (Amazon-style "you forgot to check out"). (ln 1197)
- Escalating nudges: email at 9am, **text at noon** if still not placed — *"whatever you guys want in terms of designing the right amount of nudging."* (ln 1023)
- **Delivery-frequency display is a known pain** — retailers on every-other-week think "I'm getting it tomorrow." Fix: show **the actual next-delivery date** prominently. Gulf already has a small "next delivery Fri 7/17/26" icon on the B2B home screen but retailers miss it. (ln 1041, 1047, 1056)
- **Chatter / internal messaging** to the retailer (back-and-forth) is doable; Cameron: *"we used to have a thing on our computers where we could chat."* (ln 993, 1023)

### Modify order until cutoff
**[2:19:36 → 2:22 | Cameron/Olivia/Emily]** Retailers should be able to **edit/modify their order up until the cutoff time** (today Mindy does a lot of manual editing on their behalf). (ln 1131, 1164)
- Routing concern (Olivia): trucks start building before cutoff — does letting them increase an order affect routing? → **"5pm is cutoff, we don't route till 5:30."** (ln 1152, 1167)
- Needs **validation**: if you hit save at 5:03 after a 5:00 cutoff, "you can't modify the order." (ln 1179)
- Cutoff windows are **configurable off the 40-hour window** ("place order by 9am Friday to receive Monday"). (ln 1182)

### Inventory visibility / committed stock
**[2:16:35 → 2:19 | "Dave"/Olivia]** Out-of-stock shows **"sold out"** — should suggest secondary/similar products (needs a defined substitution table). (ln 1071, 1077)
- **Quantities:** Gulf currently **shows available qty** (e.g. "392 available") + cost/case; hidden once, reopened during COVID. Dave leans **don't show low-stock counts** ("don't want them to know we have 12 cases left"); Olivia flags they *do* show it today → decision to revisit. (ln 1089, 1095, 1101)
- **Committed inventory:** once a retailer orders, stock goes **committed / pulled from available** so a later Walmart order can't grab it. Confirmed behavior. (ln 1104, 1128)
- **Product list is channel-scoped** — on/off-premise; retailers only see what the rep could sell them there. (ln 1077, 1080)

### Self-registration & access
**[2:26:49 → 2:32 | Olivia/Cameron/"Dave"]** Today adding a login is **manual** — rep emails Mindy to set up a new ordering manager / new account. Two future paths:
- Gulf enables an account in-system → retailer gets an invite ("you've been assigned to Gulf's online ordering portal"). (ln 1218, 1239)
- **Self-registration** via website/QR-on-invoice, gated by **alcohol-license number** (and optionally uploading a copy of the license — doubles as audit evidence). Sierra Nevada precedent: unique per-account codes. (ln 1218, 1224, 1254)
- New-license import → bulk-create retail accounts → one click to enable e-comm for all. (ln 1239)
- Users = contacts; on departure **deactivate, don't delete** (keep history). (ln 1232)

### Suggestive selling / upsell / MBOs — Olivia's biggest ask
**[2:35:58 → 2:47 | Olivia/"Dave"]** Wants the platform to **push Gulf's agenda** — distribution drives, MBOs, incentives, QDs — at checkout. *"Our E-commerce platform should be pushing that agenda for us."* Examples: push Modelo for a constellation drive; **75% on-premise Red Bull** initiative — *"it should be suggestive selling that to them until they add it to cart and check out."* (ln 1269, 1287, 1311, 1317)
- Also wants **standard e-comm upsell**: frequently-bought-together, based-on-previous-purchases, **QD nudges** ("10-case QD, you bought 8, add 2 more for the discount"), request-signage-on-order. (ln 1329)
- **Dynamic per-account banners** (from TBM): banners render **per retailer / per route** based on demographics/eligibility, not one static homepage banner. (ln 1272, 1284, 1287)
- **Promotions defined broadly** — supplier MBO/rebate **or** internal Gulf mandate ("we want to move this product"). (ln 1272)
- **Placement:** surface across shop page banner → product page → cart page → **final checkout** ("boom, here's promotions/suggestions/incentives"). Balance: don't overwhelm. (ln 1344)

### Analytics — "we have zero line of sight"
**[2:42 → 2:44 | Olivia]** Wants full e-comm metrics: **visitors, click-through on ads, add-to-cart vs checkout vs abandoned, most-viewed pages/products, engagement, bounce rate, avg session duration.** Rationale: e-comm is **11–12% of revenue** and ~75% of those accounts never see a rep. (ln 1329, 1341)
- Ohanafy answer: page-view / click-through / traditional marketing metrics are **on the roadmap (from TBM) but not top priority yet**; **short-term** metrics are available now — # signed up, on-time order %, who orders/who doesn't, accounts not ordered in 30/60/90 days (roll to rep/GM/SVP dashboards). (ln 1332, 1338, 1356, 1362)
- Everything the retailer does (even building a cart) is **live data in the core system** → surfaces in reports/dashboards ("how much money left on the table by carts not submitted"). (ln 1185, 1191)

### New-item / mis-order safeguards
**[2:55 → 3:00 | Cameron/"Dave"]** When a retailer orders a **different packaging** than usual (e.g. Miller Lite pack style) → **AI checks order vs history**, flags it. Options: highlight **"new items"** at checkout for the retailer to confirm ("sparkly and colorful"), and/or notify the rep (batched, on homepage — **not email**). Also the inverse: items **not** ordered in N days. (ln 1407, 1449, 1476, 1488)

### Order history / invoices / enablement
- Retailers can **download the invoice PDF** from order history (Cameron: "gets utilized more than it should… when ABC shows up"). (ln 1497, 1518)
- **Guided walkthroughs / tutorials** — for reps and extendable to retailers ("how do I place an order"); look/feel **based on Amazon** best practices. (ln 1374, 1377, 1383)
- **Notification preferences** are per-retailer & channel; text requires opt-in / STOP compliance (SMS law); **order confirmation ≠ notification** — treat separately; consider "always send email at minimum, text toggleable." (ln 1260)
- Spanish/multi-language toggle raised ("grocery stores") — noted, low certainty. (ln 1260, 1266)

---

## CLUSTER 3 — Product images / digital assets / supplier portal
*(source lines ~1556–1623, 3:02–3:11)*

**[3:02:47 | Olivia]** Website & retailer-portal product images/logos are **fed directly from Vermont Information Processing (VIP)**, sourced from suppliers nationally; missing ones show **"image not available."** Questions: how do we migrate — export from VIP, or start fresh? (ln 1557)

**[3:03:45 | "Dave"]** Multiple paths: import anything Gulf provides; **bigger suppliers (e.g. Molson Coors) send automated feeds** — product master data **+ digital assets (DAM)** — auto-ingested, no one manages them. (Caveat ln 1563: sometimes the auto image is wrong, e.g. not the 30-pack.) (ln 1560)

**[3:05:26 → 3:09 | Olivia/"Dave"] — SUPPLIER PORTAL (key idea):** New/small suppliers (e.g. Deerfish, a local Mobile distillery) have never dealt with VIP. Proposal: a **supplier portal** where suppliers upload their own **product images / sales materials / banners / assets** at **new-item intake** — Gulf still **approves** before they go live on e-comm; Gulf can **report on draft/stale assets by supplier/brand/SKU**. Olivia loves it — wants suppliers to **own** their assets ("no you have the wrong image there"). Big suppliers may never log in, so Gulf keeps ability to upload for them. (ln 1578, 1584, 1596)

**[3:08 / 3:10 | Olivia]** Wants a **report of items missing product images** ("it's stopping all of us from making money"). Also flags a **search bug**: Deerfish products don't surface in retailer-portal search and display as "DF." (ln 1581, 1605, 1611)

**[3:10:32 | "Dave"] — idea, not committed:** could **AI-generate product images** for SKUs lacking them. (ln 1613)

---

# VALIDATION — did I get it all?

Swept the full 1,624-line transcript for: `ecom / e-commerce / e commerce`, `portal`, `website`, `catalog`, `order online / place order / checkout / cart`, `storefront / self-service`, `reorder`, `abandoned`, `notification / reminder`, `suggestive / suggested / upsell`, `banner`, `promotion / MBO`, `self regist / registration`, `supplier portal`, `digital asset / product image / image not available / DAM`, `cut off / cutoff`, `chat`, `dashboard / metric / analytic / click through / bounce rate`.

- **All core E-Commerce dialogue falls in lines ~640–1623**, split into the three clusters above. Captured in full.
  - Cluster 1 (POS/resale → what to expose on e-comm): ln ~648–912.
  - Cluster 2 (the platform session): ln ~887–1554.
  - Cluster 3 (images/assets/supplier portal): ln ~1556–1623.
- **Deliberately EXCLUDED (non-core hits in the sales/marketing-budget first half):**
  - ln 174 — Molson Coors **media budget** (matched on "commerce"-adjacent text), not e-comm.
  - ln 198, 315, 318, 438, 456, 465 — **marketing budgets / MBO spend / supplier a-la-carte budgets / logo ingestion for brand representation** — marketing planning, not the storefront.
  - ln 261, 396 — **purchase-order system & analytics rollup** — accounting/PO process.
  - ln 402 — **logo ingestion "touches website and probably E-commerce"** — tangential brand-asset mention; the substantive asset discussion is captured in Cluster 3.
  - ln 498 — **"Heineken's portal / xtc"** — a supplier ordering channel, not Gulf's e-comm.
  - ln 582 — a **notification** in the budgeting context.
  - ln 762–873 — **POS inventory (neons, tap handles, coolers, display tracking, ROI)** — marketing-ops inventory; included only where it directly gates the e-comm "should resale be orderable" decision (Cluster 1), otherwise out of scope.
- Nothing about the E-Commerce platform appears outside ln 640–1623. **Coverage is complete.**

---

# WHAT GULF EXPECTS (compiled — grouped for the SME)

> Gulf's stated intent from the meeting, grouped by area. Cited to transcript lines.

### A. The platform's role (the mindset shift)
- E-comm must act as **the salesperson** for the ~75% of web-order accounts a rep never visits; it's **11–12% of revenue** with **zero behavioral visibility today.** (ln 1341)
- From order-pad → **selling engine**: promotions, MBOs, upsell, analytics. (ln 1269, 1329)

### B. Notifications & workflow (largely confirmed capable)
- Configurable, multi-channel (email/text/chatter/in-app), escalating nudges; abandoned-cart alerts; rep-facing "who hasn't ordered" tables on the homepage (not email). Delivery-date/cutoff clarity is a named pain to fix. (ln 963, 1023, 1041, 1197)

### C. Ordering mechanics
- **Modify order until cutoff** with save-time validation; cutoff configurable off the 40-hr window; routing starts after cutoff (5:00 cutoff / 5:30 route). (ln 1164, 1179, 1182)
- Committed-inventory on order; channel-scoped product lists; sold-out + substitution suggestions; **open decision on showing on-hand quantities.** (ln 1077, 1101, 1104)

### D. Access / onboarding
- **Self-registration gated by alcohol license** (number + optional license upload as audit proof); Sierra-Nevada-style per-account codes; bulk-enable on new-license import; deactivate-not-delete users. (ln 1218, 1233, 1239)

### E. Selling / merchandising (the biggest ask — needs Gulf examples)
- Suggestive selling driven by **MBOs / distribution drives / QDs / internal mandates**, surfaced product page → cart → checkout; **per-account dynamic banners** by route/eligibility; promotions defined broadly. **Must be flexible** — MBOs change monthly, drives mid-month (start/end dates). (ln 1269, 1287, 1344, 1347)

### F. Analytics
- Full funnel metrics wanted (traffic, CTR, add-to-cart, abandonment, page/product views, bounce, session) — **roadmap, not immediate**; short-term signup/on-time/dormant-account metrics available now. (ln 1329, 1338)

### G. Content / assets
- Images fed from VIP + supplier auto-feeds (DAM); **supplier portal** for self-serve asset upload at new-item intake w/ Gulf approval + stale-asset reporting; missing-image report; possible AI image generation. Search bug on Deerfish. (ln 1560, 1578, 1605)

---

# ALIGNMENTS THE SME NEEDS TO KNOW

1. **The storefront is a lens, not a separate system.** Items, pricing, promotions, MBOs surface **automatically by eligibility (account + start/end date)** from the core Salesforce env — Gulf manages nothing in a separate e-comm backend. This is the load-bearing architectural promise Ohanafy made; every "can it do X" answer traces back to it. (ln 1350)
2. **Resale/POS is OUT of the storefront for now** — decided live ("hold off on resale items on E-comm"), keep with the sales team; revisit later, turn-on-when-ready. Signage *requests* are wanted. (ln 909)
3. **A mobile app is "something we're working on"** — Ohanafy did not commit; Gulf assumes app + website. Flag as roadmap. (ln 1017)
4. **Full marketing-style analytics are roadmap, not near-term** — set expectations; deliver the signup/on-time/dormant metrics first. (ln 1332, 1338)
5. **Order confirmation ≠ notification** — treat separately for opt-out/compliance; SMS needs opt-in + STOP handling. (ln 1260)
6. **Look/feel is anchored to Amazon** best practices + guided walkthroughs. (ln 1377)

---

# QUESTIONS RAISED — answered vs. open

### Answered in the meeting
| # | Question (raiser) | Answer | Line |
|---|---|---|---|
| 1 | Should resale/POS items be orderable on e-comm? (Olivia) | **No for now** — keep with sales team; can turn on later. | 909 |
| 2 | Can we expose only some items (resale vs not)? | **Yes** — per-item/checkbox controlled, not all-or-nothing. | 921 |
| 3 | Can retailers modify orders after placing? | **Yes, until cutoff**, with save-time validation. | 1164, 1179 |
| 4 | Does modifying affect routing? | **No** — routing runs after cutoff (5:00 / 5:30). | 1167 |
| 5 | Committed inventory — can Walmart grab Jim-Bob's stock? | **No** — order commits/decrements available. | 1104 |
| 6 | Simplified new-user setup vs. emailing Mindy? | **Yes** — in-system enable + **self-registration w/ license verification**. | 1218 |
| 7 | Can suggestive/upsell/MBO driving be done? | **Yes** — promotions, per-account banners, checkout suggestions; needs Gulf's scenario list. | 1272, 1344 |
| 8 | Can MBOs surface without manual toggling? | **Yes** — auto by eligibility (account + dates). | 1350 |
| 9 | Abandoned-cart alerts? | **Yes** — already live. | 1197 |
| 10 | Download invoice PDF from order history? | **Yes** — add an action next to reorder. | 1518 |
| 11 | Guided walkthroughs/tutorials for retailers? | **Yes** — extend the rep guided-walkthrough concept. | 1377 |
| 12 | Product images — migrate from VIP or start fresh? | **Both** — import what Gulf has + supplier auto-feeds + **supplier portal** upload. | 1560, 1578 |

### Open / homework (route back to Gulf or Product)
| # | Open item | Owner / next step | Line |
|---|---|---|---|
| O1 | **Show on-hand quantities to retailers or not?** (currently shown; Ohanafy leans no for low stock) | Gulf decision | 1089, 1101 |
| O2 | **MBO/promo/upsell scenarios + where each should surface** — the big merchandising ask | **Olivia to send examples** (homework) | 1320, 1344 |
| O3 | **POS inventory design depth** (how granular to inventory POS/resale) | Gulf ops/sales + Marston/Dom/Lewis alignment | 834, 879 |
| O4 | **Substitution/similar-item table** for sold-out suggestions | Gulf to define | 1077 |
| O5 | **Big-supplier asset ownership** (Molson Coors won't use supplier portal) | Ohanafy + Gulf, "don't know what that looks like yet" | 1584 |
| O6 | **Deerfish search bug** ("DF", not searchable on retailer portal) | Ohanafy to investigate | 1581, 1605 |
| O7 | **Missing-product-image report** | Ohanafy build ask | 1611 |
| O8 | **Mobile app** commitment/scope | Ohanafy roadmap | 1017 |
| O9 | **Multi-language (Spanish) toggle** | noted, undecided | 1260 |
| O10 | **New-item / mis-order flag** at checkout + rep notification (AI vs. history) | Ohanafy design | 1449, 1476 |

---
*Discovery extraction — no epic yet. Source: Jul-15 Gulf on-site (Sales Day 1). Prepared by Alvaro Sanchez, 2026-07-20.*
