---
title: E-Commerce — Action Items & Proposed Ticket Tree (Gulf on-site, Jul 15)
source: "E-Commerce-Extraction.md (Jul-15 Gulf on-site, Sales Day 1)"
prepared_by: Alvaro Sanchez (E-Commerce owner/SME)
date: 2026-07-21
status: DRAFT — proposed backlog, no Jira issues created yet
labeling: "Confirmed = Gulf stated the want in-meeting · Assumed = engineer inference to ratify · Open = needs Gulf/Product decision first"
---

# E-Commerce — Proposed Epic & Child Tickets

> **Scope note:** tangible, buildable work only. Discovery/homework items and non-e-comm
> upstream dependencies are listed separately at the bottom so they aren't mistaken for
> deliverables. Every item cites the transcript line(s) in `E-Commerce-Extraction.md`.
> Grounding is tagged per line: **[Confirmed] / [Assumed] / [Open]**.

---

## 🗂 EPIC — `ECOM-E1` · Gulf B2B E-Commerce Enhancements
**Goal:** turn the B2B storefront from an order-pad into a selling engine + close the operational-visibility gaps for the ~75% of web-order accounts a rep never visits (~11–12% of revenue).
**Success:** measurable e-comm engagement, self-service onboarding, MBO/promo surfacing, and zero "invisible" ordering friction.
**Grounding:** Confirmed direction (ln 1269, 1341, 1350).

Child work grouped into 7 feature areas (A–G) + a dependency/discovery appendix.

---

### 🧩 A. Ordering & Cutoff  `feature: ECOM-F-A`

| ID | Type | Summary | Priority | Grounding | Source |
|---|---|---|---|---|---|
| ECOM-1 | Story | **Modify order until cutoff, with save-time validation** (block save after cutoff, clear message). | 🔴 High | Confirmed | ln 1164,1179 |
| ECOM-2 | Story | **Configurable cutoff windows** off the 40-hr window + enforce routing-after-cutoff (5:00/5:30). | 🔴 High | Confirmed | ln 1167,1182 |
| ECOM-3 | Story | **Prominent next-delivery-DATE display** (actual date, top of home) — fix every-other-week confusion. | 🟠 Med (quick win) | Confirmed | ln 1041,1047,1056 |
| ECOM-4 | Story | **Sold-out → substitution suggestions** driven by a defined similar-item table. | 🟠 Med | Confirmed | ln 1071,1077 |
| ECOM-5 | Story | **Show/hide on-hand quantity toggle** (config per Gulf policy). | 🟡 Low | **Open** (O1) | ln 1089,1101 |

---

### 🧩 B. Notifications & Reminders  `feature: ECOM-F-B`

| ID | Type | Summary | Priority | Grounding | Source |
|---|---|---|---|---|---|
| ECOM-6 | Story | **Rep-homepage "accounts yet to order today" table** + alert to rep (not email) for at-risk accounts. | 🔴 High | Confirmed | ln 963,1191 |
| ECOM-7 | Story | **Escalating order-reminder nudges** (email 9am → SMS noon) configurable per account. | 🟠 Med | Confirmed | ln 1023 |
| ECOM-8 | Story | **Abandoned-cart alert** — validate/extend the existing alert; surface cart value left on table. | 🟠 Med | Confirmed | ln 1191,1197 |
| ECOM-9 | Story | **Notification-preference center** (per-retailer, per-channel) + **SMS opt-in/STOP compliance**. | 🟠 Med | Confirmed | ln 1260 |
| ECOM-10 | Story | **Separate order-confirmation from notifications** (confirmation always sends; nudges toggleable). | 🟡 Low | Confirmed | ln 1260 |
| ECOM-11 | Story | **Retailer ⇄ Gulf in-app chat/messaging** (rebuild the old chat capability). | 🟡 Low | Confirmed | ln 993,1023,1365 |

---

### 🧩 C. Access & Onboarding  `feature: ECOM-F-C`

| ID | Type | Summary | Priority | Grounding | Source |
|---|---|---|---|---|---|
| ECOM-12 | Story | **Self-registration gated by alcohol-license #** + optional license-image upload (doubles as audit proof). | 🔴 High | Confirmed | ln 1218,1224,1254 |
| ECOM-13 | Story | **Bulk-enable e-comm on new-license import** (auto-create accounts → one-click invite). | 🟠 Med | Confirmed | ln 1239 |
| ECOM-14 | Story | **Contact/user management** — reps add contacts in-field; **deactivate-not-delete** (retain history). | 🟠 Med | Confirmed | ln 1212,1232 |

---

### 🧩 D. Merchandising & Suggestive Selling  `feature: ECOM-F-D`  ⚠️ *blocked by DEP-1*

| ID | Type | Summary | Priority | Grounding | Source |
|---|---|---|---|---|---|
| ECOM-15 | Story | **Suggestive-selling engine** at product → cart → checkout (MBO / distribution-drive / internal-mandate driven; auto by eligibility). | 🔴 High | Confirmed (want); **Open** (rules via O2) | ln 1269,1287,1344,1350 |
| ECOM-16 | Story | **QD / upsell nudges** — "buy 2 more to hit the 10-case QD", frequently-bought-together, based-on-previous-purchase. | 🟠 Med | Confirmed | ln 1329 |
| ECOM-17 | Story | **Per-account dynamic banners** by route/eligibility (not one static homepage banner). | 🟠 Med | Confirmed | ln 1272,1284,1287 |
| ECOM-18 | Story | **"Request signage" action on the order** (not truck-delivered; routes to a salesperson). | 🟡 Low | Confirmed | ln 912,918 |
| ECOM-19 | Story | **New-item / mis-order flag at checkout** (AI checks order vs history; highlight new items; batched rep notice). | 🟠 Med | Confirmed | ln 1407,1449,1476 |

---

### 🧩 E. Analytics  `feature: ECOM-F-E`

| ID | Type | Summary | Priority | Grounding | Source |
|---|---|---|---|---|---|
| ECOM-20 | Story | **Short-term e-comm ops metrics** — # signed up, on-time-order %, who orders vs not, accounts dormant 30/60/90d → rep/GM/SVP dashboards. | 🔴 High | Confirmed | ln 1338,1356,1362 |
| ECOM-21 | Story | **Full-funnel web analytics** — traffic, CTR on ads, add-to-cart vs checkout vs abandon, page/product views, bounce, session duration. | 🟠 Med | Confirmed (want); roadmap per Ohanafy | ln 1329,1332,1338 |

---

### 🧩 F. Content / Product Images  `feature: ECOM-F-F`

| ID | Type | Summary | Priority | Grounding | Source |
|---|---|---|---|---|---|
| ECOM-22 | **Bug** | **Retailer-portal search fix** — Deerfish items unsearchable / display as "DF". | 🔴 High (quick win) | Confirmed | ln 1581,1605 |
| ECOM-23 | Story | **Missing-product-image report** (items lacking images). | 🔴 High | Confirmed | ln 1611 |
| ECOM-24 | Story | **Supplier digital-asset feed ingestion** (auto DAM, e.g. Molson Coors) → item records. | 🟠 Med | Confirmed | ln 1560 |
| ECOM-25 | Story | **Supplier-portal asset intake at new-item setup** (supplier uploads images/sales materials; Gulf approves before live) + **stale-asset report** by supplier/brand/SKU. | 🟠 Med | Confirmed | ln 1578,1596,1602 |
| ECOM-26 | Spike | **AI product-image generation** for SKUs with no supplier asset. | 🟡 Low | Assumed | ln 1613 |

---

### 🧩 G. Enablement  `feature: ECOM-F-G`

| ID | Type | Summary | Priority | Grounding | Source |
|---|---|---|---|---|---|
| ECOM-27 | Story | **Guided walkthroughs / tutorials for retailers** ("how do I place an order / see last order"). | 🟠 Med | Confirmed | ln 1374,1377 |
| ECOM-28 | Story | **Order-history invoice PDF download** action (next to reorder). | 🟠 Med | Confirmed | ln 1497,1518 |
| ECOM-29 | Spike | **Multi-language (Spanish) storefront toggle** — feasibility. | 🟡 Low | **Open** (O9) | ln 1260,1266 |
| ECOM-30 | Spike | **Mobile app** scope/commitment (Gulf assumes app + website; Ohanafy uncommitted). | 🟡 Low | **Open** (O8) | ln 1017 |

---

## ⛓ Dependencies (NOT E-Comm's build — track, don't own)

| ID | Blocks | Summary | Owner | Source |
|---|---|---|---|---|
| DEP-1 | ECOM-15/16/17 | **Structured MBO / Promotion object in core** — eligible accounts + start/end dates + supplier link. Today MBOs/promos/incentives are scattered spreadsheets nobody owns cleanly; suggestive-selling cannot surface without this. | Sales/Marketing/Budgeting build | Extraction X1 (ln 198,318,465,1347,1350) |
| DEP-2 | ECOM-4/17 catalog scope | **Item catalog structure & channel-eligibility model** (supplier→line→type→brand; channel flags = storefront visibility). | Core / catalog team | Extraction X2 (ln 759,864,1080) |
| DEP-3 | resale on e-comm | **Resale price book + item-count decision** (30-40 → thousands if inventoried by brand). | Ops/Sales | Extraction X3 (ln 651,681) |

---

## 🔎 Discovery / Homework (needs Gulf input before some tickets can be sized)

| ID | Item | Waiting on | Source |
|---|---|---|---|
| DISC-1 | **MBO/promo/upsell scenario list** + where each should surface (defines ECOM-15 rules). | **Olivia** (committed to send) | O2 · ln 1320,1623 |
| DISC-2 | **POS inventory depth** decision (how granular to inventory POS/resale). | Gulf ops/sales + Marston/Dom/Lewis | O3 · ln 834,879 |
| DISC-3 | **Resale on e-comm** — deferred; revisit when catalog/inventory ready. | Gulf | ln 909 |
| DISC-4 | **Show on-hand quantity?** policy (feeds ECOM-5). | Gulf | O1 · ln 1101 |
| DISC-5 | **Big-supplier asset ownership** (Molson Coors won't use supplier portal). | Ohanafy + Gulf | O5 · ln 1584 |

---

## Priority roll-up (biggest friction first)
1. **ECOM-20** e-comm ops metrics — 11-12% of revenue with *zero* visibility today.
2. **ECOM-12** self-registration — kills the manual "email Mindy" onboarding bottleneck.
3. **ECOM-1/2** modify-until-cutoff — removes Mindy's manual order-editing load.
4. **ECOM-22 / ECOM-23** search bug + missing-image report — "stopping all of us from making money," fast wins.
5. **ECOM-15** suggestive selling — highest business upside, but gated on **DEP-1 + DISC-1**.
6. **ECOM-3** delivery-date display — cheap, high-relief fix for a chronic complaint.

---
*Draft backlog — no Jira issues created. Prepared by Alvaro Sanchez, 2026-07-21. Source: `E-Commerce-Extraction.md`.*
