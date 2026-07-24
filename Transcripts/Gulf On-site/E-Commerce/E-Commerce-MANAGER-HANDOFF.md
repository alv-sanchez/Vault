---
type: manager-handoff
topic: E-Commerce (Gulf B2B storefront)
audience: manager / product
prepared_by: Alvaro Sanchez (E-Commerce owner/SME)
date: 2026-07-21
source: "Gulf on-site, Jul 15 (Sales Day 1) — see E-Commerce-Extraction.md"
status: discovery only — no epic/tickets created yet
companion_docs: [E-Commerce-Extraction.md, E-Commerce-Action-Items.md, E-Commerce-Takeaways.html]
---

# E-Commerce — Manager Handoff (one page)

## The ask in one line
Turn Gulf's B2B storefront from an **order-pad into a selling engine**, and light up the **operational blind spots** on a channel that is **11–12% of revenue** where **~75% of accounts never see a rep** and Gulf has **zero behavioral visibility**. Olivia: *"this has got to be our salesperson."*

## The load-bearing architecture claim (validate this)
Ohanafy: items / pricing / promotions / MBOs **surface on the storefront automatically by eligibility (account + start/end date)** from the core env — the storefront is just a lens; nothing to manage in a separate e-comm backend. **Every "can it do X" answer rests on this.**

## 🚩 The dependency that can't be lost — `DEP-1`
Suggestive selling presupposes a **structured MBO/Promotion object in core** (eligible accounts + dates + supplier link). Today MBOs/promos/incentives are **scattered spreadsheets nobody owns cleanly** — Olivia *"doesn't do the MBOs or track incentives."* This is **upstream of E-Comm (sales/marketing/budgeting build)**. Don't let it land later as "e-comm failed to deliver upsell."

## Biggest friction → what relieves it (ranked by relief-per-effort)
| # | Friction | Fix | Ticket | Blocked? |
|---|---|---|---|---|
| 1 | Flying blind on a 12%-of-revenue channel | Short-term ops metrics + dashboards | `ECOM-20` | No — build now |
| 2 | New logins = manual "email Mindy" | Self-registration w/ license verification | `ECOM-12/13` | No |
| 3 | Staff hand-edit retailer orders | Modify-until-cutoff + config windows | `ECOM-1/2` | No |
| 4 | Broken search + missing images lose sales | Search bug fix + missing-image report | `ECOM-22/23` | No — quick wins |
| 5 | Storefront can't push MBOs/drives | Suggestive-selling engine + dynamic banners | `ECOM-15/16/17` | **Yes — DEP-1 + DISC-1** |
| 6 | Retailers misread delivery timing | Prominent next-delivery-date display | `ECOM-3` | No — cheap win |

## Proposed structure
**Epic `ECOM-E1`** → 30 child tickets across 7 areas (A Ordering·B Notifications·C Access·D Merchandising·E Analytics·F Content/Images·G Enablement) + `DEP-1/2/3` dependencies + `DISC-1…5` discovery. Full tree: `E-Commerce-Action-Items.md`.

## Open decisions / homework (route these)
- **DISC-1 — Olivia to send** the MBO/promo/upsell scenario list (defines `ECOM-15` rules). *She committed to it.*
- **DISC-2** POS inventory depth · **DISC-3** resale-on-ecom (deferred) · **DISC-4** show on-hand qty? · **DISC-5** big-supplier asset ownership.
- **Open:** mobile-app commitment (`ECOM-30`), multi-language (`ECOM-29`).

## Alignments to hold
- Resale/POS is **out of the storefront for now** (decided live) — keep with sales team; signage *requests* wanted.
- Mobile app **uncommitted** (Gulf assumes app+web) → roadmap.
- Full marketing-style analytics = **roadmap**; deliver ops metrics first.
- Order confirmation **≠** notification — separate for SMS opt-in/STOP compliance.

---
*Discovery — no Jira issues created. Prepared by Alvaro Sanchez, 2026-07-21.*
