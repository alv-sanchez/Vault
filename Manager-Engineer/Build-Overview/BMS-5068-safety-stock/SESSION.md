# 📦 Session Kickoff — Safety Stock / DOH Order Sizing (Epic BMS-5068)

> Paste this whole file into a fresh Claude Code session as the first message,
> or tell the session: "Read this file first." It is the context seed.
> Last updated: 2026-07-01.

## Scope of THIS session
Epic BMS-5068 (story **BMS-4217** · DOH order-sizing). Do not touch other tickets.

## Where the work lives
- **Branch:** `feat/safety-stock-doh-sizing-bms-4217` (pushed, in sync with origin)
- **Dev org:** `ohfy-val-4217`
- **Docs (this folder):** `overview.html`, `safety-stock-explained.html`
- **OpenSpec change:** `openspec/changes/add-doh-replenishment-order-sizing/` (`proposal.md`, `tasks.md`, `specs/replenishment-order-sizing/spec.md`)
- **Product doc:** `docs/product/wms/replenishment-task-management/usage.md`

## What it is (one line)
Make the inventory buffer a **setting**: raise a SKU/supplier's **Days-of-Inventory (DOH) target** and the **recommended replenishment order quantity rises to match** — no code change.

## What's built
- ✅ **Backend automation, flag-gated. NO screen** — this is the math behind ordering, not a UI.
- Lives in **OHFY-WMS replenishment** (not the Inventory lock stream).

## Code (OHFY-WMS)
- **`services/replenishmentOrderSizing/S_ReplenishmentOrderSizing.cls`** — the DOH-driven order-sizing logic (core of this ticket).
- `batchJobs/B_WaterfallReplenishment.cls` + `executables/waterfallReplenishment/E_WaterfallReplenishment.cls` — replenishment run.
- `executables/replenishment/E_ReplenishmentTask.cls`, `controllers/replenishment/ReplenishmentTaskController.cls`, `DTOs/replenishment/*` — surrounding replenishment task surface.
- **Flag-gated** — verify the exact feature flag (likely a `Service_Configuration__mdt` entry) before demoing; off = old static sizing, on = DOH-driven.

## State / caveats (honest)
- **No screen to click** — demo is a **data/backend walkthrough**: show a DOH-target change → recommended order qty changes (via query or a small Apex harness).
- Confirm the feature flag name + that it's ON in `ohfy-val-4217`.

## ✅ Next steps
1. Confirm the flag + a clean **data demo path** (DOH target ↑ → order qty ↑) in `ohfy-val-4217`.
2. Apex tests (≥90% on touched files), `/code-review`, then `/end-ticket` → PR when Low-risk.
3. Optional: a tiny query/apex snippet in this folder so the backend effect is demoable without a UI.

## ⛔ Blockers / notes
- No hard blocker. Main risk is **demoability** — it's automation-only, so it needs a data story, not a screen.
- If asked "where's the UI?": there isn't one by design; the replenishment task surface consumes the sizing.
