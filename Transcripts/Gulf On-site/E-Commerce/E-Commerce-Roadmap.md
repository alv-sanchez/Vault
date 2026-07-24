---
title: E-Commerce — Roadmap (from Gulf on-site draft tickets)
source: "E-Commerce-Action-Items.md · E-Commerce-Extraction.md (Jul-15 Gulf on-site)"
prepared_by: Alvaro Sanchez (E-Commerce owner/SME)
date: 2026-07-23
status: DRAFT roadmap — no Jira issues created; sequencing only
labeling: "BUILD = net-new dev · CONFIG = turn-on/setup of existing capability · OTHER = in-flight on another epic · DEP = upstream dependency · DECISION = Gulf input needed"
---

# E-Commerce Roadmap

> Sequenced from the drafted tickets in `E-Commerce-Action-Items.md`. Ordering is by
> **dependency + relief-per-effort**, not calendar dates (none were given). Waves are relative:
> **Now → Next → Then → Later.** Two epics drive it; a parallel prerequisite lane must progress
> before Wave 3 can start.

## Epics
- **Epic A — E-Comm Gulf Enablement & Config** (+ a *Storefront UX & Fixes* component): turn on / configure existing capability and ship the small builds & bug fixes. Waves 1–2. Low risk.
- **Epic B — E-Comm Selling Engine**: net-new merchandising. **Gated** on the promotion/MBO object + Olivia's scenario list. Wave 3.
- **Route out (don't rebuild):** dynamic banners + web analytics → TBM initiative · supplier-portal asset intake → Supplier Portal epic · guided walkthroughs → Enablement · mobile app → its own uncommitted track.

## Critical path
`DEP-1 (MBO/promotion object) → DISC-1 (Olivia's scenarios) → Wave 3 Selling Engine`
Everything in Waves 1–2 is independent of that path and can proceed immediately.

---

## 🟢 WAVE 1 — NOW  ·  *unblocked: config + quick-win fixes*
*Goal: relieve the cheap, visible pain and confirm what already works. Epic A.*

| Ticket | Type | What / why (pulled from) |
|---|---|---|
| ECOM-22 | 🔨 BUILD (bug) | **Retailer-portal search fix** — Deerfish unsearchable / "DF". *"stopping all of us from making money"* (ln 1605). |
| ECOM-3 | 🔨 BUILD | **Next-delivery-DATE display** at top of home — kills the every-other-week confusion (ln 1041). |
| ECOM-23 | 🔨 BUILD | **Missing-product-image report** (ln 1611). |
| ECOM-28 | 🔨 BUILD | **Invoice-PDF download** in order history (ln 1518). |
| ECOM-2 | ⚙️ CONFIG | **Cutoff windows** — already configurable off the 40-hr window (ln 1182). Set Gulf's. |
| ECOM-8 | ⚙️ CONFIG | **Abandoned-cart alert** — exists (ln 1197). Validate + turn on. |
| ECOM-10 | ⚙️ CONFIG | **Confirmation ≠ notification** separation (ln 1260). |
| ECOM-14 | ⚙️ CONFIG | **User mgmt** — deactivate-not-delete (ln 1232). |
| ECOM-24 | ⚙️ CONFIG | **Supplier asset feed ingestion** — exists for big suppliers (ln 1560). Confirm. |

---

## 🔵 WAVE 2 — NEXT  ·  *the top friction relievers*
*Goal: kill the biggest operational bottlenecks — blindness & manual work. Epic A.*

| Ticket | Type | What / why |
|---|---|---|
| ECOM-20 | ⚙️ CONFIG→BUILD | **Short-term ops metrics + dashboards** — #1 friction. 11–12% of revenue, zero visibility (ln 1341). Signups, on-time %, dormant 30/60/90. |
| ECOM-12 | ⚙️ CONFIG | **Self-registration** w/ alcohol-license verification — kills the "email Mindy" bottleneck (ln 1218). |
| ECOM-13 | 🔨 BUILD | **Bulk-enable e-comm on new-license import** (ln 1239). |
| ECOM-1 | 🔨 BUILD | **Modify-order-until-cutoff + validation** — removes Mindy's manual editing (ln 1164). Builds on ECOM-2. |
| ECOM-6 | ⚙️ CONFIG | **Rep-homepage "accounts yet to order" table** + at-risk alerts (ln 963). |
| ECOM-7 | ⚙️ CONFIG | **Escalating nudges** email→SMS (ln 1023). |
| ECOM-9 | 🔨 BUILD | **Notification-preference center + SMS opt-in/STOP compliance** (Twilio) (ln 1260). |
| ECOM-4 | 🔨 BUILD | **Sold-out → substitution suggestions** (needs similar-item table) (ln 1077). |
| ECOM-11 | 🔨 BUILD | **In-app retailer⇄Gulf chat** (ln 1023). |

---

## 🟣 WAVE 3 — THEN  ·  *the Selling Engine — GATED*
*Goal: turn the storefront into a salesperson. Epic B.*
> ⛔ **Cannot start until `DEP-1` (MBO/promotion object) exists and `DISC-1` (Olivia's scenario list) is in hand.** These define the eligibility rules the whole wave runs on.

| Ticket | Type | What / why |
|---|---|---|
| ECOM-15 | 🔨 BUILD | **Suggestive-selling engine** — MBO/drive-driven prompts product→cart→checkout, auto by eligibility (ln 1269, 1350). |
| ECOM-16 | 🔨 BUILD | **QD / upsell nudges** — "buy 2 more for the 10-case QD," frequently-bought-together (ln 1329). |
| ECOM-17 | 🔀 OTHER (TBM) | **Per-account dynamic banners** by route/eligibility — coordinate with the in-flight TBM work (ln 1272). |
| ECOM-19 | 🔨 BUILD | **New-item / mis-order flag at checkout** + batched rep notice (AI vs history) (ln 1449). |
| ECOM-18 | 🔨 BUILD | **Request-signage action on order** (ln 912). |

---

## ⚪ WAVE 4 — LATER / HORIZON  ·  *cross-team + roadmap + spikes*
*Goal: depth & scale once the core is delivering. Mostly other epics.*

| Ticket | Type | What / why |
|---|---|---|
| ECOM-21 | 🔀 OTHER (TBM) | **Full-funnel web analytics** — traffic, CTR, cart drop-off, page/product views (ln 1338). Roadmap. |
| ECOM-25 | 🔀 OTHER (Supplier Portal) | **Supplier-portal asset intake** at new-item setup + stale-asset report (ln 1578). |
| ECOM-27 | 🔀 OTHER (Enablement) | **Guided walkthroughs / tutorials** for retailers (ln 1377). |
| ECOM-26 | 🧭 SPIKE | **AI product-image generation** for SKUs w/o assets (ln 1613). |
| ECOM-29 | 🧭 SPIKE | **Multi-language (Spanish)** storefront toggle (ln 1266). |
| ECOM-30 | 🧭 DECISION | **Mobile app** scope/commitment — Gulf assumes app+web; uncommitted (ln 1017). |
| ECOM-5 | 🧭 DECISION | **Show/hide on-hand quantity** — config once DISC-4 decided (ln 1101). |

---

## 🔗 PARALLEL LANE — prerequisites (must progress for Wave 3)
*Not E-Comm's to build, but E-Comm is blocked without them. Track weekly.*

| Item | Owner | Feeds |
|---|---|---|
| **DEP-1 — MBO / Promotion object in core** (eligible accounts + start/end dates + supplier link). Today: scattered spreadsheets, nobody owns cleanly. | Sales/Marketing/Budgeting | Wave 3 (ECOM-15/16/17) |
| **DISC-1 — Olivia's MBO/promo/upsell scenario list** (she committed to send). | Olivia (Gulf) | Wave 3 rules |
| **DISC-4 — show-on-hand-qty policy** | Gulf | ECOM-5 |
| **DISC-2/3 — POS inventory depth · resale-on-ecom** | Gulf ops/sales | future catalog scope |
| **DEP-2/3 — catalog structure + resale price book** | Core / Ops | catalog visibility & scale |

---

## Sequencing summary
- **Now (Wave 1):** 4 quick-win builds + 5 config turn-ons — visible relief, no blockers.
- **Next (Wave 2):** the 6 biggest friction relievers — visibility, self-service, self-editing.
- **Then (Wave 3):** the selling engine — starts only when the MBO object + Olivia's list land.
- **Later (Wave 4):** cross-team/roadmap/spikes; route to existing epics rather than rebuild.
- **Always:** push the parallel prerequisite lane so Wave 3 isn't stalled the day Waves 1–2 finish.

---
*Draft roadmap — no Jira issues created. Prepared by Alvaro Sanchez, 2026-07-23. Companion: `E-Commerce-Action-Items.md`, `E-Commerce-Takeaways.html`.*
